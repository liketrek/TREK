import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { fireEvent } from '@testing-library/react'
import { installTouchDragBridge } from './touchDragBridge'

/** Longer than the bridge's long press, short enough to stay readable. */
const PRESS = 400

type Point = { clientX: number; clientY: number; identifier?: number }

function touchStart(el: Element, points: Point[]) {
  fireEvent.touchStart(el, { touches: points.map(p => ({ identifier: 1, ...p })) })
}
function touchMove(points: Point[]) {
  return fireEvent.touchMove(document, { touches: points.map(p => ({ identifier: 1, ...p })) })
}
function touchEnd(type: 'touchend' | 'touchcancel' = 'touchend', remaining: Point[] = []) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'touches', { value: remaining.map(p => ({ identifier: 1, ...p })) })
  document.dispatchEvent(event)
}

describe('touchDragBridge (#1616)', () => {
  let teardown: () => void
  let source: HTMLElement
  let dropZone: HTMLElement
  let outside: HTMLElement
  let seen: string[]

  /** Records every drag event that reaches the document. */
  const record = (e: Event) => { seen.push(`${e.type}@${(e.target as HTMLElement).id}`) }

  beforeEach(() => {
    vi.useFakeTimers()
    document.body.innerHTML = `
      <div data-touch-drag id="places"><div id="source" draggable="true">Place</div></div>
      <div data-touch-drag id="plan"><div id="zone">Day 1</div><div id="zone2">Day 2</div></div>
      <div id="loose" draggable="true">Outside any pane</div>
    `
    source = document.getElementById('source')!
    dropZone = document.getElementById('zone')!
    outside = document.getElementById('loose')!
    seen = []
    for (const type of ['dragstart', 'dragenter', 'dragover', 'dragleave', 'drop', 'dragend']) {
      document.addEventListener(type, record)
    }
    // jsdom has no layout, so the element under the finger has to be declared.
    document.elementFromPoint = () => dropZone
    teardown = installTouchDragBridge()
  })

  afterEach(() => {
    teardown()
    for (const type of ['dragstart', 'dragenter', 'dragover', 'dragleave', 'drop', 'dragend']) {
      document.removeEventListener(type, record)
    }
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  /** Presses on the source long enough for the bridge to claim the gesture. */
  function longPress(el: Element = source) {
    touchStart(el, [{ clientX: 10, clientY: 10 }])
    vi.advanceTimersByTime(PRESS)
  }

  it('FE-TOUCHDRAG-001: a swipe before the press lands scrolls instead of dragging', () => {
    touchStart(source, [{ clientX: 10, clientY: 10 }])
    const notPrevented = touchMove([{ clientX: 10, clientY: 60 }])
    vi.advanceTimersByTime(PRESS)
    expect(seen).toEqual([])
    // Not calling preventDefault is what leaves the scroll to the browser (#1432).
    expect(notPrevented).toBe(true)
  })

  it('FE-TOUCHDRAG-002: a long press starts the drag and tracks the element under the finger', () => {
    longPress()
    expect(seen).toContain('dragstart@source')
    touchMove([{ clientX: 200, clientY: 200 }])
    expect(seen).toContain('dragenter@zone')
    expect(seen).toContain('dragover@zone')
  })

  it('FE-TOUCHDRAG-003: once armed the move is consumed so the pane does not scroll', () => {
    longPress()
    expect(touchMove([{ clientX: 200, clientY: 200 }])).toBe(false)
  })

  it('FE-TOUCHDRAG-004: releasing over a zone that accepted the drag drops on it', () => {
    dropZone.addEventListener('dragover', e => e.preventDefault())
    longPress()
    touchMove([{ clientX: 200, clientY: 200 }])
    touchEnd()
    expect(seen).toContain('drop@zone')
    expect(seen).toContain('dragend@source')
  })

  it('FE-TOUCHDRAG-005: a zone that never accepts the drag gets no drop', () => {
    longPress()
    touchMove([{ clientX: 200, clientY: 200 }])
    touchEnd()
    expect(seen).not.toContain('drop@zone')
    expect(seen).toContain('dragleave@zone')
    expect(seen).toContain('dragend@source')
  })

  it('FE-TOUCHDRAG-006: leaving a zone for another one hands over enter and leave', () => {
    const other = document.getElementById('zone2')!
    longPress()
    touchMove([{ clientX: 200, clientY: 200 }])
    document.elementFromPoint = () => other
    touchMove([{ clientX: 200, clientY: 260 }])
    expect(seen).toContain('dragleave@zone')
    expect(seen).toContain('dragenter@zone2')
  })

  it('FE-TOUCHDRAG-007: touchcancel ends the drag without dropping', () => {
    dropZone.addEventListener('dragover', e => e.preventDefault())
    longPress()
    touchMove([{ clientX: 200, clientY: 200 }])
    touchEnd('touchcancel')
    expect(seen).not.toContain('drop@zone')
    expect(seen).toContain('dragend@source')
  })

  it('FE-TOUCHDRAG-008: a row outside an opted-in pane is left alone', () => {
    longPress(outside)
    expect(seen).toEqual([])
  })

  it('FE-TOUCHDRAG-009: a browser-driven drag stands the bridge down (iPadOS)', () => {
    touchStart(source, [{ clientX: 10, clientY: 10 }])
    fireEvent.dragStart(source)
    seen = []
    vi.advanceTimersByTime(PRESS)
    // Silent: the browser's own sequence is the only one the handlers should see.
    expect(seen).toEqual([])
    touchEnd()
    expect(seen).toEqual([])
  })

  it('FE-TOUCHDRAG-010: a second finger cancels the pending press', () => {
    touchStart(source, [{ clientX: 10, clientY: 10 }])
    touchStart(source, [{ clientX: 10, clientY: 10 }, { clientX: 90, clientY: 90, identifier: 2 }])
    vi.advanceTimersByTime(PRESS)
    expect(seen).toEqual([])
  })

  it('FE-TOUCHDRAG-011: the long-press context menu is suppressed while a drag is pending', () => {
    touchStart(source, [{ clientX: 10, clientY: 10 }])
    expect(fireEvent.contextMenu(source)).toBe(false)
  })

  it('FE-TOUCHDRAG-012: the context menu is left alone when no drag is pending', () => {
    expect(fireEvent.contextMenu(source)).toBe(true)
  })

  it('FE-TOUCHDRAG-013: a source that vetoes its own dragstart gets the gesture back', () => {
    source.addEventListener('dragstart', e => e.preventDefault())
    longPress()
    expect(seen).toContain('dragend@source')
    // The veto ends the session, so the next move is the browser's again.
    expect(touchMove([{ clientX: 200, clientY: 200 }])).toBe(true)
  })

  it('FE-TOUCHDRAG-014: the click that follows a drag is swallowed', () => {
    const onClick = vi.fn()
    source.addEventListener('click', onClick)
    longPress()
    touchEnd()
    fireEvent.click(source)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('FE-TOUCHDRAG-015: a drag carries data between the source and the drop zone', () => {
    let carried = ''
    source.addEventListener('dragstart', e => (e as DragEvent).dataTransfer?.setData('placeId', '42'))
    dropZone.addEventListener('dragover', e => e.preventDefault())
    dropZone.addEventListener('drop', e => { carried = (e as DragEvent).dataTransfer?.getData('placeId') ?? '' })
    longPress()
    touchMove([{ clientX: 200, clientY: 200 }])
    touchEnd()
    expect(carried).toBe('42')
  })

  it('FE-TOUCHDRAG-016: teardown stops watching for new gestures', () => {
    teardown()
    longPress()
    expect(seen).toEqual([])
  })

  it('FE-TOUCHDRAG-017: a drag near the bottom edge scrolls the pane it is over', () => {
    const pane = document.getElementById('plan')!
    Object.defineProperty(pane, 'scrollHeight', { value: 2000, configurable: true })
    Object.defineProperty(pane, 'clientHeight', { value: 400, configurable: true })
    pane.style.overflowY = 'auto'
    pane.getBoundingClientRect = () => ({ top: 0, bottom: 400, left: 0, right: 300, width: 300, height: 400, x: 0, y: 0, toJSON: () => ({}) })
    longPress()
    touchMove([{ clientX: 200, clientY: 390 }])
    const before = pane.scrollTop
    vi.advanceTimersByTime(64)
    expect(pane.scrollTop).toBeGreaterThan(before)
  })

  it('FE-TOUCHDRAG-018: a drag near the top edge scrolls the pane back up', () => {
    const pane = document.getElementById('plan')!
    Object.defineProperty(pane, 'scrollHeight', { value: 2000, configurable: true })
    Object.defineProperty(pane, 'clientHeight', { value: 400, configurable: true })
    pane.style.overflowY = 'scroll'
    pane.getBoundingClientRect = () => ({ top: 0, bottom: 400, left: 0, right: 300, width: 300, height: 400, x: 0, y: 0, toJSON: () => ({}) })
    pane.scrollTop = 500
    longPress()
    touchMove([{ clientX: 200, clientY: 10 }])
    vi.advanceTimersByTime(64)
    expect(pane.scrollTop).toBeLessThan(500)
  })

  it('FE-TOUCHDRAG-019: staying on the same zone keeps asking it, without re-entering', () => {
    longPress()
    touchMove([{ clientX: 200, clientY: 200 }])
    const enters = seen.filter(e => e === 'dragenter@zone').length
    touchMove([{ clientX: 200, clientY: 210 }])
    expect(seen.filter(e => e === 'dragenter@zone')).toHaveLength(enters)
    expect(seen.filter(e => e === 'dragover@zone').length).toBeGreaterThan(1)
  })

  it('FE-TOUCHDRAG-020: dragging over empty space leaves the last zone and finds no target', () => {
    longPress()
    touchMove([{ clientX: 200, clientY: 200 }])
    document.elementFromPoint = () => null
    touchMove([{ clientX: 999, clientY: 999 }])
    expect(seen).toContain('dragleave@zone')
    touchEnd()
    expect(seen).not.toContain('drop@zone')
  })

  it('FE-TOUCHDRAG-021: another finger moving is not mistaken for the dragging one', () => {
    longPress()
    const before = seen.length
    touchMove([{ clientX: 400, clientY: 400, identifier: 9 }])
    expect(seen).toHaveLength(before)
  })

  it('FE-TOUCHDRAG-022: lifting one of two fingers does not end the drag', () => {
    dropZone.addEventListener('dragover', e => e.preventDefault())
    longPress()
    touchMove([{ clientX: 200, clientY: 200 }])
    touchEnd('touchend', [{ clientX: 200, clientY: 200 }])
    expect(seen).not.toContain('dragend@source')
    touchEnd()
    expect(seen).toContain('drop@zone')
  })

  it('FE-TOUCHDRAG-023: the carried data behaves like a DataTransfer', () => {
    let types: readonly string[] = []
    let cleared = ''
    let missing = 'unset'
    source.addEventListener('dragstart', e => {
      const dt = (e as DragEvent).dataTransfer!
      dt.setData('placeId', '7')
      types = dt.types
      missing = dt.getData('nothing')
      dt.clearData('placeId')
      cleared = dt.getData('placeId')
    })
    longPress()
    expect(types).toEqual(['placeId'])
    expect(missing).toBe('')
    expect(cleared).toBe('')
  })

  it('FE-TOUCHDRAG-024: clearing every format empties the carried data', () => {
    let left: readonly string[] = ['stale']
    source.addEventListener('dragstart', e => {
      const dt = (e as DragEvent).dataTransfer!
      dt.setData('placeId', '7')
      dt.clearData()
      left = dt.types
    })
    longPress()
    expect(left).toEqual([])
  })

  it('FE-TOUCHDRAG-025: a finger that only jitters still completes the press', () => {
    touchStart(source, [{ clientX: 10, clientY: 10 }])
    // Holding a row steady is never perfectly steady; a few pixels is not a scroll.
    touchMove([{ clientX: 13, clientY: 14 }])
    vi.advanceTimersByTime(PRESS)
    expect(seen).toContain('dragstart@source')
  })

  it('FE-TOUCHDRAG-026: a drag in the middle of a pane leaves the scroll alone', () => {
    const pane = document.getElementById('plan')!
    Object.defineProperty(pane, 'scrollHeight', { value: 2000, configurable: true })
    Object.defineProperty(pane, 'clientHeight', { value: 400, configurable: true })
    pane.style.overflowY = 'auto'
    pane.getBoundingClientRect = () => ({ top: 0, bottom: 400, left: 0, right: 300, width: 300, height: 400, x: 0, y: 0, toJSON: () => ({}) })
    pane.scrollTop = 200
    longPress()
    touchMove([{ clientX: 200, clientY: 200 }])
    vi.advanceTimersByTime(64)
    expect(pane.scrollTop).toBe(200)
  })

  it('FE-TOUCHDRAG-027: a two-finger gesture never becomes a drag', () => {
    touchStart(source, [{ clientX: 10, clientY: 10 }, { clientX: 90, clientY: 90, identifier: 2 }])
    vi.advanceTimersByTime(PRESS)
    expect(seen).toEqual([])
  })

  it('FE-TOUCHDRAG-028: holding at the edge re-tests what the scroll brought under the finger', () => {
    const pane = document.getElementById('plan')!
    const other = document.getElementById('zone2')!
    other.addEventListener('dragover', e => e.preventDefault())
    Object.defineProperty(pane, 'scrollHeight', { value: 2000, configurable: true })
    Object.defineProperty(pane, 'clientHeight', { value: 400, configurable: true })
    pane.style.overflowY = 'auto'
    pane.getBoundingClientRect = () => ({ top: 0, bottom: 400, left: 0, right: 300, width: 300, height: 400, x: 0, y: 0, toJSON: () => ({}) })
    longPress()
    touchMove([{ clientX: 200, clientY: 390 }])
    // The finger stays put; the scroll is what changes the row beneath it.
    document.elementFromPoint = () => other
    vi.advanceTimersByTime(32)
    touchEnd()
    expect(seen).toContain('dragenter@zone2')
    expect(seen).toContain('drop@zone2')
  })
})
