import { describe, expect, it } from 'vitest';
import { createTempoMap, DEFAULT_BPM } from './tempoMap';

describe('createTempoMap', () => {
  it('converts at a constant tempo', () => {
    const map = createTempoMap([{ beat: 0, bpm: 120 }]);

    expect(map.secondsAt(4)).toBe(2);
    expect(map.beatAt(2)).toBe(4);
  });

  it('follows tempo changes in both directions', () => {
    const map = createTempoMap([
      { beat: 0, bpm: 60 },
      { beat: 4, bpm: 120 },
    ]);

    expect(map.secondsAt(4)).toBe(4);
    expect(map.secondsAt(6)).toBe(5);
    expect(map.beatAt(5)).toBe(6);
    expect(map.beatAt(2)).toBe(2);
    expect(map.bpmAt(3.9)).toBe(60);
    expect(map.bpmAt(4)).toBe(120);
  });

  it('applies the first tempo from the start and falls back to a default', () => {
    expect(createTempoMap([{ beat: 2, bpm: 60 }]).secondsAt(1)).toBe(1);
    expect(createTempoMap([]).secondsAt(1)).toBe(60 / DEFAULT_BPM);
  });

  it('lets a later change at the same beat win', () => {
    const map = createTempoMap([
      { beat: 0, bpm: 60 },
      { beat: 0, bpm: 120 },
    ]);

    expect(map.secondsAt(2)).toBe(1);
  });
});
