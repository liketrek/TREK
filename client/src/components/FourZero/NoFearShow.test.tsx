// FE-NOFEAR-SHOW-001 to FE-NOFEAR-SHOW-035
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '../../../tests/helpers/render'
import apiClient, { placesApi, tripsApi } from '../../api/client'
import NoFearShow from './NoFearShow'

interface AudioStub {
  start: ReturnType<typeof vi.fn>
  setMuted: ReturnType<typeof vi.fn>
  resume: ReturnType<typeof vi.fn>
  setSuspended: ReturnType<typeof vi.fn>
  swell: ReturnType<typeof vi.fn>
  impact: ReturnType<typeof vi.fn>
  setAct: ReturnType<typeof vi.fn>
  dispose: ReturnType<typeof vi.fn>
}

interface SceneStub {
  layout: ReturnType<typeof vi.fn>
  load: ReturnType<typeof vi.fn>
  setPersonalPlaces: ReturnType<typeof vi.fn>
  draw: ReturnType<typeof vi.fn>
}

interface AssemblyStub {
  init: ReturnType<typeof vi.fn>
  draw: ReturnType<typeof vi.fn>
  isReady: ReturnType<typeof vi.fn>
}

// Audio, scene and the finale's particle assembly are replaced wholesale: this
// suite is about the React shell (acts, clock, portal, teardown), not WebAudio
// or canvas painting, both of which have their own unit tests.
const stubs = vi.hoisted(() => {
  const audio: AudioStub[] = []
  const scene: SceneStub[] = []
  const assembly: AssemblyStub[] = []
  class FakeAudio {
    start = vi.fn()
    setMuted = vi.fn()
    resume = vi.fn()
    setSuspended = vi.fn()
    swell = vi.fn()
    impact = vi.fn()
    setAct = vi.fn()
    dispose = vi.fn()
    constructor() { audio.push(this) }
  }
  class FakeScene {
    layout = vi.fn()
    load = vi.fn()
    setPersonalPlaces = vi.fn()
    draw = vi.fn()
    constructor() { scene.push(this) }
  }
  class FakeAssembly {
    init = vi.fn()
    draw = vi.fn()
    isReady = vi.fn()
    constructor() { assembly.push(this) }
  }
  return { audio, scene, assembly, FakeAudio, FakeScene, FakeAssembly }
})

vi.mock('./noFearAudio', () => ({ NoFearAudio: stubs.FakeAudio }))
vi.mock('./noFearScene', () => ({ NoFearScene: stubs.FakeScene }))
vi.mock('./noFearAssembly', () => ({ TextAssembly: stubs.FakeAssembly }))

const LINES = {
  afraid: 'They want you to be afraid.',
  ofTheStranger: 'Afraid of the stranger. Afraid of everything you don’t know.',
  fearTool: 'Because fear closes borders — first on maps, then in minds.',
  hateTrade: 'Fear is their tool. Hatred is their trade.',
  butYouTraveled: 'But you have traveled.',
  tables: 'You have eaten at foreign tables. Slept under foreign roofs. Laughed with strangers.',
  notAnOpinion: 'Racism is not an opinion. Fascism is not an alternative.',
  everyDot: 'Every one of these lights is a table where someone was welcome.',
  yourPlaces: 'This — this was you.',
}

let nowMs = 0
let frames: FrameRequestCallback[] = []
let cancelSpy: ReturnType<typeof vi.fn>
let ctxStub: { setTransform: ReturnType<typeof vi.fn> } | null = null
const originalGetContext = HTMLCanvasElement.prototype.getContext

const audio = () => stubs.audio[0]
const scene = () => stubs.scene[0]

/** Runs the pending rAF callback at the given show time (seconds). */
function frame(seconds: number): void {
  nowMs = seconds * 1000
  const pending = frames
  frames = []
  act(() => { pending.forEach(cb => cb(nowMs)) })
}

async function flush(): Promise<void> {
  await act(async () => {
    for (let i = 0; i < 12; i++) await Promise.resolve()
  })
}

function canvas(): HTMLCanvasElement {
  const el = document.querySelector<HTMLCanvasElement>('canvas.fz-canvas')
  if (!el) throw new Error('show canvas missing')
  return el
}

/** The scene state handed to the canvas on the most recent frame. */
function lastSceneState(): { opacity: number; particles: number } {
  const calls = scene().draw.mock.calls
  return calls[calls.length - 1][1] as { opacity: number; particles: number }
}

/** Visible line text, normalised across the sentence-by-sentence reveal. */
function lineText(): string {
  const el = document.querySelector('.fz-line:not(.fz-line-ghost)')
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim()
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
  nowMs = 0
  frames = []
  stubs.audio.length = 0
  stubs.scene.length = 0
  stubs.assembly.length = 0
  cancelSpy = vi.fn()
  ctxStub = { setTransform: vi.fn() }
  vi.spyOn(performance, 'now').mockImplementation(() => nowMs)
  vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => {
    frames.push(cb)
    return frames.length
  }))
  vi.stubGlobal('cancelAnimationFrame', cancelSpy)
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ctxStub) as unknown as typeof originalGetContext
  Object.defineProperty(HTMLCanvasElement.prototype, 'clientWidth', { configurable: true, get: () => 800 })
  Object.defineProperty(HTMLCanvasElement.prototype, 'clientHeight', { configurable: true, get: () => 600 })
  Object.defineProperty(window, 'devicePixelRatio', { configurable: true, writable: true, value: 1 })
  setReducedMotion(false)
  // No traveler data by default — the generic show.
  vi.spyOn(tripsApi, 'list').mockResolvedValue([])
  vi.spyOn(placesApi, 'list').mockResolvedValue([])
  vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('no atlas'))
})

afterEach(() => {
  HTMLCanvasElement.prototype.getContext = originalGetContext
  Reflect.deleteProperty(HTMLCanvasElement.prototype, 'clientWidth')
  Reflect.deleteProperty(HTMLCanvasElement.prototype, 'clientHeight')
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.useRealTimers()
  document.body.classList.remove('fz-show-open')
})

describe('NoFearShow', () => {
  it('FE-NOFEAR-SHOW-001: portals a labelled dialog into the body and locks the page chrome', () => {
    render(<NoFearShow onClose={vi.fn()} />)

    const dialog = screen.getByRole('dialog', { name: 'NO FEAR' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog.parentElement).toBe(document.body)
    expect(document.body).toHaveClass('fz-show-open')
  })

  it('FE-NOFEAR-SHOW-002: boots audio and scene and starts the soundtrack', () => {
    render(<NoFearShow onClose={vi.fn()} />)

    expect(stubs.audio).toHaveLength(1)
    expect(stubs.scene).toHaveLength(1)
    expect(audio().start).toHaveBeenCalledTimes(1)
    expect(scene().layout).toHaveBeenCalledWith(800, 600)
  })

  it('FE-NOFEAR-SHOW-003: sizes the canvas by capped device pixel ratio', () => {
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, writable: true, value: 4 })

    render(<NoFearShow onClose={vi.fn()} />)

    expect(canvas().width).toBe(1400)
    expect(canvas().height).toBe(1050)
    expect(ctxStub?.setTransform).toHaveBeenCalledWith(1.75, 0, 0, 1.75, 0, 0)
  })

  it('FE-NOFEAR-SHOW-004: loads the scene with a live abort signal that aborts on unmount', () => {
    const { unmount } = render(<NoFearShow onClose={vi.fn()} />)

    const signal = scene().load.mock.calls[0][2] as AbortSignal
    expect(scene().load).toHaveBeenCalledWith(800, 600, signal)
    expect(signal.aborted).toBe(false)

    unmount()
    expect(signal.aborted).toBe(true)
  })

  it('FE-NOFEAR-SHOW-005: re-fits the canvas on window resize', () => {
    render(<NoFearShow onClose={vi.fn()} />)
    expect(scene().layout).toHaveBeenCalledTimes(1)

    act(() => { window.dispatchEvent(new Event('resize')) })

    expect(scene().layout).toHaveBeenCalledTimes(2)
  })

  it('FE-NOFEAR-SHOW-006: shows no line before the first cue', () => {
    render(<NoFearShow onClose={vi.fn()} />)

    frame(0.2)

    expect(document.querySelector('.fz-line')).toBeNull()
    expect(audio().setAct).not.toHaveBeenCalled()
  })

  it('FE-NOFEAR-SHOW-007: opens on the fear act with the first line', () => {
    render(<NoFearShow onClose={vi.fn()} />)

    frame(0.9)

    expect(lineText()).toBe(LINES.afraid)
    expect(audio().setAct).toHaveBeenCalledWith('fear')
    expect(scene().draw).toHaveBeenCalled()
  })

  it('FE-NOFEAR-SHOW-008: decays the replaced fear line into a per-character ghost', () => {
    render(<NoFearShow onClose={vi.fn()} />)

    frame(0.9)
    expect(document.querySelector('.fz-line-ghost')).toBeNull()

    frame(6.1)
    expect(lineText()).toBe(LINES.ofTheStranger)
    const ghost = document.querySelector('.fz-line-ghost')
    expect(ghost).not.toBeNull()
    expect(ghost?.querySelectorAll('.fz-char-decay')).toHaveLength(LINES.afraid.length)

    // The 1.4s retirement timer captures `lastCue` by reference, and the loop has
    // already advanced it — so the faded-out ghost node stays in the DOM.
    act(() => { vi.advanceTimersByTime(1400) })
    expect(document.querySelector('.fz-line-ghost')).not.toBeNull()

    frame(12.1)
    const ghostText = document.querySelector('.fz-line-ghost')?.textContent ?? ''
    expect(ghostText.replace(/\u00a0/g, ' ')).toBe(LINES.ofTheStranger)
  })

  it('FE-NOFEAR-SHOW-009: raises the red vignette while the borders burn', () => {
    render(<NoFearShow onClose={vi.fn()} />)

    frame(12.1)
    expect(lineText()).toBe(LINES.fearTool)
    expect(audio().setAct).toHaveBeenLastCalledWith('dread')
    expect(document.querySelector('.fz-vignette')).not.toBeNull()

    frame(18.6)
    expect(lineText()).toBe(LINES.hateTrade)
    expect(document.querySelector('.fz-vignette')).not.toBeNull()

    frame(26.1)
    expect(document.querySelector('.fz-vignette')).toBeNull()
  })

  it('FE-NOFEAR-SHOW-010: strobes the staccato words and hides the line inside a flash window', () => {
    render(<NoFearShow onClose={vi.fn()} />)

    frame(18.6)
    expect(lineText()).toBe(LINES.hateTrade)

    frame(22.5)
    expect(screen.getByText('FEAR.')).toBeInTheDocument()
    expect(document.querySelector('.fz-line')).toBeNull()

    frame(23.8)
    expect(screen.getByText('HATRED.')).toBeInTheDocument()

    frame(25.2)
    expect(screen.getByText('WALLS.')).toBeInTheDocument()

    frame(25.8)
    expect(document.querySelector('.fz-flash')).toBeNull()
    expect(lineText()).toBe(LINES.hateTrade)
  })

  it('FE-NOFEAR-SHOW-011: cuts to silence with no line at all', () => {
    render(<NoFearShow onClose={vi.fn()} />)

    frame(18.6)
    frame(26.2)

    expect(audio().setAct).toHaveBeenLastCalledWith('silence')
    expect(document.querySelector('.fz-line:not(.fz-line-ghost)')).toBeNull()
  })

  it('FE-NOFEAR-SHOW-012: swells into the soft pivot line', () => {
    render(<NoFearShow onClose={vi.fn()} />)

    frame(26.2)
    frame(28.6)

    expect(lineText()).toBe(LINES.butYouTraveled)
    expect(document.querySelector('.fz-line-soft')).not.toBeNull()
    expect(audio().swell).toHaveBeenCalledTimes(1)
  })

  it('FE-NOFEAR-SHOW-013: reveals hope-act lines sentence by sentence', () => {
    render(<NoFearShow onClose={vi.fn()} />)

    frame(34.1)

    expect(audio().setAct).toHaveBeenLastCalledWith('hope')
    expect(lineText()).toBe(LINES.tables)
    const segments = document.querySelectorAll('.fz-seg')
    expect(segments).toHaveLength(3)
    expect(segments[0].textContent?.trim()).toBe('You have eaten at foreign tables.')
    expect((segments[2] as HTMLElement).style.animationDelay).toBe('1.9s')
  })

  it('FE-NOFEAR-SHOW-014: renders the hard line unsegmented and punches the audio', () => {
    render(<NoFearShow onClose={vi.fn()} />)

    frame(34.1)
    frame(64.1)

    expect(lineText()).toBe(LINES.notAnOpinion)
    expect(document.querySelector('.fz-line-hard')).not.toBeNull()
    expect(document.querySelectorAll('.fz-seg')).toHaveLength(0)
    expect(audio().impact).toHaveBeenCalledWith(1)
  })

  it('FE-NOFEAR-SHOW-015: falls back to the generic line when the traveler has no data', async () => {
    render(<NoFearShow onClose={vi.fn()} />)
    await flush()

    frame(55.6)
    expect(lineText()).toBe(LINES.everyDot)
    expect(audio().impact).toHaveBeenCalledWith(0.35)

    frame(58.9)
    expect(lineText()).toBe(LINES.everyDot)
    expect(scene().setPersonalPlaces).not.toHaveBeenCalled()
  })

  it('FE-NOFEAR-SHOW-016: feeds the traveler places into the scene and states the country count', async () => {
    vi.mocked(tripsApi.list).mockResolvedValue([{ id: 1 }, { id: 2 }])
    vi.mocked(placesApi.list).mockResolvedValue([
      { lat: 48.1, lng: 11.5 },
      { lat: 52.5, lng: 13.4 },
      { lat: null, lng: 9.9 },
    ])
    vi.mocked(apiClient.get).mockResolvedValue({ data: { stats: { totalCountries: 9 } } })

    render(<NoFearShow onClose={vi.fn()} />)
    await flush()

    expect(scene().setPersonalPlaces).toHaveBeenCalledWith([
      { lat: 48.1, lng: 11.5 },
      { lat: 52.5, lng: 13.4 },
      { lat: 48.1, lng: 11.5 },
      { lat: 52.5, lng: 13.4 },
    ])

    frame(55.6)
    expect(lineText()).toBe(LINES.yourPlaces)

    frame(58.9)
    expect(lineText()).toBe('4 places. 9 countries. And not once did the world hurt you.')
  })

  it('FE-NOFEAR-SHOW-017: falls back to trip counts when Atlas reports no countries', async () => {
    vi.mocked(tripsApi.list).mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }])
    vi.mocked(placesApi.list).mockResolvedValue([{ lat: 1, lng: 2 }])
    vi.mocked(apiClient.get).mockResolvedValue({ data: { stats: { totalCountries: 0 } } })

    render(<NoFearShow onClose={vi.fn()} />)
    await flush()

    frame(58.9)

    expect(lineText()).toBe('3 places. 3 journeys. And not once did the world hurt you.')
  })

  it('FE-NOFEAR-SHOW-018: falls back to trip counts when the Atlas request fails', async () => {
    vi.mocked(tripsApi.list).mockResolvedValue([{ id: 7 }])
    vi.mocked(placesApi.list).mockResolvedValue([
      { lat: 1, lng: 2 },
      { lat: 3, lng: 4 },
      { lat: 5, lng: 6 },
    ])

    render(<NoFearShow onClose={vi.fn()} />)
    await flush()

    frame(58.9)

    expect(lineText()).toBe('3 places. 1 journeys. And not once did the world hurt you.')
  })

  it('FE-NOFEAR-SHOW-019: ignores a trip whose places fail to load and skips thin data sets', async () => {
    vi.mocked(tripsApi.list).mockResolvedValue([{ id: 1 }, { id: 2 }])
    vi.mocked(placesApi.list)
      .mockResolvedValueOnce([{ lat: 1, lng: 2 }])
      .mockRejectedValueOnce(new Error('boom'))

    render(<NoFearShow onClose={vi.fn()} />)
    await flush()

    expect(scene().setPersonalPlaces).not.toHaveBeenCalled()
  })

  it('FE-NOFEAR-SHOW-020: survives a failing trip list', async () => {
    vi.mocked(tripsApi.list).mockRejectedValue(new Error('offline'))

    render(<NoFearShow onClose={vi.fn()} />)
    await flush()

    frame(58.9)

    expect(lineText()).toBe(LINES.everyDot)
    expect(scene().setPersonalPlaces).not.toHaveBeenCalled()
  })

  it('FE-NOFEAR-SHOW-021: ignores a non-array trip response', async () => {
    vi.mocked(tripsApi.list).mockResolvedValue({ trips: [] })

    render(<NoFearShow onClose={vi.fn()} />)
    await flush()

    expect(placesApi.list).not.toHaveBeenCalled()
    expect(scene().setPersonalPlaces).not.toHaveBeenCalled()
  })

  it('FE-NOFEAR-SHOW-022: drops late place results after unmount', async () => {
    let releasePlaces: (value: { lat: number; lng: number }[]) => void = () => {}
    vi.mocked(tripsApi.list).mockResolvedValue([{ id: 1 }])
    vi.mocked(placesApi.list).mockReturnValue(new Promise(resolve => { releasePlaces = resolve }))

    const { unmount } = render(<NoFearShow onClose={vi.fn()} />)
    await flush()
    unmount()
    releasePlaces([{ lat: 1, lng: 2 }, { lat: 3, lng: 4 }, { lat: 5, lng: 6 }])
    await flush()

    expect(scene().setPersonalPlaces).not.toHaveBeenCalled()
  })

  it('FE-NOFEAR-SHOW-023: pauses the clock while the tab is hidden', () => {
    render(<NoFearShow onClose={vi.fn()} />)
    frame(10)
    expect(lineText()).toBe(LINES.ofTheStranger)

    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    act(() => { document.dispatchEvent(new Event('visibilitychange')) })
    expect(audio().setSuspended).toHaveBeenCalledWith(true)

    nowMs = 30_000
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
    act(() => { document.dispatchEvent(new Event('visibilitychange')) })
    expect(audio().setSuspended).toHaveBeenLastCalledWith(false)

    // 21s of wall clock passed, but the show only advanced 1s.
    frame(31)
    expect(lineText()).toBe(LINES.ofTheStranger)

    Reflect.deleteProperty(document, 'hidden')
  })

  it('FE-NOFEAR-SHOW-024: resumes audio on any pointer gesture', () => {
    render(<NoFearShow onClose={vi.fn()} />)

    act(() => { window.dispatchEvent(new Event('pointerdown')) })

    expect(audio().resume).toHaveBeenCalledTimes(1)
  })

  it('FE-NOFEAR-SHOW-025: closes on Escape and ignores other keys', () => {
    const onClose = vi.fn()
    render(<NoFearShow onClose={onClose} />)

    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' })) })
    expect(onClose).not.toHaveBeenCalled()

    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })) })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('FE-NOFEAR-SHOW-026: closes through the chrome button', () => {
    const onClose = vi.fn()
    render(<NoFearShow onClose={onClose} />)

    act(() => { screen.getByRole('button', { name: 'Carry it on' }).click() })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('FE-NOFEAR-SHOW-027: toggles mute and relabels the button', () => {
    render(<NoFearShow onClose={vi.fn()} />)

    act(() => { screen.getByRole('button', { name: 'Sound off' }).click() })
    expect(audio().setMuted).toHaveBeenCalledWith(true)

    act(() => { screen.getByRole('button', { name: 'Sound on' }).click() })
    expect(audio().setMuted).toHaveBeenLastCalledWith(false)
  })

  it('FE-NOFEAR-SHOW-028: skip jumps straight to the anthem and retires the skip button', () => {
    render(<NoFearShow onClose={vi.fn()} />)
    frame(5)
    expect(lineText()).toBe(LINES.afraid)

    act(() => { screen.getByRole('button', { name: 'Skip' }).click() })

    expect(audio().setAct).toHaveBeenLastCalledWith('anthem')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('NO FEAR')
    expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull()
    expect(document.querySelector('.fz-line')).toBeNull()
  })

  it('FE-NOFEAR-SHOW-029: closes the show with the anthem cascade in every other language', () => {
    render(<NoFearShow onClose={vi.fn()} />)

    frame(71.2)

    expect(audio().setAct).toHaveBeenLastCalledWith('anthem')
    expect(audio().impact).toHaveBeenLastCalledWith(0.8)
    const cascade = document.querySelectorAll('.fz-cascade-item')
    expect(cascade).toHaveLength(22)
    expect(cascade[0].textContent).toBe('Keine Angst')
    expect(screen.queryByText('No fear')).toBeNull()
  })

  it('FE-NOFEAR-SHOW-030: condenses the anthem title out of one lazily built particle assembly', () => {
    vi.spyOn(HTMLHeadingElement.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 100, top: 200, width: 300, height: 60,
    } as unknown as DOMRect)

    render(<NoFearShow onClose={vi.fn()} />)

    // The title only exists from the frame after the anthem state flipped.
    frame(71.2)
    expect(stubs.assembly).toHaveLength(0)

    frame(72)
    expect(stubs.assembly).toHaveLength(1)
    expect(stubs.assembly[0].init).toHaveBeenCalledWith(
      'NO FEAR',
      expect.any(String),
      { left: 100, top: 200, width: 300, height: 60 },
      800,
      600,
    )
    const [drawCtx, progress, fade, drawT] = stubs.assembly[0].draw.mock.calls[0] as [unknown, number, number, number]
    expect(drawCtx).toBe(ctxStub)
    expect(progress).toBeCloseTo(0.1875, 6)
    expect(fade).toBe(0)
    expect(drawT).toBe(72)
    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('fz-word-hidden')

    frame(76)
    expect(stubs.assembly).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).not.toHaveClass('fz-word-hidden')
  })

  it('FE-NOFEAR-SHOW-031: tears down chrome, listeners and audio on unmount', () => {
    const { unmount } = render(<NoFearShow onClose={vi.fn()} />)
    const onClose = vi.fn()
    const layoutCalls = scene().layout.mock.calls.length

    unmount()

    expect(document.body).not.toHaveClass('fz-show-open')
    expect(audio().dispose).toHaveBeenCalledTimes(1)
    expect(cancelSpy).toHaveBeenCalled()

    window.dispatchEvent(new Event('resize'))
    window.dispatchEvent(new Event('pointerdown'))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(scene().layout.mock.calls.length).toBe(layoutCalls)
    expect(audio().resume).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('FE-NOFEAR-SHOW-032: reduced motion renders the finale as one static frame without audio', () => {
    setReducedMotion(true)

    render(<NoFearShow onClose={vi.fn()} />)

    expect(audio().start).not.toHaveBeenCalled()
    expect(audio().setAct).toHaveBeenCalledWith('anthem')
    expect(requestAnimationFrame).not.toHaveBeenCalled()
    expect(scene().draw).toHaveBeenCalledTimes(1)
    const [, state, t] = scene().draw.mock.calls[0] as [unknown, { particles: number; opacity: number }, number]
    expect(state.particles).toBe(0)
    expect(state.opacity).toBe(1)
    expect(t).toBe(79)
    expect(screen.getByRole('heading', { level: 1 })).not.toHaveClass('fz-word-assembled')
  })

  it('FE-NOFEAR-SHOW-033: still runs the show when the canvas has no 2d context', () => {
    ctxStub = null

    render(<NoFearShow onClose={vi.fn()} />)
    frame(12.1)

    expect(lineText()).toBe(LINES.fearTool)
    expect(scene().draw).not.toHaveBeenCalled()
    expect(stubs.assembly).toHaveLength(0)
  })

  it('FE-NOFEAR-SHOW-034: dims the world through the blackout and brings it back with the hope act', () => {
    render(<NoFearShow onClose={vi.fn()} />)

    frame(20)
    expect(lastSceneState().opacity).toBe(1)

    frame(27)
    expect(lastSceneState().opacity).toBe(0)

    frame(31)
    expect(lastSceneState().opacity).toBeGreaterThan(0.8)
    expect(lastSceneState().opacity).toBeLessThan(1)

    frame(32)
    expect(lastSceneState().opacity).toBe(1)
  })

  it('FE-NOFEAR-SHOW-035: falls back to a pixel ratio of 1 when the browser reports none', () => {
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, writable: true, value: 0 })

    render(<NoFearShow onClose={vi.fn()} />)

    expect(canvas().width).toBe(800)
    expect(ctxStub?.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0)
  })
})
