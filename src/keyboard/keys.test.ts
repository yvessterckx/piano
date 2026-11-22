import { describe, expect, it } from 'vitest';
import { KEYBOARD_RANGES, keyboardGeometry, keysInRange } from './keys';
import { keyName, spelledName } from './noteNames';

describe('keysInRange', () => {
  it('lays out an 88-key piano: 52 white and 36 black keys from A0 to C8', () => {
    const keys = keysInRange(KEYBOARD_RANGES[88]);

    expect(keys).toHaveLength(88);
    expect(keys.filter((key) => !key.black)).toHaveLength(52);
    expect(keys[0]).toEqual({ midi: 21, black: false, whiteIndex: 0 });
    expect(keys[1]).toEqual({ midi: 22, black: true, whiteIndex: 0 });
    expect(keys.at(-1)).toEqual({ midi: 108, black: false, whiteIndex: 51 });
  });

  it('places middle C as the 24th white key', () => {
    const middleC = keysInRange(KEYBOARD_RANGES[88]).find((key) => key.midi === 60);

    expect(middleC?.whiteIndex).toBe(23);
  });
});

describe('keyboardGeometry', () => {
  it('fits 52 white keys to the width, black keys between them', () => {
    const geometry = keyboardGeometry(KEYBOARD_RANGES[88], 1040, false);
    const key = (midi: number) => geometry.keys.find((k) => k.midi === midi);

    expect(geometry.whiteKeyWidth).toBe(20);
    expect(geometry.pedal).toBeUndefined();
    expect(key(21)).toEqual({ midi: 21, black: false, left: 0, width: 19 });
    expect(key(60)).toEqual({ midi: 60, black: false, left: 460, width: 19 });
    expect(key(61)?.left).toBeCloseTo(473.6, 6);
    expect(key(61)?.width).toBeCloseTo(12.8, 6);
    expect(key(108)).toEqual({ midi: 108, black: false, left: 1020, width: 19 });
  });

  it('makes room for the pedal key at the right', () => {
    const geometry = keyboardGeometry(KEYBOARD_RANGES[88], 1264, true);
    const last = geometry.keys.at(-1);

    expect(geometry.pedal).toEqual({ left: 1246, width: 18 });
    expect(geometry.whiteKeyWidth).toBeCloseTo(1240 / 52, 6);
    expect((last?.left ?? 0) + (last?.width ?? 0)).toBeLessThan(1246);
  });

  it('keeps a narrow pedal key usable on a phone', () => {
    expect(keyboardGeometry(KEYBOARD_RANGES[88], 374, true).pedal?.width).toBe(10);
  });
});

describe('note names', () => {
  it('names written notes with their accidental', () => {
    expect(spelledName({ step: 'B', alter: -1 }, 'solfege')).toBe('si♭');
    expect(spelledName({ step: 'B', alter: -1 }, 'letter')).toBe('B♭');
    expect(spelledName({ step: 'F', alter: 1 }, 'solfege')).toBe('fa♯');
    expect(spelledName({ step: 'G', alter: 0 }, 'solfege')).toBe('sol');
  });

  it('names keys without a written note, with sharps for black keys', () => {
    expect(keyName(60, 'solfege')).toBe('do');
    expect(keyName(61, 'letter')).toBe('C♯');
    expect(keyName(21, 'solfege')).toBe('la');
  });
});
