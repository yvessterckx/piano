import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Guards the copyright rule for this public repository: every score in tests/fixtures must be
 * documented in its README (source and license), and a downloaded score must match the checksum
 * recorded there. A score that is not documented fails the build, so a private or purchased
 * file cannot be published by accident.
 */
const FIXTURES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const README = readFileSync(path.join(FIXTURES_DIR, 'README.md'), 'utf8');
const SCORE_EXTENSIONS = new Set(['.xml', '.musicxml', '.mxl', '.mscz', '.mscx', '.mid', '.midi']);

const scores = readdirSync(FIXTURES_DIR).filter((name) =>
  SCORE_EXTENSIONS.has(path.extname(name).toLowerCase()),
);

describe('test scores', () => {
  it.each(scores)('%s is documented in tests/fixtures/README.md', (name) => {
    expect(README).toContain(`\`${name}\``);
  });

  it.each(scores.filter((name) => !name.startsWith('handmade-')))(
    '%s matches the checksum in the README',
    (name) => {
      const hash = createHash('sha256')
        .update(readFileSync(path.join(FIXTURES_DIR, name)))
        .digest('hex');
      expect(README).toContain(`${hash}  ${name}`);
    },
  );

  it('handmade scores are marked as created for this project', () => {
    for (const name of scores.filter((n) => n.startsWith('handmade-'))) {
      expect(readFileSync(path.join(FIXTURES_DIR, name), 'utf8')).toContain(
        'Created for this project',
      );
    }
  });
});
