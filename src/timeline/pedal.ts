import { BEAT_EPSILON } from './beats';
import type { PedalMark, PedalSpan } from './types';

/**
 * Turns the written pedal marks into the spans where the pedal is down, read the way a pianist
 * reads them. Real files are often inconsistent (a "Ped." followed by another "Ped." without a
 * release, a release without a "Ped."), so every mark gets a meaning and none is guessed:
 *
 * - "down" while the pedal is up: the pedal goes down.
 * - "down" while it is down: a pedal change (lifted and pressed again at that beat).
 * - "up" while it is down: the pedal goes up. "up" while it is up: ignored.
 * - A pedal still down at the end of the piece goes up there.
 *
 * Marks at the same beat count lifts first, so a lift and a press at one beat are a change.
 */
export function pedalSpans(marks: readonly PedalMark[], pieceEndBeat: number): PedalSpan[] {
  const sorted = [...marks].sort(
    (a, b) => a.beat - b.beat || Number(a.kind === 'down') - Number(b.kind === 'down'),
  );
  const spans: PedalSpan[] = [];
  let downSince: number | undefined;
  const lift = (beat: number): void => {
    if (downSince !== undefined && beat - downSince > BEAT_EPSILON) {
      spans.push({ startBeat: downSince, endBeat: beat });
    }
    downSince = undefined;
  };
  for (const mark of sorted) {
    if (mark.kind === 'up') {
      lift(mark.beat);
    } else {
      lift(mark.beat);
      downSince = mark.beat;
    }
  }
  lift(pieceEndBeat);
  return spans;
}

/** A struck key: where it starts and where it is released. */
export interface KeyPress {
  readonly startBeat: number;
  readonly endBeat: number;
  readonly midi: number;
}

/**
 * Where each key press stops sounding, in the same order. A key released while the pedal is down
 * sounds until the pedal goes up, or until the same key is struck again (by either hand), which
 * replaces the sound. A key released exactly where the pedal is lifted or changed is not held: in
 * legato pedaling the new pedal catches only the notes struck after the change.
 */
export function soundingEnds(presses: readonly KeyPress[], pedal: readonly PedalSpan[]): number[] {
  const strikes = strikesByKey(presses);
  return presses.map((press) => {
    const span = spanHolding(pedal, press.endBeat);
    if (!span) return press.endBeat;
    const nextStrike = firstAfter(strikes.get(press.midi) ?? [], press.startBeat);
    return Math.max(press.endBeat, Math.min(span.endBeat, nextStrike));
  });
}

/** The span in which the pedal is down at a beat, not counting its first and last moment. */
function spanHolding(pedal: readonly PedalSpan[], beat: number): PedalSpan | undefined {
  let low = 0;
  let high = pedal.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if ((pedal[middle]?.startBeat ?? Infinity) < beat - BEAT_EPSILON) low = middle + 1;
    else high = middle;
  }
  const span = pedal[low - 1];
  return span && beat < span.endBeat - BEAT_EPSILON ? span : undefined;
}

/** The start beats of the presses of each key, sorted. */
function strikesByKey(presses: readonly KeyPress[]): Map<number, number[]> {
  const strikes = new Map<number, number[]>();
  for (const { midi, startBeat } of presses) {
    const list = strikes.get(midi);
    if (list) list.push(startBeat);
    else strikes.set(midi, [startBeat]);
  }
  for (const list of strikes.values()) list.sort((a, b) => a - b);
  return strikes;
}

/** The first value later than a beat in a sorted list, or Infinity. */
function firstAfter(sorted: readonly number[], beat: number): number {
  let low = 0;
  let high = sorted.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if ((sorted[middle] ?? Infinity) <= beat + BEAT_EPSILON) low = middle + 1;
    else high = middle;
  }
  return sorted[low] ?? Infinity;
}
