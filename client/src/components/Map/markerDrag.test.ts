import { describe, it, expect, beforeEach, vi } from 'vitest'
import { makeMarkerDraggable } from './markerDrag'

/**
 * jsdom has no drag implementation, so these drive the events the browser would
 * fire. What is worth pinning is the contract the day plan reads on the other
 * end: a `placeId` in dataTransfer AND on window.__dragData, because dataTransfer
 * is unreadable during dragover.
 */
function dragEvent(type: string) {
  const data = new Map<string, string>()
  const dataTransfer = {
    setData: (k: string, v: string) => { data.set(k, v) },
    getData: (k: string) => data.get(k) ?? '',
    effectAllowed: 'none',
  }
  const e = new Event(type, { bubbles: true }) as Event & { dataTransfer: typeof dataTransfer }
  Object.defineProperty(e, 'dataTransfer', { value: dataTransfer })
  return e
}

describe('makeMarkerDraggable', () => {
  let el: HTMLElement

  beforeEach(() => {
    window.__dragData = null
    el = document.createElement('div')
    document.body.appendChild(el)
  })

  it('FE-MARKERDRAG-001: marks the element as a drag source', () => {
    makeMarkerDraggable(el, 42)
    expect(el.getAttribute('draggable')).toBe('true')
  })

  it('FE-MARKERDRAG-002: hands the place id over both channels', () => {
    makeMarkerDraggable(el, 42)

    const e = dragEvent('dragstart')
    el.dispatchEvent(e)

    expect(e.dataTransfer.getData('placeId')).toBe('42')
    // The second one is what the day plan reads while the pointer hovers over it.
    expect(window.__dragData).toEqual({ placeId: '42' })
    expect(e.dataTransfer.effectAllowed).toBe('copy')
  })

  it('FE-MARKERDRAG-003: clears the hand-off when the drag ends', () => {
    makeMarkerDraggable(el, 42)
    el.dispatchEvent(dragEvent('dragstart'))

    el.dispatchEvent(dragEvent('dragend'))

    expect(window.__dragData).toBeNull()
    expect(el.classList.contains('marker-dragging')).toBe(false)
  })

  it('FE-MARKERDRAG-004: dims the marker it left behind while in flight', () => {
    makeMarkerDraggable(el, 7)
    el.dispatchEvent(dragEvent('dragstart'))
    expect(el.classList.contains('marker-dragging')).toBe(true)
  })

  it('FE-MARKERDRAG-005: stops mousedown from reaching the map, which would pan it away', () => {
    makeMarkerDraggable(el, 7)
    const onMap = vi.fn()
    document.body.addEventListener('mousedown', onMap)

    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))

    expect(onMap).not.toHaveBeenCalled()
    document.body.removeEventListener('mousedown', onMap)
  })

  it('FE-MARKERDRAG-006: the cleanup leaves no listeners and no draggable attribute', () => {
    const cleanup = makeMarkerDraggable(el, 7)
    cleanup()

    el.dispatchEvent(dragEvent('dragstart'))

    expect(el.hasAttribute('draggable')).toBe(false)
    expect(window.__dragData).toBeNull()
  })
})
