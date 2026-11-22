import type { TempoChange } from '../timeline/types';

/** Tempo for a piece without any tempo information, in quarter notes per minute. */
export const DEFAULT_BPM = 100;

/** Converts between beats and seconds at the written tempo (tempo factor 100%). */
export interface TempoMap {
  /** Seconds from the start of the piece to a beat. */
  secondsAt(beat: number): number;
  /** The beat reached after a number of seconds from the start of the piece. */
  beatAt(seconds: number): number;
  /** The written tempo at a beat, in quarter notes per minute. */
  bpmAt(beat: number): number;
}

interface Segment {
  readonly beat: number;
  readonly seconds: number;
  readonly bpm: number;
}

/**
 * Builds a tempo map from the tempo changes of a timeline. The first tempo also applies before
 * its beat. Changes with a tempo of 0 or less are ignored.
 */
export function createTempoMap(changes: readonly TempoChange[]): TempoMap {
  const valid = changes.filter((change) => change.bpm > 0).sort((a, b) => a.beat - b.beat);
  const segments: [Segment, ...Segment[]] = [
    { beat: 0, seconds: 0, bpm: valid[0]?.bpm ?? DEFAULT_BPM },
  ];
  for (const change of valid) {
    const last = segments[segments.length - 1];
    if (!last) break;
    if (change.beat <= last.beat) {
      segments[segments.length - 1] = { ...last, bpm: change.bpm };
      continue;
    }
    const seconds = last.seconds + ((change.beat - last.beat) * 60) / last.bpm;
    segments.push({ beat: change.beat, seconds, bpm: change.bpm });
  }

  const segmentBy = (isAfter: (segment: Segment) => boolean): Segment => {
    let found = segments[0];
    for (const segment of segments) {
      if (isAfter(segment)) break;
      found = segment;
    }
    return found;
  };

  return {
    secondsAt(beat) {
      const segment = segmentBy((s) => s.beat > beat);
      return segment.seconds + ((beat - segment.beat) * 60) / segment.bpm;
    },
    beatAt(seconds) {
      const segment = segmentBy((s) => s.seconds > seconds);
      return segment.beat + ((seconds - segment.seconds) * segment.bpm) / 60;
    },
    bpmAt(beat) {
      return segmentBy((s) => s.beat > beat).bpm;
    },
  };
}
