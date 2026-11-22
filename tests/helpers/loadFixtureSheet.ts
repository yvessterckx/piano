import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import type { MusicSheet } from 'opensheetmusicdisplay';

const FIXTURES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../fixtures');

/**
 * Loads a test score with OSMD (without rendering it). Needs a DOM: use it in tests that run in
 * the jsdom environment. MXL files are passed as a Blob, like a file picked in the browser.
 */
export async function loadFixtureSheet(name: string): Promise<MusicSheet> {
  const bytes = readFileSync(path.join(FIXTURES_DIR, name));
  const content = name.endsWith('.mxl') ? new Blob([bytes]) : bytes.toString('utf8');
  const container = document.createElement('div');
  document.body.append(container);
  const osmd = new OpenSheetMusicDisplay(container, { autoResize: false, backend: 'svg' });
  await osmd.load(content);
  return osmd.Sheet;
}
