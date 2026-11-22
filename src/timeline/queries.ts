import { BEAT_EPSILON } from './buildTimeline';
import type { MeasureOccurrence, Timeline, TimelineEvent } from './types';

/** A position in the piece expressed as a measure occurrence and a beat within that measure. */
export interface MeasurePosition {
  readonly measure: MeasureOccurrence;
  /** Beats since the start of the measure, from 0 up to (not including) its duration. */
  readonly beatInMeasure: number;
}

/**
 * The measure occurrence that contains a beat, found by binary search.
 * A beat before the start or at/after the end is clamped to the first or last measure.
 */
export function measurePositionAt(timeline: Timeline, beat: number): MeasurePosition | undefined {
  const { measures } = timeline;
  if (measures.length === 0) return undefined;

  let low = 0;
  let high = measures.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    const candidate = measures[middle];
    if (candidate && candidate.startBeat <= beat + BEAT_EPSILON) low = middle;
    else high = middle - 1;
  }

  const measure = measures[low];
  if (!measure) return undefined;
  const beatInMeasure = Math.min(
    Math.max(beat - measure.startBeat, 0),
    Math.max(measure.durationBeats - BEAT_EPSILON, 0),
  );
  return { measure, beatInMeasure };
}

/**
 * The events sounding at a beat: started at or before it and not yet ended.
 * Linear in the number of events; fine for a spike, to be indexed when playback needs it per frame.
 */
export function eventsSoundingAt(timeline: Timeline, beat: number): TimelineEvent[] {
  return timeline.events.filter(
    (event) =>
      event.startBeat <= beat + BEAT_EPSILON &&
      beat < event.startBeat + event.durationBeats - BEAT_EPSILON,
  );
}
