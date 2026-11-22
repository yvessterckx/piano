/**
 * Test scores served by the dev server (tools/vite-plugin-dev-fixtures.ts), to open them without
 * a file picker during development. Not available in a production build.
 */
export const DEV_FIXTURES_PATH = '/__fixtures/';

export async function listDevFixtures(): Promise<string[]> {
  const response = await fetch(DEV_FIXTURES_PATH);
  if (!response.ok) throw new Error(`Could not list the test scores (${response.status}).`);
  return (await response.json()) as string[];
}

/** Fetches a test score as a Blob, the same form as a file picked by the user. */
export async function fetchDevFixture(name: string): Promise<Blob> {
  const response = await fetch(DEV_FIXTURES_PATH + encodeURIComponent(name));
  if (!response.ok) throw new Error(`Could not load the test score ${name} (${response.status}).`);
  return response.blob();
}
