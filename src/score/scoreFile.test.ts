import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { looksLikeMusicXml } from './scoreFile';

const FIXTURES_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../tests/fixtures',
);
const SCORES = readdirSync(FIXTURES_DIR).filter((name) =>
  ['.xml', '.musicxml', '.mxl'].includes(path.extname(name)),
);

const text = (content: string) => new Blob([content]);
const bytes = (...content: number[]) => new Blob([new Uint8Array(content)]);

describe('looksLikeMusicXml', () => {
  it.each(SCORES)('recognizes the test score %s', async (name) => {
    const file = new Blob([readFileSync(path.join(FIXTURES_DIR, name))]);
    expect(await looksLikeMusicXml(file)).toBe(true);
  });

  it('recognizes XML after a byte order mark or blank lines', async () => {
    expect(await looksLikeMusicXml(text('﻿<?xml version="1.0"?>'))).toBe(true);
    expect(await looksLikeMusicXml(text('\r\n\t <score-partwise>'))).toBe(true);
  });

  it('recognizes a zip archive (compressed MusicXML)', async () => {
    expect(await looksLikeMusicXml(bytes(0x50, 0x4b, 0x03, 0x04, 0x14, 0x00))).toBe(true);
  });

  it('turns down files of other kinds', async () => {
    expect(await looksLikeMusicXml(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a))).toBe(false); // PNG
    expect(await looksLikeMusicXml(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe(false); // JPEG
    expect(await looksLikeMusicXml(text('%PDF-1.7'))).toBe(false);
    expect(await looksLikeMusicXml(text('Just some notes'))).toBe(false);
    expect(await looksLikeMusicXml(text('   '))).toBe(false);
    expect(await looksLikeMusicXml(text(''))).toBe(false);
  });
});
