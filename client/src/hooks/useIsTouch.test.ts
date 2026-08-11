import { describe, it, expect, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIsTouch } from './useIsTouch'

type Listener = (e: MediaQueryListEvent) => void

/** Fake matchMedia that matches only `(pointer: coarse)` and can fire a change. */
function mockPointer(coarse: boolean) {
  const listeners: Listener[] = []
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
    matches: query === '(pointer: coarse)' ? coarse : false,
    media: query,
    addEventListener: (_: string, l: Listener) => listeners.push(l),
    removeEventListener: (_: string, l: Listener) => {
      const i = listeners.indexOf(l)
      if (i >= 0) listeners.splice(i, 1)
    },
  }) as unknown as MediaQueryList)
  return { fire: (matches: boolean) => listeners.forEach(l => l({ matches } as MediaQueryListEvent)) }
}

describe('useIsTouch', () => {
  afterEach(() => vi.restoreAllMocks())

  // A tablet is a coarse-pointer device at a desktop width, so a width check misses it —
  // which is what left the places list undraggable-but-unscrollable on iPad (#1432).
  it('is true when the primary pointer is coarse, regardless of viewport width', () => {
    mockPointer(true)
    const { result } = renderHook(() => useIsTouch())
    expect(result.current).toBe(true)
  })

  it('is false on a mouse-driven desktop', () => {
    mockPointer(false)
    const { result } = renderHook(() => useIsTouch())
    expect(result.current).toBe(false)
  })

  it('reacts when the pointer type changes', () => {
    const mq = mockPointer(false)
    const { result } = renderHook(() => useIsTouch())
    expect(result.current).toBe(false)
    act(() => mq.fire(true))
    expect(result.current).toBe(true)
  })
})
