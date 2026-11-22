# Research: rendering and synchronizing the score

Researched on 22 November 2026. Re-check versions and APIs before using them.

## Question

Which library renders MusicXML in the browser, with a cursor or note highlighting that we can synchronize with our own audio?

## OpenSheetMusicDisplay (OSMD)

- Open source (BSD-3), renders MusicXML in the browser via VexFlow. Version 2.0.0 is on npm.
  - Update 2026-11-22: version 3.0.0 was published on npm on 2026-11-21. Read the changelog before choosing between 3.0.0 and the latest 2.x.
- Has a built-in cursor (`osmd.cursor`: show, `next()`, reset, an iterator over the score). The `followCursor` option scrolls along when the cursor jumps to a new system.
- **The official audio player is not part of the open-source version.** It ships in `osmd-extended`, which is only available to GitHub sponsors. Its code may not be shared publicly (copyright PhonicScore).
- The community package `osmd-audio-player` (jimutt) is no longer maintained. Do not use it.
- Consequence: we build our own playback scheduler. We step through the score with the cursor iterator, collect the notes at each step (pitch, duration, staff) and build our `Timeline` from them. During playback we position the cursor ourselves.
- An existing example of exactly this approach: a browser player built with OSMD, Tone.js and `@tonejs/midi` that keeps the cursor in sync using `Tone.Draw.schedule`. Useful as a reference: https://dev.to/linmingren/a-midi-player-that-shows-you-the-sheet-music-and-lets-you-play-along-on-a-virtual-piano-492m

Sources:

- https://unpkg.com/opensheetmusicdisplay@2.0.0/README.md
- https://unpkg.com/osmd-extended@1.9.2/README.md
- https://npmjs.com/package/osmd-audio-player

## Verovio

- Open source (LGPL-3.0), C++ compiled to WebAssembly. Renders MEI, MusicXML, ABC, Humdrum and more to SVG.
- Can generate MIDI. Playback is not included: you add your own player.
- Can look up which elements sound at a given time. The official tutorial for highlighting notes during playback works this way.
- A pitfall seen in practice: in Verovio Humdrum Viewer, highlighting ran at a fixed tempo of 120 bpm while the MIDI used a different tempo, so the two drifted apart. Lesson: timing for highlighting and for sound must come from the same source.
- To verify in the docs: whether the "timemap" feature (onsets per element ID, with repeats unrolled) is usable as the basis for our `Timeline`.

Sources:

- https://book.verovio.org/interactive-notation/playing-midi.html
- https://github.com/humdrum-tools/verovio-humdrum-viewer/issues/14

## Comparison

|              | OSMD                             | Verovio                             |
| ------------ | -------------------------------- | ----------------------------------- |
| License      | BSD-3                            | LGPL-3.0                            |
| Input        | MusicXML (native)                | MEI native, MusicXML via conversion |
| Cursor       | Built in                         | Highlight yourself via element IDs  |
| Audio        | Only in the paid sponsor version | Generates MIDI, add your own player |
| Time to note | Derive yourself via the iterator | Built-in time lookup                |
| Bundle size  | JavaScript                       | WebAssembly, larger                 |

## Recommendation

Start the spike with OSMD: MusicXML is our input format, the cursor is built in and the community around "MusicXML in the browser" is the largest.

The spike succeeds if:

1. A public-domain piece (e.g. Für Elise) renders correctly.
2. We can derive a `Timeline` from the iterator in which tied notes are merged and repeats and voltas are unrolled.
3. The cursor can be placed on an arbitrary beat without traversing the whole score again.
4. The hand of each note can be derived from its staff.

If point 2 or 3 cannot be done properly with OSMD, test Verovio. Do not decide based on a single simple piece: also test a piece with repeat signs and tied notes.
