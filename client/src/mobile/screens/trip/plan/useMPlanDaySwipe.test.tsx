import { useRef, useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { useMPlanDaySwipe, type MPlanDaySwipeArgs } from './useMPlanDaySwipe'
import type { Day } from '../../../../types'

// FE-MOB-DAYSWIPE-001 to FE-MOB-DAYSWIPE-031

const DAYS = [
  { id: 11, day_number: 1 }, { id: 12, day_number: 2 }, { id: 13, day_number: 3 },
] as unknown as Day[]

const onSelectDay = vi.fn()
const onRowClick = vi.fn()

/** Every scroll offset the sentinel reads. jsdom does no layout, so scrollTop
 *  is not settable — the harness serves it from here instead. */
const scroll = { top: 0, left: 0 }

function Harness(props: Partial<MPlanDaySwipeArgs>) {
  const panelRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const swipe = useMPlanDaySwipe({
    days: DAYS, selectedDayId: 12, onSelectDay, panelRef, cardRef,
    editing: false, dragging: false, menuOpen: false, rtl: false,
    describeDay: (i, n) => `dayAnnounce:${i + 1},${n}`,
    ...props,
  })
  return (
    <div ref={panelRef} data-testid="panel" {...swipe.handlers}>
      <span data-testid="live">{swipe.announcement}</span>
      <span data-hswipe-ignore data-testid="strip" />
      <div ref={cardRef} data-testid="card">
        <button data-testid="row" onClick={onRowClick}>row</button>
      </div>
    </div>
  )
}

/** Feeds the committed day straight back in, the way the planner does — the only
 *  way to show a burst of swipes stepping day by day rather than repeating one. */
function StatefulHarness() {
  const [dayId, setDayId] = useState(11)
  return <Harness selectedDayId={dayId} onSelectDay={id => { onSelectDay(id); setDayId(id) }} />
}

const panel = () => screen.getByTestId('panel')
const card = () => screen.getByTestId('card')
const live = () => screen.getByTestId('live')

function mount(props: Partial<MPlanDaySwipeArgs> = {}) {
  return prepare(render(<Harness {...props} />))
}

function mountStateful() {
  return prepare(render(<StatefulHarness />))
}

function prepare<T>(view: T): T {
  const el = card()
  Object.defineProperty(el, 'scrollTop', { get: () => scroll.top, configurable: true })
  Object.defineProperty(el, 'scrollLeft', { get: () => scroll.left, configurable: true })
  // jsdom has no Element.prototype.scrollTo, which is why the hook calls it
  // optionally — the spy is what lets the reset be asserted at all.
  el.scrollTo = vi.fn()
  return view
}

function overflow(el: HTMLElement, scrollWidth: number, clientWidth: number) {
  Object.defineProperty(el, 'scrollWidth', { value: scrollWidth, configurable: true })
  Object.defineProperty(el, 'clientWidth', { value: clientWidth, configurable: true })
}

interface Point { x: number; y?: number; dt?: number }

/** Plays a touch path. The first point is the press, the rest are moves; the
 *  press itself is never a move, so a path of one point is a plain tap. */
function drag(target: HTMLElement, path: Point[]): Point {
  const [start, ...moves] = path
  fireEvent.touchStart(target, { touches: [{ clientX: start.x, clientY: start.y ?? 300 }] })
  let last = start
  for (const p of moves) {
    if (p.dt) act(() => { vi.advanceTimersByTime(p.dt!) })
    fireEvent.touchMove(target, { touches: [{ clientX: p.x, clientY: p.y ?? 300 }] })
    last = p
  }
  return last
}

function release(target: HTMLElement, at: Point) {
  fireEvent.touchEnd(target, { touches: [], changedTouches: [{ clientX: at.x, clientY: at.y ?? 300 }] })
}

/** Runs both animation legs plus the spring, so the DOM lands in its rest state. */
function settle() {
  act(() => { vi.advanceTimersByTime(600) })
}

/** A committing left swipe: 100px, fast enough to be a flick as well. */
function swipeLeft(target = panel(), from = 300) {
  const last = drag(target, [{ x: from }, { x: from + 3 }, { x: from - 20, dt: 30 }, { x: from - 100, dt: 30 }])
  release(target, last)
  settle()
}

function swipeRight(target = panel(), from = 300) {
  const last = drag(target, [{ x: from }, { x: from - 3 }, { x: from + 20, dt: 30 }, { x: from + 100, dt: 30 }])
  release(target, last)
  settle()
}

beforeEach(() => {
  onSelectDay.mockClear()
  onRowClick.mockClear()
  scroll.top = 0
  scroll.left = 0
  vi.useFakeTimers()
  // Both animation legs hang off rAF; running it inline keeps the timers the
  // only clock the tests have to drive.
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0 })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  document.documentElement.removeAttribute('data-reduce-motion')
})

describe('useMPlanDaySwipe', () => {
  describe('committing', () => {
    it('FE-MOB-DAYSWIPE-001: a swipe left steps to the next day', () => {
      mount()
      swipeLeft()
      expect(onSelectDay).toHaveBeenCalledTimes(1)
      expect(onSelectDay).toHaveBeenCalledWith(13)
    })

    it('FE-MOB-DAYSWIPE-002: a swipe right steps to the previous day', () => {
      mount()
      swipeRight()
      expect(onSelectDay).toHaveBeenCalledWith(11)
    })

    it('FE-MOB-DAYSWIPE-003: a short, slow drag springs back to rest', () => {
      mount()
      const last = drag(panel(), [{ x: 300 }, { x: 303 }, { x: 280, dt: 300 }, { x: 270, dt: 300 }])
      release(panel(), last)
      expect(onSelectDay).not.toHaveBeenCalled()
      settle()
      expect(panel().style.transform).toBe('')
      expect(panel().style.transition).toBe('')
    })

    it('FE-MOB-DAYSWIPE-004: a flick commits short of the distance threshold', () => {
      mount()
      const last = drag(panel(), [{ x: 300 }, { x: 303 }, { x: 288, dt: 15 }, { x: 270, dt: 15 }])
      release(panel(), last)
      settle()
      expect(onSelectDay).toHaveBeenCalledWith(13)
    })

    it('FE-MOB-DAYSWIPE-005: a fast but tiny move is not a flick', () => {
      mount()
      const last = drag(panel(), [{ x: 300 }, { x: 303 }, { x: 288, dt: 10 }, { x: 280, dt: 10 }])
      release(panel(), last)
      settle()
      expect(onSelectDay).not.toHaveBeenCalled()
    })
  })

  describe('yielding to the gestures that were already there', () => {
    it('FE-MOB-DAYSWIPE-006: a vertical drag never touches the panel', () => {
      mount()
      const last = drag(panel(), [{ x: 300 }, { x: 302, y: 320, dt: 20 }, { x: 304, y: 420, dt: 20 }])
      expect(panel().style.transform).toBe('')
      release(panel(), last)
      settle()
      expect(onSelectDay).not.toHaveBeenCalled()
    })

    it('FE-MOB-DAYSWIPE-007: a diagonal drag inside the bias goes to the scroller', () => {
      mount()
      const last = drag(panel(), [{ x: 300 }, { x: 340, y: 338, dt: 20 }, { x: 400, y: 400, dt: 20 }])
      release(panel(), last)
      settle()
      expect(onSelectDay).not.toHaveBeenCalled()
    })

    it('FE-MOB-DAYSWIPE-008: a card that has already scrolled vertically kills the gesture', () => {
      mount()
      fireEvent.touchStart(panel(), { touches: [{ clientX: 300, clientY: 300 }] })
      scroll.top = 12
      fireEvent.touchMove(panel(), { touches: [{ clientX: 180, clientY: 300 }] })
      release(panel(), { x: 180 })
      settle()
      expect(onSelectDay).not.toHaveBeenCalled()
      expect(panel().style.transform).toBe('')
    })

    it('FE-MOB-DAYSWIPE-009: a card that has already scrolled sideways kills it too', () => {
      mount()
      fireEvent.touchStart(panel(), { touches: [{ clientX: 300, clientY: 300 }] })
      scroll.left = 9
      fireEvent.touchMove(panel(), { touches: [{ clientX: 180, clientY: 300 }] })
      release(panel(), { x: 180 })
      settle()
      expect(onSelectDay).not.toHaveBeenCalled()
    })

    it('FE-MOB-DAYSWIPE-017: a swipe started on an overflowing horizontal strip is handed back', () => {
      mount()
      const strip = screen.getByTestId('strip')
      overflow(strip, 300, 200)
      const last = drag(strip, [{ x: 300 }, { x: 280, dt: 30 }, { x: 200, dt: 30 }])
      release(strip, last)
      settle()
      expect(onSelectDay).not.toHaveBeenCalled()
    })

    it('FE-MOB-DAYSWIPE-018: the same strip swipes normally while it fits', () => {
      mount()
      const strip = screen.getByTestId('strip')
      overflow(strip, 200, 200)
      const last = drag(strip, [{ x: 300 }, { x: 280, dt: 30 }, { x: 200, dt: 30 }])
      release(strip, last)
      settle()
      expect(onSelectDay).toHaveBeenCalledWith(13)
    })

    it('FE-MOB-DAYSWIPE-019: no touch event is ever cancelled or stopped', () => {
      mount()
      const seen: { type: string; prevented: boolean }[] = []
      const spy = (e: Event) => seen.push({ type: e.type, prevented: e.defaultPrevented })
      for (const type of ['touchstart', 'touchmove', 'touchend']) document.addEventListener(type, spy)
      try {
        swipeLeft()
      } finally {
        for (const type of ['touchstart', 'touchmove', 'touchend']) document.removeEventListener(type, spy)
      }
      // Reaching document at all proves propagation was never stopped; the drag
      // bridge's own 10px self-cancel depends on both halves of this.
      expect(seen.map(s => s.type)).toContain('touchstart')
      expect(seen.map(s => s.type)).toContain('touchmove')
      expect(seen.map(s => s.type)).toContain('touchend')
      expect(seen.every(s => !s.prevented)).toBe(true)
    })
  })

  describe('refusing to arm', () => {
    it('FE-MOB-DAYSWIPE-010: the last day resists instead of wrapping', () => {
      mount({ selectedDayId: 13 })
      const last = drag(panel(), [{ x: 300 }, { x: 280, dt: 20 }, { x: 100, dt: 20 }])
      const pulled = Math.abs(parseFloat(panel().style.transform.replace(/[^-\d.]/g, '')))
      expect(pulled).toBeLessThanOrEqual(48)
      release(panel(), last)
      settle()
      expect(onSelectDay).not.toHaveBeenCalled()
    })

    it('FE-MOB-DAYSWIPE-011: the first day resists the other way', () => {
      mount({ selectedDayId: 11 })
      swipeRight()
      expect(onSelectDay).not.toHaveBeenCalled()
    })

    it('FE-MOB-DAYSWIPE-012: a single-day trip never arms', () => {
      mount({ days: [DAYS[0]], selectedDayId: 11 })
      swipeLeft()
      expect(onSelectDay).not.toHaveBeenCalled()
      expect(panel().style.transform).toBe('')
    })

    it('FE-MOB-DAYSWIPE-013: a two-finger touch never arms', () => {
      mount()
      fireEvent.touchStart(panel(), { touches: [{ clientX: 300, clientY: 300 }, { clientX: 340, clientY: 300 }] })
      fireEvent.touchMove(panel(), { touches: [{ clientX: 180, clientY: 300 }] })
      release(panel(), { x: 180 })
      settle()
      expect(onSelectDay).not.toHaveBeenCalled()
    })

    it('FE-MOB-DAYSWIPE-014: a row already being dragged owns the finger', () => {
      mount({ dragging: true })
      swipeLeft()
      expect(onSelectDay).not.toHaveBeenCalled()
    })

    it('FE-MOB-DAYSWIPE-015: an open leg menu owns the finger', () => {
      mount({ menuOpen: true })
      swipeLeft()
      expect(onSelectDay).not.toHaveBeenCalled()
    })

    it('FE-MOB-DAYSWIPE-016: the screen edges are left to the browser', () => {
      mount()
      swipeLeft(panel(), 8)
      expect(onSelectDay).not.toHaveBeenCalled()
      swipeRight(panel(), window.innerWidth - 8)
      expect(onSelectDay).not.toHaveBeenCalled()
    })
  })

  describe('edit mode', () => {
    it('FE-MOB-DAYSWIPE-028: a press held past the drag window stops being a swipe', () => {
      mount({ editing: true })
      fireEvent.touchStart(panel(), { touches: [{ clientX: 300, clientY: 300 }] })
      act(() => { vi.advanceTimersByTime(400) })
      fireEvent.touchMove(panel(), { touches: [{ clientX: 180, clientY: 300 }] })
      release(panel(), { x: 180 })
      settle()
      expect(onSelectDay).not.toHaveBeenCalled()
    })

    it('FE-MOB-DAYSWIPE-029: go mode has no drag bridge, so a slow swipe still counts', () => {
      mount({ editing: false })
      fireEvent.touchStart(panel(), { touches: [{ clientX: 300, clientY: 300 }] })
      act(() => { vi.advanceTimersByTime(400) })
      fireEvent.touchMove(panel(), { touches: [{ clientX: 180, clientY: 300 }] })
      release(panel(), { x: 180 })
      settle()
      expect(onSelectDay).toHaveBeenCalledWith(13)
    })
  })

  describe('right to left', () => {
    it('FE-MOB-DAYSWIPE-020: an RTL locale mirrors both directions', () => {
      mount({ rtl: true })
      swipeLeft()
      expect(onSelectDay).toHaveBeenCalledWith(11)
      onSelectDay.mockClear()
      swipeRight()
      expect(onSelectDay).toHaveBeenCalledWith(13)
    })
  })

  describe('taps and clicks', () => {
    it('FE-MOB-DAYSWIPE-021: the click a swipe leaves behind never reaches a row', () => {
      mount()
      swipeLeft()
      fireEvent.click(screen.getByTestId('row'))
      expect(onRowClick).not.toHaveBeenCalled()
    })

    it('FE-MOB-DAYSWIPE-022: only that one click is swallowed', () => {
      mount()
      swipeLeft()
      fireEvent.click(screen.getByTestId('row'))
      fireEvent.click(screen.getByTestId('row'))
      expect(onRowClick).toHaveBeenCalledTimes(1)
    })

    it('FE-MOB-DAYSWIPE-023: a plain tap opens its row, and a stray touchend does not throw', () => {
      mount()
      release(panel(), { x: 300 })
      drag(panel(), [{ x: 300 }])
      release(panel(), { x: 300 })
      fireEvent.click(screen.getByTestId('row'))
      expect(onRowClick).toHaveBeenCalledTimes(1)
    })

    it('FE-MOB-DAYSWIPE-024: a cancelled gesture springs back and changes nothing', () => {
      mount()
      drag(panel(), [{ x: 300 }, { x: 280, dt: 20 }, { x: 200, dt: 20 }])
      fireEvent.touchCancel(panel(), { touches: [], changedTouches: [{ clientX: 200, clientY: 300 }] })
      settle()
      expect(onSelectDay).not.toHaveBeenCalled()
      expect(panel().style.transform).toBe('')
    })
  })

  describe('after the day changes', () => {
    it('FE-MOB-DAYSWIPE-025: the new day starts at the top of the card', () => {
      mount()
      swipeLeft()
      expect(card().scrollTo).toHaveBeenCalledWith({ top: 0 })
    })

    it('FE-MOB-DAYSWIPE-026: the live region names the day that was reached', () => {
      mount()
      swipeLeft()
      expect(live()).toHaveTextContent('dayAnnounce:3,3')
    })

    it('FE-MOB-DAYSWIPE-027: mounting announces nothing', () => {
      mount()
      expect(live()).toHaveTextContent('')
    })
  })

  describe('reduced motion', () => {
    it('FE-MOB-DAYSWIPE-030: the day still changes, the panel just never moves', () => {
      document.documentElement.setAttribute('data-reduce-motion', '')
      mount()
      const last = drag(panel(), [{ x: 300 }, { x: 303 }, { x: 280, dt: 30 }, { x: 200, dt: 30 }])
      expect(panel().style.transform).toBe('')
      release(panel(), last)
      settle()
      expect(onSelectDay).toHaveBeenCalledWith(13)
      expect(live()).toHaveTextContent('dayAnnounce:3,3')
      expect(panel().style.transform).toBe('')
    })
  })

  describe('interruption', () => {
    it('FE-MOB-DAYSWIPE-031: a burst of swipes steps day by day, and unmounting mid-animation is quiet', () => {
      const stateful = mountStateful()
      // The second swipe starts before the first one's out-leg has landed, so
      // the interrupt has to commit day 1 → 2 before day 2 → 3 can resolve.
      const first = drag(panel(), [{ x: 300 }, { x: 303 }, { x: 280, dt: 30 }, { x: 200, dt: 30 }])
      release(panel(), first)
      const second = drag(panel(), [{ x: 300 }, { x: 303 }, { x: 280, dt: 30 }, { x: 200, dt: 30 }])
      release(panel(), second)
      settle()
      expect(onSelectDay.mock.calls.map(c => c[0])).toEqual([12, 13])
      stateful.unmount()

      onSelectDay.mockClear()
      const view = mount()
      const third = drag(panel(), [{ x: 300 }, { x: 303 }, { x: 280, dt: 30 }, { x: 200, dt: 30 }])
      release(panel(), third)
      view.unmount()
      act(() => { vi.advanceTimersByTime(600) })
      expect(onSelectDay).not.toHaveBeenCalled()
    })
  })
})
