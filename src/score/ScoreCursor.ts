/** Position of the cursor band in CSS pixels, relative to the score container's content. */
export interface CursorRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/** Space kept between the cursor and the edge of the score container when it scrolls. */
const SCROLL_MARGIN_PX = 24;

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

  constructor(container: HTMLElement) {
    this.#container = container;
    this.#element = document.createElement('div');
    this.#element.className = 'score-cursor';
    this.#element.hidden = true;
    this.#element.setAttribute('aria-hidden', 'true');
    container.append(this.#element);
  }

  place(rect: CursorRect): void {
    if (!this.#element.hidden && this.#rect && sameRect(this.#rect, rect)) return;
    this.#rect = rect;
    const style = this.#element.style;
    style.left = `${rect.left}px`;
    style.top = `${rect.top}px`;
    style.width = `${rect.width}px`;
    style.height = `${rect.height}px`;
    this.#element.hidden = false;
    this.#keepInView(rect);
  }

  hide(): void {
    this.#element.hidden = true;
  }

  /** Scrolls the container when the cursor leaves its visible area: the cursor's system to the top. */
  #keepInView(rect: CursorRect): void {
    const container = this.#container;
    const top = container.scrollTop;
    const left = container.scrollLeft;
    const outVertically =
      rect.top < top || rect.top + rect.height > top + container.clientHeight - SCROLL_MARGIN_PX;
    const outHorizontally =
      rect.left < left || rect.left + rect.width > left + container.clientWidth - SCROLL_MARGIN_PX;
    if (!outVertically && !outHorizontally) return;
    container.scrollTo({
      top: outVertically ? Math.max(rect.top - SCROLL_MARGIN_PX, 0) : top,
      left: outHorizontally ? Math.max(rect.left - container.clientWidth / 3, 0) : left,
      behavior: 'smooth',
    });
  }
}

function sameRect(a: CursorRect, b: CursorRect): boolean {
  return a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height;
}
