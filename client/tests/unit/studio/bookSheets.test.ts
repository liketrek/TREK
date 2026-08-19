import { describe, it, expect } from 'vitest'
import type { BookDocument, BookSpread } from '@trek/shared'
import { bookPageSetupSchema } from '@trek/shared'
import { MARK_LENGTH, sheetBox, sheetsFor } from '../../../src/components/Studio/bookSheets'

/**
 * Cutting a book into sheets (#1973).
 *
 * The arithmetic here is what a press measures, so the tests are about
 * millimetres: where the trim edge lands on the sheet, how far the marks reach,
 * and which half of a spread each leaf shows. Getting the offset wrong is not a
 * visible bug on screen — it is a photograph that arrives cut in the wrong
 * place, in a book someone paid to have printed.
 */

const page = (over: Record<string, unknown> = {}) =>
  bookPageSetupSchema.parse({ preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, ...over })

const spread = (role: BookSpread['role'], id: string): BookSpread => ({
  id, role, background: null, elements: [], parked: [], entryId: null,
})

function book(roles: BookSpread['role'][], pageOver: Record<string, unknown> = {}): BookDocument {
  return {
    version: 1,
    title: 'T',
    page: page(pageOver),
    spreads: roles.map((r, i) => spread(r, `s${i}`)),
  } as BookDocument
}

describe('the sheet box', () => {
  it('is the trim plus a bleed on each side when there are no marks', () => {
    const box = sheetBox(210, 297, 3, false)
    expect(box.width).toBe(216)
    expect(box.height).toBe(303)
    expect(box.margin).toBe(3)
  })

  /*
   * Marks go outside the bleed, not inside it. Inside means printing them onto
   * the strip that gets cut off — they would be trimmed away along with the
   * thing they were marking.
   */
  it('makes room outside the bleed for the marks', () => {
    const box = sheetBox(210, 210, 3, true)
    expect(box.margin).toBe(3 + MARK_LENGTH)
    expect(box.width).toBe(210 + (3 + MARK_LENGTH) * 2)
    // The bleed is still the bleed — the extra room is not more of it.
    expect(box.bleed).toBe(3)
  })

  it('is the trim itself when the book has no bleed at all', () => {
    const box = sheetBox(210, 210, 0, false)
    expect(box.width).toBe(210)
    expect(box.margin).toBe(0)
  })
})

describe('single pages', () => {
  it('cuts every inner spread into two leaves and leaves the covers whole', () => {
    const sheets = sheetsFor(book(['cover', 'inner', 'inner', 'back']), 'pages')
    expect(sheets).toHaveLength(1 + 2 + 2 + 1)
    expect(sheets.map(s => s.width)).toEqual([210, 210, 210, 210, 210, 210])
  })

  /*
   * The cut is a window onto the spread, never a re-layout: the right-hand leaf
   * is the same spread shifted by one page width. That is what makes a
   * photograph crossing the gutter line up again once both halves are printed.
   */
  it('shows the right-hand leaf through a window one page further in', () => {
    const sheets = sheetsFor(book(['cover', 'inner']), 'pages')
    const [, left, right] = sheets
    expect(left.offset).toBe(0)
    expect(right.offset).toBe(210)
    // Both halves are the same spread, so nothing was moved to make them fit.
    expect(right.spread).toBe(left.spread)
    expect(right.spreadWidth).toBe(420)
  })

  it('keeps a cover at one page wide, with nothing shifted', () => {
    const [cover] = sheetsFor(book(['cover', 'inner']), 'pages')
    expect(cover.width).toBe(210)
    expect(cover.spreadWidth).toBe(210)
    expect(cover.offset).toBe(0)
  })

  /* Labels are for the print view. Covers carry no folio, in any book. */
  it('numbers the leaves the way the folios do, and leaves covers unlabelled', () => {
    const sheets = sheetsFor(book(['cover', 'inner', 'inner']), 'pages')
    expect(sheets.map(s => s.label)).toEqual(['', '2', '3', '4', '5'])
  })

  it('follows startAt when the book counts from somewhere else', () => {
    const sheets = sheetsFor(book(['cover', 'inner'], { pageNumbers: { startAt: 1 } }), 'pages')
    expect(sheets.map(s => s.label)).toEqual(['', '1', '2'])
  })
})

describe('spreads', () => {
  it('keeps each spread on one sheet', () => {
    const sheets = sheetsFor(book(['cover', 'inner', 'inner', 'back']), 'spreads')
    expect(sheets).toHaveLength(4)
    expect(sheets.map(s => s.width)).toEqual([210, 420, 420, 210])
    expect(sheets.every(s => s.offset === 0)).toBe(true)
  })

  it('labels an inner sheet with the pair of numbers it carries', () => {
    const sheets = sheetsFor(book(['cover', 'inner', 'inner']), 'spreads')
    expect(sheets.map(s => s.label)).toEqual(['', '2 – 3', '4 – 5'])
  })
})

describe('an empty book', () => {
  it('produces no sheets rather than one blank one', () => {
    expect(sheetsFor(book([]), 'pages')).toEqual([])
  })
})
