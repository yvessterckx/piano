import { describe, expect, it } from 'vitest';
import {
  eventsSoundingAt,
  measurePositionAt,
  measuresInSpan,
  spanBetweenMeasures,
} from './queries';
import type { Timeline } from './types';

const timeline: Timeline = {
  measures: [
    { index: 0, sourceIndex: 0, label: '0', startBeat: 0, durationBeats: 1 },
    { index: 1, sourceIndex: 1, label: '1', startBeat: 1, durationBeats: 3 },
    { index: 2, sourceIndex: 1, label: '1', startBeat: 4, durationBeats: 3 },
  ],
  events: [
    {
      startBeat: 0,
      durationBeats: 1,
      midi: 67,
      spelling: { step: 'C', alter: 0 },
      hand: 'right',
      staff: { partIndex: 0, staffInPart: 0 },
      measure: 0,
      noteRefs: [0],
    },
    {
      startBeat: 1,
      durationBeats: 3,
      midi: 48,
      spelling: { step: 'C', alter: 0 },
      hand: 'left',
      staff: { partIndex: 0, staffInPart: 1 },
      measure: 1,
      noteRefs: [1],
    },
    {
      startBeat: 1,
      durationBeats: 2,
      midi: 72,
      spelling: { step: 'C', alter: 0 },
      hand: 'right',
      staff: { partIndex: 0, staffInPart: 0 },
      measure: 1,
      noteRefs: [2],
    },
  ],
  tempo: [{ beat: 0, bpm: 90 }],
  durationBeats: 7,
};

describe('measurePositionAt', () => {
  it('finds the measure occurrence and the beat within it', () => {
    expect(measurePositionAt(timeline, 0.5)).toMatchObject({
      measure: { index: 0 },
      beatInMeasure: 0.5,
    });
    expect(measurePositionAt(timeline, 1)).toMatchObject({
      measure: { index: 1 },
      beatInMeasure: 0,
    });
    expect(measurePositionAt(timeline, 5.5)).toMatchObject({
      measure: { index: 2 },
      beatInMeasure: 1.5,
    });
  });

  it('distinguishes passes of a repeated measure', () => {
    expect(measurePositionAt(timeline, 2)?.measure.index).toBe(1);
    expect(measurePositionAt(timeline, 5)?.measure.index).toBe(2);
    expect(measurePositionAt(timeline, 5)?.measure.sourceIndex).toBe(1);
  });

  it('clamps beats outside the piece to the first or last measure', () => {
    expect(measurePositionAt(timeline, -2)).toMatchObject({
      measure: { index: 0 },
      beatInMeasure: 0,
    });
    expect(measurePositionAt(timeline, 99)?.measure.index).toBe(2);
    expect(measurePositionAt(timeline, 99)?.beatInMeasure).toBeLessThan(3);
  });

  it('returns undefined for an empty timeline', () => {
    expect(measurePositionAt({ ...timeline, measures: [] }, 0)).toBeUndefined();
  });
});

describe('eventsSoundingAt', () => {
  it('returns the events that started and have not ended', () => {
    expect(eventsSoundingAt(timeline, 0).map((e) => e.midi)).toEqual([67]);
    expect(eventsSoundingAt(timeline, 1).map((e) => e.midi)).toEqual([48, 72]);
    expect(eventsSoundingAt(timeline, 3).map((e) => e.midi)).toEqual([48]);
    expect(eventsSoundingAt(timeline, 4)).toEqual([]);
  });
});

describe('spanBetweenMeasures', () => {
  // Source measures 0 1 2 3 played as 0 1 2 1 2 3 (measures 1 and 2 repeated).
  const repeated: Timeline = {
    measures: [0, 1, 2, 1, 2, 3].map((sourceIndex, index) => ({
      index,
      sourceIndex,
      label: String(sourceIndex + 1),
      startBeat: index * 4,
      durationBeats: 4,
    })),
    events: [],
    tempo: [],
    durationBeats: 24,
  };

  it('spans from the first measure to the last, whichever is tapped first', () => {
    expect(spanBetweenMeasures(repeated, 0, 3)).toEqual({ startBeat: 0, endBeat: 24 });
    expect(spanBetweenMeasures(repeated, 3, 0)).toEqual({ startBeat: 0, endBeat: 24 });
  });

  it('takes the first time a repeated measure is played', () => {
    expect(spanBetweenMeasures(repeated, 1, 2)).toEqual({ startBeat: 4, endBeat: 12 });
  });

  it('spans one measure when both taps are on it', () => {
    expect(spanBetweenMeasures(repeated, 2, 2)).toEqual({ startBeat: 8, endBeat: 12 });
  });

  it('is undefined for a measure that is never played', () => {
    expect(spanBetweenMeasures(repeated, 0, 9)).toBeUndefined();
  });

  it('lists the measures of the score within a span, each once', () => {
    expect(measuresInSpan(repeated, { startBeat: 4, endBeat: 20 })).toEqual([1, 2]);
    expect(measuresInSpan(repeated, { startBeat: 0, endBeat: 4 })).toEqual([0]);
  });
});
