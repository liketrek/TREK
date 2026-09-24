import { describe, it, expect, beforeEach, vi } from 'vitest'
import { makeMarkerDraggable, makePoiDraggable, draggedPoiId } from './markerDrag'

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

describe('makePoiDraggable', () => {
  afterEach(() => {
    window.__dragData = null
    document.body.classList.remove('dragging-poi')
  })

  const dragEvent = (type: string) => {
    const e = new Event(type, { bubbles: true, cancelable: true }) as DragEvent & { dataTransfer: DataTransfer }
    const store: Record<string, string> = {}
    Object.defineProperty(e, 'dataTransfer', {
      value: {
        setData: (k: string, v: string) => { store[k] = v },
        getData: (k: string) => store[k] ?? '',
        effectAllowed: '',
        dropEffect: '',
      },
    })
    return e
  }

  it('FE-MAP-POIDRAG-001: a hit carries its OSM id, not a place id — it is not a place yet', () => {
    const el = document.createElement('div')
    makePoiDraggable(el, 'node:9')
    expect(el.getAttribute('draggable')).toBe('true')

    const e = dragEvent('dragstart')
    el.dispatchEvent(e)

    expect(e.dataTransfer.getData('poiOsmId')).toBe('node:9')
    // Mirrored on window because dataTransfer is unreadable during dragover, and the
    // map has to know what is coming while it is still being hovered.
    expect(window.__dragData).toEqual({ poiOsmId: 'node:9' })
  })

  it('FE-MAP-POIDRAG-002: the drag marks the body, so the route can light up while it lasts', () => {
    const el = document.createElement('div')
    makePoiDraggable(el, 'node:9')

    el.dispatchEvent(dragEvent('dragstart'))
    expect(document.body.classList.contains('dragging-poi')).toBe(true)

    el.dispatchEvent(dragEvent('dragend'))
    expect(document.body.classList.contains('dragging-poi')).toBe(false)
    expect(window.__dragData).toBeNull()
  })

  it('FE-MAP-POIDRAG-003: mousedown is swallowed, or the map pans out from under the drag', () => {
    const el = document.createElement('div')
    makePoiDraggable(el, 'node:9')
    const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    const seen = vi.fn()
    document.body.appendChild(el)
    document.body.addEventListener('mousedown', seen)

    el.dispatchEvent(down)

    expect(seen).not.toHaveBeenCalled()
    document.body.removeEventListener('mousedown', seen)
    el.remove()
  })

  it('FE-MAP-POIDRAG-004: unwiring leaves the element as it was found', () => {
    const el = document.createElement('div')
    const off = makePoiDraggable(el, 'node:9')
    off()

    expect(el.hasAttribute('draggable')).toBe(false)
    el.dispatchEvent(dragEvent('dragstart'))
    expect(window.__dragData).toBeNull()
  })

  it('FE-MAP-POIDRAG-005: the id is readable from the event, and from the mirror during a hover', () => {
    const el = document.createElement('div')
    makePoiDraggable(el, 'node:9')
    const start = dragEvent('dragstart')
    el.dispatchEvent(start)

    expect(draggedPoiId(start)).toBe('node:9')

    // A dragover event carries an unreadable dataTransfer; the mirror answers instead.
    const over = new Event('dragover') as DragEvent
    expect(draggedPoiId(over)).toBe('node:9')
  })

  it('FE-MAP-POIDRAG-006: an unrelated drag is not mistaken for a hit', () => {
    const over = new Event('dragover') as DragEvent
    expect(draggedPoiId(over)).toBeNull()
  })
})
