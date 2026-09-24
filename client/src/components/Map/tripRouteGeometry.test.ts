import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dayColor } from '../Roadtrip/dayColors'
import { dayRouteColor, planTripRoute, routeTrip, summariseTripRoute } from './tripRouteGeometry'
import { buildAssignment, buildDay, buildPlace } from '../../../tests/helpers/factories'
import type { Accommodation, AssignmentsMap, Reservation, RouteSegment } from '../../types'

vi.mock('./RouteCalculator', async (importActual) => {
  const actual = await importActual<typeof import('./RouteCalculator')>()
  return { ...actual, calculateRouteWithLegs: vi.fn() }
})

const { calculateRouteWithLegs, RoutingRefusedError } = await import('./RouteCalculator')

const leg = (distance: number): RouteSegment => ({
  mid: [0, 0], from: [0, 0], to: [0, 0], distance, duration: 600,
  distanceText: '10 km', durationText: '10 min', walkingText: '2 h', drivingText: '10 min',
})

/** A router that never answers but honours its signal, exactly as a real fetch does —
 *  without that the abort has nothing to cut and the pool waits forever. */
const neverAnswers = () => vi.mocked(calculateRouteWithLegs).mockImplementation(
  (_waypoints, opts) => new Promise((_resolve, reject) => {
    opts?.signal?.addEventListener(
      'abort',
      () => reject(new DOMException('Aborted', 'AbortError')),
      { once: true },
    )
  }) as ReturnType<typeof calculateRouteWithLegs>,
)

const at = (lat: number, lng: number, order: number, dayId: number) =>
  buildAssignment({ day_id: dayId, order_index: order, place: buildPlace({ lat, lng }) })

const DAYS = [buildDay({ id: 1, day_number: 1 }), buildDay({ id: 2, day_number: 2 })]
const ASSIGNMENTS: AssignmentsMap = {
  '1': [at(48.86, 2.35, 0, 1), at(48.90, 2.42, 1, 1)],
  '2': [at(45.76, 4.83, 0, 2), at(45.80, 4.90, 1, 2)],
}
const input = { days: DAYS, assignments: ASSIGNMENTS, reservations: [], accommodations: [], optimizeFromAccommodation: false }

beforeEach(() => {
  vi.mocked(calculateRouteWithLegs).mockReset()
  vi.mocked(calculateRouteWithLegs).mockResolvedValue({
    coordinates: [[48.86, 2.35], [48.90, 2.42]],
    distance: 10000, duration: 600,
    legs: [leg(10000)],
  })
})

describe('tripRouteGeometry', () => {
  it('FE-MAP-TRG-001: plans one request per day and skips days with nothing to drive', () => {
    const plan = planTripRoute({ ...input, assignments: { ...ASSIGNMENTS, '2': [at(45.76, 4.83, 0, 2)] } }, 'driving')

    expect(plan).toHaveLength(1)
    expect(plan[0].day.id).toBe(1)
    expect(plan[0].runs[0]).toHaveLength(1)
  })

  it('FE-MAP-TRG-002: a day is drawn in the colour the road trip gives it', () => {
    // One palette for both readings of the trip, so a day never changes colour.
    expect(dayRouteColor(buildDay({ day_number: 1 }))).toEqual(dayColor(1))
    expect(dayRouteColor(buildDay({ day_number: 2 }))).toEqual(dayColor(2))
  })

  it('FE-MAP-TRG-003: routes every day and sums the trip', async () => {
    const summary = await routeTrip(input, { profile: 'driving', tripId: 7 })

    expect(summary.days).toHaveLength(2)
    expect(summary.totalDistance).toBe(20000)
    expect(summary.lines).toHaveLength(2)
    expect(summary.lineColors).toHaveLength(2)
  })

  it('FE-MAP-TRG-004: an empty trip summarises to nothing rather than throwing', async () => {
    const summary = await routeTrip({ ...input, assignments: {} }, { profile: 'driving', tripId: 7 })

    expect(summary).toEqual(summariseTripRoute([]))
    expect(calculateRouteWithLegs).not.toHaveBeenCalled()
  })

  it('FE-MAP-TRG-005: the deadline gives back what answered and leaves the rest as straight lines', async () => {
    neverAnswers()
    vi.useFakeTimers()
    try {
      const pending = routeTrip(input, { profile: 'driving', tripId: 7, timeoutMs: 8000 })
      await vi.advanceTimersByTimeAsync(8100)
      const summary = await pending

      // The shape of the trip survives...
      expect(summary.lines).toHaveLength(2)
      expect(summary.lines[0]).toEqual([[48.86, 2.35], [48.90, 2.42]])
      // ...and nothing that never answered is counted.
      expect(summary.totalDistance).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('FE-MAP-TRG-006: a caller\'s own abort cuts the routing short too', async () => {
    neverAnswers()
    const controller = new AbortController()
    const pending = routeTrip(input, { profile: 'driving', tripId: 7, timeoutMs: 60_000, signal: controller.signal })
    controller.abort()

    await expect(pending).resolves.toMatchObject({ totalDistance: 0 })
  })

  // The public OSRM hosts allow about one request a second. Every leg of every day at
  // once is exactly the burst they answer with 429 from the second second on, and each
  // refused leg used to stay a straight line with no distance and no word about it.
  it('FE-MAP-TRG-007: asks the router one leg at a time, a second apart', async () => {
    vi.useFakeTimers()
    try {
      // A round trip takes time; only a network answer is paced, a cache hit is not.
      vi.mocked(calculateRouteWithLegs).mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ coordinates: [[48.86, 2.35], [48.90, 2.42]], distance: 10000, duration: 600, legs: [leg(10000)] }), 100)
      }))
      const pending = routeTrip(input, { profile: 'driving', tripId: 7 })

      // The second day waits for the first to answer...
      expect(calculateRouteWithLegs).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(100)
      // ...and then for the gap the shared hosts need between two requests.
      expect(calculateRouteWithLegs).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(1100)
      expect(calculateRouteWithLegs).toHaveBeenCalledTimes(2)

      await vi.advanceTimersByTimeAsync(100)
      const summary = await pending
      expect(summary.totalDistance).toBe(20000)
      expect(summary.unroutedLegs).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('FE-MAP-TRG-008: a rate limit is waited out and the leg asked for again', async () => {
    vi.useFakeTimers()
    try {
      vi.mocked(calculateRouteWithLegs)
        .mockRejectedValueOnce(new RoutingRefusedError(429, null))
        .mockResolvedValue({ coordinates: [[48.86, 2.35], [48.90, 2.42]], distance: 10000, duration: 600, legs: [leg(10000)] })
      const pending = routeTrip(input, { profile: 'driving', tripId: 7 })

      await vi.advanceTimersByTimeAsync(1500)
      expect(calculateRouteWithLegs).toHaveBeenCalledTimes(2)
      await vi.advanceTimersByTimeAsync(1100)
      const summary = await pending

      // Both days routed: the refused leg answered on its second try.
      expect(calculateRouteWithLegs).toHaveBeenCalledTimes(3)
      expect(summary.totalDistance).toBe(20000)
      expect(summary.unroutedLegs).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('FE-MAP-TRG-009: a host that says how long to wait is given that long', async () => {
    vi.useFakeTimers()
    try {
      vi.mocked(calculateRouteWithLegs)
        .mockRejectedValueOnce(new RoutingRefusedError(429, 6000))
        .mockResolvedValue({ coordinates: [[48.86, 2.35], [48.90, 2.42]], distance: 10000, duration: 600, legs: [leg(10000)] })
      const pending = routeTrip(input, { profile: 'driving', tripId: 7 })

      // The own first backoff would be 1500 ms; asking then is just a second refusal.
      await vi.advanceTimersByTimeAsync(2000)
      expect(calculateRouteWithLegs).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(4000)
      expect(calculateRouteWithLegs).toHaveBeenCalledTimes(2)

      await vi.advanceTimersByTimeAsync(1100)
      await expect(pending).resolves.toMatchObject({ totalDistance: 20000 })
    } finally {
      vi.useRealTimers()
    }
  })

  it('FE-MAP-TRG-010: a refusal the host meant is not repeated, and the leg is counted as unrouted', async () => {
    // A 400 objects to these coordinates; the same request earns the same answer.
    vi.mocked(calculateRouteWithLegs)
      .mockRejectedValueOnce(new RoutingRefusedError(400, null))
      .mockResolvedValue({ coordinates: [[45.76, 4.83], [45.80, 4.90]], distance: 10000, duration: 600, legs: [leg(10000)] })

    const summary = await routeTrip(input, { profile: 'driving', tripId: 7 })

    expect(calculateRouteWithLegs).toHaveBeenCalledTimes(2)
    // The first day keeps its straight line and adds nothing to the sum...
    expect(summary.lines[0]).toEqual([[48.86, 2.35], [48.90, 2.42]])
    expect(summary.days[0].distance).toBe(0)
    expect(summary.totalDistance).toBe(10000)
    // ...and says so, per day and for the trip, so the total is not mistaken for complete.
    expect(summary.days.map(d => d.unroutedLegs)).toEqual([1, 0])
    expect(summary.unroutedLegs).toBe(1)
  })

  it('FE-MAP-TRG-011: a rate limit that never lifts gives up after the retries and is counted', async () => {
    vi.useFakeTimers()
    try {
      vi.mocked(calculateRouteWithLegs).mockRejectedValue(new RoutingRefusedError(429, null))
      const pending = routeTrip(input, { profile: 'driving', tripId: 7 })

      // Two backoffs per leg, a gap between the legs, then it stops asking.
      await vi.advanceTimersByTimeAsync(20000)
      const summary = await pending

      expect(calculateRouteWithLegs).toHaveBeenCalledTimes(6)
      expect(summary.totalDistance).toBe(0)
      expect(summary.unroutedLegs).toBe(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('FE-MAP-TRG-012: the overview draws no drive between two stays on the day a flight connects them (#2476)', () => {
    // Day 2 moves from a Munich hotel to a Hamburg one. The overview reads the same
    // day plan as the map, so the flight saved without airports keeps the road off it.
    const days = [1, 2, 3].map(n => buildDay({ id: n, day_number: n }))
    const accommodations = [
      { id: 1, trip_id: 1, place_lat: 48.137, place_lng: 11.575, start_day_id: 1, end_day_id: 2 },
      { id: 2, trip_id: 1, place_lat: 53.551, place_lng: 9.993, start_day_id: 2, end_day_id: 3 },
    ] as unknown as Accommodation[]
    const flight = {
      id: 80, trip_id: 1, type: 'flight', title: 'LH 2078', day_id: 2, end_day_id: 2,
      reservation_time: '2026-11-04T15:15', reservation_end_time: '2026-11-04T17:20', endpoints: [],
    } as unknown as Reservation
    const moving = { days, assignments: {}, accommodations, optimizeFromAccommodation: true }

    expect(planTripRoute({ ...moving, reservations: [flight] }, 'driving')).toEqual([])
    // Without the booking the day is a drive from one hotel to the other, as before (#1297).
    const byRoad = planTripRoute({ ...moving, reservations: [] }, 'driving')
    expect(byRoad.map(d => d.day.id)).toEqual([2])
  })
})
