import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Assignment, AssignmentsMap, Day } from '../../types'

const { calculateRouteWithLegs } = vi.hoisted(() => ({ calculateRouteWithLegs: vi.fn() }))
vi.mock('../Map/RouteCalculator', () => ({ calculateRouteWithLegs }))

import { useRoadtripRoutes } from './useRoadtripRoutes'

const HAMBURG: [number, number] = [53.5511, 9.9937]
const LUENEBURG: [number, number] = [53.2464, 10.4115]
const BERLIN: [number, number] = [52.52, 13.405]

interface StopSpec {
  id: number
  at: [number, number]
  time?: string | null
  dwell?: number | null
  legMode?: string | null
  incoming?: string | null
  noCoords?: boolean
}

function day(id: number, number: number, extra: Partial<Day> = {}): Day {
  return { id, day_number: number, date: null, title: null, ...extra } as unknown as Day
}

function assignment(spec: StopSpec, order: number): Assignment {
  return {
    id: spec.id,
    place_id: spec.id * 10,
    order_index: order,
    assignment_time: spec.time ?? null,
    leg_transport_mode: spec.legMode ?? null,
    incoming_leg_transport_mode: spec.incoming ?? null,
    place: {
      id: spec.id * 10,
      name: `Stop ${spec.id}`,
      lat: spec.noCoords ? null : spec.at[0],
      lng: spec.noCoords ? null : spec.at[1],
      place_time: null,
      duration_minutes: spec.dwell ?? null,
    },
  } as unknown as Assignment
}

const map = (dayId: number, stops: StopSpec[]): AssignmentsMap =>
  ({ [String(dayId)]: stops.map(assignment) }) as unknown as AssignmentsMap

/** A router answer with one leg per consecutive pair, the way OSRM replies. */
const routed = (legs: number, coordinates: [number, number][] = [HAMBURG, BERLIN]) => ({
  coordinates,
  distance: 100000,
  duration: 3600,
  legs: Array.from({ length: legs }, () => ({ distance: 100000 / legs, duration: 3600 / legs, text: '100 km' })),
})

beforeEach(() => {
  calculateRouteWithLegs.mockReset()
  calculateRouteWithLegs.mockResolvedValue(routed(1))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useRoadtripRoutes', () => {
  it('FE-ROADTRIP-ROUTES-001: routes a whole day in one request, not one per leg', async () => {
    const days = [day(1, 1)]
    const stops: StopSpec[] = [
      { id: 1, at: HAMBURG },
      { id: 2, at: LUENEBURG },
      { id: 3, at: BERLIN },
    ]
    calculateRouteWithLegs.mockResolvedValue(routed(2))

    const { result } = renderHook(() => useRoadtripRoutes(7, days, map(1, stops)))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(1)
    const [waypoints, options] = calculateRouteWithLegs.mock.calls[0]
    expect(waypoints).toHaveLength(3)
    expect(options).toMatchObject({ profile: 'driving', tripId: 7, dayId: 1 })
  })

  it('FE-ROADTRIP-ROUTES-002: a day whose legs are driven and cycled becomes two requests', async () => {
    const days = [day(1, 1)]
    const stops: StopSpec[] = [
      { id: 1, at: HAMBURG, legMode: 'driving' },
      { id: 2, at: LUENEBURG, legMode: 'cycling' },
      { id: 3, at: BERLIN },
    ]

    const { result } = renderHook(() => useRoadtripRoutes(7, days, map(1, stops)))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(2)
    const profiles = calculateRouteWithLegs.mock.calls.map(c => c[1].profile)
    expect(profiles).toEqual(['driving', 'cycling'])
  })

  it("FE-ROADTRIP-ROUTES-003: the day's own default mode wins over the trip fallback", async () => {
    const days = [day(1, 1, { default_transport_mode: 'walking' } as Partial<Day>)]
    const stops: StopSpec[] = [{ id: 1, at: HAMBURG }, { id: 2, at: LUENEBURG }]

    const { result } = renderHook(() => useRoadtripRoutes(7, days, map(1, stops), 'driving'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(calculateRouteWithLegs.mock.calls[0][1].profile).toBe('walking')
  })

  it('FE-ROADTRIP-ROUTES-004: drops a stop without coordinates and a day left with one stop', async () => {
    const days = [day(1, 1), day(2, 2)]
    const assignments = {
      ...map(1, [{ id: 1, at: HAMBURG }, { id: 2, at: LUENEBURG, noCoords: true }]),
      ...map(2, [{ id: 3, at: HAMBURG }, { id: 4, at: BERLIN }]),
    } as AssignmentsMap

    const { result } = renderHook(() => useRoadtripRoutes(7, days, assignments))
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Day 1 lost its second stop and with it its reason to appear at all.
    expect(result.current.days.map(d => d.dayId)).toEqual([2])
    expect(result.current.totalStops).toBe(2)
  })

  it('FE-ROADTRIP-ROUTES-005: sums the legs and hands the map one polyline per routed run', async () => {
    const days = [day(1, 1)]
    const stops: StopSpec[] = [{ id: 1, at: HAMBURG }, { id: 2, at: BERLIN }]
    calculateRouteWithLegs.mockResolvedValue(routed(1, [HAMBURG, [53, 11], BERLIN]))

    const { result } = renderHook(() => useRoadtripRoutes(7, days, map(1, stops)))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.totalDistance).toBe(100000)
    expect(result.current.totalDuration).toBe(3600)
    expect(result.current.lines).toEqual([[HAMBURG, [53, 11], BERLIN]])
    // The corridor search reads this: the roads driven, not the line between stops.
    expect(result.current.days[0].geometry).toEqual([HAMBURG, [53, 11], BERLIN])
    expect(result.current.segments).toHaveLength(1)
  })

  it('FE-ROADTRIP-ROUTES-006: walks the clock forward from the first pinned time', async () => {
    const days = [day(1, 1)]
    const stops: StopSpec[] = [
      { id: 1, at: HAMBURG, time: '09:00', dwell: 30 },
      { id: 2, at: BERLIN, dwell: 60 },
    ]
    // One hour of driving between them.
    calculateRouteWithLegs.mockResolvedValue(routed(1))

    const { result } = renderHook(() => useRoadtripRoutes(7, days, map(1, stops)))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const entries = result.current.days[0].schedule.entries
    expect(entries[0]).toMatchObject({ arrival: '09:00', departure: '09:30', anchored: true })
    expect(entries[1]).toMatchObject({ arrival: '10:30', departure: '11:30', anchored: false })
  })

  it('FE-ROADTRIP-ROUTES-007: retries a leg that did not route, then keeps it blank', async () => {
    vi.useFakeTimers()
    const days = [day(1, 1)]
    const stops: StopSpec[] = [{ id: 1, at: HAMBURG }, { id: 2, at: BERLIN }]
    calculateRouteWithLegs.mockRejectedValue(new Error('429'))

    const { result } = renderHook(() => useRoadtripRoutes(7, days, map(1, stops)))
    // Two backoffs, then it gives up rather than inventing a duration.
    await act(async () => { await vi.advanceTimersByTimeAsync(8000) })

    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(3)
    expect(result.current.loading).toBe(false)
    expect(result.current.days[0].legs).toEqual([undefined])
    expect(result.current.totalDistance).toBe(0)
    // A leg that never routed breaks the chain instead of guessing past it.
    expect(result.current.days[0].schedule.entries[1].arrival).toBeNull()
  })

  it('FE-ROADTRIP-ROUTES-008: a leg that answers on the second try still lands', async () => {
    vi.useFakeTimers()
    const days = [day(1, 1)]
    const stops: StopSpec[] = [{ id: 1, at: HAMBURG }, { id: 2, at: BERLIN }]
    calculateRouteWithLegs
      .mockRejectedValueOnce(new Error('429'))
      .mockResolvedValue(routed(1))

    const { result } = renderHook(() => useRoadtripRoutes(7, days, map(1, stops)))
    await act(async () => { await vi.advanceTimersByTimeAsync(3000) })

    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(2)
    expect(result.current.totalDistance).toBe(100000)
  })

  it('FE-ROADTRIP-ROUTES-009: renaming a place does not re-ask the router', async () => {
    const days = [day(1, 1)]
    const stops: StopSpec[] = [{ id: 1, at: HAMBURG }, { id: 2, at: BERLIN }]
    const first = map(1, stops)

    const { result, rerender } = renderHook(
      ({ assignments }: { assignments: AssignmentsMap }) => useRoadtripRoutes(7, days, assignments),
      { initialProps: { assignments: first } },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(1)

    const renamed = JSON.parse(JSON.stringify(first)) as AssignmentsMap
    renamed['1'][0].place!.name = 'Somewhere else entirely'
    rerender({ assignments: renamed })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(1)
  })

  it('FE-ROADTRIP-ROUTES-010: a trip with nothing to drive asks for nothing', async () => {
    const { result } = renderHook(() => useRoadtripRoutes(7, [day(1, 1)], map(1, [{ id: 1, at: HAMBURG }])))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(calculateRouteWithLegs).not.toHaveBeenCalled()
    expect(result.current.days).toEqual([])
    expect(result.current.totalStops).toBe(0)
  })

  it('FE-ROADTRIP-ROUTES-011: leaving the view aborts the request in flight', async () => {
    const days = [day(1, 1)]
    const stops: StopSpec[] = [{ id: 1, at: HAMBURG }, { id: 2, at: BERLIN }]
    let seen: AbortSignal | undefined
    calculateRouteWithLegs.mockImplementation((_wp: unknown, opts: { signal: AbortSignal }) => {
      seen = opts.signal
      return new Promise(() => {}) // never settles
    })

    const { unmount } = renderHook(() => useRoadtripRoutes(7, days, map(1, stops)))
    await waitFor(() => expect(seen).toBeDefined())
    expect(seen!.aborted).toBe(false)

    unmount()
    expect(seen!.aborted).toBe(true)
  })
})
