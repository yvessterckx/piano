# Research: a falling-notes view and the sustain pedal

Researched on 22 November 2026. App descriptions change with every release: re-check them before relying on them. Code references are to OSMD 3.0.0 and smplr 1.2.0 as installed in `node_modules`.

Design example in Claude Design: https://claude.ai/artifact/P3KxT31arP2uC6SFJUtorH. It shows a four-measure exercise written for the example, with both hands, chords, held notes and a pedal changed at every barline:

- [Regular layout](https://claude.ai/artifact/P3KxT31arP2uC6SFJUtorH#artboard-Main) (tablet, laptop): score, falling notes and keyboard; the play button and the tweaks (tail style, note names, look-ahead, position) work.
- [Phone landscape](https://claude.ai/artifact/P3KxT31arP2uC6SFJUtorH#artboard-PhoneLandscape): falling notes instead of the score line, with a loop over measures 2 and 3.
- [Phone portrait](https://claude.ai/artifact/P3KxT31arP2uC6SFJUtorH#artboard-PhonePortrait): score and falling notes stacked.
- [Visual encoding](https://claude.ai/artifact/P3KxT31arP2uC6SFJUtorH#artboard-Encoding): a close-up with every element numbered and explained, and the options for notes held by the pedal.

## Question

How can the practice screen show the coming notes as bars that fall toward the keyboard (a piano roll, also called a waterfall or "Guitar Hero" view), including the notes that keep sounding through the sustain pedal, in a way that helps beginners who can already read some notation instead of replacing their reading? How does it fit the decided layouts and the architecture?

Trigger: the learner wants to see which keys come next and which notes keep sounding through the sustain pedal.

## In short

- Falling notes are common in players (Synthesia, Neothesia, MIDIano) and rare in learning apps that teach reading (flowkey, Simply Piano, Playground Sessions and Piano Marvel use the score). No product found shows which notes ring on through the pedal, except one opt-in mode in the open-source MIDIano.
- The evidence on reading is thin (small, short studies) but points one way: a roll speeds up learning a piece, and learners stop looking at the score when both are shown. The view should be optional, shown together with the score, and tied to it (the same measure numbers, the sounding notes colored in the score).
- MusicXML pedal marks are read by OSMD 3.0.0 and reachable per measure. `extractTimelineInput` can report them per pass, and `timeline/` can derive, per note, how long the key is held and how long it sounds. Pedal marks are common in Romantic piano music and absent from our test scores.
- Recommended encoding: a solid bar while the key is held, a thin tail while the pedal holds the sound, a pedal strip to the right of the keys, a gap before every new strike of the same key.
- Recommended technology: one canvas, drawn on every animation frame from the transport's position, in a new layer that reads the timeline and the keyboard's geometry and knows nothing about OSMD.

## How other apps do it

### Falling-notes players

- **Synthesia** (closed source, latest version 10.9.2). Notes are falling blocks, played "just as the block touches the top of the on-screen keyboard"; there is no separate hit line ([first song guide](https://synthesia.app/support/guide/firstSong)). Page Up and Page Down or a vertical pinch change how much of the song is visible; the guide does not say whether that window is in seconds or beats. The keyboard can be zoomed to the song's range, the learner's keyboard or a custom range. Each part is set to left hand, right hand or background, with a free color per part; "Auto Color" makes the left hand blue and the right hand green ([song setup](https://synthesia.app/support/guide/songSetup), [assigning hands](https://synthesia.app/support/guide/assignHands)). Measure lines in the falling notes exist since version 0.6.4; version 10 shows the start of the next loop before it begins ("No more sudden jumps") ([news](https://synthesia.app/news)). Sheet music, falling notes or both can be shown; with both, the notation sits above the roll, and with the roll off the sheet fills the screen ([display guide](https://synthesia.app/support/guide/displaySheetMusic)). Note labels offer letter names, fixed do and finger numbers ([labels](https://synthesia.app/support/guide/labels)). The pedal is documented only as input from the learner's keyboard; no pedal display was found. The forum was offline.
- **Neothesia** (open source, Rust, GPL-3.0; read at commit `cd7f146`, [repository](https://github.com/PolyMeilex/Neothesia)). Notes fall onto a keyboard that takes 20% of the window height; a negative speed makes them rise instead. The vertical scale is pixels per second of song time (default 400 physical pixels per second, about 2.2 s of look-ahead on a 1080 px window); slowing playback makes the notes fall slower with the same spacing. A bar's lower edge reaches the keyboard exactly at the note's start, the bar slides behind the keyboard, and the key lights in the track color. Bars are as long as the key is held (at least 0.1 s) and shortened by 0.01 s "to make a little gap" between repeated notes; notes on black keys use a darker shade. Colors follow MIDI tracks, not hands. Optional bar lines and octave lines (at every C and F), note names at the leading edge of each bar, a looper and a progress bar to seek. The sustain pedal is not drawn: bars come from note-on and note-off only. Rendering: wgpu, instanced quads in a WGSL shader.
- **MIDIano** (open source, Canvas 2D, [repository](https://github.com/Bewelge/MIDIano), last change 2021). "Seconds shown on screen" (default 3) sets the window; the piano can sit above the bottom edge. It is the only product found that draws the pedal, in three opt-in modes, all off by default: a full-width line at each pedal on and off event, a translucent band while the pedal is down, and "Draw Sustained Notes": a half-width tail at 50% opacity from key release to pedal release (`js/Rendering/SustainRenderer.js`, `js/Rendering/NoteRender.js`). Each track has a color with a white-key and a black-key variant. The current hosted version at [midiano.com](https://midiano.com/) says it moved to WebGL and adds generated sheet music, a wait mode and measure loops.
- **Magenta.js** has a `WaterfallSVGVisualizer`: an SVG waterfall above an SVG keyboard of 88 keys ([docs](https://magenta.github.io/magenta-js/music/classes/_core_visualizer_.waterfallsvgvisualizer.html)).
- **PianoBooster** (open source, C++ with Qt and OpenGL, [repository](https://github.com/pianobooster/PianoBooster)) does not use falling notes: a grand staff scrolls sideways through a play zone at 40% of the width, at a constant number of beats per screen. The other hand's notes are dimmed, Left, Both and Right are one key press each, and "Follow You" stops the music until the right keys are played. Note durations are not drawn (the code that drew them is commented out as "not very useful"). The pedal is not displayed.

### Learning apps

- **flowkey**: a video of a pianist's hands above sheet music, with the coming notes marked on a keyboard. No falling-notes mode. Wait mode, loop, slow motion and hand choice ([flowkey](https://www.flowkey.com/en), [App Store](https://apps.apple.com/us/app/id1020357408)).
- **Simply Piano**: sheet music; a keyboard appears only as a hint when the learner struggles, and notes played after a hint are marked as such ([help center](https://piano-help.hellosimply.com/en/articles/7943490-learning-with-simply-piano-the-basics)). No falling-notes mode found.
- **Playground Sessions**: interactive sheet music with a cursor, speed down to 1 bpm, loops over selected measures (the other measures fade out), optional finger numbers or letter names ([vendor blog](https://blog.playgroundsessions.com/11-ways-to-learn-piano-faster-with-playground-sessions/)). It markets "real sheet music, not just scrolling notes" ([comparison](https://start.playgroundsessions.com/playground-sessions-vs-simply-piano)).
- **Piano Marvel**: sheet music with a practice mode that waits for the learner, and user-uploaded MusicXML ([features](https://pianomarvel.com/en/new-features)). No roll.
- **Yousician** (piano): four notation styles chosen in the pause menu: enhanced (colored notes with names), falling notes, colored notation and plain sheet music; in falling notes the left hand is blue and the right hand purple. Source: search extracts of its help center, which refused direct access ([notation options](https://support.yousician.com/hc/en-us/articles/208678605-Notation-options-in-piano)).
- **Others**: Oktav has a falling-notes toggle that replaces the sheet music ([help](https://help.oktav.com/en/articles/39-falling-notes)); Rocksmith+ piano offers a 3D falling-notes view or sheet music with a lit keyboard ([MusicRadar](https://www.musicradar.com/news/ubisoft-rocksmith-piano-lessons)); PianoVision projects falling notes onto the real keys in mixed reality ([UploadVR](https://uploadvr.com/pianovision-app-lab-release/)).

### Patterns

| Aspect         | What is common                                                                            | Exceptions                                                                  |
| -------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Direction      | Down toward a keyboard at the bottom                                                      | Neothesia and MIDIano can reverse it; PianoBooster scrolls a staff sideways |
| Hit point      | The top edge of the keyboard; the key lights while the note sounds                        | PianoBooster draws a play zone                                              |
| Look-ahead     | A time window: about 2 to 3 s by default (Neothesia, MIDIano), adjustable                 | PianoBooster: a constant number of beats                                    |
| Tempo          | Slower playback makes the notes fall slower; the picture does not change                  |                                                                             |
| Held notes     | Bar length is the key duration                                                            |                                                                             |
| Repeated notes | A small gap between bars of the same key                                                  |                                                                             |
| Black keys     | A darker shade of the same color                                                          |                                                                             |
| Hands          | One color per hand or track; the other hand dimmed or hidden                              |                                                                             |
| Chords         | No visual grouping                                                                        | Synthesia can require all chord notes to be pressed together                |
| Pedal          | Not drawn                                                                                 | MIDIano, opt-in: tails at half width and 50% opacity                        |
| Guides         | Measure lines; octave lines at C (and F)                                                  |                                                                             |
| Score          | Optional, above the roll (Synthesia); learning apps that teach reading use the score only |                                                                             |

## Effect on learning to read

- **P.I.A.N.O.** (Rogers et al., ACM ITS 2014, [PDF](https://www.uni-ulm.de/fileadmin/website_uni_ulm/iui.inst.100/1-hci/hci-paper/2014/2014-gugenheimer-piano.pdf)) compared a piano roll projected onto the keys, Synthesia on a screen, and sheet music with a moving marker. With 56 novices (right hand only, 15 minutes per system), the projected roll gave more correct notes and durations and lower cognitive load; the authors attribute Synthesia's higher load to attention split between the screen and the keys. A five-day study with 18 learners showed a steeper learning curve. Performance was always measured with the aid present, and sight-reading was not measured; the authors state that roll notation is unlikely to support sight-reading skills. Learners worried about depending on the system.
- **When roll and score are shown together, the score is ignored.** In an augmented-reality prototype with falling lines and the score above them (Chow et al., AUIC 2013, [PDF](https://www.cs.auckland.ac.nz/~burkhard/Publications/AUIC2013_ChowEtAl.pdf), informal study with 7 learners), 3 of 7 never looked at the notation, and notation literacy was the one goal not met. In a ten-lesson study with 32 beginners aged 13 to 16, half with an AR headset, tutors reported slower sight-reading development because pupils could learn pieces without the staff, and no overall progress advantage (Royal College of Music and music hubs, 2024, [summary](https://www.musicmark.org.uk/wp-content/uploads/AR-Piano-Exec-Summary-FINAL.pdf)).
- **Reviews**: of 56 augmented-piano papers, only 14 address sight-reading, none is longitudinal, and systems without notation may teach a piece rather than the piano; the authors recommend mapping the roll to classical notation (Deja et al., PACM HCI 2022, [arXiv](https://arxiv.org/abs/2208.09929)). No reviewed AR or VR study measured retention (Wilson and Pfeiffer, Frontiers in Virtual Reality 2023, [article](https://www.frontiersin.org/journals/virtual-reality/articles/10.3389/frvir.2023.1207397/full)). No randomized study of sight-reading after roll practice was found, and no eye-tracking study of falling notes.
- **Fading the aid**: guidance that is always available makes learners depend on it; practice performance improves while performance without the aid suffers (the guidance hypothesis: Salmoni, Schmidt and Walter 1984; Winstein and Schmidt 1990, cited from reference lists). In VR piano practice, guidance whose opacity adapts to the learner's performance gave better pitch and fingering retention than fixed guidance (Hsieh et al., CHI 2026, [abstract](https://research.tudelft.nl/en/publications/skill-adaptive-ghost-instructors-enhancing-retention-and-reducing/), 30 participants, short-term). Applying this to falling notes is an analogy, not direct evidence.
- **Teachers**: falling notes and key labels should be used sparingly and the score whenever possible ([piano teacher blog](https://www.pianosightreading.com.au/synthesia/)); a gradual route is to turn the sheet music on, then shrink or switch off the falling notes ([teacher review](https://pianoers.com/synthesia-piano-review/)). A counterpoint from a music teacher: the falling blocks give the same anticipation as reading left to right ([Yamaha educator hub](https://hub.yamaha.com/?p=44644)).

What follows for this app, whose learners can already read some notation:

- The roll is an aid next to the score, not a replacement: off by default, switched on by the learner, and shown together with the score wherever the screen allows.
- The two views should point at each other: the same measure numbers in the roll as in the score, the cursor in the score at the same moment as the hit line, and the sounding notes colored per hand in the score (already on the roadmap for phase 3).
- The roll is most useful for what the score shows least directly to a beginner: where the hands go on the keyboard, rhythm in time, and how long notes ring through the pedal. Reading the pitches stays the score's job.
- A way to fade the roll (fainter after each pass of a loop, or for the practiced hand only) is worth trying later; there is no evidence yet that it works for a roll.

## The sustain pedal in MusicXML

### Encoding

From the MusicXML 4.0 reference ([`<pedal>`](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/pedal/), [pedal types](https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/pedal-type/), [`<sound>`](https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/sound/), [yes-no-number](https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/yes-no-number/)):

- `<pedal>` sits in a `<direction-type>` of a `<direction>`, on a staff (`<staff>`), at the direction's position in the measure. It is always empty.
- `type`:

  | Value         | Meaning                                                 | Since |
  | ------------- | ------------------------------------------------------- | ----- |
  | `start`       | Damper pedal down                                       |       |
  | `stop`        | Pedal lifted without a retake                           |       |
  | `change`      | Lift and retake, drawn as an inverted V in a pedal line |       |
  | `continue`    | Formatting across system breaks; no change in the pedal | 3.0   |
  | `sostenuto`   | Start of the sostenuto (middle) pedal                   | 3.1   |
  | `discontinue` | End of a pedal line without the drawn lift              | 4.0   |
  | `resume`      | Start of a pedal line without the drawn downstroke      | 4.0   |

- `line="yes"` draws a bracket line (with `change` notches); `sign="yes"` draws "Ped." and `*`. If `sign` is missing it is yes when `line` is no, and no when `line` is yes. `abbreviated` switches to the short "P" and "S" signs.
- `<sound damper-pedal="yes|no|0-100">`, with `sostenuto-pedal` and `soft-pedal` alike, affects playback only. A number is the percentage the pedal is pressed: half pedaling exists only here, never as a printed mark.
- The soft pedal (una corda) has no symbol: it is written as words, as are text instructions such as "con pedale", "sempre Ped." or "senza sordini".

### How common pedal marks are

- **Our test scores** (`tests/fixtures/`, all nine): no pedal marks at all, neither `<pedal>` nor `<sound damper-pedal>`.
- **OSMD's own test data** ([repository](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/tree/develop/test/data)), the 14 complete pieces with a piano or keyboard part (not the small test cases): pedal marks in 3 (Beethoven, An die ferne Geliebte; Schumann, Dichterliebe no. 1; Gounod, Méditation). The two exported by Finale write `<pedal line="no">` with `<sound damper-pedal>` next to it.
- **The ASAP dataset** ([repository](https://github.com/fosfrancesco/asap-dataset)), MusicXML of classical piano works transcribed by MuseScore users. Counted in the 224 scores by composers who died before 1920 (Prokofiev, Rachmaninoff, Ravel and Scriabin left out; the files were only counted, not kept or used): 56 have pedal marks (25%).

  | Composer                                    | Scores with `<pedal>` |
  | ------------------------------------------- | --------------------- |
  | Bach                                        | 0 of 59               |
  | Haydn                                       | 0 of 12               |
  | Mozart                                      | 0 of 6                |
  | Beethoven                                   | 13 of 63              |
  | Schubert                                    | 1 of 15               |
  | Schumann                                    | 5 of 11               |
  | Chopin                                      | 21 of 36              |
  | Liszt                                       | 14 of 17              |
  | Others (Balakirev, Brahms, Debussy, Glinka) | 2 of 5                |
  - Only `start` and `stop` occur (3,534 and 3,379), no `change`, `continue`, `resume`, `discontinue` or `sostenuto`. A retake is written as a stop directly followed by a start (561 times in the 23 scores with pedal lines). Style: 4,030 marks with `line="yes"`, 467 with `line="no"`, 2,416 without either attribute.
  - No `<sound damper-pedal>`, `sostenuto-pedal` or `soft-pedal` at all.
  - The marks are often inconsistent: in 32 of the 56 scores the number of starts differs from the number of stops. A "Ped." followed by another "Ped." without `*` is common (Chopin, Ballade no. 1: 242 starts, 223 stops), and so are stray stops (Beethoven, Sonata no. 21, third movement: 7 stops, no start).
  - In 9 further scores the pedal is only in words ("Pedal", "sempre Ped.", "senza sordini", "Pedale a discrezione").
  - Median density in the scores with marks: one mark every six measures; the densest (Chopin, Barcarolle) has about four marks per measure.

So pedal marks matter for Romantic repertoire and are rare in the Baroque and Classical pieces beginners often start with. Real files need a forgiving reader.

### What OSMD 3.0.0 exposes

Read in `node_modules/opensheetmusicdisplay` (type declarations and `build/opensheetmusicdisplay.min.js`), then checked by loading pedal test files and a real score with OSMD in jsdom:

- `ExpressionReader.addPedalMarking` reads `<pedal>`: `start` and `resume` open a pedal, `stop` and `discontinue` close it, `change` closes and reopens it (only for a line pedal). `continue` and `sostenuto` are ignored. A `stop` without an open pedal is ignored. A `start` while a line pedal is open closes that pedal first; a `start` while a sign pedal ("Ped.") is open replaces it without ever closing it.
- `<sound damper-pedal>` is not read at all (the bundle contains no "damper").
- The data: `sheet.SourceMeasures[i].StaffLinkedExpressions[staff][k]` is a `MultiExpression` with `PedalStart` and `PedalEnd` (each a `Pedal` or undefined) and `Timestamp`, a `Fraction` in whole notes relative to the start of the measure. `Pedal` has `IsLine`, `IsSign`, `ChangeBegin`, `ChangeEnd`, `BeginsWithoutHook` (resume) and `EndsWithoutHook` (discontinue). `MultiExpression` and `Pedal` are exported since 3.0.0 (`CHANGELOG.md`). As elsewhere in OSMD, the fields are typed without `undefined`.
- Results: OSMD's pedal function test (bracket lines with a change) and its resume and discontinue test came out as written, change flags included. Chopin's Ballade no. 1 from ASAP gave 242 pedal starts and 169 ends: 73 sign pedals are never closed, because the score starts a new "Ped." without a `*`.
- OSMD draws pedal marks in the score by default (`EngravingRules.RenderPedals`), both styles, with the change notch.

### Reading pedal marks in `extractTimelineInput`

`extractTimelineInput` already walks every measure occurrence in playback order with its `sourceIndex` and `startBeat`. For each occurrence it can read the pedal marks of that source measure and report them at `startBeat + Timestamp × 4`:

- `PedalEnd` as an "up" mark and `PedalStart` as a "down" mark, ups before downs at the same beat (a change).
- Marks of all staves together: there is one pedal, usually written under the bass staff.
- Per pass, like the notes: a repeated measure reports its marks again, so repeats, endings and D.C./D.S. need no special handling.
- It should not rely on OSMD's pairing (`ParentEndMultiExpression`), which leaves sign pedals open; `timeline/` pairs the marks itself (below).

A measure the iterator never visits would lose its marks. Every measure with notes or rests is visited, but a test should include a pedal mark in a measure of whole rests.

### Modeling held and sounding durations in `timeline/`

Today a `TimelineEvent` has one duration: from the strike to the end of the written note, ties merged. A proposal that keeps `timeline/` pure:

```ts
/** A sustain pedal mark as written, in playback order (reported by the score adapter). */
export interface PedalMark {
  readonly beat: number;
  readonly kind: 'down' | 'up';
}

/** The sustain pedal is down from startBeat up to endBeat. Adjacent spans are a pedal change. */
export interface PedalSpan {
  readonly startBeat: number;
  readonly endBeat: number;
}

// TimelineInput gains: readonly pedal: readonly PedalMark[];
// Timeline gains:      readonly pedal: readonly PedalSpan[];   // sorted, not overlapping
// TimelineEvent gains: readonly soundingEndBeat: number;       // >= startBeat + durationBeats
```

`buildTimeline` turns the marks into spans like a pianist reads them:

- "down" while up: the pedal goes down. "down" while down: a change (up and down at that beat). "up" while down: the pedal goes up. "up" while up: ignored.
- A pedal still down at the end of the piece goes up there.

Then, per event, after ties are merged:

- The key is held until `startBeat + durationBeats` (unchanged).
- If the pedal is down at that moment (a span starts strictly before it and ends after it), the note sounds until that span ends. A note released exactly where the pedal changes is not held: in legato pedaling the old notes are released when the new ones are struck, and the new pedal catches only the new notes.
- The sound stops earlier where the same key is struck again (by either hand).

`durationBeats` keeps meaning "how long to hold the key", which the keyboard and the roll's solid bars use; `soundingEndBeat` is for the roll's tails and for playback. `queries.ts` gains a query for the pedal state at a beat. All of this is unit-testable without OSMD, with exact results, like the tie merging. Our fixtures have no pedal: a handmade score is needed (bracket line with changes, "Ped." without `*`, a stray `*`, a pedal across a repeat, a re-struck note under the pedal, marks under both staves).

Not modeled: half pedaling (only in `<sound>`, which OSMD does not read), the sostenuto pedal (OSMD ignores it; none in the 224 scores) and words such as "con pedale". A sostenuto `stop` would close OSMD's open damper pedal; acceptable while sostenuto marks are this rare.

### Playback with the pedal

- Playback ignores the pedal today: each note stops at its written end.
- smplr 1.2.0 has no damper behavior. `setCC` exists, but only selects sample regions for instruments that define CC ranges, and is not scheduled on the audio clock (`node_modules/smplr/dist/index.js`).
- So the transport would emulate the pedal by passing the sounding duration (`soundingEndBeat`) instead of the written one; the piano samples decay naturally while the note "sounds". Sympathetic resonance of the undamped strings is not reproduced.
- Two existing limits become more audible with long pedal notes: a tempo change during playback restarts the scheduling and cuts the sounding notes (roadmap, phase 3), and a loop cuts notes at its end. Both are the same as for long written notes today.
- Whether playback should use the pedal is a choice: it sounds closer to the piece, but a learner who does not use a pedal yet hears something they are not playing.

## Visual encoding

The design example shows each point below. All of it follows from one function: the vertical position of a beat at the current position.

### Direction, hit line and time scale

- **Down toward the keyboard**, as in every falling-notes product. The hit line is the top edge of the keyboard: a bar's lower edge touches it when its key is struck, and the key lights in the hand color for as long as the solid bar passes, with a short glow at the hit line.
- **Vertical scale in written time at 100% tempo**: `y = hitLine - (secondsAt(beat) - secondsAt(position)) × pixelsPerSecond`, with `secondsAt` from the existing tempo map. The tempo slider changes how fast the picture moves, not the picture: the spacing stays the same at 25% and at 100%, as in Neothesia. A written ritardando takes more room, as it takes more time.
- **Look-ahead**: about 4 s at 100% tempo by default (one to two measures in most beginner pieces, and 2 to 4 times the eye-hand span of about one second measured for pianists, see `05-practice-screen-layout.md`), adjustable in a few steps. At 50% tempo the same picture takes 8 s to pass. The design uses 7 beats at 80 bpm (5.25 s).
- **Measure lines** across the roll with the measure number at the left edge, matching the score; fainter lines on the beats and at every C and F, like Neothesia's octave lines.

### Held notes and the pedal

- **Key held: a solid bar**, as long as the written duration (ties merged).
- **Sounding through the pedal**, from the key's release to the pedal's release. Three options, compared on the encoding artboard:
  - A. A thin tail, about a third of the bar's width, in the hand color: it reads as "still sounding", not as a key to press, and the difference is in shape, not only in lightness. MIDIano's "Draw Sustained Notes" uses a half-width tail.
  - B. A faded bar at full width (30% opacity with an outline): shows the sound fully, but looks like a longer key press, and the solid and faded parts differ only in lightness.
  - C. No tail, only the pedal strip: the simplest picture; which notes ring on is left to the ear.
- **The pedal strip**: a narrow lane to the right of the keys (the sustain pedal is the right pedal), filled while the pedal is down, with a gap where it is lifted and pressed again, which matches the notch in a pedal line. At the keyboard's level a "pedal key" lights while the pedal is down. The lane takes 12 to 18 px from the keyboard's width (2 to 3%), so it appears only when the piece has pedal marks and the pedal display is on.
- The key is lit only while it is held, never during the tail: "lit" keeps meaning "press this".

### Repeated notes, chords, black keys, names

- **A gap before every new strike of the same key**: 2 to 3 px are taken off the end of the earlier bar or tail. Under the pedal the tail stops where the key is struck again, because the new strike replaces the old sound.
- **Chords**: a thin line in the hand color joins the onsets of notes of one hand struck together. No product found does this; it helps to see a chord as one shape, and is cheap to drop if it adds clutter.
- **Black keys**: a narrower bar (the width of the black key) in a darker shade of the hand color, as in Neothesia and MIDIano. The dark shades must keep 3:1 contrast against the roll's background (WCAG 1.4.11): `#1A5FD6` for the right hand (3.3:1 on `#0C0F13`) and `#A65A0B` for the left (3.7:1); the hand colors themselves reach 4.1:1 (blue) and 5.9:1 (orange).
- **Note names**: at the leading (lower) end of a bar where the keys are at least about 18 px wide (tablets in landscape and laptops), in the existing naming (do re mi or C D E). On narrower keys, the names of the keys being pressed sit in a row just above the hit line, which replaces the names strip above the keyboard (`spreadLabels` already places such labels).

### Hands, color vision and motion

- **Hands**: left orange, right blue, as decided. With one hand practiced, the other hand's bars are outlines at reduced opacity (it still sounds at 35%), and hidden when it is muted. PianoBooster dims the other hand in the same way.
- **Color vision**: orange and blue stay apart for the common forms of color vision deficiency and differ in lightness. The encodings that matter for playing differ in shape as well as color: solid bar versus thin tail, wide versus narrow (black keys), and the pedal in its own lane.
- **Reduced motion**: the roll only moves while the learner plays and stops on pause, so it is under the learner's control (WCAG 2.2.2 concerns motion that starts automatically). With `prefers-reduced-motion: reduce` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)) the view should not be switched on by default (it is off anyway), and jumps (seek, loop) should not be animated. A stepped mode that moves once per beat is possible if a learner asks for it.

## Fit with the decided layouts

### Room per form factor

Estimated from the decided CSS (8 px padding and gaps, a 44 px bar, keyboard `clamp(110px, 18vh, 170px)`, 96 px on phones in portrait, 64 px in landscape) and typical browser viewports:

| Form factor (viewport, CSS px) | Height for score and roll | Width of a white key (88 keys) | Fits                                                                                                       |
| ------------------------------ | ------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Laptop (1280 × 720)            | about 514                 | 24                             | One system of the score (210 to 270 px at zoom 1) and a roll of about 250 to 300 px                        |
| Tablet, landscape (1180 × 740) | about 530                 | 22                             | As on a laptop                                                                                             |
| Tablet, portrait (820 × 1100)  | about 850                 | 15                             | Two systems and a roll of about 350 px                                                                     |
| Phone, portrait (390 × 660)    | about 490                 | 7                              | One system (one measure) and a roll of about 280 px                                                        |
| Phone, landscape (750 × 340)   | about 250                 | 12                             | The score line alone needs about 180 px at its minimum zoom of 60%, more for most pieces: no room for both |

Below about 150 px a roll shows too little: at 4 s per screen, a sixteenth note at 100 bpm would be 6 px high.

### Where the view goes

- **Tablets and laptops**: between the score and the keyboard. The score keeps its decided behavior (systems under each other, the cursor's system on top) in a shorter box; the roll gets the rest, flush against the keyboard so the bars run into the keys.
- **Phones in portrait**: the same, stacked. The bar has no room for another 44 px button next to the decided controls and the measure number; the switch goes into the menu.
- **Phones in landscape**: either the score line or the roll, switched with a button in the rail. A split would leave a roll under 80 px and a score line below 60% zoom.
- A full-screen roll (roll only, no score) is possible on any device, but works against reading; the design leaves it out.

### Lanes aligned with the keys

- The roll must use exactly the keyboard's geometry: the same white-key width, the same black-key offset (0.32 of a white key to the left of the boundary) and width (0.64), the same 1 px gaps. Today these numbers live in `style.css` (`--key-width`, `left: calc(...)`).
- Recommended: move the geometry into a pure function in `keyboard/keys.ts` (key, width in px → left and width per key) used by both `Keyboard` (setting pixel positions instead of percentages) and the roll. Reading the rendered keys with `getBoundingClientRect` would also work, but couples the roll to the keyboard's DOM.
- When the pedal strip is shown, both get the same reduced width, so the lanes still line up.

### Loop, seek, hand selection, tempo

- **Loop**: the roll shows what will be played, not the score order: after the loop's end come the loop's first measures again, marked with a dashed line ("Loop: back to m. 2"), as Synthesia 10 does to avoid "sudden jumps". This mirrors the transport, which schedules the wrap ahead; the same segment logic (play from the position to the loop end, then from the loop start) gives the roll's beats. Notes and tails are cut at the loop end, as the transport cuts them.
- **Seeking** (tapping a measure, back to start): the roll jumps to the new position and is drawn once even when paused. While paused it is a still preview of what comes next, useful for studying a chord. Tapping a measure line in the roll to seek, or dragging the roll, can come later.
- **Hand selection**: as above (outline, or hidden when muted). The keyboard already shows only the practiced hand.
- **Tempo**: only the speed changes (see the time scale).

## Technology

### Time

- The roll is drawn in the existing animation frame, from `transport.positionAt(audibleTime(context))`, like the cursor and the keyboard. Nothing in the roll keeps its own time.
- `AudioContext.currentTime` advances in steps of one render quantum, 128 frames or about 2.7 ms ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/currentTime)); at 70 to 140 px per second that is a fraction of a pixel. If the main thread sees coarser steps on some devices, a continuously moving roll shows it as judder where the stepwise cursor did not. Then `getOutputTimestamp()` (Chrome 57, Firefox 70, Safari 14.1) gives the audio time together with a `performance.now()` time, so the audio time at the frame's timestamp can be extrapolated ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/getOutputTimestamp)). That belongs in `audibleTime` in `ui/`, so the cursor and the keyboard benefit too. Measure first.
- `outputLatency` is available in Safari only since 18.4; the existing fallback to `baseLatency` stays.

### Drawing

| Option                           | For                                                                         | Against                                                                                                                                                  |
| -------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canvas 2D, redrawn every frame   | Simple, fast for hundreds of rectangles, one element; used by MIDIano       | Text and hit testing are our own; must be scaled for the device pixel ratio                                                                              |
| WebGL                            | Scales to thousands of notes and effects (Neothesia with wgpu, midiano.com) | A shader pipeline for a few hundred rectangles; more code, context loss to handle                                                                        |
| SVG or DOM, one element per note | Easy to style and inspect (Magenta.js)                                      | Hundreds of elements moving every frame cost style and layout work; a whole piece as one tall layer moved with a transform can exceed GPU texture limits |

- **Load**: the busiest two measures hold 24 to 50 notes in our test scores and up to about 115 in virtuoso pieces (Liszt, La campanella), plus their tails and the guide lines: a few hundred rectangles per frame, well within Canvas 2D on phones.
- **Sharp lines**: set the canvas's backing size to its CSS size times `devicePixelRatio` and scale the context ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio)); redo it on resize and when the ratio changes. A phone at 3× with a 700 × 280 roll is a 2100 × 840 canvas, which is fine.
- **Finding the visible notes**: events are sorted by start; a binary search finds the first one in the window, and notes that started earlier but still sound need either the longest sounding duration as a look-back or a small interval index. Both are pure functions for `timeline/queries.ts`, which today scans all events (`eventsSoundingAt`, noted there as "to be indexed when playback needs it per frame").
- **When to draw**: on every frame while playing, once after a seek, a resize, a setting change or pause; nothing while idle.

### Where the code lives

- `timeline/`: `PedalMark`, `PedalSpan`, `soundingEndBeat` and their rules in `buildTimeline`; queries for the pedal state and for the events overlapping a span of beats.
- `score/osmd/extractTimelineInput`: report the pedal marks per measure occurrence.
- `keyboard/keys.ts`: the key geometry as a pure function; `Keyboard` positions its keys with it and can show a pedal key.
- A new layer, for example `src/roll/`, with a pure part (which bars, tails, lines and labels to draw at a position, in pixels: unit-testable without DOM) and a small `FallingNotes` class that owns the canvas and draws that list. It reads a `Timeline`, a key geometry and a position; it knows nothing about OSMD, smplr or the transport.
- `playback/Transport`: an option to schedule notes until `soundingEndBeat`.
- `ui/`: the switch, the layout of score, roll and keyboard per form factor, the settings, and the call in the frame loop.

The design example uses the same split in miniature: one function computes the bars, tails, chord lines, measure lines and pedal strip from the note list, the position and the key geometry, and the markup only draws them.

## Options considered

| Choice           | Options                                                                                                                                        | Assessment                                                                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Role of the view | Replaces the score; next to the score, optional; always on                                                                                     | Next to the score and optional: the evidence on reading                                                                                             |
| Phone landscape  | Either score or roll; split; roll only                                                                                                         | Either/or: a split gives each too little                                                                                                            |
| Time scale       | Written time (the picture is fixed, the speed follows the tempo); actual time on screen (the picture stretches at slow tempos); constant beats | Written time: the picture of a passage stays the same while the learner changes the tempo; equal to constant beats in a piece without tempo changes |
| Pedal-held notes | Thin tail; faded bar; strip only                                                                                                               | Thin tail                                                                                                                                           |
| Pedal display    | Strip on the right; band across the roll (MIDIano); markers on the keys; none                                                                  | Strip on the right, only when the piece has pedal marks                                                                                             |
| Renderer         | Canvas 2D; WebGL; SVG/DOM                                                                                                                      | Canvas 2D                                                                                                                                           |
| Key geometry     | Shared pure function; reading the keyboard's DOM                                                                                               | Shared function                                                                                                                                     |

## Recommendation

1. **First the pedal in the timeline**, independent of the view: report pedal marks from OSMD, pair them in `buildTimeline` as a pianist would, and add `soundingEndBeat`; a handmade fixture with exact expected results. Playback can then use the pedal, which is useful even without the roll.
2. **The roll as an optional view, off by default**, switched on from the bar ("Falling notes") on tablets and laptops and from the rail on phones in landscape; from the menu on phones in portrait. Between the score and the keyboard where both fit; instead of the score line on phones in landscape.
3. **Encoding**: falling down onto the keyboard, the hit line at its top edge; written time at 100% tempo with about 4 s visible and a setting for more or less; solid bars while the key is held, thin tails while the pedal holds the sound, a pedal strip on the right with a pedal key, gaps before every new strike, a chord line, darker narrow bars for black keys, measure numbers as in the score, names at the hit line on narrow keys.
4. **Tie the roll to the score**: the same measure numbers, the cursor and the hit line at the same moment, and the sounding notes colored in the score (the phase 3 item). Later, an experiment with a fading roll.
5. **Canvas 2D in a new `roll/` layer** that reads the timeline and the shared key geometry and is drawn from the transport's position in the existing frame loop. Check smoothness on an iPhone and an Android phone; add `getOutputTimestamp` to `audibleTime` only if needed.

## Trade-offs

- **An aid that can replace reading.** The design keeps the score on screen and the roll optional, but evidence says learners look at the easier cue. Whether this learner keeps reading is something to watch at the piano.
- **Less room for the score** on tablets and laptops while the roll is on: one system instead of two or three. On phones in landscape the learner chooses one of the two.
- **Pedal marks in real files are unreliable**: a stray "Ped." can hold the pedal down for many measures until the next mark. The roll makes such errors visible (a strip that never lifts), which is honest but may confuse. Following the marks is the only rule that needs no guessing; a heuristic that ends a pedal after some measures would hide the cause.
- **Playback with the pedal** sounds closer to the music but is not what a learner without a pedal plays.
- **A continuously moving picture** shows timing jitter that the stepwise cursor hides; it may need the timestamp extrapolation above.
- **The pedal strip costs keyboard width**, a few percent, only for pieces with pedal marks.
- **Another layer and a refactor of the keyboard's geometry**: the keyboard moves from CSS percentages to computed pixel positions. That is more work than drawing a roll on top, but it is what keeps the lanes exactly on the keys.

## Decisions to take

Taken on 2026-11-22: built as recommended and as in the design example, with a switch to turn it off; see `docs/decisions.md` ("Falling notes and the sustain pedal"). It was built in phase 3 rather than phase 4 (decision 1), and the pedal switch covers both playing and showing the pedal (decisions 6 and 7).

1. **Build it now or later.** Options: in phase 3 (polish), or as a phase 4 extra (next to MIDI input and MIDI files, where the roadmap already mentions falling notes). Recommendation: phase 4, starting with the pedal in the timeline (step 1 above), which also improves playback.
2. **Role and default.** Options: optional and off by default; on by default; replacing the score. Recommendation: optional, off by default, shown together with the score wherever it fits.
3. **Placement per form factor.** Options for tablets and laptops: between score and keyboard (fixed split) or with a draggable divider. Options for phones in landscape: either/or, or a split. Recommendation: between score and keyboard with a fixed split (the score keeps at least one system, the roll at least 150 px); either/or on phones in landscape; the switch in the menu on phones in portrait.
4. **Time scale and look-ahead.** Options: written time (picture fixed, speed follows the tempo), time on screen at the actual tempo, or constant beats; default window. Recommendation: written time at 100%, about 4 s visible, with a "notes ahead" setting of three steps.
5. **Notes held by the pedal.** Options: A thin tail, B faded bar, C pedal strip only (see the encoding artboard). Recommendation: A.
6. **Pedal display.** Options: a strip to the right of the keys with a pedal key; a band across the roll; nothing. Recommendation: the strip with a pedal key, only for pieces with pedal marks, with a menu switch to hide the pedal (strip and tails).
7. **Pedal in playback.** Options: play sounding durations whenever the piece has pedal marks; only with a switch; never. Recommendation: on for pieces with pedal marks, with a switch in the menu ("Play the pedal").
8. **How to read imperfect pedal marks.** Options: follow the marks as written ("Ped." while down is a change, a stray `*` is ignored, a pedal open at the end lifts there); add heuristics that end long pedals. Recommendation: follow the marks, no heuristics; ignore pedal instructions in words for now.
9. **Details of the encoding.** Chord line (yes or no), note names on the bars where keys are wide enough (yes, following the note-name setting, or only at the hit line), the other hand when one hand is practiced (outline, hidden, or as is). Recommendation: chord line yes; names on bars where they fit and at the hit line otherwise; the other hand as an outline and hidden when muted.
10. **Technology.** Options: Canvas 2D, WebGL, SVG/DOM; shared key geometry versus reading the keyboard's DOM. Recommendation: Canvas 2D in a new `roll/` layer; key geometry as a pure function shared with the keyboard.
11. **Support for reading.** Options: nothing extra; measure numbers and colored notes in the score; later a fading roll. Recommendation: measure numbers in the roll now, colored notes in the score with it (already planned), a fading roll as a later experiment.

To check at the piano once a first version runs: whether the roll draws the eyes away from the score, whether 4 s is a comfortable look-ahead at 50% tempo, whether the thin tails are clear from the bench, and whether the motion is smooth on the iPhone and the iPad.

## Sources

App descriptions: see the links in "How other apps do it"; Neothesia, MIDIano and PianoBooster were read in their source code. Research on reading: see "Effect on learning to read". MusicXML: the W3C MusicXML 4.0 reference pages linked in "Encoding" and its version history ([3.0](https://www.w3.org/2021/06/musicxml40/version-history/30/), [3.1](https://www.w3.org/2021/06/musicxml40/version-history/31/), [4.0](https://www.w3.org/2021/06/musicxml40/version-history/40/)). Web APIs: MDN pages linked in "Technology". OSMD: `node_modules/opensheetmusicdisplay` 3.0.0 (`CHANGELOG.md`, `build/dist/src/MusicalScore/VoiceData/Expressions/MultiExpression.d.ts`, `.../ContinuousExpressions/Pedal.d.ts`, `.../VoiceData/SourceMeasure.d.ts`, `ExpressionReader.addPedalMarking` in `build/opensheetmusicdisplay.min.js`). smplr: `node_modules/smplr` 1.2.0 (`dist/index.d.ts`, `dist/index.js`). Pedal counts: `tests/fixtures/`, OSMD's `test/data` (branch `develop`) and the ASAP dataset (default branch), fetched and counted on 22 November 2026; the files were not added to the repository.
