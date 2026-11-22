import { describe, expect, it } from 'vitest';
import { buildTimeline } from './buildTimeline';
import type { MeasureOccurrence, NoteOccurrence, StaffInfo, TimelineInput } from './types';

const PIANO: StaffInfo[] = [
  { partIndex: 0, staffInPart: 0, stavesInPart: 2 },
  { partIndex: 0, staffInPart: 1, stavesInPart: 2 },
];
const RIGHT = { partIndex: 0, staffInPart: 0 };
const LEFT = { partIndex: 0, staffInPart: 1 };

let nextRef = 0;
function note(
  fields: Pick<NoteOccurrence, 'startBeat' | 'durationBeats' | 'midi'> & Partial<NoteOccurrence>,
): NoteOccurrence {
  return {
    staff: RIGHT,
    measure: 0,
    tieStart: false,
    tieStop: false,
    noteRef: nextRef++,
    ...fields,
  };
}

function measures(...durations: number[]): MeasureOccurrence[] {
  let start = 0;
  return durations.map((durationBeats, index) => {
    const measure = {
      index,
      sourceIndex: index,
      label: String(index + 1),
      startBeat: start,
      durationBeats,
    };
    start += durationBeats;
    return measure;
  });
}

function input(notes: NoteOccurrence[], fields: Partial<TimelineInput> = {}): TimelineInput {
  return {
    notes,
    measures: measures(4, 4),
    staves: PIANO,
    tempo: [{ beat: 0, bpm: 120 }],
    ...fields,
  };
}

describe('buildTimeline', () => {
  it('merges a tie across a barline into one event with both note references', () => {
    const first = note({ startBeat: 3, durationBeats: 1, midi: 74, tieStart: true });
    const second = note({ startBeat: 4, durationBeats: 2, midi: 74, tieStop: true, measure: 1 });

    const { events } = buildTimeline(input([second, first]));

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ startBeat: 3, durationBeats: 3, midi: 74, measure: 0 });
    expect(events[0]?.noteRefs).toEqual([first.noteRef, second.noteRef]);
  });

  it('merges a chain of ties', () => {
    const { events } = buildTimeline(
      input([
        note({ startBeat: 0, durationBeats: 2, midi: 60, tieStart: true }),
        note({ startBeat: 2, durationBeats: 2, midi: 60, tieStart: true, tieStop: true }),
        note({ startBeat: 4, durationBeats: 4, midi: 60, tieStop: true }),
      ]),
    );

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ startBeat: 0, durationBeats: 8 });
    expect(events[0]?.noteRefs).toHaveLength(3);
  });

  it('keeps the newly struck note of a chord that also continues a tie', () => {
    const { events } = buildTimeline(
      input([
        note({ startBeat: 0, durationBeats: 2, midi: 76, tieStart: true }),
        note({ startBeat: 0, durationBeats: 2, midi: 79 }),
        note({ startBeat: 2, durationBeats: 1, midi: 76, tieStop: true }),
        note({ startBeat: 2, durationBeats: 1, midi: 84 }),
      ]),
    );

    expect(events.map((e) => [e.startBeat, e.midi, e.durationBeats])).toEqual([
      [0, 76, 3],
      [0, 79, 2],
      [2, 84, 1],
    ]);
  });

  it('does not merge a note struck again where a tied note of the same pitch ends', () => {
    const { events } = buildTimeline(
      input([
        note({ startBeat: 0, durationBeats: 4, midi: 48, staff: LEFT, tieStart: true }),
        note({ startBeat: 4, durationBeats: 2, midi: 48, staff: LEFT, tieStop: true }),
        note({ startBeat: 6, durationBeats: 2, midi: 48, staff: LEFT }),
      ]),
    );

    expect(events.map((e) => [e.startBeat, e.durationBeats])).toEqual([
      [0, 6],
      [6, 2],
    ]);
  });

  it('does not merge across a gap or across staves', () => {
    const { events } = buildTimeline(
      input([
        note({ startBeat: 0, durationBeats: 1, midi: 60, tieStart: true }),
        note({ startBeat: 2, durationBeats: 1, midi: 60, tieStop: true }),
        note({ startBeat: 4, durationBeats: 1, midi: 62, tieStart: true }),
        note({ startBeat: 5, durationBeats: 1, midi: 62, tieStop: true, staff: LEFT }),
      ]),
    );

    expect(events).toHaveLength(4);
  });

  it('keeps an open tie when another voice strikes the same pitch in between', () => {
    const { events } = buildTimeline(
      input([
        note({ startBeat: 0, durationBeats: 4, midi: 60, tieStart: true }),
        note({ startBeat: 2, durationBeats: 1, midi: 60 }),
        note({ startBeat: 4, durationBeats: 4, midi: 60, tieStop: true }),
      ]),
    );

    expect(events.map((e) => [e.startBeat, e.durationBeats])).toEqual([
      [0, 8],
      [2, 1],
    ]);
  });

  it('ties into the right ending on each pass of a repeat', () => {
    // Playback order of measures: 3, 4 (first ending), 3, 5 (second ending).
    const { events } = buildTimeline(
      input(
        [
          note({ startBeat: 0, durationBeats: 4, midi: 64, tieStart: true }),
          note({ startBeat: 4, durationBeats: 2, midi: 64, tieStop: true }),
          note({ startBeat: 6, durationBeats: 2, midi: 65 }),
          note({ startBeat: 8, durationBeats: 4, midi: 64, tieStart: true }),
          note({ startBeat: 12, durationBeats: 2, midi: 64, tieStop: true }),
          note({ startBeat: 14, durationBeats: 2, midi: 67 }),
        ],
        { measures: measures(4, 4, 4, 4) },
      ),
    );

    expect(events.map((e) => [e.startBeat, e.midi, e.durationBeats])).toEqual([
      [0, 64, 6],
      [6, 65, 2],
      [8, 64, 6],
      [14, 67, 2],
    ]);
  });

  it('treats a tie stop without a matching start as a struck note', () => {
    const { events } = buildTimeline(
      input([note({ startBeat: 0, durationBeats: 1, midi: 60, tieStop: true })]),
    );

    expect(events).toHaveLength(1);
  });

  it('assigns hands per staff and sorts events by beat, then pitch', () => {
    const { events } = buildTimeline(
      input([
        note({ startBeat: 1, durationBeats: 1, midi: 72 }),
        note({ startBeat: 0, durationBeats: 1, midi: 48, staff: LEFT }),
        note({ startBeat: 0, durationBeats: 1, midi: 64 }),
      ]),
    );

    expect(events.map((e) => [e.startBeat, e.midi, e.hand])).toEqual([
      [0, 48, 'left'],
      [0, 64, 'right'],
      [1, 72, 'right'],
    ]);
  });

  it('takes the total duration from the last measure', () => {
    const timeline = buildTimeline(input([], { measures: measures(1, 3, 3) }));

    expect(timeline.durationBeats).toBe(7);
  });
});
