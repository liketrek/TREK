import { describe, expect, it, vi } from 'vitest'
import { Cloud, CloudLightning, CloudRain, CloudSnow, Sun, Wind } from 'lucide-react'
import {
  breaksChronology, buildPlanRows, cityPillsForDay, findUpNext, getTransitMeta, hotelChipsForDay,
  hotelLegsForDay, itemHasTime, parseReservationMeta, transportSubtitle, weatherIconFor,
  type TransportEntry,
} from '../../../../src/mobile/screens/trip/plan/planTimelineModel'
import { getDisplayTimeForDay, getMergedItems, getTransportForDay, type MergedItem } from '../../../../src/utils/dayMerge'
import { buildDayRouteRuns, hotelBookendOf, type DayRoutePoint } from '../../../../src/components/Map/dayRoutePlan'
import { buildAssignment, buildDayNote, buildPlace, buildReservation } from '../../../helpers/factories'
import type {
  Accommodation, Assignment, Day, DayNote, Reservation, RouteSegment, TranslationFn,
} from '../../../../src/types'

// FE-MOB-PTLM-001 to FE-MOB-PTLM-060

const DAYS = [
  { id: 1, trip_id: 1, day_number: 1, date: '2026-05-01', title: null },
  { id: 2, trip_id: 1, day_number: 2, date: '2026-05-02', title: 'Old Town' },
  { id: 3, trip_id: 1, day_number: 3, date: '2026-05-03', title: null },
] as unknown as Day[]

const DAY2 = DAYS[1]

function place(id: number, name: string, lat: number | null, lng: number | null, time: string | null = null) {
  return buildPlace({ id, name, lat, lng, place_time: time })
}

function assignment(id: number, order: number, p: ReturnType<typeof place>): Assignment {
  return buildAssignment({ id, day_id: 2, order_index: order, place_id: p.id, place: p })
}

function seg(from: [number, number], to: [number, number], overrides: Partial<RouteSegment> = {}): RouteSegment {
  return {
    mid: [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2],
    from,
    to,
    distance: 1200,
    duration: 600,
    walkingText: '15 min',
    drivingText: '3 min',
    distanceText: '1.2 km',
    ...overrides,
  }
}

// What useRouteCalculation hands the timeline: one segment per pair of neighbouring
// waypoints in each drawn run, the hotel bookends tagged as such.
const segmentsOf = (runs: DayRoutePoint[][]): RouteSegment[] =>
  runs.flatMap(run => run.slice(1).map((p, i) => {
    const hotelBookend = hotelBookendOf(run[i], p)
    return seg([run[i].lat, run[i].lng], [p.lat, p.lng], hotelBookend ? { hotelBookend } : {})
  }))

const placeItem = (a: Assignment): MergedItem => ({ type: 'place', sortKey: a.order_index, data: a })
const noteItem = (n: DayNote): MergedItem => ({ type: 'note', sortKey: n.sort_order ?? 0, data: n })
const transportItem = (r: TransportEntry): MergedItem => ({ type: 'transport', sortKey: 0, data: r })

function accommodation(overrides: Partial<Accommodation>): Accommodation {
  return {
    id: 1,
    trip_id: 1,
    place_id: null,
    start_day_id: 1,
    end_day_id: 3,
    check_in: null,
    check_out: null,
    place_name: 'Hotel Sacher',
    place_lat: 48.2,
    place_lng: 16.35,
    ...overrides,
  } as unknown as Accommodation
}

describe('planTimelineModel — metadata parsing', () => {
  it('FE-MOB-PTLM-001: returns an already-parsed metadata object untouched', () => {
    const meta = { airline: 'LH', legs: [] }
    expect(parseReservationMeta({ ...buildReservation(), metadata: meta } as unknown as Reservation)).toBe(meta)
  })

  it('FE-MOB-PTLM-002: parses a JSON metadata string', () => {
    expect(parseReservationMeta(buildReservation({ metadata: '{"airline":"LH"}' }))).toEqual({ airline: 'LH' })
  })

  it('FE-MOB-PTLM-003: heals a double-encoded metadata string', () => {
    const doubled = JSON.stringify(JSON.stringify({ airline: 'LH', flight_number: 'LH123' }))
    expect(parseReservationMeta(buildReservation({ metadata: doubled }))).toEqual({
      airline: 'LH', flight_number: 'LH123',
    })
  })

  it('FE-MOB-PTLM-004: falls back to an empty object for broken, empty or scalar metadata', () => {
    expect(parseReservationMeta(buildReservation({ metadata: '{not json' }))).toEqual({})
    expect(parseReservationMeta(buildReservation({ metadata: '' }))).toEqual({})
    expect(parseReservationMeta(buildReservation({ metadata: null }))).toEqual({})
    expect(parseReservationMeta(buildReservation({ metadata: '5' }))).toEqual({})
    // Double-encoded, with an inner payload that is broken or empty.
    expect(parseReservationMeta(buildReservation({ metadata: JSON.stringify('{not json') }))).toEqual({})
    expect(parseReservationMeta(buildReservation({ metadata: '""' }))).toEqual({})
  })

  it('FE-MOB-PTLM-005: reads transit metadata only from transit reservations with legs', () => {
    const legs = [{ mode: 'subway', line: 'U2' }]
    const transit = buildReservation({
      type: 'transit', metadata: JSON.stringify({ transit: { legs, transfers: 1, duration: 900 } }),
    })
    expect(getTransitMeta(transit)).toEqual({ legs, transfers: 1, duration: 900 })
    expect(getTransitMeta(buildReservation({ type: 'flight', metadata: JSON.stringify({ transit: { legs } }) }))).toBeNull()
    expect(getTransitMeta(buildReservation({ type: 'transit', metadata: '{}' }))).toBeNull()
    expect(getTransitMeta(buildReservation({ type: 'transit', metadata: '{"transit":{"legs":"nope"}}' }))).toBeNull()
  })
})

describe('planTimelineModel — transportSubtitle', () => {
  it('FE-MOB-PTLM-006: renders a synthetic leg as from → to', () => {
    const res = { ...buildReservation({ type: 'flight' }), __leg: { index: 0, total: 2, from: 'FRA', to: 'IST' } } as TransportEntry
    expect(transportSubtitle(res)).toBe('FRA → IST')
  })

  it('FE-MOB-PTLM-007: renders a leg without endpoints as an empty subtitle', () => {
    const res = { ...buildReservation({ type: 'flight' }), __leg: { index: 1, total: 2, from: null, to: null } } as TransportEntry
    expect(transportSubtitle(res)).toBe('')
  })

  it('FE-MOB-PTLM-008: joins airline, flight number and airports for a flight', () => {
    const res = buildReservation({
      type: 'flight',
      metadata: JSON.stringify({ airline: 'LH', flight_number: 'LH123', departure_airport: 'FRA', arrival_airport: 'HND' }),
    })
    expect(transportSubtitle(res)).toBe('LH · LH123 · FRA → HND')
  })

  it('FE-MOB-PTLM-009: omits the airport pair when neither airport is known', () => {
    const res = buildReservation({ type: 'flight', metadata: JSON.stringify({ airline: 'LH', flight_number: 'LH123' }) })
    expect(transportSubtitle(res)).toBe('LH · LH123')
  })

  it('FE-MOB-PTLM-010: labels platform and seat for a train', () => {
    const full = buildReservation({
      type: 'train', metadata: JSON.stringify({ train_number: 'ICE 599', platform: '7', seat: '32A' }),
    })
    expect(transportSubtitle(full)).toBe('ICE 599 · Gl. 7 · Sitz 32A')
    expect(transportSubtitle(buildReservation({ type: 'train', metadata: '{"train_number":"ICE 599"}' }))).toBe('ICE 599')
  })

  it('FE-MOB-PTLM-011: falls back to the location for any other type', () => {
    expect(transportSubtitle(buildReservation({ type: 'bus', location: 'Central Station' }))).toBe('Central Station')
    expect(transportSubtitle(buildReservation({ type: 'bus', location: null }))).toBe('')
  })
})

describe('planTimelineModel — buildPlanRows', () => {
  const museum = assignment(11, 0, place(101, 'Museum', 48.1, 16.1))
  const park = assignment(12, 1, place(102, 'Park', 48.2, 16.2))

  it('FE-MOB-PTLM-012: maps places, notes and transports to keyed rows', () => {
    const note = buildDayNote({ id: 41, day_id: 2, text: 'Buy tickets' })
    const bus = buildReservation({ id: 51, type: 'bus', day_id: 2, title: 'Bus 13A' })
    const rows = buildPlanRows({
      merged: [placeItem(museum), noteItem(note), transportItem(bus)],
      reservations: [bus],
      routeSegments: [],
      dayId: 2,
    })
    expect(rows.map(r => [r.kind, r.key])).toEqual([
      ['place', 'pl-11'],
      ['note', 'note-41'],
      ['transport', 'tr-51'],
    ])
  })

  it('FE-MOB-PTLM-013: links a place row to the reservation booked on it', () => {
    const dinner = buildReservation({ id: 52, type: 'restaurant', day_id: 2, assignment_id: 11 })
    const rows = buildPlanRows({
      merged: [placeItem(museum), placeItem(park)], reservations: [dinner], routeSegments: [], dayId: 2,
    })
    const [first, second] = rows.filter(r => r.kind === 'place')
    expect(first.kind === 'place' && first.linkedReservations[0]).toBe(dinner)
    expect(second.kind === 'place' && second.linkedReservations.length === 0).toBe(true)
  })

  it('FE-MOB-PTLM-014: keys a synthetic leg row by its leg index', () => {
    const legRes = { ...buildReservation({ id: 60, type: 'flight', day_id: 2 }), __leg: { index: 1, total: 2, from: 'IST', to: 'NRT' } } as TransportEntry
    const rows = buildPlanRows({ merged: [transportItem(legRes)], reservations: [], routeSegments: [], dayId: 2 })
    expect(rows[0].key).toBe('tr-60-leg1')
  })

  it('FE-MOB-PTLM-015: recognises a transit booking as its own row kind', () => {
    const transit = buildReservation({
      id: 61, type: 'transit', day_id: 2,
      metadata: JSON.stringify({ transit: { legs: [{ mode: 'subway', line: 'U2' }], transfers: 0 } }),
    })
    const rows = buildPlanRows({ merged: [transportItem(transit)], reservations: [], routeSegments: [], dayId: 2 })
    expect(rows[0].kind).toBe('transit')
    expect(rows[0].kind === 'transit' && rows[0].transit.legs).toHaveLength(1)
  })

  it('FE-MOB-PTLM-016: hides a car rental on the days between pickup and drop-off', () => {
    const car = buildReservation({ id: 62, type: 'car', day_id: 1, end_day_id: 3 })
    expect(buildPlanRows({ merged: [transportItem(car)], reservations: [], routeSegments: [], dayId: 2 })).toEqual([])
    expect(buildPlanRows({ merged: [transportItem(car)], reservations: [], routeSegments: [], dayId: 1 })).toHaveLength(1)
  })

  it('FE-MOB-PTLM-043: hides a parking on the days between drop-off and pickup (#1937)', () => {
    const parking = buildReservation({ id: 63, type: 'parking', day_id: 1, end_day_id: 3 })
    expect(buildPlanRows({ merged: [transportItem(parking)], reservations: [], routeSegments: [], dayId: 2 })).toEqual([])
    expect(buildPlanRows({ merged: [transportItem(parking)], reservations: [], routeSegments: [], dayId: 1 })).toHaveLength(1)
    expect(buildPlanRows({ merged: [transportItem(parking)], reservations: [], routeSegments: [], dayId: 3 })).toHaveLength(1)
  })

  it('FE-MOB-PTLM-017: slots a connector between two located places and tags its origin', () => {
    const leg = seg([48.1, 16.1], [48.2, 16.2])
    const rows = buildPlanRows({
      merged: [placeItem(museum), placeItem(park)], reservations: [], routeSegments: [leg], dayId: 2,
    })
    expect(rows.map(r => r.kind)).toEqual(['place', 'conn', 'place'])
    const conn = rows[1]
    expect(conn.kind === 'conn' && conn.seg).toBe(leg)
    expect(conn.kind === 'conn' && conn.assignmentId).toBe(11)
    expect(conn.key).toBe('conn-pl-11')
  })

  it('FE-MOB-PTLM-018: connects across an intervening note', () => {
    const note = buildDayNote({ id: 41, day_id: 2 })
    const rows = buildPlanRows({
      merged: [placeItem(museum), noteItem(note), placeItem(park)],
      reservations: [],
      routeSegments: [seg([48.1, 16.1], [48.2, 16.2])],
      dayId: 2,
    })
    expect(rows.map(r => r.kind)).toEqual(['place', 'conn', 'note', 'place'])
  })

  it('FE-MOB-PTLM-019: puts the drive past a booking without a location under that booking (#2502)', () => {
    // The route rides straight past a bus saved without its stops and draws the road
    // between the two places; the desktop day plan shows that leg under the bus.
    const bus = buildReservation({ id: 51, type: 'bus', day_id: 2 })
    const rows = buildPlanRows({
      merged: [placeItem(museum), transportItem(bus), placeItem(park)],
      reservations: [],
      routeSegments: [seg([48.1, 16.1], [48.2, 16.2])],
      dayId: 2,
    })
    expect(rows.map(r => r.key)).toEqual(['pl-11', 'tr-51', 'conn-tr-51', 'pl-12'])
    // The leg was routed in the mode of the stop it left, so the menu edits that stop.
    expect(rows[2]).toMatchObject({ kind: 'conn', assignmentId: 11 })
  })

  it('FE-MOB-PTLM-020: skips places without coordinates and unmatched segments', () => {
    const nowhere = assignment(13, 2, place(103, 'Idea', null, null))
    const rows = buildPlanRows({
      merged: [placeItem(nowhere), placeItem(museum)],
      reservations: [],
      routeSegments: [seg([49.9, 17.9], [48.2, 16.2])],
      dayId: 2,
    })
    expect(rows.map(r => r.kind)).toEqual(['place', 'place'])
  })

  it('FE-MOB-PTLM-021: consumes each segment only once', () => {
    const again = assignment(14, 2, place(104, 'Museum again', 48.1, 16.1))
    const parkAgain = assignment(15, 3, place(105, 'Park again', 48.2, 16.2))
    const rows = buildPlanRows({
      merged: [placeItem(museum), placeItem(park), placeItem(again), placeItem(parkAgain)],
      reservations: [],
      routeSegments: [seg([48.1, 16.1], [48.2, 16.2])],
      dayId: 2,
    })
    // Only the first Museum → Park hop finds the single matching leg.
    expect(rows.filter(r => r.kind === 'conn')).toHaveLength(1)
  })
})

describe('planTimelineModel — hotel chips and legs', () => {
  it('FE-MOB-PTLM-022: orders check-out before check-in before an ongoing stay, each chip naming its stay (#2210)', () => {
    const chips = hotelChipsForDay(DAY2, DAYS, [
      accommodation({ id: 1, start_day_id: 1, end_day_id: 3, place_name: 'Long Stay' }),
      accommodation({ id: 2, start_day_id: 2, end_day_id: 3, place_name: 'New Hotel', check_in: '15:00', place_id: 102 }),
      accommodation({ id: 3, start_day_id: 1, end_day_id: 2, place_name: 'Old Hotel', check_out: '11:00' }),
    ])
    expect(chips).toEqual([
      { key: 'out-3', variant: 'checkout', name: 'Old Hotel', time: '11:00', accId: 3, placeId: null },
      { key: 'in-2', variant: 'checkin', name: 'New Hotel', time: '15:00', accId: 2, placeId: 102 },
      { key: 'stay-1', variant: 'stay', name: 'Long Stay', time: null, accId: 1, placeId: null },
    ])
  })

  it('FE-MOB-PTLM-023: falls back to the reservation title and drops unnamed stays', () => {
    const chips = hotelChipsForDay(DAY2, DAYS, [
      accommodation({ id: 4, place_name: null, reservation_title: 'Airbnb Wieden' }),
      accommodation({ id: 5, place_name: null, reservation_title: null }),
    ])
    expect(chips).toEqual([{ key: 'stay-4', variant: 'stay', name: 'Airbnb Wieden', time: null, accId: 4, placeId: null }])
  })

  it('FE-MOB-PTLM-042: leaves the chip time empty when the stay has no check-in or check-out', () => {
    const chips = hotelChipsForDay(DAY2, DAYS, [
      accommodation({ id: 9, start_day_id: 1, end_day_id: 2, place_name: 'Old Hotel' }),
      accommodation({ id: 10, start_day_id: 2, end_day_id: 3, place_name: 'New Hotel' }),
    ])
    expect(chips.map(c => [c.variant, c.time])).toEqual([['checkout', null], ['checkin', null]])
  })

  it('FE-MOB-PTLM-024: ignores accommodations outside the day range', () => {
    expect(hotelChipsForDay(DAY2, DAYS, [accommodation({ id: 6, start_day_id: 1, end_day_id: 1 })])).toEqual([])
  })

  it('FE-MOB-PTLM-025: picks the hotel bookend legs out of the calculated segments', () => {
    const hotel = accommodation({ id: 7, start_day_id: 1, end_day_id: 3, place_lat: 48.0, place_lng: 16.0 })
    const out = seg([48.0, 16.0], [48.1, 16.1], { hotelBookend: 'morning' })
    const back = seg([48.2, 16.2], [48.0, 16.0], { hotelBookend: 'evening' })
    const legs = hotelLegsForDay(DAY2, DAYS, [hotel], [out, seg([48.1, 16.1], [48.2, 16.2]), back])
    expect(legs.top).toEqual({ seg: out, name: 'Hotel Sacher' })
    expect(legs.bottom).toEqual({ seg: back, name: 'Hotel Sacher' })
  })

  it('FE-MOB-PTLM-026: returns no legs when the calculation drew no bookend, whatever touches the hotel (#2501)', () => {
    // A stop on the hotel's own spot starts and ends legs at its coordinates too.
    const hotel = accommodation({ id: 8, start_day_id: 1, end_day_id: 3, place_lat: 48.0, place_lng: 16.0 })
    const legs = hotelLegsForDay(DAY2, DAYS, [hotel], [seg([48.1, 16.1], [48.0, 16.0]), seg([48.0, 16.0], [48.2, 16.2])])
    expect(legs).toEqual({ top: null, bottom: null })
  })

  it('FE-MOB-PTLM-027: returns no legs without an accommodation on the day', () => {
    const tagged = [seg([48.0, 16.0], [48.1, 16.1], { hotelBookend: 'morning' }), seg([48.1, 16.1], [48.0, 16.0], { hotelBookend: 'evening' })]
    expect(hotelLegsForDay(DAY2, DAYS, [], tagged)).toEqual({ top: null, bottom: null })
  })

  it('FE-MOB-PTLM-050: another stay\'s bookends are not this day\'s, as right after a day switch (#2501)', () => {
    // The calc still holds the day before's legs, out of and back to Munich, while
    // the new day, a night in Hamburg, is being routed.
    const munich = { lat: 48.137, lng: 11.575 }
    const hamburg = accommodation({ id: 9, start_day_id: 2, end_day_id: 3, place_name: 'Hamburg Inn', place_lat: 53.551, place_lng: 9.993 })
    const stale = [
      seg([munich.lat, munich.lng], [48.14, 11.58], { hotelBookend: 'morning' }),
      seg([48.14, 11.58], [48.15, 11.59]),
      seg([48.15, 11.59], [munich.lat, munich.lng], { hotelBookend: 'evening' }),
    ]
    expect(hotelLegsForDay(DAY2, DAYS, [hamburg], stale)).toEqual({ top: null, bottom: null })
  })

  it('FE-MOB-PTLM-045: the evening leg is the drive that closes the day, not an earlier one onto the hotel spot (#2476)', () => {
    // A stop planned on the hotel's own spot early in the day: the drive there reaches
    // the hotel's coordinates first, but the day ends with the drive back from the park.
    const hotel = accommodation({ id: 7, start_day_id: 1, end_day_id: 3, place_lat: 48.0, place_lng: 16.0 })
    const out = seg([48.0, 16.0], [48.1, 16.1], { hotelBookend: 'morning' })
    const toHotelSpot = seg([48.1, 16.1], [48.0, 16.0])
    const onward = seg([48.0, 16.0], [48.2, 16.2])
    const back = seg([48.2, 16.2], [48.0, 16.0], { hotelBookend: 'evening' })
    const legs = hotelLegsForDay(DAY2, DAYS, [hotel], [out, toHotelSpot, onward, back])
    expect(legs.top?.seg).toBe(out)
    expect(legs.bottom?.seg).toBe(back)
  })

  describe('a moving day with a flight between the two stays (#2476)', () => {
    // Day 2 checks out of Munich and into Hamburg; the flight sits between them.
    const HOTEL_A = { lat: 48.137, lng: 11.575 }
    const HOTEL_B = { lat: 53.551, lng: 9.993 }
    const MUC = { lat: 48.353, lng: 11.786 }
    const HAM = { lat: 53.63, lng: 9.988 }
    const stays = [
      accommodation({ id: 1, start_day_id: 1, end_day_id: 2, place_name: 'Hotel A', place_lat: HOTEL_A.lat, place_lng: HOTEL_A.lng }),
      accommodation({ id: 2, start_day_id: 2, end_day_id: 3, place_name: 'Hotel B', place_lat: HOTEL_B.lat, place_lng: HOTEL_B.lng }),
    ]
    const flight = (located: boolean) => buildReservation({
      id: 7, type: 'flight', title: 'LH 2078', day_id: 2, end_day_id: 2,
      reservation_time: '2026-05-02T15:15', reservation_end_time: '2026-05-02T17:20',
      endpoints: located
        ? [
            { role: 'from', sequence: 0, name: 'MUC', code: null, ...MUC, timezone: null, local_date: null, local_time: null },
            { role: 'to', sequence: 1, name: 'HAM', code: null, ...HAM, timezone: null, local_date: null, local_time: null },
          ]
        : [],
    })
    const legsOf = (reservations: Reservation[]) => {
      const runs = buildDayRouteRuns(2, {
        days: DAYS, assignments: {}, reservations, accommodations: stays, optimizeFromAccommodation: true,
      })
      return hotelLegsForDay(DAY2, DAYS, stays, segmentsOf(runs))
    }

    it('FE-MOB-PTLM-046: shows no drive from one hotel to the other, above or below the flight', () => {
      // Saved without its airports, the flight leaves nothing to connect: the plan
      // used to show the whole Munich to Hamburg drive twice, around the flight.
      expect(legsOf([flight(false)])).toEqual({ top: null, bottom: null })
      // With them, the morning drive goes to the departure airport and the evening
      // one comes from the arrival airport.
      const located = legsOf([flight(true)])
      expect(located.top).toMatchObject({ name: 'Hotel A', seg: { from: [HOTEL_A.lat, HOTEL_A.lng], to: [MUC.lat, MUC.lng] } })
      expect(located.bottom).toMatchObject({ name: 'Hotel B', seg: { from: [HAM.lat, HAM.lng], to: [HOTEL_B.lat, HOTEL_B.lng] } })
    })

    it('FE-MOB-PTLM-047: without a flight the one drive between the two stays shows once, not above and below', () => {
      // No stop and no booking: the day is the drive from Munich to Hamburg (#1297).
      // That one segment leaves the morning hotel and reaches the evening one.
      const legs = legsOf([])
      expect(legs.top).toMatchObject({ name: 'Hotel A', seg: { from: [HOTEL_A.lat, HOTEL_A.lng], to: [HOTEL_B.lat, HOTEL_B.lng] } })
      expect(legs.bottom).toBeNull()
    })
  })
})

describe('planTimelineModel: a day that lands and then drives to the hotel (#2501, #2502)', () => {
  // Day 1 checks into a Hamburg hotel at three. The flight lands at one, and the
  // traveller put the hotel on the day as a stop of their own, then the town hall.
  const HOTEL = { lat: 53.5465, lng: 9.9727 }
  const AMS = { lat: 52.3105, lng: 4.7683 }
  const HAM = { lat: 53.6304, lng: 9.9882 }
  const TOWN_HALL = { lat: 53.5503, lng: 9.9937 }
  const stay = accommodation({
    id: 30, place_id: 900, place_name: 'Hotel Hafen', place_lat: HOTEL.lat, place_lng: HOTEL.lng,
    start_day_id: 1, end_day_id: 3, check_in: '15:00', check_out: '11:00',
  })
  const flight = buildReservation({
    id: 7, type: 'flight', title: 'KL 1783', day_id: 1, end_day_id: 1, day_plan_position: -0.5,
    reservation_time: '2026-05-01T10:00', reservation_end_time: '2026-05-01T13:00',
    endpoints: [
      { role: 'from', sequence: 0, name: 'AMS', code: null, ...AMS, timezone: null, local_date: null, local_time: null },
      { role: 'to', sequence: 1, name: 'HAM', code: null, ...HAM, timezone: null, local_date: null, local_time: null },
    ],
  })
  const hotelStop = buildAssignment({ id: 21, day_id: 1, order_index: 0, place: place(900, 'Hotel Hafen', HOTEL.lat, HOTEL.lng) })
  const townHall = buildAssignment({ id: 22, day_id: 1, order_index: 1, place: place(901, 'Town Hall', TOWN_HALL.lat, TOWN_HALL.lng) })

  // A day as the phone timeline builds it: merged the way useMPlanTimeline merges,
  // segments the way useRouteCalculation routes the same day.
  const planOf = (dayId: number, dayAssignments: Assignment[], reservations: Reservation[], stays: Accommodation[]) => {
    const merged = getMergedItems({
      dayAssignments,
      dayNotes: [],
      dayTransports: getTransportForDay({ reservations, dayId, dayAssignmentIds: dayAssignments.map(a => a.id), days: DAYS }),
      dayId,
    })
    const segments = segmentsOf(buildDayRouteRuns(dayId, {
      days: DAYS, assignments: { [String(dayId)]: dayAssignments }, reservations, accommodations: stays, optimizeFromAccommodation: true,
    }))
    return {
      rows: buildPlanRows({ merged, reservations, routeSegments: segments, dayId }),
      legs: hotelLegsForDay(DAYS.find(d => d.id === dayId)!, DAYS, stays, segments),
    }
  }
  const dayOne = () => planOf(1, [hotelStop, townHall], [flight], [stay])
  const ends = (s: RouteSegment) => [s.from, s.to]

  it('FE-MOB-PTLM-048: opens with the flight, shows the hop from the hotel stop once and ends at the hotel', () => {
    const { rows, legs } = dayOne()
    // No drive out of a hotel the traveller has not reached yet.
    expect(legs.top).toBeNull()
    const hops = rows.filter(r => r.kind === 'conn').map(r => r.kind === 'conn' && ends(r.seg))
    expect(hops.filter(h => JSON.stringify(h) === JSON.stringify([[HOTEL.lat, HOTEL.lng], [TOWN_HALL.lat, TOWN_HALL.lng]]))).toHaveLength(1)
    expect(rows[0]).toMatchObject({ kind: 'transport', key: 'tr-7' })
    // The day closes with the drive back to the hotel.
    expect(legs.bottom).toMatchObject({ name: 'Hotel Hafen', seg: { from: [TOWN_HALL.lat, TOWN_HALL.lng], to: [HOTEL.lat, HOTEL.lng] } })
  })

  it('FE-MOB-PTLM-049: a bookend is never read as the hop between two stops that share its ends', () => {
    // The tag decides, not the coordinates: two stops on the very spots a bookend
    // joins get no connector out of it.
    const bookend = seg([HOTEL.lat, HOTEL.lng], [TOWN_HALL.lat, TOWN_HALL.lng], { hotelBookend: 'morning' })
    const rows = buildPlanRows({
      merged: [placeItem(hotelStop), placeItem(townHall)], reservations: [], routeSegments: [bookend], dayId: 1,
    })
    expect(rows.map(r => r.kind)).toEqual(['place', 'place'])
  })

  it('FE-MOB-PTLM-051: the drive from the arrival airport to the first stop sits under the flight (#2502)', () => {
    const { rows } = dayOne()
    expect(rows.map(r => r.kind)).toEqual(['transport', 'conn', 'place', 'conn', 'place'])
    const landed = rows[1]
    expect(landed).toMatchObject({ key: 'conn-tr-7', seg: { from: [HAM.lat, HAM.lng], to: [HOTEL.lat, HOTEL.lng] } })
    // It leaves no stop, so there is no stop whose outgoing mode it would change.
    expect(landed.kind === 'conn' && landed.assignmentId).toBeUndefined()
  })

  it('FE-MOB-PTLM-052: the drive to the departure airport sits under the stop it leaves from', () => {
    const HARBOUR = { lat: 53.5436, lng: 9.9661 }
    const homeFlight = buildReservation({
      id: 8, type: 'flight', title: 'KL 1790', day_id: 3, end_day_id: 3, day_plan_position: 5,
      reservation_time: '2026-05-03T18:00', reservation_end_time: '2026-05-03T19:10',
      endpoints: [
        { role: 'from', sequence: 0, name: 'HAM', code: null, ...HAM, timezone: null, local_date: null, local_time: null },
        { role: 'to', sequence: 1, name: 'AMS', code: null, ...AMS, timezone: null, local_date: null, local_time: null },
      ],
    })
    const harbour = buildAssignment({ id: 23, day_id: 3, order_index: 0, place: place(902, 'Harbour', HARBOUR.lat, HARBOUR.lng) })
    const { rows } = planOf(3, [harbour], [homeFlight], [])
    expect(rows.map(r => r.kind)).toEqual(['place', 'conn', 'transport'])
    // Its mode is the stop's own, so the row keeps the stop's menu.
    expect(rows[1]).toMatchObject({ key: 'conn-pl-23', assignmentId: 23, seg: { from: [HARBOUR.lat, HARBOUR.lng], to: [HAM.lat, HAM.lng] } })
  })

  it('FE-MOB-PTLM-053: two flights back to back get no drive between the airports (#1394)', () => {
    const endpoint = (role: 'from' | 'to', at: { lat: number; lng: number }) =>
      ({ role, sequence: role === 'from' ? 0 : 1, name: role, code: null, ...at, timezone: null, local_date: null, local_time: null })
    const IST = { lat: 41.2753, lng: 28.7519 }
    const SAW = { lat: 40.8986, lng: 29.3092 }
    const inbound = buildReservation({ id: 9, type: 'flight', day_id: 2, endpoints: [endpoint('from', AMS), endpoint('to', IST)] })
    const onward = buildReservation({ id: 10, type: 'flight', day_id: 2, endpoints: [endpoint('from', SAW), endpoint('to', HAM)] })
    const rows = buildPlanRows({
      merged: [transportItem(inbound), transportItem(onward)],
      reservations: [],
      routeSegments: [seg([IST.lat, IST.lng], [SAW.lat, SAW.lng])],
      dayId: 2,
    })
    expect(rows.map(r => r.kind)).toEqual(['transport', 'transport'])
  })

  it('FE-MOB-PTLM-054: a located transit ride gets the walk to its first stop and from its last one', () => {
    const S1 = { lat: 48.11, lng: 16.11 }
    const S2 = { lat: 48.19, lng: 16.19 }
    const ride = buildReservation({
      id: 64, type: 'transit', day_id: 2,
      metadata: JSON.stringify({ transit: { legs: [{ mode: 'subway', line: 'U2' }], transfers: 0 } }),
      endpoints: [
        { role: 'from', sequence: 0, name: 'S1', code: null, ...S1, timezone: null, local_date: null, local_time: null },
        { role: 'to', sequence: 1, name: 'S2', code: null, ...S2, timezone: null, local_date: null, local_time: null },
      ],
    })
    const museum = assignment(11, 0, place(101, 'Museum', 48.1, 16.1))
    const park = assignment(12, 1, place(102, 'Park', 48.2, 16.2))
    const rows = buildPlanRows({
      merged: [placeItem(museum), transportItem(ride), placeItem(park)],
      reservations: [],
      routeSegments: [seg([48.1, 16.1], [S1.lat, S1.lng]), seg([S2.lat, S2.lng], [48.2, 16.2])],
      dayId: 2,
    })
    expect(rows.map(r => r.key)).toEqual(['pl-11', 'conn-pl-11', 'tr-64', 'conn-tr-64', 'pl-12'])
  })

  it('FE-MOB-PTLM-055: a transit ride saved on the stops themselves gets no connector that goes nowhere', () => {
    // The transit planner saves a journey between two of the day's places at their
    // own coordinates, so the route has a leg of no length on either side of it.
    const LANDING = { lat: 53.5457, lng: 9.9666 }
    const ride = buildReservation({
      id: 65, type: 'transit', title: 'Town Hall → Landungsbruecken', day_id: 2, end_day_id: 2, day_plan_position: 0.5,
      reservation_time: '2026-05-02T10:00', reservation_end_time: '2026-05-02T10:12',
      metadata: JSON.stringify({ transit: { legs: [{ mode: 'SUBWAY', line: 'U3' }], transfers: 0 } }),
      endpoints: [
        { role: 'from', sequence: 0, name: 'Town Hall', code: null, ...TOWN_HALL, timezone: null, local_date: null, local_time: null },
        { role: 'to', sequence: 1, name: 'Landungsbruecken', code: null, ...LANDING, timezone: null, local_date: null, local_time: null },
      ],
    })
    const hall = buildAssignment({ id: 24, day_id: 2, order_index: 0, place: place(901, 'Town Hall', TOWN_HALL.lat, TOWN_HALL.lng) })
    const landing = buildAssignment({ id: 25, day_id: 2, order_index: 1, place: place(903, 'Landungsbruecken', LANDING.lat, LANDING.lng) })
    const drawn = segmentsOf(buildDayRouteRuns(2, {
      days: DAYS, assignments: { '2': [hall, landing] }, reservations: [ride], accommodations: [stay], optimizeFromAccommodation: true,
    }))
    expect(drawn.filter(s => JSON.stringify(s.from) === JSON.stringify(s.to))).toHaveLength(2)

    const { rows, legs } = planOf(2, [hall, landing], [ride], [stay])
    expect(rows.map(r => r.key)).toEqual(['pl-24', 'tr-65', 'pl-25'])
    // The drives out of and back to the hotel are real and stay.
    expect(legs.top).toMatchObject({ seg: { from: [HOTEL.lat, HOTEL.lng], to: [TOWN_HALL.lat, TOWN_HALL.lng] } })
    expect(legs.bottom).toMatchObject({ seg: { from: [LANDING.lat, LANDING.lng], to: [HOTEL.lat, HOTEL.lng] } })
  })

  it('FE-MOB-PTLM-056: two stops on the very same spot keep their connector', () => {
    // Only a booking's station on the stop is no leg; the stop's own menu stays.
    const inn = assignment(13, 0, place(103, 'Inn', 48.1, 16.1))
    const bar = assignment(14, 1, place(104, 'Bar in the inn', 48.1, 16.1))
    const rows = buildPlanRows({
      merged: [placeItem(inn), placeItem(bar)], reservations: [], routeSegments: [seg([48.1, 16.1], [48.1, 16.1])], dayId: 2,
    })
    expect(rows.map(r => r.key)).toEqual(['pl-13', 'conn-pl-13', 'pl-14'])
  })

  describe('a booking the route has no location for', () => {
    // The route rides straight past it, so the drive through it is drawn on the map,
    // and the desktop day plan shows that leg under the booking.
    const station = (role: 'from' | 'to', p: { lat: number; lng: number }, name: string) =>
      ({ role, sequence: role === 'from' ? 0 : 1, name, code: null, ...p, timezone: null, local_date: null, local_time: null })
    const LANDING = { lat: 53.5457, lng: 9.9666 }

    it('FE-MOB-PTLM-057: the drive to the departure airport past a taxi without its stops goes under the taxi (#2502)', () => {
      const hall = buildAssignment({ id: 26, day_id: 3, order_index: 0, place: place(901, 'Town Hall', TOWN_HALL.lat, TOWN_HALL.lng) })
      const taxi = buildReservation({ id: 70, type: 'taxi', title: 'Taxi to the airport', day_id: 3, end_day_id: 3, day_plan_position: 0.5 })
      const homeFlight = buildReservation({
        id: 71, type: 'flight', title: 'KL 1790', day_id: 3, end_day_id: 3, day_plan_position: 0.8,
        reservation_time: '2026-05-03T18:00', reservation_end_time: '2026-05-03T19:10',
        endpoints: [station('from', HAM, 'HAM'), station('to', AMS, 'AMS')],
      })
      const { rows } = planOf(3, [hall], [taxi, homeFlight], [])
      expect(rows.map(r => r.key)).toEqual(['pl-26', 'tr-70', 'conn-tr-70', 'tr-71'])
      // Routed in the mode of the stop it left, so the menu edits that stop.
      expect(rows[2]).toMatchObject({ assignmentId: 26, seg: { from: [TOWN_HALL.lat, TOWN_HALL.lng], to: [HAM.lat, HAM.lng] } })
    })

    it('FE-MOB-PTLM-058: an event between two stops carries the drive between them, stations or not (#2502)', () => {
      const hall = buildAssignment({ id: 27, day_id: 2, order_index: 0, place: place(901, 'Town Hall', TOWN_HALL.lat, TOWN_HALL.lng) })
      const landing = buildAssignment({ id: 28, day_id: 2, order_index: 1, place: place(903, 'Landungsbruecken', LANDING.lat, LANDING.lng) })
      const concert = buildReservation({ id: 72, type: 'event', title: 'Concert', day_id: 2, end_day_id: 2, day_plan_position: 0.5 })
      // A transit booking turned into an event in the booking form keeps its stations,
      // and the route still only rides transport bookings.
      const retyped = { ...concert, endpoints: [station('from', TOWN_HALL, 'Town Hall'), station('to', HAM, 'HAM')] }
      for (const booking of [concert, retyped]) {
        const { rows } = planOf(2, [hall, landing], [booking], [])
        expect(rows.map(r => r.key)).toEqual(['pl-27', 'tr-72', 'conn-tr-72', 'pl-28'])
        expect(rows[2]).toMatchObject({ assignmentId: 27, seg: { from: [TOWN_HALL.lat, TOWN_HALL.lng], to: [LANDING.lat, LANDING.lng] } })
      }
    })

    it('FE-MOB-PTLM-059: an arrival carries past it into the next drive, and two flights around it stay apart (#1394)', () => {
      const taxi = buildReservation({ id: 73, type: 'taxi', title: 'Taxi', day_id: 1, end_day_id: 1, day_plan_position: -0.2 })
      const { rows } = planOf(1, [hotelStop, townHall], [flight, taxi], [stay])
      expect(rows.map(r => r.key)).toEqual(['tr-7', 'tr-73', 'conn-tr-73', 'pl-21', 'conn-pl-21', 'pl-22'])
      expect(rows[2]).toMatchObject({ seg: { from: [HAM.lat, HAM.lng], to: [HOTEL.lat, HOTEL.lng] } })
      // It leaves the airport, not a stop, so there is no stop's mode to change.
      expect(rows[2].kind === 'conn' && rows[2].assignmentId).toBeUndefined()

      const IST = { lat: 41.2753, lng: 28.7519 }
      const SAW = { lat: 40.8986, lng: 29.3092 }
      const inbound = buildReservation({ id: 9, type: 'flight', day_id: 2, endpoints: [station('from', AMS, 'AMS'), station('to', IST, 'IST')] })
      const shuttle = buildReservation({ id: 74, type: 'bus', day_id: 2 })
      const onward = buildReservation({ id: 10, type: 'flight', day_id: 2, endpoints: [station('from', SAW, 'SAW'), station('to', HAM, 'HAM')] })
      const transfer = buildPlanRows({
        merged: [transportItem(inbound), transportItem(shuttle), transportItem(onward)],
        reservations: [],
        routeSegments: [seg([IST.lat, IST.lng], [SAW.lat, SAW.lng])],
        dayId: 2,
      })
      expect(transfer.map(r => r.kind)).toEqual(['transport', 'transport', 'transport'])
    })

    it('FE-MOB-PTLM-060: the drive goes under the last of several such bookings, and none of them opens the day', () => {
      const museum = assignment(11, 0, place(101, 'Museum', 48.1, 16.1))
      const park = assignment(12, 1, place(102, 'Park', 48.2, 16.2))
      const early = buildReservation({ id: 75, type: 'taxi', day_id: 2 })
      const taxi = buildReservation({ id: 76, type: 'taxi', day_id: 2 })
      const note = buildDayNote({ id: 42, day_id: 2 })
      const concert = buildReservation({ id: 77, type: 'event', day_id: 2 })
      const rows = buildPlanRows({
        merged: [transportItem(early), placeItem(museum), transportItem(taxi), noteItem(note), transportItem(concert), placeItem(park)],
        reservations: [],
        routeSegments: [seg([48.1, 16.1], [48.2, 16.2])],
        dayId: 2,
      })
      expect(rows.map(r => r.key)).toEqual(['tr-75', 'pl-11', 'tr-76', 'note-42', 'tr-77', 'conn-tr-77', 'pl-12'])
    })
  })
})

describe('planTimelineModel — cityPillsForDay', () => {
  const t = ((key: string, params?: Record<string, string | number>) =>
    params ? `${key}:${Object.values(params).join(',')}` : key) as unknown as TranslationFn

  it('FE-MOB-PTLM-028: splits a transfer title into one pill per city', () => {
    expect(cityPillsForDay({ ...DAY2, title: 'Tokyo → Kyoto ' } as Day, t)).toEqual(['Tokyo', 'Kyoto'])
  })

  it('FE-MOB-PTLM-029: keeps a plain title as a single pill', () => {
    expect(cityPillsForDay(DAY2, t)).toEqual(['Old Town'])
  })

  it('FE-MOB-PTLM-030: falls back to the day number for blank or arrow-only titles', () => {
    expect(cityPillsForDay({ ...DAY2, title: '   ' } as Day, t)).toEqual(['planner.dayN:2'])
    expect(cityPillsForDay({ ...DAY2, title: ' → ' } as Day, t)).toEqual(['planner.dayN:2'])
    expect(cityPillsForDay(undefined, t)).toEqual(['planner.dayN:0'])
  })
})

describe('planTimelineModel — findUpNext', () => {
  const early = assignment(11, 0, place(101, 'Breakfast', 48.1, 16.1, '09:00'))
  const noon = assignment(12, 1, place(102, 'Museum', 48.2, 16.2, '11:00'))
  const late = assignment(13, 2, place(103, 'Dinner', 48.3, 16.3, '19:00'))

  it('FE-MOB-PTLM-031: returns null for a day without stops', () => {
    expect(findUpNext(DAY2, [], new Date(2026, 4, 2, 10, 0))).toBeNull()
  })

  it('FE-MOB-PTLM-032: counts down to the next stop still ahead today', () => {
    const up = findUpNext(DAY2, [late, early, noon], new Date(2026, 4, 2, 10, 15))
    expect(up?.assignment.id).toBe(12)
    expect(up?.minutesUntil).toBe(45)
  })

  it('FE-MOB-PTLM-033: shows nothing once the timed plan for today has run out', () => {
    expect(findUpNext(DAY2, [early, noon, late], new Date(2026, 4, 2, 23, 30))).toBeNull()
  })

  it('FE-MOB-PTLM-044: shows nothing for a day that is already behind us', () => {
    expect(findUpNext(DAY2, [late, noon, early], new Date(2026, 4, 3, 8, 0))).toBeNull()
  })

  it('FE-MOB-PTLM-034: never counts down on a day that is not today', () => {
    const up = findUpNext(DAY2, [late, noon, early], new Date(2026, 4, 1, 8, 0))
    expect(up?.assignment.id).toBe(11)
    expect(up?.minutesUntil).toBeNull()
  })

  it('FE-MOB-PTLM-035: uses the manual order when no stop carries a time', () => {
    const a = assignment(21, 1, place(201, 'Park', 48.1, 16.1))
    const b = assignment(22, 0, place(202, 'Cafe', 48.2, 16.2))
    const up = findUpNext(DAY2, [a, b], new Date(2026, 4, 2, 10, 0))
    expect(up?.assignment.id).toBe(22)
    expect(up?.minutesUntil).toBeNull()
  })

  it('FE-MOB-PTLM-036: treats a day without a date as not today', () => {
    const up = findUpNext({ ...DAY2, date: null } as unknown as Day, [noon, early], new Date(2026, 4, 2, 10, 0))
    expect(up?.assignment.id).toBe(11)
    expect(findUpNext(undefined, [noon, early], new Date(2026, 4, 2, 10, 0))?.assignment.id).toBe(11)
  })
})

describe('planTimelineModel — chronology helpers', () => {
  it('FE-MOB-PTLM-037: detects which merged items carry a time', () => {
    expect(itemHasTime(placeItem(assignment(11, 0, place(101, 'Museum', 48.1, 16.1, '09:00'))), 2)).toBe(true)
    expect(itemHasTime(placeItem(assignment(12, 1, place(102, 'Park', 48.2, 16.2))), 2)).toBe(false)
    expect(itemHasTime(noteItem(buildDayNote({ id: 41, time: '10:30' })), 2)).toBe(true)
    expect(itemHasTime(noteItem(buildDayNote({ id: 42, time: null })), 2)).toBe(false)
  })

  it('FE-MOB-PTLM-038: reads a transport time through the per-day display time', () => {
    const bus = buildReservation({ id: 51, type: 'bus', day_id: 2, reservation_time: '2026-05-02T08:00' })
    expect(itemHasTime(transportItem(bus), 2)).toBe(true)
    const car = buildReservation({ id: 52, type: 'car', day_id: 1, end_day_id: 3, reservation_time: '2026-05-01T08:00' })
    expect(itemHasTime(transportItem(car), 2)).toBe(false)
  })

  it('FE-MOB-PTLM-039: reports an order that puts a later time before an earlier one', () => {
    const nine = placeItem(assignment(11, 0, place(101, 'Breakfast', 48.1, 16.1, '09:00')))
    const eleven = placeItem(assignment(12, 1, place(102, 'Museum', 48.2, 16.2, '11:00')))
    expect(breaksChronology([nine, eleven], 2, getDisplayTimeForDay)).toBe(false)
    expect(breaksChronology([eleven, nine], 2, getDisplayTimeForDay)).toBe(true)
  })

  it('FE-MOB-PTLM-040: lets untimed items sit anywhere between timed ones', () => {
    const nine = placeItem(assignment(11, 0, place(101, 'Breakfast', 48.1, 16.1, '09:00')))
    const free = placeItem(assignment(12, 1, place(102, 'Park', 48.2, 16.2)))
    const eleven = noteItem(buildDayNote({ id: 41, time: '11:00' }))
    expect(breaksChronology([nine, free, eleven], 2, getDisplayTimeForDay)).toBe(false)

    const bus = transportItem(buildReservation({ id: 51, type: 'bus', day_id: 2, reservation_time: '2026-05-02T07:00' }))
    const getDisplayTime = vi.fn(getDisplayTimeForDay)
    expect(breaksChronology([nine, bus], 2, getDisplayTime)).toBe(true)
    expect(getDisplayTime).toHaveBeenCalledWith(bus.data, 2)
  })
})

describe('planTimelineModel — weatherIconFor', () => {
  it('FE-MOB-PTLM-041: maps the known conditions and defaults to a cloud', () => {
    expect(weatherIconFor('Clear')).toBe(Sun)
    expect(weatherIconFor('Rain')).toBe(CloudRain)
    expect(weatherIconFor('Thunderstorm')).toBe(CloudLightning)
    expect(weatherIconFor('Snow')).toBe(CloudSnow)
    expect(weatherIconFor('Haze')).toBe(Wind)
    expect(weatherIconFor('Tornado')).toBe(Cloud)
    expect(weatherIconFor(undefined)).toBe(Cloud)
  })
})
