import { contrastRatio, parseHex, readableInk, toHex } from '../book-colour';
import { BOOK_FONTS_IDS, type BookFontFamily } from '../book.schema';
import {
  BOOK_THEME_IDS,
  type BookColorToken,
  type BookFontSlot,
  type BookTheme,
  type BookThemeFont,
  type BookThemeId,
} from './book-theme.schema';
import { BOOK_THEME_PRESETS, type BookThemePreset } from './book-themes.data';

/** Reading a theme: the built-in presets by id, the faces of its slots, and the colour a token stands for. */

/** Whether this build sets type in a family. */
export const isBookFontFamily = (id: string): id is BookFontFamily =>
  (BOOK_FONTS_IDS as readonly string[]).includes(id);

/** Whether a string names a built-in theme. */
export const isBookThemeId = (id: string): id is BookThemeId => (BOOK_THEME_IDS as readonly string[]).includes(id);

/** The built-in theme of an id, or undefined. */
export function bookThemePreset(id: string): BookThemePreset | undefined {
  return BOOK_THEME_PRESETS.find((p) => p.id === id);
}

/** A built-in theme as the document keeps it. */
export function bookThemeFromPreset(preset: BookThemePreset): BookTheme {
  return {
    id: preset.id,
    palette: { ...preset.palette },
    fonts: {
      display: { ...preset.fonts.display },
      heading: { ...preset.fonts.heading },
      body: { ...preset.fonts.body },
      script: preset.fonts.script ? { ...preset.fonts.script } : null,
    },
    motifs: [...preset.motifs],
    decoration: preset.decoration,
    frameStyle: preset.frameStyle,
    tilt: preset.tilt,
  };
}

/** A built-in theme by id, as the document keeps it. Every id has one (a spec holds the list to the data). */
export function bookThemeOf(id: BookThemeId): BookTheme {
  const preset = bookThemePreset(id);
  if (!preset) throw new Error(`no built-in theme ${id}`);
  return bookThemeFromPreset(preset);
}

/** A colour part way from `a` to `b`. */
export function mixHex(a: string, b: string, t: number): string {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return a;
  return toHex({ r: ca.r + (cb.r - ca.r) * t, g: ca.g + (cb.g - ca.g) * t, b: ca.b + (cb.b - ca.b) * t });
}

/** The ink, unless it reads under 4.5:1 on the paper; then whichever of near black and white reads better. */
export function readableOn(paper: string, ink: string): string {
  return contrastRatio(ink, paper) >= 4.5 ? ink : readableInk(paper);
}

/**
 * The softer ink of captions and meta lines: a third of the way to the
 * paper, as long as it still reads at 4.6:1, else the ink itself.
 */
export function mutedOn(paper: string, ink: string): string {
  const softer = mixHex(ink, paper, 0.3);
  return contrastRatio(softer, paper) >= 4.6 ? softer : ink;
}

/** The colour a token stands for in a theme. */
export function bookThemeColor(theme: BookTheme, token: BookColorToken): string {
  const { palette } = theme;
  if (token === 'muted') return mutedOn(palette.paper, readableOn(palette.paper, palette.ink));
  return palette[token];
}

/** The face a slot is set in, or null for a theme without a script. */
export function bookThemeFont(theme: BookTheme, slot: BookFontSlot): BookThemeFont | null {
  return theme.fonts[slot];
}

/** A theme's paper as a page background: none for white, which is the paper itself. */
export const themePaperBackground = (theme: BookTheme): string | null =>
  theme.palette.paper.toLowerCase() === '#ffffff' ? null : theme.palette.paper.toLowerCase();
