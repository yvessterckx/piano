/** A rectangle in CSS pixels, relative to the score container's content. */
export interface CursorRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/** What the reader needs to see around the cursor, in the same coordinates as CursorRect. */
export interface ReadingArea {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

/** The visible part of the score container: its scroll position and size. */
export interface Viewport {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/** Space kept between the reading area and the edge of the score container when it scrolls. */
const SCROLL_MARGIN_PX = 16;

/**
 * Where to scroll the score so the reader can keep reading ahead, or undefined to stay.
 *
 * - Vertically, when the cursor enters another system, that system goes to the top, so the next
 *   systems are visible below it. This happens when the eye jumps to the new line anyway. It also
 *   scrolls when the reading area is out of view (after a seek).
 * - Horizontally (one line of music), when the reading area (the current and the next measure) is
 *   not fully visible, the current measure goes to the left edge. The music then stays still until
 *   the next step, so the reader reads still notes with at least one measure ahead in view.
 */
export function scrollToKeepReading(
  area: ReadingArea,
  newSystem: boolean,
  view: Viewport,
): { top: number; left: number } | undefined {
  const outVertically = area.top < view.top || area.bottom > view.top + view.height;
  const top = newSystem || outVertically ? Math.max(area.top - SCROLL_MARGIN_PX, 0) : view.top;
  const outHorizontally =
    area.left < view.left || area.right > view.left + view.width - SCROLL_MARGIN_PX;
  const left = outHorizontally ? Math.max(area.left - SCROLL_MARGIN_PX, 0) : view.left;
  if (Math.abs(top - view.top) < 1 && Math.abs(left - view.left) < 1) return undefined;
  return { top, left };
}

/**
 * The cursor band drawn over the score: an element of our own, so it looks the same with any
 * renderer and survives re-renders. Its color is multiplied with the score, so the notes under
 * it stay black (see .score-cursor in style.css). It scrolls only the score container, never the
 * page, so the keyboard stays where it is.
 */
export class ScoreCursor {
  readonly #container: HTMLElement;
  readonly #element: HTMLElement;
  #rect: CursorRect | undefined;
  /** After a redraw the view jumps to the cursor: a smooth scroll is cut off by a rotation. */
  #jump = false;

  constructor(container: HTMLElement) {
    this.#container = container;
    this.#element = document.createElement('div');
    this.#element.className = 'score-cursor';
    this.#element.hidden = true;
    this.#element.setAttribute('aria-hidden', 'true');
    container.append(this.#element);
  }

  /** Draws the cursor and scrolls the container so the reading area stays in view. */
  place(rect: CursorRect, reading: ReadingArea): void {
    const previous = this.#element.hidden ? undefined : this.#rect;
    if (previous && sameRect(previous, rect)) return;
    this.#rect = rect;
    const style = this.#element.style;
    style.left = `${rect.left}px`;
    style.top = `${rect.top}px`;
    style.width = `${rect.width}px`;
    style.height = `${rect.height}px`;
    this.#element.hidden = false;

    const container = this.#container;
    const target = scrollToKeepReading(reading, previous?.top !== rect.top, {
      left: container.scrollLeft,
      top: container.scrollTop,
      width: container.clientWidth,
      height: container.clientHeight,
    });
    if (target) container.scrollTo({ ...target, behavior: this.#jump ? 'instant' : 'smooth' });
    this.#jump = false;
  }

  hide(): void {
    this.#element.hidden = true;
  }

  /**
   * The score was drawn again (new layout, rotation, zoom), which can also reset the scroll
   * position: the next place() brings the cursor's system into view as if it were new.
   */
  redrawn(): void {
    this.#rect = undefined;
    this.#jump = true;
  }
}

/** Translucent boxes over measures, e.g. the measures of a loop. */
export class MeasureMarks {
  readonly #container: HTMLElement;
  #elements: HTMLElement[] = [];

  constructor(container: HTMLElement) {
    this.#container = container;
  }

  show(rects: readonly CursorRect[]): void {
    for (const element of this.#elements) element.remove();
    this.#elements = rects.map((rect) => {
      const element = document.createElement('div');
      element.className = 'measure-mark';
      element.setAttribute('aria-hidden', 'true');
      Object.assign(element.style, {
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
      });
      return element;
    });
    this.#container.append(...this.#elements);
  }
}

function sameRect(a: CursorRect, b: CursorRect): boolean {
  return a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height;
}
