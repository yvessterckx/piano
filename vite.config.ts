import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { devFixtures } from './tools/vite-plugin-dev-fixtures.ts';

export default defineConfig({
  // Relative asset URLs: the same build works at https://yvessterckx.github.io/piano/ and at any other path.
  base: './',
  plugins: [devFixtures(fileURLToPath(new URL('./tests/fixtures', import.meta.url)))],
  build: {
    sourcemap: true,
    // OSMD is a single 1.5 MB module. It is loaded on demand in its own chunk (see ui/practicePage.ts)
    // and cannot be split further, so the default 500 kB warning would only repeat that.
    chunkSizeWarningLimit: 1600,
  },
  test: {
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
  },
});
