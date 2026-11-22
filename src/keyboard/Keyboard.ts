import type { Hand, NoteSpelling } from '../timeline/types';
import { MIN_LABELED_KEY_PX, keyboardGeometry, keysInRange } from './keys';
import type { KeyboardGeometry, KeyboardRange } from './keys';
import { spreadLabels } from './nameLabels';
import { keyName, spelledName } from './noteNames';
import type { NoteNaming } from './noteNames';

/** A key to light up: which hand presses it and how the note is written. */
export interface ActiveKey {
  readonly midi: number;
  readonly hand: Hand;
  readonly spelling: NoteSpelling;
  /**
   * Struck at this moment (lit in full), or struck earlier and held on (lit lighter), so the
   * learner sees what to play now apart from what keeps sounding.
   */
  readonly struck: boolean;
}

interface KeyElements {
  readonly key: HTMLElement;
  readonly label: HTMLElement;
}

const NAME_GAP_PX = 3;
const MIDDLE_C = 60;

/**
 * The on-screen keyboard, fitted to the width of its container (no scrolling, so the keys never
 * move). Knows nothing about scores: it shows the keys it is given, colored by hand, in full when
 * they are struck now and lighter when they are held on from earlier. Each lit key
 * carries its note name, and every C its name for orientation; when the keys are too narrow for
 * that (a phone), the names of the lit keys appear in a row above them instead. Middle C is
 * marked either way.
 *
 * The keys are placed in pixels from keyboardGeometry, which the falling notes use too; listeners
 * of onGeometry hear about every change (resize, pedal key shown or hidden).
 */
export class Keyboard {
  readonly #container: HTMLElement;
  readonly #board: HTMLElement;
  readonly #names: HTMLElement;
  readonly #pedalKey: HTMLElement;
  readonly #range: KeyboardRange;
  readonly #keys = new Map<number, KeyElements>();
  readonly #geometryListeners = new Set<(geometry: KeyboardGeometry) => void>();
  #naming: NoteNaming;
  #active = new Map<number, ActiveKey>();
  #compact = false;
  #withPedal = false;
  #geometry: KeyboardGeometry;

  constructor(container: HTMLElement, range: KeyboardRange, naming: NoteNaming) {
    this.#container = container;
    this.#range = range;
    this.#naming = naming;
    this.#geometry = keyboardGeometry(range, 0, false);

    this.#names = document.createElement('div');
    this.#names.className = 'keyboard-names';
    this.#names.setAttribute('aria-hidden', 'true');
    this.#board = document.createElement('div');
    this.#board.className = 'keyboard';

    for (const { midi, black } of keysInRange(range)) {
      const key = document.createElement('div');
      key.className = black ? 'key key-black' : 'key key-white';
      if (midi === MIDDLE_C) key.classList.add('key-middle-c');
      const label = document.createElement('span');
      label.className = 'key-label';
      key.append(label);
      this.#board.append(key);
      this.#keys.set(midi, { key, label });
    }
    this.#pedalKey = document.createElement('div');
    this.#pedalKey.className = 'key-pedal';
    this.#pedalKey.textContent = 'Pedal';
    this.#pedalKey.hidden = true;
    this.#board.append(this.#pedalKey);
    container.replaceChildren(this.#names, this.#board);
    for (const midi of this.#keys.keys()) this.#renderKey(midi);

    new ResizeObserver(() => {
      this.#fitToWidth();
    }).observe(this.#board);
  }

  /** Where the keys are drawn now, in pixels from the left edge of the keyboard. */
  get geometry(): KeyboardGeometry {
    return this.#geometry;
  }

  /** Calls the listener whenever the keys move: on resize and when the pedal key comes or goes. */
  onGeometry(listener: (geometry: KeyboardGeometry) => void): () => void {
    this.#geometryListeners.add(listener);
    return () => this.#geometryListeners.delete(listener);
  }

  /** Shows or hides the sustain pedal key at the right; the keys narrow to make room for it. */
  setPedalKey(shown: boolean): void {
    if (shown === this.#withPedal) return;
    this.#withPedal = shown;
    this.#pedalKey.hidden = !shown;
    this.#fitToWidth();
  }

  /** Lights the pedal key while the sustain pedal is down. */
  showPedal(down: boolean): void {
    this.#pedalKey.classList.toggle('key-pedal-down', down);
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
      if (!sameKey(next.get(midi), key)) changed.add(midi);
    }
    for (const [midi, key] of next) {
      if (!sameKey(this.#active.get(midi), key)) changed.add(midi);
    }
    this.#active = next;
    for (const midi of changed) this.#renderKey(midi);
    if (changed.size > 0) this.#renderNames();
  }

  /** Places the keys for the current width, with names on or above them by the width of a key. */
  #fitToWidth(): void {
    const geometry = keyboardGeometry(this.#range, this.#board.clientWidth, this.#withPedal);
    this.#geometry = geometry;
    for (const { midi, left, width } of geometry.keys) {
      const style = this.#keys.get(midi)?.key.style;
      if (!style) continue;
      style.left = `${left}px`;
      style.width = `${width}px`;
    }
    if (geometry.pedal) {
      this.#pedalKey.style.left = `${geometry.pedal.left}px`;
      this.#pedalKey.style.width = `${geometry.pedal.width}px`;
    }
    for (const listener of this.#geometryListeners) listener(geometry);

    const compact = geometry.whiteKeyWidth < MIN_LABELED_KEY_PX;
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
    elements.key.classList.toggle('key-held-on', active?.struck === false);
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
    const labels = active.map(({ hand, spelling, struck }) => {
      const label = document.createElement('span');
      label.className = `keyboard-name keyboard-name-${hand}`;
      if (!struck) label.classList.add('keyboard-name-held-on');
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

function sameKey(a: ActiveKey | undefined, b: ActiveKey | undefined): boolean {
  return a?.hand === b?.hand && a?.spelling === b?.spelling && a?.struck === b?.struck;
}
