# Piano practice

A web app for practicing piano: the score, the sound and a keyboard that highlights the keys to press, all in sync. It runs entirely in the browser: a score is opened from the device and never leaves it.

**Status:** proof of concept. Open a MusicXML file and practice with it: playback with a piano sound, tempo from 25% to 100%, one hand or both, a loop over measures, and start from any measure by clicking it. See [`docs/roadmap.md`](docs/roadmap.md).

Live: https://yvessterckx.github.io/piano/

## Development

Requires Node 26 (see `.nvmrc`).

```bash
npm install
npm run dev      # dev server, with the test scores in a dropdown
npm run check    # typecheck, lint, format check and tests
npm run build    # production build in dist/
```

## Documentation

- [`docs/decisions.md`](docs/decisions.md): decisions and open questions.
- [`docs/research/`](docs/research/): research behind the choices (notation, audio, sources and licensing, MIDI).
- [`design/`](design/): the design of the practice screen.
- [`tests/fixtures/README.md`](tests/fixtures/README.md): the test scores, with source and license.

## Scores and copyright

The app is a generic player: it ships no scores. The test scores in this repository are public-domain works or were written for the tests; their sources and licenses are listed in `tests/fixtures/README.md`.
