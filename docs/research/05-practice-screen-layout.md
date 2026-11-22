# Research: practice screen layout on phones and tablets

Researched on 22 November 2026. App layouts change with every release: re-check the descriptions of other apps before relying on them. Measurements were taken on the development laptop with the dev server and OSMD 3.0.0.

## Question

How should the practice screen arrange the score, the keyboard and the controls on phones (portrait and landscape) and tablets, so that a learner at the piano sees the notes directly above the keyboard, can read ahead and reach the controls, without ever scrolling the page during playback?

Trigger: tested on a phone in mobile Chrome, the current layout is not usable. The notes should be visible above the piano view.

## The current screen on a phone (measured)

The page stacks the header, the score card (`clamp(220px, 45vh, 640px)` high), the controls and a full 88-key keyboard, and the page itself scrolls. Measured with The Entertainer loaded, in frames of a fixed size (no browser toolbars, so a real phone has less height than this):

| Viewport (CSS px)            | Page height | Score box             | Keyboard     | Score and keyboard on screen together |
| ---------------------------- | ----------- | --------------------- | ------------ | ------------------------------------- |
| 390 × 844 (phone portrait)   | 1251        | 198 to 578 (380 high) | 1045 to 1221 | No: the keyboard is below the fold    |
| 844 × 390 (phone landscape)  | 719         | 93 to 313 (220 high)  | 569 to 689   | No                                    |
| 820 × 1180 (tablet portrait) | 1180        | 93 to 624 (531 high)  | 880 to 1056  | Yes, just                             |

Further observations:

- In portrait the header takes 198 px (the title and the buttons wrap) and the controls 332 px (they wrap into four rows): together more than half of the viewport.
- The keyboard has a minimum width of 17 px per white key, so 88 keys are 884 px wide and scroll sideways on every phone and on a tablet in portrait. `Keyboard` scrolls the lit keys into view, so the keys move under the learner's eyes.
- At 390 px wide and OSMD's zoom 1, every system holds one measure (see the OSMD measurements below), and the 380 px score box shows about one and a half systems.
- `ScoreCursor` scrolls the score box only when the cursor leaves it, and then puts the cursor's system at the top. While the cursor is in the last visible system, the next system is not visible.

## How other apps arrange the screen

None of the vendors below documents the orientation of its practice screen on phones, and store screenshots carry no captions. What follows comes from help centers, store pages and reviews.

### Learning apps

- **flowkey** puts a video of a pianist's hands on a real keyboard above the notation, which scrolls sideways as the music plays ([Piano Dreamers review](https://www.pianodreamers.com/flowkey-review/), [epianos](https://www.epianos.co.uk/how-does-flowkey-work/)). There is no drawn keyboard: the keys to play are highlighted on the video. On a tablet turned to portrait, a full sheet music view is available ([App Store](https://apps.apple.com/gb/app/id1020357408)). Store reviews suggest the player turns a phone to landscape (inferred from [reviews](https://apps.apple.com/sk/app/id1020357408?l=sk)). Wait mode, slow tempos (50%, 75%), loop and hand choice sit behind a settings button above the playing area.
- **Simply Piano** runs the staff across the upper part of the screen ([Piano Dreamers review](https://www.pianodreamers.com/simply-piano-review/)). A keyboard appears at the bottom only as a hint when the learner struggles ([help center](https://piano-help.hellosimply.com/en/articles/7943490-learning-with-simply-piano-the-basics)). Controls stay hidden until the learner pauses: the pause button at the top left opens speed, hands, wait mode, metronome and finger numbers ([help center](https://piano-help.hellosimply.com/en/articles/16945914-simply-piano-song-library-menu-navigation)). A separate play-along mode (iOS) shows sheet music that scrolls down by itself ([help center](https://piano-help.hellosimply.com/en/articles/7943680-understanding-play)). Reviewers prefer an iPad on the music stand to an iPhone ([iMore](https://imore.com/apps/learning-to-play-the-piano-has-never-been-more-fun-than-with-this-ipad-app)).
- **Skoove** shows one line of notation at the top and a keyboard with animated hands at the bottom, with no view of the whole piece ([Piano Dreamers review](https://www.pianodreamers.com/skoove-review/)). The tempo is changed from the pause screen ([help center](https://help.skoove.com/en/articles/5421914-can-i-adjust-the-tempo-of-the-pieces-on-skoove)).
- **Playground Sessions** moves a cursor across the notation, with a keyboard at the bottom that can be hidden and can show note names or finger numbers. Hands, repeating a section, speed and metronome are settings in a top bar ([Pianist's Compass](https://pianistscompass.org/?p=8094)). The on-screen keyboard can be matched to the learner's piano by playing its lowest and highest keys ([blog](https://blog.playgroundsessions.com/?p=447)). Its designers describe moving less-used controls into fly-out menus and call fitting the content on a phone a challenge ([Built In](https://builtin.com/articles/app-based-piano-lessons)).

### Score readers and players

- **Synthesia** runs on iPad but has no iPhone app, and its Android app is described as best on a tablet ([App Store](https://apps.apple.com/us/app/synthesia/id579518445), [FAQ](https://synthesia.app/support/faq)). It shows falling notes, sheet music or both; with both, the notation is a compact strip above the falling notes, and only with the falling notes off does the sheet music fill the screen with several lines ([display guide](https://synthesia.app/support/Guide/DisplaySheetMusic)). The keyboard at the bottom can be zoomed to the keys the song uses ("Song Only") or to the range of the connected piano, or pinched by hand ([first song guide](https://synthesia.app/support/guide/firstSong)). The controls (seek bar, pause, speed, modes) sit in one toolbar at the top.
- **Piano Marvel** recommends a computer or an iPad ([requirements](https://support.pianomarvel.com/portal/en/kb/articles/requirements)). Its iOS release notes list three ways to move through the score: horizontal scrolling, vertical scrolling with zoom and page flips, and they record that hiding the play controls after five seconds was reverted ([App Store](https://apps.apple.com/us/app/piano-marvel-lessons-music/id1016751878)). On an iPhone the on-screen keyboard can be set to 24 or 36 keys to suit the screen (search summary only; the help page itself returned an error: [iPhone setup](https://support.pianomarvel.com/portal/en/kb/articles/iphone-setup-for-piano-marvel)).
- **MuseScore app**: for practice mode, the help center tells phone users to turn the phone to landscape and to choose a horizontal, single-line layout, which shows the current measure and a few measures ahead ([practice mode](https://help.musescore.com/en/articles/8535951-practice-mode)). Tempo (10 to 200%), metronome and transposition sit in a panel behind a settings button, not on screen ([tempo and metronome](https://help.musescore.com/en/articles/8535957-tempo-transposition-metronome-and-countdown)). The paid tier adds an on-screen keyboard with highlighted keys ([App Store](https://apps.apple.com/us/app/musescore-sheet-music/id835731296)); its range and position are not documented.
- **Soundslice** (a notation player with a keyboard view, close to this app) offers three layouts: scrolling, paged and horizontal. The paged layout hides its page buttons during playback and can preview the next page, and the horizontal layout keeps the clef and key signature pinned at the left edge ([layouts](https://www.soundslice.com/help/en/player/advanced/241/scrollable-vs-paged-layout/)). Its visual keyboard is switched on from the control bar (on small screens from the settings), assigns the top staff to the right hand and the bottom staff to the left, like `timeline/hands.ts`, and can show one hand only ([visual keyboard](https://www.soundslice.com/help/en/player/advanced/20/visual-keyboard)). On a phone in landscape the control bar gets smaller ([small screens](https://soundslice.com/blog/196/a-better-soundslice-experience-on-small-screens)).
- **forScore and Newzik** (sheet music readers for tablets) solve reading ahead at a page turn with a half-page turn: the first turn replaces the top half of the page with the top of the next page while the bottom half is still being read ([forScore](https://forscore.co/?p=769), [Newzik](https://support.newzik.com/en/support/solutions/articles/77000433966-i-need-to-see-two-pages-at-once)). Newzik notes that two pages side by side make the music half as large, and suggests landscape for readers who find even a 12.9-inch iPad small ([Newzik](https://support.newzik.com/en/support/solutions/articles/77000433915-the-ipad-pro-screen-is-not-big-enough)).

### Patterns

- **One line of music on a phone while practicing.** In lessons and practice modes the notation is one line that scrolls sideways or moves on (flowkey, Simply Piano, Skoove, Playground Sessions, MuseScore's practice mode, Piano Marvel's horizontal mode). Several lines appear on a tablet in portrait (flowkey), once the keyboard view is off (Synthesia), or in a separate play-along mode (Simply Piano).
- **Score above, keyboard below** (Simply Piano, Skoove, Playground Sessions, Synthesia, Soundslice). Only flowkey puts its keys (a video) above the notation.
- **A reduced keyboard rather than 88 tiny keys:** the song's range or the piano's range (Synthesia), 24 or 36 keys on an iPhone (Piano Marvel), the learner's own piano (Playground Sessions). The keyboard is often optional (Playground Sessions, Soundslice) or only a hint (Simply Piano).
- **Controls at the top:** a compact top bar (Synthesia, Playground Sessions) or a single pause or settings button at the top that opens a menu or panel (Simply Piano, Skoove, flowkey, MuseScore). Tempo, hands, loop and wait mode are the common set; note names and finger numbers are toggles in a menu.
- **Several layouts, chosen by the learner,** are common (Piano Marvel, Soundslice, MuseScore, forScore).
- **Tablets are preferred.** Vendors say to put the phone or tablet on the piano, but some recommend a tablet or a computer (Synthesia, Piano Marvel) and reviewers find phones cramped. No vendor gives a reading distance or a minimum screen size.

## What a pianist needs at the piano

### Reading ahead

Pianists look ahead of what they play. In an eye-tracking study, professional pianists read about four notes ahead and amateurs about two; measured in time, both looked about one second ahead, shorter at a fast tempo and longer at a slow one ([Furneaux and Land 1999](https://pmc.ncbi.nlm.nih.gov/articles/PMC1690464)). A review of later studies puts the eye-hand span at roughly 0.7 to 1.5 seconds, growing with skill and shrinking with difficulty ([Qi and Adachi 2022](https://www.frontiersin.org/articles/10.3389/fpsyg.2022.933106/full), [Perra et al. 2021](https://bop.unibe.ch/JEMR/article/view/7845)). Readers also look further ahead as a complex passage approaches ([Huovinen et al. 2018](https://bop.unibe.ch/JEMR/article/view/4094)). When the visible music was cut to a window of two beats, the span shrank ([Truitt et al. 1997](https://www.tandfonline.com/doi/abs/10.1080/713756756), abstract only).

For this app, at 25% to 100% tempo:

- The rest of the current measure and at least one full measure after it must always be visible. A beginner at a slow tempo needs less, but the learner also glances further ahead to prepare hand positions.
- The next line of music must appear before the cursor reaches the last measure of the current one. A cursor in the last visible system, with nothing below it, breaks reading.
- Moving the music while it is being read costs the reader their place. Changes to the view should happen where the reader is not looking, or at a moment the eye jumps anyway.

### Size at the music stand

The device stands on the music desk, about arm's length from the eyes. No piano-specific source for the distance was found; screen ergonomics guidance puts monitors at 50 to 100 cm ([OSHA](https://www.osha.gov/etools/computer-workstations/components/monitors)), and CSS defines its reference pixel at 71 cm ([CSS Values 4](https://www.w3.org/TR/css-values-4/)).

- **Printed staff height:** about 7 mm for standard parts, 6.3 mm for song books and 3.9 mm for pocket scores ([LilyPond](https://lilypond.org/doc/v2.24/Documentation/notation/setting-the-staff-size)); Dorico's rastral size 3 is 7.0 mm ([Dorico](https://archive.steinberg.help/dorico/v1/pt/dorico/topics/glossary/rastral_size_g.html)).
- **CSS pixels on devices:** an iPhone draws a CSS pixel at about 0.166 mm (460 ppi at 3×, [screen sizes](https://useyourloaf.com/blog/iphone-16-screen-sizes/)), an iPad Air or Pro at about 0.19 mm (264 ppi at 2×, [iPad sizes](https://useyourloaf.com/blog/ipad-2024-screen-sizes)), an Android phone at about 0.16 mm (a density-independent pixel is 1/160 inch, [Android](https://developer.android.com/training/multiscreen/screendensities)).
- **OSMD at zoom 1** draws a staff space of 10 CSS px, so a five-line staff is 40 px high: about 6.6 mm on an iPhone, 6.4 mm on an Android phone and 7.7 mm on an iPad. Zoom 1 is print size on a phone. Zoom 0.8 (5.3 mm on an iPhone) is between a song book and a pocket score; zoom 0.75 and below is pocket-score size, hard to read at arm's length.
- **Text:** the ergonomics standard ISO 9241-303 sets 16 arcminutes as the minimum character height and 20 to 22 as preferred (as quoted in [UXmatters](https://uxmatters.com/mt/archives/2009/01/text-treatment-and-the-user-interface.php); the standard itself was not consulted). At 70 cm that is a cap height of 3.3 to 4.5 mm, about 20 to 27 CSS px on a phone. Note names on keys narrower than that cannot meet it: on a phone, the color of a lit key is what is seen from the bench, and its name is read when leaning in.
- Viewing distance and eyesight differ: at 100 cm everything needs about 1.4 times the size it needs at 70 cm. The score size must be a setting, remembered on the device.

### A keyboard that shows the keys that matter

The on-screen keyboard is a map of the real one: the learner finds a lit key by its position relative to landmarks (the groups of black keys, middle C). It helps most when its keys are large enough to tell apart and when it does not move.

The range of our test pieces, from their timelines (white keys spanned; 88 keys span 52):

| Piece                             | Range     | White keys | Left hand | Right hand | Any 4 measures (median / widest) |
| --------------------------------- | --------- | ---------- | --------- | ---------- | -------------------------------- |
| Schumann, The Wild Horseman       | C3 to F5  | 18         | C3 to F4  | C4 to F5   | 16 / 18                          |
| Bach, Prelude in C major, BWV 846 | C2 to A5  | 27         | C2 to E4  | D3 to A5   | 14 / 25                          |
| Clementi, Sonatina op. 36 no. 1   | C2 to D6  | 30         | C2 to F4  | G3 to D6   | 22 / 29                          |
| Joplin, The Entertainer           | F1 to F♯6 | 36         | F1 to F4  | G♯3 to F♯6 | 29 / 36                          |

Width of a white key for a given number of white keys and an available width (CSS px; on a phone, 10 px is about 1.7 mm):

| White keys shown     | Phone portrait (~370) | Phone landscape (~700) | Tablet portrait (~790) | Tablet landscape (~1150) |
| -------------------- | --------------------- | ---------------------- | ---------------------- | ------------------------ |
| 52 (88 keys)         | 7                     | 13                     | 15                     | 22                       |
| 36 (The Entertainer) | 10                    | 19                     | 22                     | 32                       |
| 27 (Bach)            | 14                    | 26                     | 29                     | 43                       |
| 18 (Schumann)        | 21                    | 39                     | 44                     | 64                       |

Showing the piece's range instead of 88 keys makes the keys 1.4 to 3 times wider. On a phone in portrait even that is narrow for the wider pieces. A single hand (11 to 22 white keys in these pieces) fits at 17 px or more, and the median four-measure span (14 to 29 white keys) at 13 to 26 px.

### Controls

- During practice the learner uses play and pause most, then restarting a passage, then tempo, hand and loop. Note names, the number of keys and opening a file are set once.
- Touch targets: 44 × 44 pt on iOS ([Apple HIG](https://developer.apple.com/design/human-interface-guidelines/accessibility)), 48 × 48 dp with 8 dp spacing on Android ([Android accessibility](https://support.google.com/accessibility/android/answer/7101858)), 24 × 24 CSS px as the WCAG 2.2 AA minimum ([WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)). `CLAUDE.md` asks for 44 px.
- With the device on the music stand, the bottom edge of the screen is the shortest reach from the keys. But the bottom edge is also where the on-screen keyboard belongs (closest to the real one), where Safari on iPhone shows its toolbar by default since iOS 15, and where the ledge of the music desk may cover part of the screen. On a phone the top edge is only about 15 cm further; on a tablet in portrait about 25 cm.
- Controls that hide themselves cost a tap to bring back, with the hands on the keys; Piano Marvel reverted such an auto-hide (see above). A compact bar that always stays is better than a large panel that hides.

### Orientation and the browser

- **Phone landscape is short:** an iPhone is 375 to 440 pt high in landscape, before Safari's toolbar, and has safe-area insets of about 60 pt left and right ([screen sizes](https://useyourloaf.com/blog/iphone-16-screen-sizes/)). With the browser's bars, expect roughly 320 to 350 px of height (an estimate, not measured on a device).
- **The page cannot force an orientation on iPhone.** `screen.orientation.lock()` works in Chrome for Android (in fullscreen), not in Safari ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock), [caniuse](https://caniuse.com/mdn-api_screenorientation_lock)). The Fullscreen API works in Chrome for Android and on iPad, not on iPhone, and needs a tap to start ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen), [caniuse](https://caniuse.com/fullscreen)). An installed web app (added to the home screen) runs without the browser's bars.
- **Viewport units:** `100vh` can extend under the browser's toolbars; `svh` is the height with the toolbars shown, `dvh` follows them as they appear and disappear ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/length), [web.dev](https://web.dev/blog/viewport-units)). A screen that never scrolls should be laid out in `100svh` or `100dvh`.
- **The screen must not dim** during a slow practice loop. The Screen Wake Lock API is supported in Chrome for Android and in Safari since 16.4; it is released when the page is hidden and must be requested again ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API), [caniuse](https://caniuse.com/wake-lock)). In apps added to the home screen on iOS it reportedly did not work before iOS 18.4 ([WebKit bug 254545](https://bugs.webkit.org/show_bug.cgi?id=254545)).

## What our stack allows

### OSMD 3.0.0

Verified in `node_modules/opensheetmusicdisplay` (version 3.0.0): the type declarations in `build/dist/src/OpenSheetMusicDisplay/OSMDOptions.d.ts`, `OpenSheetMusicDisplay.d.ts` and `MusicalScore/Graphical/EngravingRules.d.ts`, the defaults in `build/opensheetmusicdisplay.min.js`, and `CHANGELOG.md`. Then tried in Chrome with the test scores.

- **`renderSingleHorizontalStaffline`** (option, default false; also `EngravingRules.RenderSingleHorizontalStaffline`) draws the whole piece on one horizontal system. Explicit system breaks still start a new line if their rules are on (`newSystemFromXML`, off by default, and `NewPartAndSystemAfterFinalBarline`, off by default).
  - The option's documentation says it must be set before `load()`. In a test, `setOptions({ renderSingleHorizontalStaffline })` followed by `render()` switched an already loaded score to one line (four test scores) and back to wrapped systems (one score) without a new `load()`. Verify this on all test scores before relying on it; a new `load()` took 17 to 27 ms on the laptop anyway.
  - A line wider than `EngravingRules.SheetMaximumWidth` (default 32767 px) is broken into a second line. The Entertainer is 22,682 px wide at zoom 1; a piece of about 130 measures or more would be broken. The limit exists for the canvas backend; with SVG it can be raised.
  - The height of the line is that of its tallest measure: ledger lines, octave signs and dynamics anywhere in the piece make the whole line taller.
  - For very long pieces OSMD can render the line in batches (`renderNext()`, `enableIncrementalRenderingOnScroll()`).
- **`EngravingRules.RenderXMeasuresPerLineAkaSystem`** (default 0, off) breaks the system after that many measures. It is a maximum: OSMD still breaks earlier when the measures do not fit the width. At 800 px it turned three measures per system into two, with wider spacing. Zoom is the better control for how much fits.
- **`osmd.Zoom`** scales everything; `render()` applies it, and since 3.0.0 it is kept across `load()`. A re-render after a zoom change took 15 to 46 ms on the laptop.
- **Margins:** with the title off, the first system still starts about 100 to 150 px (at zoom 1) below the top of the drawing (page margin plus room for tempo marks and ledger lines). `drawingParameters: 'compacttight'` reduces margins and also tightens note spacing; `EngravingRules.PageTopMargin` and `PageBottomMargin` (default 5 units) can be set separately.
- **`drawFromMeasureNumber` / `drawUpToMeasureNumber`** render a range of measures only, e.g. a loop. Not needed for the layouts below.
- **`followCursor`** only scrolls for OSMD's own cursor, which we do not use.

Measured with the test scores (zoom 1 = a 40 px staff; "system pitch" is the distance from one system to the next):

| Width and zoom    | Entertainer: measures per system, system pitch | Clementi       | Schumann           | Bach      |
| ----------------- | ---------------------------------------------- | -------------- | ------------------ | --------- |
| 390 px, zoom 1    | 1, 238 px                                      | 1, 197 px      | 1 (some 2), 217 px | 1, 232 px |
| 390 px, zoom 0.75 | 1 to 2, 184 px                                 | 1 to 2, 149 px | 1 to 2, 160 px     | 1, 173 px |
| 800 px, zoom 1    | 3, 265 px                                      | 3 to 4, 208 px |                    |           |
| 800 px, zoom 0.8  | 4 to 5, 222 px                                 | 4 to 5, 175 px |                    |           |
| 1100 px, zoom 1   | 4 to 5, 272 px                                 | 5, 222 px      |                    |           |

On one horizontal line:

| Piece       | Typical measure width, zoom 1 | Line height, zoom 1 (default / compacttight) | Typical measure width and line height, zoom 0.8 compacttight |
| ----------- | ----------------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| Entertainer | 259 px                        | 432 / 339 px                                 | 163 px, 271 px                                               |
| Clementi    | 251 px                        | 364 / 293 px                                 | 157 px, 234 px                                               |
| Schumann    | 240 px                        | 338 px (default)                             |                                                              |
| Bach        | 500 px                        | 394 px (default)                             |                                                              |

So, at a legible size:

- A phone in portrait fits about one measure per system, whatever the layout. Wrapped systems use the height to show two or three of them; one line shows one and a half measures and leaves the height unused.
- A phone in landscape fits three to five measures per line, but only one system in the height: with wrapped systems the next system is never visible before the cursor reaches it. One line, scrolling sideways, keeps the next measures in view at all times, at zoom 0.75 to 0.85 to leave room for the keyboard.
- A tablet fits three to five measures per system and two to four systems.

### Our cursor and layout code

- `readScoreLayout` reads measure boxes and note columns from OSMD's layout after every render, in absolute positions, and `measureAtPoint` maps a tap to a measure. Both work unchanged with one horizontal line: it is a layout with a single system.
- `ScoreCursor` already scrolls both axes of its container and never the page. What changes is the rule for when and where to scroll (see the recommendation). For a line that scrolls continuously, the cursor's x must be interpolated between note columns by beat; today `cursorBoxAt` returns the last column at or before the beat. That is a small pure function next to `cursorBoxAt`.
- OSMD re-renders by itself when the container's width changes (`autoResize`), and `onRender` re-reads the layout, so rotating the device keeps the cursor right. Switching between wrapped systems and one line on rotation needs a `setOptions` and `render()` from the page.

### The keyboard

- `Keyboard` takes any `KeyboardRange` (MIDI numbers, starting and ending on a white key) at construction; `KEYBOARD_RANGES` holds 88, 76 and 61 keys. Changing the range means building a new `Keyboard` or adding a `setRange` method; it still needs to know nothing about scores.
- The range of a piece, a loop or a hand is a pure query on the timeline (lowest and highest `midi` of the events of a hand within a span of beats), next to `eventsSoundingAt` in `timeline/queries.ts`. Padding it to white keys and to a minimum width is a pure function for `keyboard/keys.ts`. Both are unit-testable without DOM.
- A range that follows the music while playing can also be computed ahead from the timeline (for example one range per measure, changing only when the coming notes leave it), so the keyboard pans before the notes arrive.
- The key size is pure CSS today (`--white-keys`, `min-width: calc(var(--white-keys) * 17px)`). Fitting the range to the width removes the sideways scrolling and `#keepActiveKeysVisible`.

## Options considered

### Score

| Option                                      | Phone portrait                            | Phone landscape                                                                | Tablet                                  |
| ------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------- |
| Wrapped systems, current system kept on top | Good: 2 to 3 systems of 1 to 2 measures   | Poor: one system fits, next one hidden until the jump                          | Good: 2 to 4 systems of 3 to 5 measures |
| One horizontal line, stepwise scrolling     | Poor: 1.5 measures visible, height unused | Good: 3 to 4 measures visible, static while reading                            | Possible, wastes height                 |
| One horizontal line, continuous scrolling   | Poor                                      | Possible: constant look-ahead, but the music moves under the eyes all the time | Possible, wastes height                 |
| Fixed number of measures per system         | No gain over zoom                         | No gain                                                                        | No gain over zoom                       |

The two scrolling behaviors for one line:

- **Stepwise:** the cursor moves across a still line; when the measure after the current one is no longer fully visible, the line slides (about 300 ms) so that the current measure starts near the left edge. The reader reads still music, and at least one measure ahead is always visible. This is close to what `ScoreCursor` does today, with an earlier trigger.
- **Continuous:** the line moves under a cursor that stays at about a third of the width. The look-ahead is constant, but reading moving notation is harder, and it needs the interpolated cursor position on every frame.

For wrapped systems, the cursor's system should become the top visible system as soon as the cursor enters it, so the next one or two systems are always below it. The scroll happens when the eye jumps to the start of the new line anyway. A half-page turn (replacing a system that is no longer read) avoids moving the music at all, but needs systems drawn as separate pieces, which OSMD does not offer.

### Keyboard

| Option                                         | Pros                                           | Cons                                                                                                             |
| ---------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| All 88 keys, scrolling sideways (current)      | Maps one to one to the real piano              | 17 px keys on phones with only part of them visible; scrolls and moves under the eyes                            |
| All 88 keys, fitted to the width               | No scrolling                                   | 7 px keys on a phone in portrait: unusable                                                                       |
| The piece's range, fixed while playing         | 1.4 to 3 times wider keys, never moves         | Not the whole piano: needs orientation cues; still narrow on phones for wide pieces                              |
| The loop's or the hand's range when one is set | Large keys exactly when a passage is practiced | The keyboard changes when the loop or hand changes (a user action, not during play)                              |
| A window that follows the music                | Large keys on any screen                       | Moves while playing; both hands often do not fit (the median 4-measure span of the Entertainer is 29 white keys) |
| A split keyboard, one window per hand          | Both hands large on a narrow screen            | Breaks the continuous map of the piano; new and untested                                                         |

### Controls

| Option                                                                    | Pros                                                                    | Cons                                                                                                                                    |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Panel between score and keyboard (current)                                | Room for labels and sliders                                             | Separates the notes from the keyboard; wraps on phones                                                                                  |
| One bar at the bottom edge                                                | Shortest reach from the keys                                            | Needs a second bar for the title and menu; next to Safari's toolbar on iPhone; the keyboard is no longer the edge nearest the real keys |
| One bar at the top, holding the menu too (Synthesia, Playground Sessions) | One bar only; the keyboard stays at the bottom edge; the common pattern | Farthest from the hands: about 15 cm on a phone, 25 cm on a tablet in portrait                                                          |
| A rail along the side (phone landscape)                                   | Costs width, which landscape has, not height                            | Unusual; popovers cover part of the score                                                                                               |
| Controls that hide during playback                                        | Most room for music                                                     | A tap to bring them back; reverted by Piano Marvel                                                                                      |

## Recommendation

### For every form factor

1. **One screen, no page scroll.** The page is a fixed frame of `100svh` (or `100dvh`, to test): only the score scrolls, inside its own box, driven by the cursor. Messages such as "Loading the piano sound" appear as an overlay, never by pushing the layout down.
2. **The score directly above the keyboard,** the keyboard at the bottom edge (nearest the real keys), and all controls in one compact bar at the top that also holds the menu, and the title where there is room. On a phone in landscape the bar becomes a rail along the side, because height is what landscape lacks. This replaces the header and "controls in the middle" from the design.
3. **A keyboard fitted to what is practiced:** the piece's range, narrowed to the loop when a loop is on and to the practiced hand when one hand is chosen, padded to white keys with at least two octaves. It does not move while playing; it changes only when the learner changes the loop or the hand. Orientation cues: middle C always marked (for example "do4" or "C4"), and a thin strip above the keys showing all 88 keys with the visible part outlined and the lit keys as colored ticks. "All 88 keys" stays available as a setting and fits on a tablet in landscape and on a laptop.
4. **A score size setting** (larger, smaller), stored on the device like the note names, on top of a default per form factor. Default zoom 1 on phones and tablets, which is print size on a phone.
5. **The bar holds what is used while practicing:** play and pause, back to the start of the loop or the piece, the measure number, tempo (a button showing "60%" that opens a slider; inline on tablets), hands (a button showing the choice that opens left, both, right; a segmented control on tablets) and loop. The rest (open a file, note names, score size, keyboard range, mute the other hand) goes into the menu. Tapping a measure in the score still starts there. The bar stays visible while playing.
6. **Keep the screen awake** while a piece is open and playing (Screen Wake Lock, requested again after the page becomes visible), and offer a fullscreen button where the Fullscreen API exists (Android, iPad).

### Phone in portrait

```
+--------------------------------------+
| [=] [>] [|<]  m.12   60%  [LR]  [O]  |  one bar, 52 px: menu, play, back to
+--------------------------------------+  start, measure, tempo, hands, loop
| [system with the cursor, 1-2 bars]   |  score: wrapped systems, zoom 1,
|                                      |  the cursor's system kept at the top
| [next system]                        |
|                                      |
| [system after that, partly visible]  |
+--------------------------------------+
| [====[####]=========================]|  88-key strip, visible part outlined
| | |#| | | |#| |#| | | |#| | | |#| | ||  keyboard fitted to the piece,
| |_|_|_|_|_|_|_|_|_|_|_|_|_|_|_|_|_|_||  loop or hand, about 110 px
+--------------------------------------+
```

- Bar: seven buttons of 44 px fit in about 360 px. The title is shown in the menu.
- Score: wrapped systems at zoom 1 (one to two measures per system), about 450 to 600 px high (estimated, with the browser's bars shown), so two to three systems are visible and at least one measure ahead is always in view.
- Keyboard: fitted as above. For pieces as wide as the Entertainer the keys are about 10 px in "both hands"; the colors still show at a distance, the names need leaning in. With one hand they are 17 px or more, with a four-measure loop typically 13 to 26 px.
- A one-time, dismissible hint that turning the phone gives a larger keyboard and more music per line. No forced landscape: it is not possible on iPhone, and many people keep rotation locked.

### Phone in landscape

```
+----------------------------------------------------------------+------+
| [clef] ..one line of the grand staff, scrolling sideways..     |  >   |
|          |cursor   ......at least one measure ahead......     |  |<  |
|          |                                                     | 60%  |
+----------------------------------------------------------------+  LR  |
| [====[##########]===============================]               |  O   |
| | |#| | | |#| |#| | | |#| | | |#| |#| | | |#| | | |#| | | |#| | | menu |
+----------------------------------------------------------------+------+
```

- Score: one horizontal line, scrolling stepwise, with the zoom fitted to the height left after the keyboard (about 0.75 to 0.85 with the browser's bars shown; up to 1 in fullscreen or as an installed app).
- Keyboard: about 75 to 90 px high; at about 700 px wide the piece's range gives 19 to 39 px per white key for the test pieces.
- Controls: a rail of 44 px buttons on the right edge. Tempo and hands open small popovers.
- The clef and key signature scroll out of view on one line. Pinning them at the left edge, as Soundslice does, would need our own drawing; leave it out at first.

### Tablet (portrait and landscape) and laptop

```
+------------------------------------------------------------+
| [=] Wild Horseman  [>] [|<]  m.12  --o-- 60%  [L|LR|R]  [O] |
+------------------------------------------------------------+
| [system with the cursor: 3 to 5 measures]                  |
| [next system]                                              |
| [system after that]                                        |
+------------------------------------------------------------+
| [====[##########]=========================================]|
| keyboard fitted to the piece (or all 88 keys), about 150 px|
+------------------------------------------------------------+
```

- Score: wrapped systems at zoom 1 (7.7 mm staves on an iPad), the cursor's system kept at the top: three to four systems in portrait, two to three in landscape.
- Keyboard: the piece's range (22 to 44 px keys in portrait) or all 88 keys (15 px in portrait, 22 px in landscape).
- Controls: the same bar, with room for the tempo slider inline. A laptop uses this layout too.

### Choosing the layout

- Three arrangements, chosen by CSS media queries on the viewport: phone landscape `(orientation: landscape) and (max-height: 500px)`, phone portrait `(max-width: 600px)`, everything else regular. The same breakpoints, read with `matchMedia` in `ui/`, choose the score mode (wrapped or one line) and the keyboard height.
- Rotating re-renders the score in the other mode; the transport keeps playing.

### Where the changes go

- `ui/practicePage` and `style.css`: the frame, the transport bar and rail, the menu, the media queries, wake lock and fullscreen.
- `score/osmd/OsmdScore`: a layout mode (wrapped or one line) and a zoom, set from `ui/`; a raised `SheetMaximumWidth` for one line.
- `score/ScoreCursor`: the scroll rules (current system on top; stepwise sideways with one measure ahead).
- `keyboard/`: `setRange`, the 88-key overview strip, the middle C marker, keys sized to fit instead of scrolling.
- `timeline/queries`: the pitch range of a span of beats, per hand.
- No changes in `playback/`.

## Trade-offs

- **Phone portrait stays a compromise.** At a legible size only one or two measures fit per system, and the keyboard is narrow for pieces that use four octaves. The recommendation makes it usable, not ideal; landscape and tablets are better.
- **Wrapped systems on a phone in portrait differ from the other apps,** which show one line on phones (apparently in landscape). In portrait, one line at a legible size shows one and a half measures and leaves the height empty; wrapped systems show two to three times as much.
- **Controls at the top are farther from the hands** than a bar at the bottom would be: about 15 cm on a phone, 25 cm on a tablet. In return there is one bar instead of two, the keyboard stays at the edge nearest the real keys, and the bar is clear of Safari's toolbar.
- **One line in landscape needs the zoom below print size** (about 0.8, 5.3 mm staves on an iPhone) while the browser's bars are shown. Fullscreen (Android) or an installed app (iOS) gives back the height. A shorter keyboard would too.
- **A fitted keyboard is not the whole piano.** The overview strip and the middle C marker are there to keep the learner oriented; this is worth testing with a beginner at the piano.
- **Stepwise scrolling** moves the music once per few measures, at a moment of the app's choosing, not the reader's. Continuous scrolling is the alternative to compare.
- **Two score modes** (wrapped and one line) double the layouts to check for the cursor and measure taps, although the code paths are the same.
- **Moving the controls into a bar and a menu** hides the loop range pickers and the progress slider on small screens; the loop needs a touch-friendly way to choose its measures.

## Decisions to take

Taken on 2026-11-22: see `docs/decisions.md` ("Practice screen layout on phones and tablets"). Two choices differ from the recommendation above: the keyboard always shows all 88 keys, fitted to the width, with the names of the sounding notes in a strip above it on phones; and a loop is chosen by tapping measures in the score.

1. Arrangement: score directly above the keyboard, the keyboard at the bottom edge, all controls in one bar at the top (a side rail on phones in landscape). This replaces the header and "controls in the middle" in the design.
2. Score layout per form factor: wrapped systems on phones in portrait and on tablets, one horizontal line on phones in landscape. Whether the learner can switch it.
3. Scrolling on one line: stepwise or continuous (or both, to compare at the piano).
4. Keyboard range: fitted to the piece, the loop and the practiced hand, fixed while playing; "all 88 keys" as a setting. Whether to add the 88-key overview strip and the middle C marker.
5. Score size: default zoom 1, with a setting stored on the device.
6. Contents of the transport bar versus the menu, including dropping the progress slider on phones in favor of tapping measures and a "back to start" button.
7. How to choose a loop on a touch screen (two measure pickers in the menu, or selecting measures in the score).
8. Portrait on phones: supported with a hint to rotate, not blocked.
9. Wake lock and a fullscreen button; whether an installable web app (phase 3) comes earlier for the height it gives on iPhone.

## Open questions for the maintainer

- Which phone and which tablet will be used at the piano (model, Android or iPhone)? The phone tested was in Chrome; is it in landscape on the music desk?
- How far are the eyes from the music desk, and is zoom 1 on the phone readable from the bench? (Try the score at 1 and 0.8.)
- Does the music desk take a tablet in landscape, and does its ledge cover the bottom edge of the screen?
- Is a keyboard that shows only part of the piano acceptable, if middle C is marked? Or should the 88 keys stay, smaller?
- Is the title needed on screen while practicing?
- Should the on-screen keyboard be optional, to give the score all the height when it is not needed?

## Sources

App descriptions: see the links in "How other apps arrange the screen". Reading and ergonomics: see the links in "What a pianist needs at the piano". OSMD: `node_modules/opensheetmusicdisplay` 3.0.0 (`CHANGELOG.md`, `build/dist/src/OpenSheetMusicDisplay/OSMDOptions.d.ts`, `build/dist/src/OpenSheetMusicDisplay/OpenSheetMusicDisplay.d.ts`, `build/dist/src/MusicalScore/Graphical/EngravingRules.d.ts`). Measurements: the dev server with the test scores in `tests/fixtures/`, in Chrome on the development laptop, 22 November 2026.
