/** Space between a button and the panel it opens, and between the panel and the screen edge. */
const GAP_PX = 6;

/** Where a panel opens: below its button (a bar at the top), or to its left (a rail at the right). */
export type PopoverSide = 'below' | 'left';

/**
 * Positions a popover panel next to the button that opens it, each time it opens, on the side the
 * page asks for, kept inside the screen. (CSS anchor positioning would do this, but is not in every
 * browser the app supports.)
 */
export function anchorPopover(
  panel: HTMLElement,
  button: HTMLElement,
  side: () => PopoverSide,
): void {
  // Hidden until placed: the toggle event comes after the panel is shown at the default place.
  panel.addEventListener('beforetoggle', (event) => {
    if (event.newState === 'open') panel.style.visibility = 'hidden';
  });
  panel.addEventListener('toggle', (event) => {
    if (event.newState !== 'open') return;
    const anchor = button.getBoundingClientRect();
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;
    const toLeft = side() === 'left';
    const left = toLeft ? anchor.left - GAP_PX - width : anchor.left;
    const top = toLeft ? anchor.top : anchor.bottom + GAP_PX;
    panel.style.left = `${clamp(left, innerWidth - width)}px`;
    panel.style.top = `${clamp(top, innerHeight - height)}px`;
    panel.style.visibility = '';
  });
}

/** A position kept between the screen edge and the given far limit, with a gap at both. */
function clamp(position: number, limit: number): number {
  return Math.max(Math.min(position, limit - GAP_PX), GAP_PX);
}
