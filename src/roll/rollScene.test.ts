import { describe, expect, it } from 'vitest';
import { KEYBOARD_RANGES, keyboardGeometry } from '../keyboard/keys';
import type { Hand, PedalSpan, Timeline, TimelineEvent } from '../timeline/types';
import { prepareRollPiece, rollScene } from './rollScene';
import type { RollView } from './rollScene';

/** At 60 bpm a beat is a second; 600 px for 6 seconds makes 100 px per beat. */
const HEIGHT = 600;

function event(
  startBeat: number,
  durationBeats: number,
  midi: number,
  hand: Hand = 'right',
  soundingEndBeat = startBeat + durationBeats,
): TimelineEvent {
  return {
    startBeat,
    durationBeats,
    soundingEndBeat,
    midi,
    spelling: { step: 'C', alter: 0 },
    hand,
    staff: { partIndex: 0, staffInPart: hand === 'right' ? 0 : 1 },
    measure: Math.floor(startBeat / 4),
    noteRefs: [0],
  };
}

function piece(
  events: TimelineEvent[],
  pedal: PedalSpan[] = [],
): ReturnType<typeof prepareRollPiece> {
  const timeline: Timeline = {
    events: [...events].sort((a, b) => a.startBeat - b.startBeat || a.midi - b.midi),
    measures: [0, 1, 2, 3].map((index) => ({
      index,
      sourceIndex: index,
      label: String(index + 1),
      startBeat: index * 4,
      durationBeats: 4,
    })),
    tempo: [{ beat: 0, bpm: 60 }],
    pedal,
    durationBeats: 16,
  };
  return prepareRollPiece(timeline);
}

/** 52 white keys of 20 px: wide enough for names on the bars. */
const WIDE = keyboardGeometry(KEYBOARD_RANGES[88], 1040, false);
const lane = (midi: number) => WIDE.keys.find((key) => key.midi === midi);

function view(fields: Partial<RollView> = {}): RollView {
  return {
    width: 1040,
    height: HEIGHT,
    position: 0,
    loop: undefined,
    secondsVisible: 6,
    hands: { left: 'play', right: 'play' },
    naming: 'letter',
    pedal: true,
    geometry: WIDE,
    ...fields,
  };
}

describe('rollScene', () => {
  it('draws a coming note above the hit line, as long as the key is held, over its key', () => {
    const scene = rollScene(piece([event(1, 1, 60)]), view());

    expect(scene.bars).toEqual([
      {
        left: (lane(60)?.left ?? 0) + 1,
        width: (lane(60)?.width ?? 0) - 2,
        top: 402, // beat 2, less the gap that sets a repeated key apart
        height: 98, // down to beat 1 at y 500
        hand: 'right',
        black: false,
        faint: false,
      },
    ]);
  });

  it('lets a note being played slide behind the keyboard', () => {
    const scene = rollScene(piece([event(0, 2, 60)]), view({ position: 1 }));

    expect(scene.bars[0]).toMatchObject({ top: 502, height: 98 });
    expect(scene.glows).toEqual([{ left: lane(60)?.left, width: lane(60)?.width, hand: 'right' }]);
  });

  it('draws a thin tail while the pedal holds the sound, and none without the pedal', () => {
    const notes = [event(0, 1, 60, 'right', 3)];
    const withPedal = rollScene(piece(notes), view());
    const withoutPedal = rollScene(piece(notes), view({ pedal: false }));

    expect(withPedal.bars[0]).toMatchObject({ top: 500, height: 100 });
    expect(withPedal.tails).toHaveLength(1);
    expect(withPedal.tails[0]).toMatchObject({ top: 302, height: 198, width: 6 });
    expect(withoutPedal.tails).toEqual([]);
    expect(withoutPedal.bars[0]).toMatchObject({ top: 502, height: 98 });
  });

  it('draws the other hand faintly, or not at all when it is muted', () => {
    const notes = [event(1, 1, 48, 'left'), event(1, 1, 72)];
    const faint = rollScene(piece(notes), view({ hands: { left: 'faint', right: 'play' } }));
    const hidden = rollScene(piece(notes), view({ hands: { left: 'hidden', right: 'play' } }));

    expect(faint.bars.map((bar) => [bar.hand, bar.faint])).toEqual([
      ['left', true],
      ['right', false],
    ]);
    expect(faint.labels.map((label) => label.hand)).toEqual(['right']);
    expect(hidden.bars.map((bar) => bar.hand)).toEqual(['right']);
  });

  it('names the notes on the bars where the keys are wide enough', () => {
    const notes = [event(1, 1, 60)];
    const wide = rollScene(piece(notes), view());
    const narrow = rollScene(
      piece(notes),
      view({ geometry: keyboardGeometry(KEYBOARD_RANGES[88], 390, false) }),
    );

    expect(wide.labels).toEqual([
      { left: (lane(60)?.left ?? 0) + 1, width: 17, bottom: 497, text: 'C', hand: 'right' },
    ]);
    expect(narrow.labels).toEqual([]);
  });

  it('joins the notes of a chord, per hand', () => {
    const scene = rollScene(
      piece([event(1, 1, 60), event(1, 1, 64), event(1, 1, 48, 'left')]),
      view(),
    );

    expect(scene.chordLines).toEqual([
      {
        x1: (lane(60)?.left ?? 0) + 1 + 8.5,
        x2: (lane(64)?.left ?? 0) + 1 + 8.5,
        y: 500,
        hand: 'right',
      },
    ]);
  });

  it('draws measure lines with their numbers and faint lines on the beats', () => {
    const scene = rollScene(piece([]), view({ position: 0.5 }));

    expect(scene.beatLines).toEqual([550, 450, 350, 150, 50]);
    expect(scene.measureLines).toEqual([{ y: 250, label: '2' }]);
  });

  it('shows the start of the loop again after its end', () => {
    const scene = rollScene(
      piece([event(0, 1, 60), event(1, 1, 62), event(4, 1, 64)]),
      view({ position: 1, loop: { startBeat: 0, endBeat: 2 } }),
    );

    // Beat 1 is now; the loop ends at beat 2 (y 500) and starts again with beat 0 there.
    expect(scene.loopLines).toEqual([
      { y: 500, label: 'Loop: back to m. 1' },
      { y: 300, label: 'Loop: back to m. 1' },
      { y: 100, label: 'Loop: back to m. 1' },
    ]);
    const name = (left: number): string => (left === (lane(60)?.left ?? 0) + 1 ? 'C' : 'D');
    expect(scene.bars.map((bar) => [name(bar.left), bar.top + bar.height])).toEqual([
      ['D', 600], // being played
      ['C', 500], // the second pass
      ['D', 400],
      ['C', 300], // the third pass
      ['D', 200],
      ['C', 100], // the fourth pass, cut off by the top edge
    ]);
    expect(scene.bars.some((bar) => bar.left === (lane(64)?.left ?? 0) + 1)).toBe(false);
  });

  it('fills the pedal strip where the pedal is down, with a gap before each change', () => {
    const geometry = keyboardGeometry(KEYBOARD_RANGES[88], 1064, true);
    const scene = rollScene(
      piece(
        [],
        [
          { startBeat: 0, endBeat: 2 },
          { startBeat: 2, endBeat: 3 },
        ],
      ),
      view({ geometry }),
    );

    expect(scene.pedalStrip).toEqual(geometry.pedal);
    expect(scene.pedal).toEqual([
      { top: 404, bottom: 600 },
      { top: 300, bottom: 400 },
    ]);
    expect(
      rollScene(piece([], [{ startBeat: 0, endBeat: 2 }]), view({ geometry, pedal: false })).pedal,
    ).toEqual([]);
  });
});
