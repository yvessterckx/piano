# Research: where do the MusicXML files come from?

Researched on 22 November 2026. This is not legal advice.

## Important correction

Earlier project notes suggested buying copyrighted pieces "as MusicXML or MIDI from Musicnotes or MuseScore". It is not that simple:

- **Musicnotes:** purchases are viewed and played in the Musicnotes apps or the Musicnotes web app, and can be printed. Some titles offer an optional PDF add-on, which may not be redistributed. No MusicXML export was found.
- **MuseScore.com, "Official scores"** (licensed from publishers): these can be viewed, played and used in practice mode, but cannot be downloaded or printed on any subscription. A PDF can be bought with credits; other formats are not available.
- **MuseScore.com, community scores:** a PRO subscription allows downloading community arrangements, including as MusicXML. A free account only allows public-domain works and original compositions. The quality of community arrangements varies widely; check the terms for each piece.
- **Sheet Music Plus, Alfred and similar stores:** deliver digital sheet music as PDF.

Sources:

- https://help.musicnotes.com/hc/en-us/articles/201103108
- https://help.musicnotes.com/hc/en-us/articles/360039850491
- https://intercom.help/musescore/en/articles/8535931
- https://intercom.help/musescore/en/articles/8535898
- https://musescore.org/en/comment/1280342

## Viable routes for a copyrighted piece

1. **Community arrangement on MuseScore.com** (PRO): download it as MusicXML and load it into the app.
2. **Buy a PDF and convert it with OMR** (optical music recognition): Audiveris is open source (AGPLv3), runs on macOS, Windows and Linux, and exports to MusicXML. Latest stable version according to Wikipedia: 5.10.2 (March 2026). Recognition is never 100% accurate: expect manual correction, e.g. in Audiveris itself or in MuseScore Studio. Check whether the seller's license terms allow such a conversion for personal use.
   - Note: audiveris.com and audiveris.net are not the official sites and have been reported as possible scams. Only download from https://github.com/Audiveris/audiveris.

An "import PDF" feature in the app itself (OMR in the browser) is out of scope: it is a lot of work, and the recognition has to be corrected anyway.

## Public domain (free to use, including as test files)

- **IMSLP / Petrucci Music Library:** the largest archive of public-domain scores, mostly PDF, increasingly with MusicXML attached.
- **OpenScore:** a MuseScore project that transcribes public-domain scores from IMSLP into digital scores, available as MusicXML.
- **MuseScore.com:** public-domain scores can be downloaded for free.
- **Project Gutenberg Sheet Music Project:** a small collection of MusicXML.
- **PDMX:** a research dataset of more than 250,000 public-domain MusicXML files collected from MuseScore.

Note: a work can be in the public domain while a recent edition or arrangement of it is protected. Check the license of the file, not just the composer.

Sources:

- https://www.musicxml.com/music-in-musicxml
- https://creativecommons.org/?p=53217
- https://creativity-ai.github.io/assets/papers/53.pdf
- https://en.wikipedia.org/wiki/Audiveris
