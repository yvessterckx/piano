import { MusicPartManagerIterator, NoteEnum, TieTypes } from 'opensheetmusicdisplay';
import type {
  Fraction,
  MusicSheet,
  Note,
  Pedal,
  PlacementEnum,
  Pitch,
} from 'opensheetmusicdisplay';
import { BEAT_EPSILON } from '../../timeline/beats';
import type {
  MeasureOccurrence,
  NoteOccurrence,
  NoteRef,
  NoteSpelling,
  NoteStep,
  PedalMark,
  StaffInfo,
  StaffRef,
  TempoChange,
  TimelineInput,
} from '../../timeline/types';

/** OSMD counts time in whole notes; the timeline counts quarter notes. */
const BEATS_PER_WHOLE_NOTE = 4;

/** OSMD's half tone of a pitch is 12 below its MIDI note number (C4: 48 in OSMD, 60 in MIDI). */
const OSMD_HALF_TONE_TO_MIDI = 12;

/**
 * Upper bound on iterator steps. A real score has far fewer positions; a malformed repeat
 * structure must fail loudly instead of freezing the page.
 */
const MAX_ITERATOR_STEPS = 1_000_000;

export interface ExtractedScore {
  readonly input: TimelineInput;
  /** The written notes, indexed by the NoteRef the timeline carries. */
  readonly notesByRef: readonly Note[];
}

/**
 * Reads the notes and sustain pedal marks of a loaded OSMD sheet in playback order.
 *
 * OSMD's MusicPartManagerIterator unrolls repeats, endings and D.C./D.S. jumps, and gives the
 * position both in the unrolled piece (enrolled timestamp) and in the score (measure index).
 * Ties are not merged here: every written note is reported with its tie flags, and the timeline
 * merges them (see buildTimeline).
 */
export function extractTimelineInput(sheet: MusicSheet): ExtractedScore {
  const staffRefs = new Map<number, StaffRef>();
  const staves: StaffInfo[] = [];
  sheet.Instruments.forEach((instrument, partIndex) => {
    instrument.Staves.forEach((staff, staffInPart) => {
      staffRefs.set(staff.idInMusicSheet, { partIndex, staffInPart });
      staves.push({ partIndex, staffInPart, stavesInPart: instrument.Staves.length });
    });
  });

  const notesByRef: Note[] = [];
  const refByNote = new Map<Note, NoteRef>();
  const refFor = (note: Note): NoteRef => {
    let ref = refByNote.get(note);
    if (ref === undefined) {
      ref = notesByRef.push(note) - 1;
      refByNote.set(note, ref);
    }
    return ref;
  };

  const notes: NoteOccurrence[] = [];
  const measures: MeasureOccurrence[] = [];
  const tempo: TempoChange[] = [];
  const pedal: PedalMark[] = [];
  let openMeasure: Omit<MeasureOccurrence, 'durationBeats'> | undefined;

  const closeMeasure = (endBeat: number): void => {
    if (openMeasure)
      measures.push({ ...openMeasure, durationBeats: endBeat - openMeasure.startBeat });
  };

  const iterator = new MusicPartManagerIterator(sheet);
  for (let step = 0; !iterator.EndReached; step++) {
    if (step >= MAX_ITERATOR_STEPS) {
      throw new Error(
        `The score has more than ${MAX_ITERATOR_STEPS} positions; its repeats may loop.`,
      );
    }

    const beat = toBeats(iterator.CurrentEnrolledTimestamp);
    const measureStart = beat - toBeats(iterator.CurrentRelativeInMeasureTimestamp);
    const sourceIndex = iterator.CurrentMeasureIndex;
    if (
      openMeasure?.sourceIndex !== sourceIndex ||
      Math.abs(openMeasure.startBeat - measureStart) > BEAT_EPSILON
    ) {
      closeMeasure(measureStart);
      openMeasure = {
        index: measures.length,
        sourceIndex,
        label: measureLabel(sheet, sourceIndex),
        startBeat: measureStart,
      };
      pedal.push(...pedalMarksOf(sheet, sourceIndex, measureStart));
    }

    const bpm = iterator.CurrentBpm;
    if (tempo.at(-1)?.bpm !== bpm) tempo.push({ beat, bpm });

    for (const voiceEntry of iterator.CurrentVoiceEntries) {
      if (voiceEntry.IsGrace) continue;
      for (const note of voiceEntry.Notes) {
        if (note.isRest() || note.IsCueNote) continue;
        const staff = staffRefs.get(note.ParentStaff.idInMusicSheet);
        if (!staff) continue;
        notes.push({
          startBeat: beat,
          durationBeats: toBeats(note.Length),
          midi: note.Pitch.getHalfTone() + OSMD_HALF_TONE_TO_MIDI,
          spelling: spellingOf(note.Pitch),
          staff,
          measure: openMeasure.index,
          ...tieFlags(note),
          noteRef: refFor(note),
        });
      }
    }

    iterator.moveToNext();
  }

  closeMeasure(lastMeasureEnd(sheet, openMeasure, notes));

  return { input: { notes, measures, staves, tempo, pedal }, notesByRef };
}

const STEPS: Record<NoteEnum, NoteStep> = {
  [NoteEnum.C]: 'C',
  [NoteEnum.D]: 'D',
  [NoteEnum.E]: 'E',
  [NoteEnum.F]: 'F',
  [NoteEnum.G]: 'G',
  [NoteEnum.A]: 'A',
  [NoteEnum.B]: 'B',
};

/** The written letter and accidental. Microtonal accidentals are rounded to whole semitones. */
function spellingOf(pitch: Pitch): NoteSpelling {
  return { step: STEPS[pitch.FundamentalNote], alter: Math.round(pitch.AccidentalHalfTones) };
}

function toBeats(fraction: Fraction): number {
  return fraction.RealValue * BEATS_PER_WHOLE_NOTE;
}

/**
 * The measure number from the file. OSMD only keeps numeric numbers: a measure numbered e.g. "X1"
 * (how MuseScore exports an unnumbered pickup between sections) gets an empty label rather than
 * OSMD's sequential count, which would show a number the score does not print.
 */
function measureLabel(sheet: MusicSheet, sourceIndex: number): string {
  const numberInFile = sheet.SourceMeasures[sourceIndex]?.MeasureNumberXML;
  return numberInFile === undefined ? '' : String(numberInFile);
}

/**
 * The sustain pedal marks of a measure, at their beats in this pass, from every staff (a piano has
 * one pedal, usually written under the bass staff). OSMD pairs the marks itself, but leaves a
 * "Ped." that is followed by another "Ped." open for good; so only the marks are read here and the
 * timeline pairs them (see timeline/pedal.ts). A pedal change has both an end and a start.
 */
function pedalMarksOf(sheet: MusicSheet, sourceIndex: number, measureStart: number): PedalMark[] {
  const marks: PedalMark[] = [];
  for (const expressions of sheet.SourceMeasures[sourceIndex]?.StaffLinkedExpressions ?? []) {
    for (const expression of expressions) {
      const beat = measureStart + toBeats(expression.Timestamp);
      // OSMD types these fields without undefined, but leaves them undefined when there is no mark.
      if ((expression.PedalEnd as Pedal | undefined) !== undefined)
        marks.push({ beat, kind: 'up' });
      if ((expression.PedalStart as Pedal | undefined) !== undefined) {
        marks.push({ beat, kind: 'down' });
      }
    }
  }
  return marks;
}

/**
 * The end of the last measure. The iterator stops at the last position, not at the end of the
 * measure, so take the longer of the measure's duration and the end of its last note.
 */
function lastMeasureEnd(
  sheet: MusicSheet,
  measure: Omit<MeasureOccurrence, 'durationBeats'> | undefined,
  notes: readonly NoteOccurrence[],
): number {
  if (!measure) return 0;
  const sourceDuration = sheet.SourceMeasures[measure.sourceIndex]?.Duration;
  const measureEnd = measure.startBeat + (sourceDuration ? toBeats(sourceDuration) : 0);
  const notesEnd = notes
    .filter((note) => note.measure === measure.index)
    .reduce((end, note) => Math.max(end, note.startBeat + note.durationBeats), measure.startBeat);
  return Math.max(measureEnd, notesEnd);
}

/**
 * Tie flags of a written note. Only plain ties count (not hammer-ons and other tablature
 * techniques, which OSMD also models as ties). A note that ends a tie whose start is in another
 * ending (e.g. a tie into a second ending) has no tie object in OSMD, only
 * TieStopWithoutStartDirection.
 */
function tieFlags(note: Note): { tieStart: boolean; tieStop: boolean } {
  // OSMD documents this field as undefined when there is no such tie, but types it without undefined.
  const tieStopWithoutStart = note.TieStopWithoutStartDirection as PlacementEnum | undefined;
  let tieStart = false;
  let tieStop = tieStopWithoutStart !== undefined;
  for (const tie of note.NoteTies) {
    if (tie.Type !== TieTypes.SIMPLE) continue;
    const position = tie.Notes.indexOf(note);
    if (position < tie.Notes.length - 1) tieStart = true;
    if (position > 0) tieStop = true;
  }
  return { tieStart, tieStop };
}
