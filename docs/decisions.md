# Decisions and open questions

Update this file whenever a decision is made. Newest first within each section.

## Decisions

### 2026-11-22: Keys struck now and keys held on

A long written note does not say whether the finger holds the key or the sustain pedal holds the sound; piano arrangements often write long tied notes that no hand can hold together (e.g. octaves in both hands plus a held bass), relying on the pedal. Lighting every written note as a held key then suggests pressing them all at once.

- The keyboard lights the keys struck at this moment in full, and the keys struck earlier and still written as held in a lighter shade of the hand color (also in the row of names above the keys on a phone). "This moment" is the latest onset at or before the position among the notes of the practiced hand(s) (`heldKeysAt` in `timeline/queries.ts`).
- At the hit line of the falling notes, only the keys struck now glow; the bars already show how long each note lasts.
- MusicXML does not say which notes the fingers hold, so the app does not guess: a lighter key means "struck earlier, held on (by finger or pedal)".

### 2026-11-22: Falling notes and the sustain pedal

Based on `research/06-falling-notes-view.md` and its design example. Built as designed there, with one switch to turn the feature off.

- **Optional, off by default.** "Falling notes" is a switch in the bar (icon and word on tablets and laptops, the icon alone below 900 px wide and in the rail on a phone in landscape) and in the menu (the only place on a phone in portrait). The choice is remembered on the device. Switched off, the screen is exactly as without the feature.
- **Placement:** between the score and the keyboard, flush with the keys, the score keeping 45% of the space (on a laptop about one system); on a phone in landscape instead of the line of music, which stays laid out while hidden.
- **Time scale:** written time at 100% tempo, 4 seconds visible; a slower tempo makes the notes move slower without changing the picture. No setting for the look-ahead yet.
- **Encoding:** a solid bar while the key is held, a thin tail while the sustain pedal holds the sound, a gap before every new strike of a key, a line joining the notes of a chord per hand, darker and narrower bars for black keys, measure lines with the score's numbers, faint lines on the beats and at every C and F. Note names on the bars where the keys are at least 18 px wide; on narrower keys the row of names above the keyboard moves onto the bottom of the roll. The hand not practiced is an outline, or hidden when muted. While looping, the start of the loop follows its end, marked "Loop: back to m. X".
- **The pedal** shows as a strip to the right of the notes and a pedal key next to the keys, lit while the pedal is down, only for a piece with pedal marks.
- **The sustain pedal in playback:** notes now sound until the pedal is lifted (or the key is struck again), as written. One menu switch, "Sustain pedal (play and show)", offered only for a piece with pedal marks and on by default, turns this off together with the tails and the strip. It also applies with the falling notes off.
- **Reading pedal marks:** every mark counts and none is guessed (`timeline/pedal.ts`): "Ped." while the pedal is down is a change, a release without a pedal is ignored, a pedal still down at the end lifts there. A note released exactly at a lift or change is not held. Pedal instructions in words ("con pedale") and half pedaling are not read.
- **Technology:** one canvas in a new layer `src/roll/`: `rollScene` computes the picture at a position as pure data (unit-tested), `FallingNotes` draws it on every animation frame. The key positions come from `keyboardGeometry` in `keyboard/keys.ts`, which the keyboard now uses too, so the notes fall exactly onto their keys.

Known limits:

- OSMD pairs pedal marks per staff and drops a release written under another staff than its "Ped." (it then lasts until the next mark). Reading the marks from the MusicXML ourselves would avoid this; not done, as such files seem rare.
- A tempo change during playback restarts the scheduling and cuts sounding notes (see "Playback"); with the pedal, notes are longer, so this is more audible.
- With the falling notes on a phone in landscape the score is hidden, so a loop cannot be chosen by tapping measures there; switch the falling notes off to choose one. Tapping or dragging the roll to move through the piece is not built.
- Checked in Chrome (laptop and tablet widths) and in the iOS Simulator (iPhone, both orientations); not yet on a real device. Smoothness of the moving picture on a phone still to be judged at the piano.

### 2026-11-22: Practice screen layout on phones and tablets

Based on `research/05-practice-screen-layout.md`. Practice happens on an iPhone and on an iPad, in portrait or in landscape, so both orientations must work. The music desk does not cover the bottom edge of the screen.

- **One screen, no page scroll.** The score sits directly above the keyboard, the keyboard at the bottom edge, and all controls in one compact bar at the top: play and pause, back to the start (of the loop or the piece), the measure, tempo, hands, loop and a menu for the rest. On a phone in landscape the bar becomes a rail along the side. This replaces the header and the controls in the middle of the 2026-11-20 layout.
- **Score:** systems under each other on phones in portrait and on tablets, with the cursor's system kept at the top. On phones in landscape one horizontal line that moves on stepwise, so at least one measure ahead stays in view. The app chooses by device and orientation; there is no switch.
- **Keyboard: always all 88 keys,** fitted to the width, without horizontal scrolling. Where the keys are too narrow for names (on a phone), the names of the sounding notes appear in a strip above the keyboard. This differs from the research, which recommended a keyboard fitted to the range of the piece.
- **Loop:** chosen by tapping its first and last measure in the score.
- **Progress slider:** left out on phones (tap a measure, or "back to start"); kept on tablets and laptops.
- **Title:** in the bar where there is room (tablets, laptops); on a phone only in the menu.
- **The screen stays awake** while a piece is open and playing (Screen Wake Lock), and a **fullscreen button** appears where the Fullscreen API exists (not on iPhone).
- Taken over from the research without discussion: a score size setting stored on the device on top of a default zoom of 1 (readability at the piano still to be checked), and portrait on phones supported with a one-time hint that landscape gives more room.
- Not chosen for now: hiding the keyboard, and an installable web app earlier than phase 3.

Built on the same day. Details and known limits:

- The layout is chosen by viewport (`ui/layout.ts`): phone landscape below 500 px high, phone portrait up to 600 px wide, everything else regular. Rotating lays the score out again; playback continues.
- On one line, the music is drawn as large as the height allows up to the score size setting, but not below 60%. A piece with notes far above or below the staves (e.g. the Schumann test piece) is then taller than a phone in landscape: the staves stay in view and the notes far outside them can be cut off.
- The keyboard puts the names on the keys from 18 px per white key (tablets in landscape, laptops) and in the row above them below that.
- Tempo and hands open small panels from the bar (popovers); note names, score size, opening a file and full screen are in the menu.

### 2026-11-22: No file type filter on "Open file"

The file input has no `accept` attribute. On iOS, Safari turns the accepted extensions into system file types and silently drops the ones the system does not know, which includes `.mxl` and `.musicxml`; vendor MIME types such as `application/vnd.recordare.musicxml` fare no better. Checked in WebKit's source (`WKFileUploadPanel`) and in the iOS Simulator: with the filter, only `.xml` files could be picked. Android was not checked.

Instead, the app checks the picked file (`score/scoreFile.ts`) by its first bytes only: a zip archive (compressed MusicXML) or XML text in UTF-8. Any other file is turned down with a message, without reading the rest of it and without closing the open piece. Whether the file holds a score is decided when OSMD loads it.

The cost: the picker lists all files, also on a laptop, and iOS first offers a menu (Photo Library, Take Photo or Video, Choose File).

### 2026-11-22: Playback

- **Own lookahead scheduler, no Tone.js.** `playback/Transport` hands notes to the audio engine 150 ms ahead on the `AudioContext` clock and computes the position from that clock. It is small, fully unit-tested without audio, and saves a dependency. Changing the tempo, the loop or the position while playing restarts the scheduling from the current position, which also cuts notes that are sounding.
- **smplr, one SplendidGrandPiano per hand** with a shared `SampleLoader`: each hand has its own volume, the samples are loaded once. Only the notes of the piece are loaded, at one velocity layer.
- **Samples from smplr's hosted set** (`smpldsnds.github.io`, a request to a third party) until they are self-hosted in phase 3. Cached with the Cache API where available. Without the samples, the app keeps working without sound.
- **Hand selection:** the practiced hand plays at full volume and is shown on the keyboard; the other hand plays at 35% volume, or not at all with "Mute the other hand".
- **Starting from a clicked measure** starts at its first occurrence in playback order. Moving outside an active loop ends the loop.
- **The cursor and keyboard follow the sound:** both are drawn from the position at the audio time that is being heard (current time minus output latency).
- **OSMD and smplr are loaded on demand:** the page itself is about 36 kB of JavaScript (13 kB gzip), falling notes included.

### 2026-11-22: 88 keys, note names do re mi by default

The target piano has 88 keys (A0 to C8). Note names on the keyboard are do re mi (fixed do, as taught in Belgium: do re mi fa sol la si) by default, with a switch to C D E. The choice is remembered on the device.

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

Score at the top, controls in the middle, keyboard at the bottom. Dark interface, white score card. See `design/`. The arrangement was replaced on 2026-11-22 ("Practice screen layout on phones and tablets").

### 2026-11-20: Colors per hand

Left hand orange (`#D9730D`), right hand blue (`#1F6FEB`).

## Corrections

### 2026-11-22: Buying MusicXML is less straightforward than assumed

Earlier notes named Musicnotes and MuseScore as sources for MusicXML of copyrighted pieces. Musicnotes only delivers through its own apps and as PDF, and the "Official scores" on MuseScore.com cannot be downloaded. See `research/03-sources-and-licensing.md` for the routes that do work.

## Open questions

| Question                                         | Why it matters                                             | Answer                                                  |
| ------------------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------- |
| Number of keys on the target piano (88, 76, 61)? | Keyboard range                                             | 88 (2026-11-22)                                         |
| Do re mi or C D E?                               | Note names on the keys                                     | Do re mi by default, switchable to C D E (2026-11-22)   |
| Which device is used for practice?               | Screen size; MIDI input is not possible on iPad            | iPhone and iPad, in portrait and landscape (2026-11-22) |
| Digital piano with USB/MIDI?                     | Wait mode and per-note feedback                            |                                                         |
| OSMD or Verovio?                                 | Core of the app                                            | OSMD (2026-11-22, see decisions above)                  |
| Where does the app run?                          | Locally or on static hosting, without scores on the server | GitHub Pages (2026-11-22)                               |
| UI language: Dutch, English or multilingual?     | All UI text, and whether i18n is needed from the start     | English for now, multilingual later (2026-11-22)        |
