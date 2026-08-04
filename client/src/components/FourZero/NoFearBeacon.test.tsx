// FE-NOFEAR-BCN-001 to FE-NOFEAR-BCN-019
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act, fireEvent } from '../../../tests/helpers/render'
import NoFearBeacon from './NoFearBeacon'

vi.mock('./NoFearShow', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-label="show stub">
      <button type="button" onClick={onClose}>close show</button>
    </div>
  ),
}))

const DISMISS_KEY = 'trek.fourzero.dismissed'
const POINT_COUNT = 24

interface StrokeRecord {
  style: string
  width: number
}

interface FakeCtx {
  strokeStyle: string
  lineWidth: number
  fillStyle: string
  globalCompositeOperation: string
  setTransform: ReturnType<typeof vi.fn>
  clearRect: ReturnType<typeof vi.fn>
  beginPath: ReturnType<typeof vi.fn>
  moveTo: ReturnType<typeof vi.fn>
  lineTo: ReturnType<typeof vi.fn>
  stroke: ReturnType<typeof vi.fn>
  arc: ReturnType<typeof vi.fn>
  fill: ReturnType<typeof vi.fn>
  strokes: StrokeRecord[]
}

interface FakeObserver {
  cb: ResizeObserverCallback
  observe: ReturnType<typeof vi.fn>
  unobserve: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
}

let frames: FrameRequestCallback[] = []
let cancelSpy: ReturnType<typeof vi.fn>
let ctx: FakeCtx | null = null
let observers: FakeObserver[] = []
let randomQueue: number[] = []
const originalGetContext = HTMLCanvasElement.prototype.getContext
const OriginalResizeObserver = globalThis.ResizeObserver

function makeCtx(): FakeCtx {
  const c: FakeCtx = {
    strokeStyle: '',
    lineWidth: 0,
    fillStyle: '',
    globalCompositeOperation: 'source-over',
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(() => { c.strokes.push({ style: c.strokeStyle, width: c.lineWidth }) }),
    arc: vi.fn(),
    fill: vi.fn(),
    strokes: [],
  }
  return c
}

class FakeResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  constructor(public cb: ResizeObserverCallback) { observers.push(this) }
}

/** Runs the pending rAF callback with the given timestamp (ms). */
function frame(ms: number): void {
  const pending = frames
  frames = []
  act(() => { pending.forEach(cb => cb(ms)) })
}

function resetDrawCounters(): void {
  ctx?.moveTo.mockClear()
  ctx?.lineTo.mockClear()
  ctx?.arc.mockClear()
  ctx?.fill.mockClear()
  if (ctx) ctx.strokes.length = 0
}

function setReducedMotion(reduce: boolean): void {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
  // Well inside the release window so the beacon is not retired by the calendar.
  vi.setSystemTime(new Date('2026-08-01T09:00:00'))
  frames = []
  observers = []
  cancelSpy = vi.fn()
  ctx = makeCtx()
  randomQueue = [0]
  let randomIdx = 0
  vi.spyOn(Math, 'random').mockImplementation(() => {
    const v = randomQueue[randomIdx % randomQueue.length]
    randomIdx++
    return v
  })
  vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => {
    frames.push(cb)
    return frames.length
  }))
  vi.stubGlobal('cancelAnimationFrame', cancelSpy)
  globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ctx) as unknown as typeof originalGetContext
  Object.defineProperty(HTMLCanvasElement.prototype, 'clientWidth', { configurable: true, get: () => 800 })
  Object.defineProperty(HTMLCanvasElement.prototype, 'clientHeight', { configurable: true, get: () => 400 })
  Object.defineProperty(window, 'devicePixelRatio', { configurable: true, writable: true, value: 1 })
  setReducedMotion(false)
})

afterEach(() => {
  HTMLCanvasElement.prototype.getContext = originalGetContext
  Reflect.deleteProperty(HTMLCanvasElement.prototype, 'clientWidth')
  Reflect.deleteProperty(HTMLCanvasElement.prototype, 'clientHeight')
  globalThis.ResizeObserver = OriginalResizeObserver
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('NoFearBeacon', () => {
  it('FE-NOFEAR-BCN-001: renders the trigger card with title, subtitle and retirement badge', () => {
    render(<NoFearBeacon />)

    const play = screen.getByRole('button', { name: 'Press play.' })
    expect(play).toHaveTextContent('NO FEAR')
    expect(play).toHaveTextContent('A sign for an open world.')
    expect(screen.getByText('Shown until Aug 23')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument()
  })

  it('FE-NOFEAR-BCN-002: renders nothing once the release window has passed', () => {
    vi.setSystemTime(new Date('2026-08-24T00:00:01'))

    const { container } = render(<NoFearBeacon />)

    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByText('NO FEAR')).toBeNull()
  })

  it('FE-NOFEAR-BCN-003: stays hidden when it was dismissed before', () => {
    localStorage.setItem(DISMISS_KEY, '1')

    const { container } = render(<NoFearBeacon />)

    expect(container).toBeEmptyDOMElement()
  })

  it('FE-NOFEAR-BCN-004: still renders when localStorage cannot be read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      if (key === DISMISS_KEY) throw new Error('storage blocked')
      return null
    })

    render(<NoFearBeacon />)

    expect(screen.getByText('NO FEAR')).toBeInTheDocument()
  })

  it('FE-NOFEAR-BCN-005: needs two clicks to retire the moment and persists the choice', () => {
    render(<NoFearBeacon />)
    const dismiss = screen.getByRole('button', { name: 'Dismiss' })

    fireEvent.click(dismiss)

    expect(dismiss).toHaveTextContent('Hide for good?')
    expect(dismiss).toHaveClass('fz-beacon-dismiss-confirm')
    expect(screen.getByText('NO FEAR')).toBeInTheDocument()

    fireEvent.click(dismiss)

    expect(screen.queryByText('NO FEAR')).toBeNull()
    expect(localStorage.getItem(DISMISS_KEY)).toBe('1')
  })

  it('FE-NOFEAR-BCN-006: disarms the confirm state when the pointer leaves', () => {
    render(<NoFearBeacon />)
    const dismiss = screen.getByRole('button', { name: 'Dismiss' })

    fireEvent.click(dismiss)
    expect(dismiss).toHaveTextContent('Hide for good?')

    fireEvent.mouseLeave(dismiss)

    expect(dismiss).not.toHaveTextContent('Hide for good?')
    expect(dismiss).not.toHaveClass('fz-beacon-dismiss-confirm')
  })

  it('FE-NOFEAR-BCN-007: disarms the confirm state on blur', () => {
    render(<NoFearBeacon />)
    const dismiss = screen.getByRole('button', { name: 'Dismiss' })

    fireEvent.click(dismiss)
    fireEvent.blur(dismiss)

    expect(dismiss).not.toHaveTextContent('Hide for good?')
  })

  it('FE-NOFEAR-BCN-008: hides for the session when the choice cannot be persisted', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    render(<NoFearBeacon />)
    const dismiss = screen.getByRole('button', { name: 'Dismiss' })

    fireEvent.click(dismiss)
    fireEvent.click(dismiss)

    expect(screen.queryByText('NO FEAR')).toBeNull()
  })

  it('FE-NOFEAR-BCN-009: opens the show on play and closes it again', async () => {
    render(<NoFearBeacon />)
    expect(screen.queryByRole('dialog')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Press play.' }))
    await act(async () => { await Promise.resolve() })

    expect(screen.getByRole('dialog', { name: 'show stub' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'close show' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByText('NO FEAR')).toBeInTheDocument()
  })

  it('FE-NOFEAR-BCN-010: sizes the teaser canvas by capped device pixel ratio', () => {
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, writable: true, value: 3 })

    render(<NoFearBeacon />)

    const canvas = document.querySelector<HTMLCanvasElement>('canvas.fz-beacon-canvas')
    expect(canvas?.width).toBe(1200)
    expect(canvas?.height).toBe(600)
    expect(ctx?.setTransform).toHaveBeenCalledWith(1.5, 0, 0, 1.5, 0, 0)
    expect(observers[0].observe).toHaveBeenCalledWith(canvas)
  })

  it('FE-NOFEAR-BCN-011: re-fits the canvas when the observer reports a resize', () => {
    render(<NoFearBeacon />)
    expect(ctx?.setTransform).toHaveBeenCalledTimes(1)

    act(() => { observers[0].cb([], observers[0] as unknown as ResizeObserver) })

    expect(ctx?.setTransform).toHaveBeenCalledTimes(2)
  })

  it('FE-NOFEAR-BCN-012: breathes every light twice per frame and keeps animating', () => {
    render(<NoFearBeacon />)

    frame(0)

    expect(ctx?.clearRect).toHaveBeenCalledWith(0, 0, 800, 400)
    expect(ctx?.arc).toHaveBeenCalledTimes(POINT_COUNT * 2)
    expect(ctx?.fill).toHaveBeenCalledTimes(POINT_COUNT * 2)
    expect(ctx?.moveTo).not.toHaveBeenCalled()
    expect(ctx?.globalCompositeOperation).toBe('source-over')
    expect(frames).toHaveLength(1)
  })

  it('FE-NOFEAR-BCN-013: spawns a golden arc between two distant lights and grows it', () => {
    // a = point 0, first b throwaway, then a far point so the search breaks at once.
    randomQueue = [0, 0, 0.9]
    render(<NoFearBeacon />)

    frame(0)
    resetDrawCounters()

    frame(2000)
    expect(ctx?.moveTo).toHaveBeenCalledTimes(1)
    // Two passes per arc: wide warm halo, then the bright core.
    expect(ctx?.strokes).toEqual([
      { style: 'rgba(255, 180, 95, 0.12)', width: 3.4 },
      { style: 'rgba(255, 208, 130, 0.55)', width: 1.1 },
    ])
    const partial = ctx?.lineTo.mock.calls.length ?? 0
    expect(partial).toBeGreaterThan(0)
    expect(partial).toBeLessThan(22)

    resetDrawCounters()
    frame(3600)
    expect(ctx?.lineTo).toHaveBeenCalledTimes(22)
  })

  it('FE-NOFEAR-BCN-014: fades an arc out and drops it once it is older than 4.5s', () => {
    randomQueue = [0, 0, 0.9]
    render(<NoFearBeacon />)

    frame(0)
    frame(2000)

    // 3.75s old: half faded, drawn behind the arc that just spawned.
    resetDrawCounters()
    frame(5750)
    expect(ctx?.moveTo).toHaveBeenCalledTimes(2)
    expect(ctx?.strokes.slice(2)).toEqual([
      { style: 'rgba(255, 180, 95, 0.06)', width: 3.4 },
      { style: 'rgba(255, 208, 130, 0.275)', width: 1.1 },
    ])

    // Past 4.5s it is dropped and only the younger arc remains.
    resetDrawCounters()
    frame(7000)
    expect(ctx?.moveTo).toHaveBeenCalledTimes(1)
  })

  it('FE-NOFEAR-BCN-015: gives up looking for a distant partner after six tries', () => {
    // Every draw returns the same index, so no candidate is ever far enough away.
    randomQueue = [0]
    render(<NoFearBeacon />)

    frame(0)
    resetDrawCounters()
    frame(2000)

    expect(ctx?.moveTo).toHaveBeenCalledTimes(1)
    expect(Math.random).toHaveBeenCalledTimes(8)
  })

  it('FE-NOFEAR-BCN-016: paints a single frame and stops when motion is reduced', () => {
    setReducedMotion(true)

    render(<NoFearBeacon />)
    expect(frames).toHaveLength(1)

    frame(0)

    expect(ctx?.fill).toHaveBeenCalledTimes(POINT_COUNT * 2)
    expect(frames).toHaveLength(0)
  })

  it('FE-NOFEAR-BCN-017: skips the teaser entirely without a 2d context', () => {
    ctx = null

    render(<NoFearBeacon />)

    expect(frames).toHaveLength(0)
    expect(observers).toHaveLength(0)
    expect(screen.getByText('NO FEAR')).toBeInTheDocument()
  })

  it('FE-NOFEAR-BCN-018: cancels the frame and disconnects the observer on unmount', () => {
    const { unmount } = render(<NoFearBeacon />)

    unmount()

    expect(cancelSpy).toHaveBeenCalled()
    expect(observers[0].disconnect).toHaveBeenCalledTimes(1)
  })

  it('FE-NOFEAR-BCN-019: falls back to a pixel ratio of 1 when the browser reports none', () => {
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, writable: true, value: 0 })

    render(<NoFearBeacon />)

    expect(document.querySelector<HTMLCanvasElement>('canvas.fz-beacon-canvas')?.width).toBe(800)
    expect(ctx?.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0)
  })
})
