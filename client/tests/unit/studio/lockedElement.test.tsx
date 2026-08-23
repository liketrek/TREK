import { describe, it, expect, beforeEach } from 'vitest'
import type { BookDocument, BookElement } from '@trek/shared'
import { bookPageSetupSchema } from '@trek/shared'
import { fireEvent, render } from '../../helpers/render'
import { StudioCanvas } from '../../../src/components/Studio/StudioCanvas'
import { useStudioStore } from '../../../src/store/studioStore'

/**
 * A locked element (#1973).
 *
 * Locking used to switch the element's hit target off entirely, which made it a
 * dead end: it could not be selected, so the inspector never showed it, so the
 * unlock button was unreachable — the only way back was undo. Locked has to
 * mean "cannot be moved", never "cannot be reached".
 */

const shape = (over: Partial<BookElement> = {}): BookElement => ({
  id: 's1', kind: 'shape', frame: { x: 10, y: 10, w: 40, h: 30 },
  rotation: 0, opacity: 1, locked: false,
  shape: 'rect', fill: '#000000', gradient: 'none',
  stroke: null, strokeWidth: 0, strokeStyle: 'solid', radius: 0,
  ...over,
} as BookElement)

const page = bookPageSetupSchema.parse({ preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 })

function load(el: BookElement) {
  useStudioStore.getState().load({
    version: 1, title: 'T', page,
    spreads: [{ id: 'sp1', role: 'inner', background: null, elements: [el], parked: [], entryId: null }],
  } as BookDocument)
}

function draw() {
  const spread = useStudioStore.getState().doc!.spreads[0]
  return render(
    <StudioCanvas
      spread={spread}
      spreadIndex={0}
      page={page}
      zoom={1}
      pxPerMm={96 / 25.4}
      bookView={false}
      dropLabel=""
    />,
  )
}

/** The hit target sits above the sheet, one per element. */
function hitTarget(container: HTMLElement): HTMLElement {
  const sheet = container.querySelector('.st-sheet')!
  return sheet.children[sheet.children.length - 1] as HTMLElement
}

beforeEach(() => {
  useStudioStore.getState().load({
    version: 1, title: 'T', page, spreads: [],
  } as unknown as BookDocument)
})

describe('a locked element', () => {
  it('can still be selected', () => {
    load(shape({ locked: true }))
    const { container } = draw()

    fireEvent.pointerDown(hitTarget(container))

    expect(useStudioStore.getState().selection).toEqual(['s1'])
  })

  /*
   * The whole reason the previous behaviour was a trap: selection is what puts
   * the element in the inspector, and the inspector is where the unlock is.
   */
  it('can therefore be unlocked again', () => {
    load(shape({ locked: true }))
    const { container } = draw()
    fireEvent.pointerDown(hitTarget(container))

    const store = useStudioStore.getState()
    store.commit(d => ({
      ...d,
      spreads: d.spreads.map(sp => ({
        ...sp,
        elements: sp.elements.map(e => (store.selection.includes(e.id) ? { ...e, locked: false } : e)),
      })),
    }))

    expect(useStudioStore.getState().doc!.spreads[0].elements[0].locked).toBe(false)
  })

  it('does not move when dragged', () => {
    load(shape({ locked: true }))
    const { container } = draw()
    const target = hitTarget(container)

    fireEvent.pointerDown(target, { clientX: 100, clientY: 100 })
    fireEvent.pointerMove(container.querySelector('.st-stage')!, { clientX: 300, clientY: 260 })

    expect(useStudioStore.getState().doc!.spreads[0].elements[0].frame).toMatchObject({ x: 10, y: 10 })
  })

  it('offers no resize handles, since a drag on one would be refused', () => {
    load(shape({ locked: true }))
    const { container } = draw()
    fireEvent.pointerDown(hitTarget(container))

    expect(container.querySelectorAll('.st-handle')).toHaveLength(0)
    // But it is selected, and the outline says so.
    expect(container.querySelectorAll('.st-select')).toHaveLength(1)
  })

  /*
   * Delete was the one gesture that ignored the flag: the element was still
   * selectable, so a stray Delete took away exactly what had been pinned down.
   */
  it('is not deleted by the Delete key', () => {
    load(shape({ locked: true }))
    const { container } = draw()
    fireEvent.pointerDown(hitTarget(container))

    fireEvent.keyDown(document, { key: 'Delete' })

    expect(useStudioStore.getState().doc!.spreads[0].elements).toHaveLength(1)
  })

  it('is not deleted by the quick bar either', () => {
    load(shape({ locked: true }))
    const { container, getByTitle } = draw()
    fireEvent.pointerDown(hitTarget(container))
    fireEvent.pointerUp(container.querySelector('.st-stage')!)

    fireEvent.click(getByTitle('Delete'))

    expect(useStudioStore.getState().doc!.spreads[0].elements).toHaveLength(1)
  })

  it('leaves an unlocked element deletable', () => {
    load(shape({ locked: false }))
    const { container } = draw()
    fireEvent.pointerDown(hitTarget(container))

    fireEvent.keyDown(document, { key: 'Delete' })

    expect(useStudioStore.getState().doc!.spreads[0].elements).toHaveLength(0)
  })

  it('leaves an unlocked element movable, with its handles', () => {
    load(shape({ locked: false }))
    const { container } = draw()
    const stage = container.querySelector('.st-stage')!

    fireEvent.pointerDown(hitTarget(container))
    // The handles hide while a gesture is open — chrome that follows your hand
    // around is noise — so the press has to be released before they appear.
    fireEvent.pointerUp(stage)

    expect(useStudioStore.getState().selection).toEqual(['s1'])
    expect(container.querySelectorAll('.st-handle').length).toBeGreaterThan(0)
  })
})
