import { MIN_LABELED_KEY_PX } from '../keyboard/keys';
import type { KeyLane, KeyboardGeometry, Strip } from '../keyboard/keys';
import { spelledName } from '../keyboard/noteNames';
import type { NoteNaming } from '../keyboard/noteNames';
import { createTempoMap } from '../playback/tempoMap';
import type { TempoMap } from '../playback/tempoMap';
import { BEAT_EPSILON } from '../timeline/beats';
import { eventsSoundingAt, eventsSoundingIn } from '../timeline/queries';
import type { BeatSpan } from '../timeline/queries';
import type { Hand, Timeline } from '../timeline/types';

/**
 * The falling notes as pure data: which bars, tails, lines and labels to draw at a position, in
 * CSS pixels. No DOM, no canvas: FallingNotes draws the scene.
 *
 * Time runs upward: the hit line is the bottom edge (the top edge of the keyboard), and a note's
 * bar reaches it when its key is struck. The vertical scale is written time at 100% tempo, so the
 * picture of a passage stays the same at any tempo; a slower tempo only makes it move slower.
 */

/** How a hand's notes are drawn: as keys to play, faintly (the other hand), or not at all (muted). */
export type HandDisplay = 'play' | 'faint' | 'hidden';

export interface RollView {
  /** Size of the roll in CSS pixels; the hit line is at the bottom. */
  readonly width: number;
  readonly height: number;
  /** The playback position in beats. */
  readonly position: number;
  /** While looping, the notes after the loop's end are those of its start again. */
  readonly loop: BeatSpan | undefined;
  /** Written time shown at once, in seconds at 100% tempo. */
  readonly secondsVisible: number;
  readonly hands: Readonly<Record<Hand, HandDisplay>>;
  readonly naming: NoteNaming;
  /** Show notes held by the sustain pedal and the pedal itself (the strip in geometry.pedal). */
  readonly pedal: boolean;
  readonly geometry: KeyboardGeometry;
}

/** A rectangle: a note's bar (key held) or tail (sounding through the pedal). */
export interface NoteShape {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly hand: Hand;
  readonly black: boolean;
  readonly faint: boolean;
}

export interface LabelledLine {
  readonly y: number;
  readonly label: string;
}

export interface RollScene {
  /** Vertical guides at every C (strong) and F, at the left edge of the key. */
  readonly guides: readonly { readonly x: number; readonly strong: boolean }[];
  readonly beatLines: readonly number[];
  readonly measureLines: readonly LabelledLine[];
  /** Where a loop starts again, labelled with the measure it goes back to. */
  readonly loopLines: readonly LabelledLine[];
  readonly tails: readonly NoteShape[];
  readonly bars: readonly NoteShape[];
  /** Joins the onsets of the notes of one hand struck together. */
  readonly chordLines: readonly {
    readonly x1: number;
    readonly x2: number;
    readonly y: number;
    readonly hand: Hand;
  }[];
  /** Note names at the lower end of bars, where the keys are wide enough. */
  readonly labels: readonly {
    readonly left: number;
    readonly width: number;
    readonly bottom: number;
    readonly text: string;
    readonly hand: Hand;
  }[];
  /** The pedal lane, and where the pedal is down in it (top and bottom in pixels). */
  readonly pedalStrip: Strip | undefined;
  readonly pedal: readonly { readonly top: number; readonly bottom: number }[];
  /** Keys being held now, lit at the hit line. */
  readonly glows: readonly { readonly left: number; readonly width: number; readonly hand: Hand }[];
}

/** A piece prepared for the roll: its timeline and tempo map, made once per piece. */
export interface RollPiece {
  readonly timeline: Timeline;
  readonly tempo: TempoMap;
}

export function prepareRollPiece(timeline: Timeline): RollPiece {
  return { timeline, tempo: createTempoMap(timeline.tempo) };
}

/** Space taken off the end of a note, so a key struck again shows as a new bar. */
const NOTE_GAP_PX = 2;
/** Space before a pedal change in the pedal strip, like the notch in a pedal line. */
const PEDAL_CHANGE_GAP_PX = 4;
/** A note name needs this much bar height and lane width. */
const LABEL_MIN_HEIGHT_PX = 18;
const LABEL_MIN_WIDTH_PX = 13;
const LABEL_MARGIN_PX = 3;
/** Inset of a bar within its key, so neighbouring bars stay apart. */
const WHITE_INSET_PX = 1;
const BLACK_INSET_PX = 0.75;
/** Guard against a degenerate loop: never draw more passes than this. */
const MAX_LOOP_PASSES = 64;

/** A stretch of beats drawn from a vertical offset: the piece up to the loop end, then each pass. */
interface Segment {
  readonly from: number;
  readonly to: number;
  /** Seconds (at 100% tempo) between the position and the start of this segment. */
  readonly offset: number;
  readonly first: boolean;
}

export function rollScene(piece: RollPiece, view: RollView): RollScene {
  const { timeline, tempo } = piece;
  const lanes = lanesByMidi(view.geometry.keys);
  const pixelsPerSecond = view.height / view.secondsVisible;
  const namesOnBars = view.geometry.whiteKeyWidth >= MIN_LABELED_KEY_PX;
  const scene = {
    guides: guidesFor(view.geometry.keys),
    beatLines: [] as number[],
    measureLines: [] as LabelledLine[],
    loopLines: [] as LabelledLine[],
    tails: [] as NoteShape[],
    bars: [] as NoteShape[],
    chordLines: [] as RollScene['chordLines'][number][],
    labels: [] as RollScene['labels'][number][],
    pedalStrip: view.pedal ? view.geometry.pedal : undefined,
    pedal: [] as RollScene['pedal'][number][],
    glows: [] as RollScene['glows'][number][],
  };

  for (const segment of segments(piece, view)) {
    const segmentStart = tempo.secondsAt(segment.from);
    const y = (beat: number): number =>
      view.height - (segment.offset + tempo.secondsAt(beat) - segmentStart) * pixelsPerSecond;
    const visibleUntil = Math.min(
      segment.to,
      tempo.beatAt(segmentStart + view.secondsVisible - segment.offset),
    );
    const span = { startBeat: segment.from, endBeat: visibleUntil };
    if (visibleUntil <= segment.from + BEAT_EPSILON) continue;

    const events = eventsSoundingIn(timeline, span).filter(
      // A pass of a loop plays only the notes struck in it.
      (event) => segment.first || event.startBeat >= segment.from - BEAT_EPSILON,
    );
    const onsets = new Map<string, { hand: Hand; beat: number; centers: number[] }>();
    for (const event of events) {
      const display = view.hands[event.hand];
      const lane = lanes.get(event.midi);
      if (display === 'hidden' || !lane) continue;
      const faint = display === 'faint';
      const shape = { hand: event.hand, black: lane.black, faint };
      const left = lane.left + (lane.black ? BLACK_INSET_PX : WHITE_INSET_PX);
      const width = Math.max(lane.width - 2 * (lane.black ? BLACK_INSET_PX : WHITE_INSET_PX), 1);
      const released = Math.min(event.startBeat + event.durationBeats, segment.to);
      const silent = Math.min(view.pedal ? event.soundingEndBeat : released, segment.to);
      const hasTail = silent > released + BEAT_EPSILON;

      const bar = verticalSpan(y, event.startBeat, released, segment.from, view.height, !hasTail);
      if (bar) scene.bars.push({ ...shape, left, width, ...bar });
      if (hasTail) {
        const tail = verticalSpan(y, released, silent, segment.from, view.height, true);
        const tailWidth = Math.max(2, Math.round(width * 0.34));
        if (tail) {
          scene.tails.push({
            ...shape,
            left: left + (width - tailWidth) / 2,
            width: tailWidth,
            ...tail,
          });
        }
      }

      const struckHere = event.startBeat >= segment.from - BEAT_EPSILON;
      if (!struckHere || faint) continue;
      const onsetY = y(event.startBeat);
      if (namesOnBars && bar && bar.height >= LABEL_MIN_HEIGHT_PX && width >= LABEL_MIN_WIDTH_PX) {
        scene.labels.push({
          left,
          width,
          bottom: Math.min(onsetY, view.height) - LABEL_MARGIN_PX,
          text: spelledName(event.spelling, view.naming),
          hand: event.hand,
        });
      }
      const key = `${event.hand}@${String(event.startBeat)}`;
      const onset = onsets.get(key) ?? { hand: event.hand, beat: event.startBeat, centers: [] };
      onset.centers.push(left + width / 2);
      onsets.set(key, onset);
    }
    for (const { hand, beat, centers } of onsets.values()) {
      const onsetY = y(beat);
      if (centers.length < 2 || onsetY > view.height) continue;
      scene.chordLines.push({
        x1: Math.min(...centers),
        x2: Math.max(...centers),
        y: onsetY,
        hand,
      });
    }

    addGridLines(scene, timeline, segment, visibleUntil, y);
    if (scene.pedalStrip) addPedal(scene.pedal, timeline, segment, visibleUntil, y, view.height);
  }

  for (const event of eventsSoundingAt(timeline, view.position)) {
    const lane = lanes.get(event.midi);
    if (lane && view.hands[event.hand] === 'play') {
      scene.glows.push({ left: lane.left, width: lane.width, hand: event.hand });
    }
  }
  return scene;
}

/**
 * What playback covers from the position on: up to the loop's end (or the end of the piece),
 * then, while looping, the loop again and again until the top of the roll.
 */
function segments(piece: RollPiece, view: RollView): Segment[] {
  const { tempo, timeline } = piece;
  const { loop, position } = view;
  const end = loop?.endBeat ?? timeline.durationBeats;
  const list: Segment[] = [{ from: position, to: end, offset: 0, first: true }];
  if (!loop) return list;
  const passSeconds = tempo.secondsAt(loop.endBeat) - tempo.secondsAt(loop.startBeat);
  let offset = tempo.secondsAt(end) - tempo.secondsAt(position);
  for (let pass = 0; pass < MAX_LOOP_PASSES && offset < view.secondsVisible; pass++) {
    list.push({ from: loop.startBeat, to: loop.endBeat, offset, first: false });
    if (passSeconds <= 0) break;
    offset += passSeconds;
  }
  return list;
}

/**
 * The part of a note between two beats that is visible: below the top of the roll and above the
 * hit line (what has passed slides behind the keyboard). The end may lose a small gap.
 */
function verticalSpan(
  y: (beat: number) => number,
  from: number,
  to: number,
  segmentStart: number,
  height: number,
  gapAtEnd: boolean,
): { top: number; height: number } | undefined {
  if (to <= Math.max(from, segmentStart) + BEAT_EPSILON) return undefined;
  const bottom = Math.min(y(Math.max(from, segmentStart)), height);
  const top = Math.max(y(to) + (gapAtEnd ? NOTE_GAP_PX : 0), 0);
  return bottom - top >= 1 ? { top, height: bottom - top } : undefined;
}

/** Measure lines with their numbers, faint lines on the beats, and where a loop starts again. */
function addGridLines(
  scene: { beatLines: number[]; measureLines: LabelledLine[]; loopLines: LabelledLine[] },
  timeline: Timeline,
  segment: Segment,
  until: number,
  y: (beat: number) => number,
): void {
  for (const measure of timeline.measures) {
    const start = measure.startBeat;
    if (start >= until - BEAT_EPSILON) break;
    if (start + measure.durationBeats <= segment.from + BEAT_EPSILON) continue;
    if (!segment.first && Math.abs(start - segment.from) < BEAT_EPSILON) {
      scene.loopLines.push({ y: y(start), label: `Loop: back to m. ${measure.label || '–'}` });
    } else if (start > segment.from + BEAT_EPSILON) {
      scene.measureLines.push({ y: y(start), label: measure.label });
    }
    for (let beat = start + 1; beat < start + measure.durationBeats - BEAT_EPSILON; beat++) {
      if (beat > segment.from + BEAT_EPSILON && beat < until - BEAT_EPSILON) {
        scene.beatLines.push(y(beat));
      }
    }
  }
}

/** Where the pedal is down within a segment, with a gap before each change. */
function addPedal(
  pedal: { top: number; bottom: number }[],
  timeline: Timeline,
  segment: Segment,
  until: number,
  y: (beat: number) => number,
  height: number,
): void {
  const spans = timeline.pedal;
  spans.forEach((span, i) => {
    const from = Math.max(span.startBeat, segment.from);
    const to = Math.min(span.endBeat, segment.to);
    if (to <= from + BEAT_EPSILON || from >= until - BEAT_EPSILON) return;
    const next = spans[i + 1];
    const change =
      next !== undefined &&
      Math.abs(next.startBeat - span.endBeat) < BEAT_EPSILON &&
      span.endBeat <= segment.to + BEAT_EPSILON;
    const bottom = Math.min(y(from), height);
    const top = Math.max(y(to) + (change ? PEDAL_CHANGE_GAP_PX : 0), 0);
    if (bottom - top >= 1) pedal.push({ top, bottom });
  });
}

function guidesFor(keys: readonly KeyLane[]): RollScene['guides'] {
  return keys
    .filter((key) => key.midi % 12 === 0 || key.midi % 12 === 5)
    .map((key) => ({ x: key.left - 0.5, strong: key.midi % 12 === 0 }));
}

const laneCache = new WeakMap<readonly KeyLane[], Map<number, KeyLane>>();

function lanesByMidi(keys: readonly KeyLane[]): Map<number, KeyLane> {
  let lanes = laneCache.get(keys);
  if (!lanes) {
    lanes = new Map(keys.map((key) => [key.midi, key]));
    laneCache.set(keys, lanes);
  }
  return lanes;
}
