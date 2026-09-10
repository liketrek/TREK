import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Assignment, AssignmentsMap, Day, Settings } from '../../types'

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
vi.mock('../Map/RouteCalculator', () => ({ calculateRouteWithLegs, RoutingRefusedError }))

import { useRoadtripRoutes } from './useRoadtripRoutes'
import { DEFAULT_SETTINGS, useSettingsStore } from '../../store/settingsStore'
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
    })
  })
})
