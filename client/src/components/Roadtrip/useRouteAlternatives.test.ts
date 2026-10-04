import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { calculateAlternatives } = vi.hoisted(() => ({ calculateAlternatives: vi.fn() }))
// Only the router call is replaced. `sameRoad` stays the real one, because whether an offer
// is the road already driven is exactly what these cases are about.
vi.mock('../Map/RouteCalculator', async importOriginal => ({
  ...(await importOriginal<typeof import('../Map/RouteCalculator')>()),
  calculateAlternatives,
}))

import { ARRIVING_DRIVE, openOn, sameDrive, useRouteAlternatives, type AlternativesRequest } from './useRouteAlternatives'
import type { RailLegRouter } from './useRoadtripRoutes'

/**
 * FE-ALTHOOK-001..015: asking for other ways of driving one leg.
 *
 * The case that carries the feature: the road the rail drives is always the first entry,
 * taken from the rail, and the offers come from the engine the rail drives the leg with.
 * Asked for separately from OSRM with nothing avoided, the list had no current road at all
 * on a trip that avoids something, called a road the rail was not on the fastest, and
 * choosing that one did nothing.
 */

/** The road the rail drives from Hamburg to Berlin, and two others. */
const RAIL: [number, number][] = [[53.55, 9.99], [53.0, 11.5], [52.52, 13.4]]
const NORTH: [number, number][] = [[53.55, 9.99], [53.6, 11.5], [52.52, 13.4]]
const SOUTH: [number, number][] = [[53.55, 9.99], [52.4, 11.5], [52.52, 13.4]]

const offer = (coordinates: [number, number][], over: Record<string, unknown> = {}) => ({
  coordinates,
  distance: 300_000,
  duration: 11_000,
  divergence: null,
  ...over,
})

const route = vi.fn()

function request(router: Partial<RailLegRouter> = {}, over: Partial<AlternativesRequest> = {}): AlternativesRequest {
  return {
    dayId: 4,
    drive: { kind: 'leg', index: 1 },
    from: { lat: 53.55, lng: 9.99 },
    to: { lat: 52.52, lng: 13.4 },
    driven: { coordinates: RAIL, distance: 290_000, duration: 10_800 },
    anchor: { dayId: 3, afterIndex: 2 },
    ends: { from: 11, to: 12 },
    router: { mode: 'driving', avoid: [], engine: 'osrm', standIn: false, route, ...router },
    ...over,
  }
}

beforeEach(() => {
  calculateAlternatives.mockReset().mockResolvedValue([offer(NORTH), offer(SOUTH, { distance: 310_000, duration: 11_400 })])
})

describe('useRouteAlternatives', () => {
  it('FE-ALTHOOK-001: nothing is open until somebody asks', () => {
    const { result } = renderHook(() => useRouteAlternatives())
    expect(result.current.open).toBeNull()
    expect(calculateAlternatives).not.toHaveBeenCalled()
  })

  it('FE-ALTHOOK-002: asking opens on a loading state that already knows where a choice goes, then fills it', async () => {
    const { result } = renderHook(() => useRouteAlternatives())

    act(() => { result.current.ask(request()) })
    expect(result.current.open).toMatchObject({
      dayId: 4, drive: { kind: 'leg', index: 1 }, loading: true, routes: [], proving: null, engine: 'osrm',
      anchor: { dayId: 3, afterIndex: 2 },
      ends: { from: 11, to: 12 },
    })
    expect(result.current.open?.route).toBe(route)

    await waitFor(() => expect(result.current.open?.loading).toBe(false))
    const routes = result.current.open!.routes
    expect(routes).toHaveLength(3)
    // The rail's road heads the list; the router's own first answer is the direct one.
    expect(routes[0]).toMatchObject({ current: true, coordinates: RAIL, distance: 290_000 })
    expect(routes[1]).toMatchObject({ direct: true, coordinates: NORTH })
    expect(routes[2]).toMatchObject({ direct: false, coordinates: SOUTH })
  })

  it('FE-ALTHOOK-003: the offers are asked with the mode and the classes the rail drives the leg with', () => {
    const { result } = renderHook(() => useRouteAlternatives())

    act(() => { result.current.ask(request({ avoid: ['toll'], engine: 'valhalla' })) })

    expect(calculateAlternatives).toHaveBeenCalledTimes(1)
    const [from, to, profile, options] = calculateAlternatives.mock.calls[0] as [unknown, unknown, string, { avoid: string[]; signal: AbortSignal }]
    expect([from, to, profile]).toEqual([{ lat: 53.55, lng: 9.99 }, { lat: 52.52, lng: 13.4 }, 'driving'])
    expect(options.avoid).toEqual(['toll'])
    expect(options.signal).toBeInstanceOf(AbortSignal)
  })

  it('FE-ALTHOOK-004: Current is the rail\'s own leg, priced by the rail\'s engine, and never asked for again', async () => {
    // A trip that avoids a class is driven by the second engine; its current road carries
    // that engine, so the overlays read every offer against it and not against OSRM.
    const { result } = renderHook(() => useRouteAlternatives())

    act(() => { result.current.ask(request({ avoid: ['ferry'], engine: 'valhalla' })) })
    await waitFor(() => expect(result.current.open?.loading).toBe(false))

    expect(result.current.open?.engine).toBe('valhalla')
    expect(result.current.open?.routes[0]).toMatchObject({ current: true, engine: 'valhalla', duration: 10_800 })
    // One question for the offers, none for the road already on the rail.
    expect(calculateAlternatives).toHaveBeenCalledTimes(1)
  })

  it('FE-ALTHOOK-005: an offer that is the road already driven is listed once, as Current, and says it is the router\'s own', async () => {
    // The same road from the router, a few metres off the rail's line and priced a little
    // differently. Two entries for it offered a choice that was not one; left unmarked,
    // the road the rail is on was drawn pale and another took the blue.
    calculateAlternatives.mockResolvedValue([
      offer([[53.5501, 9.99], [53.0001, 11.5], [52.5201, 13.4]], { distance: 291_000, duration: 10_500 }),
      offer(NORTH),
    ])
    const { result } = renderHook(() => useRouteAlternatives())

    act(() => { result.current.ask(request()) })
    await waitFor(() => expect(result.current.open?.loading).toBe(false))

    const routes = result.current.open!.routes
    expect(routes).toHaveLength(2)
    expect(routes[0]).toMatchObject({ current: true, direct: true, distance: 290_000 })
    expect(routes.filter(r => r.current)).toHaveLength(1)
    expect(routes[1]).toMatchObject({ direct: false, coordinates: NORTH })
  })

  it('FE-ALTHOOK-006: the driven road among the other offers is still one entry, without the direct mark', async () => {
    calculateAlternatives.mockResolvedValue([offer(NORTH), offer(RAIL)])
    const { result } = renderHook(() => useRouteAlternatives())

    act(() => { result.current.ask(request()) })
    await waitFor(() => expect(result.current.open?.loading).toBe(false))

    const routes = result.current.open!.routes
    expect(routes).toHaveLength(2)
    expect(routes[0].current).toBe(true)
    expect(routes[0].direct).toBeUndefined()
    expect(routes[1]).toMatchObject({ direct: true, coordinates: NORTH })
  })

  it('FE-ALTHOOK-007: a router that will not answer says so instead of showing nothing', async () => {
    calculateAlternatives.mockRejectedValue(new Error('valhalla down'))
    const { result } = renderHook(() => useRouteAlternatives())

    act(() => { result.current.ask(request()) })
    await waitFor(() => expect(result.current.open?.loading).toBe(false))

    expect(result.current.open).toMatchObject({ error: true, routes: [] })
  })

  it('FE-ALTHOOK-008: only driving, walking and cycling reach the router', () => {
    const { result } = renderHook(() => useRouteAlternatives())

    for (const [asked, sent] of [['walking', 'walking'], ['cycling', 'cycling'], ['transit', 'driving'], ['plugin:ev/fast', 'driving']]) {
      calculateAlternatives.mockClear()
      act(() => { result.current.ask(request({ mode: asked })) })
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

    act(() => { result.current.ask(request()) })
    act(() => { result.current.ask(request({}, { drive: { kind: 'leg', index: 2 } })) })

    expect(signals[0].aborted).toBe(true)
    expect(signals[1].aborted).toBe(false)
    expect(result.current.open?.drive).toEqual({ kind: 'leg', index: 2 })

    act(() => { result.current.close() })
    expect(signals[1].aborted).toBe(true)
    expect(result.current.open).toBeNull()
  })

  it('FE-ALTHOOK-010: the state keeps its identity until the picker itself changes', async () => {
    // The planner keys its close gate on this object. A new one per render ran that
    // effect on every render, so any render at all was a chance to close the picker.
    const { result, rerender } = renderHook(() => useRouteAlternatives())
    const idle = result.current
    rerender()
    expect(result.current).toBe(idle)

    act(() => { result.current.ask(request()) })
    const asking = result.current
    expect(asking).not.toBe(idle)
    // The functions themselves never change, only the object carrying the new `open`.
    expect(asking.ask).toBe(idle.ask)
    expect(asking.close).toBe(idle.close)
    expect(asking.prove).toBe(idle.prove)
    expect(asking.settle).toBe(idle.settle)

    await waitFor(() => expect(result.current.open?.loading).toBe(false))
    const answered = result.current
    rerender()
    expect(result.current).toBe(answered)
  })

  it('FE-ALTHOOK-011: checking a choice marks it on the picker, and closing abandons the check', async () => {
    const { result } = renderHook(() => useRouteAlternatives())
    act(() => { result.current.ask(request()) })
    await waitFor(() => expect(result.current.open?.loading).toBe(false))

    let signal: AbortSignal | undefined
    act(() => { signal = result.current.prove(2) })
    expect(result.current.open?.proving).toBe(2)
    expect(signal?.aborted).toBe(false)

    // A check that led to no save leaves the picker open for another choice.
    act(() => { result.current.settle() })
    expect(result.current.open?.proving).toBeNull()
    expect(result.current.open?.routes).toHaveLength(3)

    act(() => { signal = result.current.prove(1) })
    act(() => { result.current.close() })
    expect(signal?.aborted).toBe(true)
    expect(result.current.open).toBeNull()
  })

  it('FE-ALTHOOK-012: another leg, or another check, abandons the one in hand', async () => {
    // The router's answer to an abandoned check must not be written onto the leg opened
    // after it, nor race the check that replaced it.
    const { result } = renderHook(() => useRouteAlternatives())
    act(() => { result.current.ask(request()) })
    await waitFor(() => expect(result.current.open?.loading).toBe(false))

    let first: AbortSignal | undefined
    let second: AbortSignal | undefined
    act(() => { first = result.current.prove(1) })
    act(() => { second = result.current.prove(2) })
    expect(first?.aborted).toBe(true)
    expect(second?.aborted).toBe(false)

    act(() => { result.current.ask(request({}, { drive: { kind: 'leg', index: 0 } })) })
    expect(second?.aborted).toBe(true)
    expect(result.current.open).toMatchObject({ drive: { kind: 'leg', index: 0 }, proving: null })

    // Nothing open, nothing to mark.
    act(() => { result.current.close() })
    act(() => { result.current.prove(1) })
    act(() => { result.current.settle() })
    expect(result.current.open).toBeNull()
  })
})

describe('a leg OSRM drew while the rail’s engine did not answer', () => {
  it('FE-ALTHOOK-014: Current is marked as OSRM’s line, and the picker knows the leg was drawn by the stand-in', async () => {
    // Marked as the rail's engine, the stand-in line was set against the second engine's
    // offers as if one speed model had timed them all.
    const { result } = renderHook(() => useRouteAlternatives())

    act(() => { result.current.ask(request({ avoid: ['toll'], engine: 'valhalla', standIn: true })) })
    await waitFor(() => expect(result.current.open?.loading).toBe(false))

    expect(result.current.open).toMatchObject({ engine: 'valhalla', standIn: true })
    expect(result.current.open?.routes[0]).toMatchObject({ current: true, engine: 'osrm' })
  })

  it('FE-ALTHOOK-015: a check that saved nothing leaves its reason on the picker until the next one starts', async () => {
    const { result } = renderHook(() => useRouteAlternatives())
    act(() => { result.current.ask(request()) })
    await waitFor(() => expect(result.current.open?.loading).toBe(false))
    expect(result.current.open?.notice).toBeNull()

    act(() => { result.current.prove(1) })
    act(() => { result.current.settle('Not saved.') })
    expect(result.current.open).toMatchObject({ proving: null, notice: 'Not saved.' })

    act(() => { result.current.prove(2) })
    expect(result.current.open).toMatchObject({ proving: 2, notice: null })
    act(() => { result.current.settle() })
    expect(result.current.open?.notice).toBeNull()

    act(() => { result.current.settle('Not saved.') })
    act(() => { result.current.ask(request({}, { drive: { kind: 'leg', index: 0 } })) })
    expect(result.current.open?.notice).toBeNull()
  })
})

describe('which drive a picker is open on', () => {
  it('FE-ALTHOOK-013: the drive in from the day before is its own drive, never a leg at some index', () => {
    expect(sameDrive(ARRIVING_DRIVE, { kind: 'arriving' })).toBe(true)
    expect(sameDrive({ kind: 'leg', index: 0 }, { kind: 'leg', index: 0 })).toBe(true)
    expect(sameDrive({ kind: 'leg', index: 0 }, { kind: 'leg', index: 1 })).toBe(false)
    expect(sameDrive(ARRIVING_DRIVE, { kind: 'leg', index: 0 })).toBe(false)
    expect(sameDrive({ kind: 'leg', index: 0 }, ARRIVING_DRIVE)).toBe(false)

    const open = { dayId: 2, drive: ARRIVING_DRIVE }
    expect(openOn(open, 2, { kind: 'arriving' })).toBe(true)
    expect(openOn(open, 3, { kind: 'arriving' })).toBe(false)
    expect(openOn(open, 2, { kind: 'leg', index: 0 })).toBe(false)
    expect(openOn(null, 2, ARRIVING_DRIVE)).toBe(false)
  })
})
