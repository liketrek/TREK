import { describe, it, expect } from 'vitest'
import type { BookDocument, BookElement, BookSpread } from '@trek/shared'
import { bookPageSetupSchema } from '@trek/shared'
import { render } from '../../helpers/render'
import { BookSheetsView } from '../../../src/components/Studio/BookSheetsView'

/**
 * The book, laid out for a press (#1973).
 *
 * These assertions are millimetres read back off the DOM, because millimetres
 * are what the renderer maps onto the PDF. A sheet that is two millimetres out
 * looks fine on screen and comes back from the printer with the picture cut in
 * the wrong place.
 */

const page = (over: Record<string, unknown> = {}) =>
  bookPageSetupSchema.parse({ preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, ...over })

const photo = (id: string): BookElement => ({
  id, kind: 'photo', frame: { x: 0, y: 0, w: 420, h: 210 },
  rotation: 0, opacity: 1, locked: false,
  photoId: 7, fit: 'cover', focalX: 0.5, focalY: 0.5,
  radius: 0, filter: 'none', mask: null, frameStyle: 'none',
} as BookElement)

const spread = (role: BookSpread['role'], id: string, elements: BookElement[] = []): BookSpread => ({
  id, role, background: '#ffffff', elements, parked: [], entryId: null,
})

function book(spreads: BookSpread[], over: Record<string, unknown> = {}): BookDocument {
  return { version: 1, title: 'T', page: page(over), spreads } as BookDocument
}

/** The mm number off a style property, so the assertions read as measurements. */
function mm(el: HTMLElement, prop: 'width' | 'height' | 'left' | 'top'): number {
  return parseFloat(el.style[prop])
}

function sheets(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('.bx-sheet'))
}

/** The opening onto the spread — always a sheet's first child. */
const windowOf = (sheet: HTMLElement) => sheet.children[0] as HTMLElement

/** The spread behind it, positioned so the right leaf shows the right half. */
const canvasOf = (sheet: HTMLElement) => windowOf(sheet).children[0] as HTMLElement

describe('sheet geometry', () => {
  it('sizes every sheet to the trim plus bleed when marks are off', () => {
    const { container } = render(
      <BookSheetsView doc={book([spread('cover', 'c')])} mode="pages" marks={false} />,
    )
    const [sheet] = sheets(container)
    expect(mm(sheet, 'width')).toBe(216)
    expect(mm(sheet, 'height')).toBe(216)
  })

  it('grows the sheet to make room for the marks', () => {
    const { container } = render(
      <BookSheetsView doc={book([spread('cover', 'c')])} mode="pages" marks />,
    )
    const [sheet] = sheets(container)
    expect(mm(sheet, 'width')).toBe(224)
  })

  /*
   * Eight hairlines, two per corner. Fewer means a corner without a mark, which
   * is a corner the cutter has to guess at.
   */
  it('draws two marks at each of the four corners', () => {
    const { container } = render(
      <BookSheetsView doc={book([spread('cover', 'c')])} mode="pages" marks />,
    )
    const [sheet] = sheets(container)
    const hairlines = Array.from(sheet.children).filter(
      c => (c as HTMLElement).style.background === 'rgb(0, 0, 0)',
    )
    expect(hairlines).toHaveLength(8)
  })

  it('draws none when they were not asked for', () => {
    const { container } = render(
      <BookSheetsView doc={book([spread('cover', 'c')])} mode="pages" marks={false} />,
    )
    const [sheet] = sheets(container)
    const hairlines = Array.from(sheet.children).filter(
      c => (c as HTMLElement).style.background === 'rgb(0, 0, 0)',
    )
    expect(hairlines).toHaveLength(0)
  })
})

describe('cutting a spread', () => {
  /*
   * The one that decides whether a picture across the gutter survives printing:
   * both leaves must be the same spread seen through openings exactly one page
   * apart. Any other number and the halves do not meet.
   */
  it('shifts the right-hand leaf by exactly one page width', () => {
    const { container } = render(
      <BookSheetsView doc={book([spread('inner', 'a', [photo('p')])])} mode="pages" marks={false} />,
    )
    const [left, right] = sheets(container)

    // bleed - offset: 3 for the left leaf, 3 - 210 for the right.
    expect(mm(canvasOf(left), 'left')).toBe(3)
    expect(mm(canvasOf(right), 'left')).toBe(-207)
    // Both windows hold the whole spread, not half of it.
    expect(mm(canvasOf(left), 'width')).toBe(420)
    expect(mm(canvasOf(right), 'width')).toBe(420)
  })

  it('keeps the whole spread on one sheet in spread mode', () => {
    const { container } = render(
      <BookSheetsView doc={book([spread('inner', 'a')])} mode="spreads" marks={false} />,
    )
    expect(sheets(container)).toHaveLength(1)
    expect(mm(sheets(container)[0], 'width')).toBe(426)
  })

  /*
   * A cover is one page wide and stays that way, even in a document whose other
   * sheets are two. Sizing every sheet to the widest put the cover in the
   * middle of a spread-sized page with white either side, which is not a cover.
   */
  it('keeps a cover at its own size next to spreads', () => {
    const { container } = render(
      <BookSheetsView
        doc={book([spread('cover', 'c'), spread('inner', 'a')])}
        mode="spreads"
        marks={false}
      />,
    )
    const [cover, inner] = sheets(container)
    expect(mm(cover, 'width')).toBe(216)
    expect(mm(inner, 'width')).toBe(426)
    // Nothing is shifted to centre it — the window sits at the margin.
    expect(mm(windowOf(cover), 'left')).toBe(0)
  })

  /* And says so, so the print CSS can give it a page box of its own. */
  it('marks the one-page sheets for the named page rule', () => {
    const { container } = render(
      <BookSheetsView
        doc={book([spread('cover', 'c'), spread('inner', 'a'), spread('back', 'b')])}
        mode="spreads"
        marks={false}
      />,
    )
    expect(sheets(container).map(s => s.classList.contains('is-single'))).toEqual([true, false, true])
  })

  it('marks every sheet single in page mode, where they all are', () => {
    const { container } = render(
      <BookSheetsView
        doc={book([spread('cover', 'c'), spread('inner', 'a')])}
        mode="pages"
        marks={false}
      />,
    )
    expect(sheets(container).every(s => s.classList.contains('is-single'))).toBe(true)
  })
})

describe('the bleed', () => {
  /*
   * The one that shows up as a white hairline along every edge of a finished
   * book. On screen the page stops at the trim and anything past it is clipped;
   * in print the part past the trim is exactly what gets cut away, so clipping
   * it leaves nothing to cut into.
   */
  it('lets the page run past the trim, and clips at the sheet instead', () => {
    const { container } = render(
      <BookSheetsView doc={book([spread('inner', 'a', [photo('p')])])} mode="pages" marks={false} />,
    )
    const [sheet] = sheets(container)
    // The renderer does not clip.
    const paper = canvasOf(sheet).children[0] as HTMLElement
    expect(paper.style.overflow).toBe('visible')
    // The window does, at trim plus a bleed on each side.
    expect(windowOf(sheet).style.overflow).toBe('hidden')
    expect(mm(windowOf(sheet), 'width')).toBe(216)
  })

  /* A coloured page cut with a white edge on three sides is the same defect. */
  it('carries the page colour out into the bleed', () => {
    const coloured = spread('inner', 'a')
    coloured.background = '#123456'
    const { container } = render(
      <BookSheetsView doc={book([coloured])} mode="pages" marks={false} />,
    )
    expect(windowOf(sheets(container)[0]).style.background).toBe('rgb(18, 52, 86)')
  })
})

describe('page breaks', () => {
  it('breaks after every sheet but the last', () => {
    const { container } = render(
      <BookSheetsView
        doc={book([spread('cover', 'c'), spread('inner', 'a'), spread('back', 'b')])}
        mode="spreads"
        marks={false}
      />,
    )
    const breaks = sheets(container).map(s => s.style.breakAfter)
    // A break after the last sheet is the most common defect in a
    // browser-printed PDF: one blank page at the end, every time.
    expect(breaks).toEqual(['page', 'page', 'auto'])
  })
})

describe('what the sheets are made of', () => {
  /* One renderer. A second one for print is a second one to proofread. */
  it('draws the document through the editor renderer, at full image size', () => {
    const { container } = render(
      <BookSheetsView doc={book([spread('inner', 'a', [photo('p')])])} mode="pages" marks={false} />,
    )
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    // `original`, not `thumbnail` — the print is the one place the big file is
    // worth waiting for.
    expect(img!.getAttribute('src')).toContain('/original')
  })
})
