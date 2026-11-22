# Decisions and open questions

Update this file whenever a decision is made. Newest first within each section.

## Decisions

### 2026-11-22: OpenSheetMusicDisplay for notation (result of the phase 1 spike)

We use OSMD, not Verovio. With OSMD 3.0.0 the spike met all four success criteria of `research/01-notation-and-rendering.md`, on four public-domain pieces and four scores written for the tests (`tests/fixtures/`):

1. **Rendering:** every test score renders, including a compressed MXL file and piano scores saved as one part per hand. No console errors.
2. **Timeline:** OSMD's iterator walks the score in playback order: repeats, first and second endings and D.C. al Fine are unrolled, with the position in both the unrolled piece and the score. Ties are merged by our own pure `timeline/` code, per pass, so a note tied into a first and a second ending is right on each pass. Tests check exact results on the handmade scores and the full measure order of each real piece.
3. **Cursor on any beat:** our own cursor band, positioned from OSMD's layout. A jump is two binary searches (measure, then note column): 0.36 ms on average for The Entertainer (92 measures, 152 in playback order), including updating the page. OSMD's built-in cursor is not used, because putting it at a position means walking its iterator from the start.
4. **Hand per note:** derived from the staff, for both layouts (one part with two staves, one part per hand).

Verovio was not tested: the condition for testing it (OSMD failing criterion 2 or 3) did not occur. It would also add a MusicXML-to-MEI conversion and a larger WebAssembly bundle, under LGPL.

Known limits, to handle in later phases:

- Bundle size: OSMD makes the build 1.49 MB (391 KB gzip). Load it lazily before production use.
- OSMD's type declarations omit `undefined` in places (`Note.TieStopWithoutStartDirection`, entries of `GraphicalMusicSheet.MeasureList`). The adapter widens these types at the boundary.
- OSMD keeps only numeric measure numbers: a measure numbered e.g. "X1" (MuseScore's unnumbered pickup) gets an empty label.
- Grace notes and cue notes are left out of the timeline.
- D.S. and Coda jumps are not covered by a test yet; D.C. al Fine is.
- A file without a tempo marking plays at OSMD's default of 100 bpm.
- Cursor positions depend on the rendered layout and are only verified in a browser: in jsdom, OSMD cannot measure text and therefore cannot render.
- OSMD 3.0.0 was one day old when chosen. Pinned exactly; upgrade deliberately.

### 2026-11-22: Toolchain versions

- OpenSheetMusicDisplay 3.0.0 (released 2026-11-21), pinned exactly. The breaking changes in 3.0 are API cleanup that does not affect a new project, and the release fixes parts the spike depends on: the iterator over repeats, ties into a second ending, and `load()` rejecting with a clear reason.
- TypeScript 6.0, not 7.0: typescript-eslint 8 supports TypeScript `>=4.8.4 <6.1.0`. Move to TypeScript 7 once typescript-eslint supports it.
- Vite 8, Vitest 5, ESLint 10 with typescript-eslint, Prettier 3.

### 2026-11-22: Proof of concept scope and future backend

The proof of concept covers the full MVP scope in `CLAUDE.md`: loading a piece, the notation with a cursor, playback with tempo from 25% to 100%, the keyboard with highlighted keys, hand selection and a loop over a range of measures. It does not store scores: files are loaded from the device and stay in the browser. A Symfony application that stores scores is planned for later; storing user files on a server is a separate decision with its own copyright implications.

### 2026-11-22: Hosting on GitHub Pages

The proof of concept is hosted on GitHub Pages as a project site, built and deployed by GitHub Actions from the public repository `yvessterckx/piano`: https://yvessterckx.github.io/piano/. It is the only site on that account: the earlier game builds are taken off the user site (`yvessterckx.github.io`), which redirects to the piano. The build never contains scores.

### 2026-11-22: Responsive, laptop first

The app must be responsive and usable on mobile phones and tablets. Initial testing happens on a laptop.

### 2026-11-22: English UI for now

The UI is in English. Multilingual support comes later; until then, no i18n framework.

### 2026-11-22: Documentation in English

All documentation, code and comments are written in English, in a neutral, professional tone. The UI language is a separate open question (see below).

### 2026-11-22: Documentation consolidated in the repository

Research and project instructions from an earlier exploratory session were moved into this repository, so development can continue in Claude Code.

### 2026-11-20: No copyrighted music supplied by Claude

Claude does not supply notes of copyrighted pieces. The app is a generic player for files the user provides. Claude may supply public-domain pieces or use them as test files.

### 2026-11-20: Drawn keyboard instead of a photo

Highlighting keys on a photo of a real piano is fragile (perspective, lighting, alignment). Instead, the app draws a keyboard that matches the target piano. A photo serves at most to determine the number of keys.

### 2026-11-20: Practice screen layout

Score at the top, controls in the middle, keyboard at the bottom. Dark interface, white score card. See `design/`.

### 2026-11-20: Colors per hand

Left hand orange (`#D9730D`), right hand blue (`#1F6FEB`).

## Corrections

### 2026-11-22: Buying MusicXML is less straightforward than assumed

Earlier notes named Musicnotes and MuseScore as sources for MusicXML of copyrighted pieces. Musicnotes only delivers through its own apps and as PDF, and the "Official scores" on MuseScore.com cannot be downloaded. See `research/03-sources-and-licensing.md` for the routes that do work.

## Open questions

| Question                                         | Why it matters                                             | Answer                                                              |
| ------------------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------- |
| Number of keys on the target piano (88, 76, 61)? | Keyboard range                                             |                                                                     |
| Do re mi or C D E?                               | Note names on the keys                                     |                                                                     |
| Which device is used for practice?               | Screen size; MIDI input is not possible on iPad            | Responsive, usable on mobile; tested on a laptop first (2026-11-22) |
| Digital piano with USB/MIDI?                     | Wait mode and per-note feedback                            |                                                                     |
| OSMD or Verovio?                                 | Core of the app                                            | OSMD (2026-11-22, see decisions above)                              |
| Where does the app run?                          | Locally or on static hosting, without scores on the server | GitHub Pages (2026-11-22)                                           |
| UI language: Dutch, English or multilingual?     | All UI text, and whether i18n is needed from the start     | English for now, multilingual later (2026-11-22)                    |
