# Roadmap

## Phase 0: setup

Done on 2026-11-22. Für Elise was replaced by other public-domain pieces (see `tests/fixtures/README.md`).

- Vite + TypeScript project, linting and formatting, Vitest.
- Folder structure following the architecture in `CLAUDE.md`.
- Test files in `tests/fixtures/`, public domain only, with source and license in `tests/fixtures/README.md`. At least:
  - a simple piece (e.g. the opening of Für Elise);
  - a piece with repeat signs or voltas;
  - a piece with tied notes and chords in both hands.

## Phase 1: notation and timeline spike

Goal: choose between OSMD and Verovio (see `research/01-notation-and-rendering.md`).

- Render the score.
- Derive a `Timeline` with beats, pitch, duration, hand and measure. Tied notes merged, repeats unrolled.
- Unit tests on the timeline with the three test files.
- Be able to place the cursor on an arbitrary beat.

Done when the decision is recorded in `docs/decisions.md`, with the rationale.

Done on 2026-11-22: OSMD. See `docs/decisions.md`.

## Phase 2: MVP

Done on 2026-11-22, tested on a laptop in Chrome. See `docs/decisions.md` ("Playback").

- Open a file (`.musicxml`, `.xml`, `.mxl`).
- Load OSMD lazily (dynamic import): it is most of the 1.5 MB bundle.
- Test score with a D.S. al Coda jump.
- Transport: play, pause, tempo 25% to 100%, start from a clicked measure.
- Piano sound with smplr, one instance per hand.
- Cursor and keyboard in sync with the audio clock.
- Keyboard with highlighted keys and note names, colored per hand.
- Hand selection: left, right, both.
- Loop over a range of measures.

## Phase 3: polish

- Test on phones and tablets (iPad, iPhone, Android), including sound with the silent switch on.
- Self-host the fonts (Inter, Space Grotesk) instead of falling back to system fonts.
- Color the sounding notes in the score per hand (the design shows this; the timeline already carries the note references).
- Keep sounding notes when the tempo changes during playback (now every change restarts the scheduling and cuts them).
- Tablet layout (used at the piano), buttons at least 44 px high.
- Settings: number of keys, note names (do re mi or C D E). Persisted in `localStorage` (reads and writes wrapped in try/catch).
- Loading state for samples and score, clear error messages for an unreadable file.
- Self-host the samples for offline use, possibly as a PWA.

## Phase 4: extras (each a separate decision)

- MIDI input with wait mode (not possible on iPad in the browser, see `research/04-midi-and-transcription.md`).
- Loading MIDI files with `@tonejs/midi`. MIDI contains no notation: in that case show only the keyboard (e.g. falling notes) instead of a generated score.
