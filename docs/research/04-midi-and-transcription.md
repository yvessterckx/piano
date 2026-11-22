# Research: MIDI input and audio-to-notes transcription

Researched on 22 November 2026. Both topics are outside the MVP.

## MIDI input from a digital piano

Idea: the app receives over USB/MIDI which keys are pressed. This enables a **wait mode** (the score waits until the correct keys are pressed) and per-note feedback.

Browser support for the Web MIDI API:

- Works in Chrome, Edge and Opera, and in Firefox on desktop since version 108.
- **Does not work in Safari or in any browser on iPhone or iPad** (all iOS browsers use WebKit). The WebKit bug for this has been open since 2013.
- On macOS a third-party Safari extension adds the API, but that is not standard support.
- Requires a secure context (HTTPS or localhost) and a permission prompt (Chrome since version 124).

Consequences:

- MIDI input is an extra layer on top of the app: everything must also work without it.
- On an iPad this is only possible through a native wrapper (e.g. Capacitor with a MIDI plugin). That is a separate decision involving more work.

Sources:

- https://caniuse.com/midi
- https://web-platform-dx.github.io/web-features-explorer/features/web-midi
- https://developer.mozilla.org/docs/Web/API/Web_MIDI_API
- https://developer.chrome.com/blog/web-midi-permission-prompt

## Converting audio to notes

Explored as a way to turn arbitrary recordings into scores.

- **Spotify Basic Pitch:** an open-source (Apache-2.0) model that converts audio to MIDI. Available as a Python package and as an npm package (`@spotify/basic-pitch`, mono audio only). Works best on one instrument at a time.
- A full mix (vocals, drums, band) gives a messy result. And MIDI is not a readable score: quantizing, splitting hands and arranging are still needed.
- For copyrighted songs this changes nothing about copyright.

Conclusion: do not build this into the app. Possibly later as a separate tool for the user's own recordings.

Sources:

- https://github.com/spotify/basic-pitch
- https://github.com/spotify/basic-pitch-ts
