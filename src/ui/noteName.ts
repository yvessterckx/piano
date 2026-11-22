const PITCH_CLASSES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'] as const;

/** Scientific pitch name of a MIDI note number: 60 is C4 (middle C), 69 is A4. */
export function noteName(midi: number): string {
  const pitchClass = PITCH_CLASSES[((midi % 12) + 12) % 12] ?? '?';
  const octave = Math.floor(midi / 12) - 1;
  return `${pitchClass}${octave}`;
}
