# Research: piano sound in the browser

Researched on 22 November 2026.

## smplr (recommended)

- A collection of sampled instruments for the Web Audio API that works without extra setup. By the same author (danigb) as the older `soundfont-player`, which it replaces.
- `SplendidGrandPiano` is a sampled grand piano. Effects such as reverb can be added.
- Notes can be scheduled ahead of time on the `AudioContext` clock: `piano.start({ note, time, duration })`. This is exactly what our transport needs.
- To verify: where the samples are loaded from by default. For offline use (a later phase) they must be self-hosted.

Sources:

- https://npmjs.org/package/smplr
- https://danigb.github.io/smplr/

## Tone.js (optional)

Useful if we want a ready-made transport (`Tone.Transport`) and `Tone.Draw.schedule` to align visual updates with the audio. It can be combined with smplr. The alternative is a custom lookahead scheduler: a small, easily testable module, and one dependency fewer. Decide this in the spike.

## Design choices that follow

- **Two instrument instances, one per hand,** each with its own volume. This makes "right hand only" or "left hand quieter" possible without filtering notes out of the timeline.
- **Tempo:** the timeline is in beats, not seconds. Seconds = beats × 60 / (bpm × tempo factor). On a tempo change during playback, cancel the scheduled notes and reschedule from the current position.
- **Loop:** only ever schedule a short time ahead (e.g. 100 to 200 ms), so a loop or pause takes effect immediately.

## Pitfalls

- Browsers only start an `AudioContext` after a user gesture (click or tap). Create or resume the context in the play button handler.
- iPhone and iPad: test whether sound works with the silent switch on. Web Audio behaves differently there than a regular audio player.
- Loading samples takes a moment: show a loading state and only enable the play button once the piano is ready.
