import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { buildTimeline } from '../../timeline/buildTimeline';
import type { Timeline } from '../../timeline/types';
import { MeasureMarks, ScoreCursor } from '../ScoreCursor';
import type { CursorRect, ReadingArea } from '../ScoreCursor';
import { cursorBoxAt, measureAtPoint } from '../scoreLayout';
import type { MeasureLayout, ScoreLayout } from '../scoreLayout';
import { extractTimelineInput } from './extractTimelineInput';
import { readScoreLayout } from './readScoreLayout';

/**
 * How the score is laid out: systems under each other ('wrapped'), or the whole piece on one
 * horizontal line that scrolls sideways ('line').
 */
export type ScoreLayoutMode = 'wrapped' | 'line';

/** OSMD draws 10 CSS pixels per unit at zoom 1. */
const PIXELS_PER_UNIT = 10;
/** Width of the cursor band and how far it reaches above and below the staves, in units. */
const CURSOR_WIDTH_UNITS = 3.2;
const CURSOR_OVERHANG_UNITS = 1.5;
/** Page margins in units (OSMD's default of 5 costs a phone a quarter of its width). */
const PAGE_MARGIN_UNITS = 2;
/** A line of music is not drawn smaller than this to fit the height: pocket-score size. */
const MIN_LINE_ZOOM = 0.6;
/** A fitted zoom within this fraction of the current one does not cause another render. */
const FIT_TOLERANCE = 0.03;

interface CursorTarget {
  readonly sourceIndex: number;
  readonly beatInMeasure: number;
}

/**
 * The score adapter around OpenSheetMusicDisplay: loads and renders a MusicXML file, produces its
 * timeline, places the cursor, marks measures and reports clicks on measures. Nothing outside
 * score/ knows about OSMD.
 */
export class OsmdScore {
  readonly #container: HTMLElement;
  readonly #osmd: OpenSheetMusicDisplay;
  readonly #cursor: ScoreCursor;
  readonly #marks: MeasureMarks;
  #layout: ScoreLayout = [];
  #mode: ScoreLayoutMode = 'wrapped';
  #scale = 1;
  #source: Blob | undefined;
  #cursorTarget: CursorTarget | undefined;
  #markedMeasures: readonly number[] = [];
  #measureClickListener: ((sourceIndex: number) => void) | undefined;
  #fitPending = false;
  /** OSMD's drawer exists only after the first render. */
  #rendered = false;

  constructor(container: HTMLElement) {
    this.#container = container;
    this.#cursor = new ScoreCursor(container);
    this.#marks = new MeasureMarks(container);
    this.#osmd = new OpenSheetMusicDisplay(container, {
      backend: 'svg',
      autoResize: true,
      disableCursor: true,
      drawPartNames: false,
      drawTitle: false,
      drawSubtitle: false,
      drawComposer: false,
      drawLyricist: false,
      pageFormat: 'Endless',
      // Also runs after the re-renders OSMD starts itself when the container's width changes.
      onRender: () => {
        this.#rendered = true;
        this.#layout = readScoreLayout(this.#osmd.GraphicSheet);
        this.#cursor.redrawn();
        this.#placeCursor();
        this.#placeMarks();
        this.#fitLineToHeight();
      },
    });
    const rules = this.#osmd.EngravingRules;
    rules.PageLeftMargin = PAGE_MARGIN_UNITS;
    rules.PageRightMargin = PAGE_MARGIN_UNITS;
    rules.PageTopMargin = PAGE_MARGIN_UNITS;
    rules.PageBottomMargin = PAGE_MARGIN_UNITS;
    // The default limit exists for the canvas backend; with SVG a long piece stays on one line.
    rules.SheetMaximumWidth = Number.MAX_SAFE_INTEGER;

    container.addEventListener('click', (event) => {
      this.#handleClick(event);
    });
    // OSMD re-renders when the width changes; a line of music must also follow the height.
    new ResizeObserver(() => {
      this.#fitLineToHeight();
    }).observe(container);
  }

  /**
   * Loads a MusicXML file (a picked file, also MXL), renders it in the given layout and returns
   * its timeline. Rejects with OSMD's reason if the file cannot be read.
   */
  async load(source: Blob, mode: ScoreLayoutMode): Promise<Timeline> {
    this.#cursorTarget = undefined;
    this.#markedMeasures = [];
    this.#cursor.hide();
    this.#marks.show([]);
    this.#source = source;
    this.#mode = mode;
    this.#applyModeAndZoom();
    await this.#osmd.load(source);
    const timeline = buildTimeline(extractTimelineInput(this.#osmd.Sheet).input);
    this.#osmd.render();
    return timeline;
  }

  /**
   * Switches between systems under each other and one line. OSMD only takes this before a load,
   * so the loaded file is read again (the timeline does not change).
   */
  async setLayoutMode(mode: ScoreLayoutMode): Promise<void> {
    if (mode === this.#mode) return;
    this.#mode = mode;
    const source = this.#source;
    if (!source) return;
    this.#applyModeAndZoom();
    try {
      await this.#osmd.load(source);
    } catch (error) {
      // Another file was opened meanwhile: that load renders.
      if (error instanceof Error && error.name === 'AbortError') return;
      throw error;
    }
    this.#osmd.render();
  }

  /** The reader's size setting: 1 is print size. A line of music may be drawn smaller to fit. */
  setScale(scale: number): void {
    if (scale === this.#scale) return;
    this.#scale = scale;
    this.#osmd.Zoom = scale;
    if (this.#source) this.#osmd.render();
  }

  get title(): string {
    return this.#osmd.Sheet.TitleString;
  }

  get composer(): string {
    return this.#osmd.Sheet.ComposerString;
  }

  /** Places the cursor at a beat within a measure of the score (source index, not playback order). */
  showCursorAt(sourceIndex: number, beatInMeasure: number): void {
    this.#cursorTarget = { sourceIndex, beatInMeasure };
    this.#placeCursor();
  }

  /** Marks these measures (source indices), e.g. a loop; an empty list clears the marks. */
  markMeasures(sourceIndices: readonly number[]): void {
    this.#markedMeasures = sourceIndices;
    this.#placeMarks();
  }

  /** Calls the listener with the source index of a measure the user clicks or taps. */
  onMeasureClick(listener: (sourceIndex: number) => void): void {
    this.#measureClickListener = listener;
  }

  #applyModeAndZoom(): void {
    this.#osmd.setOptions({ renderSingleHorizontalStaffline: this.#mode === 'line' });
    this.#osmd.Zoom = this.#scale;
  }

  /**
   * On one line, draws the music as large as the height allows, up to the reader's size setting:
   * a line of music must not need vertical scrolling. Renders again when the zoom changes.
   */
  #fitLineToHeight(): void {
    const page = this.#page();
    if (this.#mode !== 'line' || !page || this.#fitPending) return;
    const zoom = this.#osmd.Zoom;
    const naturalHeight = page.offsetHeight / zoom;
    const style = getComputedStyle(this.#container);
    const available =
      this.#container.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    if (naturalHeight <= 0 || available <= 0) return;
    const fitted = Math.max(Math.min(available / naturalHeight, this.#scale), MIN_LINE_ZOOM);
    if (Math.abs(fitted - zoom) / zoom < FIT_TOLERANCE) return;
    this.#fitPending = true;
    requestAnimationFrame(() => {
      this.#fitPending = false;
      if (this.#mode !== 'line') return;
      this.#osmd.Zoom = fitted;
      this.#osmd.render();
    });
  }

  #placeCursor(): void {
    const target = this.#cursorTarget;
    const measure = target && this.#layout[target.sourceIndex];
    const box = target && cursorBoxAt(this.#layout, target.sourceIndex, target.beatInMeasure);
    if (!target || !measure || !box || !this.#page()) {
      this.#cursor.hide();
      return;
    }
    const top = box.top - CURSOR_OVERHANG_UNITS;
    const bottom = box.bottom + CURSOR_OVERHANG_UNITS;
    this.#cursor.place(
      this.#toPixels(box.x - CURSOR_WIDTH_UNITS / 2, top, box.x + CURSOR_WIDTH_UNITS / 2, bottom),
      this.#readingArea(target.sourceIndex, measure),
    );
  }

  /**
   * The current measure and, if it is drawn on the same system, the next one: with the notes above
   * and below the staves when that fits in the view, else the staves.
   */
  #readingArea(sourceIndex: number, measure: MeasureLayout): ReadingArea {
    const next = this.#layout[sourceIndex + 1];
    const sameSystem = next?.top === measure.top ? next : undefined;
    const right = sameSystem?.right ?? measure.right;
    const extentTop = Math.min(measure.extentTop, sameSystem?.extentTop ?? Infinity);
    const extentBottom = Math.max(measure.extentBottom, sameSystem?.extentBottom ?? -Infinity);
    const fits = (extentBottom - extentTop) * this.#unit() <= this.#container.clientHeight;
    const rect = this.#toPixels(
      measure.left,
      fits ? extentTop : measure.top - CURSOR_OVERHANG_UNITS,
      right,
      fits ? extentBottom : measure.bottom + CURSOR_OVERHANG_UNITS,
    );
    return {
      left: rect.left,
      right: rect.left + rect.width,
      top: rect.top,
      bottom: rect.top + rect.height,
    };
  }

  #placeMarks(): void {
    const rects = this.#markedMeasures.flatMap((sourceIndex) => {
      const measure = this.#layout[sourceIndex];
      if (!measure || !this.#page()) return [];
      return [
        this.#toPixels(
          measure.left,
          measure.top - CURSOR_OVERHANG_UNITS,
          measure.right,
          measure.bottom + CURSOR_OVERHANG_UNITS,
        ),
      ];
    });
    this.#marks.show(rects);
  }

  /** A box in score units as a rectangle in the container's content, in CSS pixels. */
  #toPixels(left: number, top: number, right: number, bottom: number): CursorRect {
    const unit = this.#unit();
    const page = this.#page();
    const offset = page ? this.#offsetInContainer(page) : { left: 0, top: 0 };
    return {
      left: offset.left + left * unit,
      top: offset.top + top * unit,
      width: (right - left) * unit,
      height: (bottom - top) * unit,
    };
  }

  #handleClick(event: MouseEvent): void {
    const page = this.#page();
    if (!page || !this.#measureClickListener) return;
    const bounds = page.getBoundingClientRect();
    const unit = this.#unit();
    const sourceIndex = measureAtPoint(
      this.#layout,
      (event.clientX - bounds.left) / unit,
      (event.clientY - bounds.top) / unit,
    );
    if (sourceIndex !== undefined) this.#measureClickListener(sourceIndex);
  }

  /** The element OSMD draws the (single, endless) page into. */
  #page(): HTMLElement | undefined {
    return this.#rendered ? this.#osmd.Drawer.Backends[0]?.getInnerElement() : undefined;
  }

  #unit(): number {
    return PIXELS_PER_UNIT * this.#osmd.Zoom;
  }

  /** Position of an element inside the (scrollable, positioned) container, in CSS pixels. */
  #offsetInContainer(element: HTMLElement): { left: number; top: number } {
    const container = this.#container;
    const outer = container.getBoundingClientRect();
    const inner = element.getBoundingClientRect();
    return {
      left: inner.left - outer.left - container.clientLeft + container.scrollLeft,
      top: inner.top - outer.top - container.clientTop + container.scrollTop,
    };
  }
}
