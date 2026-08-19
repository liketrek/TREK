import type { BookPageSetup, BookSpread } from '@trek/shared'
import { fontStack } from './bookFonts'
import { folioInk } from './folioColour'

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
 * every book ever bound.
 */
export function PageNumbers({
  spread, page, spreadIndex,
}: {
  spread: BookSpread
  page: BookPageSetup
  /** Position in the document, cover included. */
  spreadIndex: number
}) {
  const cfg = page.pageNumbers
  if (!cfg?.show || spread.role !== 'inner') return null

  /*
   * The cover is one sheet with a front and a back, so the first inner spread
   * opens on `startAt` — 2 by default, the page you see when you open a book
   * whose cover is page 1. `spreadIndex` counts the cover, hence the -1.
   */
  const left = cfg.startAt + (spreadIndex - 1) * 2
  const right = left + 1

  const size = cfg.size
  const y = page.pageHeight - cfg.margin

  /** Where the number sits on each page, given which edge it hangs from. */
  const place = (side: 'left' | 'right') => {
    const pageX = side === 'left' ? 0 : page.pageWidth
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
      {([['left', left], ['right', right]] as const).map(([side, number]) => {
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
