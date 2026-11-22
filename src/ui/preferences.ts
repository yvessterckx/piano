import type { NoteNaming } from '../keyboard/noteNames';

/**
 * Choices remembered on this device. Storage can be unavailable (private browsing, blocked site
 * data): reads then fall back to the default and writes only last for this visit.
 */
const NAMING_KEY = 'piano.noteNaming';
const SCORE_SCALE_KEY = 'piano.scoreScale';
const ROTATE_HINT_KEY = 'piano.rotateHintDismissed';

/** The sizes the score can be shown at; 1 is print size (a 40 px staff). */
export const SCORE_SCALES = [0.7, 0.8, 0.9, 1, 1.1, 1.25, 1.4, 1.6] as const;
const DEFAULT_SCORE_SCALE = 1;

export function loadNoteNaming(): NoteNaming {
  return read(NAMING_KEY) === 'letter' ? 'letter' : 'solfege';
}

export function saveNoteNaming(naming: NoteNaming): void {
  write(NAMING_KEY, naming);
}

export function loadScoreScale(): number {
  const stored = Number(read(SCORE_SCALE_KEY));
  return SCORE_SCALES.find((scale) => scale === stored) ?? DEFAULT_SCORE_SCALE;
}

export function saveScoreScale(scale: number): void {
  write(SCORE_SCALE_KEY, String(scale));
}

export function loadRotateHintDismissed(): boolean {
  return read(ROTATE_HINT_KEY) === 'true';
}

export function saveRotateHintDismissed(): void {
  write(ROTATE_HINT_KEY, 'true');
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: the choice lasts for this visit only.
  }
}
