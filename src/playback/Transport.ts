import { BEAT_EPSILON } from '../timeline/beats';
import { firstEventFrom } from '../timeline/queries';
import type { Hand, Timeline } from '../timeline/types';
import { createTempoMap } from './tempoMap';
import type { TempoMap } from './tempoMap';

/** The clock playback runs on: an AudioContext in the app, a plain object in tests. */
export interface AudioClock {
  readonly currentTime: number;
}

export interface ScheduledNote {
  readonly midi: number;
  readonly hand: Hand;
  /** Start time on the audio clock, in seconds. */
  readonly time: number;
  readonly duration: number;
}

/** Plays notes at times on the audio clock (see playback/PianoSound for the real one). */
export interface NotePlayer {
  play(note: ScheduledNote): void;
  /** Silences every note: the sounding ones and the ones scheduled to start later. */
  stopAll(): void;
}

export interface LoopRange {
  readonly startBeat: number;
  readonly endBeat: number;
}

export const MIN_TEMPO_FACTOR = 0.25;
export const MAX_TEMPO_FACTOR = 1;

/** How far ahead notes are handed to the audio engine. Short, so a pause or loop acts at once. */
const LOOKAHEAD_SECONDS = 0.15;
const TICK_INTERVAL_MS = 25;
/** Delay before the first note after play or seek, so it is not scheduled in the past. */
const START_DELAY_SECONDS = 0.05;

/** Playback is at `beat` at audio time `time`; it moves on at the current tempo from there. */
interface Anchor {
  readonly time: number;
  readonly beat: number;
}

/**
 * Plays a timeline: play, pause, seek, tempo and loop.
 *
 * The audio clock is the only source of time. Notes are scheduled a short time ahead (lookahead
 * scheduling); the position for the cursor and the keyboard is computed from the clock, never
 * the other way around. A loop adds an anchor at the audio time where playback wraps, so the
 * position stays right while the notes after the wrap are already scheduled.
 */
export class Transport {
  readonly #timeline: Timeline;
  readonly #clock: AudioClock;
  readonly #player: NotePlayer;
  readonly #tempo: TempoMap;
  readonly #listeners = new Set<() => void>();
  #tempoFactor = MAX_TEMPO_FACTOR;
  #pedal = true;
  #loop: LoopRange | undefined;
  #playing = false;
  #pausedBeat = 0;
  #anchors: Anchor[] = [];
  #scheduledUntil = 0;
  #endTime: number | undefined;
  #timer: ReturnType<typeof setInterval> | undefined;

  constructor(timeline: Timeline, clock: AudioClock, player: NotePlayer) {
    this.#timeline = timeline;
    this.#clock = clock;
    this.#player = player;
    this.#tempo = createTempoMap(timeline.tempo);
  }

  get playing(): boolean {
    return this.#playing;
  }

  get tempoFactor(): number {
    return this.#tempoFactor;
  }

  get loop(): LoopRange | undefined {
    return this.#loop;
  }

  /** Whether notes sound on while the sustain pedal is down (see TimelineEvent.soundingEndBeat). */
  get pedal(): boolean {
    return this.#pedal;
  }

  /**
   * Plays the sustain pedal as written, or every note only as long as its key is held. Applies to
   * the notes scheduled from now on; the ones already sounding keep their length.
   */
  setPedal(enabled: boolean): void {
    if (enabled === this.#pedal) return;
    this.#pedal = enabled;
    this.#emit();
  }

  /** The written tempo at a beat, in quarter notes per minute (before the tempo factor). */
  writtenBpmAt(beat: number): number {
    return this.#tempo.bpmAt(beat);
  }

  /** Calls the listener after every change of state (play, pause, seek, tempo, loop, end). */
  onChange(listener: () => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /** The current position in beats. */
  position(): number {
    return this.positionAt(this.#clock.currentTime);
  }

  /**
   * The position at a time on the audio clock. Pass the time that is being heard (current time
   * minus output latency) to draw the cursor in sync with the sound.
   */
  positionAt(time: number): number {
    if (!this.#playing) return this.#pausedBeat;
    const anchor = this.#anchorAt(time);
    const beat = Math.max(this.#beatAt(time, anchor), anchor.beat);
    return Math.min(beat, this.#loop?.endBeat ?? this.#timeline.durationBeats);
  }

  play(): void {
    if (this.#playing) return;
    let start = this.#pausedBeat;
    if (start >= this.#timeline.durationBeats - BEAT_EPSILON) start = 0;
    if (this.#loop && !this.#inLoop(start)) start = this.#loop.startBeat;
    this.#playing = true;
    this.#startFrom(start);
    this.#timer = setInterval(() => {
      this.tick();
    }, TICK_INTERVAL_MS);
    this.#emit();
  }

  pause(): void {
    if (!this.#playing) return;
    this.#pausedBeat = this.position();
    this.#stop();
    this.#emit();
  }

  /** Moves to a beat. Moving outside the loop ends the loop. */
  seek(beat: number): void {
    const target = Math.min(Math.max(beat, 0), this.#timeline.durationBeats);
    if (this.#loop && !this.#inLoop(target)) this.#loop = undefined;
    if (this.#playing) this.#startFrom(target);
    else this.#pausedBeat = target;
    this.#emit();
  }

  setTempoFactor(factor: number): void {
    const clamped = Math.min(Math.max(factor, MIN_TEMPO_FACTOR), MAX_TEMPO_FACTOR);
    if (this.#playing) {
      const beat = this.position();
      this.#tempoFactor = clamped;
      this.#startFrom(beat);
    } else {
      this.#tempoFactor = clamped;
    }
    this.#emit();
  }

  /** Sets or clears the loop. A position outside the new loop moves to its start. */
  setLoop(range: LoopRange | undefined): void {
    if (range && range.endBeat - range.startBeat <= BEAT_EPSILON) {
      throw new Error('A loop must be longer than zero beats.');
    }
    const beat = this.position();
    this.#loop = range;
    const target = range && !this.#inLoop(beat) ? range.startBeat : beat;
    if (this.#playing) this.#startFrom(target);
    else this.#pausedBeat = target;
    this.#emit();
  }

  /** Stops playback and listeners. The transport cannot be used afterwards. */
  dispose(): void {
    this.#stop();
    this.#listeners.clear();
  }

  /** Schedules the notes up to the lookahead horizon. Runs on a timer while playing. */
  tick(): void {
    if (!this.#playing) return;
    const now = this.#clock.currentTime;
    if (this.#endTime !== undefined && now >= this.#endTime) {
      this.#pausedBeat = this.#timeline.durationBeats;
      this.#stop();
      this.#emit();
      return;
    }
    this.#dropPassedAnchors(now);

    const horizon = now + LOOKAHEAD_SECONDS;
    let anchor = this.#anchors[this.#anchors.length - 1];
    while (anchor) {
      const segmentEnd = this.#loop?.endBeat ?? this.#timeline.durationBeats;
      const until = Math.min(this.#beatAt(horizon, anchor), segmentEnd);
      this.#schedule(this.#scheduledUntil, until, anchor, segmentEnd);
      this.#scheduledUntil = Math.max(this.#scheduledUntil, until);
      if (until < segmentEnd - BEAT_EPSILON) return;

      const segmentEndTime = this.#timeAt(segmentEnd, anchor);
      if (!this.#loop) {
        this.#endTime = segmentEndTime;
        return;
      }
      anchor = { time: segmentEndTime, beat: this.#loop.startBeat };
      this.#anchors.push(anchor);
      this.#scheduledUntil = this.#loop.startBeat;
    }
  }

  #startFrom(beat: number): void {
    this.#player.stopAll();
    this.#anchors = [{ time: this.#clock.currentTime + START_DELAY_SECONDS, beat }];
    this.#scheduledUntil = beat;
    this.#endTime = undefined;
    this.tick();
  }

  #stop(): void {
    this.#playing = false;
    clearInterval(this.#timer);
    this.#timer = undefined;
    this.#anchors = [];
    this.#endTime = undefined;
    this.#player.stopAll();
  }

  /**
   * Hands the events starting in [fromBeat, untilBeat) to the player. A note lasts as long as it
   * sounds (with the pedal, if played) and ends at segmentEnd at the latest.
   */
  #schedule(fromBeat: number, untilBeat: number, anchor: Anchor, segmentEnd: number): void {
    const events = this.#timeline.events;
    for (let i = firstEventFrom(events, fromBeat - BEAT_EPSILON); i < events.length; i++) {
      const event = events[i];
      if (!event || event.startBeat >= untilBeat - BEAT_EPSILON) break;
      const time = this.#timeAt(event.startBeat, anchor);
      const released = event.startBeat + event.durationBeats;
      const end = Math.min(this.#pedal ? event.soundingEndBeat : released, segmentEnd);
      this.#player.play({
        midi: event.midi,
        hand: event.hand,
        time,
        duration: this.#timeAt(end, anchor) - time,
      });
    }
  }

  #timeAt(beat: number, anchor: Anchor): number {
    const seconds = this.#tempo.secondsAt(beat) - this.#tempo.secondsAt(anchor.beat);
    return anchor.time + seconds / this.#tempoFactor;
  }

  #beatAt(time: number, anchor: Anchor): number {
    const seconds = (time - anchor.time) * this.#tempoFactor;
    return this.#tempo.beatAt(this.#tempo.secondsAt(anchor.beat) + seconds);
  }

  /** The last anchor at or before a time, or the first one before playback has started. */
  #anchorAt(time: number): Anchor {
    let found = this.#anchors[0];
    for (const anchor of this.#anchors) {
      if (anchor.time > time) break;
      found = anchor;
    }
    return found ?? { time, beat: this.#pausedBeat };
  }

  /** Keeps the anchor in effect now and the ones after it. */
  #dropPassedAnchors(now: number): void {
    const current = this.#anchorAt(now);
    this.#anchors = this.#anchors.filter((anchor) => anchor.time >= current.time);
  }

  #inLoop(beat: number): boolean {
    const loop = this.#loop;
    return !loop || (beat >= loop.startBeat - BEAT_EPSILON && beat < loop.endBeat - BEAT_EPSILON);
  }

  #emit(): void {
    for (const listener of this.#listeners) listener();
  }
}
