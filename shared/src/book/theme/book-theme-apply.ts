import { withRealWeight } from '../book-fonts';
import {
  bookTextElementSchema,
  type BookDocument,
  type BookElement,
  type BookSpread,
  type BookTextElement,
} from '../book.schema';
import { bookThemeColor, bookThemeFont, isBookFontFamily, themePaperBackground } from './book-theme';
import { adoptSpread, adoptionMap } from './book-theme-adopt';
import type { BookColorToken, BookFontSlot, BookTheme, BookThemeFont } from './book-theme.schema';

/**
 * Applying a theme to a book: every linked colour takes the theme's value,
 * every linked text its face, and nothing else moves. Positions, sizes,
 * photos, words and every colour nobody linked stay exactly as they were, so
 * a theme can be tried and tried again without the pages drifting.
 *
 * With `adopt`, what is not linked yet is linked first (book-theme-adopt.ts),
 * which is how a book made before themes, or by hand, takes one at all.
 * Locked elements are left as they are, as every other edit leaves them.
 */

export interface ApplyBookThemeOptions {
  /** Only these pages; every page when left out. */
  spreadIds?: readonly string[];
  /** Link what is not linked yet before recolouring. */
  adopt?: boolean;
}

const weightSchema = bookTextElementSchema.shape.weight.unwrap();

/** The weight a face asks for, when this build's text takes it; otherwise the element keeps its own. */
function weightOf(face: BookThemeFont): Partial<Pick<BookTextElement, 'weight'>> {
  if (face.weight === undefined) return {};
  const parsed = weightSchema.safeParse(face.weight);
  return parsed.success ? { weight: parsed.data } : {};
}

/** The fields a face sets on a typeset element. */
function faceFields(face: BookThemeFont | null): Record<string, unknown> {
  // A family this build does not set (a theme from a newer one) leaves the text in its own.
  if (!face || !isBookFontFamily(face.font)) return {};
  return { font: face.font, ...weightOf(face), ...(face.italic !== undefined ? { italic: face.italic } : {}) };
}

/** A face for a slot; a theme without a script sets script words in its heading face, upright. */
function slotFace(theme: BookTheme, slot: BookFontSlot): BookThemeFont | null {
  return bookThemeFont(theme, slot) ?? { ...theme.fonts.heading, italic: false };
}

/** Set `key` to the token's colour when the element links it. */
function tokenColour(
  next: Record<string, unknown>,
  theme: BookTheme,
  key: string,
  token: BookColorToken | undefined,
): void {
  if (token) next[key] = bookThemeColor(theme, token);
}

/** One element as the theme sets it: its linked colours and its linked face, the rest as it was. */
export function themedElement<E extends BookElement>(el: E, theme: BookTheme): E {
  if (el.locked) return el;
  const next: Record<string, unknown> = { ...el };
  switch (el.kind) {
    // A line keeps the colour it was drawn in (book-line.schema.ts has no theme link).
    case 'photo':
    case 'sticker':
    case 'line':
      return el;
    case 'text': {
      tokenColour(next, theme, 'color', el.token);
      if (el.fontRole) Object.assign(next, faceFields(slotFace(theme, el.fontRole)));
      break;
    }
    case 'shape':
      if (el.token && el.fill !== null) {
        tokenColour(next, theme, 'fill', el.token);
        // A flat paint is the fill with an alpha: it follows too. A gradient or a pattern stays the person's.
        const color = bookThemeColor(theme, el.token);
        if (el.paint?.type === 'solid' && el.paint.color !== color) next.paint = { ...el.paint, color };
      }
      if (el.strokeToken && el.stroke !== null) tokenColour(next, theme, 'stroke', el.strokeToken);
      break;
    case 'icon':
      tokenColour(next, theme, 'color', el.token);
      break;
    default: {
      tokenColour(next, theme, 'color', el.token);
      tokenColour(next, theme, 'accent', el.accentToken);
      if (el.fontRole) {
        const { italic: _upright, ...face } = faceFields(slotFace(theme, el.fontRole));
        Object.assign(next, face);
      }
    }
  }
  // A face the theme sets without a weight keeps the element's, moved onto one the family has.
  const out = 'fontRole' in el && el.fontRole ? withRealWeight(next as E) : (next as E);
  const changed = Object.keys(out).some(
    (k) => (out as Record<string, unknown>)[k] !== (el as Record<string, unknown>)[k],
  );
  return changed ? out : el;
}

/** A page as the theme sets it; the very same object when nothing on it is linked. */
export function themedSpread(spread: BookSpread, theme: BookTheme): BookSpread {
  const elements = spread.elements.map((e) => themedElement(e, theme));
  const parked = spread.parked.map((e) => themedElement(e, theme));
  const background = spread.backgroundToken
    ? spread.backgroundToken === 'paper'
      ? themePaperBackground(theme)
      : bookThemeColor(theme, spread.backgroundToken)
    : spread.background;
  // A flat paint on the page follows its link too; on a white paper it goes, the paper being the page.
  const paint = spread.backgroundPaint;
  const flat = spread.backgroundToken !== undefined && paint?.type === 'solid';
  const backgroundPaint =
    flat && paint?.type === 'solid'
      ? background === null
        ? undefined
        : paint.color === background
          ? paint
          : { ...paint, color: background }
      : paint;
  const same =
    background === spread.background &&
    backgroundPaint === spread.backgroundPaint &&
    elements.every((e, i) => e === spread.elements[i]) &&
    parked.every((e, i) => e === spread.parked[i]);
  if (same) return spread;
  const { backgroundPaint: _old, ...rest } = spread;
  return { ...rest, background, ...(backgroundPaint ? { backgroundPaint } : {}), elements, parked };
}

/**
 * The book with the theme applied to the pages named (all by default) and
 * kept as the book's theme. Pages the theme leaves as they were keep their
 * identity, so a caller can tell which ones changed.
 */
export function applyBookTheme(doc: BookDocument, theme: BookTheme, options: ApplyBookThemeOptions = {}): BookDocument {
  const only = options.spreadIds ? new Set(options.spreadIds) : null;
  const map = options.adopt ? adoptionMap(doc, doc.theme ?? null) : null;
  const spreads = doc.spreads.map((spread) => {
    if (only && !only.has(spread.id)) return spread;
    const linked = map ? adoptSpread(spread, map, doc.theme ?? null) : spread;
    return themedSpread(linked, theme);
  });
  return { ...doc, theme, spreads };
}

/** The ids of the pages whose content differs between two versions of a book, by identity. */
export function changedSpreadIds(before: BookDocument, after: BookDocument): string[] {
  return after.spreads.filter((s, i) => before.spreads[i] !== s).map((s) => s.id);
}
