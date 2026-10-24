import {
  BOOK_FONT_CATEGORIES, BOOK_FONT_FACES, BOOK_FONTS_IDS, bookFontHasItalic, bookFontHasWeight, bookLighterWeight,
  nearestBookWeight,
  type BookFontCategory, type BookFontFace, type BookFontFamily,
} from '@trek/shared'

/**
 * The book's typefaces, as the Studio draws them.
 *
 * ── Why this file exists ──────────────────────────────────────────────────
 *
 * The font stack used to name Georgia for its serif. Georgia is a system font:
 * it is on most desktops and on no Linux container, so the print renderer would
 * quietly substitute something else and a book proofread in one typeface would
 * print in another.
 *
 * So every family is self-hosted through @fontsource, OFL or Apache 2.0, and
 * every stack ends in a generic rather than in another named font nobody
 * shipped. What the editor draws is what the renderer has.
 *
 * The catalogue itself (names, stacks, weights, italics, roles) lives in
 * @trek/shared (book-fonts.data.ts), because the findings, the design engine
 * and the assistant read the same families. This file only gives the Studio
 * its view of it; the faces are loaded next door in bookFontFaces.ts.
 */

export type BookFontId = BookFontFamily

export interface BookFont extends BookFontFace {
  id: BookFontId
}

export const BOOK_FONTS = Object.fromEntries(
  BOOK_FONTS_IDS.map(id => [id, { id, ...BOOK_FONT_FACES[id] }]),
) as unknown as Record<BookFontId, BookFont>

// Geist Sans is deliberately absent: it is TREK's own subtext face, part of the
// app's voice rather than the book's, and a book set in the interface font
// reads as a screenshot of the app.

/** The picker's order: by category (sans first, mono last), the catalogue's order within one. */
export const BOOK_FONT_ORDER: BookFontId[] = BOOK_FONT_CATEGORIES.flatMap(category =>
  BOOK_FONTS_IDS.filter(id => BOOK_FONT_FACES[id].category === category))

/** The families of one picker group, in picker order. */
export function fontsIn(category: BookFontCategory): BookFontId[] {
  return BOOK_FONT_ORDER.filter(id => BOOK_FONTS[id].category === category)
}

/**
 * The CSS stack for a font id.
 *
 * Falls back to Poppins rather than to a generic, so a document naming a family
 * that was removed still renders in something the renderer has instead of in
 * whatever the machine defaults to.
 */
export function fontStack(id: string): string {
  return BOOK_FONTS[id as BookFontId]?.stack ?? BOOK_FONTS.sans.stack
}

/** Whether a family actually ships the weight being asked for. */
export const hasWeight = bookFontHasWeight

/** Whether a family has a real italic at that weight, rather than the browser's slant. */
export const hasItalic = bookFontHasItalic

/**
 * The nearest weight a family really has.
 *
 * A synthesised bold is a smeared regular in print, so a family with one weight
 * gets that weight rather than a request the renderer has to fake. The
 * renderer draws every element through this as well, so a book whose weight
 * was set before its family changed still prints in a face that exists.
 */
export const nearestWeight = nearestBookWeight

/** The lighter weight a travel element sets beside its figures, one the family has. */
export const lighterWeight = bookLighterWeight
