import { invalidOp, type BookEditResult, type BookOpError } from '../book-ops-core';
import type { BookDocument } from '../book.schema';
import { bookThemeFromPreset, bookThemePreset, isBookFontFamily } from './book-theme';
import { applyBookTheme, changedSpreadIds } from './book-theme-apply';
import {
  BOOK_FONT_SLOTS,
  setBookThemeRequestSchema,
  type BookTheme,
  type BookThemeFont,
  type SetBookThemeRequest,
} from './book-theme.schema';

/**
 * `set_book_theme`, the one way the Studio's Theme panel and the assistant
 * apply a theme: a built-in theme or the book's own, with whatever colours,
 * faces, motifs or decoration are named changed on top, applied to the whole
 * book or to the pages named. The answer names the pages it recoloured.
 */

const refused = (code: BookOpError['code'], message: string): BookEditResult => ({
  ok: false,
  error: { code, message, opIndex: null },
});

/** The faces named, on top of the theme's own; an unknown family is a refusal the model can act on. */
function withFonts(base: BookTheme, fonts: SetBookThemeRequest['fonts']): BookTheme | string {
  if (!fonts) return base;
  const next = { ...base.fonts };
  for (const slot of BOOK_FONT_SLOTS) {
    const face = fonts[slot];
    if (face === undefined) continue;
    if (face === null) {
      if (slot !== 'script') return `the ${slot} face cannot be left out`;
      next.script = null;
      continue;
    }
    if (!isBookFontFamily(face.font)) return `there is no font ${face.font}; use one of the font ids`;
    const set: BookThemeFont = { font: face.font };
    if (face.weight !== undefined) set.weight = face.weight;
    if (face.italic !== undefined) set.italic = face.italic;
    next[slot] = set;
  }
  return { ...base, fonts: next };
}

/** The theme a request asks for: the preset or the book's own, with what it names changed. */
export function requestedBookTheme(doc: BookDocument, args: SetBookThemeRequest): BookTheme | string {
  const preset = args.theme ? bookThemePreset(args.theme) : undefined;
  const base = preset ? bookThemeFromPreset(preset) : doc.theme;
  if (!base) return 'this book has no theme yet: name one with theme';
  const fonted = withFonts(base, args.fonts);
  if (typeof fonted === 'string') return fonted;
  return {
    ...fonted,
    palette: { ...fonted.palette, ...stripUndefined(args.palette ?? {}) },
    ...(args.motifs ? { motifs: [...new Set(args.motifs)] } : {}),
    ...(args.decoration ? { decoration: args.decoration } : {}),
  };
}

function stripUndefined<T extends Record<string, string | undefined>>(o: T): Record<string, string> {
  return Object.fromEntries(Object.entries(o).filter((e): e is [string, string] => e[1] !== undefined));
}

/** Apply a theme to a book, as `set_book_theme` takes it. Adopts what is not linked yet unless told not to. */
export function setBookTheme(doc: BookDocument, args: unknown): BookEditResult {
  const parsed = setBookThemeRequestSchema.safeParse(args);
  if (!parsed.success) return { ok: false, error: invalidOp(parsed.error, null) };
  const a = parsed.data;
  const missing = a.spreadIds?.find((id) => !doc.spreads.some((s) => s.id === id));
  if (missing) return refused('spread_not_found', `no page ${missing}`);
  const theme = requestedBookTheme(doc, a);
  if (typeof theme === 'string') return refused('invalid_op', theme);
  const next = applyBookTheme(doc, theme, { spreadIds: a.spreadIds, adopt: a.adopt ?? true });
  const spreadIds = changedSpreadIds(doc, next);
  // Nothing moved: the very same document back, so the server writes nothing.
  const same = spreadIds.length === 0 && JSON.stringify(doc.theme) === JSON.stringify(theme);
  return { ok: true, doc: same ? doc : next, spreadIds, created: [], dropped: [] };
}
