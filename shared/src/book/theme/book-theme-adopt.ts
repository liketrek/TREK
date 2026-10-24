import { contrastRatio, deltaE, parseHex, toHsl } from '../book-colour';
import type { BookDocument, BookElement, BookSpread } from '../book.schema';
import { bookThemeColor } from './book-theme';
import {
  BOOK_COLOR_TOKENS,
  BOOK_FONT_SLOTS,
  type BookColorToken,
  type BookFontSlot,
  type BookTheme,
} from './book-theme.schema';

/**
 * Linking what is not linked yet, so a book made before themes (or by hand)
 * can take one: the first step of "apply theme" with `adopt`.
 *
 * The rules read each colour against the page it sits on, because that is
 * what decides what it is for:
 *
 * - A page's own background is the paper.
 * - A neutral colour that reads on its page (3:1 or more) is the ink, or the
 *   muted ink for small grey type. A neutral that does not read on its page,
 *   white words over a photograph, is left alone: it answers to the picture,
 *   not to the paper.
 * - A coloured one is an accent. The book's coloured inks are ranked by how
 *   often they are used and take accent, accent2 and accent3 in that order,
 *   the same mapping on every page, so two pages that shared a colour still
 *   share one; a fourth goes to whichever of those three it is nearest.
 * - A fading shape is a scrim over a photo and is left alone.
 * - Texts take a typeface slot by size: a cover title from 36 pt is display,
 *   anything from 15 pt a heading, the rest body. The travel elements take
 *   the heading face, as the design engine sets them.
 *
 * With a previous theme, a colour or face that is (nearly) one of its own is
 * linked to that entry first, so applying one theme after another keeps
 * every role it had.
 */

/** Colours closer than this (CIE76) are the same entry of a palette. */
const SAME = 6;

/** A coloured ink to a token, for the whole book. */
type BookAdoptionMap = ReadonlyMap<string, BookColorToken>;

const ACCENTS = ['accent', 'accent2', 'accent3'] as const;

function isNeutral(hex: string): boolean {
  const c = parseHex(hex);
  if (!c) return true;
  const { s, l } = toHsl(c);
  return s < 0.15 || l < 0.08 || l > 0.95;
}

/** The token of a previous theme a colour already is, near enough. */
function previousToken(hex: string, prev: BookTheme | null): BookColorToken | undefined {
  if (!prev) return undefined;
  return BOOK_COLOR_TOKENS.find((t) => deltaE(bookThemeColor(prev, t), hex) < SAME);
}

/** The coloured inks an element is drawn in, as adoption would read them. */
function chromaticInks(el: BookElement): string[] {
  switch (el.kind) {
    // A line keeps the colour it was drawn in (book-line.schema.ts has no theme link).
    case 'photo':
    case 'sticker':
    case 'line':
      return [];
    case 'text':
    case 'icon':
      return [el.color];
    case 'shape':
      return el.gradient !== 'none' ? [] : [el.fill, el.stroke].filter((c): c is string => c !== null);
    default:
      return [el.color, el.accent];
  }
}

/**
 * The book's coloured inks to accent tokens, most used first. The previous
 * theme's own accents keep their tokens; the rest share out what is left.
 */
export function adoptionMap(doc: BookDocument, prev: BookTheme | null): BookAdoptionMap {
  const counts = new Map<string, number>();
  for (const spread of doc.spreads) {
    for (const el of [...spread.elements, ...spread.parked]) {
      for (const ink of chromaticInks(el)) {
        const key = ink.toLowerCase();
        if (!isNeutral(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  }
  const map = new Map<string, BookColorToken>();
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([c]) => c);
  for (const c of ranked) {
    const known = previousToken(c, prev);
    if (known) map.set(c, known);
  }
  const free = ACCENTS.filter((t) => ![...map.values()].includes(t));
  const firsts: [string, BookColorToken][] = [];
  for (const c of ranked) {
    if (map.has(c)) continue;
    const token = free.shift();
    if (token) {
      map.set(c, token);
      firsts.push([c, token]);
      continue;
    }
    const pool = firsts.length ? firsts : [...map.entries()];
    const nearest = pool.reduce((best, cur) => (deltaE(cur[0], c) < deltaE(best[0], c) ? cur : best), pool[0]!);
    map.set(c, nearest[1]);
  }
  return map;
}

/** What a colour on a page links to, or undefined to leave it as it is. */
function inkToken(
  hex: string,
  ground: string,
  map: BookAdoptionMap,
  prev: BookTheme | null,
  small = false,
): BookColorToken | undefined {
  const key = hex.toLowerCase();
  if (!isNeutral(key)) return map.get(key) ?? previousToken(key, prev);
  const known = previousToken(key, prev);
  if (known && known !== 'paper') return known;
  const contrast = contrastRatio(key, ground);
  if (contrast < 3) return undefined;
  return small && contrast < 9 ? 'muted' : 'ink';
}

/** The slot a text is set in, by the face it has under the previous theme, else by its size. */
function textSlot(font: string, size: number, cover: boolean, prev: BookTheme | null): BookFontSlot {
  const own = prev ? BOOK_FONT_SLOTS.find((s) => prev.fonts[s]?.font === font) : undefined;
  if (own && !(own === 'display' && size < 15)) return own;
  if (size >= 36) return cover ? 'display' : 'heading';
  return size >= 15 ? 'heading' : 'body';
}

/** The background link a page takes, or none. */
function backgroundToken(spread: BookSpread, map: BookAdoptionMap, prev: BookTheme | null): BookColorToken | undefined {
  if (spread.backgroundPaint && spread.backgroundPaint.type !== 'solid') return undefined;
  if (spread.background === null) return 'paper';
  const known = previousToken(spread.background, prev);
  if (known) return known;
  if (isNeutral(spread.background)) return 'paper';
  return map.get(spread.background.toLowerCase());
}

/** An element with links for what it did not link yet. */
function adoptElement(
  el: BookElement,
  ground: string,
  cover: boolean,
  map: BookAdoptionMap,
  prev: BookTheme | null,
): BookElement {
  if (el.locked) return el;
  switch (el.kind) {
    // A sticker keeps the colours of its slots: they are a drawing, not the page's inks. A line
    // keeps the colour it was drawn in (book-line.schema.ts has no theme link).
    case 'photo':
    case 'sticker':
    case 'line':
      return el;
    case 'text': {
      const token = el.token ?? inkToken(el.color, ground, map, prev, el.size <= 9);
      const fontRole = el.fontRole ?? textSlot(el.font, el.size, cover, prev);
      return token === el.token && fontRole === el.fontRole ? el : { ...el, token, fontRole };
    }
    case 'shape': {
      // A scrim over a photo, or a gradient or pattern of the person's own: not the theme's to recolour.
      if (el.gradient !== 'none' || (el.paint && el.paint.type !== 'solid')) return el;
      const token = el.token ?? (el.fill !== null ? inkToken(el.fill, ground, map, prev) : undefined);
      const strokeToken = el.strokeToken ?? (el.stroke !== null ? inkToken(el.stroke, ground, map, prev) : undefined);
      return token === el.token && strokeToken === el.strokeToken ? el : { ...el, token, strokeToken };
    }
    case 'icon': {
      const token = el.token ?? inkToken(el.color, ground, map, prev);
      return token === el.token ? el : { ...el, token };
    }
    default: {
      const token = el.token ?? inkToken(el.color, ground, map, prev);
      const accentToken = el.accentToken ?? inkToken(el.accent, ground, map, prev);
      const fontRole = el.fontRole ?? (prev?.fonts.body.font === el.font ? 'body' : 'heading');
      if (token === el.token && accentToken === el.accentToken && fontRole === el.fontRole) return el;
      return { ...el, token, accentToken, fontRole };
    }
  }
}

/** Drop the links adoption left undefined, so a document carries no empty keys. */
function clean<T extends object>(el: T): T {
  const out = { ...el } as Record<string, unknown>;
  for (const key of ['token', 'strokeToken', 'accentToken', 'fontRole', 'backgroundToken']) {
    if (key in out && out[key] === undefined) delete out[key];
  }
  return out as T;
}

/** A page with links for everything adoption can read; the same object when it links nothing new. */
export function adoptSpread(spread: BookSpread, map: BookAdoptionMap, prev: BookTheme | null): BookSpread {
  const ground = spread.background ?? '#ffffff';
  const cover = spread.role === 'cover';
  const adopt = (el: BookElement) => {
    const next = adoptElement(el, ground, cover, map, prev);
    return next === el ? el : clean(next);
  };
  const elements = spread.elements.map(adopt);
  const parked = spread.parked.map(adopt);
  const bg = spread.backgroundToken ?? backgroundToken(spread, map, prev);
  const same =
    bg === spread.backgroundToken &&
    elements.every((e, i) => e === spread.elements[i]) &&
    parked.every((e, i) => e === spread.parked[i]);
  return same ? spread : clean({ ...spread, backgroundToken: bg, elements, parked });
}
