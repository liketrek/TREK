import type { BookElement, BookSpread } from '../book.schema';
import { bookThemeColor, bookThemePreset } from './book-theme';
import type { BookTheme, BookThemeFont } from './book-theme.schema';
import { BOOK_THEME_PRESETS } from './book-themes.data';

/**
 * The theme in words, for a model that reads a page as text: which theme the
 * book is in, and what each element and the page follow of it.
 */

const face = (f: BookThemeFont | null) =>
  f ? `${f.font}${f.weight ? ` ${f.weight}` : ''}${f.italic ? ' italic' : ''}` : 'none';

/** One line on the book's theme, or how to give it one. */
export function bookThemeLine(theme: BookTheme | undefined): string {
  if (!theme) return 'Theme: none yet (set_book_theme applies one).';
  const name = theme.id ? `${theme.id} (${bookThemePreset(theme.id)?.descr ?? ''})` : 'its own';
  const p = theme.palette;
  const fonts = `display ${face(theme.fonts.display)}, heading ${face(theme.fonts.heading)}, body ${face(theme.fonts.body)}, script ${face(theme.fonts.script)}`;
  const motifs = theme.motifs.length ? theme.motifs.join(', ') : 'none';
  return `Theme: ${name}; paper ${p.paper}, ink ${p.ink}, muted ${bookThemeColor(theme, 'muted')}, accent ${p.accent}, accent2 ${p.accent2}, accent3 ${p.accent3}; ${fonts}; motifs ${motifs}; decoration ${theme.decoration}.`;
}

/** What an element follows of the theme, as words for its line ('' when nothing). */
export function themeLinkWords(el: BookElement): string {
  if (el.kind === 'photo' || el.kind === 'sticker' || el.kind === 'line') return '';
  const parts: string[] = [];
  if (el.token) parts.push(`${el.kind === 'shape' ? 'fill' : 'colour'} ${el.token}`);
  if (el.kind === 'shape' && el.strokeToken) parts.push(`stroke ${el.strokeToken}`);
  if ('accentToken' in el && el.accentToken) parts.push(`accent ${el.accentToken}`);
  if ('fontRole' in el && el.fontRole) parts.push(`${el.fontRole} face`);
  return parts.length ? `follows the theme: ${parts.join(', ')}` : '';
}

/** What a page's background follows of the theme ('' when nothing). */
export function themeBackgroundWords(spread: BookSpread): string {
  return spread.backgroundToken ? ` It follows the theme's ${spread.backgroundToken}.` : '';
}

/** The built-in themes in one line each, for a tool description. */
export function bookThemeCatalogue(): string {
  return BOOK_THEME_PRESETS.map((p) => `${p.id}: ${p.descr}`).join(' ');
}
