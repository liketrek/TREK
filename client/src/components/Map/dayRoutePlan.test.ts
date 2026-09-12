import { describe, it, expect } from 'vitest'
import { buildDayRouteRuns } from './dayRoutePlan'
import { buildAssignment, buildDay, buildPlace } from '../../../tests/helpers/factories'
import type { Accommodation, AssignmentsMap, Day, Reservation } from '../../types'

const at = (lat: number, lng: number, order: number, extra: Record<string, unknown> = {}) =>
  buildAssignment({ day_id: 1, order_index: order, place: buildPlace({ lat, lng }), ...extra })

const inputs = (over: Partial<{
  days: Day[]; assignments: AssignmentsMap; reservations: Reservation[]
  accommodations: Accommodation[]; optimizeFromAccommodation: boolean | undefined
}> = {}) => ({
  days: [buildDay({ id: 1, day_number: 1 })],
  assignments: {},
  reservations: [],
  accommodations: [],
  optimizeFromAccommodation: false,
  ...over,
})

describe('buildDayRouteRuns', () => {
  it('FE-MAP-DRP-001: orders a day\'s located stops into one run', () => {
    const runs = buildDayRouteRuns(1, inputs({
      assignments: { '1': [at(48.86, 2.35, 1), at(45.76, 4.83, 0)] },
    }))

    expect(runs).toHaveLength(1)
    // order_index, not the order they happen to sit in the array.
    expect(runs[0].map(p => p.lat)).toEqual([45.76, 48.86])
    expect(runs[0].every(p => p.isPlace)).toBe(true)
  })

  it('FE-MAP-DRP-002: drops a stop with no coordinates', () => {
    const runs = buildDayRouteRuns(1, inputs({
      assignments: {
        '1': [
          at(48.86, 2.35, 0),
          buildAssignment({ day_id: 1, order_index: 1, place: buildPlace({ lat: null, lng: null }) }),
          at(45.76, 4.83, 2),
        ],
      },
    }))

    expect(runs[0]).toHaveLength(2)
  })

  it('FE-MAP-DRP-003: a lone stop is no drive at all', () => {
    expect(buildDayRouteRuns(1, inputs({ assignments: { '1': [at(48.86, 2.35, 0)] } }))).toEqual([])
  })

  it('FE-MAP-DRP-004: carries the per-leg travel modes the router resolves against', () => {
    const runs = buildDayRouteRuns(1, inputs({
      assignments: {
        '1': [
          at(48.86, 2.35, 0, { leg_transport_mode: 'walking' }),
          at(48.88, 2.36, 1, { incoming_leg_transport_mode: 'cycling' }),
        ],
      },
    }))

    expect(runs[0][0].leg_transport_mode).toBe('walking')
    expect(runs[0][1].incoming_leg_transport_mode).toBe('cycling')
  })

  it('FE-MAP-DRP-005: two real places stay one run however far apart they are', () => {
    // Paris → Tokyo is far past MAX_DRIVE_KM, but both are real places someone
    // planned, so the run stands: the reachability guard only ever splits a leg
    // that touches a booking endpoint (#2133).
    const runs = buildDayRouteRuns(1, inputs({
      assignments: { '1': [at(48.86, 2.35, 0), at(35.68, 139.69, 1)] },
    }))

    expect(runs).toHaveLength(1)
  })

  it('FE-MAP-DRP-006: bookends the day with its accommodation when the setting is on', () => {
    const accommodation = {
      id: 1, trip_id: 1, place_lat: 48.80, place_lng: 2.30,
      start_day_id: 1, end_day_id: 1,
    } as unknown as Accommodation
    const runs = buildDayRouteRuns(1, inputs({
      assignments: { '1': [at(48.86, 2.35, 0), at(48.88, 2.36, 1)] },
      accommodations: [accommodation],
      optimizeFromAccommodation: true,
    }))

    const flat = runs.flat()
    expect(flat.some(p => p.lat === 48.80 && !p.isPlace)).toBe(true)
  })

  it('FE-MAP-DRP-007: leaves the hotel out when the setting is off', () => {
    const accommodation = {
      id: 1, trip_id: 1, place_lat: 48.80, place_lng: 2.30,
      start_day_id: 1, end_day_id: 1,
    } as unknown as Accommodation
    const runs = buildDayRouteRuns(1, inputs({
      assignments: { '1': [at(48.86, 2.35, 0), at(48.88, 2.36, 1)] },
      accommodations: [accommodation],
      optimizeFromAccommodation: false,
    }))

    expect(runs.flat().some(p => p.lat === 48.80)).toBe(false)
  })

  it('FE-MAP-DRP-008: a day that is not in the trip has no route', () => {
    expect(buildDayRouteRuns(99, inputs({ assignments: { '1': [at(48.86, 2.35, 0)] } }))).toEqual([])
  })
})
