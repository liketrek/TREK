/**
 * The book's typefaces.
 *
 * ── Why this file exists ──────────────────────────────────────────────────
 *
 * The font stack used to name Georgia for its serif. Georgia is a system font:
 * it is on most desktops and on no Linux container, so the print renderer would
 * quietly substitute something else and a book proofread in one typeface would
 * print in another. The existing Journey PDF export has the same bug today — it
 * asks for Inter while only Poppins, Geist and MuseoModerno are bundled.
 *
 * So every family here is self-hosted through @fontsource, all of them OFL, and
 * every stack ends in a generic rather than in another named font nobody
 * shipped. What the editor draws is what the renderer has.
 *
 * ── Why these seven ───────────────────────────────────────────────────────
 *
 * A photo book needs more than one voice and fewer than a menu. Two workhorse
 * sans faces, three serifs across the range from bookish to high-contrast, and
 * two display faces for a cover. Anything past that is a font picker rather
 * than a design decision.
 */

export interface BookFont {
  id: BookFontId
  /** What it is called, shown as itself in the picker. */
  name: string
  /** The CSS stack. Ends generic — never in a font that is not bundled. */
  stack: string
  /** Where it belongs, for grouping the picker. */
  kind: 'sans' | 'serif' | 'display'
  /**
   * Weights actually loaded. Asking for 700 on a family that ships one weight
   * gets a synthesised bold, which prints as a smeared version of the regular.
   */
  weights: number[]
}

export type BookFontId =
  | 'sans' | 'serif' | 'display'
  | 'inter' | 'garamond' | 'playfair' | 'bebas'

/**
 * `sans`, `serif` and `display` keep their names because documents already
 * contain them — the three original slots, now pointing at bundled families
 * rather than at whatever the machine happened to have.
 */
export const BOOK_FONTS: Record<BookFontId, BookFont> = {
  sans: {
    id: 'sans',
    name: 'Poppins',
    stack: '"Poppins", system-ui, sans-serif',
    kind: 'sans',
    weights: [400, 500, 600, 700],
  },
  inter: {
    id: 'inter',
    name: 'Inter',
    stack: '"Inter", system-ui, sans-serif',
    kind: 'sans',
    weights: [400, 500, 600, 700],
  },
  serif: {
    id: 'serif',
    name: 'Lora',
    stack: '"Lora", Georgia, serif',
    kind: 'serif',
    weights: [400, 500, 600, 700],
  },
  garamond: {
    id: 'garamond',
    name: 'EB Garamond',
    stack: '"EB Garamond", Georgia, serif',
    kind: 'serif',
    weights: [400, 500, 600, 700],
  },
  playfair: {
    id: 'playfair',
    name: 'Playfair Display',
    stack: '"Playfair Display", Georgia, serif',
    kind: 'serif',
    weights: [400, 500, 600, 700],
  },
  display: {
    id: 'display',
    name: 'MuseoModerno',
    stack: '"MuseoModerno", "Poppins", system-ui, sans-serif',
    kind: 'display',
    weights: [400, 500, 600, 700],
  },
  bebas: {
    id: 'bebas',
    name: 'Bebas Neue',
    stack: '"Bebas Neue", Impact, sans-serif',
    kind: 'display',
    // One weight only. Asking for bold gets a synthesised one, which is why
    // the inspector greys the weights this family does not have.
    weights: [400],
  },
}

// Geist Sans is deliberately absent: it is TREK's own subtext face, part of the
// app's voice rather than the book's, and a book set in the interface font
// reads as a screenshot of the app.

/** The picker's order: workhorses first, display last. */
export const BOOK_FONT_ORDER: BookFontId[] = [
  'sans', 'inter',
  'serif', 'garamond', 'playfair',
  'display', 'bebas',
]

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
export function hasWeight(id: string, weight: number): boolean {
  const font = BOOK_FONTS[id as BookFontId]
  return font ? font.weights.includes(weight) : true
}

/**
 * The nearest weight a family really has.
 *
 * A synthesised bold is a smeared regular in print, so a family with one weight
 * gets that weight rather than a request the renderer has to fake.
 */
export function nearestWeight(id: string, weight: number): number {
  const font = BOOK_FONTS[id as BookFontId]
  if (!font || font.weights.includes(weight)) return weight
  return font.weights.reduce((best, w) =>
    (Math.abs(w - weight) < Math.abs(best - weight) ? w : best), font.weights[0])
}
