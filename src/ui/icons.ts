/** Inline icons, drawn in the current text color. */
const icon = (body: string, filled = false): string =>
  `<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" ${
    filled
      ? 'fill="currentColor"'
      : 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
  }>${body}</svg>`;

export const ICON_OPEN = icon(
  '<path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
);
export const ICON_PLAY = icon(
  '<path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/>',
  true,
);
export const ICON_PAUSE = icon(
  '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  true,
);
export const ICON_LOOP = icon(
  '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
);
export const ICON_MENU = icon('<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>');
export const ICON_RESTART = icon(
  '<path d="M6 5v14"/><path d="M19 5.5v13a.8.8 0 0 1-1.2.7L9 12.7a.8.8 0 0 1 0-1.4l8.8-6.5a.8.8 0 0 1 1.2.7z"/>',
);
export const ICON_FULLSCREEN = icon(
  '<path d="M4 9V5a1 1 0 0 1 1-1h4"/><path d="M15 4h4a1 1 0 0 1 1 1v4"/><path d="M20 15v4a1 1 0 0 1-1 1h-4"/><path d="M9 20H5a1 1 0 0 1-1-1v-4"/>',
);
export const ICON_CLOSE = icon('<path d="M6 6l12 12"/><path d="M18 6L6 18"/>');

/** Notes falling onto a keyboard. */
export const ICON_FALLING_NOTES = icon(
  '<path d="M6 3v7"/><path d="M12 6v6"/><path d="M18 3v4"/><path d="M3 16h18"/><path d="M3 21h18"/>',
);
