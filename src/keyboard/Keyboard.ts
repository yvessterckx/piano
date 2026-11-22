import type { Hand, NoteSpelling } from '../timeline/types';
import { keysInRange } from './keys';
import type { KeyboardRange } from './keys';
import { spreadLabels } from './nameLabels';
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

/** Narrower white keys than this cannot hold a note name: the names go in a row above them. */
const MIN_LABELED_KEY_PX = 18;
const NAME_GAP_PX = 3;
const MIDDLE_C = 60;

/**
 * The on-screen keyboard, fitted to the width of its container (no scrolling, so the keys never
 * move). Knows nothing about scores: it shows the keys it is given, colored by hand. Each lit key
 * carries its note name, and every C its name for orientation; when the keys are too narrow for
 * that (a phone), the names of the lit keys appear in a row above them instead. Middle C is
 * marked either way.
 */
export class Keyboard {
  readonly #container: HTMLElement;
  readonly #board: HTMLElement;
  readonly #names: HTMLElement;
  readonly #whiteKeys: number;
  readonly #keys = new Map<number, KeyElements>();
  #naming: NoteNaming;
  #active = new Map<number, ActiveKey>();
  #compact = false;

  constructor(container: HTMLElement, range: KeyboardRange, naming: NoteNaming) {
    this.#container = container;
    this.#naming = naming;
    const keys = keysInRange(range);
    this.#whiteKeys = keys.filter((key) => !key.black).length;

    this.#names = document.createElement('div');
    this.#names.className = 'keyboard-names';
    this.#names.setAttribute('aria-hidden', 'true');
    this.#board = document.createElement('div');
    this.#board.className = 'keyboard';
    this.#board.style.setProperty('--white-keys', String(this.#whiteKeys));

    for (const { midi, black, whiteIndex } of keys) {
      const key = document.createElement('div');
      key.className = black ? 'key key-black' : 'key key-white';
      if (midi === MIDDLE_C) key.classList.add('key-middle-c');
      key.style.setProperty('--index', String(whiteIndex));
      const label = document.createElement('span');
      label.className = 'key-label';
      key.append(label);
      this.#board.append(key);
      this.#keys.set(midi, { key, label });
    }
    container.replaceChildren(this.#names, this.#board);
    for (const midi of this.#keys.keys()) this.#renderKey(midi);

    new ResizeObserver(() => {
      this.#fitToWidth();
    }).observe(this.#board);
  }

  setNaming(naming: NoteNaming): void {
    this.#naming = naming;
    for (const midi of this.#keys.keys()) this.#renderKey(midi);
    this.#renderNames();
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
    if (changed.size > 0) this.#renderNames();
  }

  /** Switches between names on the keys and names above them, by the width of a key. */
  #fitToWidth(): void {
    const compact = this.#board.clientWidth / this.#whiteKeys < MIN_LABELED_KEY_PX;
    if (compact !== this.#compact) {
      this.#compact = compact;
      this.#container.classList.toggle('keyboard-compact', compact);
      for (const midi of this.#keys.keys()) this.#renderKey(midi);
    }
    this.#renderNames();
  }

  #renderKey(midi: number): void {
    const elements = this.#keys.get(midi);
    if (!elements) return;
    const active = this.#active.get(midi);
    elements.key.classList.toggle('key-left', active?.hand === 'left');
    elements.key.classList.toggle('key-right', active?.hand === 'right');
    elements.label.textContent = this.#compact
      ? ''
      : active
        ? spelledName(active.spelling, this.#naming)
        : midi % 12 === 0
          ? keyName(midi, this.#naming)
          : '';
  }

  /** In compact mode, the names of the lit keys in a row above them, each over its key. */
  #renderNames(): void {
    if (!this.#compact) {
      this.#names.replaceChildren();
      return;
    }
    const active = [...this.#active.values()].sort((a, b) => a.midi - b.midi);
    const labels = active.map(({ hand, spelling }) => {
      const label = document.createElement('span');
      label.className = `keyboard-name keyboard-name-${hand}`;
      label.textContent = spelledName(spelling, this.#naming);
      return label;
    });
    this.#names.replaceChildren(...labels);
    const spans = active.map(({ midi }, i) => {
      const key = this.#keys.get(midi)?.key;
      return {
        center: key ? key.offsetLeft + key.offsetWidth / 2 : 0,
        width: labels[i]?.offsetWidth ?? 0,
      };
    });
    const lefts = spreadLabels(spans, this.#names.clientWidth, NAME_GAP_PX);
    labels.forEach((label, i) => (label.style.left = `${lefts[i] ?? 0}px`));
  }
}
