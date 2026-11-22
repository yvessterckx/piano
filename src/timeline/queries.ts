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

/** A span of the piece in beats: from startBeat up to (not including) endBeat. */
export interface BeatSpan {
  readonly startBeat: number;
  readonly endBeat: number;
}

/**
 * The span from one measure of the score to another (source indices, in either order), in
 * playback order: from the first time the earlier one is played to the first time the later one
 * is played after it, both included. Undefined if a measure is never played.
 */
export function spanBetweenMeasures(
  timeline: Timeline,
  oneSourceIndex: number,
  otherSourceIndex: number,
): BeatSpan | undefined {
  const { measures } = timeline;
  const one = measures.find((m) => m.sourceIndex === oneSourceIndex);
  const other = measures.find((m) => m.sourceIndex === otherSourceIndex);
  if (!one || !other) return undefined;
  const [first, lastSource] =
    one.index <= other.index ? [one, otherSourceIndex] : [other, oneSourceIndex];
  const last = measures.find((m) => m.index >= first.index && m.sourceIndex === lastSource);
  if (!last) return undefined;
  return { startBeat: first.startBeat, endBeat: last.startBeat + last.durationBeats };
}

/** The measures of the score (source indices) played within a span, each once. */
export function measuresInSpan(timeline: Timeline, span: BeatSpan): number[] {
  const inSpan = timeline.measures.filter(
    (m) =>
      m.startBeat >= span.startBeat - BEAT_EPSILON && m.startBeat < span.endBeat - BEAT_EPSILON,
  );
  return [...new Set(inSpan.map((m) => m.sourceIndex))];
}
