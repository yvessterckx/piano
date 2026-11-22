/** Position of the cursor band in CSS pixels, relative to the score container. */
export interface CursorRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/**
 * The cursor band drawn over the score: an element of our own, so it looks the same with any
 * renderer and survives re-renders. Its color is multiplied with the score, so the notes under
 * it stay black (see .score-cursor in style.css).
 */
export class ScoreCursor {
  readonly #element: HTMLElement;

  constructor(container: HTMLElement) {
    this.#element = document.createElement('div');
    this.#element.className = 'score-cursor';
    this.#element.hidden = true;
    this.#element.setAttribute('aria-hidden', 'true');
    container.append(this.#element);
  }

  place(rect: CursorRect): void {
    const style = this.#element.style;
    style.left = `${rect.left}px`;
    style.top = `${rect.top}px`;
    style.width = `${rect.width}px`;
    style.height = `${rect.height}px`;
    this.#element.hidden = false;
    this.#element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  hide(): void {
    this.#element.hidden = true;
  }
}
