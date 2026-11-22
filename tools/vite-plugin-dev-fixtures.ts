import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Plugin } from 'vite';
import { DEV_FIXTURES_PATH } from '../src/ui/devFixtures.ts';

const SCORE_EXTENSIONS = new Set(['.musicxml', '.xml', '.mxl']);

/**
 * Serves the test scores during development only (`npm run dev`), so they can be opened without
 * picking a file each time.
 *
 * Production builds never contain them: the plugin only applies to the dev server, and no source
 * file imports a score. Only files listed in the folder are served, by exact name.
 */
export function devFixtures(fixturesDir: string): Plugin {
  async function listScores(): Promise<string[]> {
    const names = await readdir(fixturesDir);
    return names.filter((name) => SCORE_EXTENSIONS.has(path.extname(name))).sort();
  }

  return {
    name: 'piano:dev-fixtures',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(DEV_FIXTURES_PATH, (request, response, next) => {
        const requested = decodeURIComponent(
          (request.url ?? '/').replace(/^\//, '').split('?')[0] ?? '',
        );
        listScores()
          .then(async (names) => {
            if (requested === '') {
              response.setHeader('Content-Type', 'application/json');
              response.end(JSON.stringify(names));
              return;
            }
            if (!names.includes(requested)) {
              next();
              return;
            }
            const contents = await readFile(path.join(fixturesDir, requested));
            response.setHeader('Content-Type', 'application/octet-stream');
            response.end(contents);
          })
          .catch(next);
      });
    },
  };
}
