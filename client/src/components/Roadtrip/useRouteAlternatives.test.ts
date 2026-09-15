import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { calculateAlternatives, calculateRoute } = vi.hoisted(() => ({
  calculateAlternatives: vi.fn(),
  calculateRoute: vi.fn(),
}))
vi.mock('../Map/RouteCalculator', () => ({ calculateAlternatives, calculateRoute }))

import { useRouteAlternatives } from './useRouteAlternatives'
import type { RoadtripStop } from './useRoadtripRoutes'
import type { RoadtripVia } from '@trek/shared'

/**
 * FE-ALTHOOK-001..009 — asking for other ways of driving one leg.
 *
 * The case that carries the feature: when the leg already carries vias, the road
 * actually being driven is NOT among what the router offers for the two bare
 * endpoints, because it was asked a different question. Without fetching it
 * separately, opening the picker on a leg you have already reshaped shows three
 * roads, none of which is the one you are on, and no way back to it.
 */

const from = { lat: 53.55, lng: 9.99 } as RoadtripStop
const to = { lat: 52.52, lng: 13.4 } as RoadtripStop
const via = (lat: number, lng: number): RoadtripVia =>
  ({ id: 1, day_id: 4, after_order_index: 0, sequence: 0, lat, lng })

const route = (over: Record<string, unknown> = {}) => ({
  coordinates: [[53.55, 9.99], [52.52, 13.4]],
  distance: 290_000,
  duration: 10_800,
  divergence: { lat: 53, lng: 11 },
  ...over,
})

beforeEach(() => {
  calculateAlternatives.mockReset().mockResolvedValue([route(), route({ distance: 310_000, duration: 11_400 })])
  calculateRoute.mockReset().mockResolvedValue(route({ distance: 340_000, duration: 12_600 }))
})

describe('useRouteAlternatives', () => {
  it('FE-ALTHOOK-001: nothing is open until somebody asks', () => {
    const { result } = renderHook(() => useRouteAlternatives())
    expect(result.current.open).toBeNull()
    expect(calculateAlternatives).not.toHaveBeenCalled()
  })

  it('FE-ALTHOOK-002: asking opens on a loading state, then fills it', async () => {
    const { result } = renderHook(() => useRouteAlternatives())

    act(() => { result.current.ask(4, 1, from, to, 'driving', []) })
    expect(result.current.open).toMatchObject({ dayId: 4, index: 1, loading: true, routes: [] })

    await waitFor(() => expect(result.current.open?.loading).toBe(false))
    expect(result.current.open?.routes).toHaveLength(2)
    // The router's own first answer is the direct one, which is what "no detour
    // at all" means when it is chosen.
    expect(result.current.open?.routes[0].direct).toBe(true)
    expect(result.current.open?.routes[1].direct).toBe(false)
  })

  it('FE-ALTHOOK-003: a bare leg is not asked for the road it is already driving', () => {
    const { result } = renderHook(() => useRouteAlternatives())
    act(() => { result.current.ask(4, 1, from, to, 'driving', []) })
    expect(calculateRoute).not.toHaveBeenCalled()
  })

  it('FE-ALTHOOK-004: a bent leg puts the road being driven at the top', async () => {
    const { result } = renderHook(() => useRouteAlternatives())

    act(() => { result.current.ask(4, 1, from, to, 'driving', [via(53, 11.5)]) })
    await waitFor(() => expect(result.current.open?.loading).toBe(false))

    expect(result.current.open?.routes[0]).toMatchObject({ current: true, distance: 340_000 })
    expect(result.current.open?.routes).toHaveLength(3)
    // Routed through the via, not between the bare ends.
    expect(calculateRoute).toHaveBeenCalledWith(
      [{ lat: 53.55, lng: 9.99 }, { lat: 53, lng: 11.5 }, { lat: 52.52, lng: 13.4 }],
      'driving',
      expect.anything(),
    )
  })

  it('FE-ALTHOOK-005: a via that barely moves the route is one road, not two', async () => {
    // Two lines are the same road if their ends and their length agree closely
    // enough. Listing it twice offers a choice that is not one.
    calculateRoute.mockResolvedValue(route({ distance: 290_020, duration: 10_810 }))
    const { result } = renderHook(() => useRouteAlternatives())

    act(() => { result.current.ask(4, 1, from, to, 'driving', [via(53, 11)]) })
    await waitFor(() => expect(result.current.open?.loading).toBe(false))

    expect(result.current.open?.routes).toHaveLength(2)
    expect(result.current.open?.routes.some(r => r.current)).toBe(false)
  })

  it('FE-ALTHOOK-006: the driven road failing costs that entry, not the dialog', async () => {
    calculateRoute.mockRejectedValue(new Error('osrm down'))
    const { result } = renderHook(() => useRouteAlternatives())

    act(() => { result.current.ask(4, 1, from, to, 'driving', [via(53, 11.5)]) })
    await waitFor(() => expect(result.current.open?.loading).toBe(false))

    expect(result.current.open?.error).toBe(false)
    expect(result.current.open?.routes).toHaveLength(2)
  })

  it('FE-ALTHOOK-007: a router that will not answer says so instead of showing nothing', async () => {
    calculateAlternatives.mockRejectedValue(new Error('osrm down'))
    const { result } = renderHook(() => useRouteAlternatives())

    act(() => { result.current.ask(4, 1, from, to, 'driving', []) })
    await waitFor(() => expect(result.current.open?.loading).toBe(false))

    expect(result.current.open).toMatchObject({ error: true, routes: [] })
  })

  it('FE-ALTHOOK-008: only driving, walking and cycling reach the router', () => {
    const { result } = renderHook(() => useRouteAlternatives())

    for (const [asked, sent] of [['walking', 'walking'], ['cycling', 'cycling'], ['transit', 'driving'], ['plugin:ferry', 'driving']]) {
      calculateAlternatives.mockClear()
      act(() => { result.current.ask(4, 1, from, to, asked, []) })
      expect(calculateAlternatives.mock.calls[0][2], asked).toBe(sent)
    }
  })

  it('FE-ALTHOOK-009: asking again abandons the answer still in flight', async () => {
    // Two clicks in a row must not let the first answer land on top of the
    // second: the picker would then describe a leg nobody is looking at.
    const signals: AbortSignal[] = []
    calculateAlternatives.mockImplementation((_a: unknown, _b: unknown, _p: unknown, opts: { signal: AbortSignal }) => {
      signals.push(opts.signal)
      return new Promise(() => {})
    })
    const { result } = renderHook(() => useRouteAlternatives())

    act(() => { result.current.ask(4, 1, from, to, 'driving', []) })
    act(() => { result.current.ask(4, 2, from, to, 'driving', []) })

    expect(signals[0].aborted).toBe(true)
    expect(signals[1].aborted).toBe(false)
    expect(result.current.open?.index).toBe(2)

    act(() => { result.current.close() })
    expect(signals[1].aborted).toBe(true)
    expect(result.current.open).toBeNull()
  })
})
