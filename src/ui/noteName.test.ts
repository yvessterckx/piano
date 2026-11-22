import { describe, expect, it } from 'vitest';
import { noteName } from './noteName';

describe('noteName', () => {
  it('names notes in scientific pitch notation', () => {
    expect(noteName(60)).toBe('C4');
    expect(noteName(69)).toBe('A4');
    expect(noteName(61)).toBe('C♯4');
    expect(noteName(21)).toBe('A0');
    expect(noteName(108)).toBe('C8');
  });
});
