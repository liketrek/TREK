import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAnchoredPosition, useRemeasureSignal, scrollAnchorIntoView } from './useAnchoredPosition'

/** A trigger whose rect we can move between measurements. */
function anchorAt(top: number, height = 40, left = 20, width = 200) {
  const el = document.createElement('div')
  el.getBoundingClientRect = () => ({
    top, bottom: top + height, left, right: left + width, width, height,
    x: left, y: top, toJSON: () => ({}),
  }) as DOMRect
  document.body.appendChild(el)
  return el
}

const setViewport = (h: number) => Object.defineProperty(window, 'innerHeight', { value: h, configurable: true })

describe('useAnchoredPosition', () => {
  beforeEach(() => {
    setViewport(800)
    Object.defineProperty(window, 'visualViewport', { value: undefined, configurable: true })
  })
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('FE-ANCHOR-001: reports nothing while closed', () => {
    const ref = { current: anchorAt(100) }
    const { result } = renderHook(() => useAnchoredPosition(ref, false))
    expect(result.current).toBeNull()
  })

  it('FE-ANCHOR-002: hangs the panel under the trigger with the trigger width', () => {
    const ref = { current: anchorAt(100) }
    const { result } = renderHook(() => useAnchoredPosition(ref, true))
    expect(result.current).toMatchObject({ top: 144, left: 20, width: 200, flipped: false })
  })

  it('FE-ANCHOR-003: re-measures when a scroll moves the trigger (#1999)', () => {
    const el = anchorAt(100)
    const ref = { current: el }
    const { result } = renderHook(() => useAnchoredPosition(ref, true))
    expect(result.current?.top).toBe(144)

    // The trigger scrolled 200px up; the panel has to follow it.
    el.getBoundingClientRect = () => ({
      top: -100, bottom: -60, left: 20, right: 220, width: 200, height: 40,
      x: 20, y: -100, toJSON: () => ({}),
    }) as DOMRect
    act(() => { window.dispatchEvent(new Event('scroll')) })

    expect(result.current?.top).toBe(-56)
  })

  it('FE-ANCHOR-004: flips above the trigger when there is no room below', () => {
    const ref = { current: anchorAt(760) }
    const { result } = renderHook(() => useAnchoredPosition(ref, true))
    expect(result.current?.flipped).toBe(true)
    expect(result.current?.bottom).toBe(44) // innerHeight 800 - top 760 + gap 4
  })

  it('FE-ANCHOR-005: shrinks maxHeight into the band a keyboard leaves over (#2000)', () => {
    const ref = { current: anchorAt(300) }
    const { result, rerender } = renderHook(() => useAnchoredPosition(ref, true))
    const roomy = result.current!.maxHeight

    // Keyboard takes the bottom 460px: visualViewport reports the rest.
    Object.defineProperty(window, 'visualViewport', {
      value: { height: 340, offsetTop: 0, addEventListener: vi.fn(), removeEventListener: vi.fn() },
      configurable: true,
    })
    act(() => { rerender() })
    act(() => { window.dispatchEvent(new Event('resize')) })

    expect(result.current!.maxHeight).toBeLessThan(roomy)
  })

  it('FE-ANCHOR-006: survives a visualViewport that has no listeners', () => {
    Object.defineProperty(window, 'visualViewport', { value: { height: 900 }, configurable: true })
    const ref = { current: anchorAt(100) }
    expect(() => renderHook(() => useAnchoredPosition(ref, true))).not.toThrow()
  })

  it('FE-ANCHOR-007: unsubscribes when it closes', () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    const ref = { current: anchorAt(100) }
    const { unmount } = renderHook(() => useAnchoredPosition(ref, true))
    unmount()
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function), true)
  })
})

describe('useRemeasureSignal', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('FE-ANCHOR-010: ticks on scroll while open, and not while closed', () => {
    const { result, rerender } = renderHook(({ open }) => useRemeasureSignal(open), {
      initialProps: { open: false },
    })
    act(() => { window.dispatchEvent(new Event('scroll')) })
    expect(result.current).toBe(0)

    rerender({ open: true })
    act(() => { window.dispatchEvent(new Event('scroll')) })
    expect(result.current).toBeGreaterThan(0)
  })
})

describe('scrollAnchorIntoView', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    Object.defineProperty(window, 'visualViewport', { value: undefined, configurable: true })
  })

  it('FE-ANCHOR-020: does nothing without a visualViewport', () => {
    expect(() => scrollAnchorIntoView(anchorAt(100))).not.toThrow()
  })

  it('FE-ANCHOR-021: leaves the scroll alone when nothing shrank', () => {
    setViewport(800)
    const listeners: Record<string, () => void> = {}
    Object.defineProperty(window, 'visualViewport', {
      value: {
        height: 800, offsetTop: 0,
        addEventListener: (e: string, fn: () => void) => { listeners[e] = fn },
        removeEventListener: () => {},
      },
      configurable: true,
    })
    const scrollBy = vi.fn()
    Object.defineProperty(window, 'scrollBy', { value: scrollBy, configurable: true })

    scrollAnchorIntoView(anchorAt(100))
    listeners.resize?.()

    expect(scrollBy).not.toHaveBeenCalled()
  })

  it('FE-ANCHOR-022: nudges the page up by exactly the overflow when a keyboard appears', () => {
    setViewport(800)
    const listeners: Record<string, () => void> = {}
    Object.defineProperty(window, 'visualViewport', {
      value: {
        height: 400, offsetTop: 0,
        addEventListener: (e: string, fn: () => void) => { listeners[e] = fn },
        removeEventListener: () => {},
      },
      configurable: true,
    })
    const scrollBy = vi.fn()
    Object.defineProperty(window, 'scrollBy', { value: scrollBy, configurable: true })

    // Trigger bottom 340 + gap 4 + 220 panel = 564, visible bottom 400 → 164 over.
    scrollAnchorIntoView(anchorAt(300))
    listeners.resize?.()

    expect(scrollBy).toHaveBeenCalledWith({ top: 164, behavior: 'smooth' })
  })
})
