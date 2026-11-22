import { describe, expect, it } from 'vitest';
import { pedalSpans, soundingEnds } from './pedal';
import type { KeyPress } from './pedal';
import type { PedalMark } from './types';

const down = (beat: number): PedalMark => ({ beat, kind: 'down' });
const up = (beat: number): PedalMark => ({ beat, kind: 'up' });

describe('pedalSpans', () => {
  it('pairs a press with the following lift', () => {
    expect(pedalSpans([down(1), up(3)], 8)).toEqual([{ startBeat: 1, endBeat: 3 }]);
  });

  it('reads a lift and a press at one beat as a change, in any order', () => {
    const expected = [
      { startBeat: 0, endBeat: 4 },
      { startBeat: 4, endBeat: 6 },
    ];
    expect(pedalSpans([down(0), up(4), down(4), up(6)], 8)).toEqual(expected);
    expect(pedalSpans([down(4), up(6), down(0), up(4)], 8)).toEqual(expected);
  });

  it('reads a press while the pedal is down as a change ("Ped." without "*")', () => {
    expect(pedalSpans([down(0), down(2), up(3)], 8)).toEqual([
      { startBeat: 0, endBeat: 2 },
      { startBeat: 2, endBeat: 3 },
    ]);
  });

  it('ignores a lift while the pedal is up', () => {
    expect(pedalSpans([up(1), down(2), up(3), up(5)], 8)).toEqual([{ startBeat: 2, endBeat: 3 }]);
  });

  it('lifts a pedal still down at the end of the piece', () => {
    expect(pedalSpans([down(6)], 8)).toEqual([{ startBeat: 6, endBeat: 8 }]);
  });

  it('has no spans without marks', () => {
    expect(pedalSpans([], 8)).toEqual([]);
  });
});

describe('soundingEnds', () => {
  const press = (startBeat: number, endBeat: number, midi = 60): KeyPress => ({
    startBeat,
    endBeat,
    midi,
  });

  it('holds a note released while the pedal is down until the pedal goes up', () => {
    expect(soundingEnds([press(0, 1)], [{ startBeat: 0, endBeat: 4 }])).toEqual([4]);
  });

  it('does not change a note released while the pedal is up', () => {
    expect(soundingEnds([press(0, 1), press(5, 6)], [{ startBeat: 2, endBeat: 4 }])).toEqual([
      1, 6,
    ]);
  });

  it('does not hold a note released exactly where the pedal changes or goes up', () => {
    const pedal = [
      { startBeat: 0, endBeat: 2 },
      { startBeat: 2, endBeat: 4 },
    ];
    expect(soundingEnds([press(0, 2, 60), press(2, 4, 64)], pedal)).toEqual([2, 4]);
  });

  it('holds a note through the rest of its span only, not through the next one', () => {
    const pedal = [
      { startBeat: 0, endBeat: 2 },
      { startBeat: 2, endBeat: 4 },
    ];
    expect(soundingEnds([press(0, 1)], pedal)).toEqual([2]);
  });

  it('stops a held note where the same key is struck again', () => {
    const pedal = [{ startBeat: 0, endBeat: 8 }];
    expect(soundingEnds([press(0, 1), press(3, 4), press(2, 3, 64)], pedal)).toEqual([3, 8, 8]);
  });

  it('never ends a note before its key is released', () => {
    const pedal = [{ startBeat: 0, endBeat: 8 }];
    // The same key struck again while it is still held (two voices): the note keeps its length.
    expect(soundingEnds([press(0, 4), press(2, 3)], pedal)).toEqual([4, 8]);
  });
});
