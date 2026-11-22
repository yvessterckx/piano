import { OsmdScore } from '../score/osmd/OsmdScore';
import { BEAT_EPSILON } from '../timeline/buildTimeline';
import { eventsSoundingAt, measurePositionAt } from '../timeline/queries';
import type { Timeline } from '../timeline/types';
import { fetchDevFixture, listDevFixtures } from './devFixtures';
import { noteName } from './noteName';

const ACCEPTED_FILES = [
  '.musicxml',
  '.xml',
  '.mxl',
  'application/vnd.recordare.musicxml+xml',
  'application/vnd.recordare.musicxml',
  'application/xml',
  'text/xml',
].join(',');

const TEMPLATE = `
  <header class="app-header">
    <div class="app-title">
      <h1>Piano practice</h1>
      <p class="muted" data-ref="piece">Open a MusicXML file to start.</p>
    </div>
    <div class="app-actions">
      <select class="field" data-ref="fixtures" aria-label="Test score (development only)" hidden></select>
      <label class="button button-primary">
        Open file
        <input type="file" data-ref="file" accept="${ACCEPTED_FILES}" hidden />
      </label>
    </div>
  </header>
  <main class="app-main">
    <p class="status" data-ref="status" role="status" hidden></p>
    <section class="score-card" aria-label="Score">
      <div class="score" data-ref="score"></div>
    </section>
    <section class="panel" aria-label="Position">
      <div class="position-row">
        <button type="button" class="button" data-ref="previous" aria-label="Previous note" disabled>&#8249;</button>
        <input type="range" class="slider" data-ref="slider" min="0" max="0" step="0.25" value="0"
          aria-label="Position in beats" disabled />
        <button type="button" class="button" data-ref="next" aria-label="Next note" disabled>&#8250;</button>
      </div>
      <div class="position-row">
        <label class="field-label">Beat
          <input type="number" class="field field-number" data-ref="beat" min="0" step="0.25" value="0" disabled />
        </label>
        <label class="field-label">Measure
          <select class="field" data-ref="measure" disabled></select>
        </label>
      </div>
      <p class="readout" data-ref="readout"></p>
      <ul class="sounding" data-ref="sounding" aria-label="Notes sounding"></ul>
    </section>
    <section class="panel" aria-label="Timeline">
      <h2>Timeline</h2>
      <dl class="stats" data-ref="stats"></dl>
    </section>
  </main>
`;

/**
 * Spike page for phase 1: render a score, derive its timeline and put the cursor on any beat.
 * Playback, the keyboard and the final layout follow in phase 2.
 */
export function mountSpikePage(root: HTMLElement): void {
  root.innerHTML = TEMPLATE;
  const ref = <T extends HTMLElement>(name: string, type: new () => T): T => {
    const element = root.querySelector(`[data-ref="${name}"]`);
    if (!(element instanceof type)) throw new Error(`Missing element ${name}`);
    return element;
  };
  const piece = ref('piece', HTMLElement);
  const fixtures = ref('fixtures', HTMLSelectElement);
  const fileInput = ref('file', HTMLInputElement);
  const status = ref('status', HTMLElement);
  const previous = ref('previous', HTMLButtonElement);
  const next = ref('next', HTMLButtonElement);
  const slider = ref('slider', HTMLInputElement);
  const beatInput = ref('beat', HTMLInputElement);
  const measureSelect = ref('measure', HTMLSelectElement);
  const readout = ref('readout', HTMLElement);
  const sounding = ref('sounding', HTMLUListElement);
  const stats = ref('stats', HTMLElement);
  const controls = [previous, next, slider, beatInput, measureSelect];

  const score = new OsmdScore(ref('score', HTMLElement));
  let timeline: Timeline | undefined;
  let currentBeat = 0;

  function showStatus(message: string, kind: 'info' | 'error' = 'info'): void {
    status.textContent = message;
    status.dataset.kind = kind;
    status.hidden = message === '';
  }

  async function open(source: Blob, name: string): Promise<void> {
    showStatus(`Loading ${name}…`);
    controls.forEach((control) => (control.disabled = true));
    try {
      timeline = await score.load(source);
    } catch (error) {
      timeline = undefined;
      showStatus(`Could not open ${name}. ${error instanceof Error ? error.message : ''}`, 'error');
      return;
    }
    showStatus('');
    piece.textContent = [score.title || name, score.composer].filter(Boolean).join(' · ');
    showTimeline(timeline);
    controls.forEach((control) => (control.disabled = false));
    setBeat(0);
  }

  function showTimeline(loaded: Timeline): void {
    slider.max = String(loaded.durationBeats);
    beatInput.max = String(loaded.durationBeats);
    measureSelect.replaceChildren(
      ...loaded.measures.map((measure) => {
        const option = document.createElement('option');
        option.value = String(measure.index);
        option.textContent = `${measure.index + 1}. measure ${measure.label || '(unnumbered)'}`;
        return option;
      }),
    );
    const leftHand = loaded.events.filter((event) => event.hand === 'left').length;
    const rows: [string, string][] = [
      [
        'Keys to press',
        `${loaded.events.length} (${loaded.events.length - leftHand} right, ${leftHand} left)`,
      ],
      ['Measures played', `${loaded.measures.length} (repeats unrolled)`],
      ['Length', `${format(loaded.durationBeats)} beats (quarter notes)`],
      [
        'Tempo',
        loaded.tempo
          .map((change) => `${format(change.bpm)} bpm from beat ${format(change.beat)}`)
          .join(', '),
      ],
    ];
    stats.replaceChildren(
      ...rows.flatMap(([term, value]) => {
        const dt = document.createElement('dt');
        dt.textContent = term;
        const dd = document.createElement('dd');
        dd.textContent = value;
        return [dt, dd];
      }),
    );
  }

  function setBeat(beat: number): void {
    if (!timeline) return;
    currentBeat = Math.min(Math.max(beat, 0), Math.max(timeline.durationBeats - BEAT_EPSILON, 0));
    const position = measurePositionAt(timeline, currentBeat);
    if (!position) return;
    score.showCursorAt(position.measure.sourceIndex, position.beatInMeasure);

    slider.value = String(currentBeat);
    beatInput.value = format(currentBeat);
    measureSelect.value = String(position.measure.index);

    const pass = timeline.measures
      .slice(0, position.measure.index + 1)
      .filter((measure) => measure.sourceIndex === position.measure.sourceIndex).length;
    readout.textContent =
      `Measure ${position.measure.label || '(unnumbered)'}${pass > 1 ? `, pass ${pass}` : ''}, ` +
      `beat ${format(position.beatInMeasure)} of ${format(position.measure.durationBeats)}`;

    sounding.replaceChildren(
      ...eventsSoundingAt(timeline, currentBeat).map((event) => {
        const item = document.createElement('li');
        item.className = `note note-${event.hand}`;
        const struck = Math.abs(event.startBeat - currentBeat) < BEAT_EPSILON;
        item.textContent = `${noteName(event.midi)}${struck ? '' : ' (held)'}`;
        item.title = `${event.hand} hand, ${format(event.durationBeats)} beats`;
        return item;
      }),
    );
  }

  /** Moves to the previous or next beat where a note starts. */
  function stepToNote(direction: -1 | 1): void {
    if (!timeline) return;
    const starts = timeline.events.map((event) => event.startBeat);
    const target =
      direction === 1
        ? starts.find((start) => start > currentBeat + BEAT_EPSILON)
        : starts.findLast((start) => start < currentBeat - BEAT_EPSILON);
    if (target !== undefined) setBeat(target);
  }

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) void open(file, file.name);
    fileInput.value = '';
  });
  slider.addEventListener('input', () => {
    setBeat(Number(slider.value));
  });
  beatInput.addEventListener('change', () => {
    setBeat(Number(beatInput.value));
  });
  measureSelect.addEventListener('change', () => {
    const measure = timeline?.measures[Number(measureSelect.value)];
    if (measure) setBeat(measure.startBeat);
  });
  previous.addEventListener('click', () => {
    stepToNote(-1);
  });
  next.addEventListener('click', () => {
    stepToNote(1);
  });

  if (import.meta.env.DEV) void offerDevFixtures(fixtures, open);
}

async function offerDevFixtures(
  select: HTMLSelectElement,
  open: (source: Blob, name: string) => Promise<void>,
): Promise<void> {
  const names = await listDevFixtures();
  const placeholder = new Option('Test scores…', '');
  select.replaceChildren(placeholder, ...names.map((name) => new Option(name, name)));
  select.hidden = false;
  select.addEventListener('change', () => {
    const name = select.value;
    if (name) void fetchDevFixture(name).then((blob) => open(blob, name));
  });
}

function format(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '');
}
