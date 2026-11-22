import type { NoteSpelling, NoteStep } from '../timeline/types';

/** Fixed-do solfège (do re mi, as taught in Belgium) or letter names (C D E). */
export type NoteNaming = 'solfege' | 'letter';

const STEP_NAMES: Record<NoteNaming, Record<NoteStep, string>> = {
  solfege: { C: 'do', D: 're', E: 'mi', F: 'fa', G: 'sol', A: 'la', B: 'si' },
  letter: { C: 'C', D: 'D', E: 'E', F: 'F', G: 'G', A: 'A', B: 'B' },
};

const ACCIDENTALS = new Map([
  [-2, '𝄫'],
  [-1, '♭'],
  [0, ''],
  [1, '♯'],
  [2, '𝄪'],
]);

/** Spelling of each pitch class without a written note: sharps for the black keys. */
const SPELLING_BY_PITCH_CLASS: readonly NoteSpelling[] = [
  { step: 'C', alter: 0 },
  { step: 'C', alter: 1 },
  { step: 'D', alter: 0 },
  { step: 'D', alter: 1 },
  { step: 'E', alter: 0 },
  { step: 'F', alter: 0 },
  { step: 'F', alter: 1 },
  { step: 'G', alter: 0 },
  { step: 'G', alter: 1 },
  { step: 'A', alter: 0 },
  { step: 'A', alter: 1 },
  { step: 'B', alter: 0 },
];

/** Name of a written note without octave, e.g. "si♭" or "B♭". */
export function spelledName(spelling: NoteSpelling, naming: NoteNaming): string {
  return STEP_NAMES[naming][spelling.step] + (ACCIDENTALS.get(spelling.alter) ?? '');
}

/** Name of a key that has no written note to follow, e.g. "do" or "C". */
export function keyName(midi: number, naming: NoteNaming): string {
  const spelling = SPELLING_BY_PITCH_CLASS[((midi % 12) + 12) % 12];
  return spelling ? spelledName(spelling, naming) : '';
}
