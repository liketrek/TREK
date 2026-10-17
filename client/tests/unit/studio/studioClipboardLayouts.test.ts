import { describe, it, expect, beforeEach } from 'vitest'
import type { BookDocument, BookElement, BookPageSetup, BookSpread } from '@trek/shared'
import {
  MAX_BOOK_LAYOUTS, bookBadgeElementSchema, bookLayoutSchema, bookPageSetupSchema, bookPhotoElementSchema,
  bookShapeElementSchema, bookTextElementSchema,
} from '@trek/shared'
import { pastedElements } from '../../../src/components/Studio/studioClipboard'
import {
  applySavedLayout, layoutFromSpread, layoutPreview, layoutRole, nextLayoutName,
} from '../../../src/components/Studio/savedLayouts'
import { useStudioStore } from '../../../src/store/studioStore'

/**
 * Copying between pages and a book's own layouts (#2316).
 *
 * What matters is what lands in the document: fresh ids on every copy, because
 * the book is edited by several people at once; nothing pasted off the paper;
 * and a layout that keeps the design while the page it is applied to keeps its
 * pictures, its words and its own day and coordinates.
 */

const page: BookPageSetup = bookPageSetupSchema.parse({ preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 })

const text = (id: string, words: string, size = 10, over: Record<string, unknown> = {}): BookElement =>
  bookTextElementSchema.parse({ id, kind: 'text', frame: { x: 20, y: 20, w: 80, h: 20 }, text: words, size, ...over }) as BookElement
const photo = (id: string, photoId: number | null, x = 10): BookElement =>
  bookPhotoElementSchema.parse({ id, kind: 'photo', frame: { x, y: 60, w: 60, h: 60 }, photoId, frameStyle: 'polaroid' }) as BookElement
const shape = (id: string): BookElement =>
  bookShapeElementSchema.parse({ id, kind: 'shape', frame: { x: 0, y: 150, w: 420, h: 60 } }) as BookElement
const badge = (id: string, variant: string, words: string): BookElement =>
  bookBadgeElementSchema.parse({ id, kind: 'badge', variant, frame: { x: 5, y: 5, w: 30, h: 8 }, text: words }) as BookElement

const spread = (id: string, elements: BookElement[], role: BookSpread['role'] = 'inner'): BookSpread =>
  ({ id, role, background: null, elements, parked: [], entryId: null })

function load(doc: Partial<BookDocument>) {
  useStudioStore.getState().load({ version: 1, title: 'T', page, spreads: [], ...doc } as BookDocument)
}

describe('pastedElements', () => {
  it('FE-STUDIO-CLIP-001: every paste gets fresh ids and arrives unlocked where it was', () => {
    const clip = { fromSpreadId: 'a', elements: [{ ...photo('p1', 5), locked: true } as BookElement] }
    const first = pastedElements(clip, spread('b', []), page)
    const second = pastedElements(clip, spread('b', []), page)
    expect(first[0].id).not.toBe('p1')
    expect(first[0].id).not.toBe(second[0].id)
    expect(first[0]).toMatchObject({ locked: false, frame: { x: 10, y: 60, w: 60, h: 60 } })
  })

  it('FE-STUDIO-CLIP-002: back on its own page the copy steps aside, onto a single page it is pulled inside', () => {
    const onRight = { ...photo('p1', 5, 300) } as BookElement
    const same = pastedElements({ fromSpreadId: 'a', elements: [onRight] }, spread('a', []), page)
    expect(same[0].frame).toMatchObject({ x: 304, y: 64 })
    const cover = pastedElements({ fromSpreadId: 'a', elements: [onRight] }, spread('c', [], 'cover'), page)
    expect(cover[0].frame).toMatchObject({ x: 150, w: 60 })
    const wide = pastedElements({ fromSpreadId: 'a', elements: [shape('s1')] }, spread('c', [], 'cover'), page)
    expect(wide[0].frame).toMatchObject({ x: 0, w: 210 })
  })
})

describe('saved layouts', () => {
  it('FE-STUDIO-LAYOUT-001: a kept layout is the design without the pictures, and reads through the contract', () => {
    const layout = layoutFromSpread(spread('a', [photo('p1', 5), text('t1', 'Harbour', 22)]), page, 'Layout 1')
    expect(layout.elements[0]).toMatchObject({ kind: 'photo', photoId: null, frameStyle: 'polaroid' })
    expect(layout).toMatchObject({ role: 'inner', pageWidth: 210, pageHeight: 210, name: 'Layout 1' })
    expect(bookLayoutSchema.safeParse(layout).success).toBe(true)
    expect(layoutRole(spread('c', [], 'cover'))).toBe('single')
  })

  it('FE-STUDIO-LAYOUT-002: names count on past the ones taken', () => {
    const l = (name: string) => ({ ...layoutFromSpread(spread('a', []), page, name) })
    expect(nextLayoutName([], 'Layout')).toBe('Layout 1')
    expect(nextLayoutName([l('Layout 2')], 'Layout')).toBe('Layout 3')
  })

  it('FE-STUDIO-LAYOUT-003: applying keeps the page\'s pictures, words and marks, in the layout\'s design', () => {
    const drawn = spread('a', [
      shape('s1'), photo('p1', 1), photo('p2', 2, 80),
      text('t-title', 'Old title', 24), text('t-body', 'Old story', 10, { binding: { source: 'entry.story' } }),
      text('t-label', 'CHAPTER', 8), badge('b1', 'day', 'DAY 1'),
    ])
    const layout = layoutFromSpread(drawn, page, 'Layout 1')
    const target = spread('b', [
      photo('q1', 11), text('u-title', 'Reykjavík', 22), badge('c1', 'day', 'DAY 2'),
    ])
    const out = applySavedLayout(target, layout, page)
    const kinds = out.elements.map(e => e.kind)
    expect(kinds).toEqual(['shape', 'photo', 'photo', 'text', 'text', 'badge'])
    const photos = out.elements.filter(e => e.kind === 'photo') as Extract<BookElement, { kind: 'photo' }>[]
    expect(photos.map(p => p.photoId)).toEqual([11, null])
    expect(photos[0].frameStyle).toBe('polaroid')
    const texts = out.elements.filter(e => e.kind === 'text') as Extract<BookElement, { kind: 'text' }>[]
    // The title takes the largest box; the bound story box had nothing to take and is left out; the label stays.
    expect(texts.map(t => [t.text, t.size])).toEqual([['Reykjavík', 24], ['CHAPTER', 8]])
    const day = out.elements.find(e => e.kind === 'badge') as Extract<BookElement, { kind: 'badge' }>
    expect(day.text).toBe('DAY 2')
    expect(new Set(out.elements.map(e => e.id)).size).toBe(out.elements.length)
    expect(out.elements.some(e => ['s1', 'p1', 't-title', 'b1'].includes(e.id))).toBe(false)
  })

  it('FE-STUDIO-LAYOUT-004: what the layout has no room for is parked, and a new trim scales the design', () => {
    const layout = { ...layoutFromSpread(spread('a', [photo('p1', 1)]), page, 'L'), pageWidth: 105, pageHeight: 105 }
    const out = applySavedLayout(spread('b', [photo('q1', 11), photo('q2', 12), text('u', 'Words')]), layout, page)
    expect(out.elements[0].frame).toMatchObject({ x: 20, y: 120, w: 120, h: 120 })
    expect(out.parked.map(e => (e.kind === 'photo' ? e.photoId : e.kind))).toEqual([12, 'text'])
  })

  it('FE-STUDIO-LAYOUT-005: the card draws the layout on this book\'s page, as a single page when it is one', () => {
    const layout = { ...layoutFromSpread(spread('c', [photo('p1', 1)], 'cover'), page, 'L'), pageWidth: 105 }
    const preview = layoutPreview(layout, page)
    expect(preview.role).toBe('first')
    expect(preview.elements[0].frame.x).toBe(20)
  })
})

describe('studio store: clipboard and layouts', () => {
  beforeEach(() => useStudioStore.setState({ clipboard: null }))

  it('FE-STUDIO-STORE-CLIP-001: copy on one page, paste on another, as one undo step with the copy selected', () => {
    load({ spreads: [spread('a', [photo('p1', 5), text('t1', 'Keep')]), spread('b', [])] })
    const s = useStudioStore.getState()
    s.copy(0, ['p1'])
    s.paste(1)
    const after = useStudioStore.getState()
    const pasted = after.doc!.spreads[1].elements
    expect(pasted).toHaveLength(1)
    expect(pasted[0]).toMatchObject({ kind: 'photo', photoId: 5 })
    expect(after.selection).toEqual([pasted[0].id])
    after.undo()
    expect(useStudioStore.getState().doc!.spreads[1].elements).toHaveLength(0)
  })

  it('FE-STUDIO-STORE-CLIP-002: nothing copied, nothing pasted; an unknown id copies nothing', () => {
    load({ spreads: [spread('a', [photo('p1', 5)])] })
    const s = useStudioStore.getState()
    s.paste(0)
    s.copy(0, ['missing'])
    expect(useStudioStore.getState().clipboard).toBeNull()
    expect(useStudioStore.getState().doc!.spreads[0].elements).toHaveLength(1)
  })

  it('FE-STUDIO-STORE-LAYOUT-001: save, apply to another page, delete', () => {
    load({ spreads: [spread('a', [photo('p1', 1), text('t1', 'Title', 24)]), spread('b', [photo('q1', 9)])] })
    expect(useStudioStore.getState().saveLayout(0, 'Layout 1')).toBe(true)
    const layout = useStudioStore.getState().doc!.layouts![0]
    useStudioStore.getState().applyLayout(1, layout.id)
    const applied = useStudioStore.getState().doc!.spreads[1].elements
    expect(applied.map(e => e.kind)).toEqual(['photo', 'text'])
    expect(applied[0]).toMatchObject({ photoId: 9 })
    useStudioStore.getState().removeLayout(layout.id)
    expect(useStudioStore.getState().doc!.layouts).toEqual([])
  })

  it('FE-STUDIO-STORE-LAYOUT-002: an empty page is not a layout, and a full book says no', () => {
    const full = Array.from({ length: MAX_BOOK_LAYOUTS }, (_, i) => layoutFromSpread(spread('x', []), page, `L${i}`))
    load({ spreads: [spread('a', []), spread('b', [photo('p', 1)])], layouts: full })
    expect(useStudioStore.getState().saveLayout(0, 'Empty')).toBe(false)
    expect(useStudioStore.getState().saveLayout(1, 'One too many')).toBe(false)
    expect(useStudioStore.getState().doc!.layouts).toHaveLength(MAX_BOOK_LAYOUTS)
  })
})
