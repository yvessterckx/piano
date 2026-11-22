import type { Hand, NoteSpelling } from '../timeline/types';
import { keysInRange } from './keys';
import type { KeyboardRange } from './keys';
import { keyName, spelledName } from './noteNames';
import type { NoteNaming } from './noteNames';

/** A key to light up: which hand presses it and how the note is written. */
export interface ActiveKey {
  readonly midi: number;
  readonly hand: Hand;
  readonly spelling: NoteSpelling;
}

interface KeyElements {
  readonly key: HTMLElement;
  readonly label: HTMLElement;
}

/**
 * The on-screen keyboard. Knows nothing about scores: it shows the keys it is given, colored by
 * hand, with the note name on each lit key and on every C for orientation.
 */
export class Keyboard {
  readonly #scroller: HTMLElement;
  readonly #keys = new Map<number, KeyElements>();
  #naming: NoteNaming;
  #active = new Map<number, ActiveKey>();

  /** @param scroller element that scrolls horizontally when the keyboard is wider than the screen */
  constructor(scroller: HTMLElement, range: KeyboardRange, naming: NoteNaming) {
    this.#scroller = scroller;
    this.#naming = naming;
    const keys = keysInRange(range);
    const board = document.createElement('div');
    board.className = 'keyboard';
    board.style.setProperty('--white-keys', String(keys.filter((key) => !key.black).length));

    for (const { midi, black, whiteIndex } of keys) {
      const key = document.createElement('div');
      key.className = black ? 'key key-black' : 'key key-white';
      key.style.setProperty('--index', String(whiteIndex));
      const label = document.createElement('span');
      label.className = 'key-label';
      key.append(label);
      board.append(key);
      this.#keys.set(midi, { key, label });
    }
    scroller.replaceChildren(board);
    for (const midi of this.#keys.keys()) this.#renderKey(midi);
  }

  setNaming(naming: NoteNaming): void {
    this.#naming = naming;
    for (const midi of this.#keys.keys()) this.#renderKey(midi);
  }

  /** Lights up exactly these keys. Only keys that change are touched. */
  show(active: readonly ActiveKey[]): void {
    const next = new Map(active.map((key) => [key.midi, key]));
    const changed = new Set<number>();
    for (const [midi, key] of this.#active) {
      if (next.get(midi)?.hand !== key.hand) changed.add(midi);
    }
    for (const [midi, key] of next) {
      const previous = this.#active.get(midi);
      if (previous?.hand !== key.hand || previous.spelling !== key.spelling) changed.add(midi);
    }
    this.#active = next;
    for (const midi of changed) this.#renderKey(midi);
    if (changed.size > 0) this.#keepActiveKeysVisible();
  }

  #renderKey(midi: number): void {
    const elements = this.#keys.get(midi);
    if (!elements) return;
    const active = this.#active.get(midi);
    elements.key.classList.toggle('key-left', active?.hand === 'left');
    elements.key.classList.toggle('key-right', active?.hand === 'right');
    elements.label.textContent = active
      ? spelledName(active.spelling, this.#naming)
      : midi % 12 === 0
        ? keyName(midi, this.#naming)
        : '';
  }

  /** On a narrow screen, scrolls the keyboard so the lit keys are in view. */
  #keepActiveKeysVisible(): void {
    const scroller = this.#scroller;
    if (scroller.scrollWidth <= scroller.clientWidth || this.#active.size === 0) return;
    const elements = [...this.#active.keys()].flatMap((midi) => this.#keys.get(midi)?.key ?? []);
    const left = Math.min(...elements.map((element) => element.offsetLeft));
    const right = Math.max(...elements.map((element) => element.offsetLeft + element.offsetWidth));
    const visibleLeft = scroller.scrollLeft;
    const visibleRight = visibleLeft + scroller.clientWidth;
    if (left >= visibleLeft && right <= visibleRight) return;
    scroller.scrollTo({ left: (left + right) / 2 - scroller.clientWidth / 2, behavior: 'smooth' });
  }
}
