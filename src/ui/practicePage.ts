import { Keyboard } from '../keyboard/Keyboard';
import { KEYBOARD_RANGES } from '../keyboard/keys';
import type { NoteNaming } from '../keyboard/noteNames';
import type { PianoSound } from '../playback/PianoSound';
import { Transport } from '../playback/Transport';
import type { NotePlayer } from '../playback/Transport';
import type { OsmdScore, ScoreLayoutMode } from '../score/osmd/OsmdScore';
import { looksLikeMusicXml } from '../score/scoreFile';
import {
  eventsSoundingAt,
  measurePositionAt,
  measuresInSpan,
  spanBetweenMeasures,
} from '../timeline/queries';
import type { Hand, MeasureOccurrence, Timeline } from '../timeline/types';
import { fetchDevFixture, listDevFixtures } from './devFixtures';
import {
  ICON_CLOSE,
  ICON_FULLSCREEN,
  ICON_LOOP,
  ICON_MENU,
  ICON_OPEN,
  ICON_PAUSE,
  ICON_PLAY,
  ICON_RESTART,
} from './icons';
import { watchLayout } from './layout';
import type { Layout } from './layout';
import { anchorPopover } from './popovers';
import type { PopoverSide } from './popovers';
import {
  SCORE_SCALES,
  loadNoteNaming,
  loadRotateHintDismissed,
  loadScoreScale,
  saveNoteNaming,
  saveRotateHintDismissed,
  saveScoreScale,
} from './preferences';
import { ScreenWakeLock } from './wakeLock';

type HandChoice = Hand | 'both';

/** Volume of the hand that is not practiced, unless it is muted. */
const OTHER_HAND_LEVEL = 0.35;
const DEFAULT_TEMPO_PERCENT = 60;

const SILENT_PLAYER: NotePlayer = {
  play() {
    // Used when the piano sound could not be loaded: everything but the sound keeps working.
  },
  stopAll() {
    // Nothing is sounding.
  },
};

const HAND_NAMES: Record<HandChoice, string> = {
  left: 'left hand',
  right: 'right hand',
  both: 'both hands',
};

const TEMPLATE = `
  <div class="practice">
    <div class="toolbar" role="toolbar" aria-label="Practice">
      <button type="button" class="tool" popovertarget="menu" data-ref="menu-button" aria-label="Menu">${ICON_MENU}</button>
      <div class="toolbar-title">
        <strong data-ref="title">Piano practice</strong>
        <span class="muted" data-ref="subtitle"></span>
      </div>
      <button type="button" class="tool tool-play" data-ref="play" aria-label="Play" disabled>${ICON_PLAY}</button>
      <button type="button" class="tool" data-ref="restart" aria-label="Back to the start" disabled>${ICON_RESTART}</button>
      <span class="measure" data-ref="measure"></span>
      <input type="range" class="slider progress" data-ref="progress" min="0" max="0" step="any" value="0"
        aria-label="Position in the piece" disabled />
      <button type="button" class="tool tool-text" popovertarget="tempo-panel" data-ref="tempo-button"
        aria-label="Tempo">${DEFAULT_TEMPO_PERCENT}%</button>
      <button type="button" class="tool" popovertarget="hands-panel" data-ref="hands-button"></button>
      <button type="button" class="tool" data-ref="loop" aria-pressed="false" aria-label="Loop" disabled>${ICON_LOOP}</button>
    </div>
    <div class="stage">
      <section class="score-card" aria-label="Score">
        <div class="score" data-ref="score"></div>
        <div class="empty" data-ref="empty">
          <p>Open a MusicXML file (.musicxml, .xml or .mxl) to start.</p>
          <label class="button button-primary" for="file-input">${ICON_OPEN}Open file</label>
        </div>
      </section>
      <div class="notices">
        <p class="notice" data-ref="status" role="status" hidden></p>
        <p class="notice notice-hint" data-ref="rotate-hint" hidden>
          <span>Turn your phone for a larger keyboard and more music per line.</span>
          <button type="button" class="notice-close" data-ref="rotate-hint-close" aria-label="Close">${ICON_CLOSE}</button>
        </p>
      </div>
    </div>
    <section class="keyboard-area" aria-label="Keyboard" data-ref="keyboard"></section>
  </div>
  <input type="file" class="visually-hidden" id="file-input" data-ref="file" tabindex="-1" />

  <div popover id="menu" class="panel popover menu" data-ref="menu">
    <div class="menu-piece">
      <strong data-ref="menu-title">No piece open</strong>
      <span class="muted" data-ref="menu-subtitle"></span>
    </div>
    <label class="button" for="file-input">${ICON_OPEN}Open file</label>
    <select class="field" data-ref="fixtures" aria-label="Test score (development only)" hidden></select>
    <div class="menu-row">
      <span>Note names</span>
      <div class="segmented" role="group" aria-label="Note names" data-ref="naming">
        <button type="button" data-naming="solfege" aria-pressed="false">do re mi</button>
        <button type="button" data-naming="letter" aria-pressed="false">C D E</button>
      </div>
    </div>
    <div class="menu-row">
      <span>Score size</span>
      <div class="stepper">
        <button type="button" class="tool" data-ref="smaller" aria-label="Smaller score">−</button>
        <span data-ref="scale" aria-live="polite"></span>
        <button type="button" class="tool" data-ref="larger" aria-label="Larger score">+</button>
      </div>
    </div>
    <button type="button" class="button" data-ref="fullscreen" hidden>${ICON_FULLSCREEN}<span>Full screen</span></button>
  </div>

  <div popover id="tempo-panel" class="panel popover" data-ref="tempo-panel">
    <div class="control-labels">
      <label for="tempo">Tempo</label>
      <span><strong data-ref="tempo-value">${DEFAULT_TEMPO_PERCENT}%</strong> <span class="muted" data-ref="tempo-bpm"></span></span>
    </div>
    <input id="tempo" type="range" class="slider" data-ref="tempo" min="25" max="100" step="5"
      value="${DEFAULT_TEMPO_PERCENT}" />
  </div>

  <div popover id="hands-panel" class="panel popover" data-ref="hands-panel">
    <div class="segmented" role="group" aria-label="Hand to practice" data-ref="hands">
      <button type="button" data-hand="left" aria-pressed="false"><span class="dot dot-left" aria-hidden="true"></span>Left</button>
      <button type="button" data-hand="both" aria-pressed="true">Both</button>
      <button type="button" data-hand="right" aria-pressed="false"><span class="dot dot-right" aria-hidden="true"></span>Right</button>
    </div>
    <label class="checkbox" data-ref="mute-label" hidden>
      <input type="checkbox" data-ref="mute" /> Mute the other hand
    </label>
  </div>
`;

interface Piece {
  readonly timeline: Timeline;
  readonly transport: Transport;
  readonly sound: PianoSound | undefined;
}

/**
 * The practice screen: score with cursor, a control bar and the keyboard, on one screen without
 * page scroll. Cursor and keyboard follow the transport, which follows the audio clock.
 */
export function mountPracticePage(root: HTMLElement): void {
  root.innerHTML = TEMPLATE;
  const ref = <T extends HTMLElement>(name: string, type: new () => T): T => {
    const element = root.querySelector(`[data-ref="${name}"]`);
    if (!(element instanceof type)) throw new Error(`Missing element ${name}`);
    return element;
  };
  const ui = {
    menuButton: ref('menu-button', HTMLButtonElement),
    title: ref('title', HTMLElement),
    subtitle: ref('subtitle', HTMLElement),
    play: ref('play', HTMLButtonElement),
    restart: ref('restart', HTMLButtonElement),
    measure: ref('measure', HTMLElement),
    progress: ref('progress', HTMLInputElement),
    tempoButton: ref('tempo-button', HTMLButtonElement),
    handsButton: ref('hands-button', HTMLButtonElement),
    loop: ref('loop', HTMLButtonElement),
    score: ref('score', HTMLElement),
    empty: ref('empty', HTMLElement),
    status: ref('status', HTMLElement),
    rotateHint: ref('rotate-hint', HTMLElement),
    rotateHintClose: ref('rotate-hint-close', HTMLButtonElement),
    keyboard: ref('keyboard', HTMLElement),
    file: ref('file', HTMLInputElement),
    menu: ref('menu', HTMLElement),
    menuTitle: ref('menu-title', HTMLElement),
    menuSubtitle: ref('menu-subtitle', HTMLElement),
    fixtures: ref('fixtures', HTMLSelectElement),
    naming: ref('naming', HTMLElement),
    smaller: ref('smaller', HTMLButtonElement),
    larger: ref('larger', HTMLButtonElement),
    scale: ref('scale', HTMLElement),
    fullscreen: ref('fullscreen', HTMLButtonElement),
    tempoPanel: ref('tempo-panel', HTMLElement),
    tempo: ref('tempo', HTMLInputElement),
    tempoValue: ref('tempo-value', HTMLElement),
    tempoBpm: ref('tempo-bpm', HTMLElement),
    handsPanel: ref('hands-panel', HTMLElement),
    hands: ref('hands', HTMLElement),
    muteLabel: ref('mute-label', HTMLElement),
    mute: ref('mute', HTMLInputElement),
  };

  // OSMD and smplr are large: load them in the background instead of with the page.
  const scoreModule = import('../score/osmd/OsmdScore');
  const soundModule = import('../playback/PianoSound');

  let naming: NoteNaming = loadNoteNaming();
  let scale = loadScoreScale();
  let layout: Layout = 'regular';
  const keyboard = new Keyboard(ui.keyboard, KEYBOARD_RANGES[88], naming);
  const wakeLock = new ScreenWakeLock();
  let score: OsmdScore | undefined;
  let audioContext: AudioContext | undefined;
  let piece: Piece | undefined;
  let handChoice: HandChoice = 'both';
  /** While choosing a loop: the measure tapped first, or null before the first tap. */
  let loopStart: number | null | undefined;
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
    // The file input has no accept filter: on phones it would hide .mxl and .musicxml files (see
    // looksLikeMusicXml). Another kind of file is turned down here, keeping the open piece.
    const isMusicXml = await looksLikeMusicXml(source);
    if (request !== openRequest) return;
    if (!isMusicXml) {
      showStatus(`${name} is not a MusicXML file. Choose a .musicxml, .xml or .mxl file.`, 'error');
      return;
    }
    closePiece();
    ui.empty.hidden = true;
    showStatus(`Opening ${name}…`);
    let timeline: Timeline;
    try {
      score ??= createScore(new (await scoreModule).OsmdScore(ui.score));
      score.setScale(scale);
      timeline = await score.load(source, scoreModeFor(layout));
    } catch (error) {
      if (request === openRequest) {
        showStatus(`Could not open ${name}. ${describe(error)}`, 'error');
        ui.empty.hidden = false;
      }
      return;
    }
    if (request !== openRequest) return;

    showTitle(score.title || name, score.composer.replace(/\s+/g, ' ').trim());
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
    wakeLock.keepAwake(true);
    renderRotateHint();
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
      if (loopStart !== undefined) chooseLoopMeasure(sourceIndex);
      else seekToMeasure(sourceIndex);
    });
    return created;
  }

  function closePiece(): void {
    if (!piece) return;
    piece.transport.dispose();
    piece.sound?.dispose();
    piece = undefined;
    loopStart = undefined;
    wakeLock.keepAwake(false);
    renderControls();
  }

  function showTitle(title: string, composer: string): void {
    ui.title.textContent = title;
    ui.subtitle.textContent = composer;
    ui.menuTitle.textContent = title;
    ui.menuSubtitle.textContent = composer;
  }

  /** Cursor, keyboard and position display at a beat. */
  function renderPosition(timeline: Timeline, beat: number): void {
    const position = measurePositionAt(timeline, beat);
    if (!position) return;
    score?.showCursorAt(position.measure.sourceIndex, position.beatInMeasure);
    if (!draggingProgress) ui.progress.value = String(beat);
    ui.measure.textContent = measureDisplay(timeline, position.measure, layout);
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
    for (const control of [ui.play, ui.restart, ui.progress, ui.loop]) {
      control.disabled = !transport;
    }
    const playing = transport?.playing ?? false;
    ui.play.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
    ui.play.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    if (piece) ui.progress.max = String(piece.timeline.durationBeats);
    renderLoop();
  }

  /** The loop button and the marked measures: the loop, or the first measure being chosen. */
  function renderLoop(): void {
    const loop = piece?.transport.loop;
    const choosing = loopStart !== undefined;
    ui.loop.setAttribute('aria-pressed', String(loop !== undefined || choosing));
    ui.loop.classList.toggle('tool-choosing', choosing);
    ui.loop.setAttribute(
      'aria-label',
      choosing ? 'Cancel choosing a loop' : loop ? 'Stop looping' : 'Loop',
    );
    const marked =
      typeof loopStart === 'number'
        ? [loopStart]
        : loop && piece
          ? measuresInSpan(piece.timeline, loop)
          : [];
    score?.markMeasures(marked);
  }

  function seekToMeasure(sourceIndex: number): void {
    const target = piece?.timeline.measures.find((m) => m.sourceIndex === sourceIndex);
    if (target) piece?.transport.seek(target.startBeat);
  }

  /** Loop button: start choosing a loop by tapping two measures, or stop looping. */
  function toggleLoop(): void {
    const transport = piece?.transport;
    if (!transport) return;
    if (loopStart !== undefined) {
      loopStart = undefined;
      showStatus('');
    } else if (transport.loop) {
      transport.setLoop(undefined);
    } else {
      loopStart = null;
      showStatus('Tap the first measure of the loop.');
    }
    renderLoop();
  }

  function chooseLoopMeasure(sourceIndex: number): void {
    if (!piece) return;
    if (loopStart === null || loopStart === undefined) {
      loopStart = sourceIndex;
      showStatus('Now tap the last measure of the loop (the same one for a single measure).');
      renderLoop();
      return;
    }
    const span = spanBetweenMeasures(piece.timeline, loopStart, sourceIndex);
    loopStart = undefined;
    showStatus('');
    if (span) piece.transport.setLoop(span);
    renderLoop();
  }

  function restart(): void {
    const transport = piece?.transport;
    transport?.seek(transport.loop?.startBeat ?? 0);
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
    ui.handsButton.innerHTML = handsIcon(handChoice);
    ui.handsButton.setAttribute('aria-label', `Hands: ${HAND_NAMES[handChoice]}`);
  }

  function renderNaming(): void {
    for (const button of ui.naming.querySelectorAll<HTMLButtonElement>('[data-naming]')) {
      button.setAttribute('aria-pressed', String(button.dataset.naming === naming));
    }
  }

  function renderScale(): void {
    ui.scale.textContent = `${Math.round(scale * 100)}%`;
    ui.smaller.disabled = scale <= Math.min(...SCORE_SCALES);
    ui.larger.disabled = scale >= Math.max(...SCORE_SCALES);
  }

  function changeScale(step: 1 | -1): void {
    const index = SCORE_SCALES.findIndex((s) => s === scale);
    const next = SCORE_SCALES[index + step];
    if (next === undefined) return;
    scale = next;
    saveScoreScale(scale);
    score?.setScale(scale);
    renderScale();
  }

  function renderRotateHint(): void {
    ui.rotateHint.hidden =
      layout !== 'phone-portrait' || piece === undefined || loadRotateHintDismissed();
  }

  function renderFullscreen(): void {
    ui.fullscreen.hidden = !document.fullscreenEnabled;
    const label = ui.fullscreen.querySelector('span');
    if (label) label.textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen';
  }

  async function toggleFullscreen(): Promise<void> {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
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
    wakeLock.keepAwake(true);
    transport.play();
  }

  ui.file.addEventListener('change', () => {
    const file = ui.file.files?.[0];
    ui.menu.hidePopover();
    if (file) void open(file, file.name);
    ui.file.value = '';
  });
  ui.play.addEventListener('click', () => void togglePlay());
  ui.restart.addEventListener('click', restart);
  ui.progress.addEventListener('pointerdown', () => (draggingProgress = true));
  ui.progress.addEventListener('pointerup', () => (draggingProgress = false));
  ui.progress.addEventListener('input', () => {
    piece?.transport.seek(Number(ui.progress.value));
  });
  ui.tempo.addEventListener('input', () => {
    ui.tempoValue.textContent = `${ui.tempo.value}%`;
    ui.tempoButton.textContent = `${ui.tempo.value}%`;
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
  ui.loop.addEventListener('click', toggleLoop);
  ui.naming.addEventListener('click', (event) => {
    const choice = (event.target as Element).closest<HTMLElement>('[data-naming]')?.dataset.naming;
    if (choice !== 'solfege' && choice !== 'letter') return;
    naming = choice;
    saveNoteNaming(naming);
    keyboard.setNaming(naming);
    renderNaming();
  });
  ui.smaller.addEventListener('click', () => {
    changeScale(-1);
  });
  ui.larger.addEventListener('click', () => {
    changeScale(1);
  });
  ui.fullscreen.addEventListener('click', () => void toggleFullscreen());
  document.addEventListener('fullscreenchange', renderFullscreen);
  ui.rotateHintClose.addEventListener('click', () => {
    saveRotateHintDismissed();
    renderRotateHint();
  });
  ui.status.addEventListener('click', () => {
    if (ui.status.dataset.kind === 'error') showStatus('');
  });
  const popoverSide = (): PopoverSide => (layout === 'phone-landscape' ? 'left' : 'below');
  anchorPopover(ui.menu, ui.menuButton, popoverSide);
  anchorPopover(ui.tempoPanel, ui.tempoButton, popoverSide);
  anchorPopover(ui.handsPanel, ui.handsButton, popoverSide);
  document.addEventListener('keydown', (event) => {
    const target = event.target as Element | null;
    if (event.code !== 'Space' || target?.closest('input, select, textarea, button, label')) return;
    event.preventDefault();
    void togglePlay();
  });

  watchLayout((next) => {
    layout = next;
    root.dataset.layout = layout;
    renderRotateHint();
    score?.setLayoutMode(scoreModeFor(layout)).catch((error: unknown) => {
      showStatus(`Could not lay out the score. ${describe(error)}`, 'error');
    });
    if (piece) renderPosition(piece.timeline, piece.transport.position());
  });
  renderNaming();
  renderScale();
  renderFullscreen();
  applyHandLevels();
  renderControls();
  if (import.meta.env.DEV) void offerDevFixtures(ui.fixtures, ui.menu, open);
}

/** One line of music on a phone in landscape, systems under each other everywhere else. */
function scoreModeFor(layout: Layout): ScoreLayoutMode {
  return layout === 'phone-landscape' ? 'line' : 'wrapped';
}

/** "Measure 5 (2nd time)" where there is room, "m. 5 (2nd)" on a phone. */
function measureDisplay(timeline: Timeline, measure: MeasureOccurrence, layout: Layout): string {
  const pass = timeline.measures
    .slice(0, measure.index + 1)
    .filter((m) => m.sourceIndex === measure.sourceIndex).length;
  const label = measure.label || '–';
  if (layout === 'regular') {
    return pass > 1 ? `Measure ${label} (${ordinal(pass)} time)` : `Measure ${label}`;
  }
  return pass > 1 ? `m. ${label} (${ordinal(pass)})` : `m. ${label}`;
}

function ordinal(n: number): string {
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}

/** The hands button shows the practiced hands as colored dots. */
function handsIcon(choice: HandChoice): string {
  const dot = (hand: Hand): string =>
    `<span class="dot dot-${hand}${choice === 'both' || choice === hand ? '' : ' dot-off'}"></span>`;
  return `<span class="hands-icon" aria-hidden="true">${dot('left')}${dot('right')}</span>`;
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
  menu: HTMLElement,
  open: (source: Blob, name: string) => Promise<void>,
): Promise<void> {
  const names = await listDevFixtures();
  select.replaceChildren(new Option('Test scores…', ''), ...names.map((n) => new Option(n, n)));
  select.hidden = false;
  // ?fixture=<name> opens a test score directly, e.g. to check a layout on a device.
  const requested = new URLSearchParams(location.search).get('fixture');
  if (requested && names.includes(requested)) {
    select.value = requested;
    void fetchDevFixture(requested).then((blob) => open(blob, requested));
  }
  select.addEventListener('change', () => {
    const name = select.value;
    if (!name) return;
    menu.hidePopover();
    void fetchDevFixture(name).then((blob) => open(blob, name));
  });
}
