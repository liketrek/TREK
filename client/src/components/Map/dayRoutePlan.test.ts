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

  it('FE-MAP-DRP-009: the stop a booked night wrote is no waypoint; the hotel is the bookend, behind the flight (#2430)', () => {
    // Check-in at four, a flight in the morning, nothing else: the day plan hides the
    // hotel's own stop and shows the flight, then the hotel. The road used to start at
    // the hotel and drive to the departure airport, because the untimed stop kept
    // its stored place ahead of the timed booking.
    const hotel = { id: 30, trip_id: 1, place_lat: 53.5465, place_lng: 9.9727, start_day_id: 1, end_day_id: 3, check_in: '16:00', check_out: '11:00' } as unknown as Accommodation
    const flight = {
      id: 7, trip_id: 1, type: 'flight', title: 'KL 1783', status: 'confirmed', day_id: 1, end_day_id: 1,
      reservation_time: '2026-10-19T10:00', reservation_end_time: '2026-10-19T11:00',
      endpoints: [
        { role: 'from', sequence: 0, name: 'AMS', lat: 52.3105, lng: 4.7683 },
        { role: 'to', sequence: 1, name: 'HAM', lat: 53.6304, lng: 9.9882 },
      ],
    } as unknown as Reservation
    const runs = buildDayRouteRuns(1, inputs({
      days: [buildDay({ id: 1, day_number: 1 }), buildDay({ id: 2, day_number: 2 }), buildDay({ id: 3, day_number: 3 })],
      assignments: { '1': [at(53.5465, 9.9727, 0, { accommodation_id: 30 })] },
      reservations: [flight],
      accommodations: [hotel],
      optimizeFromAccommodation: true,
    }))
    // One road: from the arrival airport to the hotel. None out of the hotel.
    expect(runs).toHaveLength(1)
    expect(runs[0].map(p => [p.lat, p.lng])).toEqual([[53.6304, 9.9882], [53.5465, 9.9727]])
  })

  it('FE-MAP-DRP-010: a hotel the traveller placed as a stop of their own still ends the road (#2430)', () => {
    // The same day, but the hotel stop is not the booking's: it stays a waypoint, and
    // the bookend rule declines the zero-kilometre leg onto itself as before.
    const hotel = { id: 30, trip_id: 1, place_lat: 53.5465, place_lng: 9.9727, start_day_id: 1, end_day_id: 3, check_in: '16:00', check_out: '11:00' } as unknown as Accommodation
    const runs = buildDayRouteRuns(1, inputs({
      days: [buildDay({ id: 1, day_number: 1 }), buildDay({ id: 3, day_number: 3 })],
      assignments: { '1': [at(53.5503, 9.9937, 0), at(53.5465, 9.9727, 1)] },
      accommodations: [hotel],
      optimizeFromAccommodation: true,
    }))
    expect(runs).toHaveLength(1)
    expect(runs[0].map(p => p.lat)).toEqual([53.5503, 53.5465])
  })

  it('FE-MAP-DRP-008: a day that is not in the trip has no route', () => {
    expect(buildDayRouteRuns(99, inputs({ assignments: { '1': [at(48.86, 2.35, 0)] } }))).toEqual([])
  })

  describe('a moving day from one stay to the next (#2476)', () => {
    // Day 3 checks out of a hotel in Munich and into one in Hamburg, with a flight
    // in between. The booked Hamburg night wrote its own (hidden) stop onto day 3.
    const HOTEL_A = { lat: 48.137, lng: 11.575 }
    const HOTEL_B = { lat: 53.551, lng: 9.993 }
    const MUC = { lat: 48.353, lng: 11.786 }
    const HAM = { lat: 53.63, lng: 9.988 }
    const days = [1, 2, 3, 4, 5].map(n => buildDay({ id: n, day_number: n }))
    const stays = [
      { id: 1, trip_id: 1, place_lat: HOTEL_A.lat, place_lng: HOTEL_A.lng, start_day_id: 1, end_day_id: 3, check_in: '15:00', check_out: '11:00' },
      { id: 2, trip_id: 1, place_lat: HOTEL_B.lat, place_lng: HOTEL_B.lng, start_day_id: 3, end_day_id: 5, check_in: '15:00', check_out: '11:00' },
    ] as unknown as Accommodation[]
    const bookedStop = buildAssignment({ day_id: 3, order_index: 0, accommodation_id: 2, place: buildPlace({ ...HOTEL_B }) })
    const flight = (located: boolean) => ({
      id: 7, trip_id: 1, type: 'flight', title: 'LH 2078', status: 'confirmed', day_id: 3, end_day_id: 3,
      reservation_time: '2026-11-04T15:15', reservation_end_time: '2026-11-04T17:20',
      endpoints: located
        ? [{ role: 'from', sequence: 0, name: 'MUC', ...MUC }, { role: 'to', sequence: 1, name: 'HAM', ...HAM }]
        : [],
    }) as unknown as Reservation
    const movingDay = (reservations: Reservation[], dayStops = [bookedStop]) =>
      buildDayRouteRuns(3, inputs({
        days, assignments: { '3': dayStops }, reservations, accommodations: stays, optimizeFromAccommodation: true,
      })).map(run => run.map(p => [p.lat, p.lng]))

    it('FE-MAP-DRP-011: a flight saved without airports draws no drive from one hotel to the other', () => {
      // Nothing located is left on the day, and the flight is still the move: a road
      // from Munich to Hamburg is exactly the trip that did not happen.
      expect(movingDay([flight(false)])).toEqual([])
    })

    it('FE-MAP-DRP-012: with its airports the flight splits the day at them, as reported', () => {
      expect(movingDay([flight(true)])).toEqual([
        [[HOTEL_A.lat, HOTEL_A.lng], [MUC.lat, MUC.lng]],
        [[HAM.lat, HAM.lng], [HOTEL_B.lat, HOTEL_B.lng]],
      ])
    })

    it('FE-MAP-DRP-013: without any booking the move is still the drive between the two hotels (#1297)', () => {
      expect(movingDay([])).toEqual([[[HOTEL_A.lat, HOTEL_A.lng], [HOTEL_B.lat, HOTEL_B.lng]]])
    })

    it('FE-MAP-DRP-014: a hotel stop planned by hand ahead of the flight is reached after landing', () => {
      // The traveller put the Hamburg hotel on the day before booking it, so the stop
      // stays visible and carries no time. The flight still seats itself in front of
      // the place it lands next to, and no road runs from Munich to Hamburg.
      const handPlaced = at(HOTEL_B.lat, HOTEL_B.lng, 0, { day_id: 3 })
      expect(movingDay([flight(true)], [handPlaced])).toEqual([
        [[HOTEL_A.lat, HOTEL_A.lng], [MUC.lat, MUC.lng]],
        [[HAM.lat, HAM.lng], [HOTEL_B.lat, HOTEL_B.lng]],
      ])
    })
  })
})
