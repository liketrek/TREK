import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Accommodation, Assignment, AssignmentsMap, Day, Reservation, Settings } from '../../types'
import type { RoadtripStop } from './useRoadtripRoutes'

// Hoisted together with the mock: the module factory runs before the file body, so a
// class declared down there would not exist yet when the hook does its `instanceof`.
const { calculateRouteWithLegs, RoutingRefusedError } = vi.hoisted(() => {
  class RoutingRefusedError extends Error {
    constructor(readonly status: number, readonly retryAfterMs: number | null) {
      super('refused')
      this.name = 'RoutingRefusedError'
    }
    get isRateLimit(): boolean { return this.status === 429 || this.status === 503 }
  }
  return { calculateRouteWithLegs: vi.fn(), RoutingRefusedError }
})
// The rest of the module stays real: which engine a leg belongs to is decided there, and
// the leg router has to agree with it rather than with a copy.
vi.mock('../Map/RouteCalculator', async importOriginal => ({
  ...(await importOriginal<typeof import('../Map/RouteCalculator')>()),
  calculateRouteWithLegs,
  RoutingRefusedError,
}))

import { useRoadtripRoutes } from './useRoadtripRoutes'
import { DEFAULT_SETTINGS, useSettingsStore } from '../../store/settingsStore'
import { useTripStore } from '../../store/tripStore'
import { lineMetres } from './corridor'

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
  stopType?: string | null
  noCoords?: boolean
  /** The visit's own End. */
  end?: string | null
  /** An End only the place carries, for a visit that has none of its own. */
  placeEnd?: string | null
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
    assignment_end_time: spec.end ?? null,
    leg_transport_mode: spec.legMode ?? null,
    incoming_leg_transport_mode: spec.incoming ?? null,
    place: {
      id: spec.id * 10,
      name: `Stop ${spec.id}`,
      lat: spec.noCoords ? null : spec.at[0],
      lng: spec.noCoords ? null : spec.at[1],
      place_time: null,
      // Folded in the way the store keeps a visit (mergeAssignmentPlace): its own End,
      // or else the place's.
      end_time: spec.end ?? spec.placeEnd ?? null,
      duration_minutes: spec.dwell ?? null,
      stop_type: spec.stopType ?? null,
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

describe('automatic daily travel times', () => {
  beforeEach(() => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, roadtrip_day_start: '08:00', roadtrip_day_end: '18:00' } })
    calculateRouteWithLegs.mockResolvedValue({ ...routed(1), duration: 43200, legs: [{ ...routed(1).legs[0], duration: 43200 }] })
  })
  afterEach(() => act(() => useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } })))

  it('splits existing routes, keeps manual starts and recalculates without routing the pause', async () => {
    const days = [day(1, 1), day(2, 2)]
    const original = [{ id: 1, at: HAMBURG, time: '07:00' }, { id: 2, at: BERLIN }]
    const { result, rerender } = renderHook(({ stops }) => useRoadtripRoutes(7, days, map(1, stops)), {
      initialProps: { stops: original as StopSpec[] },
    })
    await waitFor(() => expect(result.current.dayWindowIssue).toBeNull())
    expect(result.current.days).toHaveLength(2)
    expect(result.current.totalStops).toBe(2)
    expect(result.current.totalDuration).toBe(43200)
    expect(result.current.days[0].schedule.entries.map(e => e.arrival)).toEqual(['07:00', '18:00'])
    expect(result.current.days[1].schedule.entries.map(e => e.arrival)).toEqual(['08:00', '09:00'])
    expect(result.current.days[1].stops[1]).toMatchObject({ assignmentId: 2, ownerDayId: 1, ownerIndex: 1 })
    const end = result.current.days[0].stops[1]
    rerender({ stops: [{ ...original[0], dwell: 120 }, original[1]] })
    await waitFor(() => expect(result.current.days[1].schedule.entries[1].arrival).toBe('11:00'))
    expect(result.current.days[0].stops[1].lng).not.toBe(end.lng)
    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(1)
    act(() => useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } }))
    await waitFor(() => expect(result.current.days).toHaveLength(1))
    expect(result.current.days[0].schedule.entries[1].arrival).toBe('21:00')
    expect(result.current.days[0].stops.some(s => s.automaticNight)).toBe(false)
  })

  it('routes the join between stored days and includes it exactly once', async () => {
    const days = [day(1, 1), day(2, 2)]
    const assignments = { ...map(1, [{ id: 1, at: HAMBURG }]), ...map(2, [{ id: 2, at: BERLIN }]) }
    const { result } = renderHook(() => useRoadtripRoutes(7, days, assignments))
    await waitFor(() => expect(result.current.dayWindowIssue).toBeNull())
    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(1)
    expect(calculateRouteWithLegs.mock.calls[0][0]).toEqual([{ lat: HAMBURG[0], lng: HAMBURG[1] }, { lat: BERLIN[0], lng: BERLIN[1] }])
    expect(result.current.days.map(d => d.dayNumber)).toEqual([1, 2, 3])
    expect(result.current.totalDuration).toBe(43200)
    expect(result.current.totalDistance).toBe(100000)
    expect(result.current.totalStops).toBe(2)
  })

  it('exposes a fixed appointment conflict and keeps stored dates and times', async () => {
    const days = [day(1, 1), day(2, 2)]
    const assignments = map(1, [{ id: 1, at: HAMBURG, time: '07:00' }, { id: 2, at: BERLIN, time: '10:00' }])
    const { result } = renderHook(() => useRoadtripRoutes(7, days, assignments))
    await waitFor(() => expect(result.current.dayWindowIssue).toBe('conflict'))
    expect(result.current.days).toHaveLength(1)
    expect(result.current.days[0].stops.map(s => s.time)).toEqual(['07:00', '10:00'])
    expect(result.current.days[0].stops.some(s => s.automaticNight)).toBe(false)
  })
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

  it('FE-ROADTRIP-ROUTES-013: a charger on the way is part of the drive, not a stop', async () => {
    const days = [day(1, 1)]
    const stops: StopSpec[] = [
      { id: 1, at: HAMBURG },
      { id: 2, at: [53, 11], stopType: 'charging' },
      { id: 3, at: BERLIN },
    ]
    calculateRouteWithLegs.mockResolvedValue(routed(2, [HAMBURG, [53, 11], BERLIN]))

    const { result } = renderHook(() => useRoadtripRoutes(7, days, map(1, stops)))
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Three assignments, three markers on the map, two places the trip is for. The
    // charger still routes — it is only left out of the count the head shows.
    expect(result.current.days[0].stops).toHaveLength(3)
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

  it('FE-ROADTRIP-ROUTES-028: a day the router refuses outright is asked for again one pair at a time', async () => {
    const days = [day(1, 1)]
    const stops: StopSpec[] = [{ id: 1, at: HAMBURG }, { id: 2, at: LUENEBURG }, { id: 3, at: BERLIN }]
    // The Padirac case: one stop in the middle the router will not turn round at, and
    // what comes back is a refusal of the WHOLE chain rather than of that one leg.
    calculateRouteWithLegs
      .mockRejectedValueOnce(new RoutingRefusedError(400, null))
      .mockResolvedValue(routed(1))

    const { result } = renderHook(() => useRoadtripRoutes(7, days, map(1, stops)))
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 })

    // The run once, refused, then a request per pair, and no retry of the run, because
    // the same coordinates earn the same refusal.
    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(3)
    expect(calculateRouteWithLegs.mock.calls[1][0]).toHaveLength(2)
    expect(calculateRouteWithLegs.mock.calls[2][0]).toHaveLength(2)
    expect(result.current.days[0].legs.filter(Boolean)).toHaveLength(2)
    expect(result.current.totalDistance).toBe(200000)
  })

  it('FE-ROADTRIP-ROUTES-029: a rate limit is waited out, never split into more requests', async () => {
    vi.useFakeTimers()
    const days = [day(1, 1)]
    const stops: StopSpec[] = [{ id: 1, at: HAMBURG }, { id: 2, at: LUENEBURG }, { id: 3, at: BERLIN }]
    calculateRouteWithLegs.mockRejectedValue(new RoutingRefusedError(429, null))

    const { result } = renderHook(() => useRoadtripRoutes(7, days, map(1, stops)))
    await act(async () => { await vi.advanceTimersByTimeAsync(20000) })

    // Three attempts at the run and nothing after them: answering a host that asked for
    // less traffic with two more requests would be the opposite of backing off.
    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(3)
    expect(result.current.days[0].legs).toEqual([undefined, undefined])
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

  it('FE-ROADTRIP-ROUTES-012: a stop whose id changes after saving keeps its legs and its clock', async () => {
    // The optimistic insert: a stop added mid-day carries a temporary negative id until
    // the server answers, then the real id replaces it without a coordinate moving. Since
    // `planKey` is geometry only, no refetch follows — so legs filed under the id would be
    // stranded, and a broken chain blanks every arrival after it.
    calculateRouteWithLegs.mockResolvedValue(routed(2))
    const days = [day(1, 1)]
    const optimistic: StopSpec[] = [
      { id: 1, at: HAMBURG, time: '09:00' },
      { id: -1755000000, at: LUENEBURG },
      { id: 2, at: BERLIN },
    ]
    const first = map(1, optimistic)

    const { result, rerender } = renderHook(
      ({ assignments }: { assignments: AssignmentsMap }) => useRoadtripRoutes(7, days, assignments),
      { initialProps: { assignments: first } },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.days[0].legs.every(Boolean)).toBe(true)

    const saved = JSON.parse(JSON.stringify(first)) as AssignmentsMap
    saved['1'][1].id = 4711
    rerender({ assignments: saved })
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(1)
    expect(result.current.days[0].legs.every(Boolean)).toBe(true)
    expect(result.current.days[0].schedule.entries[2].arrival).not.toBeNull()
  })

  it('FE-ROADTRIP-ROUTES-013: a rate-limited host is given the time it asked for', async () => {
    // The public OSRM instances answer 429 above roughly one request a second and say how
    // long to wait. Retrying sooner than that is just a second refusal, so the host's
    // Retry-After wins over the shorter backoff the hook would otherwise use.
    vi.useFakeTimers()
    calculateRouteWithLegs
      .mockRejectedValueOnce(new RoutingRefusedError(429, 6000))
      .mockResolvedValue(routed(1))

    const days = [day(1, 1)]
    const stops: StopSpec[] = [{ id: 1, at: HAMBURG }, { id: 2, at: BERLIN }]
    const { result } = renderHook(() => useRoadtripRoutes(7, days, map(1, stops)))

    // The hook's own first backoff is 1500 ms; at that point it must still be waiting.
    await act(async () => { await vi.advanceTimersByTimeAsync(2000) })
    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(1)

    await act(async () => { await vi.advanceTimersByTimeAsync(5000) })
    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(2)
    expect(result.current.days[0].legs[0]).toBeDefined()
  })

  it('FE-ROADTRIP-ROUTES-014: a via joins the routing request between the stops it follows', async () => {
    const days = [day(1, 1)]
    const stops: StopSpec[] = [{ id: 1, at: HAMBURG }, { id: 2, at: BERLIN }]
    calculateRouteWithLegs.mockResolvedValue(routed(2))

    const { result } = renderHook(() => useRoadtripRoutes(7, days, map(1, stops), 'driving', {
      1: [{ id: 1, day_id: 1, after_order_index: 0, sequence: 0, lat: 53.2, lng: 10.4 }],
    }))
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Three waypoints for two stops: the via is threaded in where it belongs.
    const [waypoints] = calculateRouteWithLegs.mock.calls[0]
    expect(waypoints).toHaveLength(3)
    expect(waypoints[1]).toEqual({ lat: 53.2, lng: 10.4 })
  })

  it('FE-ROADTRIP-ROUTES-015: the two legs a via creates are shown as the one drive they are', async () => {
    const days = [day(1, 1)]
    const stops: StopSpec[] = [{ id: 1, at: HAMBURG }, { id: 2, at: BERLIN }]
    // The router answers per waypoint pair: two legs for one stop pair.
    calculateRouteWithLegs.mockResolvedValue(routed(2))

    const { result } = renderHook(() => useRoadtripRoutes(7, days, map(1, stops), 'driving', {
      1: [{ id: 1, day_id: 1, after_order_index: 0, sequence: 0, lat: 53.2, lng: 10.4 }],
    }))
    await waitFor(() => expect(result.current.loading).toBe(false))

    // The rail shows one leg between two stops, carrying the whole drive.
    expect(result.current.days[0].legs).toHaveLength(1)
    expect(result.current.days[0].legs[0]).toMatchObject({ distance: 100000, duration: 3600 })
  })

  it('FE-ROADTRIP-ROUTES-016: moving a via re-asks the router, renaming a place still does not', async () => {
    const days = [day(1, 1)]
    const stops: StopSpec[] = [{ id: 1, at: HAMBURG }, { id: 2, at: BERLIN }]
    const vias = { 1: [{ id: 1, day_id: 1, after_order_index: 0, sequence: 0, lat: 53.2, lng: 10.4 }] }

    const { result, rerender } = renderHook(
      ({ v }: { v: Record<number, typeof vias[1]> }) => useRoadtripRoutes(7, days, map(1, stops), 'driving', v),
      { initialProps: { v: vias } },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(1)

    // A via that moved is a different road, so the route has to be asked for again.
    rerender({ v: { 1: [{ ...vias[1][0], lat: 53.9, lng: 10.9 }] } })
    await waitFor(() => expect(calculateRouteWithLegs).toHaveBeenCalledTimes(2))
  })

  /**
   * Days read by the date each stop is REACHED, and the road between them.
   *
   * The arrangement itself is tested in `nightSpill.test.ts`; what is asserted here is
   * what the hook does with it — the roads it has to ask for that a day-at-a-time plan
   * never needed, and what the switch over them turns on.
   */
  describe('driving that crosses a day boundary', () => {
    /** Two days, the first of which sets off late enough to arrive after midnight. */
    const overnight = () => ({
      days: [day(1, 1), day(2, 2)],
      assignments: {
        ...map(1, [{ id: 1, at: HAMBURG, time: '21:00', dwell: 90 }, { id: 2, at: LUENEBURG }]),
        ...map(2, [{ id: 3, at: BERLIN, time: '10:00' }, { id: 4, at: HAMBURG }]),
      } as AssignmentsMap,
    })

    it('FE-ROADTRIP-ROUTES-017: routes the road onto the day a night drive lands on', async () => {
      // The stop reached after midnight is drawn under day 2, next to day 2's own first
      // stop. Those two were never neighbours before, so their road was never asked for —
      // and a chain with a hole in it draws as two runs with a gap across the middle.
      const { days, assignments } = overnight()
      // Three hours per leg, which is what puts the second stop past midnight.
      calculateRouteWithLegs.mockResolvedValue({ ...routed(1), duration: 10800, legs: [{ distance: 100000, duration: 10800, text: '100 km' }] })

      const { result } = renderHook(() => useRoadtripRoutes(7, days, assignments))
      await waitFor(() => expect(result.current.loading).toBe(false))
      await waitFor(() => expect(calculateRouteWithLegs.mock.calls.length).toBeGreaterThan(2))

      // A two-point request, which is the seam rather than either day's own run.
      const seam = calculateRouteWithLegs.mock.calls.find(c => c[0].length === 2
        && c[0][0].lat === LUENEBURG[0] && c[0][1].lat === BERLIN[0])
      expect(seam).toBeTruthy()
    })

    it('FE-ROADTRIP-ROUTES-018: leaves the gap between two ordinary days alone', async () => {
      // Nothing moved here, so the road from one day's last stop to the next day's first
      // is a gap the plan simply has. Asking for it is what the switch is for.
      const daysList = [day(1, 1), day(2, 2)]
      const assignments = {
        ...map(1, [{ id: 1, at: HAMBURG, time: '09:00' }, { id: 2, at: LUENEBURG }]),
        ...map(2, [{ id: 3, at: BERLIN, time: '10:00' }, { id: 4, at: HAMBURG }]),
      } as AssignmentsMap

      const { result } = renderHook(() => useRoadtripRoutes(7, daysList, assignments))
      await waitFor(() => expect(result.current.loading).toBe(false))

      // One request per day and no more: the seam is not asked for.
      expect(calculateRouteWithLegs).toHaveBeenCalledTimes(2)
      expect(result.current.days).toHaveLength(2)
    })

    it('FE-ROADTRIP-ROUTES-019: hands the map a line per leg, coloured by the day it is driven on', async () => {
      const daysList = [day(1, 1), day(2, 2)]
      const assignments = {
        ...map(1, [{ id: 1, at: HAMBURG, time: '09:00' }, { id: 2, at: LUENEBURG }]),
        ...map(2, [{ id: 3, at: BERLIN, time: '10:00' }, { id: 4, at: HAMBURG }]),
      } as AssignmentsMap

      const { result } = renderHook(() => useRoadtripRoutes(7, daysList, assignments))
      await waitFor(() => expect(result.current.loading).toBe(false))

      // Same length and same order as `lines`, which is the contract the map paints from.
      expect(result.current.lineDays).toHaveLength(result.current.lines.length)
      expect(result.current.lineDays).toEqual([1, 2])
    })
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

  it('FE-ROADTRIP-ROUTES-020: gives each leg its share of the drawn line, not its share of the routed metres', async () => {
    // The router reports 50 km a leg off its own graph while the polyline it sends back
    // measures 260 km as great-circle hops between the vertices. Cutting at the raw
    // metres left every run short by the difference: the second leg ended a third of the
    // way into the drive and the day never reached Berlin at all.
    const days = [day(1, 1)]
    const stops: StopSpec[] = [{ id: 1, at: HAMBURG }, { id: 2, at: LUENEBURG }, { id: 3, at: BERLIN }]
    calculateRouteWithLegs.mockResolvedValue(routed(2, [HAMBURG, LUENEBURG, BERLIN]))
    const metres = (line: [number, number][]): number => lineMetres(line.map(([lat, lng]) => ({ lat, lng })))

    const { result } = renderHook(() => useRoadtripRoutes(7, days, map(1, stops)))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const [first, second] = result.current.lines
    expect(first[0]).toEqual(HAMBURG)
    // Both ends are interpolated inside the segment they fall in, so the two pieces meet
    // on one coordinate and put back together give the run back.
    expect(first[first.length - 1]).toEqual(second[0])
    // And the last cut lands on the last vertex rather than somewhere short of it.
    expect(second[second.length - 1][0]).toBeCloseTo(BERLIN[0], 6)
    expect(second[second.length - 1][1]).toBeCloseTo(BERLIN[1], 6)
    // Two legs the router called equal take equal shares of the road that was drawn, and
    // between them the whole 260 km of it rather than the 100 km the router reported.
    const drawn = metres(first) + metres(second)
    expect(metres(first) / drawn).toBeCloseTo(0.5, 2)
    expect(drawn).toBeCloseTo(metres([HAMBURG, LUENEBURG, BERLIN]), -2)
  })

  /**
   * The switch that turns a trip stored as days into one continuous drive.
   *
   * Off, a card holds only the driving between its own stops: the road across the join is
   * not asked for, not drawn and not counted. On, every one of those gaps becomes a leg
   * like any other — and it is the one stretch of a trip that no day run ever covers, so
   * a hole left in the chain here is left there by nothing else.
   */
  describe('connecting the days', () => {
    beforeEach(() => {
      // Wholesale, so nothing a previous case set can answer for this one.
      useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } })
    })

    /** The hook reads the switch off the settings store, the way the limits card writes it. */
    const setting = (over: Partial<Settings>): void => {
      act(() => { useSettingsStore.setState(s => ({ settings: { ...s.settings, ...over } })) })
    }

    /** Two ordinary days, with the road from Lueneburg to Berlin left over between them. */
    const twoDays = () => ({
      days: [day(1, 1), day(2, 2)],
      assignments: {
        ...map(1, [{ id: 1, at: HAMBURG, time: '09:00' }, { id: 2, at: LUENEBURG }]),
        ...map(2, [{ id: 3, at: BERLIN, time: '10:00' }, { id: 4, at: HAMBURG }]),
      } as AssignmentsMap,
    })

    /** Every request for one particular road, found by the two ends it was asked for. */
    const askedFor = (from: [number, number], to: [number, number]) =>
      calculateRouteWithLegs.mock.calls.filter(c =>
        c[0][0].lat === from[0] && c[0][c[0].length - 1].lat === to[0])

    /** A run whose legs are a round 100 km each, so the range budget reads off the page. */
    const hundreds = (legs: number, coordinates: [number, number][]) => ({
      coordinates,
      distance: legs * 100000,
      duration: legs * 3600,
      legs: Array.from({ length: legs }, () => ({ distance: 100000, duration: 3600, text: '100 km' })),
    })

    it('FE-ROADTRIP-ROUTES-021: off, the join is neither driven nor counted; on, it is both', async () => {
      const { days: daysList, assignments } = twoDays()
      const { result } = renderHook(() => useRoadtripRoutes(7, daysList, assignments))
      await waitFor(() => expect(result.current.loading).toBe(false))

      // A gap the day-at-a-time plan simply has, and the totals say so by leaving it out.
      expect(askedFor(LUENEBURG, BERLIN)).toHaveLength(0)
      expect(result.current.lines).toHaveLength(2)
      expect(result.current.totalDistance).toBe(200000)

      setting({ roadtrip_connect_days: true })
      await waitFor(() => expect(askedFor(LUENEBURG, BERLIN)).toHaveLength(1))
      await waitFor(() => expect(result.current.lines).toHaveLength(3))
      expect(result.current.totalDistance).toBe(300000)
    })

    it('FE-ROADTRIP-ROUTES-022: the joining stroke wears the day it leaves, its kilometres the day it reaches', async () => {
      setting({ roadtrip_connect_days: true })
      const { days: daysList, assignments } = twoDays()
      const { result } = renderHook(() => useRoadtripRoutes(7, daysList, assignments))
      await waitFor(() => expect(result.current.lines).toHaveLength(3))

      // Same length and same order as `lines`, or a colour lands on the wrong day.
      expect(result.current.lineDays).toHaveLength(result.current.lines.length)
      // The stroke starts at a stop on day 1, so drawing it as day 2 would make day 2
      // look like it begins somewhere it has no stop.
      expect(result.current.lineDays).toEqual([1, 1, 2])
      // The kilometres go the other way: they are driven on the day they arrive.
      expect(result.current.days.map(d => d.distance)).toEqual([100000, 200000])
    })

    it('FE-ROADTRIP-ROUTES-023: a night drive is drawn on the card it reaches only once the switch is on', async () => {
      // Stored inside one day and real driving, but on screen it runs from a stop on one
      // card to a stop on the next, and a line between two cards is what the switch asks
      // about. Its kilometres belong to the day it lands on either way.
      const daysList = [day(1, 1), day(2, 2)]
      const assignments = {
        ...map(1, [{ id: 1, at: HAMBURG, time: '21:00', dwell: 90 }, { id: 2, at: LUENEBURG }]),
        ...map(2, [{ id: 3, at: BERLIN, time: '10:00' }, { id: 4, at: HAMBURG }]),
      } as AssignmentsMap
      // Three hours a leg, which is what puts the second stop past midnight.
      calculateRouteWithLegs.mockResolvedValue({
        ...routed(1), duration: 10800, legs: [{ distance: 100000, duration: 10800, text: '100 km' }],
      })

      const { result } = renderHook(() => useRoadtripRoutes(7, daysList, assignments))
      await waitFor(() => expect(result.current.lines).toHaveLength(2))
      expect(result.current.days[0].distance).toBe(200000)

      setting({ roadtrip_connect_days: true })
      expect(result.current.lines).toHaveLength(3)
      expect(result.current.lineDays).toEqual([1, 2, 2])
      expect(result.current.days[0].distance).toBe(300000)
    })

    it('FE-ROADTRIP-ROUTES-024: vias on the join reach the router in sequence order, and come back as one drive', async () => {
      setting({ roadtrip_connect_days: true })
      const { days: daysList, assignments } = twoDays()
      // Filed after the last stop of day 1, which is the join itself. Handed over in the
      // wrong order on purpose: driven through its points backwards the seam doubles back.
      const vias = {
        1: [
          { id: 2, day_id: 1, after_order_index: 1, sequence: 1, lat: 53.0, lng: 11.5 },
          { id: 1, day_id: 1, after_order_index: 1, sequence: 0, lat: 53.2, lng: 10.9 },
        ],
      }
      // A shaped seam comes back as one leg per waypoint pair.
      const inPieces = {
        ...routed(1),
        legs: [
          { distance: 30000, duration: 1000, text: '30 km' },
          { distance: 30000, duration: 1000, text: '30 km' },
          { distance: 40000, duration: 1600, text: '40 km' },
        ],
      }
      calculateRouteWithLegs.mockImplementation((wp: { lat: number }[]) =>
        Promise.resolve(wp.length === 4 ? inPieces : routed(1)))

      const { result } = renderHook(() => useRoadtripRoutes(7, daysList, assignments, 'driving', vias))
      await waitFor(() => expect(askedFor(LUENEBURG, BERLIN)).toHaveLength(1))

      const [waypoints] = askedFor(LUENEBURG, BERLIN)[0]
      expect(waypoints.map((w: { lat: number }) => w.lat)).toEqual([LUENEBURG[0], 53.2, 53.0, BERLIN[0]])
      // Three pieces, one drive: the rail carries the whole road across the join rather
      // than the first stretch of it.
      await waitFor(() => expect(result.current.days[1].distance).toBe(200000))
    })

    it('FE-ROADTRIP-ROUTES-025: dragging a via on the join asks for that road again', async () => {
      // The first answer is filed under the pair of stops. Skipping the seam whenever any
      // answer existed is what made a via on the join do visibly nothing at all.
      setting({ roadtrip_connect_days: true })
      const { days: daysList, assignments } = twoDays()
      const vias = { 1: [{ id: 1, day_id: 1, after_order_index: 1, sequence: 0, lat: 53.2, lng: 10.9 }] }

      const { rerender } = renderHook(
        ({ v }: { v: Record<number, typeof vias[1]> }) => useRoadtripRoutes(7, daysList, assignments, 'driving', v),
        { initialProps: { v: vias } },
      )
      await waitFor(() => expect(askedFor(LUENEBURG, BERLIN)).toHaveLength(1))

      rerender({ v: { 1: [{ ...vias[1][0], lat: 53.9, lng: 10.4 }] } })
      await waitFor(() => expect(askedFor(LUENEBURG, BERLIN)).toHaveLength(2))
      const [waypoints] = askedFor(LUENEBURG, BERLIN)[1]
      expect(waypoints[1]).toEqual({ lat: 53.9, lng: 10.4 })
    })

    it('FE-ROADTRIP-ROUTES-026: a join that will not route leaves both cards their own driving', async () => {
      setting({ roadtrip_connect_days: true })
      const { days: daysList, assignments } = twoDays()
      calculateRouteWithLegs.mockImplementation((wp: { lat: number }[]) =>
        wp[0].lat === LUENEBURG[0] ? Promise.reject(new Error('503')) : Promise.resolve(routed(1)))

      const { result } = renderHook(() => useRoadtripRoutes(7, daysList, assignments))
      await waitFor(() => expect(askedFor(LUENEBURG, BERLIN)).toHaveLength(1))
      await waitFor(() => expect(result.current.loading).toBe(false))
      // Let the refusal settle: what it must not do is file a leg anyway.
      await act(async () => { await Promise.resolve() })

      expect(result.current.lines).toHaveLength(2)
      expect(result.current.lineDays).toEqual([1, 2])
      // Partial rather than invented, exactly like any other leg that will not route.
      expect(result.current.totalDistance).toBe(200000)
    })

    it('FE-ROADTRIP-ROUTES-027: the road across the join is spent from the tank before the next card fills up', async () => {
      // A tank does not empty overnight and the join is real driving, so the day it
      // reaches starts with those kilometres already on the clock — which moves the point
      // the fuel runs out a whole leg earlier.
      const SOUTH: [number, number] = [51.5, 13.5]
      const FURTHER_SOUTH: [number, number] = [51.05, 13.74]
      setting({ roadtrip_range_km: 250 })
      const daysList = [day(1, 1), day(2, 2)]
      const assignments = {
        ...map(1, [{ id: 1, at: HAMBURG, time: '09:00' }, { id: 2, at: LUENEBURG }]),
        ...map(2, [{ id: 3, at: BERLIN, time: '10:00' }, { id: 4, at: SOUTH }, { id: 5, at: FURTHER_SOUTH }]),
      } as AssignmentsMap
      calculateRouteWithLegs.mockImplementation((wp: { lat: number }[]) => Promise.resolve(
        wp[0].lat === BERLIN[0]
          ? hundreds(2, [BERLIN, SOUTH, FURTHER_SOUTH])
          : hundreds(1, wp[0].lat === LUENEBURG[0] ? [LUENEBURG, BERLIN] : [HAMBURG, LUENEBURG])))

      const { result } = renderHook(() => useRoadtripRoutes(7, daysList, assignments))
      await waitFor(() => expect(result.current.days).toHaveLength(2))
      await waitFor(() => expect(result.current.days[1].dryPoints).toHaveLength(1))
      // 100 km carried over from day 1, so the 250th is reached halfway down the second leg.
      expect(result.current.days[1].dryPoints![0]).toMatchObject({ legIndex: 1, drivenMeters: 150000 })

      setting({ roadtrip_connect_days: true })
      await waitFor(() => expect(result.current.days[1].distance).toBe(300000))
      const [dry] = result.current.days[1].dryPoints!
      expect(dry).toMatchObject({ legIndex: 0, drivenMeters: 50000 })
      // Walked along the roads this day drives, not along the drawn line: 50 km down that
      // one is still on the join, north of Berlin, a whole leg from where the tank empties.
      expect(dry.lat).toBeLessThan(BERLIN[0])
      setting({ roadtrip_range_km: 150 })
      await waitFor(() => expect(result.current.days[1].dryPoints![0].legIndex).toBe(-1))
      const inboundDry = result.current.days[1].dryPoints![0]
      expect(inboundDry).toMatchObject({ intoLegKm: 50, drivenMeters: 50000, inboundLine: [LUENEBURG, BERLIN] })
      expect(inboundDry.lat).toBeGreaterThan(BERLIN[0])
      expect(inboundDry.lat).toBeLessThan(LUENEBURG[0])
    })

    it('FE-ROADTRIP-ROUTES-049: switching what the trip avoids asks for the join again, with the new classes', async () => {
      // The seam round skipped every join it already had an answer for, whatever that
      // answer had been asked with, so the drive between two days kept its old road and
      // its old minutes until the page was loaded again.
      //
      // The clock the requests are spaced by is held still and moved by hand, so neither
      // round waits for real time between its requests.
      let now = 10_000
      const clock = vi.spyOn(performance, 'now').mockImplementation(() => now)
      try {
        setting({ roadtrip_connect_days: true })
        const { days: daysList, assignments } = twoDays()
        renderHook(() => useRoadtripRoutes(7, daysList, assignments))
        await waitFor(() => expect(askedFor(LUENEBURG, BERLIN)).toHaveLength(1))
        expect(askedFor(LUENEBURG, BERLIN)[0][1]).toMatchObject({ avoid: [] })

        now += 10_000
        setting({ roadtrip_avoid: 'toll' })
        await waitFor(() => expect(askedFor(LUENEBURG, BERLIN)).toHaveLength(2))
        expect(askedFor(LUENEBURG, BERLIN)[1][1]).toMatchObject({ profile: 'driving', avoid: ['toll'] })
      } finally {
        clock.mockRestore()
      }
    })

    it('FE-ROADTRIP-ROUTES-051: a join OSRM answered in the engine’s place is drawn, flagged, and asked for again on request', async () => {
      // Filed like any answer, it stood in for the weighed road until the page was loaded
      // again, and a picker on it read the stand-in line as the road already taken.
      let now = 10_000
      const clock = vi.spyOn(performance, 'now').mockImplementation(() => now)
      try {
        setting({ roadtrip_connect_days: true, roadtrip_avoid: 'toll' })
        const standIn = { ...routed(1), avoidance: { asked: ['toll'], achieved: [], fellBack: true } }
        calculateRouteWithLegs.mockImplementation((wp: { lat: number }[]) =>
          Promise.resolve(wp[0].lat === LUENEBURG[0] ? standIn : routed(1)))
        const { days: daysList, assignments } = twoDays()
        const { result } = renderHook(() => useRoadtripRoutes(7, daysList, assignments))
        await waitFor(() => expect(result.current.lines).toHaveLength(3))
        await waitFor(() => expect(result.current.loading).toBe(false))
        const lueneburg = result.current.days[0].stops[1]
        const berlin = result.current.days[1].stops[0]
        expect(result.current.legRouter!(lueneburg, berlin, 2).standIn).toBe(true)
        // The day runs came from the engine asked.
        expect(result.current.legRouter!(result.current.days[0].stops[0], lueneburg, 1).standIn).toBe(false)
        // Flagged on the card the join arrives on, the way a day's own run is.
        expect(result.current.days[1].avoidMissed).toEqual(['toll'])
        expect(result.current.days[0].avoidMissed ?? []).toEqual([])

        const asked = askedFor(LUENEBURG, BERLIN).length
        now += 10_000
        calculateRouteWithLegs.mockImplementation(() => Promise.resolve(routed(1)))
        act(() => { result.current.reroute!() })
        await waitFor(() => expect(askedFor(LUENEBURG, BERLIN).length).toBeGreaterThan(asked))
        await waitFor(() => expect(result.current.legRouter!(lueneburg, berlin, 2).standIn).toBe(false))
        expect(result.current.days[1].avoidMissed ?? []).toEqual([])
      } finally {
        clock.mockRestore()
      }
    })
  })
})

describe('a visit End on the road trip', () => {
  /** An hour from Hamburg to Lueneburg and another on to Berlin. */
  const hourly = () => ({
    coordinates: [HAMBURG, LUENEBURG, BERLIN],
    distance: 200000,
    duration: 7200,
    legs: [{ distance: 100000, duration: 3600, text: '' }, { distance: 100000, duration: 3600, text: '' }],
  })

  async function drive(stops: StopSpec[]) {
    calculateRouteWithLegs.mockResolvedValue(hourly())
    const { result } = renderHook(() => useRoadtripRoutes(7, [day(1, 1)], map(1, stops)))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await waitFor(() => expect(result.current.days).toHaveLength(1))
    return result.current.days[0]
  }

  afterEach(() => act(() => useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } })))

  it('FE-ROADTRIP-ROUTES-030: the drive leaves a stop at its End, not after its stay', async () => {
    const d = await drive([
      { id: 1, at: HAMBURG, time: '09:00', dwell: 0 },
      { id: 2, at: LUENEBURG, end: '14:00', dwell: 30 },
      { id: 3, at: BERLIN },
    ])
    expect(d.stops[1].leaveAt).toBe('14:00')
    expect(d.schedule.entries[1]).toMatchObject({ arrival: '10:00', departure: '14:00' })
    expect(d.schedule.entries[2].arrival).toBe('15:00')
    expect(d.schedule.warnings).toEqual([])
  })

  it('FE-ROADTRIP-ROUTES-031: an End the place carries counts for a visit without its own', async () => {
    const d = await drive([
      { id: 1, at: HAMBURG, time: '09:00', dwell: 0 },
      { id: 2, at: LUENEBURG, placeEnd: '13:00', dwell: 30 },
      { id: 3, at: BERLIN },
    ])
    expect(d.schedule.entries[1].departure).toBe('13:00')
    expect(d.schedule.entries[2].arrival).toBe('14:00')
  })

  it('FE-ROADTRIP-ROUTES-032: Start and End together make the stay the time between them', async () => {
    const d = await drive([
      { id: 1, at: HAMBURG, time: '09:00', dwell: 0 },
      { id: 2, at: LUENEBURG, time: '10:00', end: '14:00', dwell: 60 },
      { id: 3, at: BERLIN },
    ])
    expect(d.schedule.entries[1]).toMatchObject({ arrival: '10:00', departure: '14:00', anchored: true })
    expect(d.schedule.entries[2].arrival).toBe('15:00')
  })

  it('FE-ROADTRIP-ROUTES-033: a stop reached after its End says so instead of leaving quietly', async () => {
    const d = await drive([
      { id: 1, at: HAMBURG, time: '13:30', dwell: 0 },
      { id: 2, at: LUENEBURG, end: '14:00', dwell: 30 },
      { id: 3, at: BERLIN },
    ])
    expect(d.schedule.entries[1]).toMatchObject({ arrival: '14:30', departure: '14:30' })
    expect(d.schedule.warnings).toEqual([{ index: 1, code: 'missedLeave', minutes: 30 }])
  })

  it('FE-ROADTRIP-ROUTES-034: daily travel times spend the hours until the End as well', async () => {
    act(() => useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, roadtrip_day_start: '08:00', roadtrip_day_end: '20:00' } }))
    const d = await drive([
      { id: 1, at: HAMBURG, time: '09:00', dwell: 0 },
      { id: 2, at: LUENEBURG, end: '14:00', dwell: 30 },
      { id: 3, at: BERLIN },
    ])
    expect(d.automaticSchedule).toBe(true)
    expect(d.schedule.entries[1]).toMatchObject({ arrival: '10:00', departure: '14:00' })
    expect(d.schedule.entries[2].arrival).toBe('15:00')
  })
})

vi.mock('../../hooks/useRoadtripSettings', () => ({
  useRoadtripSettings: (select: (preferences: import('@trek/shared').RoadtripPreferences) => unknown) => useSettingsStore(state => select(state.settings as import('@trek/shared').RoadtripPreferences)),
}))

describe('a booking the traveller rides (#2428)', () => {
  const MUC: [number, number] = [48.3538, 11.7861]
  const HAM: [number, number] = [53.6304, 9.9882]
  const flight = (over: Record<string, unknown> = {}) => ({
    id: 70,
    trip_id: 7,
    title: 'LH 2020 HAM → MUC',
    type: 'flight',
    status: 'confirmed',
    day_id: 1,
    end_day_id: 1,
    reservation_time: '13:20',
    reservation_end_time: '14:30',
    endpoints: [
      { role: 'from', sequence: 0, name: 'Hamburg Airport', code: 'HAM', lat: HAM[0], lng: HAM[1], timezone: null, local_time: null, local_date: null },
      { role: 'to', sequence: 1, name: 'Munich Airport', code: 'MUC', lat: MUC[0], lng: MUC[1], timezone: null, local_time: null, local_date: null },
    ],
    ...over,
  }) as unknown as import('../../types').Reservation

  /** An hour for whatever pair the router is handed. */
  const hourly = (points: { lat: number; lng: number }[]) => ({
    coordinates: points.map(p => [p.lat, p.lng] as [number, number]),
    distance: 100000 * (points.length - 1),
    duration: 3600 * (points.length - 1),
    legs: points.slice(1).map(() => ({ distance: 100000, duration: 3600, text: '' })),
  })

  afterEach(() => act(() => useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } })))

  it('FE-ROADTRIP-ROUTES-040: the terminals seam the day, the ride is never routed, and the roads to and from them are', async () => {
    calculateRouteWithLegs.mockImplementation(async (points: { lat: number; lng: number }[]) => hourly(points))
    const stops: StopSpec[] = [
      { id: 1, at: HAMBURG, time: '09:00', dwell: 0 },
      { id: 2, at: LUENEBURG, time: '10:00', dwell: 0 },
      { id: 3, at: BERLIN, dwell: 0 },
    ]
    const { result } = renderHook(() => useRoadtripRoutes(7, [day(1, 1)], map(1, stops), 'driving', {}, [], [], [flight()]))
    await waitFor(() => expect(result.current.loading).toBe(false))
    const d = result.current.days[0]
    expect(d.stops.map(s => s.carrier?.role ?? s.name)).toEqual(['Stop 1', 'Stop 2', 'departure', 'arrival', 'Stop 3'])
    // Two road runs went to the router: up to the departure terminal, and from the arrival on.
    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(2)
    const asked = calculateRouteWithLegs.mock.calls.map(c => c[0].map((p: { lat: number }) => p.lat))
    expect(asked).toEqual([[HAMBURG[0], LUENEBURG[0], HAM[0]], [MUC[0], BERLIN[0]]])
    expect(d.legs.map(l => l?.mode)).toEqual(['driving', 'driving', 'flight', 'driving'])
    expect(d.legs[2]).toMatchObject({ distance: 0, duration: 70 * 60 })
    // An hour ahead of the flight at the airport, off on the timetable, landed on it.
    expect(d.schedule.entries.map(e => [e.arrival, e.departure])).toEqual([
      ['09:00', '09:00'],
      ['10:00', '10:00'],
      ['12:20', '13:20'],
      ['14:30', '14:30'],
      ['15:30', '15:30'],
    ])
    // The ride draws no road of its own; the three road legs do.
    expect(result.current.lines).toHaveLength(3)
    expect(result.current.totalStops).toBe(3)
    expect(result.current.totalDistance).toBe(300000)
  })

  it('FE-ROADTRIP-ROUTES-041: a ride landing on a later day seams two cards, and with connected days the ride is the join', async () => {
    calculateRouteWithLegs.mockImplementation(async (points: { lat: number; lng: number }[]) => hourly(points))
    act(() => useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, roadtrip_connect_days: true } }))
    const days = [day(1, 1), day(2, 2)]
    const assignments = {
      ...map(1, [{ id: 1, at: HAMBURG, time: '18:00', dwell: 0 }]),
      ...map(2, [{ id: 2, at: BERLIN, dwell: 0 }]),
    }
    const overnight = flight({ reservation_time: '22:00', reservation_end_time: '07:00', end_day_id: 2 })
    const { result } = renderHook(() => useRoadtripRoutes(7, days, assignments, 'driving', {}, [], [], [overnight]))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await waitFor(() => expect(result.current.days[1]?.arrivingLeg?.mode).toBe('flight'))
    expect(result.current.days[0].stops.map(s => s.carrier?.role ?? s.name)).toEqual(['Stop 1', 'departure'])
    expect(result.current.days[1].stops.map(s => s.carrier?.role ?? s.name)).toEqual(['arrival', 'Stop 2'])
    expect(result.current.days[1].schedule.entries[0].arrival).toBe('07:00')
    // The join between the days is the ride, and the router was asked for the two roads only.
    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(2)
    expect(result.current.days[1].arrivingLeg).toMatchObject({ mode: 'flight', duration: 9 * 3600, distance: 0 })
  })

  it('FE-ROADTRIP-ROUTES-044: an edited timetable changes the ride minutes without a routing round, and the chain is not late for it', async () => {
    calculateRouteWithLegs.mockImplementation(async (points: { lat: number; lng: number }[]) => hourly(points))
    const stops: StopSpec[] = [{ id: 1, at: HAMBURG, time: '09:00', dwell: 0 }, { id: 2, at: BERLIN, dwell: 0 }]
    const { result, rerender } = renderHook(
      ({ reservations }) => useRoadtripRoutes(7, [day(1, 1)], map(1, stops), 'driving', {}, [], [], reservations),
      { initialProps: { reservations: [flight()] } },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.days[0].legs[1]).toMatchObject({ mode: 'flight', duration: 70 * 60 })

    // The same terminals, the same roads: the landing is now forty minutes after take-off.
    rerender({ reservations: [flight({ reservation_end_time: '14:00' })] })
    await waitFor(() => expect(result.current.days[0].legs[1]?.duration).toBe(40 * 60))
    const d = result.current.days[0]
    expect(d.legs[1]?.durationText).toBe('40 min')
    expect(d.schedule.entries.map(e => e.arrival)).toEqual(['09:00', '12:20', '14:00', '15:00'])
    expect(d.schedule.warnings.filter(w => w.code === 'late')).toEqual([])
    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(2)
  })

  it('FE-ROADTRIP-ROUTES-045: an overnight ride is the join between its cards, and a moved landing moves it too', async () => {
    calculateRouteWithLegs.mockImplementation(async (points: { lat: number; lng: number }[]) => hourly(points))
    act(() => useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, roadtrip_connect_days: true } }))
    const days = [day(1, 1), day(2, 2)]
    const assignments = {
      ...map(1, [{ id: 1, at: HAMBURG, time: '18:00', dwell: 0 }]),
      ...map(2, [{ id: 2, at: BERLIN, dwell: 0 }]),
    }
    const overnight = (landing: string) => flight({ reservation_time: '22:00', reservation_end_time: landing, end_day_id: 2 })
    const { result, rerender } = renderHook(
      ({ reservations }) => useRoadtripRoutes(7, days, assignments, 'driving', {}, [], [], reservations),
      { initialProps: { reservations: [overnight('07:00')] } },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.days[1]?.arrivingLeg).toMatchObject({ mode: 'flight', duration: 9 * 3600 })
    // The ride is derived, not fetched: the router saw the two roads and nothing else.
    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(2)
    rerender({ reservations: [overnight('06:30')] })
    await waitFor(() => expect(result.current.days[1]?.arrivingLeg?.duration).toBe(8.5 * 3600))
    expect(result.current.days[1].schedule.entries[0].arrival).toBe('06:30')
    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(2)
  })

  it('FE-ROADTRIP-ROUTES-042: a booking without located terminals, or a taxi, changes nothing', async () => {
    calculateRouteWithLegs.mockImplementation(async (points: { lat: number; lng: number }[]) => hourly(points))
    const stops: StopSpec[] = [{ id: 1, at: HAMBURG }, { id: 2, at: BERLIN }]
    const unlocated = flight({ endpoints: [] })
    const taxi = flight({ id: 71, type: 'taxi' })
    const { result } = renderHook(() => useRoadtripRoutes(7, [day(1, 1)], map(1, stops), 'driving', {}, [], [], [unlocated, taxi]))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.days[0].stops.every(s => !s.carrier)).toBe(true)
    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(1)
  })

  it('FE-ROADTRIP-ROUTES-043: a hire car puts its desks on the road, one run through both, and no ride', async () => {
    calculateRouteWithLegs.mockImplementation(async (points: { lat: number; lng: number }[]) => hourly(points))
    const stops: StopSpec[] = [{ id: 1, at: LUENEBURG, time: '10:00', dwell: 0 }, { id: 2, at: BERLIN, time: '14:00', dwell: 0 }]
    const hireCar = flight({
      id: 71,
      type: 'car',
      title: 'Sixt',
      reservation_time: '09:00',
      reservation_end_time: '18:00',
      endpoints: [
        { role: 'from', sequence: 0, name: 'Sixt Hamburg', code: null, lat: HAMBURG[0], lng: HAMBURG[1], timezone: null, local_time: null, local_date: null },
        { role: 'to', sequence: 1, name: 'Sixt Berlin', code: null, lat: BERLIN[0] + 0.01, lng: BERLIN[1], timezone: null, local_time: null, local_date: null },
      ],
    })
    const { result } = renderHook(() => useRoadtripRoutes(7, [day(1, 1)], map(1, stops), 'driving', {}, [], [], [hireCar]))
    await waitFor(() => expect(result.current.loading).toBe(false))
    const d = result.current.days[0]
    expect(d.stops.map(s => s.carrier?.role ?? s.name)).toEqual(['pickup', 'Stop 1', 'Stop 2', 'return'])
    // One road, the whole day, desk to desk.
    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(1)
    expect(d.legs.map(l => l?.mode)).toEqual(['driving', 'driving', 'driving'])
    expect(d.schedule.entries[0]).toMatchObject({ arrival: '09:00', departure: '09:00' })
    expect(result.current.totalStops).toBe(2)
    expect(result.current.lines).toHaveLength(3)
  })
})

/**
 * One leg asked for again, the way the rail asks for it.
 *
 * The picker of other ways and the check behind a choice both route a single leg on
 * demand. Asked by anything but the rail's own rules, the offers described a drive the rail
 * was not on: OSRM with nothing avoided beside a day Valhalla had weighed, under the trip's
 * profile rather than the leg's own mode.
 */
describe('a leg asked for again on demand', () => {
  beforeEach(() => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } })
  })
  afterEach(() => act(() => useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } })))

  const stopOn = (ownerDayId: number, ownerIndex: number, at: [number, number], over: Partial<RoadtripStop> = {}) =>
    ({ assignmentId: ownerDayId * 10 + ownerIndex, ownerDayId, ownerIndex, lat: at[0], lng: at[1], legMode: null, incomingLegMode: null, ...over }) as RoadtripStop

  it('FE-ROADTRIP-ROUTES-046: a leg inside one day is asked with that day\'s mode, the trip\'s classes and its own day', async () => {
    act(() => { useSettingsStore.setState(s => ({ settings: { ...s.settings, roadtrip_avoid: 'toll' } })) })
    const days = [day(1, 1, { default_transport_mode: 'driving' })]
    // The trip-wide profile says walking; the day's own default is what the run used.
    const { result } = renderHook(() => useRoadtripRoutes(7, days, map(1, [{ id: 1, at: HAMBURG }, { id: 2, at: BERLIN }]), 'walking'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(calculateRouteWithLegs.mock.calls[0][1]).toMatchObject({ profile: 'driving', avoid: ['toll'], dayId: 1 })

    const [from, to] = result.current.days[0].stops
    const router = result.current.legRouter!(from, to, 1)
    expect(router).toMatchObject({ mode: 'driving', avoid: ['toll'], engine: 'valhalla' })

    calculateRouteWithLegs.mockClear()
    calculateRouteWithLegs.mockResolvedValue({ ...routed(2), hasFerry: true })
    const answer = await router.route([{ lat: 53, lng: 11 }], new AbortController().signal)

    expect(calculateRouteWithLegs).toHaveBeenCalledWith(
      [{ lat: HAMBURG[0], lng: HAMBURG[1] }, { lat: 53, lng: 11 }, { lat: BERLIN[0], lng: BERLIN[1] }],
      expect.objectContaining({ profile: 'driving', tripId: 7, dayId: 1, avoid: ['toll'] }),
    )
    expect(answer).toMatchObject({ coordinates: [HAMBURG, BERLIN], distance: 100000, duration: 3600, hasFerry: true, fellBack: false })
  })

  it('FE-ROADTRIP-ROUTES-047: a seam is asked under the card it arrives on, and a leg nothing weighs is OSRM\'s', () => {
    act(() => { useSettingsStore.setState(s => ({ settings: { ...s.settings, roadtrip_avoid: 'motorway' } })) })
    const days = [day(1, 1, { default_transport_mode: 'cycling' }), day(2, 2, { default_transport_mode: 'driving' })]
    const { result } = renderHook(() => useRoadtripRoutes(7, days, {} as AssignmentsMap))

    const lastOfDay1 = stopOn(1, 3, LUENEBURG)
    const firstOfDay2 = stopOn(2, 0, BERLIN)
    // Across the seam: day 2's default, so the car and the classes it avoids.
    expect(result.current.legRouter!(lastOfDay1, firstOfDay2, 2)).toMatchObject({ mode: 'driving', avoid: ['motorway'], engine: 'valhalla' })
    // Inside day 1: day 1's bicycle, which nothing is weighed against.
    expect(result.current.legRouter!(stopOn(1, 2, HAMBURG), lastOfDay1, 2)).toMatchObject({ mode: 'cycling', avoid: [], engine: 'osrm' })
    // A stop's own mode wins over any default, and a plugin prices its own leg.
    expect(result.current.legRouter!(stopOn(2, 0, BERLIN, { legMode: 'plugin:ev/fast' }), stopOn(2, 1, HAMBURG), 2))
      .toMatchObject({ mode: 'plugin:ev/fast', avoid: [], engine: 'plugin' })
  })

  it('FE-ROADTRIP-ROUTES-048: a day the stand-in engine drove while avoiding says the avoidance did not happen', async () => {
    act(() => { useSettingsStore.setState(s => ({ settings: { ...s.settings, roadtrip_avoid: 'toll,ferry' } })) })
    calculateRouteWithLegs.mockResolvedValue({ ...routed(1), avoidance: { asked: ['ferry', 'toll'], achieved: [], fellBack: true } })

    const { result } = renderHook(() => useRoadtripRoutes(7, [day(1, 1)], map(1, [{ id: 1, at: HAMBURG }, { id: 2, at: BERLIN }])))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.days[0].avoidMissed).toEqual(['ferry', 'toll'])
  })

  it('FE-ROADTRIP-ROUTES-050: a leg the stand-in drew says so to whoever asks, and rerouting asks the engine again', async () => {
    // The rail keeps a day run until its stops or vias change, so a choice of the leg's
    // own road, which writes nothing, left the stand-in line on the map.
    act(() => { useSettingsStore.setState(s => ({ settings: { ...s.settings, roadtrip_avoid: 'toll' } })) })
    calculateRouteWithLegs.mockResolvedValue({ ...routed(1), avoidance: { asked: ['toll'], achieved: [], fellBack: true } })
    const { result } = renderHook(() => useRoadtripRoutes(7, [day(1, 1)], map(1, [{ id: 1, at: HAMBURG }, { id: 2, at: BERLIN }])))
    await waitFor(() => expect(result.current.loading).toBe(false))
    const [from, to] = result.current.days[0].stops
    expect(result.current.legRouter!(from, to, 1)).toMatchObject({ engine: 'valhalla', standIn: true })
    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(1)

    calculateRouteWithLegs.mockResolvedValue({ ...routed(1), avoidance: { asked: ['toll'], achieved: ['toll'], fellBack: false } })
    act(() => { result.current.reroute!() })
    await waitFor(() => expect(calculateRouteWithLegs).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(result.current.legRouter!(from, to, 1).standIn).toBe(false))
    expect(result.current.days[0].avoidMissed ?? []).toEqual([])
  })
})

/**
 * FE-ROADTRIP-ROUTES-052..061: a booked night at both ends of the days around it.
 *
 * The first cases here that hand the hook the trip's stays. What is pinned is what goes to
 * the router: the drive from the hotel slept in and to tonight's is part of the day's own
 * run, a night spent at one hotel asks for nothing, no via bends the hotel's legs, and with
 * the switch off the days are the stored ones and nothing else.
 */
describe('a booked night at both ends of its days', () => {
  const GETAWAY: [number, number] = [-33.71, 150.31]
  const LOOKOUT: [number, number] = [-33.73, 150.35]
  const FALLS: [number, number] = [-33.65, 150.38]
  const WALLINGA: [number, number] = [-34.1, 150.9]
  const HOTEL: [number, number] = [45.07, 7.68]
  const P: [number, number][] = [1, 2, 3, 4, 5, 6].map(n => [45 + n * 0.1, 7 + n * 0.1])
  const VIA: [number, number] = [44.5, 7.5]

  /** A stay whose place is the one stop spec `stopId` stands for (`place_id` is id * 10). */
  const stayOf = (id: number, stopId: number, start: number, end: number, at: [number, number], over: Record<string, unknown> = {}) =>
    ({
      id, trip_id: 7, place_id: stopId * 10, start_day_id: start, end_day_id: end,
      check_in: null, check_out: '10:00', place_name: `Stay ${id}`, place_lat: at[0], place_lng: at[1],
      ...over,
    }) as unknown as Accommodation
  const booking = (id: number, accommodationId: number) =>
    ({ id, trip_id: 7, title: 'Motel', type: 'hotel', status: 'confirmed', accommodation_id: accommodationId }) as unknown as Reservation

  /** An hour and 100 km for whatever pair the router is handed. */
  const hourly = (points: { lat: number; lng: number }[]) => ({
    coordinates: points.map(p => [p.lat, p.lng] as [number, number]),
    distance: 100000 * (points.length - 1),
    duration: 3600 * (points.length - 1),
    legs: points.slice(1).map(() => ({ distance: 100000, duration: 3600, text: '' })),
  })
  /** Every run the router was asked for, as its waypoints' latitudes. */
  const asked = () => calculateRouteWithLegs.mock.calls.map(c => c[0].map((p: { lat: number }) => p.lat))
  const shape = (stops: RoadtripStop[]) =>
    stops.map(s => (s.bookend ? `${s.bookend.phase}:${s.bookend.accommodationId}` : s.name))
  const switchTo = (on: boolean) =>
    act(() => { useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, roadtrip_hotel_bookends: on } as never }) })

  beforeEach(() => {
    calculateRouteWithLegs.mockImplementation(async (points: { lat: number; lng: number }[]) => hourly(points))
    switchTo(true)
  })
  afterEach(() => act(() => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } })
    useTripStore.setState({ places: [] })
  }))

  /** A check-in with two places, then a transfer day that is only the next check-in. */
  const cam = () => ({
    days: [day(1, 1), day(2, 2), day(3, 3)],
    assignments: {
      ...map(1, [{ id: 1, at: GETAWAY }, { id: 2, at: LOOKOUT }, { id: 3, at: FALLS }]),
      ...map(2, [{ id: 4, at: WALLINGA }]),
    } as AssignmentsMap,
    stays: [stayOf(1, 1, 1, 2, GETAWAY, { check_in: '14:00' }), stayOf(2, 4, 2, 3, WALLINGA, { check_in: '15:00' })],
  })

  /** Three nights in one hotel with two places on every day before the check-out. */
  const simeon = () => ({
    days: [day(1, 1), day(2, 2), day(3, 3), day(4, 4)],
    assignments: {
      ...map(1, [{ id: 10, at: HOTEL }, { id: 11, at: P[0] }, { id: 12, at: P[1] }]),
      ...map(2, [{ id: 13, at: P[2] }, { id: 14, at: P[3] }]),
      ...map(3, [{ id: 15, at: P[4] }, { id: 16, at: P[5] }]),
    } as AssignmentsMap,
    stays: [stayOf(5, 10, 1, 4, HOTEL, { check_in: '15:00' })],
  })

  it('FE-ROADTRIP-ROUTES-052: the check-in day drives back to the stay, the transfer day sets off from it', async () => {
    const { days, assignments, stays } = cam()
    const { result } = renderHook(() => useRoadtripRoutes(7, days, assignments, 'driving', {}, [], stays, [booking(90, 1)]))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.days.map(d => shape(d.stops))).toEqual([
      ['Stop 1', 'Stop 2', 'Stop 3', 'evening:1'],
      ['morning:1', 'Stop 4'],
    ])
    // One run per day, the hotel legs inside it.
    expect(asked()).toEqual([
      [GETAWAY[0], LOOKOUT[0], FALLS[0], GETAWAY[0]],
      [GETAWAY[0], WALLINGA[0]],
    ])
    expect(result.current.days[1].stops[0].bookend).toMatchObject({ checkingOut: true, checkOut: '10:00', reservationId: 90 })
    expect(result.current.days[0].legs).toHaveLength(3)
    // Nothing numbered changes: the hotel is a service stop, the day's own stops are counted.
    expect(result.current.totalStops).toBe(4)
    // The check-out day with nothing of its own is no card.
    expect(result.current.days.map(d => d.dayId)).toEqual([1, 2])
  })

  it('FE-ROADTRIP-ROUTES-053: every day between the nights starts and ends at the hotel', async () => {
    const { days, assignments, stays } = simeon()
    const { result } = renderHook(() => useRoadtripRoutes(7, days, assignments, 'driving', {}, [], stays))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.days.map(d => shape(d.stops))).toEqual([
      ['Stop 10', 'Stop 11', 'Stop 12', 'evening:5'],
      ['morning:5', 'Stop 13', 'Stop 14', 'evening:5'],
      ['morning:5', 'Stop 15', 'Stop 16', 'evening:5'],
    ])
    expect(asked()).toEqual([
      [HOTEL[0], P[0][0], P[1][0], HOTEL[0]],
      [HOTEL[0], P[2][0], P[3][0], HOTEL[0]],
      [HOTEL[0], P[4][0], P[5][0], HOTEL[0]],
    ])
    // The check-out day has nothing of its own and is not driven.
    expect(result.current.days.map(d => d.dayId)).toEqual([1, 2, 3])
  })

  it('FE-ROADTRIP-ROUTES-054: with the days connected, a night spent at one hotel asks the router nothing', async () => {
    act(() => { useSettingsStore.setState(s => ({ settings: { ...s.settings, roadtrip_connect_days: true } })) })
    const { days, assignments, stays } = cam()
    const { result } = renderHook(() => useRoadtripRoutes(7, days, assignments, 'driving', {}, [], stays))
    await waitFor(() => expect(result.current.loading).toBe(false))

    // The two day runs and nothing else: no seam from the Getaway to the Getaway.
    expect(asked()).toEqual([
      [GETAWAY[0], LOOKOUT[0], FALLS[0], GETAWAY[0]],
      [GETAWAY[0], WALLINGA[0]],
    ])
    expect(result.current.days[1].arrivingLeg).toBeFalsy()
    expect(result.current.totalDistance).toBe(400000)
  })

  it('FE-ROADTRIP-ROUTES-055: a via behind the last place of a day does not bend the drive to tonight’s stay', async () => {
    const { days, assignments, stays } = cam()
    const vias = { 1: [{ id: 1, day_id: 1, after_order_index: 2, sequence: 0, lat: VIA[0], lng: VIA[1] }] }
    const { result } = renderHook(() => useRoadtripRoutes(7, days, assignments, 'driving', vias, [], stays))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(asked()[0]).toEqual([GETAWAY[0], LOOKOUT[0], FALLS[0], GETAWAY[0]])
    expect(asked().flat()).not.toContain(VIA[0])
  })

  it('FE-ROADTRIP-ROUTES-056: no via leaves the morning hotel; one after the first place stays after it', async () => {
    const { days, assignments, stays } = simeon()
    const vias = { 2: [{ id: 1, day_id: 2, after_order_index: 0, sequence: 0, lat: VIA[0], lng: VIA[1] }] }
    const { result } = renderHook(() => useRoadtripRoutes(7, days, assignments, 'driving', vias, [], stays))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(asked()[1]).toEqual([HOTEL[0], P[2][0], VIA[0], P[3][0], HOTEL[0]])
  })

  it('FE-ROADTRIP-ROUTES-057: a transfer day with nothing stored drives from one stay to the other', async () => {
    const days = [day(1, 1), day(2, 2), day(3, 3)]
    const assignments = { ...map(1, [{ id: 1, at: GETAWAY }, { id: 2, at: LOOKOUT }]) } as AssignmentsMap
    const stays = [stayOf(1, 1, 1, 2, GETAWAY), stayOf(2, 4, 2, 3, WALLINGA)]
    const { result } = renderHook(() => useRoadtripRoutes(7, days, assignments, 'driving', {}, [], stays))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const transfer = result.current.days.find(d => d.dayId === 2)!
    expect(shape(transfer.stops)).toEqual(['morning:1', 'evening:2'])
    expect(transfer.stops.map(s => s.bookend && [s.bookend.checkingOut, s.bookend.checkingIn])).toEqual([[true, false], [false, true]])
    expect(asked()).toContainEqual([GETAWAY[0], WALLINGA[0]])
  })

  it('FE-ROADTRIP-ROUTES-058: switched off, the days are the stored ones, and back on and off again they are again', async () => {
    switchTo(false)
    const { days, assignments, stays } = simeon()
    const { result } = renderHook(() => useRoadtripRoutes(7, days, assignments, 'driving', {}, [], stays))
    await waitFor(() => expect(result.current.loading).toBe(false))
    const stored = result.current.days.map(d => d.stops)
    expect(stored.flat().some(s => s.bookend)).toBe(false)
    expect(asked()).toEqual([
      [HOTEL[0], P[0][0], P[1][0]],
      [P[2][0], P[3][0]],
      [P[4][0], P[5][0]],
    ])

    switchTo(true)
    await waitFor(() => expect(result.current.days[1]?.stops[0]?.bookend?.phase).toBe('morning'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    switchTo(false)
    await waitFor(() => expect(result.current.days.flatMap(d => d.stops).some(s => s.bookend)).toBe(false))
    expect(result.current.days.map(d => d.stops)).toEqual(stored)
  })

  it('FE-ROADTRIP-ROUTES-059: linking a booking to the stay changes the hotel row, not the road', async () => {
    const { days, assignments, stays } = cam()
    const { result, rerender } = renderHook(
      ({ reservations }) => useRoadtripRoutes(7, days, assignments, 'driving', {}, [], stays, reservations),
      { initialProps: { reservations: [] as Reservation[] } },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.days[1].stops[0].bookend?.reservationId).toBeNull()
    const calls = calculateRouteWithLegs.mock.calls.length

    rerender({ reservations: [booking(91, 1), booking(90, 1)] })
    // The earliest booking of the stay, and the router is not asked again.
    await waitFor(() => expect(result.current.days[1].stops[0].bookend?.reservationId).toBe(90))
    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(calls)
  })

  it('FE-ROADTRIP-ROUTES-060: a hotel whose pin was moved stands where its place is now, not where the stay row last saw it', async () => {
    // The stay rows are fetched on a stay's own edit only, so after the pin moved they still
    // carry the old spot while the visit is already at the new one. Seated from the row,
    // the check-in day drove from the hotel's stop to its old spot and every morning set
    // off from there, while the server, which joins the place afresh, planned neither.
    const MOVED: [number, number] = [-33.8, 150.2]
    const days = [day(1, 1), day(2, 2), day(3, 3)]
    const assignments = {
      ...map(1, [{ id: 1, at: MOVED }]),
      ...map(2, [{ id: 2, at: LOOKOUT }]),
    } as AssignmentsMap
    const stays = [stayOf(1, 1, 1, 3, GETAWAY)]
    act(() => {
      useTripStore.setState({ places: [{ id: 10, trip_id: 7, name: 'Getaway Motel', lat: MOVED[0], lng: MOVED[1] }] as never })
    })
    const { result } = renderHook(() => useRoadtripRoutes(7, days, assignments, 'driving', {}, [], stays))
    await waitFor(() => expect(result.current.loading).toBe(false))

    // The check-in day is its hotel alone, with no drive to a second copy of it.
    expect(result.current.days.map(d => shape(d.stops))).toEqual([
      ['Stop 1'],
      ['morning:1', 'Stop 2', 'evening:1'],
    ])
    expect(result.current.days[1].stops[0]).toMatchObject({ lat: MOVED[0], lng: MOVED[1], name: 'Getaway Motel' })
    expect(asked()).toEqual([[MOVED[0], LOOKOUT[0], MOVED[0]]])
  })

  it('FE-ROADTRIP-ROUTES-061: the drive out of the morning hotel goes the way the first place is reached from it', async () => {
    // The mode the day plan draws that leg in, and the one the server routes it in.
    const { days, stays } = simeon()
    const assignments = {
      ...map(1, [{ id: 10, at: HOTEL }, { id: 11, at: P[0] }, { id: 12, at: P[1] }]),
      ...map(2, [{ id: 13, at: P[2], incoming: 'walking' }, { id: 14, at: P[3] }]),
      ...map(3, [{ id: 15, at: P[4] }, { id: 16, at: P[5] }]),
    } as AssignmentsMap
    const { result } = renderHook(() => useRoadtripRoutes(7, days, assignments, 'driving', {}, [], stays))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const runs = calculateRouteWithLegs.mock.calls.map(c => [c[1].profile, c[0].map((p: { lat: number }) => p.lat)])
    expect(runs).toContainEqual(['walking', [HOTEL[0], P[2][0]]])
    expect(runs).toContainEqual(['driving', [P[2][0], P[3][0], HOTEL[0]]])
    expect(runs).toContainEqual(['driving', [HOTEL[0], P[4][0], P[5][0], HOTEL[0]]])
  })
})

/**
 * FE-ROADTRIP-ROUTES-062..063: a flight on the day the next stay begins.
 *
 * Trip 45 on the dev instance: a night in Hamburg, then LH 2078 to Munich at 15:15 on the day
 * the Munich hotel is checked into from 15:00. And a move between two stays by a flight saved
 * without its airports. What is pinned is the day the rail reads and what goes to the router.
 */
describe('a flight on the day the next stay begins', () => {
  const ATLANTIC: [number, number] = [53.5573, 10.0056]
  const BAYERISCHER_HOF: [number, number] = [48.1403, 11.5732]
  const HAM: [number, number] = [53.630402, 9.98823]
  const MUC: [number, number] = [48.353802, 11.7861]
  const GETAWAY: [number, number] = [-33.71, 150.31]
  const LOOKOUT: [number, number] = [-33.73, 150.35]
  const WALLINGA: [number, number] = [-34.1, 150.9]

  const stayOf = (id: number, stopId: number, start: number, end: number, at: [number, number]) =>
    ({
      id, trip_id: 7, place_id: stopId * 10, start_day_id: start, end_day_id: end,
      check_in: '15:00', check_out: '11:00', place_name: `Stay ${id}`, place_lat: at[0], place_lng: at[1],
    }) as unknown as Accommodation
  const lh2078 = (over: Record<string, unknown> = {}) => ({
    id: 77,
    trip_id: 7,
    title: 'LH 2078 HAM-MUC',
    type: 'flight',
    status: 'pending',
    day_id: 3,
    end_day_id: 3,
    reservation_time: '2026-11-04T15:15',
    reservation_end_time: '2026-11-04T17:20',
    day_plan_position: 0.5,
    endpoints: [
      { role: 'from', sequence: 0, name: 'Hamburg (HAM)', code: 'HAM', lat: HAM[0], lng: HAM[1], timezone: 'Europe/Berlin', local_time: '15:15', local_date: '2026-11-04' },
      { role: 'to', sequence: 1, name: 'Munich (MUC)', code: 'MUC', lat: MUC[0], lng: MUC[1], timezone: 'Europe/Berlin', local_time: '17:20', local_date: '2026-11-04' },
    ],
    ...over,
  }) as unknown as Reservation

  const hourly = (points: { lat: number; lng: number }[]) => ({
    coordinates: points.map(p => [p.lat, p.lng] as [number, number]),
    distance: 100000 * (points.length - 1),
    duration: 3600 * (points.length - 1),
    legs: points.slice(1).map(() => ({ distance: 100000, duration: 3600, text: '' })),
  })
  const asked = () => calculateRouteWithLegs.mock.calls.map(c => c[0].map((p: { lat: number }) => p.lat))
  const shape = (stops: RoadtripStop[]) =>
    stops.map(s => (s.bookend ? `${s.bookend.phase}:${s.bookend.accommodationId}` : s.carrier ? s.carrier.role : s.name))
  const switchTo = (on: boolean) =>
    act(() => { useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, roadtrip_hotel_bookends: on } as never }) })

  beforeEach(() => {
    calculateRouteWithLegs.mockImplementation(async (points: { lat: number; lng: number }[]) => hourly(points))
  })
  afterEach(() => act(() => useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } })))

  it('FE-ROADTRIP-ROUTES-062: the Munich hotel waits behind the landing, and no road runs between the two cities, switch on or off', async () => {
    const days = [day(1, 1), day(2, 2), day(3, 3), day(4, 4), day(5, 5)]
    const assignments = { ...map(1, [{ id: 1, at: ATLANTIC, dwell: 60 }]), ...map(3, [{ id: 2, at: BAYERISCHER_HOF, dwell: 60 }]) } as AssignmentsMap
    const stays = [stayOf(33, 1, 1, 3, ATLANTIC), stayOf(34, 2, 3, 5, BAYERISCHER_HOF)]
    const { result } = renderHook(() => useRoadtripRoutes(7, days, assignments, 'driving', {}, [], stays, [lh2078()]))
    const flightDay = () => result.current.days.find(d => d.dayId === 3)!
    // Only ever a road inside one city: every run asked for lies north of 53 or south of 49.
    const oneCity = () => asked().every(run => run.every(lat => lat > 53) || run.every(lat => lat < 49))

    switchTo(false)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(shape(flightDay().stops)).toEqual(['departure', 'arrival', 'Stop 2'])
    expect(oneCity()).toBe(true)
    // At the airport by the check-in, and at the hotel from the landing, not late for 15:00.
    expect(flightDay().schedule.entries.map(e => e.arrival)).toEqual(['14:15', '17:20', '18:20'])
    expect(flightDay().schedule.warnings).toEqual([])

    switchTo(true)
    await waitFor(() => expect(flightDay()?.stops[0]?.bookend?.phase).toBe('morning'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(shape(flightDay().stops)).toEqual(['morning:33', 'departure', 'arrival', 'Stop 2'])
    expect(asked()).toContainEqual([ATLANTIC[0], HAM[0]])
    expect(oneCity()).toBe(true)
  })

  it('FE-ROADTRIP-ROUTES-063: a flight saved without its airports is the move between two stays, and no road is asked for it', async () => {
    switchTo(true)
    const days = [day(1, 1), day(2, 2), day(3, 3)]
    const assignments = { ...map(1, [{ id: 1, at: GETAWAY }, { id: 3, at: LOOKOUT }]), ...map(2, [{ id: 4, at: WALLINGA }]) } as AssignmentsMap
    const stays = [stayOf(1, 1, 1, 2, GETAWAY), stayOf(2, 4, 2, 3, WALLINGA)]
    const unlocated = lh2078({ day_id: 2, end_day_id: 2, endpoints: [] })
    const { result } = renderHook(() => useRoadtripRoutes(7, days, assignments, 'driving', {}, [], stays, [unlocated]))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.days.find(d => d.dayId === 2)!.stops.map(s => s.name)).toEqual(['Stop 4'])
    expect(asked().flat()).not.toContain(WALLINGA[0])
  })
})
