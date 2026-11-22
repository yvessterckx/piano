// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { loadFixtureSheet } from '../../../tests/helpers/loadFixtureSheet';
import { buildTimeline } from '../../timeline/buildTimeline';
import type { Timeline } from '../../timeline/types';
import { extractTimelineInput } from './extractTimelineInput';

async function timelineOf(fixture: string): Promise<Timeline> {
  const sheet = await loadFixtureSheet(fixture);
  return buildTimeline(extractTimelineInput(sheet).input);
}

/** [startBeat, durationBeats, midi, hand] per event, for compact assertions. */
function summary(timeline: Timeline): [number, number, number, string][] {
  return timeline.events.map((e) => [e.startBeat, e.durationBeats, e.midi, e.hand]);
}

function labels(timeline: Timeline): string[] {
  return timeline.measures.map((m) => m.label);
}

function range(from: number, to: number): string[] {
  return Array.from({ length: to - from + 1 }, (_, i) => String(from + i));
}

describe('handmade scores (exact results)', () => {
  it('merges ties and keeps chords in both hands', async () => {
    const timeline = await timelineOf('handmade-tied-chords.musicxml');

    expect(summary(timeline)).toEqual([
      [0, 6, 48, 'left'],
      [0, 6, 55, 'left'],
      [0, 3, 76, 'right'],
      [0, 2, 79, 'right'],
      [2, 1, 84, 'right'],
      [3, 3, 74, 'right'],
      [6, 2, 41, 'left'],
      [6, 2, 48, 'left'],
      [6, 2, 72, 'right'],
    ]);
    expect(timeline.events.find((e) => e.midi === 76)?.noteRefs).toHaveLength(2);
    expect(timeline.tempo).toEqual([{ beat: 0, bpm: 100 }]);
    expect(timeline.durationBeats).toBe(8);
  });

  it('unrolls a repeat with endings and ties into the right ending on each pass', async () => {
    const timeline = await timelineOf('handmade-repeat-voltas.musicxml');

    expect(labels(timeline)).toEqual(['1', '2', '3', '4', '2', '3', '5', '6']);
    expect(timeline.measures.map((m) => m.startBeat)).toEqual([0, 4, 8, 12, 16, 20, 24, 28]);
    expect(summary(timeline)).toEqual([
      [0, 4, 60, 'right'],
      [4, 4, 62, 'right'],
      [8, 6, 64, 'right'],
      [14, 2, 65, 'right'],
      [16, 4, 62, 'right'],
      [20, 6, 64, 'right'],
      [26, 2, 67, 'right'],
      [28, 4, 72, 'right'],
    ]);

    const [firstPass, secondPass] = timeline.events.filter((e) => e.midi === 64);
    expect(firstPass?.noteRefs[0]).toBe(secondPass?.noteRefs[0]);
    expect(firstPass?.noteRefs[1]).not.toBe(secondPass?.noteRefs[1]);
    expect(timeline.durationBeats).toBe(32);
  });

  it('jumps back for a da capo and stops at Fine', async () => {
    const timeline = await timelineOf('handmade-da-capo-al-fine.musicxml');

    expect(labels(timeline)).toEqual(['1', '2', '3', '4', '1', '2']);
    expect(summary(timeline).map(([start, , midi]) => [start, midi])).toEqual([
      [0, 60],
      [2, 62],
      [4, 64],
      [6, 65],
      [8, 60],
      [10, 62],
    ]);
    expect(timeline.durationBeats).toBe(12);
  });

  it('handles a pickup measure and one part per hand', async () => {
    const timeline = await timelineOf('handmade-pickup-two-parts.musicxml');

    expect(timeline.measures.map((m) => [m.label, m.startBeat, m.durationBeats])).toEqual([
      ['0', 0, 1],
      ['1', 1, 3],
      ['2', 4, 3],
    ]);
    expect(summary(timeline)).toEqual([
      [0, 1, 67, 'right'],
      [1, 3, 48, 'left'],
      [1, 2, 72, 'right'],
      [3, 1, 76, 'right'],
      [4, 3, 43, 'left'],
      [4, 3, 74, 'right'],
    ]);
    expect(timeline.tempo).toEqual([{ beat: 0, bpm: 90 }]);
    expect(timeline.durationBeats).toBe(7);
  });
});

describe('public-domain scores', () => {
  it('Clementi: plays both sections twice', async () => {
    const timeline = await timelineOf('clementi-sonatina-op36-no1-mvt1.xml');

    expect(labels(timeline)).toEqual([
      ...range(1, 15),
      ...range(1, 15),
      ...range(16, 38),
      ...range(16, 38),
    ]);
    expect(timeline.durationBeats).toBe(76 * 4);
    expectWellFormed(timeline);
  });

  it('Joplin: takes the first ending, repeats, then takes the second ending', async () => {
    const timeline = await timelineOf('joplin-the-entertainer.xml');

    expect(labels(timeline)).toEqual([
      ...range(1, 4),
      ...range(5, 20),
      ...range(5, 19),
      '21',
      ...range(22, 37),
      ...range(22, 36),
      '38',
      ...range(39, 54),
      ...range(55, 70),
      ...range(55, 69),
      '71',
      ...range(72, 75),
      ...range(76, 91),
      ...range(76, 90),
      '92',
    ]);
    expect(timeline.durationBeats).toBe(152 * 2);
    expectWellFormed(timeline);
  });

  it('Schumann: repeats from the pickup and keeps unnumbered pickup measures', async () => {
    const timeline = await timelineOf('schumann-wild-horseman-op68-no8.mxl');
    const firstSection = ['0', ...range(1, 8)];

    expect(labels(timeline)).toEqual([
      ...firstSection,
      ...firstSection,
      '', // "X1" in the file: unnumbered pickup
      ...range(9, 16),
      '', // "X2" in the file
      ...range(17, 24),
    ]);
    expect(timeline.durationBeats).toBe(96);
    expectWellFormed(timeline);
  });

  it('Bach: merges the held notes written as ties', async () => {
    const sheet = await loadFixtureSheet('bach-prelude-c-major-bwv846.xml');
    const { input } = extractTimelineInput(sheet);
    const timeline = buildTimeline(input);

    expect(labels(timeline)).toEqual(range(1, 35));
    expect(timeline.durationBeats).toBe(35 * 4);
    expect(input.notes.filter((n) => n.tieStart).length).toBeGreaterThan(0);
    expect(timeline.events.length).toBe(
      input.notes.length - input.notes.filter((n) => n.tieStop).length,
    );
    expectWellFormed(timeline);
  });
});

/** Invariants every timeline of a piano score must satisfy. */
function expectWellFormed(timeline: Timeline): void {
  timeline.measures.forEach((measure, index) => {
    expect(measure.index).toBe(index);
    const previous = timeline.measures[index - 1];
    if (previous)
      expect(measure.startBeat).toBeCloseTo(previous.startBeat + previous.durationBeats, 6);
    expect(measure.durationBeats).toBeGreaterThan(0);
  });

  for (const [index, event] of timeline.events.entries()) {
    expect(event.durationBeats).toBeGreaterThan(0);
    expect(event.midi).toBeGreaterThanOrEqual(21);
    expect(event.midi).toBeLessThanOrEqual(108);
    expect(event.startBeat + event.durationBeats).toBeLessThanOrEqual(
      timeline.durationBeats + 1e-6,
    );
    expect(event.noteRefs.length).toBeGreaterThan(0);
    const previous = timeline.events[index - 1];
    if (previous) expect(event.startBeat).toBeGreaterThanOrEqual(previous.startBeat);
  }

  const hands = new Set(timeline.events.map((e) => e.hand));
  expect(hands).toEqual(new Set(['left', 'right']));
}
