import { BEAT_EPSILON } from './beats';
import { handForStaff } from './hands';
import { pedalSpans, soundingEnds } from './pedal';
import type {
  Hand,
  NoteRef,
  NoteSpelling,
  StaffInfo,
  StaffRef,
  Timeline,
  TimelineEvent,
  TimelineInput,
} from './types';

interface EventDraft {
  readonly startBeat: number;
  endBeat: number;
  readonly midi: number;
  readonly spelling: NoteSpelling;
  readonly hand: Hand;
  readonly staff: StaffRef;
  readonly measure: number;
  readonly noteRefs: NoteRef[];
}

/**
 * Builds the timeline from the note occurrences of a score adapter: merges tied notes into one
 * event, assigns a hand to every event, and works out how long each note sounds with the sustain
 * pedal (see pedal.ts).
 *
 * Ties are merged per occurrence, in playback order. A note continues a tie only if a note of the
 * same pitch on the same staff with an open tie ends exactly where it starts. That is what makes
 * a tie into a first and a second ending come out right on each pass of a repeat.
 */
export function buildTimeline(input: TimelineInput): Timeline {
  const hands = handsByStaff(input.staves);
  const sorted = [...input.notes].sort((a, b) => a.startBeat - b.startBeat);

  const drafts: EventDraft[] = [];
  const openTies = new Map<string, EventDraft>();

  for (const note of sorted) {
    const key = tieKey(note.staff, note.midi);
    const open = openTies.get(key);

    if (note.tieStop && open && Math.abs(open.endBeat - note.startBeat) < BEAT_EPSILON) {
      open.endBeat = note.startBeat + note.durationBeats;
      open.noteRefs.push(note.noteRef);
      if (!note.tieStart) openTies.delete(key);
      continue;
    }

    const draft: EventDraft = {
      startBeat: note.startBeat,
      endBeat: note.startBeat + note.durationBeats,
      midi: note.midi,
      spelling: note.spelling,
      hand: hands.get(staffKey(note.staff)) ?? 'right',
      staff: note.staff,
      measure: note.measure,
      noteRefs: [note.noteRef],
    };
    drafts.push(draft);
    if (note.tieStart) openTies.set(key, draft);
  }

  const lastMeasure = input.measures.at(-1);
  const durationBeats = lastMeasure ? lastMeasure.startBeat + lastMeasure.durationBeats : 0;

  const pedal = pedalSpans(input.pedal, durationBeats);
  const presses = drafts.sort((a, b) => a.startBeat - b.startBeat || a.midi - b.midi);
  const soundingEnd = soundingEnds(presses, pedal);
  const events: TimelineEvent[] = presses.map(({ endBeat, ...rest }, i) => ({
    ...rest,
    durationBeats: endBeat - rest.startBeat,
    soundingEndBeat: soundingEnd[i] ?? endBeat,
  }));

  return {
    events,
    measures: input.measures,
    tempo: [...input.tempo].sort((a, b) => a.beat - b.beat),
    pedal,
    durationBeats,
  };
}

function handsByStaff(staves: readonly StaffInfo[]): Map<string, Hand> {
  return new Map(staves.map((staff) => [staffKey(staff), handForStaff(staff, staves)]));
}

function staffKey(staff: StaffRef): string {
  return `${staff.partIndex}/${staff.staffInPart}`;
}

function tieKey(staff: StaffRef, midi: number): string {
  return `${staffKey(staff)}/${midi}`;
}
