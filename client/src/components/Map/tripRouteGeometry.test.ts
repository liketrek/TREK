import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dayColor } from '../Roadtrip/dayColors'
import { dayRouteColor, planTripRoute, routeTrip, summariseTripRoute } from './tripRouteGeometry'
import { buildAssignment, buildDay, buildPlace } from '../../../tests/helpers/factories'
import type { AssignmentsMap, RouteSegment } from '../../types'

vi.mock('./RouteCalculator', async (importActual) => {
  const actual = await importActual<typeof import('./RouteCalculator')>()
  return { ...actual, calculateRouteWithLegs: vi.fn() }
})

const { calculateRouteWithLegs } = await import('./RouteCalculator')

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
})
