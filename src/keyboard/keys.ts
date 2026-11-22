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

/** A key as drawn: its left edge and width in pixels from the left edge of the keyboard. */
export interface KeyLane {
  readonly midi: number;
  readonly black: boolean;
  readonly left: number;
  readonly width: number;
}

/** A horizontal strip in pixels from the left edge of the keyboard. */
export interface Strip {
  readonly left: number;
  readonly width: number;
}

/**
 * Where everything on the keyboard is drawn at a given width. The keyboard and the falling notes
 * both use it, so the notes fall exactly onto their keys.
 */
export interface KeyboardGeometry {
  readonly width: number;
  readonly whiteKeyWidth: number;
  /** Low to high. */
  readonly keys: readonly KeyLane[];
  /** The sustain pedal key to the right of the keys, when it is shown. */
  readonly pedal: Strip | undefined;
}

/** Narrower white keys than this cannot hold a note name: names go elsewhere (see Keyboard). */
export const MIN_LABELED_KEY_PX = 18;

/** Gap between white keys. */
const KEY_GAP_PX = 1;
/** A black key sits this far left of the boundary between two white keys, in white-key widths. */
const BLACK_KEY_OFFSET = 0.32;
const BLACK_KEY_WIDTH = 0.64;
const PEDAL_MIN_PX = 10;
const PEDAL_MAX_PX = 18;
/** The pedal key is about as wide as a white key would be. */
const PEDAL_PER_WHITE_KEY = 0.8;

/**
 * Fits the keys of a range to a width, with or without a pedal key at the right (the sustain pedal
 * is the right pedal). The pedal key takes 2 to 3 percent of the width.
 */
export function keyboardGeometry(
  range: KeyboardRange,
  width: number,
  withPedal: boolean,
): KeyboardGeometry {
  const keys = keysInRange(range);
  const whiteKeys = keys.filter((key) => !key.black).length;
  let pedal: Strip | undefined;
  let keysWidth = width;
  if (withPedal) {
    const pedalWidth = Math.round(
      Math.min(Math.max((width / whiteKeys) * PEDAL_PER_WHITE_KEY, PEDAL_MIN_PX), PEDAL_MAX_PX),
    );
    const gap = Math.round(pedalWidth / 3);
    keysWidth = Math.max(width - pedalWidth - gap, 0);
    pedal = { left: keysWidth + gap, width: pedalWidth };
  }
  const whiteKeyWidth = whiteKeys > 0 ? keysWidth / whiteKeys : 0;
  return {
    width,
    whiteKeyWidth,
    pedal,
    keys: keys.map(({ midi, black, whiteIndex }) =>
      black
        ? {
            midi,
            black,
            left: (whiteIndex + 1 - BLACK_KEY_OFFSET) * whiteKeyWidth,
            width: whiteKeyWidth * BLACK_KEY_WIDTH,
          }
        : {
            midi,
            black,
            left: whiteIndex * whiteKeyWidth,
            width: Math.max(whiteKeyWidth - KEY_GAP_PX, 0),
          },
    ),
  };
}
