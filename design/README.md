# Design: practice screen

Live design in Claude Design: https://claude.ai/artifact/BfKAXAFRrr8adkSGfTrFhA

`practice-screen.dc.html` is the source of that design. The file requires the Claude Design runtime and does not open standalone in a browser. Use it as a reference for layout, colors and dimensions, not as code to reuse. Its UI labels are in Dutch; the app itself uses English UI text for now (see `docs/decisions.md`).

## What the design shows

A static example with the pickup and measures 1 to 4 of Für Elise (Beethoven, public domain). The cursor is on the first beat of measure 2.

From top to bottom:

1. **Header:** title and composer, and an "Open file" button (MusicXML or MIDI).
2. **Score:** white card, with the cursor as a light blue band with a small arrow. The note currently sounding is colored by hand.
3. **Controls:** round play button, progress by measure, tempo slider (25% to 100%, set to 60%), hand selection (left, both or right) and a loop button ("Repeat measures 1 to 4").
4. **Keyboard:** legend per hand, number of keys, and a keyboard on which the active keys light up with their note name.

In Claude Design, the number of keys (88, 76, 61) and the note names (do re mi, C D E) can be switched via Tweaks.

## Tokens

| Purpose      | Value                 |
| ------------ | --------------------- |
| Background   | `#111418`             |
| Panels       | `#1A1F26`             |
| Border       | `#3A424D`             |
| Text         | `#E8EAED`             |
| Muted text   | `#A3ABB6`             |
| Score ink    | `#14171C`             |
| Left hand    | `#D9730D`             |
| Right hand   | `#1F6FEB`             |
| Cursor band  | `#E6ECF5`             |
| Body font    | Inter 400/500/600     |
| Heading font | Space Grotesk 500/600 |

## Key ranges (MIDI note numbers)

| Keys | Lowest  | Highest  |
| ---- | ------- | -------- |
| 88   | A0 (21) | C8 (108) |
| 76   | E1 (28) | G7 (103) |
| 61   | C2 (36) | C7 (96)  |
