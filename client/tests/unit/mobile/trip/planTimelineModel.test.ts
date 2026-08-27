import { describe, expect, it, vi } from 'vitest'
import { Cloud, CloudLightning, CloudRain, CloudSnow, Sun, Wind } from 'lucide-react'
import {
  breaksChronology, buildPlanRows, cityPillsForDay, findUpNext, getTransitMeta, hotelChipsForDay,
  hotelLegsForDay, itemHasTime, parseReservationMeta, transportSubtitle, weatherIconFor,
  type TransportEntry,
} from '../../../../src/mobile/screens/trip/plan/planTimelineModel'
import { getDisplayTimeForDay, type MergedItem } from '../../../../src/utils/dayMerge'
import { buildAssignment, buildDayNote, buildPlace, buildReservation } from '../../../helpers/factories'
import type {
  Accommodation, Assignment, Day, DayNote, Reservation, RouteSegment, TranslationFn,
} from '../../../../src/types'

// FE-MOB-PTLM-001 to FE-MOB-PTLM-045

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
    expect(first.kind === 'place' && first.linkedRes).toBe(dinner)
    expect(second.kind === 'place' && second.linkedRes).toBeNull()
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

  it('FE-MOB-PTLM-019: draws no connector when a transport is the hop between the places', () => {
    const bus = buildReservation({ id: 51, type: 'bus', day_id: 2 })
    const rows = buildPlanRows({
      merged: [placeItem(museum), transportItem(bus), placeItem(park)],
      reservations: [],
      routeSegments: [seg([48.1, 16.1], [48.2, 16.2])],
      dayId: 2,
    })
    expect(rows.map(r => r.kind)).toEqual(['place', 'transport', 'place'])
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
  it('FE-MOB-PTLM-022: orders check-out before check-in before an ongoing stay', () => {
    const chips = hotelChipsForDay(DAY2, DAYS, [
      accommodation({ id: 1, start_day_id: 1, end_day_id: 3, place_name: 'Long Stay' }),
      accommodation({ id: 2, start_day_id: 2, end_day_id: 3, place_name: 'New Hotel', check_in: '15:00' }),
      accommodation({ id: 3, start_day_id: 1, end_day_id: 2, place_name: 'Old Hotel', check_out: '11:00' }),
    ])
    expect(chips).toEqual([
      { key: 'out-3', variant: 'checkout', name: 'Old Hotel', time: '11:00' },
      { key: 'in-2', variant: 'checkin', name: 'New Hotel', time: '15:00' },
      { key: 'stay-1', variant: 'stay', name: 'Long Stay', time: null },
    ])
  })

  it('FE-MOB-PTLM-023: falls back to the reservation title and drops unnamed stays', () => {
    const chips = hotelChipsForDay(DAY2, DAYS, [
      accommodation({ id: 4, place_name: null, reservation_title: 'Airbnb Wieden' }),
      accommodation({ id: 5, place_name: null, reservation_title: null }),
    ])
    expect(chips).toEqual([{ key: 'stay-4', variant: 'stay', name: 'Airbnb Wieden', time: null }])
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
    const out = seg([48.0, 16.0], [48.1, 16.1])
    const back = seg([48.2, 16.2], [48.0, 16.0])
    const legs = hotelLegsForDay(DAY2, DAYS, [hotel], [out, back, seg([48.1, 16.1], [48.2, 16.2])])
    expect(legs.top).toEqual({ seg: out, name: 'Hotel Sacher' })
    expect(legs.bottom).toEqual({ seg: back, name: 'Hotel Sacher' })
  })

  it('FE-MOB-PTLM-026: returns no legs when no segment touches the hotel', () => {
    const hotel = accommodation({ id: 8, start_day_id: 1, end_day_id: 3, place_lat: 48.0, place_lng: 16.0 })
    expect(hotelLegsForDay(DAY2, DAYS, [hotel], [seg([48.1, 16.1], [48.2, 16.2])])).toEqual({ top: null, bottom: null })
  })

  it('FE-MOB-PTLM-027: returns no legs without an accommodation on the day', () => {
    expect(hotelLegsForDay(DAY2, DAYS, [], [seg([48.1, 16.1], [48.2, 16.2])])).toEqual({ top: null, bottom: null })
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
    expect(up?.displayTime).toBe('11:00')
  })

  it('FE-MOB-PTLM-033: returns no stale up-next stop once today\'s timed plan is over', () => {
    expect(findUpNext(DAY2, [early, noon, late], new Date(2026, 4, 2, 23, 30))).toBeNull()
  })

  it('FE-MOB-PTLM-044: prefers the assignment time override to the place default', () => {
    const overridden = {
      ...early,
      assignment_time: '14:30',
    } as Assignment
    const up = findUpNext(DAY2, [overridden], new Date(2026, 4, 2, 13, 0))
    expect(up?.assignment.id).toBe(11)
    expect(up?.minutesUntil).toBe(90)
    expect(up?.displayTime).toBe('14:30')
  })

  it('FE-MOB-PTLM-034: never counts down on a day that is not today', () => {
    const up = findUpNext(DAY2, [late, noon, early], new Date(2026, 4, 1, 8, 0))
    expect(up?.assignment.id).toBe(11)
    expect(up?.minutesUntil).toBeNull()
    expect(up?.displayTime).toBe('09:00')
  })

  it('FE-MOB-PTLM-045: hides stale up-next content for a past day', () => {
    expect(findUpNext(DAY2, [late, noon, early], new Date(2026, 4, 3, 8, 0))).toBeNull()
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
