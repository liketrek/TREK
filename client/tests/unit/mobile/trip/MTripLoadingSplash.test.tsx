import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '../../../helpers/render'
import MTripLoadingSplash from '../../../../src/mobile/screens/trip/MTripLoadingSplash'

// FE-MOB-SPLASH-001 to FE-MOB-SPLASH-012

const STEP_MS = 1400

const origMatchMedia = window.matchMedia

/** One shared query object per stub so a test can flip `matches` and notify. */
let mediaQuery: { matches: boolean; listeners: Set<() => void> }

function stubReducedMotion(matches: boolean) {
  mediaQuery = { matches, listeners: new Set() }
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    get matches() { return mediaQuery.matches },
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: (_type: string, fn: () => void) => mediaQuery.listeners.add(fn),
    removeEventListener: (_type: string, fn: () => void) => mediaQuery.listeners.delete(fn),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

function setReducedMotion(matches: boolean) {
  act(() => {
    mediaQuery.matches = matches
    mediaQuery.listeners.forEach(fn => fn())
  })
}

const tick = (ms: number) => act(() => { vi.advanceTimersByTime(ms) })

const dots = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('span[class*="h-[6px]"]'))

const activeDotIndex = (container: HTMLElement) =>
  dots(container).findIndex(d => d.className.includes('w-5'))

describe('MTripLoadingSplash', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    stubReducedMotion(false)
  })

  afterEach(() => {
    vi.useRealTimers()
    window.matchMedia = origMatchMedia
  })

  it('FE-MOB-SPLASH-001: opens on the packing beat with the trip title', () => {
    const { container } = render(<MTripLoadingSplash title="Japan 2026" />)

    expect(screen.getByText('Japan 2026')).toBeInTheDocument()
    expect(screen.getByText('Packing your bags...')).toBeInTheDocument()
    expect(container.querySelector('.trek--packing')).toBeTruthy()
  })

  it('FE-MOB-SPLASH-002: falls back to the TREK wordmark when the trip has no title', () => {
    render(<MTripLoadingSplash title="" />)

    expect(screen.getByText('TREK')).toBeInTheDocument()
  })

  it('FE-MOB-SPLASH-003: walks the four beats in order, one every 1400ms', () => {
    const { container } = render(<MTripLoadingSplash title="Japan 2026" />)

    tick(STEP_MS)
    expect(screen.getByText('Hitting the road...')).toBeInTheDocument()
    expect(container.querySelector('.trek--transport')).toBeTruthy()

    tick(STEP_MS)
    expect(screen.getByText('Loading place photos...')).toBeInTheDocument()
    expect(container.querySelector('.trek--dashboard')).toBeTruthy()

    tick(STEP_MS)
    expect(screen.getByText('Almost there...')).toBeInTheDocument()
    expect(container.querySelector('.trek--collections')).toBeTruthy()
  })

  it('FE-MOB-SPLASH-004: wraps back to the first beat after the last one', () => {
    render(<MTripLoadingSplash title="Japan 2026" />)

    tick(STEP_MS * 4)

    expect(screen.getByText('Packing your bags...')).toBeInTheDocument()
  })

  it('FE-MOB-SPLASH-005: does not advance before the beat is due', () => {
    render(<MTripLoadingSplash title="Japan 2026" />)

    tick(STEP_MS - 1)

    expect(screen.getByText('Packing your bags...')).toBeInTheDocument()
  })

  it('FE-MOB-SPLASH-006: the active dot tracks the current beat', () => {
    const { container } = render(<MTripLoadingSplash title="Japan 2026" />)

    expect(dots(container)).toHaveLength(4)
    expect(activeDotIndex(container)).toBe(0)

    tick(STEP_MS * 2)
    expect(activeDotIndex(container)).toBe(2)
  })

  it('FE-MOB-SPLASH-007: animates the mascot stage between beats', () => {
    const { container } = render(<MTripLoadingSplash title="Japan 2026" />)

    const stage = container.querySelector('.trek--packing')?.parentElement
    expect(stage).toHaveStyle({ animation: 'm-trek-beat 460ms cubic-bezier(.34,1.56,.64,1) both' })
  })

  it('FE-MOB-SPLASH-008: reduced motion parks on the photo beat and never advances', () => {
    stubReducedMotion(true)
    const { container } = render(<MTripLoadingSplash title="Japan 2026" />)

    expect(screen.getByText('Loading place photos...')).toBeInTheDocument()
    expect(activeDotIndex(container)).toBe(2)

    tick(STEP_MS * 3)

    expect(screen.getByText('Loading place photos...')).toBeInTheDocument()
    expect(activeDotIndex(container)).toBe(2)
  })

  it('FE-MOB-SPLASH-009: reduced motion drops the beat animation', () => {
    stubReducedMotion(true)
    const { container } = render(<MTripLoadingSplash title="Japan 2026" />)

    const stage = container.querySelector('.trek--dashboard')?.parentElement
    expect(stage?.getAttribute('style')).toBeNull()
  })

  it('FE-MOB-SPLASH-011: follows the OS setting while the splash is up', () => {
    const { container } = render(<MTripLoadingSplash title="Japan 2026" />)
    expect(screen.getByText('Packing your bags...')).toBeInTheDocument()

    setReducedMotion(true)

    expect(screen.getByText('Loading place photos...')).toBeInTheDocument()
    expect(activeDotIndex(container)).toBe(2)

    tick(STEP_MS * 2)
    expect(screen.getByText('Loading place photos...')).toBeInTheDocument()
  })

  it('FE-MOB-SPLASH-012: drops the media listener on unmount', () => {
    const { unmount } = render(<MTripLoadingSplash title="Japan 2026" />)

    expect(mediaQuery.listeners.size).toBe(1)
    unmount()

    expect(mediaQuery.listeners.size).toBe(0)
  })

  it('FE-MOB-SPLASH-010: clears its beat interval on unmount', () => {
    const before = vi.getTimerCount()
    const { unmount } = render(<MTripLoadingSplash title="Japan 2026" />)

    expect(vi.getTimerCount()).toBe(before + 1)

    unmount()

    expect(vi.getTimerCount()).toBe(before)
  })
})
