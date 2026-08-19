import type { BookDocument, BookSpread } from '@trek/shared'

/**
 * Cutting a book into printable sheets.
 *
 * ── Why a sheet is not a spread ──────────────────────────────────────────
 *
 * The document is made of spreads, because that is the unit a person designs
 * in: a picture crossing the gutter is one decision, not two. A printer takes
 * pages — single leaves, each with its own bleed on all four sides, in reading
 * order. So the export cuts every inner spread down the middle and hands over
 * the halves.
 *
 * The cut is a window, not a re-layout. Each sheet shows the same spread
 * through an opening the size of one page, shifted by a page width for the
 * right-hand leaf, which is why a photograph that crosses the gutter comes out
 * of the press aligned: both halves were positioned by the same numbers.
 *
 * ── Why the spread mode exists anyway ────────────────────────────────────
 *
 * For reading, not for printing. A book PDF that opens two pages at a time is
 * what you send someone to look at, and cutting it into leaves for that would
 * make every photograph across the gutter look broken.
 *
 * ── Millimetres, all of it ───────────────────────────────────────────────
 *
 * Every number here is millimetres, matching the document. The renderer maps mm
 * onto the PDF at a fixed ratio, so these are the sizes the press measures.
 */

/** How far a crop mark reaches out past the bleed. */
export const MARK_LENGTH = 4

/** How thick it is drawn — hairline, the way a mark should be. */
export const MARK_WEIGHT = 0.2

export type SheetMode = 'pages' | 'spreads'

export interface Sheet {
  /** The spread this leaf is cut from. */
  spread: BookSpread
  /** Its index in the document, which is what the folios count from. */
  spreadIndex: number
  /**
   * How far into the spread the window sits, in millimetres.
   *
   * 0 for a left-hand leaf, one page width for a right-hand one. It is a shift
   * of the *view*, never of the contents.
   */
  offset: number
  /** Trim width of this leaf. */
  width: number
  /** Trim height, which never varies. */
  height: number
  /** Width of the whole spread behind the window, for positioning it. */
  spreadWidth: number
  /**
   * Whether this leaf is one page rather than two.
   *
   * Covers are, in both modes. It matters to the print CSS: a document that
   * mixes widths needs a second `@page` rule for the narrow sheets, or they get
   * laid onto the wide page box with white either side.
   */
  single: boolean
  /** A label for the print view — "3", or "2 – 3" for a spread. */
  label: string
}

/** How big one printed sheet is, bleed and crop marks included. */
export interface SheetBox {
  /** Sheet width including bleed and any room for marks. */
  width: number
  height: number
  /** Distance from the sheet edge to the trim edge. */
  margin: number
  /** The bleed itself, which is part of that margin. */
  bleed: number
}

export function sheetBox(
  trimWidth: number,
  trimHeight: number,
  bleed: number,
  marks: boolean,
): SheetBox {
  /*
   * Marks are drawn outside the bleed, not inside it. Putting them in the bleed
   * would mean printing them onto the part of the sheet that gets cut off —
   * they would be trimmed away along with the thing they were marking.
   */
  const margin = marks ? bleed + MARK_LENGTH : bleed
  return {
    width: trimWidth + margin * 2,
    height: trimHeight + margin * 2,
    margin,
    bleed,
  }
}

/**
 * A book, as leaves.
 *
 * Covers stay whole in both modes: a cover is one page, and half a cover is
 * not a thing anybody prints.
 */
export function sheetsFor(doc: BookDocument, mode: SheetMode): Sheet[] {
  const { pageWidth, pageHeight, pageNumbers } = doc.page
  const out: Sheet[] = []

  doc.spreads.forEach((spread, spreadIndex) => {
    const single = spread.role !== 'inner'
    const spreadWidth = single ? pageWidth : pageWidth * 2

    if (single || mode === 'spreads') {
      out.push({
        spread,
        spreadIndex,
        offset: 0,
        width: spreadWidth,
        height: pageHeight,
        spreadWidth,
        single,
        label: single ? '' : folioRange(spreadIndex, pageNumbers.startAt),
      })
      return;
    }

    for (const half of [0, 1]) {
      out.push({
        spread,
        spreadIndex,
        offset: half * pageWidth,
        width: pageWidth,
        height: pageHeight,
        spreadWidth,
        single: true,
        label: String(folio(spreadIndex, pageNumbers.startAt) + half),
      })
    }
  })

  return out
}

/**
 * The number the left-hand page of a spread carries.
 *
 * Mirrors PageNumbers.tsx: the first inner spread opens at `startAt`, and the
 * cover is a separate sheet, which is why the index is offset rather than used
 * raw. It is only ever a label here — nothing is printed from it.
 */
function folio(spreadIndex: number, startAt: number): number {
  return startAt + (spreadIndex - 1) * 2
}

function folioRange(spreadIndex: number, startAt: number): string {
  const left = folio(spreadIndex, startAt)
  return `${left} – ${left + 1}`
}
