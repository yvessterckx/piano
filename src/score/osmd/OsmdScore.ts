import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { buildTimeline } from '../../timeline/buildTimeline';
import type { Timeline } from '../../timeline/types';
import { ScoreCursor } from '../ScoreCursor';
import { cursorBoxAt, measureAtPoint } from '../scoreLayout';
import type { ScoreLayout } from '../scoreLayout';
import { extractTimelineInput } from './extractTimelineInput';
import { readScoreLayout } from './readScoreLayout';

/** OSMD draws 10 CSS pixels per unit at zoom 1. */
const PIXELS_PER_UNIT = 10;
/** Width of the cursor band and how far it reaches above and below the staves, in units. */
const CURSOR_WIDTH_UNITS = 3.2;
const CURSOR_OVERHANG_UNITS = 1.5;

interface CursorTarget {
  readonly sourceIndex: number;
  readonly beatInMeasure: number;
}

/**
 * The score adapter around OpenSheetMusicDisplay: loads and renders a MusicXML file, produces its
 * timeline, places the cursor and reports clicks on measures. Nothing outside score/ knows about
 * OSMD.
 */
export class OsmdScore {
  readonly #container: HTMLElement;
  readonly #osmd: OpenSheetMusicDisplay;
  readonly #cursor: ScoreCursor;
  #layout: ScoreLayout = [];
  #cursorTarget: CursorTarget | undefined;
  #measureClickListener: ((sourceIndex: number) => void) | undefined;

  constructor(container: HTMLElement) {
    this.#container = container;
    this.#cursor = new ScoreCursor(container);
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
        this.#layout = readScoreLayout(this.#osmd.GraphicSheet);
        this.#placeCursor();
      },
    });
    container.addEventListener('click', (event) => {
      this.#handleClick(event);
    });
  }

  /**
   * Loads a MusicXML file (text) or a picked file (Blob, also MXL), renders it and returns its
   * timeline. Rejects with OSMD's reason if the file cannot be read.
   */
  async load(source: string | Blob): Promise<Timeline> {
    this.#cursorTarget = undefined;
    this.#cursor.hide();
    await this.#osmd.load(source);
    const timeline = buildTimeline(extractTimelineInput(this.#osmd.Sheet).input);
    this.#osmd.render();
    return timeline;
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

  /** Calls the listener with the source index of a measure the user clicks or taps. */
  onMeasureClick(listener: (sourceIndex: number) => void): void {
    this.#measureClickListener = listener;
  }

  #placeCursor(): void {
    const target = this.#cursorTarget;
    const box = target && cursorBoxAt(this.#layout, target.sourceIndex, target.beatInMeasure);
    const page = this.#page();
    if (!box || !page) {
      this.#cursor.hide();
      return;
    }

    const unit = this.#unit();
    const { left: pageLeft, top: pageTop } = this.#offsetInContainer(page);
    this.#cursor.place({
      left: pageLeft + (box.x - CURSOR_WIDTH_UNITS / 2) * unit,
      top: pageTop + (box.top - CURSOR_OVERHANG_UNITS) * unit,
      width: CURSOR_WIDTH_UNITS * unit,
      height: (box.bottom - box.top + 2 * CURSOR_OVERHANG_UNITS) * unit,
    });
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
    return this.#osmd.Drawer.Backends[0]?.getInnerElement();
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
