import type { NoteNaming } from '../keyboard/noteNames';

/**
 * Choices remembered on this device. Storage can be unavailable (private browsing, blocked site
 * data): reads then fall back to the default and writes only last for this visit.
 */
const NAMING_KEY = 'piano.noteNaming';

export function loadNoteNaming(): NoteNaming {
  try {
    return localStorage.getItem(NAMING_KEY) === 'letter' ? 'letter' : 'solfege';
  } catch {
    return 'solfege';
  }
}

export function saveNoteNaming(naming: NoteNaming): void {
  try {
    localStorage.setItem(NAMING_KEY, naming);
  } catch {
    // Storage unavailable: the choice lasts for this visit only.
  }
}
