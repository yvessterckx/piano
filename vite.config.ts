import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { devFixtures } from './tools/vite-plugin-dev-fixtures.ts';

export default defineConfig({
  // Relative asset URLs: the same build works at https://yvessterckx.github.io/piano/ and at any other path.
  base: './',
  plugins: [devFixtures(fileURLToPath(new URL('./tests/fixtures', import.meta.url)))],
  build: {
    sourcemap: true,
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
