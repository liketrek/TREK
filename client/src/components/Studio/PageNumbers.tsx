import type { BookPageSetup, BookSpread } from '@trek/shared'
import { fontStack } from './bookFonts'
import { folioInk } from './folioColour'
import { isNumbered } from './bookSheets'

/**
 * The folios.
 *
 * Drawn by the renderer rather than stored as elements, because the number a
 * page carries is a function of where the spread sits in the book — and an
 * element holding "14" would say 14 after the spread was moved, duplicated or
 * deleted. Nothing else in the document has that property, which is why this is
 * the one thing on the page that is not an element.
 *
 * That also settles where it belongs: inside `SpreadView`, so the editor and
 * the print renderer produce the same number. Stamping them with pdf-lib
 * afterwards would mean proofreading a book on screen whose page numbers are
 * not the ones that get printed.
 *
 * The cover and the back cover carry none. A folio on a cover is a mistake in
 * every book ever bound. The single first and last pages carry one each, on
 * the side of the book they are bound on (#2317).
 */
export function PageNumbers({
  spread, page, folios,
}: {
  spread: BookSpread
  page: BookPageSetup
  /**
   * The numbers this spread carries, from foliosOf: two for a spread, one for
   * a first or last page, none for a cover. Counted by the caller, which has
   * the whole book — a spread on its own does not know how many pages sit
   * before it.
   */
  folios: readonly number[]
}) {
  const cfg = page.pageNumbers
  if (!cfg?.show || !isNumbered(spread.role) || folios.length === 0) return null

  /*
   * Which page of the sheet each number sits on. A spread numbers both; the
   * first page is a right-hand leaf and the last a left-hand one, and each
   * carries its one number on the side it actually is.
   */
  const sides: Array<['left' | 'right', number]> = spread.role === 'inner'
    ? [['left', folios[0]], ['right', folios[1]]]
    : [[spread.role === 'first' ? 'right' : 'left', folios[0]]]

  const size = cfg.size
  const y = page.pageHeight - cfg.margin

  /**
   * Where the number sits on each page, given which edge it hangs from.
   *
   * A single page is one page wide, so its number sits at x 0 whichever
   * side of the book it is bound on; the side only decides which edge is
   * the outer one.
   */
  const place = (side: 'left' | 'right') => {
    const pageX = side === 'left' || spread.role !== 'inner' ? 0 : page.pageWidth
    if (cfg.position === 'centre') {
      return { x: pageX, w: page.pageWidth, align: 'center' as const }
    }
    // Outer is the cut edge, inner is the gutter — the distinction only exists
    // on a spread, and getting it backwards puts both numbers in the fold.
    const outward = cfg.position === 'outer'
    const atLeftEdge = side === 'left' ? outward : !outward
    return atLeftEdge
      ? { x: pageX + cfg.margin, w: page.pageWidth * 0.4, align: 'left' as const }
      : { x: pageX + page.pageWidth * 0.6 - cfg.margin, w: page.pageWidth * 0.4, align: 'right' as const }
  }

  return (
    <>
      {sides.map(([side, number]) => {
        const at = place(side)
        /*
         * Sampled at the middle of the number's own box, which is where the
         * digits actually are — the box is 40% of the page wide so that the
         * text can align inside it, and its left edge is often over something
         * else entirely.
         */
        const ink = cfg.autoColor
          ? folioInk(spread, at.x + at.w / 2, y - size * 0.18)
          : { color: cfg.color, shadow: undefined }
        return (
          <div
            key={side}
            style={{
              position: 'absolute',
              left: `${at.x}mm`,
              top: `${y}mm`,
              width: `${at.w}mm`,
              textAlign: at.align,
              fontFamily: fontStack(cfg.font),
              fontSize: `${size}pt`,
              fontWeight: 500,
              letterSpacing: '0.08em',
              lineHeight: 1,
              color: ink.color,
              textShadow: ink.shadow,
              fontVariantNumeric: 'tabular-nums',
              pointerEvents: 'none',
            }}
          >
            {number}
          </div>
        )
      })}
    </>
  )
}
