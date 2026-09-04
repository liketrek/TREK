import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useStableVias } from './viaMarkerState'
import type { RoadtripVia } from '@trek/shared'

/**
 * The list both map renderers rebuild their via handles from.
 *
 * Its identity is the whole contract: the GL renderer replaces the DOM element when this
 * changes, and a pointerdown belongs to the element it happened on. A list that changed
 * on every render meant a freshly placed via lost its first drag to the re-route landing
 * underneath it.
 */
const via = (over: Partial<RoadtripVia> & { id: number }): RoadtripVia => ({
  day_id: 1, after_order_index: 0, sequence: 0, lat: 48.1, lng: 2.1, ...over,
})

describe('useStableVias', () => {
  it('FE-VIASTATE-001: the same vias in a fresh object are the same list', () => {
    // Exactly what a reload hands down: identical rows, a new object every time.
    const { result, rerender } = renderHook(
      ({ byDay }) => useStableVias(byDay),
      { initialProps: { byDay: { 1: [via({ id: 5 })] } } },
    )
    const first = result.current

    rerender({ byDay: { 1: [via({ id: 5 })] } })
    expect(result.current).toBe(first)
  })

  it('FE-VIASTATE-002: a via that moved is a new list, so the handle is redrawn where it now is', () => {
    const { result, rerender } = renderHook(
      ({ byDay }) => useStableVias(byDay),
      { initialProps: { byDay: { 1: [via({ id: 5 })] } } },
    )
    const first = result.current

    rerender({ byDay: { 1: [via({ id: 5, lat: 48.9 })] } })
    expect(result.current).not.toBe(first)
    expect(result.current[0].lat).toBe(48.9)
  })

  it('FE-VIASTATE-003: adding or removing one is a new list too', () => {
    const { result, rerender } = renderHook(
      ({ byDay }) => useStableVias(byDay),
      { initialProps: { byDay: { 1: [via({ id: 5 })] } } },
    )
    const first = result.current

    rerender({ byDay: { 1: [via({ id: 5 }), via({ id: 6, lat: 48.4 })] } })
    expect(result.current).not.toBe(first)
    expect(result.current).toHaveLength(2)
  })

  it('FE-VIASTATE-004: every day of the trip is in one list, and no vias is a stable empty one', () => {
    const { result, rerender } = renderHook(
      ({ byDay }) => useStableVias(byDay),
      { initialProps: { byDay: { 1: [via({ id: 5 })], 2: [via({ id: 6, day_id: 2 })] } as Record<number, RoadtripVia[]> | undefined },
    })
    expect(result.current.map(v => v.id)).toEqual([5, 6])

    rerender({ byDay: undefined })
    const empty = result.current
    expect(empty).toEqual([])
    rerender({ byDay: {} })
    expect(result.current).toBe(empty)
  })
})
