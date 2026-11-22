/**
 * Pure data types of the timeline. No DOM, no audio, no renderer.
 *
 * Unit of time: a beat is one quarter note, counted from the start of the piece in playback
 * order (repeats unrolled). Quarter notes are also the unit of tempo in MusicXML
 * (`<sound tempo>`), so seconds = beats * 60 / bpm.
 */

export type Hand = 'left' | 'right';

/** Identifies a staff: the part (instrument) and the staff within that part, both zero-based. */
export interface StaffRef {
  readonly partIndex: number;
  readonly staffInPart: number;
}

/** A staff of the score with what is needed to decide which hand plays it. */
export interface StaffInfo extends StaffRef {
  /** Number of staves of the part this staff belongs to (2 for a standard piano part). */
  readonly stavesInPart: number;
}

/**
 * Opaque reference to a written note in the rendered score, issued by the score adapter.
 * The timeline only carries it, so the score can highlight the note later.
 */
export type NoteRef = number;

/** One measure as it is played: a repeated measure occurs once per pass. */
export interface MeasureOccurrence {
  /** Position in playback order, zero-based. */
  readonly index: number;
  /** Index of the measure in the score, zero-based; the same for every pass of a repeat. */
  readonly sourceIndex: number;
  /**
   * Measure number as given in the file, e.g. "0" for a pickup. Empty for a measure the file does
   * not number (e.g. an unnumbered pickup between sections).
   */
  readonly label: string;
  readonly startBeat: number;
  readonly durationBeats: number;
}

/**
 * A written note as it sounds once in playback order, before ties are merged.
 * This is what a score adapter (OSMD, Verovio, ...) produces.
 */
export interface NoteOccurrence {
  readonly startBeat: number;
  readonly durationBeats: number;
  readonly midi: number;
  readonly staff: StaffRef;
  /** Index of the MeasureOccurrence the note starts in. */
  readonly measure: number;
  /** The note is tied to a following note of the same pitch. */
  readonly tieStart: boolean;
  /** The note continues a tie from a preceding note of the same pitch. */
  readonly tieStop: boolean;
  readonly noteRef: NoteRef;
}

/** Tempo from a beat onward, in quarter notes per minute. */
export interface TempoChange {
  readonly beat: number;
  readonly bpm: number;
}

/** Everything a score adapter delivers to build a timeline. */
export interface TimelineInput {
  readonly notes: readonly NoteOccurrence[];
  readonly measures: readonly MeasureOccurrence[];
  readonly staves: readonly StaffInfo[];
  readonly tempo: readonly TempoChange[];
}

/** A key to press: one struck note, with tied continuations merged into its duration. */
export interface TimelineEvent {
  readonly startBeat: number;
  readonly durationBeats: number;
  readonly midi: number;
  readonly hand: Hand;
  readonly staff: StaffRef;
  /** Index of the MeasureOccurrence the note starts in. */
  readonly measure: number;
  /** The struck note first, then the written notes tied to it, in playback order. */
  readonly noteRefs: readonly NoteRef[];
}

export interface Timeline {
  /** Sorted by startBeat, then by pitch. */
  readonly events: readonly TimelineEvent[];
  /** In playback order, contiguous: each measure starts where the previous one ends. */
  readonly measures: readonly MeasureOccurrence[];
  /** Sorted by beat; the first change is at beat 0. */
  readonly tempo: readonly TempoChange[];
  readonly durationBeats: number;
}
