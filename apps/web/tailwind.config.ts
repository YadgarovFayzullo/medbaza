import type { Config } from 'tailwindcss';

import { pageGutter, palette, radius, shadow } from './lib/design-tokens';

/**
 * The single source of truth for design tokens (CLAUDE.md §3, §9).
 *
 * Three colours, one radius, one type scale. Hierarchy comes from weight,
 * size, spacing, and opacity tints — never from a fourth hue or a gradient.
 * The single exception is `shadow-card`, the hover lift on a product card;
 * `boxShadow` is enabled only to make that one token exist.
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    // Not under `extend`: this replaces Tailwind's scale rather than adding to
    // it, so `shadow-card` is the only shadow utility that compiles.
    boxShadow: shadow,
    extend: {
      colors: palette,
      borderRadius: {
        // One radius project-wide. `rounded-full` stays available for avatars
        // and pills. Every key maps to it so `rounded-md`/`sm` cannot drift.
        lg: radius,
        md: radius,
        sm: radius,
        DEFAULT: radius,
      },
      fontFamily: {
        /*
         * Helvetica Neue, with the classic fallbacks behind it.
         *
         * Nothing is downloaded: it ships with macOS and iOS, and is not on
         * Google Fonts. Everywhere else the stack lands on Arial, which is
         * metrically compatible with Helvetica — so line breaks and column
         * widths hold rather than reflowing into the platform UI face.
         */
        sans: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
      fontSize: {
        // One scale, used everywhere.
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.375rem', { lineHeight: '1.875rem' }],
        '2xl': ['1.75rem', { lineHeight: '2.125rem' }],
        '3xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '4xl': ['3rem', { lineHeight: '3.25rem' }],
      },
      maxWidth: {
        content: '1200px',
      },
      spacing: {
        gutter: pageGutter,
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
      },
    },
  },
  // Gradients are removed from the theme entirely, so a stray
  // `bg-gradient-to-r` simply does not compile to anything.
  corePlugins: {
    // On only so the single `shadow-card` token above can exist.
    boxShadow: true,
    dropShadow: false,
    gradientColorStops: false,
    backgroundImage: false,
  },
  plugins: [],
};

export default config;
