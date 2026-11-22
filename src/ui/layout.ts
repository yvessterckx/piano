/**
 * The arrangement of the practice screen, by viewport (see docs/decisions.md, "Practice screen
 * layout on phones and tablets"). Set as data-layout on the page; style.css keys off it.
 *
 * - phone-portrait: control bar on top, systems under each other, keyboard below.
 * - phone-landscape: one line of music, control rail on the right, keyboard below the music.
 * - regular (tablets, laptops): like phone-portrait, with the title and the progress slider.
 */
export type Layout = 'phone-portrait' | 'phone-landscape' | 'regular';

const PHONE_LANDSCAPE = '(orientation: landscape) and (max-height: 500px)';
const PHONE_PORTRAIT = '(max-width: 600px)';

/** Calls the listener with the current layout now and whenever it changes (rotation, resize). */
export function watchLayout(listener: (layout: Layout) => void): void {
  const landscape = matchMedia(PHONE_LANDSCAPE);
  const portrait = matchMedia(PHONE_PORTRAIT);
  const current = (): Layout =>
    landscape.matches ? 'phone-landscape' : portrait.matches ? 'phone-portrait' : 'regular';
  let layout = current();
  const update = (): void => {
    const next = current();
    if (next === layout) return;
    layout = next;
    listener(layout);
  };
  landscape.addEventListener('change', update);
  portrait.addEventListener('change', update);
  listener(layout);
}
