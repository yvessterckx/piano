# Test scores

Every file here is either a public-domain work or was created for this project. Files are kept byte for byte as obtained (Prettier ignores them), except for corrections recorded below. They are used by the tests and, during development only, by the dev server (`npm run dev`). They are never part of the production build.

Rule for new files (`tests/fixtures.test.ts` enforces the first part: an undocumented score fails the tests): record the work, the composer's dates, where the file comes from and under which terms, and check the file itself (`<rights>`, `<source>`, credits). A modern edition or arrangement of an old work can be protected even when the composition is not.

## Public-domain works

The four files below come from the test data of the OpenSheetMusicDisplay repository, at commit [`92d15a7`](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay/tree/92d15a7821f41238b99e445dcb8baabc5b17d32f/test/data). That repository is licensed under BSD-3-Clause (Copyright 2019 PhonicScore). The compositions themselves are in the public domain worldwide.

| File                                  | Work                                                                         | Composer                          | Original file name                                  | Notes on the file                                                                                                                     |
| ------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `clementi-sonatina-op36-no1-mvt1.xml` | Sonatina in C major, Op. 36 No. 1, first movement (1797)                     | Muzio Clementi (1752-1832)        | `MuzioClementi_SonatinaOpus36No1_Part1.xml`         | No rights notice or source in the file. Its 38 measures and two repeated sections match the original; no sign of an arrangement.      |
| `joplin-the-entertainer.xml`          | The Entertainer (1902)                                                       | Scott Joplin (1868-1917)          | `ScottJoplin_The_Entertainer.xml`                   | No rights notice or source in the file. Its 92 measures, repeats and endings match the original piano rag; no sign of an arrangement. |
| `schumann-wild-horseman-op68-no8.mxl` | Wilder Reiter (The Wild Horseman), Album für die Jugend, Op. 68 No. 8 (1848) | Robert Schumann (1810-1856)       | `Schumann_The_Wild_Horseman_Op._68_No._8.mxl`       | `<rights>`: "Public Domain (PianoXML typeset)". MuseScore 3.6.2.                                                                      |
| `bach-prelude-c-major-bwv846.xml`     | Prelude in C major, BWV 846, The Well-Tempered Clavier I                     | Johann Sebastian Bach (1685-1750) | `JohannSebastianBach_PraeludiumInCDur_BWV846_1.xml` | `<source>`: "Based on Breitkopf & Härtel edition of 1866" (public domain). MuseScore 1.2. Corrected, see below.                       |

## Created for this project

Small scores written by hand to test one behavior each with exactly known results. Released under CC0 1.0.

| File                                  | Tests                                                                                                                                                                                                                                                     |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `handmade-tied-chords.musicxml`       | Ties across a beat and across a barline, chords in both hands, a chord with one tied and one newly struck note, a note struck again where a tied note of the same pitch ends.                                                                             |
| `handmade-repeat-voltas.musicxml`     | Forward and backward repeat, first and second ending, a note tied into both endings.                                                                                                                                                                      |
| `handmade-pickup-two-parts.musicxml`  | Pickup measure (measure 0), one single-staff part per hand, a tempo marking.                                                                                                                                                                              |
| `handmade-da-capo-al-fine.musicxml`   | D.C. al Fine: back to the start after the last measure, stop at Fine.                                                                                                                                                                                     |
| `handmade-dal-segno-al-coda.musicxml` | D.S. al Coda: back to the segno, then from To Coda to the coda.                                                                                                                                                                                           |
| `handmade-pedal.musicxml`             | Sustain pedal marks: a bracket line with a change, "Ped." again without `*`, a stray `*`, a pedal down and up inside a repeat, a note struck again under the pedal, marks under both staves, a pedal still down at the end (in a measure of whole rests). |

## What each real score covers

| File     | Layout                                 | Covers                                                                                 |
| -------- | -------------------------------------- | -------------------------------------------------------------------------------------- |
| Clementi | Two parts, one staff each              | Two repeated sections (measures 1-15 and 16-38), simple texture.                       |
| Joplin   | Two parts, one staff each              | Four repeats with first and second endings, many ties and chords in both hands.        |
| Schumann | One part, two staves, MXL (compressed) | Pickup measure, repeat back to the start, unnumbered pickup measures between sections. |
| Bach     | One part, two staves                   | Several voices per staff, held notes written as ties.                                  |

## Corrections

- `bach-prelude-c-major-bwv846.xml`, measure 6: the four notes written as G flat 4 are F sharp 4 in Bach's score (the chord is D7 over C), so they were respelled: `<step>`, `<alter>`, the accidental on the first note and `default-y`. The pitch and everything else are unchanged. SHA-256 of the file as obtained: `8681e72dc9712a8ea4555135d5752d10ebfb44e84d2f7046434626be10ba43a4`.

## Checksums (SHA-256)

Of the files as they are now, after the corrections above.

```
9c068bc4487d910e9bbe152867dd690b2ac44b28c2f6653c54123dc74e7c4be6  bach-prelude-c-major-bwv846.xml
fb2b3feff9e6e26357a30de4a507651023e77c5cc545f5e22effba51b06d56c0  clementi-sonatina-op36-no1-mvt1.xml
c9fd7cc4e7c260be2bca184b24e112b0810c1c305014964c4fcdbbd5cd6b4b9d  joplin-the-entertainer.xml
a75baae52874ad730bbe49d20ef35f061562751abe32dd8d1b1bd753fa69d202  schumann-wild-horseman-op68-no8.mxl
```

## Not included

Für Elise (suggested in the roadmap) is not in a source with clear terms that can be downloaded without an account. To add it: download a public-domain MusicXML from IMSLP or MuseScore.com (filter on "Public domain"), check the file's own license, and record it here.
