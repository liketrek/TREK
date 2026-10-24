import {
  BOOK_FONT_CATEGORIES,
  BOOK_FONT_FACES,
  BOOK_FONT_ROLES,
  BOOK_FONTS_IDS,
  BOOK_FONTS_PRECACHED,
  BOOK_WEIGHTS,
  type BookFontCategory,
  type BookFontFace,
  type BookFontFamily,
  type BookFontRole,
  type BookWeight,
} from './book-fonts.data';
import type { BookDocument, BookElement } from './book.schema';

/**
 * What the book's typefaces can do, read off the catalogue in
 * book-fonts.data.ts: which weights and italics a family really has, what it
 * is for, and which faces a book uses. Shared by the Studio, the findings,
 * the design engine and the page operations, so the assistant and the editor
 * snap a weight the same way.
 */

export {
  BOOK_FONT_CATEGORIES,
  BOOK_FONT_FACES,
  BOOK_FONT_ROLES,
  BOOK_FONTS_PRECACHED,
  BOOK_WEIGHTS,
  type BookFontCategory,
  type BookFontFace,
  type BookFontRole,
  type BookWeight,
};

/** The family behind an id, or undefined for an id this build does not know. */
export function bookFontFace(id: string): BookFontFace | undefined {
  return Object.prototype.hasOwnProperty.call(BOOK_FONT_FACES, id) ? BOOK_FONT_FACES[id as BookFontFamily] : undefined;
}

/** Whether `id` is a family of the catalogue. */
export const isBookFontId = (id: string): id is BookFontFamily => bookFontFace(id) !== undefined;

/** Whether a family ships the weight. An unknown family is not second-guessed. */
export function bookFontHasWeight(id: string, weight: number): boolean {
  const face = bookFontFace(id);
  return face ? (face.weights as readonly number[]).includes(weight) : true;
}

/**
 * The nearest weight a family really has, the lighter one on a tie.
 *
 * A synthesised bold is a smeared regular in print, so a family with one
 * weight gets that weight rather than a request the renderer has to fake. An
 * unknown family keeps what was asked.
 */
export function nearestBookWeight(id: string, weight: number): number {
  const face = bookFontFace(id);
  if (!face || (face.weights as readonly number[]).includes(weight)) return weight;
  return face.weights.reduce<number>(
    (best, w) => (Math.abs(w - weight) < Math.abs(best - weight) ? w : best),
    face.weights[0] ?? weight,
  );
}

/**
 * The lighter weight a travel element sets beside its figures (a unit after
 * a number, a caption under it): a step under the weight, never under 400
 * unless the weight itself is, and one the family has.
 */
export function bookLighterWeight(id: string, weight: number): number {
  return nearestBookWeight(id, Math.min(weight, Math.max(400, weight - 100)));
}

/** Whether a family has a real italic at that weight, rather than the browser's slant. */
export function bookFontHasItalic(id: string, weight: number): boolean {
  const face = bookFontFace(id);
  return !!face && (face.italics as readonly number[]).includes(weight);
}

/** What a family is for: the first of its roles, `body` for an unknown one. */
export const bookFontRole = (id: string): BookFontRole => bookFontFace(id)?.roles[0] ?? 'body';

/** Whether a family suits a role at all, not only as its first. */
export function bookFontSuits(id: string, role: BookFontRole): boolean {
  return bookFontFace(id)?.roles.includes(role) ?? false;
}

/**
 * Whether a family counts towards the faces a book is set in. A script laid
 * over a title and a mono line on a ticket are ornaments, not a third voice.
 */
export function bookFontCountsInMix(id: string): boolean {
  const role = bookFontRole(id);
  return role !== 'script' && role !== 'mono';
}

/** The element with its weight moved onto one its family has, when it is set in type at all. */
export function withRealWeight<T extends BookElement>(el: T): T {
  if (!('font' in el) || !('weight' in el)) return el;
  const weight = nearestBookWeight(el.font, el.weight);
  return weight === el.weight ? el : { ...el, weight: weight as BookWeight };
}

/** One face a book is set in: the family, the weight the renderer draws and the slant. */
export interface BookFaceUse {
  font: BookFontFamily;
  weight: number;
  italic: boolean;
}

/** The type-setting elements on a book's pages: everything that names a font, an empty text aside. */
function typeset(doc: BookDocument): Extract<BookElement, { font: string }>[] {
  const out: Extract<BookElement, { font: string }>[] = [];
  for (const spread of doc.spreads) {
    for (const el of spread.elements) {
      if ('font' in el && (el.kind !== 'text' || el.text.trim())) out.push(el);
    }
  }
  return out;
}

/** The families a book is set in, page numbers included when shown, in catalogue order. */
export function bookFontsUsed(doc: BookDocument): BookFontFamily[] {
  const used = new Set<string>(typeset(doc).map((el) => el.font));
  if (doc.page.pageNumbers.show) used.add(doc.page.pageNumbers.font);
  return BOOK_FONTS_IDS.filter((id) => used.has(id));
}

/**
 * Every face a book needs drawn, each once: what the Studio warms into the
 * offline cache when a book opens, so the book still reads in its own type
 * without a connection. Travel elements set a lighter weight beside their
 * figures, which is why both of those are named.
 */
export function bookFacesUsed(doc: BookDocument): BookFaceUse[] {
  const seen = new Map<string, BookFaceUse>();
  const add = (font: BookFontFamily, weight: number, italic: boolean) => {
    const use = { font, weight: nearestBookWeight(font, weight), italic: italic && bookFontHasItalic(font, weight) };
    seen.set(`${use.font}|${use.weight}|${use.italic}`, use);
  };
  for (const el of typeset(doc)) {
    add(el.font, el.weight, el.kind === 'text' && el.italic);
    if (el.kind !== 'text') add(el.font, bookLighterWeight(el.font, el.weight), false);
  }
  if (doc.page.pageNumbers.show) add(doc.page.pageNumbers.font, 500, false);
  return [...seen.values()];
}

/** A weight as the assistant reads it, the CSS name beside the number. */
const WEIGHT_WORDS: Record<BookWeight, string> = {
  100: 'thin',
  200: 'extralight',
  300: 'light',
  400: 'regular',
  500: 'medium',
  600: 'semibold',
  700: 'bold',
  800: 'extrabold',
  900: 'black',
};

export const bookWeightWord = (weight: number): string => WEIGHT_WORDS[weight as BookWeight] ?? String(weight);

/**
 * The catalogue as one line per role, for the font id's description in the
 * tool schemas: an id, its face and the weights it has, an i for a real
 * italic, so a model picks a script for an overlay and never asks Anton for
 * bold.
 */
export function bookFontIndex(): string {
  const span = (ws: readonly number[]) => (ws.length === 1 ? `${ws[0]}` : `${ws[0]}-${ws[ws.length - 1]}`);
  return BOOK_FONT_ROLES.map((role) => {
    const ids = BOOK_FONTS_IDS.filter((id) => bookFontRole(id) === role);
    if (!ids.length) return '';
    const listed = ids.map((id) => {
      const face = BOOK_FONT_FACES[id];
      const italic = face.italics.length ? ' i' : '';
      const caps = 'caps' in face ? ' caps' : '';
      // The face is named only where the id does not already say it, for the size of the tool schemas.
      const named = face.name.toLowerCase().startsWith(id) ? '' : ` ${face.name}`;
      return `${id}${named} ${span(face.weights)}${italic}${caps}`;
    });
    return `${role}: ${listed.join(', ')}.`;
  })
    .filter(Boolean)
    .join(' ');
}
