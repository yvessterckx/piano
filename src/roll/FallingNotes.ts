import type { KeyboardGeometry } from '../keyboard/keys';
import type { Hand } from '../timeline/types';
import { rollScene } from './rollScene';
import type { NoteShape, RollPiece, RollScene, RollView } from './rollScene';

/** What the page decides about the roll; the size and the keys come from the roll and keyboard. */
export type RollState = Omit<RollView, 'width' | 'height' | 'geometry'>;

interface HandColors {
  /** A white key's note. */
  readonly bar: string;
  /** A black key's note: darker, as the key is. */
  readonly dark: string;
  /** The lit edge at the hit line. */
  readonly glow: string;
  /** Text on the bar. */
  readonly ink: string;
}

interface Palette {
  readonly background: string;
  readonly font: string;
  readonly hands: Readonly<Record<Hand, HandColors>>;
}

const MEASURE_LINE = 'rgb(232 234 237 / 24%)';
const BEAT_LINE = 'rgb(232 234 237 / 5%)';
const STRONG_GUIDE = 'rgb(232 234 237 / 9%)';
const GUIDE = 'rgb(232 234 237 / 4%)';
const LOOP_LINE = 'rgb(232 234 237 / 55%)';
const HIT_LINE = 'rgb(232 234 237 / 50%)';
const LINE_LABEL = '#a3abb6';
const PEDAL_LANE = 'rgb(232 234 237 / 5%)';
const PEDAL_DOWN = '#c5cbd3';
const TAIL_OPACITY = 0.8;
const FAINT_OPACITY = 0.45;
const CHORD_OPACITY = 0.85;
const GLOW_HEIGHT_PX = 3;
const GLOW_BLUR_PX = 10;

/**
 * The falling notes, drawn on one canvas. It keeps no time of its own: the page calls render() on
 * every animation frame with the transport's position, and once after any other change. The keys'
 * positions come from the keyboard (setGeometry), so every note falls onto its key.
 */
export class FallingNotes {
  readonly #host: HTMLElement;
  readonly #canvas: HTMLCanvasElement;
  readonly #context: CanvasRenderingContext2D | null;
  #palette: Palette | undefined;
  #piece: RollPiece | undefined;
  #geometry: KeyboardGeometry | undefined;
  #state: RollState | undefined;

  constructor(host: HTMLElement) {
    this.#host = host;
    this.#canvas = document.createElement('canvas');
    this.#canvas.className = 'roll-canvas';
    this.#canvas.setAttribute('role', 'img');
    this.#canvas.setAttribute(
      'aria-label',
      'Falling notes: the coming notes move down onto their keys. Thin tails show notes held by the sustain pedal.',
    );
    this.#context = this.#canvas.getContext('2d');
    host.replaceChildren(this.#canvas);
    new ResizeObserver(() => {
      this.#draw();
    }).observe(host);
  }

  setPiece(piece: RollPiece | undefined): void {
    this.#piece = piece;
    this.#draw();
  }

  setGeometry(geometry: KeyboardGeometry): void {
    this.#geometry = geometry;
    this.#draw();
  }

  render(state: RollState): void {
    this.#state = state;
    this.#draw();
  }

  #draw(): void {
    const context = this.#context;
    const width = this.#host.clientWidth;
    const height = this.#host.clientHeight;
    if (!context || width === 0 || height === 0) return;
    this.#fitCanvas(context, width, height);
    const palette = (this.#palette ??= readPalette(this.#host));
    context.fillStyle = palette.background;
    context.fillRect(0, 0, width, height);
    const piece = this.#piece;
    const geometry = this.#geometry;
    const state = this.#state;
    if (!piece || !geometry || !state) return;
    paint(context, rollScene(piece, { ...state, width, height, geometry }), palette, width, height);
  }

  /** A backing store of device pixels, so lines stay sharp on high-density screens. */
  #fitCanvas(context: CanvasRenderingContext2D, width: number, height: number): void {
    const ratio = window.devicePixelRatio || 1;
    const backingWidth = Math.round(width * ratio);
    const backingHeight = Math.round(height * ratio);
    if (this.#canvas.width !== backingWidth || this.#canvas.height !== backingHeight) {
      this.#canvas.width = backingWidth;
      this.#canvas.height = backingHeight;
    }
    context.setTransform(backingWidth / width, 0, 0, backingHeight / height, 0, 0);
  }
}

function paint(
  context: CanvasRenderingContext2D,
  scene: RollScene,
  palette: Palette,
  width: number,
  height: number,
): void {
  for (const guide of scene.guides) {
    context.fillStyle = guide.strong ? STRONG_GUIDE : GUIDE;
    context.fillRect(guide.x, 0, 1, height);
  }
  context.fillStyle = BEAT_LINE;
  for (const y of scene.beatLines) context.fillRect(0, y, width, 1);

  context.font = `600 11px ${palette.font}`;
  context.textBaseline = 'bottom';
  context.textAlign = 'left';
  for (const line of scene.measureLines) {
    context.fillStyle = MEASURE_LINE;
    context.fillRect(0, line.y, width, 1);
    context.fillStyle = LINE_LABEL;
    context.fillText(line.label, 6, line.y - 3);
  }
  for (const line of scene.loopLines) {
    context.strokeStyle = LOOP_LINE;
    context.lineWidth = 1.5;
    context.setLineDash([6, 4]);
    context.beginPath();
    context.moveTo(0, line.y);
    context.lineTo(width, line.y);
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = LINE_LABEL;
    context.fillText(line.label, 6, line.y - 3);
  }

  if (scene.pedalStrip) {
    const { left, width: laneWidth } = scene.pedalStrip;
    context.fillStyle = PEDAL_LANE;
    context.fillRect(left, 0, laneWidth, height);
    context.fillStyle = PEDAL_DOWN;
    for (const { top, bottom } of scene.pedal) {
      roundedRect(context, left, top, laneWidth, bottom - top, laneWidth / 2);
      context.fill();
    }
  }

  context.globalAlpha = TAIL_OPACITY;
  for (const tail of scene.tails) {
    if (tail.faint) continue;
    context.fillStyle = noteColor(tail, palette);
    roundedRect(context, tail.left, tail.top, tail.width, tail.height, tail.width / 2);
    context.fill();
  }
  context.globalAlpha = 1;
  for (const bar of scene.bars) {
    const radius = Math.min(4, bar.width / 3);
    if (bar.faint) {
      context.globalAlpha = FAINT_OPACITY;
      context.strokeStyle = noteColor(bar, palette);
      context.lineWidth = 1.5;
      roundedRect(
        context,
        bar.left + 0.75,
        bar.top + 0.75,
        bar.width - 1.5,
        bar.height - 1.5,
        radius,
      );
      context.stroke();
      context.globalAlpha = 1;
    } else {
      context.fillStyle = noteColor(bar, palette);
      roundedRect(context, bar.left, bar.top, bar.width, bar.height, radius);
      context.fill();
    }
  }

  context.globalAlpha = CHORD_OPACITY;
  for (const chord of scene.chordLines) {
    context.fillStyle = palette.hands[chord.hand].bar;
    context.fillRect(chord.x1, chord.y - 1, chord.x2 - chord.x1, 2);
  }
  context.globalAlpha = 1;

  context.font = `700 10px ${palette.font}`;
  context.textAlign = 'center';
  for (const label of scene.labels) {
    context.fillStyle = palette.hands[label.hand].ink;
    context.fillText(label.text, label.left + label.width / 2, label.bottom);
  }

  context.fillStyle = HIT_LINE;
  context.fillRect(0, height - 2, scene.pedalStrip?.left ?? width, 2);
  for (const glow of scene.glows) {
    const color = palette.hands[glow.hand].glow;
    context.shadowColor = color;
    context.shadowBlur = GLOW_BLUR_PX;
    context.fillStyle = color;
    context.fillRect(glow.left - 1, height - GLOW_HEIGHT_PX, glow.width + 2, GLOW_HEIGHT_PX);
  }
  context.shadowBlur = 0;
}

function noteColor(shape: NoteShape, palette: Palette): string {
  const colors = palette.hands[shape.hand];
  return shape.black ? colors.dark : colors.bar;
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  context.beginPath();
  context.roundRect(x, y, width, height, Math.max(Math.min(radius, width / 2, height / 2), 0));
}

/** The colors come from the design tokens in style.css. */
function readPalette(element: HTMLElement): Palette {
  const style = getComputedStyle(element);
  const token = (name: string): string => style.getPropertyValue(name).trim();
  return {
    background: token('--color-roll'),
    font: token('--font-body'),
    hands: {
      left: {
        bar: token('--color-left-hand'),
        dark: token('--color-left-hand-dark'),
        glow: token('--color-left-hand-glow'),
        ink: token('--color-ink'),
      },
      right: {
        bar: token('--color-right-hand'),
        dark: token('--color-right-hand-dark'),
        glow: token('--color-right-hand-glow'),
        ink: '#fff',
      },
    },
  };
}
