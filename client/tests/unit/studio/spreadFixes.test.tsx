import { describe, it, expect, beforeEach } from 'vitest'
import type { BookDocument, BookElement, BookSpread } from '@trek/shared'
import { bookPageSetupSchema } from '@trek/shared'
import { render } from '../../helpers/render'
import { useStudioStore } from '../../../src/store/studioStore'
import { SpreadView } from '../../../src/components/Studio/SpreadView'
import { snapTargets } from '../../../src/components/Studio/useSpreadInteraction'

/**
 * Three fixes to the editor (#1973).
 *
 * An empty frame that did not wear the frame it will wear, a page added in
 * front of the cover with no way back, and a snap that only caught the fold.
 */

const page = bookPageSetupSchema.parse({ preset: 'square-210', pageWidth: 210, pageHeight: 210, safe: 8 })

const frame = (over: Partial<BookElement> = {}): BookElement => ({
  id: 'f1', kind: 'photo', frame: { x: 20, y: 20, w: 120, h: 90 },
  rotation: 0, opacity: 1, locked: false,
  photoId: null, fit: 'cover', focalX: 0.5, focalY: 0.5,
  radius: 0, filter: 'none', mask: null, frameStyle: 'none',
  ...over,
} as BookElement)

const spread = (elements: BookElement[], role: BookSpread['role'] = 'inner'): BookSpread => ({
  id: 's1', role, background: '#ffffff', elements, parked: [], entryId: null,
})

const doc = (spreads: BookSpread[]): BookDocument =>
  ({ version: 1, title: 'T', page, spreads } as BookDocument)

describe('an empty frame', () => {
  /*
   * It used to render on its own, ignoring frameStyle: a Polaroid placeholder
   * was a plain dashed rectangle until a photograph landed in it and the chin
   * appeared from nowhere.
   */
  it('wears the frame it will wear once it is filled', () => {
    const { container } = render(
      <SpreadView spread={spread([frame({ frameStyle: 'polaroid' })])} page={page} spreadIndex={1} />,
    )
    const outer = container.querySelector<HTMLElement>('[style*="left: 20mm"]')!
    // A Polaroid's white card and the shadow of a print lying on a page.
    expect(outer.style.background).toContain('rgb(255, 255, 255)')
    expect(outer.style.boxShadow).toBeTruthy()
  })

  it('shows a film frame as film, black card and all', () => {
    const { container } = render(
      <SpreadView spread={spread([frame({ frameStyle: 'film' })])} page={page} spreadIndex={1} />,
    )
    const outer = container.querySelector<HTMLElement>('[style*="left: 20mm"]')!
    expect(outer.style.background).toContain('rgb(20, 20, 20)')
  })

  it('leaves a plain frame plain', () => {
    const { container } = render(
      <SpreadView spread={spread([frame()])} page={page} spreadIndex={1} />,
    )
    const outer = container.querySelector<HTMLElement>('[style*="left: 20mm"]')!
    expect(outer.style.boxShadow).toBe('')
  })

  /* In the bound book an unfilled frame is nothing at all. */
  it('prints as nothing', () => {
    const { container } = render(
      <SpreadView spread={spread([frame({ frameStyle: 'polaroid' })])} page={page} spreadIndex={1} print />,
    )
    expect(container.querySelector('[style*="left: 20mm"]')).toBeNull()
  })
})

describe('what an edge snaps to', () => {
  /*
   * The renderer draws the safe area per page, so a spread shows a dashed rule
   * inset from each of its four vertical edges — including the two either side
   * of the fold. Only the outer pair was a target, so dragging inwards caught
   * the gutter and nothing else: the line you could see right before it was not
   * something the pointer knew about.
   */
  it('includes the safe lines either side of the fold', () => {
    const { xs } = snapTargets(spread([]), page, new Set())
    expect(xs).toContain(210)        // the fold
    expect(xs).toContain(202)        // 210 - safe, the left page's inner rule
    expect(xs).toContain(218)        // 210 + safe, the right page's
  })

  it('keeps the outer ones it always had', () => {
    const { xs, ys } = snapTargets(spread([]), page, new Set())
    expect(xs).toContain(8)          // safe
    expect(xs).toContain(412)        // 420 - safe
    expect(ys).toContain(8)
    expect(ys).toContain(202)        // 210 - safe
  })

  /* A cover is one page and has no fold to snap to. */
  it('has no fold on a single page', () => {
    const { xs } = snapTargets(spread([], 'cover'), page, new Set())
    expect(xs).not.toContain(218)
  })

  /*
   * On a spread the halfway mark is the fold, not the middle of anything you
   * are composing on: a picture centred on its own page had no line to find.
   */
  it('includes the centre of each page, which is not the fold', () => {
    const { xs } = snapTargets(spread([]), page, new Set())
    expect(xs).toContain(105)        // middle of the left page
    expect(xs).toContain(315)        // middle of the right
  })

  it('includes the quarters, where a two-column split lands', () => {
    const { xs, ys } = snapTargets(spread([]), page, new Set())
    expect(xs).toContain(52.5)
    expect(xs).toContain(157.5)
    expect(ys).toContain(52.5)
    expect(ys).toContain(157.5)
  })

  it('centres a single page on itself', () => {
    const { xs } = snapTargets(spread([], 'cover'), page, new Set())
    expect(xs).toContain(105)
    expect(xs).not.toContain(315)
  })

  it('snaps to the other elements on the page too', () => {
    const { xs } = snapTargets(spread([frame({ id: 'other' })]), page, new Set())
    expect(xs).toContain(20)         // its left edge
    expect(xs).toContain(140)        // and its right
  })

  it('ignores the element being dragged, so it cannot snap to itself', () => {
    const { xs } = snapTargets(spread([frame({ id: 'me' })]), page, new Set(['me']))
    expect(xs).not.toContain(140)
  })
})

describe('adding a page', () => {
  beforeEach(() => {
    useStudioStore.getState().load(doc([spread([], 'cover'), spread([], 'back')]))
  })

  /*
   * The bug: an empty book reports its last inner spread as -1, which asked for
   * a page at index 0 — in front of the cover, where it could not be moved back
   * from either, because a move only ever swaps with another inner spread.
   */
  it('lands after the cover even when the book has no inner pages yet', () => {
    useStudioStore.getState().addSpread(-1)
    const roles = useStudioStore.getState().doc!.spreads.map(s => s.role)
    expect(roles).toEqual(['cover', 'inner', 'back'])
  })

  it('still lands after the page it was asked for', () => {
    useStudioStore.getState().addSpread(-1)
    useStudioStore.getState().addSpread(1)
    expect(useStudioStore.getState().doc!.spreads.map(s => s.role))
      .toEqual(['cover', 'inner', 'inner', 'back'])
  })

  it('never lands behind the back cover', () => {
    useStudioStore.getState().addSpread(99)
    const roles = useStudioStore.getState().doc!.spreads.map(s => s.role)
    expect(roles[roles.length - 1]).toBe('back')
  })

  it('selects the page it just made', () => {
    useStudioStore.getState().addSpread(-1)
    expect(useStudioStore.getState().activeSpread).toBe(1)
  })
})
