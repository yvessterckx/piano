import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Timeline, TimelineEvent } from '../timeline/types';
import { Transport } from './Transport';
import type { NotePlayer, ScheduledNote } from './Transport';

/** One note per beat, midi 60 + beat, at 60 bpm: beat n starts n seconds into the piece. */
function scale(beats: number, bpm = 60): Timeline {
  const events: TimelineEvent[] = Array.from({ length: beats }, (_, beat) => ({
    startBeat: beat,
    durationBeats: 1,
    soundingEndBeat: beat + 1,
    midi: 60 + beat,
    spelling: { step: 'C', alter: 0 },
    hand: beat % 2 === 0 ? 'right' : 'left',
    staff: { partIndex: 0, staffInPart: 0 },
    measure: Math.floor(beat / 4),
    noteRefs: [beat],
  }));
  const measures = Array.from({ length: beats / 4 }, (_, index) => ({
    index,
    sourceIndex: index,
    label: String(index + 1),
    startBeat: index * 4,
    durationBeats: 4,
  }));
  return { events, measures, tempo: [{ beat: 0, bpm }], pedal: [], durationBeats: beats };
}

class FakePlayer implements NotePlayer {
  played: ScheduledNote[] = [];
  stops = 0;
  play(note: ScheduledNote): void {
    this.played.push(note);
  }
  stopAll(): void {
    this.stops++;
  }
  midis(): number[] {
    return this.played.map((note) => note.midi);
  }
}

const START_DELAY = 0.05;

describe('Transport', () => {
  let clock: { currentTime: number };
  let player: FakePlayer;

  beforeEach(() => {
    vi.useFakeTimers();
    clock = { currentTime: 10 };
    player = new FakePlayer();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Advances the audio clock and runs the scheduler like its timer would. */
  function advance(transport: Transport, seconds: number, step = 0.025): void {
    const end = clock.currentTime + seconds;
    while (clock.currentTime < end - 1e-9) {
      clock.currentTime = Math.min(clock.currentTime + step, end);
      transport.tick();
    }
  }

  it('schedules only the notes within the lookahead window', () => {
    const transport = new Transport(scale(8), clock, player);
    transport.play();

    expect(player.played).toEqual([
      { midi: 60, hand: 'right', time: 10 + START_DELAY, duration: 1 },
    ]);
  });

  it('schedules every note exactly once, on time', () => {
    const transport = new Transport(scale(8), clock, player);
    transport.play();
    advance(transport, 3);

    expect(player.midis()).toEqual([60, 61, 62, 63]);
    expect(player.played.map((note) => Number((note.time - 10 - START_DELAY).toFixed(9)))).toEqual([
      0, 1, 2, 3,
    ]);
  });

  it('reports the position from the audio clock', () => {
    const transport = new Transport(scale(8), clock, player);
    transport.play();
    advance(transport, 2.55);

    expect(transport.position()).toBeCloseTo(2.5, 6);
    expect(transport.positionAt(clock.currentTime - 0.5)).toBeCloseTo(2, 6);
  });

  it('lets notes sound on with the pedal, and only as long as held without it', () => {
    const timeline = scale(8);
    const pedaled: Timeline = {
      ...timeline,
      events: timeline.events.map((event) => ({ ...event, soundingEndBeat: 4 })),
      pedal: [{ startBeat: 0, endBeat: 4 }],
    };
    const transport = new Transport(pedaled, clock, player);
    transport.play();
    advance(transport, 1.5);
    transport.setPedal(false);
    advance(transport, 1);

    expect(player.played.map((note) => [note.midi, Number(note.duration.toFixed(9))])).toEqual([
      [60, 4],
      [61, 3],
      [62, 1],
    ]);
  });

  it('plays slower with a lower tempo factor', () => {
    const transport = new Transport(scale(8), clock, player);
    transport.setTempoFactor(0.5);
    transport.play();
    advance(transport, 3);

    expect(player.midis()).toEqual([60, 61]);
    expect(player.played[1]?.time).toBeCloseTo(10 + START_DELAY + 2, 6);
    expect(player.played[1]?.duration).toBeCloseTo(2, 6);
  });

  it('keeps the position when the tempo changes while playing', () => {
    const transport = new Transport(scale(8), clock, player);
    transport.play();
    advance(transport, 2.05);
    transport.setTempoFactor(0.5);

    expect(transport.position()).toBeCloseTo(2, 6);
    advance(transport, 2.05);
    expect(transport.position()).toBeCloseTo(3, 6);
  });

  it('pauses, silences and resumes where it stopped', () => {
    const transport = new Transport(scale(8), clock, player);
    transport.play();
    advance(transport, 1.55);
    transport.pause();

    expect(transport.playing).toBe(false);
    expect(transport.position()).toBeCloseTo(1.5, 6);
    expect(player.stops).toBeGreaterThan(0);

    player.played = [];
    transport.play();
    advance(transport, 1);
    expect(player.midis()).toEqual([62]);
  });

  it('seeks while playing and while paused', () => {
    const transport = new Transport(scale(8), clock, player);
    transport.seek(5);
    expect(transport.position()).toBe(5);

    transport.play();
    advance(transport, 0.5);
    transport.seek(2);
    player.played = [];
    advance(transport, 1.1);

    expect(player.midis()).toEqual([63]);
  });

  it('wraps around a loop and keeps the position inside it', () => {
    const transport = new Transport(scale(8), clock, player);
    transport.setLoop({ startBeat: 4, endBeat: 6 });
    expect(transport.position()).toBe(4);

    transport.play();
    advance(transport, 4.5);

    expect(player.midis()).toEqual([64, 65, 64, 65, 64]);
    expect(transport.position()).toBeCloseTo(4.45, 6);
  });

  it('cuts a note that would sound past the end of the loop', () => {
    const timeline = scale(8);
    const long = { ...timeline.events[4], durationBeats: 3, soundingEndBeat: 7 } as TimelineEvent;
    const transport = new Transport(
      { ...timeline, events: timeline.events.map((e, i) => (i === 4 ? long : e)) },
      clock,
      player,
    );
    transport.setLoop({ startBeat: 4, endBeat: 6 });
    transport.play();

    expect(player.played[0]?.duration).toBeCloseTo(2, 6);
  });

  it('ends a loop when seeking outside it', () => {
    const transport = new Transport(scale(8), clock, player);
    transport.setLoop({ startBeat: 4, endBeat: 6 });
    transport.seek(1);

    expect(transport.loop).toBeUndefined();
    expect(transport.position()).toBe(1);
  });

  it('stops at the end and starts again from the beginning', () => {
    const transport = new Transport(scale(4), clock, player);
    const changes = vi.fn();
    transport.onChange(changes);
    transport.play();
    advance(transport, 4.2);

    expect(transport.playing).toBe(false);
    expect(transport.position()).toBe(4);
    expect(changes).toHaveBeenCalledTimes(2);

    player.played = [];
    transport.play();
    expect(player.midis()).toEqual([60]);
  });

  it('runs its own scheduling timer while playing', () => {
    const transport = new Transport(scale(8), clock, player);
    transport.play();
    clock.currentTime += 1;
    vi.advanceTimersByTime(25);

    expect(player.midis()).toEqual([60, 61]);
    transport.pause();
    clock.currentTime += 2;
    vi.advanceTimersByTime(100);
    expect(player.midis()).toEqual([60, 61]);
  });
});
