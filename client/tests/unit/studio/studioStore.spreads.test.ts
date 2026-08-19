import { describe, it, expect, beforeEach } from 'vitest'
import type { BookDocument, BookElement, BookSpread } from '@trek/shared'
import { useStudioStore } from '../../../src/store/studioStore'

/**
 * Spread management (#1973).
 *
 * The rule everything else follows from: the cover and the back cover are fixed
 * points. A book has exactly one of each, they are single pages, and no amount
 * of dragging in the rail should be able to produce a book with two covers or
 * none. Every operation here refuses on anything that is not an inner spread.
 */

const el = (id: string): BookElement => ({
  id, kind: 'shape', frame: { x: 0, y: 0, w: 10, h: 10 },
  rotation: 0, opacity: 1, locked: false,
  shape: 'rect', fill: '#000000', gradient: 'none',
  stroke: null, strokeWidth: 0, strokeStyle: 'solid', radius: 0,
} as BookElement)

const spread = (id: string, role: BookSpread['role'], elements: BookElement[] = []): BookSpread => ({
  id, role, background: null, elements, parked: [], entryId: null,
})

function book(...spreads: BookSpread[]): BookDocument {
  return {
    version: 1, title: 'T',
    page: { preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 },
    spreads,
  } as BookDocument
}

const store = () => useStudioStore.getState()
const roles = () => store().doc!.spreads.map(s => s.role)
const ids = () => store().doc!.spreads.map(s => s.id)

beforeEach(() => {
  useStudioStore.getState().load(book(
    spread('cover', 'cover'),
    spread('a', 'inner'),
    spread('b', 'inner'),
    spread('c', 'inner'),
    spread('back', 'back'),
  ))
})

describe('canEditSpread', () => {
  it('is true for an inner spread and false for the covers', () => {
    expect(store().canEditSpread(0)).toBe(false)
    expect(store().canEditSpread(1)).toBe(true)
    expect(store().canEditSpread(4)).toBe(false)
  })

  it('is false past either end rather than throwing', () => {
    expect(store().canEditSpread(-1)).toBe(false)
    expect(store().canEditSpread(99)).toBe(false)
  })
})

describe('addSpread', () => {
  it('inserts after the given spread and selects it', () => {
    store().addSpread(1)
    expect(ids()).toEqual(['cover', 'a', expect.any(String), 'b', 'c', 'back'])
    expect(store().activeSpread).toBe(2)
  })

  it('inserts an inner spread, whatever it was asked to follow', () => {
    store().addSpread(0)
    expect(roles()[1]).toBe('inner')
  })

  it('starts the new spread empty', () => {
    store().addSpread(1)
    const made = store().doc!.spreads[2]
    expect(made.elements).toEqual([])
    expect(made.parked).toEqual([])
    expect(made.entryId).toBeNull()
  })

  /*
   * The one that keeps the book a book: a page inserted behind the back cover
   * is a page nobody would ever turn to.
   */
  it('never lands behind the back cover', () => {
    store().addSpread(4)
    expect(roles()[roles().length - 1]).toBe('back')
    expect(roles()).toEqual(['cover', 'inner', 'inner', 'inner', 'inner', 'back'])
  })

  it('gives the new spread an id of its own', () => {
    store().addSpread(1)
    expect(new Set(ids()).size).toBe(ids().length)
  })

  it('is one undo step', () => {
    store().addSpread(1)
    expect(store().doc!.spreads).toHaveLength(6)
    store().undo()
    expect(store().doc!.spreads).toHaveLength(5)
  })
})

describe('duplicateSpread', () => {
  beforeEach(() => {
    useStudioStore.getState().load(book(
      spread('cover', 'cover'),
      spread('a', 'inner', [el('e1'), el('e2')]),
      spread('back', 'back'),
    ))
  })

  it('copies the contents directly after the original', () => {
    store().duplicateSpread(1)
    expect(store().doc!.spreads).toHaveLength(4)
    expect(store().doc!.spreads[2].elements).toHaveLength(2)
    expect(store().activeSpread).toBe(2)
  })

  /*
   * Two elements sharing an id would make selection ambiguous and every lookup
   * that follows it wrong — including delete, which would take both.
   */
  it('gives the copied elements fresh ids', () => {
    store().duplicateSpread(1)
    const [original, copy] = [store().doc!.spreads[1], store().doc!.spreads[2]]
    expect(copy.id).not.toBe(original.id)
    for (const e of copy.elements) {
      expect(original.elements.map(o => o.id)).not.toContain(e.id)
    }
  })

  it('refuses on the cover and on the back cover', () => {
    store().duplicateSpread(0)
    store().duplicateSpread(2)
    expect(store().doc!.spreads).toHaveLength(3)
  })
})

describe('removeSpread', () => {
  it('takes the spread out', () => {
    store().removeSpread(2)
    expect(ids()).toEqual(['cover', 'a', 'c', 'back'])
  })

  it('refuses on the cover and on the back cover', () => {
    store().removeSpread(0)
    store().removeSpread(4)
    expect(store().doc!.spreads).toHaveLength(5)
    expect(roles()).toEqual(['cover', 'inner', 'inner', 'inner', 'back'])
  })

  it('lands on the spread that took its place', () => {
    store().setActiveSpread(2)
    store().removeSpread(2)
    expect(store().activeSpread).toBe(2)
    expect(ids()[2]).toBe('c')
  })

  it('clears the selection, since what was selected is gone', () => {
    store().select(['e1'])
    store().removeSpread(1)
    expect(store().selection).toEqual([])
  })

  it('is undoable', () => {
    store().removeSpread(2)
    store().undo()
    expect(ids()).toEqual(['cover', 'a', 'b', 'c', 'back'])
  })
})

describe('moveSpread', () => {
  it('swaps with the spread before it', () => {
    store().moveSpread(2, -1)
    expect(ids()).toEqual(['cover', 'b', 'a', 'c', 'back'])
    expect(store().activeSpread).toBe(1)
  })

  it('swaps with the spread after it', () => {
    store().moveSpread(1, 1)
    expect(ids()).toEqual(['cover', 'b', 'a', 'c', 'back'])
    expect(store().activeSpread).toBe(2)
  })

  /*
   * Refusing at the ends is what keeps the covers in place without any of the
   * callers having to know about roles.
   */
  it('will not move an inner spread past the cover', () => {
    store().moveSpread(1, -1)
    expect(ids()).toEqual(['cover', 'a', 'b', 'c', 'back'])
  })

  it('will not move an inner spread past the back cover', () => {
    store().moveSpread(3, 1)
    expect(ids()).toEqual(['cover', 'a', 'b', 'c', 'back'])
  })

  it('will not move the covers themselves', () => {
    store().moveSpread(0, 1)
    store().moveSpread(4, -1)
    expect(ids()).toEqual(['cover', 'a', 'b', 'c', 'back'])
  })

  it('is one undo step', () => {
    store().moveSpread(1, 1)
    store().undo()
    expect(ids()).toEqual(['cover', 'a', 'b', 'c', 'back'])
  })
})

describe('a book with no covers at all', () => {
  beforeEach(() => {
    useStudioStore.getState().load(book(spread('a', 'inner'), spread('b', 'inner')))
  })

  it('still adds at the end', () => {
    store().addSpread(1)
    expect(store().doc!.spreads).toHaveLength(3)
    expect(store().activeSpread).toBe(2)
  })

  it('lets the last spread be deleted, leaving an empty book rather than failing', () => {
    store().removeSpread(1)
    store().removeSpread(0)
    expect(store().doc!.spreads).toEqual([])
    expect(store().activeSpread).toBe(0)
  })
})
