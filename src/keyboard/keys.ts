/** A range of keys, as MIDI note numbers (inclusive). */
export interface KeyboardRange {
  readonly lowest: number;
  readonly highest: number;
}

/** Common piano sizes. The target piano has 88 keys (see docs/decisions.md). */
export const KEYBOARD_RANGES = {
  88: { lowest: 21, highest: 108 },
  76: { lowest: 28, highest: 103 },
  61: { lowest: 36, highest: 96 },
} as const satisfies Record<number, KeyboardRange>;

export interface PianoKey {
  readonly midi: number;
  readonly black: boolean;
  /** Index among the white keys; for a black key, the index of the white key to its left. */
  readonly whiteIndex: number;
}

const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);

export function isBlackKey(midi: number): boolean {
  return BLACK_PITCH_CLASSES.has(((midi % 12) + 12) % 12);
}

/** The keys of a range from low to high. A range must start and end on a white key. */
export function keysInRange(range: KeyboardRange): PianoKey[] {
  const keys: PianoKey[] = [];
  let whiteIndex = -1;
  for (let midi = range.lowest; midi <= range.highest; midi++) {
    const black = isBlackKey(midi);
    if (!black) whiteIndex++;
    keys.push({ midi, black, whiteIndex });
  }
  return keys;
}
