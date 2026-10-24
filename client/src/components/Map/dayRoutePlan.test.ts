import { describe, it, expect } from 'vitest'
import { buildDayRouteRuns, hotelBookendOf } from './dayRoutePlan'
import { projectDayItinerary, tourStageStopsByPlace } from './dayTourProjection'
import { resolveLegMode } from '../Planner/legMode'
import { planTripRoute, assembleTripRoute, emptyAnswers, summariseTripRoute } from './tripRouteGeometry'
import { buildAssignment, buildDay, buildPlace, buildReservation } from '../../../tests/helpers/factories'
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

  it('FE-MAP-DRP-015: the hotel points say which end of the day they are, a stop on the same spot does not (#2501)', () => {
    const hotel = { id: 1, trip_id: 1, place_lat: 48.80, place_lng: 2.30, start_day_id: 1, end_day_id: 3 } as unknown as Accommodation
    const runs = buildDayRouteRuns(2, inputs({
      days: [buildDay({ id: 1, day_number: 1 }), buildDay({ id: 2, day_number: 2 }), buildDay({ id: 3, day_number: 3 })],
      assignments: { '2': [at(48.86, 2.35, 0), at(48.80, 2.30, 1), at(48.88, 2.36, 2)] },
      accommodations: [hotel],
      optimizeFromAccommodation: true,
    }))
    const legs = runs.flatMap(run => run.slice(1).map((p, i) => hotelBookendOf(run[i], p) ?? null))
    // Out of the hotel, three stops (one of them on the hotel's own spot), back to it.
    expect(legs).toEqual(['morning', null, null, 'evening'])
  })

  it('FE-MAP-DRP-016: the one drive of a moving day without stops is its morning leg (#2476)', () => {
    const days = [1, 2, 3].map(n => buildDay({ id: n, day_number: n }))
    const stays = [
      { id: 1, trip_id: 1, place_lat: 48.137, place_lng: 11.575, start_day_id: 1, end_day_id: 2 },
      { id: 2, trip_id: 1, place_lat: 53.551, place_lng: 9.993, start_day_id: 2, end_day_id: 3 },
    ] as unknown as Accommodation[]
    const [run] = buildDayRouteRuns(2, inputs({ days, accommodations: stays, optimizeFromAccommodation: true }))
    expect(run.map(p => p.hotel)).toEqual(['morning', 'evening'])
    expect(hotelBookendOf(run[0], run[1])).toBe('morning')
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

describe('Tour day itinerary segments', () => {
  const points = {
    A: [48.1, 11.1], B: [48.101, 11.101], C: [48.13, 11.13],
    S: [48.103, 11.103], E: [48.12, 11.12],
    S2: [48.121, 11.121], E2: [48.125, 11.125],
  } as const
  type Name = keyof typeof points
  const tour = (name: Name, end: Name, order: number, geometry?: string) => {
    const assignment = at(points[name][0], points[name][1], order)
    return { ...assignment, tour_place_id: assignment.place.id,
      tour_route_geometry: geometry ?? JSON.stringify([points[name], points[end]]) }
  }
  const ordinary = (name: Name, order: number) => at(points[name][0], points[name][1], order)
  const inspect = (list: AssignmentsMap['1'], enabled = true, profile: 'walking' | 'driving' = 'walking') => {
    const input = { ...inputs({ assignments: { '1': list } }), toursEnabled: enabled }
    const runs = buildDayRouteRuns(1, input)
    const plan = planTripRoute(input, profile)
    const lines = assembleTripRoute(plan, emptyAnswers(plan))[0]?.lines ?? []
    return { runs: runs.map(run => run.map(p => [p.lat, p.lng])),
      chunks: plan.flatMap(day => day.runs.flatMap(run => run.map(chunk => chunk.mode))), lines }
  }

  it('keeps ordinary A-B-C unchanged with Tours on or off', () => {
    const list = [ordinary('A', 0), ordinary('B', 1), ordinary('C', 2)]
    expect(inspect(list).runs).toEqual(inspect(list, false).runs)
    expect(inspect(list).runs).toEqual([[points.A, points.B, points.C]])
  })

  it('skips an excluded ordinary activity while preserving the upstream A-C run', () => {
    const list = [ordinary('A', 0), { ...ordinary('B', 1), route_excluded: true }, ordinary('C', 2)]
    expect(inspect(list).runs).toEqual([[points.A, points.C]])
    expect(inspect(list, false).runs).toEqual([[points.A, points.C]])
  })

  it('retains an excluded Tour and its line but uses no Tour endpoint in routing', () => {
    const excluded = { ...tour('S', 'E', 1), route_excluded: true }
    const list = [ordinary('A', 0), excluded, ordinary('C', 2)]
    expect(projectDayItinerary(list, true)[1]).toMatchObject({
      kind: 'tour', assignment: excluded, geometry: [points.S, points.E], valid: true,
    })
    expect(inspect(list).runs).toEqual([[points.A, points.C]])
    expect(inspect(list).lines).toEqual([[points.A, points.C]])
    expect(inspect(list, false).runs).toEqual([[points.A, points.C]])
  })

  it('frames an excluded Tour-only day without generating any calculated route line', () => {
    const excluded = { ...tour('S', 'E', 0), route_excluded: true }
    const plan = planTripRoute({ ...inputs({ assignments: { '1': [excluded] } }), toursEnabled: true }, 'walking')
    expect(plan).toHaveLength(1)
    expect(plan[0].runs).toEqual([])
    const overview = summariseTripRoute(assembleTripRoute(plan, emptyAnswers(plan)))
    expect(overview.lines).toEqual([])
    expect(overview.days[0].tourLines).toEqual([[points.S, points.E]])
    expect(overview.focusPoints).toEqual([points.S, points.E])
  })

  it('omits excluded first, last, consecutive and invalid Tours from connector anchors', () => {
    const excluded = (start: Name, end: Name, order: number, geometry?: string) => ({
      ...tour(start, end, order, geometry), route_excluded: true,
    })
    expect(inspect([excluded('S', 'E', 0), ordinary('A', 1), ordinary('C', 2)]).runs).toEqual([[points.A, points.C]])
    expect(inspect([ordinary('A', 0), ordinary('C', 1), excluded('S', 'E', 2)]).runs).toEqual([[points.A, points.C]])
    expect(inspect([ordinary('A', 0), excluded('S', 'E', 1), excluded('S2', 'E2', 2), ordinary('C', 3)]).runs).toEqual([[points.A, points.C]])
    expect(inspect([ordinary('A', 0), excluded('S', 'E', 1, '{bad'), ordinary('C', 2)]).runs).toEqual([[points.A, points.C]])
  })

  it.each(['cycling', 'cable_car', 'plugin:custom/walk'])('preserves %s overrides on connectors outside Tours', mode => {
    const list = [{ ...ordinary('A', 0), leg_transport_mode: mode }, tour('S', 'E', 1), ordinary('C', 2)]
    expect(inspect(list).runs).toEqual([[points.A, points.S], [points.E, points.C]])
    expect(inspect(list).chunks).toEqual([mode, 'walking'])
  })

  it.each(['walking', 'driving'] as const)('uses connectors and authoritative point-to-point geometry in %s', profile => {
    const list = [ordinary('A', 0), tour('S', 'E', 1), ordinary('C', 2)]
    const projection = projectDayItinerary(list, true)
    expect(projection[1]).toMatchObject({ kind: 'tour', valid: true, start: { lat: 48.103, lng: 11.103 }, end: { lat: 48.12, lng: 11.12 }, geometry: [points.S, points.E] })
    expect(inspect(list, true, profile).runs).toEqual([[points.A, points.S], [points.E, points.C]])
    expect(inspect(list, true, profile).lines).toEqual([[points.A, points.S], [points.E, points.C]])
    expect(inspect(list, true, profile).chunks).toEqual([profile, profile])
    expect(inspect(list, false, profile).runs).toEqual([[points.A, points.S, points.C]])
  })

  it('joins a loop at its shared start/end without routing across the Tour', () => {
    const list = [ordinary('A', 0), tour('S', 'S', 1, JSON.stringify([points.S, points.E, points.S])), ordinary('C', 2)]
    expect(inspect(list).runs).toEqual([[points.A, points.S], [points.S, points.C]])
    expect(projectDayItinerary(list, true)[1]).toMatchObject({ kind: 'tour', loop: true })
  })

  it('handles first, last, single, and consecutive Tours', () => {
    expect(inspect([tour('S', 'E', 0), ordinary('C', 1)]).runs).toEqual([[points.E, points.C]])
    expect(inspect([ordinary('A', 0), tour('S', 'E', 1)]).runs).toEqual([[points.A, points.S]])
    expect(inspect([tour('S', 'E', 0)]).runs).toEqual([])
    expect(inspect([ordinary('A', 0), tour('S', 'E', 1), tour('S2', 'E2', 2), ordinary('C', 3)]).runs)
      .toEqual([[points.A, points.S], [points.E, points.S2], [points.E2, points.C]])
  })

  it('bookends a single Tour at start/end and ignores excluded edge Tours for hotel anchors', () => {
    const hotel = [48, 11]
    const days = [1, 2, 3].map(id => buildDay({ id, day_number: id }))
    const accommodations = [{ id: 1, trip_id: 1, start_day_id: 1, end_day_id: 3,
      place_lat: hotel[0], place_lng: hotel[1] }] as Accommodation[]
    const withHotels = (list: AssignmentsMap['1']) => buildDayRouteRuns(2, {
      ...inputs({ days, assignments: { '2': list.map(assignment => ({ ...assignment, day_id: 2 })) },
        accommodations, optimizeFromAccommodation: true }), toursEnabled: true,
    }).map(run => run.map(point => [point.lat, point.lng]))
    expect(withHotels([tour('S', 'E', 0)])).toEqual([[hotel, points.S], [points.E, hotel]])
    expect(withHotels([
      { ...tour('S', 'E', 0), route_excluded: true }, ordinary('A', 1), ordinary('C', 2),
      { ...tour('S2', 'E2', 3), route_excluded: true },
    ])).toEqual([[hotel, points.A], [points.A, points.C], [points.C, hotel]])
    expect(withHotels([tour('S', 'E', 0, '{bad')])).toEqual([[hotel, points.S]])
  })

  it('preserves incoming/outgoing Tour modes on hotel connectors and overview chunks', () => {
    const hotel = { id: 1, trip_id: 1, start_day_id: 1, end_day_id: 3, place_lat: 48.09, place_lng: 11.09 } as Accommodation
    const days = [
      buildDay({ id: 1, day_number: 1 }),
      buildDay({ id: 2, day_number: 2, default_transport_mode: 'driving' }),
      buildDay({ id: 3, day_number: 3 }),
    ]
    const assignedTour = {
      ...tour('S', 'E', 0),
      incoming_leg_transport_mode: 'walking',
      leg_transport_mode: 'cycling',
    }
    const input = {
      ...inputs({ days, assignments: { '2': [assignedTour] }, accommodations: [hotel], optimizeFromAccommodation: true }),
      toursEnabled: true,
    }

    const runs = buildDayRouteRuns(2, input)
    expect(runs.map(run => run.map(point => [point.lat, point.lng]))).toEqual([
      [[hotel.place_lat, hotel.place_lng], points.S],
      [points.E, [hotel.place_lat, hotel.place_lng]],
    ])
    expect(resolveLegMode(runs[0][0], runs[0][1], 'driving')).toBe('walking')
    expect(resolveLegMode(runs[1][0], runs[1][1], 'driving')).toBe('cycling')
    expect(runs[0][1].incoming_leg_transport_mode).toBe('walking')
    expect(runs[1][0].leg_transport_mode).toBe('cycling')

    const overview = planTripRoute(input, 'driving').find(day => day.day.id === 2)!
    expect(overview.runs.map(run => run.map(chunk => chunk.mode))).toEqual([['walking'], ['cycling']])
    expect(overview.tourLines).toEqual([[points.S, points.E]])

    const loopTour = { ...tour('S', 'S', 0, JSON.stringify([points.S, points.E, points.S])),
      incoming_leg_transport_mode: 'walking', leg_transport_mode: 'cycling' }
    const loopInput = { ...input, assignments: { '2': [loopTour] } }
    const loopRuns = buildDayRouteRuns(2, loopInput)
    expect(loopRuns.map(run => resolveLegMode(run[0], run[1], 'driving'))).toEqual(['walking', 'cycling'])
    expect(planTripRoute(loopInput, 'driving')[0].tourLines).toEqual([[points.S, points.E, points.S]])

    const nextTour = { ...tour('S2', 'E2', 1), incoming_leg_transport_mode: 'walking', leg_transport_mode: 'cycling' }
    const consecutiveInput = { ...input, assignments: { '2': [assignedTour, nextTour] } }
    const consecutiveRuns = buildDayRouteRuns(2, consecutiveInput)
    expect(consecutiveRuns.map(run => resolveLegMode(run[0], run[1], 'driving'))).toEqual(['walking', 'cycling', 'cycling'])
    expect(planTripRoute(consecutiveInput, 'driving')[0].tourLines).toEqual([[points.S, points.E], [points.S2, points.E2]])
  })

  it('does not let an unlocated transport after an invalid Tour create an evening hotel connector', () => {
    const hotel = { id: 1, trip_id: 1, start_day_id: 1, end_day_id: 3, place_lat: 48.09, place_lng: 11.09 } as Accommodation
    const days = [buildDay({ id: 1, day_number: 1 }), buildDay({ id: 2, day_number: 2 }), buildDay({ id: 3, day_number: 3 })]
    const invalidTour = tour('S', 'E', 0, '{bad')
    const unlocatedTrain = buildReservation({ id: 90, type: 'train', day_id: 2, day_plan_position: 1, endpoints: [] })
    const runs = buildDayRouteRuns(2, {
      ...inputs({ days, assignments: { '2': [invalidTour] }, reservations: [unlocatedTrain], accommodations: [hotel], optimizeFromAccommodation: true }),
      toursEnabled: true,
    })

    expect(runs.map(run => run.map(point => [point.lat, point.lng]))).toEqual([[[hotel.place_lat, hotel.place_lng], points.S]])
  })

  it('marks malformed Tour geometry invalid without inventing an outgoing end', () => {
    const list = [ordinary('A', 0), tour('S', 'E', 1, '{bad'), ordinary('C', 2)]
    expect(projectDayItinerary(list, true)[1]).toMatchObject({ kind: 'tour', valid: false, start: { lat: 48.103, lng: 11.103 }, end: null })
    expect(inspect(list).runs).toEqual([[points.A, points.S]])
    expect(inspect(list, false).runs).toEqual([[points.A, points.S, points.C]])
  })

  it('uses first and last usable coordinates when Tour geometry contains malformed points', () => {
    const malformedPointToPoint = JSON.stringify([
      [91, 200], points.S, [Number.NaN, points.E[1]], points.E, [48.2],
    ])
    const list = [ordinary('A', 0), tour('S', 'E', 1, malformedPointToPoint), ordinary('C', 2)]
    expect(projectDayItinerary(list, true)[1]).toMatchObject({
      kind: 'tour', valid: true, start: { lat: points.S[0], lng: points.S[1] },
      end: { lat: points.E[0], lng: points.E[1] }, geometry: [points.S, points.E],
    })
    expect(inspect(list).runs).toEqual([[points.A, points.S], [points.E, points.C]])
  })

  it('uses the current Place geometry when a saved Tour changes before assignments refresh', () => {
    const assignment = tour('S', 'E', 1)
    const updatedEnd: [number, number] = [48.127, 11.127]
    const places = [buildPlace({ id: assignment.place.id, lat: points.S[0], lng: points.S[1],
      route_geometry: JSON.stringify([points.S, updatedEnd]) })]
    const list = [ordinary('A', 0), assignment, ordinary('C', 2)]
    expect(projectDayItinerary(list, true, places)[1]).toMatchObject({ end: { lat: 48.127, lng: 11.127 } })
    expect(buildDayRouteRuns(1, { ...inputs({ assignments: { '1': list } }), toursEnabled: true, places })
      .map(run => run.map(point => [point.lat, point.lng])))
      .toEqual([[points.A, points.S], [updatedEnd, points.C]])
  })

  it('preserves the outgoing Tour mode override for connectors only', () => {
    const list = [ordinary('A', 0), { ...tour('S', 'E', 1), leg_transport_mode: 'plugin:custom/walk' }, ordinary('C', 2)]
    expect(inspect(list).chunks).toEqual(['walking', 'plugin:custom/walk'])
    expect(projectDayItinerary(list, true)[1]).toMatchObject({ geometry: [points.S, points.E] })
  })
})

// MDT-02: a day holding one stage of a multi-day tour routes to that stage and draws its stretch.
describe('A stage of a multi-day tour on a day', () => {
  const line: [number, number][] = [[48, 11], [48.01, 11], [48.02, 11], [48.03, 11], [48.04, 11]]
  const stops = [
    { key: 'stop-start', lat: 48, lng: 11 },
    { key: 'stop-hut', lat: 48.02, lng: 11 },
    { key: 'stop-end', lat: 48.04, lng: 11 },
  ]
  const hutToHut = (order: number, tour_stage_key: string | null) => {
    const assignment = at(48, 11, order)
    return { ...assignment, tour_place_id: assignment.place.id, tour_route_geometry: JSON.stringify(line), tour_stage_key }
  }

  it('FE-MAP-DRP-017: draws and routes to the stretch of the stage, the stops telling where it runs', () => {
    const second = hutToHut(1, 'stop-hut')
    const stageStops = new Map([[second.place.id, stops]])
    expect(projectDayItinerary([second], true, [], stageStops)[0]).toMatchObject({
      kind: 'tour', valid: true, start: { lat: 48.02, lng: 11 }, end: { lat: 48.04, lng: 11 }, geometry: line.slice(2),
    })
    const first = hutToHut(1, 'stop-start')
    expect(projectDayItinerary([first], true, [], new Map([[first.place.id, stops]]))[0]).toMatchObject({
      start: { lat: 48, lng: 11 }, end: { lat: 48.02, lng: 11 },
    })
    const runs = buildDayRouteRuns(1, {
      ...inputs({ assignments: { '1': [at(47.99, 11, 0), second, at(48.05, 11, 2)] } }),
      toursEnabled: true, tourStageStops: stageStops,
    })
    expect(runs.map(run => run.map(point => [point.lat, point.lng]))).toEqual([[[47.99, 11], [48.02, 11]], [[48.04, 11], [48.05, 11]]])
  })

  it('FE-MAP-DRP-018: keeps the whole tour where the stops do not tell the stage', () => {
    const whole = hutToHut(1, null)
    const unknown = hutToHut(1, 'stop-gone')
    const last = hutToHut(1, 'stop-end')
    for (const assignment of [whole, unknown, last]) {
      expect(projectDayItinerary([assignment], true, [], new Map([[assignment.place.id, stops]]))[0]).toMatchObject({ geometry: line })
    }
    const noStops = hutToHut(1, 'stop-hut')
    expect(projectDayItinerary([noStops], true)[0]).toMatchObject({ geometry: line })
  })

  it('FE-MAP-DRP-019: reads the stage stops of the multi-day tours off the tour list, none for a day tour', () => {
    const stages = tourStageStopsByPlace([{ place_id: 4, stage_stops: stops }, { place_id: 5, stage_stops: null }, { place_id: 6 }])
    expect([...stages.keys()]).toEqual([4])
    expect(stages.get(4)).toBe(stops)
  })
})

// #2600: an imported GPX/KML place sits at its track's first point, so routing it as a
// plain stop drew a second road from the track start to the next stop, alongside the
// track itself. Any assigned place with a track now leaves that stretch to the track.
describe('Imported track places', () => {
  const points = {
    A: [35.2015, 24.1395], S: [35.201, 24.118], M: [35.199, 24.1], E: [35.1965, 24.079], C: [35.19, 24.07],
  } as const
  type Name = keyof typeof points
  const stop = (name: Name, order: number, placeId: number) =>
    buildAssignment({ id: 900 + order, day_id: 1, order_index: order,
      place: buildPlace({ id: placeId, lat: points[name][0], lng: points[name][1] }) })
  const trackPlace = (id: number, geometry: string | null, at: readonly [number, number] = points.S) =>
    buildPlace({ id, lat: at[0], lng: at[1], route_geometry: geometry })
  const track = JSON.stringify([points.S, points.M, points.E])
  const runsOf = (list: AssignmentsMap['1'], places: ReturnType<typeof buildPlace>[], toursEnabled = false) =>
    buildDayRouteRuns(1, { ...inputs({ assignments: { '1': list } }), toursEnabled, places })
      .map(run => run.map(point => [point.lat, point.lng]))

  it('routes up to the track start and carries on from its end, without the Tours addon', () => {
    const list = [stop('A', 0, 1), stop('S', 1, 2), stop('C', 2, 3)]
    const places = [buildPlace({ id: 1 }), trackPlace(2, track), buildPlace({ id: 3 })]
    expect(runsOf(list, places)).toEqual([[points.A, points.S], [points.E, points.C]])
    expect(runsOf(list, places, true)).toEqual([[points.A, points.S], [points.E, points.C]])
    expect(projectDayItinerary(list, false, places)[1]).toMatchObject({ kind: 'tour', valid: true, geometry: [points.S, points.M, points.E] })
  })

  it('routes to the track start even when the marker was moved off it', () => {
    const list = [stop('A', 0, 1), stop('C', 1, 2), stop('C', 2, 3)]
    const places = [buildPlace({ id: 1 }), trackPlace(2, track, points.C), buildPlace({ id: 3 })]
    expect(runsOf(list, places)).toEqual([[points.A, points.S], [points.E, points.C]])
  })

  it('takes the track as recorded, so one walked the other way still starts at its first point', () => {
    const list = [stop('A', 0, 1), stop('E', 1, 2), stop('C', 2, 3)]
    const places = [buildPlace({ id: 1 }), trackPlace(2, track, points.E), buildPlace({ id: 3 })]
    expect(runsOf(list, places)).toEqual([[points.A, points.S], [points.E, points.C]])
  })

  it('keeps a place without a usable track as a plain stop, never as an invalid tour', () => {
    const list = [stop('A', 0, 1), stop('S', 1, 2), stop('C', 2, 3)]
    for (const geometry of [null, '{bad', JSON.stringify([points.S])]) {
      const places = [buildPlace({ id: 1 }), trackPlace(2, geometry), buildPlace({ id: 3 })]
      expect(runsOf(list, places)).toEqual([[points.A, points.S, points.C]])
      expect(projectDayItinerary(list, true, places)[1]).toMatchObject({ kind: 'stop' })
    }
    // Places not loaded yet: the assignment alone carries no track, so nothing is guessed.
    expect(runsOf(list, [])).toEqual([[points.A, points.S, points.C]])
  })

  it('starts the evening drive back to the hotel at the end of the track', () => {
    const hotel = [35.5, 24.0]
    const days = [1, 2, 3].map(id => buildDay({ id, day_number: id }))
    const accommodations = [{ id: 1, trip_id: 1, start_day_id: 1, end_day_id: 3,
      place_lat: hotel[0], place_lng: hotel[1] }] as Accommodation[]
    const list = [stop('A', 0, 1), stop('S', 1, 2)].map(assignment => ({ ...assignment, day_id: 2 }))
    const places = [buildPlace({ id: 1 }), trackPlace(2, track)]
    expect(buildDayRouteRuns(2, { ...inputs({ days, assignments: { '2': list }, accommodations,
      optimizeFromAccommodation: true }), places }).map(run => run.map(point => [point.lat, point.lng])))
      .toEqual([[hotel, points.A], [points.A, points.S], [points.E, hotel]])
  })

  it('draws the track as a line in the trip overview and the PDF map', () => {
    const list = [stop('A', 0, 1), stop('S', 1, 2), stop('C', 2, 3)]
    const places = [buildPlace({ id: 1 }), trackPlace(2, track), buildPlace({ id: 3 })]
    const plan = planTripRoute({ ...inputs({ assignments: { '1': list } }), places }, 'driving')
    expect(plan[0].tourLines).toEqual([[points.S, points.M, points.E]])
  })
})
