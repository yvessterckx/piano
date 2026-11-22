import { describe, expect, it } from 'vitest';
import { KEYBOARD_RANGES, keysInRange } from './keys';
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
