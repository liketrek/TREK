import type { BookElement, BookPageSetup, BookSpread } from '@trek/shared'
import { elementId } from './bookIds'

/**
 * What was copied, and from where (#2316).
 *
 * The elements as they stood, in the millimetres of the spread they came from.
 * The source spread's id is kept so a paste back onto the same page can step
 * the copy aside rather than drop it exactly over the original.
 */
export interface StudioClipboard {
  fromSpreadId: string
  elements: BookElement[]
}

/** How far a paste onto its own page is stepped aside, the same step Duplicate takes. */
const OFFSET = 4

const spreadWidth = (spread: BookSpread, page: BookPageSetup) =>
  page.pageWidth * (spread.role === 'inner' ? 2 : 1)

/**
 * The clipboard's elements, ready to go onto `target`.
 *
 * Fresh ids every time, because the book is edited by several people at once
 * and two elements sharing an id would merge into one on the next save. An
 * element copied from a double spread onto a single page is pulled back inside
 * it: its place on the right-hand page would otherwise be off the paper.
 */
export function pastedElements(clip: StudioClipboard, target: BookSpread, page: BookPageSetup): BookElement[] {
  const width = spreadWidth(target, page)
  const step = clip.fromSpreadId === target.id ? OFFSET : 0
  return clip.elements.map(el => {
    const w = Math.min(el.frame.w, width)
    const h = Math.min(el.frame.h, page.pageHeight)
    const x = Math.min(Math.max(el.frame.x + step, 0), width - w)
    const y = Math.min(Math.max(el.frame.y + step, 0), page.pageHeight - h)
    return { ...el, id: elementId(el.kind[0]), locked: false, frame: { x, y, w, h } } as BookElement
  })
}
