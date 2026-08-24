/**
 * The palette, in one place.
 *
 * `tailwind.config.ts` builds its colour scale from this, and the few spots
 * that need a raw value outside CSS — browser theme colour, canvas fills —
 * read it from here rather than repeating a hex (CLAUDE.md §3, §9).
 *
 * `primary` is the brand blue. It works as a *fill* — dark `accent` text on it
 * is 4.61:1 — but not as *ink*: on white it is 3.39:1, under the 4.5:1 AA floor
 * for body text. `primary-ink` is the same hue darkened (5.04:1 on white) for
 * links, small text, icons, and focus rings. A shade, not a fourth hue.
 */
export const palette = {
  /** Background / neutral. */
  base: '#F7F8F9',
  /** Brand blue — button and badge fills, active states. Pair with `accent` text. */
  primary: '#0096C7',
  /** The readable shade of `primary`: links, small text, icons, focus rings. */
  'primary-ink': '#0077A3',
  /** Dark navy — headings, body text, emphasis. */
  accent: '#1B2430',
} as const;

/**
 * 8px project-wide — one radius for cards, controls, inputs, and images.
 * `rounded-full` stays reserved for avatars, pill badges, and counters.
 *
 * Still a single value: controls read tighter than they did, and the surfaces
 * around them follow, so nothing has to remember which radius it belongs to.
 */
export const radius = '8px';

/**
 * The page sits on white. `base` is no longer the page colour — it is the
 * recessed fill for wells, image placeholders, icon plates, and hover states,
 * which is what still separates a surface from what sits behind it now that
 * the background/card step is gone.
 */
export const pageBackground = '#FFFFFF';

/** `#RRGGBB` -> `rgb(r g b / a)`, so a shadow can be tinted with a palette
 *  colour instead of repeating its hex as a second literal. */
function tint(hex: string, alpha: number): string {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgb(${(value >> 16) & 255} ${(value >> 8) & 255} ${value & 255} / ${alpha})`;
}

/**
 * The only shadow in the system, and only on hover.
 *
 * Everything at rest is still flat: separation comes from a border or a
 * background step (CLAUDE.md §9). A card raises slightly under the pointer
 * because that is the one place a shadow says something a colour change does
 * not — this element moves when you click it. Tinted with `accent` rather than
 * black, so it reads as the same ink as the type.
 */
export const shadow = {
  card: `0 2px 10px -2px ${tint(palette.accent, 0.12)}`,
} as const;
