# Piano practice tool

A web app for practicing piano. The learner sees the score, hears the music and sees on an on-screen keyboard which keys to press, all in sync. The primary audience is beginners who can already read some notation.

## Current status

- **Design:** static design of the practice screen in Claude Design: https://claude.ai/artifact/BfKAXAFRrr8adkSGfTrFhA. Local copy and notes in `design/`.
- **Code:** phases 0 to 2 of `docs/roadmap.md` are done: the practice screen plays a loaded score with a piano sound, with the cursor and the keyboard in sync, tempo, hand selection, a loop and starting from a clicked measure. Phase 3 (polish) is in progress: the layout for phones and tablets is done, and so are the falling notes (optional) with the sustain pedal.
- **Research:** `docs/research/`. Read it before choosing a library or making an architectural decision.
- **Decisions and open questions:** `docs/decisions.md`. Update this file whenever a decision is made.

## MVP scope

1. Load a MusicXML file (`.musicxml`, `.xml`, `.mxl`) from the device via the File API. No upload to a server.
2. Render the score with a cursor that follows playback.
3. Play back with a piano sound: play/pause, tempo from 25% to 100%, start from a clicked measure.
4. A keyboard below the score that highlights the keys sounding at the current moment: left hand orange, right hand blue, with the note name on the key.
5. Hand selection: left, right or both. The unselected hand is muted or played more quietly.
6. Loop over a range of measures.

Later (not in the MVP): MIDI input from a digital piano with a wait mode, loading MIDI files, offline use. See `docs/roadmap.md`.

## Hard rules

### Copyright

- Never write out copyrighted music: no notes, no MusicXML, no MIDI, not even "approximately" or "from memory". This applies even when the user asks for it.
- The app is a generic player. Copyrighted pieces only enter it through a file the user supplies.
- Test and example files are public domain only (Bach, Beethoven, Satie, Chopin, ...) or created for this project. Record the source and license of every file in `tests/fixtures/README.md`. Note: a modern edition or arrangement of an old work can still be protected.
- Loaded scores stay in the browser. Never bundle scores in the build or host them publicly.

### Working agreements

- **No band-aids.** Fix the cause, not the symptom. If a fix masks a symptom, say so and propose the real solution.
- **No spaghetti code.** Changes are scoped and well structured, without implicit dependencies or entangled logic.
- **Say so when the right approach takes more work** than the task suggests. Do not silently cut corners.
- **Never modify files in `node_modules/` or `vendor/`.** They are overwritten on update. State where the change belongs instead.
- **No em dash ("—")** in responses, UI text, documentation or comments.
- **Commit messages without Claude as co-author.**
- Communicate with the maintainer in Dutch. Documentation, code and comments are in English.

## Stack

- Vite + TypeScript, fully client-side, no backend. Versions and why: `docs/decisions.md` ("Toolchain versions").
- Notation: OpenSheetMusicDisplay (OSMD) 3, decided in the phase 1 spike (see `docs/decisions.md`). Playback is our own.
- Sound: `smplr` 1 (SplendidGrandPiano), samples from smplr's hosted set until they are self-hosted (phase 3). See `docs/research/02-audio.md` and `docs/decisions.md`.
- Keyboard: custom component, 88, 76 or 61 keys.
- Tests: Vitest. Pure logic runs in Node; tests that load a score with OSMD run in jsdom (`// @vitest-environment jsdom`). jsdom cannot measure text, so OSMD cannot render there: check layout code (e.g. the cursor) in a browser.
- Linting and formatting: ESLint (typescript-eslint, strict type-checked) and Prettier.
- UI text in English for now (multilingual later); code and identifiers in English.
- Hosting: GitHub Pages project site (https://yvessterckx.github.io/piano/), deployed by GitHub Actions. Static only; a Symfony backend is planned for later.

## Architecture

Keep these layers separate (all under `src/`), so the renderer stays replaceable and the core is testable without DOM or audio:

- `score/`: loading and rendering the file. `scoreFile` checks a picked file before it is loaded (the file input has no `accept` filter, see `docs/decisions.md`). `score/osmd/` is the only code that knows OSMD: `OsmdScore` loads and renders, `extractTimelineInput` walks OSMD's iterator (which unrolls repeats, endings and D.C./D.S.) and reports every written note per pass as a `NoteOccurrence`, and the sustain pedal marks per pass, `readScoreLayout` reads the cursor columns and measure extents after each render. `OsmdScore` lays the score out as systems under each other or as one horizontal line. The cursor band (`ScoreCursor`) is our own element, not OSMD's cursor; `scrollToKeepReading` decides when the score scrolls (a new system to the top; on one line, stepwise with the next measure in view).
- `timeline/`: pure data, no DOM, no audio, no OSMD. `buildTimeline` turns note occurrences into a `Timeline`: events `{ startBeat, durationBeats, soundingEndBeat, midi, hand, staff, measure, noteRefs }` sorted by beat, plus measures in playback order, tempo changes and the spans where the sustain pedal is down. Ties are merged here, per pass; `pedal.ts` pairs the pedal marks and works out how long each note sounds with the pedal (`durationBeats` is how long the key is held). A beat is one quarter note, counted from the start of the unrolled piece.
- `playback/`: `Transport` (play, pause, seek, tempo, loop) schedules the timeline's notes a short time ahead on the audio clock and gives the position at any audio time; `tempoMap` converts beats and seconds; `PianoSound` is the smplr adapter (one piano per hand, shared samples). The transport only knows the `AudioClock` and `NotePlayer` interfaces, so it is tested without audio.
- `keyboard/`: `Keyboard` draws all keys fitted to the width and lights the ones it is given, colored by hand and named as written (do re mi or C D E). When the keys are too narrow for names, the names of the lit keys go in a row above them (`spreadLabels`). Key positions come from `keyboardGeometry` (`keys.ts`), shared with the falling notes; a pedal key can be shown at the right. Knows nothing about scores.
- `roll/`: the falling notes. `rollScene` is pure: from the timeline, the position, the loop and the key geometry it computes the bars, pedal tails, lines and labels in pixels. `FallingNotes` draws that on a canvas. Knows nothing about OSMD, smplr or the transport.
- `ui/`: the practice screen (`practicePage`), the layout per device and orientation (`layout`: phone portrait, phone landscape, regular; `style.css` keys off `data-layout`), popovers, the screen wake lock, device preferences, icons. It wires the layers: cursor, keyboard and falling notes are drawn from the transport's position on every animation frame. OSMD and smplr are loaded on demand.

Outside `src/`: `tests/fixtures/` (test scores, see its README), `tests/helpers/`, `tools/` (the dev-only Vite plugin that serves the test scores).

Single source of truth for time: the `AudioContext` clock. Cursor and keyboard follow the transport, never the other way around.

Hand assignment: MusicXML does not say which hand plays a staff, so this is an assumption, kept in `timeline/hands.ts` so it can later be overridden per piece. A part with two staves: top staff right, bottom staff left. Single-staff parts (a piano score saved as one part per hand): the first is right, later ones left.

## Design summary

- Dark interface (`#111418`), white score card. One screen without page scroll: controls in one bar at the top (a rail along the side on phones in landscape), the score directly above the keyboard, the keyboard (all 88 keys, fitted to the width) at the bottom edge. Optional falling notes between the score and the keyboard (instead of the line of music on a phone in landscape). See `docs/decisions.md`.
- Left hand `#D9730D` (orange), right hand `#1F6FEB` (blue). The pair also differs in lightness, so it stays readable for people with color vision deficiency.
- Inter for body text, Space Grotesk for headings.
- Responsive: usable on phones, tablets and laptops. Buttons at least 44 px high, so the app works on a tablet at the piano.

## Open questions

Ask the maintainer about these if they are not yet answered in `docs/decisions.md`:

- Is it a digital piano with a USB or MIDI connection? Note that MIDI input is not possible in browsers on iPad or iPhone.

## Commands

Node 26 (see `.nvmrc`).

- `npm run dev`: dev server. The menu lists the test scores (development only); `?fixture=<file name>` opens one directly, e.g. on a simulator.
- `npm test`: all tests once (`npm run test:watch` to keep watching).
- `npm run check`: typecheck, lint, format check and tests: what CI runs before a deploy.
- `npm run build`: production build in `dist/`. Contains no scores.
- `npm run format`: format all files with Prettier.

Every push to `main` is checked and deployed to GitHub Pages by `.github/workflows/deploy.yml`.
