import { Keyboard } from '../keyboard/Keyboard';
import { KEYBOARD_RANGES } from '../keyboard/keys';
import type { NoteNaming } from '../keyboard/noteNames';
import type { PianoSound } from '../playback/PianoSound';
import { Transport } from '../playback/Transport';
import type { NotePlayer } from '../playback/Transport';
import type { OsmdScore } from '../score/osmd/OsmdScore';
import { eventsSoundingAt, measurePositionAt } from '../timeline/queries';
import type { Hand, MeasureOccurrence, Timeline } from '../timeline/types';
import { fetchDevFixture, listDevFixtures } from './devFixtures';
import { ICON_LOOP, ICON_OPEN, ICON_PAUSE, ICON_PLAY } from './icons';
import { loadNoteNaming, saveNoteNaming } from './preferences';

type HandChoice = Hand | 'both';

/** Volume of the hand that is not practiced, unless it is muted. */
const OTHER_HAND_LEVEL = 0.35;
const DEFAULT_TEMPO_PERCENT = 60;
const DEFAULT_LOOP_MEASURES = 4;

const ACCEPTED_FILES = [
  '.musicxml',
  '.xml',
  '.mxl',
  'application/vnd.recordare.musicxml+xml',
  'application/vnd.recordare.musicxml',
  'application/xml',
  'text/xml',
].join(',');

const SILENT_PLAYER: NotePlayer = {
  play() {
    // Used when the piano sound could not be loaded: everything but the sound keeps working.
  },
  stopAll() {
    // Nothing is sounding.
  },
};

const TEMPLATE = `
  <header class="app-header">
    <div class="app-title">
      <h1 data-ref="title">Piano practice</h1>
      <p class="muted" data-ref="subtitle">Open a MusicXML file (.musicxml, .xml or .mxl) to start.</p>
    </div>
    <div class="app-actions">
      <select class="field" data-ref="fixtures" aria-label="Test score (development only)" hidden></select>
      <label class="button">
        ${ICON_OPEN}Open file
        <input type="file" class="visually-hidden" data-ref="file" accept="${ACCEPTED_FILES}" />
      </label>
    </div>
  </header>
  <main class="app-main">
    <p class="status" data-ref="status" role="status" hidden></p>
    <section class="score-card" aria-label="Score">
      <div class="score" data-ref="score"></div>
    </section>
    <section class="panel controls" aria-label="Playback">
      <button type="button" class="play-button" data-ref="play" aria-label="Play" disabled>${ICON_PLAY}</button>
      <div class="control-group progress">
        <div class="control-labels">
          <span data-ref="measure">No score</span>
          <span data-ref="loop-range"></span>
        </div>
        <input type="range" class="slider" data-ref="progress" min="0" max="0" step="any" value="0"
          aria-label="Position in the piece" disabled />
      </div>
      <div class="control-group tempo">
        <div class="control-labels">
          <label for="tempo">Tempo</label>
          <span><strong data-ref="tempo-value">${DEFAULT_TEMPO_PERCENT}%</strong> <span class="muted" data-ref="tempo-bpm"></span></span>
        </div>
        <input id="tempo" type="range" class="slider" data-ref="tempo" min="25" max="100" step="5"
          value="${DEFAULT_TEMPO_PERCENT}" />
      </div>
      <div class="hand-choice">
        <div class="segmented" role="group" aria-label="Hand to practice" data-ref="hands">
          <button type="button" data-hand="left" aria-pressed="false"><span class="dot dot-left" aria-hidden="true"></span>Left</button>
          <button type="button" data-hand="both" aria-pressed="true">Both hands</button>
          <button type="button" data-hand="right" aria-pressed="false"><span class="dot dot-right" aria-hidden="true"></span>Right</button>
        </div>
        <label class="checkbox" data-ref="mute-label" hidden>
          <input type="checkbox" data-ref="mute" /> Mute the other hand
        </label>
      </div>
      <div class="loop">
        <button type="button" class="button" data-ref="loop" aria-pressed="false" disabled>${ICON_LOOP}Loop</button>
        <label class="field-label">from <select class="field" data-ref="loop-from" disabled></select></label>
        <label class="field-label">to <select class="field" data-ref="loop-to" disabled></select></label>
      </div>
    </section>
    <section class="panel keyboard-panel" aria-label="Keyboard">
      <div class="keyboard-header">
        <div class="legend">
          <span><span class="swatch swatch-left" aria-hidden="true"></span>Left hand</span>
          <span><span class="swatch swatch-right" aria-hidden="true"></span>Right hand</span>
        </div>
        <div class="segmented segmented-small" role="group" aria-label="Note names" data-ref="naming">
          <button type="button" data-naming="solfege" aria-pressed="false">do re mi</button>
          <button type="button" data-naming="letter" aria-pressed="false">C D E</button>
        </div>
        <span class="muted">88 keys</span>
      </div>
      <div class="keyboard-scroll" data-ref="keyboard"></div>
    </section>
  </main>
`;

interface Piece {
  readonly timeline: Timeline;
  readonly transport: Transport;
  readonly sound: PianoSound | undefined;
}

/**
 * The practice screen: score with cursor, playback controls and the keyboard, all following the
 * transport, which follows the audio clock.
 */
export function mountPracticePage(root: HTMLElement): void {
  root.innerHTML = TEMPLATE;
  const ref = <T extends HTMLElement>(name: string, type: new () => T): T => {
    const element = root.querySelector(`[data-ref="${name}"]`);
    if (!(element instanceof type)) throw new Error(`Missing element ${name}`);
    return element;
  };
  const ui = {
    title: ref('title', HTMLElement),
    subtitle: ref('subtitle', HTMLElement),
    fixtures: ref('fixtures', HTMLSelectElement),
    file: ref('file', HTMLInputElement),
    status: ref('status', HTMLElement),
    score: ref('score', HTMLElement),
    play: ref('play', HTMLButtonElement),
    measure: ref('measure', HTMLElement),
    loopRange: ref('loop-range', HTMLElement),
    progress: ref('progress', HTMLInputElement),
    tempo: ref('tempo', HTMLInputElement),
    tempoValue: ref('tempo-value', HTMLElement),
    tempoBpm: ref('tempo-bpm', HTMLElement),
    hands: ref('hands', HTMLElement),
    muteLabel: ref('mute-label', HTMLElement),
    mute: ref('mute', HTMLInputElement),
    loop: ref('loop', HTMLButtonElement),
    loopFrom: ref('loop-from', HTMLSelectElement),
    loopTo: ref('loop-to', HTMLSelectElement),
    naming: ref('naming', HTMLElement),
    keyboard: ref('keyboard', HTMLElement),
  };

  // OSMD and smplr are large: load them in the background instead of with the page.
  const scoreModule = import('../score/osmd/OsmdScore');
  const soundModule = import('../playback/PianoSound');

  let naming: NoteNaming = loadNoteNaming();
  const keyboard = new Keyboard(ui.keyboard, KEYBOARD_RANGES[88], naming);
  let score: OsmdScore | undefined;
  let audioContext: AudioContext | undefined;
  let piece: Piece | undefined;
  let handChoice: HandChoice = 'both';
  let openRequest = 0;
  let animationFrame: number | undefined;
  let draggingProgress = false;

  function showStatus(message: string, kind: 'info' | 'error' = 'info'): void {
    ui.status.textContent = message;
    ui.status.dataset.kind = kind;
    ui.status.hidden = message === '';
  }

  async function open(source: Blob, name: string): Promise<void> {
    const request = ++openRequest;
    closePiece();
    showStatus(`Opening ${name}…`);
    let timeline: Timeline;
    try {
      score ??= createScore(new (await scoreModule).OsmdScore(ui.score));
      timeline = await score.load(source);
    } catch (error) {
      if (request === openRequest)
        showStatus(`Could not open ${name}. ${describe(error)}`, 'error');
      return;
    }
    if (request !== openRequest) return;

    ui.title.textContent = score.title || name;
    ui.subtitle.textContent = score.composer.replace(/\s+/g, ' ').trim();
    fillMeasureLists(timeline);
    renderPosition(timeline, 0);

    showStatus('Loading the piano sound…');
    const context = (audioContext ??= createAudioContext());
    const sound = await loadSound(context, timeline).catch((error: unknown) => {
      showStatus(
        `The piano sound could not be loaded; practicing without sound. ${describe(error)}`,
        'error',
      );
      return undefined;
    });
    if (request !== openRequest) {
      sound?.dispose();
      return;
    }
    if (sound) showStatus('');

    const transport = new Transport(timeline, context, sound ?? SILENT_PLAYER);
    transport.setTempoFactor(Number(ui.tempo.value) / 100);
    transport.onChange(() => {
      renderControls();
      if (!piece) return;
      if (transport.playing) startAnimation();
      else renderPosition(piece.timeline, transport.position());
    });
    piece = { timeline, transport, sound };
    applyHandLevels();
    renderControls();
    renderPosition(timeline, transport.position());
  }

  async function loadSound(context: AudioContext, timeline: Timeline): Promise<PianoSound> {
    const notes = [...new Set(timeline.events.map((event) => event.midi))];
    const { PianoSound } = await soundModule;
    return PianoSound.load(context, notes, ({ loaded, total }) => {
      if (total > 0) showStatus(`Loading the piano sound… ${Math.round((loaded / total) * 100)}%`);
    });
  }

  function createScore(created: OsmdScore): OsmdScore {
    created.onMeasureClick((sourceIndex) => {
      const target = piece?.timeline.measures.find((m) => m.sourceIndex === sourceIndex);
      if (target) piece?.transport.seek(target.startBeat);
    });
    return created;
  }

  function closePiece(): void {
    if (!piece) return;
    piece.transport.dispose();
    piece.sound?.dispose();
    piece = undefined;
    renderControls();
  }

  /** Cursor, keyboard and progress at a beat. */
  function renderPosition(timeline: Timeline, beat: number): void {
    const position = measurePositionAt(timeline, beat);
    if (!position) return;
    score?.showCursorAt(position.measure.sourceIndex, position.beatInMeasure);
    if (!draggingProgress) ui.progress.value = String(beat);
    ui.measure.textContent = `Measure ${measureName(timeline, position.measure)}`;
    keyboard.show(
      eventsSoundingAt(timeline, beat)
        .filter((event) => handChoice === 'both' || event.hand === handChoice)
        .map(({ midi, hand, spelling }) => ({ midi, hand, spelling })),
    );
    if (piece) {
      const bpm = piece.transport.writtenBpmAt(beat) * piece.transport.tempoFactor;
      ui.tempoBpm.textContent = `(${Math.round(bpm)} bpm)`;
    }
  }

  function startAnimation(): void {
    if (animationFrame !== undefined) return;
    const frame = (): void => {
      if (!piece?.transport.playing || !audioContext) {
        animationFrame = undefined;
        return;
      }
      renderPosition(piece.timeline, piece.transport.positionAt(audibleTime(audioContext)));
      animationFrame = requestAnimationFrame(frame);
    };
    animationFrame = requestAnimationFrame(frame);
  }

  function renderControls(): void {
    const transport = piece?.transport;
    for (const control of [ui.play, ui.progress, ui.loop, ui.loopFrom, ui.loopTo]) {
      control.disabled = !transport;
    }
    const playing = transport?.playing ?? false;
    ui.play.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
    ui.play.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    ui.loop.setAttribute('aria-pressed', String(transport?.loop !== undefined));
    if (piece) ui.progress.max = String(piece.timeline.durationBeats);
    const loop = transport?.loop;
    ui.loopRange.textContent =
      loop && piece ? `Looping ${loopDescription(piece.timeline, loop)}` : '';
  }

  function fillMeasureLists(timeline: Timeline): void {
    const options = (): HTMLOptionElement[] =>
      timeline.measures.map(
        (measure) => new Option(measureName(timeline, measure), String(measure.index)),
      );
    ui.loopFrom.replaceChildren(...options());
    ui.loopTo.replaceChildren(...options());
    ui.loopFrom.value = '0';
    ui.loopTo.value = String(Math.min(DEFAULT_LOOP_MEASURES, timeline.measures.length) - 1);
  }

  /** The loop range from the two measure lists, in playback order. */
  function selectedLoop(): { startBeat: number; endBeat: number } | undefined {
    const measures = piece?.timeline.measures;
    const from = measures?.[Number(ui.loopFrom.value)];
    const to = measures?.[Number(ui.loopTo.value)];
    if (!from || !to) return undefined;
    const [first, last] = from.index <= to.index ? [from, to] : [to, from];
    return { startBeat: first.startBeat, endBeat: last.startBeat + last.durationBeats };
  }

  function applyHandLevels(): void {
    const muted = ui.mute.checked;
    for (const hand of ['left', 'right'] as const) {
      const practiced = handChoice === 'both' || handChoice === hand;
      piece?.sound?.setHandLevel(hand, practiced ? 1 : muted ? 0 : OTHER_HAND_LEVEL);
    }
    ui.muteLabel.hidden = handChoice === 'both';
    for (const button of ui.hands.querySelectorAll<HTMLButtonElement>('[data-hand]')) {
      button.setAttribute('aria-pressed', String(button.dataset.hand === handChoice));
    }
  }

  function renderNaming(): void {
    for (const button of ui.naming.querySelectorAll<HTMLButtonElement>('[data-naming]')) {
      button.setAttribute('aria-pressed', String(button.dataset.naming === naming));
    }
  }

  async function togglePlay(): Promise<void> {
    const transport = piece?.transport;
    if (!transport || !audioContext) return;
    if (transport.playing) {
      transport.pause();
      return;
    }
    // Browsers only start audio after a user action: resume the context in this handler.
    await audioContext.resume();
    transport.play();
  }

  ui.file.addEventListener('change', () => {
    const file = ui.file.files?.[0];
    if (file) void open(file, file.name);
    ui.file.value = '';
  });
  ui.play.addEventListener('click', () => void togglePlay());
  ui.progress.addEventListener('pointerdown', () => (draggingProgress = true));
  ui.progress.addEventListener('pointerup', () => (draggingProgress = false));
  ui.progress.addEventListener('input', () => {
    piece?.transport.seek(Number(ui.progress.value));
  });
  ui.tempo.addEventListener('input', () => {
    ui.tempoValue.textContent = `${ui.tempo.value}%`;
    piece?.transport.setTempoFactor(Number(ui.tempo.value) / 100);
  });
  ui.hands.addEventListener('click', (event) => {
    const hand = (event.target as Element).closest<HTMLElement>('[data-hand]')?.dataset.hand;
    if (hand !== 'left' && hand !== 'right' && hand !== 'both') return;
    handChoice = hand;
    applyHandLevels();
    if (piece) renderPosition(piece.timeline, piece.transport.position());
  });
  ui.mute.addEventListener('change', applyHandLevels);
  ui.loop.addEventListener('click', () => {
    const transport = piece?.transport;
    if (!transport) return;
    transport.setLoop(transport.loop ? undefined : selectedLoop());
  });
  for (const select of [ui.loopFrom, ui.loopTo]) {
    select.addEventListener('change', () => {
      if (piece?.transport.loop) piece.transport.setLoop(selectedLoop());
    });
  }
  ui.naming.addEventListener('click', (event) => {
    const choice = (event.target as Element).closest<HTMLElement>('[data-naming]')?.dataset.naming;
    if (choice !== 'solfege' && choice !== 'letter') return;
    naming = choice;
    saveNoteNaming(naming);
    keyboard.setNaming(naming);
    renderNaming();
  });
  document.addEventListener('keydown', (event) => {
    const target = event.target as Element | null;
    if (event.code !== 'Space' || target?.closest('input, select, textarea, button, label')) return;
    event.preventDefault();
    void togglePlay();
  });

  renderNaming();
  renderControls();
  if (import.meta.env.DEV) void offerDevFixtures(ui.fixtures, open);
}

/** "5", "5 (2nd time)" for a repeated measure, "unnumbered" for a measure without a number. */
function measureName(timeline: Timeline, measure: MeasureOccurrence): string {
  const pass = timeline.measures
    .slice(0, measure.index + 1)
    .filter((m) => m.sourceIndex === measure.sourceIndex).length;
  const label = measure.label || 'unnumbered';
  return pass > 1 ? `${label} (${ordinal(pass)} time)` : label;
}

function loopDescription(timeline: Timeline, loop: { startBeat: number; endBeat: number }): string {
  const first = timeline.measures.find((m) => m.startBeat >= loop.startBeat - 1e-6);
  const last = timeline.measures.findLast((m) => m.startBeat < loop.endBeat - 1e-6);
  return first && last
    ? `measures ${measureName(timeline, first)} to ${measureName(timeline, last)}`
    : '';
}

function ordinal(n: number): string {
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}

function createAudioContext(): AudioContext {
  // Safari: play through the silent switch, like a media player (ignored where unsupported).
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
  if (session) session.type = 'playback';
  return new AudioContext({ latencyHint: 'interactive' });
}

/** The audio time that is being heard now: the context's time minus its output latency. */
function audibleTime(context: AudioContext): number {
  const latency = Number.isFinite(context.outputLatency)
    ? context.outputLatency
    : context.baseLatency;
  return context.currentTime - (latency || 0);
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : '';
}

async function offerDevFixtures(
  select: HTMLSelectElement,
  open: (source: Blob, name: string) => Promise<void>,
): Promise<void> {
  const names = await listDevFixtures();
  select.replaceChildren(new Option('Test scores…', ''), ...names.map((n) => new Option(n, n)));
  select.hidden = false;
  select.addEventListener('change', () => {
    const name = select.value;
    if (name) void fetchDevFixture(name).then((blob) => open(blob, name));
  });
}
