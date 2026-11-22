import { BEAT_EPSILON } from './beats';
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
 * The events whose key is held at a beat: started at or before it and not yet released.
 * Called on every animation frame: only the events that can still be held are looked at.
 */
export function eventsSoundingAt(timeline: Timeline, beat: number): TimelineEvent[] {
  const { events } = timeline;
  const found: TimelineEvent[] = [];
  const from = firstEventFrom(events, beat - longestDurations(timeline).held - BEAT_EPSILON);
  for (let i = from; i < events.length; i++) {
    const event = events[i];
    if (!event || event.startBeat > beat + BEAT_EPSILON) break;
    if (beat < event.startBeat + event.durationBeats - BEAT_EPSILON) found.push(event);
  }
  return found;
}

/** A key held at a beat. */
export interface HeldKey {
  readonly event: TimelineEvent;
  /**
   * Struck at the latest onset up to the beat: what to play at this moment. Otherwise the key was
   * struck earlier and is still down, or still sounding where the pedal lets the finger go: a long
   * written note does not say which.
   */
  readonly struck: boolean;
}

/**
 * The keys held at a beat, each marked as struck now or held on from an earlier onset. "Now" is
 * the latest onset at or before the beat among the included events, also when that note has
 * already ended (a short note of the other hand), so a held key does not flicker back to "struck".
 */
export function heldKeysAt(
  timeline: Timeline,
  beat: number,
  include: (event: TimelineEvent) => boolean = () => true,
): HeldKey[] {
  const { events } = timeline;
  let latestOnset = -Infinity;
  for (let i = firstEventFrom(events, beat + BEAT_EPSILON) - 1; i >= 0; i--) {
    const event = events[i];
    if (event && include(event)) {
      latestOnset = event.startBeat;
      break;
    }
  }
  return eventsSoundingAt(timeline, beat)
    .filter(include)
    .map((event) => ({
      event,
      struck: Math.abs(event.startBeat - latestOnset) < BEAT_EPSILON,
    }));
}

/** A span of the piece in beats: from startBeat up to (not including) endBeat. */
export interface BeatSpan {
  readonly startBeat: number;
  readonly endBeat: number;
}

/**
 * The events that sound at some moment of a span, counting the sustain pedal: struck before its
 * end and still sounding after its start. Sorted like the timeline's events.
 */
export function eventsSoundingIn(timeline: Timeline, span: BeatSpan): TimelineEvent[] {
  const { events } = timeline;
  const found: TimelineEvent[] = [];
  const lookBack = longestDurations(timeline).sounding;
  for (let i = firstEventFrom(events, span.startBeat - lookBack - BEAT_EPSILON); ; i++) {
    const event = events[i];
    if (!event || event.startBeat >= span.endBeat - BEAT_EPSILON) break;
    if (event.soundingEndBeat > span.startBeat + BEAT_EPSILON) found.push(event);
  }
  return found;
}

/** Whether the sustain pedal is down at a beat. */
export function pedalDownAt(timeline: Timeline, beat: number): boolean {
  return timeline.pedal.some(
    (span) => span.startBeat <= beat + BEAT_EPSILON && beat < span.endBeat - BEAT_EPSILON,
  );
}

/** Index of the first event starting at or after a beat (events are sorted by start). */
export function firstEventFrom(events: readonly TimelineEvent[], beat: number): number {
  let low = 0;
  let high = events.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if ((events[middle]?.startBeat ?? Infinity) < beat) low = middle + 1;
    else high = middle;
  }
  return low;
}

interface LongestDurations {
  /** The longest key press, in beats. */
  readonly held: number;
  /** The longest time a note sounds, with the pedal, in beats. */
  readonly sounding: number;
}

const longestDurationsCache = new WeakMap<Timeline, LongestDurations>();

/** How far back an event can start and still matter now. Computed once per timeline. */
function longestDurations(timeline: Timeline): LongestDurations {
  let longest = longestDurationsCache.get(timeline);
  if (!longest) {
    let held = 0;
    let sounding = 0;
    for (const event of timeline.events) {
      held = Math.max(held, event.durationBeats);
      sounding = Math.max(sounding, event.soundingEndBeat - event.startBeat);
    }
    longest = { held, sounding };
    longestDurationsCache.set(timeline, longest);
  }
  return longest;
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
