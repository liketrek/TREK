import { describe, it, expect } from 'vitest'
import { parseTimeToMinutes, getSpanPhase, hidesOnMiddleDay, getTransportRouteEndpoints, getDisplayTimeForDay, getTransportForDay, getAssignmentReservations, pinnedAway, stopDayIds, getPlaceBookings, getMergedItems, nightRowsOf, rideSeatKey, seatTimedDrop, stayStartingOn, storedRideSlot, timedSlot, type MergedItem } from './dayMerge'
import { planMergedOrder, withTransportPositions } from './mergedOrder'

describe('parseTimeToMinutes', () => {
  it('parses HH:MM string', () => {
    expect(parseTimeToMinutes('09:30')).toBe(570)
  })

  it('parses ISO datetime string', () => {
    expect(parseTimeToMinutes('2025-03-30T14:00:00')).toBe(840)
  })

  it('returns null for null/empty', () => {
    expect(parseTimeToMinutes(null)).toBeNull()
    expect(parseTimeToMinutes(undefined)).toBeNull()
  })
})

describe('getSpanPhase', () => {
  it('returns single when start === end', () => {
    expect(getSpanPhase({ day_id: 1, end_day_id: 1 }, 1)).toBe('single')
  })

  it('returns start for the departure day', () => {
    expect(getSpanPhase({ day_id: 1, end_day_id: 3 }, 1)).toBe('start')
  })

  it('returns end for the arrival day', () => {
    expect(getSpanPhase({ day_id: 1, end_day_id: 3 }, 3)).toBe('end')
  })

  it('returns middle for days in between', () => {
    expect(getSpanPhase({ day_id: 1, end_day_id: 3 }, 2)).toBe('middle')
  })
})

describe('hidesOnMiddleDay', () => {
  it('keeps a one-day parking on its only day', () => {
    expect(hidesOnMiddleDay({ type: 'parking', day_id: 1, end_day_id: 1 }, 1)).toBe(false)
  })

  it('keeps a two-day parking on both days (no day in between exists)', () => {
    const parking = { type: 'parking', day_id: 1, end_day_id: 2 }
    expect(hidesOnMiddleDay(parking, 1)).toBe(false)
    expect(hidesOnMiddleDay(parking, 2)).toBe(false)
  })

  it('hides a three-day parking only on the day in between', () => {
    const parking = { type: 'parking', day_id: 1, end_day_id: 3 }
    expect(hidesOnMiddleDay(parking, 1)).toBe(false)
    expect(hidesOnMiddleDay(parking, 2)).toBe(true)
    expect(hidesOnMiddleDay(parking, 3)).toBe(false)
  })

  it('hides every day in between of a longer parking span (#1937)', () => {
    const parking = { type: 'parking', day_id: 1, end_day_id: 5 }
    expect([1, 2, 3, 4, 5].map(d => hidesOnMiddleDay(parking, d)))
      .toEqual([false, true, true, true, false])
  })

  it('leaves a car rental visible, since its middle days move to the day header', () => {
    expect(hidesOnMiddleDay({ type: 'car', day_id: 1, end_day_id: 3 }, 2)).toBe(false)
  })

  it('leaves every other booking type alone', () => {
    for (const type of ['train', 'cruise', 'event', 'hotel', 'other']) {
      expect(hidesOnMiddleDay({ type, day_id: 1, end_day_id: 3 }, 2)).toBe(false)
    }
  })

  it('keeps a parking whose end day is not part of the trip', () => {
    expect(hidesOnMiddleDay({ type: 'parking', day_id: 1, end_day_id: 999 }, 1)).toBe(false)
  })

  it('keeps an unscheduled parking', () => {
    expect(hidesOnMiddleDay({ type: 'parking', day_id: null, end_day_id: null }, 2)).toBe(false)
  })
})

describe('getTransportRouteEndpoints', () => {
  const pickup = { role: 'from', lat: 48.1, lng: 11.5 }
  const dropoff = { role: 'to', lat: 52.5, lng: 13.4 }
  // A car rental spanning day 1 (pickup) through day 3 (drop-off).
  const rental = { day_id: 1, end_day_id: 3, endpoints: [pickup, dropoff] }

  it('routes to the pickup only on the start day of a multi-day rental', () => {
    expect(getTransportRouteEndpoints(rental, 1)).toEqual({ from: { lat: 48.1, lng: 11.5 }, to: null })
  })

  it('routes from the drop-off only on the end day', () => {
    expect(getTransportRouteEndpoints(rental, 3)).toEqual({ from: null, to: { lat: 52.5, lng: 13.4 } })
  })

  it('adds no waypoints on the days in between (regression for #1210)', () => {
    expect(getTransportRouteEndpoints(rental, 2)).toEqual({ from: null, to: null })
  })

  it('uses both endpoints for a single-day transport', () => {
    const sameDay = { day_id: 1, end_day_id: 1, endpoints: [pickup, dropoff] }
    expect(getTransportRouteEndpoints(sameDay, 1)).toEqual({
      from: { lat: 48.1, lng: 11.5 },
      to: { lat: 52.5, lng: 13.4 },
    })
  })

  it('returns nulls when the endpoints carry no coordinates', () => {
    const noCoords = { day_id: 1, end_day_id: 1, endpoints: [{ role: 'from' }, { role: 'to' }] }
    expect(getTransportRouteEndpoints(noCoords, 1)).toEqual({ from: null, to: null })
  })
})

describe('getDisplayTimeForDay', () => {
  const r = { day_id: 1, end_day_id: 3, reservation_time: '2025-01-01T09:00:00', reservation_end_time: '2025-01-03T14:00:00' }

  it('returns reservation_time on start day', () => {
    expect(getDisplayTimeForDay(r, 1)).toBe(r.reservation_time)
  })

  it('returns reservation_end_time on end day', () => {
    expect(getDisplayTimeForDay(r, 3)).toBe(r.reservation_end_time)
  })

  it('returns null for middle day', () => {
    expect(getDisplayTimeForDay(r, 2)).toBeNull()
  })
})

describe('getTransportForDay', () => {
  const days = [
    { id: 1, day_number: 1 },
    { id: 2, day_number: 2 },
    { id: 3, day_number: 3 },
  ]

  it('excludes hotel (rendered via accommodation path)', () => {
    const reservations = [{ id: 10, type: 'hotel', day_id: 1 }]
    expect(getTransportForDay({ reservations, dayId: 1, dayAssignmentIds: [], days })).toHaveLength(0)
  })

  it('includes tour booking on the correct day', () => {
    const reservations = [{ id: 20, type: 'tour', day_id: 1 }]
    expect(getTransportForDay({ reservations, dayId: 1, dayAssignmentIds: [], days })).toHaveLength(1)
    expect(getTransportForDay({ reservations, dayId: 2, dayAssignmentIds: [], days })).toHaveLength(0)
  })

  it('includes restaurant, event, and other bookings by day_id', () => {
    const reservations = [
      { id: 30, type: 'restaurant', day_id: 2 },
      { id: 31, type: 'event', day_id: 2 },
      { id: 32, type: 'other', day_id: 2 },
    ]
    expect(getTransportForDay({ reservations, dayId: 2, dayAssignmentIds: [], days })).toHaveLength(3)
    expect(getTransportForDay({ reservations, dayId: 1, dayAssignmentIds: [], days })).toHaveLength(0)
  })

  it('includes single-day transport on the correct day', () => {
    const reservations = [{ id: 10, type: 'flight', day_id: 1, end_day_id: 1 }]
    expect(getTransportForDay({ reservations, dayId: 1, dayAssignmentIds: [], days })).toHaveLength(1)
    expect(getTransportForDay({ reservations, dayId: 2, dayAssignmentIds: [], days })).toHaveLength(0)
  })

  it('includes multi-day transport on all spanned days', () => {
    const reservations = [{ id: 10, type: 'train', day_id: 1, end_day_id: 3 }]
    expect(getTransportForDay({ reservations, dayId: 1, dayAssignmentIds: [], days })).toHaveLength(1)
    expect(getTransportForDay({ reservations, dayId: 2, dayAssignmentIds: [], days })).toHaveLength(1)
    expect(getTransportForDay({ reservations, dayId: 3, dayAssignmentIds: [], days })).toHaveLength(1)
  })

  it('excludes transport linked to an assignment on that day', () => {
    const reservations = [{ id: 10, type: 'bus', day_id: 1, end_day_id: 1, assignment_id: 42 }]
    expect(getTransportForDay({ reservations, dayId: 1, dayAssignmentIds: [42], days })).toHaveLength(0)
    expect(getTransportForDay({ reservations, dayId: 1, dayAssignmentIds: [99], days })).toHaveLength(1)
  })

  it('expands a multi-leg TRAIN into one row per leg with train detail on __leg (#1150)', () => {
    const reservations = [{
      id: 40, type: 'train', day_id: 1, end_day_id: 2,
      metadata: JSON.stringify({
        train_number: 'ICE 100',
        legs: [
          { from: 'Berlin', to: 'Frankfurt', train_number: 'ICE 100', platform: '5', dep_day_id: 1, dep_time: '08:00', arr_day_id: 1, arr_time: '12:00' },
          { from: 'Frankfurt', to: 'München', train_number: 'ICE 500', platform: '9', dep_day_id: 2, dep_time: '09:00', arr_day_id: 2, arr_time: '12:00' },
        ],
      }),
    }]
    const day1 = getTransportForDay({ reservations, dayId: 1, dayAssignmentIds: [], days })
    expect(day1).toHaveLength(1)
    expect(day1[0].__leg).toMatchObject({ index: 0, total: 2, from: 'Berlin', to: 'Frankfurt', train_number: 'ICE 100', platform: '5' })
    const day2 = getTransportForDay({ reservations, dayId: 2, dayAssignmentIds: [], days })
    expect(day2).toHaveLength(1)
    expect(day2[0].__leg).toMatchObject({ index: 1, from: 'Frankfurt', to: 'München', train_number: 'ICE 500', platform: '9' })
  })

  it('leaves a single-leg train untouched (no __leg)', () => {
    const reservations = [{ id: 41, type: 'train', day_id: 1, end_day_id: 1, metadata: JSON.stringify({ train_number: 'RE 1' }) }]
    const rows = getTransportForDay({ reservations, dayId: 1, dayAssignmentIds: [], days })
    expect(rows).toHaveLength(1)
    expect(rows[0].__leg).toBeUndefined()
  })
})

describe('a booking pinned to a stop on another day (#2604)', () => {
  const days = [
    { id: 1, day_number: 1 },
    { id: 2, day_number: 2 },
    { id: 3, day_number: 3 },
    { id: 4, day_number: 4 },
  ]
  const order = (id: number) => days.find(d => d.id === id)?.day_number ?? null
  const stopDays = stopDayIds({ '1': [{ id: 41 }], '3': [{ id: 43 }, { id: 44 }], '4': undefined })

  it('maps every stop to its day', () => {
    expect([...stopDays.entries()]).toEqual([[41, 1], [43, 3], [44, 3]])
  })

  it("a stop outside the booking's own days wins, a stop on one of them or a gone stop does not", () => {
    expect(pinnedAway({ assignment_id: 43, day_id: 1 }, stopDays, order)).toBe(true)
    expect(pinnedAway({ assignment_id: 41, day_id: 1 }, stopDays, order)).toBe(false)
    // A rental picked up at a stop still runs across the rest of its days.
    expect(pinnedAway({ assignment_id: 43, day_id: 2, end_day_id: 4 }, stopDays, order)).toBe(false)
    expect(pinnedAway({ assignment_id: 99, day_id: 1 }, stopDays, order)).toBe(false)
    expect(pinnedAway({ assignment_id: null, day_id: 1 }, stopDays, order)).toBe(false)
    expect(pinnedAway({ assignment_id: 43, day_id: null }, stopDays, order)).toBe(false)
    expect(pinnedAway({ assignment_id: 43, day_id: 1 }, undefined, order)).toBe(false)
  })

  it("the timeline of the booking's own day leaves it to the stop, so it is listed once", () => {
    const dinner = { id: 10, type: 'restaurant', day_id: 1, assignment_id: 43 }
    const reservations = [dinner]
    expect(getTransportForDay({ reservations, dayId: 1, dayAssignmentIds: [41], days, stopDays })).toHaveLength(0)
    expect(getTransportForDay({ reservations, dayId: 3, dayAssignmentIds: [43, 44], days, stopDays })).toHaveLength(0)
    expect(getAssignmentReservations(reservations, 43)).toEqual([dinner])
    // Without the stops of the trip the old rule stands.
    expect(getTransportForDay({ reservations, dayId: 1, dayAssignmentIds: [41], days })).toHaveLength(1)
  })

  it('a multi-day booking pinned to a stop on one of its days keeps its other days', () => {
    const rental = { id: 11, type: 'event', day_id: 2, end_day_id: 4, assignment_id: 43 }
    expect(getTransportForDay({ reservations: [rental], dayId: 2, dayAssignmentIds: [], days, stopDays })).toHaveLength(1)
    expect(getTransportForDay({ reservations: [rental], dayId: 3, dayAssignmentIds: [43, 44], days, stopDays })).toHaveLength(0)
  })
})

describe('getPlaceBookings (#2363)', () => {
  const reservations = [
    { id: 1, assignment_id: 42, reservation_time: '2025-06-01T10:00:00' },
    { id: 2, assignment_id: null, reservation_time: '2025-06-01T15:00:00', accommodation_place_id: 9 },
    { id: 3, assignment_id: 42, reservation_time: '2025-06-01T09:00:00', accommodation_place_id: 9 },
    { id: 4, assignment_id: null, reservation_time: null, accommodation_place_id: 8 },
  ]

  it('adds the stay booked for a hotel after the bookings pinned to the stop, each once', () => {
    expect(getPlaceBookings(reservations, 42, 9).map(r => r.id)).toEqual([3, 1, 2])
  })

  it('finds the stay even when no stop is open, as from the pill in the day head', () => {
    expect(getPlaceBookings(reservations, null, 9).map(r => r.id)).toEqual([2, 3])
  })

  it('without a place it is the pinned list alone', () => {
    expect(getPlaceBookings(reservations, 42, null).map(r => r.id)).toEqual([3, 1])
    expect(getPlaceBookings(reservations, null, 7)).toEqual([])
  })
})

describe('getAssignmentReservations', () => {
  it('returns every booking pinned to the assignment, not just the first (#2201)', () => {
    const reservations = [
      { id: 1, assignment_id: 42, reservation_time: '2025-06-01T10:00:00' },
      { id: 2, assignment_id: 42, reservation_time: '2025-06-01T09:00:00' },
      { id: 3, assignment_id: 7, reservation_time: '2025-06-01T08:00:00' },
    ]
    expect(getAssignmentReservations(reservations, 42).map(r => r.id)).toEqual([2, 1])
  })

  it('puts untimed bookings last and breaks ties on the id', () => {
    const reservations = [
      { id: 5, assignment_id: 42, reservation_time: null },
      { id: 4, assignment_id: 42, reservation_time: null },
      { id: 6, assignment_id: 42, reservation_time: '2025-06-01T09:00:00' },
    ]
    expect(getAssignmentReservations(reservations, 42).map(r => r.id)).toEqual([6, 4, 5])
  })

  it('returns nothing without an assignment', () => {
    const reservations = [{ id: 1, assignment_id: 42, reservation_time: null }]
    expect(getAssignmentReservations(reservations, null)).toEqual([])
    expect(getAssignmentReservations(reservations, undefined)).toEqual([])
  })

  it('leaves the caller array untouched', () => {
    const reservations = [
      { id: 1, assignment_id: 42, reservation_time: '2025-06-01T10:00:00' },
      { id: 2, assignment_id: 42, reservation_time: '2025-06-01T09:00:00' },
    ]
    getAssignmentReservations(reservations, 42)
    expect(reservations.map(r => r.id)).toEqual([1, 2])
  })
})

describe('getMergedItems', () => {
  it('merges places and notes sorted by sortKey', () => {
    const dayAssignments = [
      { id: 1, order_index: 0, place: { place_time: null } },
      { id: 2, order_index: 2, place: { place_time: null } },
    ]
    const dayNotes = [{ id: 10, sort_order: 1 }]
    const result = getMergedItems({ dayAssignments, dayNotes, dayTransports: [], dayId: 5 })
    expect(result.map(i => i.type)).toEqual(['place', 'note', 'place'])
    expect(result[0].data.id).toBe(1)
    expect(result[1].data.id).toBe(10)
    expect(result[2].data.id).toBe(2)
  })

  it('inserts transport by time when no per-day position is set', () => {
    const dayAssignments = [
      { id: 1, order_index: 0, place: { place_time: '08:00' } },
      { id: 2, order_index: 1, place: { place_time: '13:00' } },
    ]
    const dayTransports = [
      { id: 20, type: 'flight', day_id: 5, end_day_id: 5, reservation_time: '10:30', day_positions: null },
    ]
    const result = getMergedItems({ dayAssignments, dayNotes: [], dayTransports, dayId: 5 })
    const types = result.map(i => i.type)
    // transport (10:30) should be between place at 08:00 (idx 0) and place at 13:00 (idx 1)
    expect(types).toEqual(['place', 'transport', 'place'])
  })

  it('orders a timed transport chronologically regardless of a stale per-day position', () => {
    const dayAssignments = [
      { id: 1, order_index: 0, place: { place_time: '08:00' } },
      { id: 2, order_index: 1, place: { place_time: '13:00' } },
    ]
    // The train is at 10:30, so it sorts between the 08:00 and 13:00 places by time —
    // timed items are arranged chronologically even if an old manual position exists.
    const dayTransports = [
      { id: 20, type: 'train', day_id: 5, end_day_id: 5, reservation_time: '10:30', day_positions: { 5: 1.5 } },
    ]
    const result = getMergedItems({ dayAssignments, dayNotes: [], dayTransports, dayId: 5 })
    const types = result.map(i => i.type)
    expect(types).toEqual(['place', 'transport', 'place'])
  })

  // The same rule the server stores when a start time is saved, so on a day of places
  // alone the day it sends back after the save and the day drawn before it agree.
  it('keeps untimed places where they were put and sorts only the timed ones', () => {
    const place = (id: number, order_index: number, place_time: string | null) => ({ id, order_index, place: { place_time } })
    const ids = (dayAssignments: ReturnType<typeof place>[]) =>
      getMergedItems({ dayAssignments, dayNotes: [], dayTransports: [], dayId: 5 }).map(i => i.data.id)

    expect(ids([place(1, 0, null), place(2, 1, null), place(3, 2, '14:00')])).toEqual([1, 2, 3])
    expect(ids([place(1, 0, '09:00'), place(2, 1, null), place(3, 2, '14:00')])).toEqual([1, 2, 3])
    expect(ids([place(1, 0, null), place(2, 1, '15:00'), place(3, 2, '10:00')])).toEqual([1, 3, 2])
  })

  // Where the server's sort and this one part: the server sorts the stops alone, so
  // for it place 2 follows the 09:00 place and stays in front of the 10:00 one. Here it
  // follows the 12:00 note and is drawn behind both.
  it('lets an untimed place take the time of a timed note in front of it', () => {
    const dayAssignments = [
      { id: 1, order_index: 0, place: { place_time: '09:00' } },
      { id: 2, order_index: 1, place: { place_time: null } },
      { id: 3, order_index: 2, place: { place_time: '10:00' } },
    ]
    const dayNotes = [{ id: 10, sort_order: 0.5, time: '12:00' }]
    const result = getMergedItems({ dayAssignments, dayNotes, dayTransports: [], dayId: 5 })
    expect(result.map(i => i.data.id)).toEqual([1, 3, 10, 2])
  })
})

// The crossing from the report behind #2461: Amsterdam and Newcastle on the day, the
// ferry from IJmuiden to the Port of Tyne in the evening. The road trip seats its
// terminals by the same rule (`rideSeatAfter` in @trek/shared), so list and drive agree.
describe('getMergedItems: a ride within one day, seated by where it goes (#2461)', () => {
  const place = (id: number, order_index: number, lat: number, lng: number, place_time: string | null = null) =>
    ({ id, order_index, place: { lat, lng, place_time } })
  const amsterdam = (at: string | null = null) => place(1, 0, 52.3731, 4.8926, at)
  const newcastle = (at: string | null = null) => place(2, 1, 54.9783, -1.6178, at)
  const ferry = (over: Record<string, unknown> = {}) => ({
    id: 69, type: 'ferry', title: 'IJmuiden to Newcastle', day_id: 5, end_day_id: 5,
    reservation_time: '2026-10-06T17:30', reservation_end_time: '2026-10-06T23:00',
    endpoints: [
      { role: 'from', sequence: 0, name: 'IJmuiden', lat: 52.4581, lng: 4.5879 },
      { role: 'to', sequence: 1, name: 'Port of Tyne', lat: 54.9925, lng: -1.4522 },
    ],
    ...over,
  })
  const read = (dayAssignments: unknown[], dayTransports: unknown[], dayNotes: unknown[] = []) =>
    getMergedItems({ dayAssignments, dayNotes, dayTransports, dayId: 5 }).map(i => `${i.type}:${i.data.id}`)

  it('puts a ferry between the stops on its two shores rather than at the end of the day', () => {
    expect(read([amsterdam(), newcastle()], [ferry()])).toEqual(['place:1', 'transport:69', 'place:2'])
  })

  it('keeps it behind a stop timed before its departure, and leaves a ferry without terminals to the clock', () => {
    expect(read([amsterdam(), newcastle('10:00')], [ferry()])).toEqual(['place:1', 'place:2', 'transport:69'])
    expect(read([amsterdam(), newcastle()], [ferry({ endpoints: [] })])).toEqual(['place:1', 'place:2', 'transport:69'])
    // One that lands tomorrow has no seat of its own on this day either.
    expect(read([amsterdam(), newcastle()], [ferry({ end_day_id: 6 })])).toEqual(['place:1', 'place:2', 'transport:69'])
  })

  it('opens the day with a ride that lands next to its first stop, ahead of a note too', () => {
    // The note keeps its place ahead of the stop; the ride goes ahead of both.
    expect(read([newcastle()], [ferry()], [{ id: 10, sort_order: 0 }])).toEqual(['transport:69', 'note:10', 'place:2'])
    expect(read([newcastle()], [ferry()], [{ id: 10, sort_order: 2 }])).toEqual(['transport:69', 'place:2', 'note:10'])
  })

  it('leaves a slot somebody stored where it is', () => {
    expect(read([amsterdam(), newcastle()], [ferry({ day_positions: { 5: 1.5 } })])).toEqual(['place:1', 'place:2', 'transport:69'])
  })

  it('reads a note as nothing and another booking as its clock only', () => {
    const rows = [
      { type: 'place' as const, sortKey: 0, data: amsterdam() },
      { type: 'note' as const, sortKey: 0.5, data: { id: 10, time: '20:00' } },
      { type: 'place' as const, sortKey: 1, data: newcastle() },
    ]
    expect(rideSeatKey(ferry(), rows)).toBe(0)
    // A bus at 18:00 between the two is a clock after the departure: the ferry stays ahead of it.
    const bus = { type: 'transport' as const, sortKey: 0.5, data: { id: 11, type: 'bus', reservation_time: '18:00' } }
    expect(rideSeatKey(ferry(), [rows[0], bus, rows[2]])).toBeNull()
    expect(rideSeatKey({ ...ferry(), type: 'taxi' }, rows)).toBeNull()
  })
})

// The slot the desktop stores for a ride nobody placed yet, worked out over the rows the
// road trip drives rather than the ones the list shows (#2461).
describe('storedRideSlot', () => {
  const row = (id: number, order_index: number, lat: number | null, lng: number | null, place_time: string | null = null) =>
    ({ id, order_index, place_id: id * 10, place: { lat, lng, place_time } })
  const amsterdam = row(1, 0, 52.3731, 4.8926)
  // The hotel a booking put on the day: hidden in the list, a stop of the drive.
  const hotel = row(3, 1, 54.975, -1.61)
  const ferry = (over: Record<string, unknown> = {}) => ({
    id: 69, type: 'ferry', title: 'IJmuiden to Newcastle', day_id: 5, end_day_id: 5,
    reservation_time: '2026-10-06T17:30', reservation_end_time: '2026-10-06T23:00',
    endpoints: [
      { role: 'from', sequence: 0, name: 'IJmuiden', lat: 52.4581, lng: 4.5879 },
      { role: 'to', sequence: 1, name: 'Port of Tyne', lat: 54.9925, lng: -1.4522 },
    ],
    ...over,
  })

  it('puts a ferry ahead of the hotel across the water that the list does not show', () => {
    // Over the visible Amsterdam alone the clock closed the day at 1.5, behind the hotel,
    // and the drive went there overland before the crossing.
    expect(storedRideSlot(ferry(), [amsterdam, hotel], [{ place_id: 30, start_day_id: 5, check_in: null }], 5)).toBe(0.5)
  })

  it('times a night by the check-in of the stay that starts there, and the clock still binds', () => {
    // Checked in at three, the hotel is behind the drive by the 17:30 sailing already.
    const checkIn = [{ place_id: 30, start_day_id: 5, check_in: '15:00' }]
    expect(storedRideSlot(ferry(), [amsterdam, hotel], checkIn, 5)).toBe(1.5)
    // A stay that starts on another day says nothing about this one.
    expect(storedRideSlot(ferry(), [amsterdam, hotel], [{ ...checkIn[0], start_day_id: 4 }], 5)).toBe(0.5)
  })

  it('times only the last visit of the hotel by its check-in, an earlier one is a stop (#2636)', () => {
    // Checked in at six, after the 17:30 sailing: the night is behind the crossing, and so
    // is the rest at the same hotel before it. Read as a second check-in it timed the rest
    // at six too, and the slot went behind both, so the drive reached them overland.
    const checkIn = [{ place_id: 30, start_day_id: 5, check_in: '18:00' }]
    const night = { ...hotel, id: 4, order_index: 2 }
    expect(storedRideSlot(ferry(), [amsterdam, hotel, night], checkIn, 5)).toBe(0.5)
  })

  it("reads the booking's stop as the night over a rest after it, and a visit that ends the day over both (#2636)", () => {
    const stays = [{ place_id: 30, start_day_id: 5, check_in: '18:00' }]
    // The booking seats its stop first on a day without hours, and Days does not show it.
    const booked = { ...hotel, order_index: 0, accommodation_id: 7 }
    const rest = { ...hotel, id: 4, order_index: 2 }
    const after = row(5, 3, 54.9783, -1.6178)
    expect([...nightRowsOf([booked, { ...amsterdam, order_index: 1 }, rest, after], stays, 5)]).toEqual([0])
    expect([...nightRowsOf([booked, { ...amsterdam, order_index: 1 }, rest], stays, 5)]).toEqual([2])
    // Without a stay starting there that day nothing is a night.
    expect([...nightRowsOf([booked, rest], stays, 6)]).toEqual([])
  })

  it('opens the day, closes it, or sits behind a timed row, measured on order indexes', () => {
    expect(storedRideSlot(ferry(), [row(2, 3, 54.9783, -1.6178)], [], 5)).toBe(2.5)
    expect(storedRideSlot(ferry(), [amsterdam], [], 5)).toBe(0.5)
    expect(storedRideSlot(ferry(), [amsterdam, row(2, 1, 54.9783, -1.6178, '10:00')], [], 5)).toBe(1.5)
    // A row without coordinates is no stop of the drive, but the day still closes behind it.
    expect(storedRideSlot(ferry(), [amsterdam, row(4, 1, null, null)], [], 5)).toBe(1.5)
  })

  it('leaves anything but a ride within one day to the clock', () => {
    expect(storedRideSlot(ferry({ type: 'taxi' }), [amsterdam, hotel], [], 5)).toBeNull()
    expect(storedRideSlot(ferry({ end_day_id: 6 }), [amsterdam, hotel], [], 5)).toBeNull()
    expect(storedRideSlot(ferry(), [], [], 5)).toBeNull()
  })

  it('finds the stay by its place and the day it starts', () => {
    const stays = [{ id: 1, place_id: 30, start_day_id: 4 }, { id: 2, place_id: 30, start_day_id: 5 }]
    expect(stayStartingOn(stays, 30, 5)?.id).toBe(2)
    expect(stayStartingOn(stays, 31, 5)).toBeUndefined()
  })
})

// A stop with a start is drawn by it, and the road trip drives the stored order, so a
// stop joining a day from elsewhere is stored where the list will draw it.
describe('timedSlot', () => {
  const visit = (order_index: number, place_time: string | null, accommodation_id: number | null = null) =>
    ({ order_index, accommodation_id, place: { place_time } })
  const day = [visit(0, '09:00'), visit(1, '11:00'), visit(2, '14:00')]

  it('leaves a stop without a start to the drop', () => {
    expect(timedSlot(day, [], null, 1)).toBeNull()
    expect(timedSlot(day, [], undefined)).toBeNull()
    expect(timedSlot(day, [], 'soon')).toBeNull()
  })

  it('puts a stop between the stored stops its start falls between, wherever it was dropped', () => {
    expect(timedSlot(day, [], '10:00')).toBe(1)
    expect(timedSlot(day, [], '10:00', 2)).toBe(1)
    expect(timedSlot(day, [], '10:00', 0)).toBe(1)
    expect(timedSlot(day, [], '08:00')).toBe(0)
    expect(timedSlot(day, [], '15:00', 0)).toBe(3)
  })

  it('keeps the drop among the stops without a time behind the same start', () => {
    const loose = [visit(0, '09:00'), visit(1, null), visit(2, '11:00')]
    expect(timedSlot(loose, [], '10:00')).toBe(2)
    expect(timedSlot(loose, [], '10:00', 1)).toBe(1)
  })

  it('reads the day by order_index, not by the order the rows come in', () => {
    const shuffled = [visit(2, '14:00'), visit(0, '09:00'), visit(1, '11:00')]
    expect(timedSlot(shuffled, [], '12:00')).toBe(2)
    expect(timedSlot([], [], '12:00')).toBe(0)
  })

  it('stores it right behind the stop the list draws it after on a day stored against its hours', () => {
    // Stored 11:00 then 09:00: the list draws 09:00, 10:00, 11:00, so 10:00 goes behind 09:00.
    expect(timedSlot([visit(0, '11:00'), visit(1, '09:00')], [], '10:00')).toBe(2)
  })

  it('counts the booked night the list hides, timed by its check-in', () => {
    const nights = [{ id: 7, check_in: '15:00' }, { id: 8, check_in: null }]
    const withCheckIn = [visit(0, '09:00'), visit(1, null, 7), visit(2, '16:00')]
    expect(timedSlot(withCheckIn, nights, '12:00')).toBe(1)
    expect(timedSlot(withCheckIn, nights, '15:30')).toBe(2)
    // Without a check-in the night leads the day and stays in front.
    const leading = [visit(0, null, 8), visit(1, '09:00')]
    expect(timedSlot(leading, nights, '08:00')).toBe(1)
  })
})

// #2631: a day with timed and untimed stops between timed transit rides. Dropping a
// ride against its time used to draw it back at its time with every untimed stop
// behind the drop, and the next drag stored that shuffle.
describe('seatTimedDrop', () => {
  const DAY = 1
  const stop = (id: number, name: string, time: string | null = null) =>
    ({ id, order_index: 0, place: { name, place_time: time } })
  const ride = (id: number, time: string, pos: number) =>
    ({ id, type: 'transit', title: `ride ${time}`, day_id: DAY, reservation_time: `2026-11-20T${time}`, day_positions: { [DAY]: pos } })
  const note = (id: number, time: string | null, sort_order: number) => ({ id, text: `note ${id}`, time, sort_order })

  const setup = () => {
    const stops = [
      stop(1, 'Palacio', '07:30'), stop(2, 'Jardin', '10:30'), stop(3, 'Asamkirche', '14:00'), stop(4, 'StPeter', '14:30'),
      stop(5, 'Sendlinger'), stop(6, 'Ayuntamiento'), stop(7, 'Isartor'), stop(8, 'Juliet'),
    ].map((a, i) => ({ ...a, order_index: i }))
    return { stops, rides: [ride(101, '07:01', -0.5), ride(102, '12:01', 1.5), ride(103, '16:55', 3.5)], notes: [] as ReturnType<typeof note>[] }
  }
  type Day = ReturnType<typeof setup>
  const draw = (day: Day) => getMergedItems({ dayAssignments: day.stops, dayNotes: day.notes, dayTransports: day.rides, dayId: DAY })
  const label = (it: MergedItem) => it.type === 'place' ? it.data.place.name : it.type === 'note' ? it.data.text : it.data.title

  /** What the day list does with a drop: insert, seat, store, and draw again. */
  const drop = (day: Day, from: (it: MergedItem) => boolean, to: (it: MergedItem) => boolean, after = true) => {
    const m = draw(day)
    const order = [...m]
    const [moved] = order.splice(order.findIndex(from), 1)
    const at = order.findIndex(to) + (after ? 1 : 0)
    order.splice(at, 0, moved)
    const seated = seatTimedDrop(order, at, DAY)
    const plan = planMergedOrder(seated)
    const stored: Day = {
      stops: day.stops.map(a => ({ ...a, order_index: plan.assignmentIds.indexOf(a.id) })),
      rides: withTransportPositions(day.rides, plan.transportUpdates, DAY),
      notes: day.notes.map(n => ({ ...n, sort_order: plan.noteUpdates.find(u => u.id === n.id)?.sort_order ?? n.sort_order })),
    }
    return { seated: seated.map(label), drawn: draw(stored).map(label), stored }
  }
  const isRide = (id: number) => (it: MergedItem) => it.type === 'transport' && it.data.id === id
  const isStop = (name: string) => (it: MergedItem) => it.type === 'place' && it.data.place.name === name
  const stopsOf = (labels: string[]) => labels.filter(l => !l.startsWith('ride') && !l.startsWith('note'))

  it('draws the day as the setup expects', () => {
    expect(draw(setup()).map(label)).toEqual([
      'ride 07:01', 'Palacio', 'Jardin', 'ride 12:01', 'Asamkirche', 'StPeter', 'ride 16:55', 'Sendlinger', 'Ayuntamiento', 'Isartor', 'Juliet',
    ])
  })

  it('a ride dropped against its time goes back alone and the stops keep their order', () => {
    const day = setup()
    const before = stopsOf(draw(day).map(label))
    const { seated, drawn } = drop(day, isRide(102), isStop('Sendlinger'))
    expect(drawn).toEqual(seated)
    expect(stopsOf(drawn)).toEqual(before)
    expect(drawn.indexOf('ride 12:01')).toBe(drawn.indexOf('Asamkirche') - 1)
  })

  it('a later drag of another ride does not reshuffle the stops either', () => {
    const first = drop(setup(), isRide(102), isStop('Sendlinger'))
    const { seated, drawn } = drop(first.stored, isRide(101), isStop('Ayuntamiento'))
    expect(drawn).toEqual(seated)
    expect(stopsOf(drawn)).toEqual(['Palacio', 'Jardin', 'Asamkirche', 'StPeter', 'Sendlinger', 'Ayuntamiento', 'Isartor', 'Juliet'])
    expect(drawn[0]).toBe('ride 07:01')
  })

  it('a ride dropped between untimed stops its time allows stays where it was dropped', () => {
    const { seated, drawn } = drop(setup(), isRide(103), isStop('Isartor'))
    expect(drawn).toEqual(seated)
    expect(drawn.slice(-4)).toEqual(['Ayuntamiento', 'Isartor', 'ride 16:55', 'Juliet'])
  })

  it('leaves the untimed stops behind a ride where they are, as before', () => {
    const day: Day = {
      stops: [stop(1, 'Hotel'), stop(2, 'Museum'), stop(3, 'Dinner')].map((a, i) => ({ ...a, order_index: i })),
      rides: [ride(101, '09:00', 0.5)],
      notes: [],
    }
    expect(draw(day).map(label)).toEqual(['Hotel', 'ride 09:00', 'Museum', 'Dinner'])
    const { seated, drawn } = drop(day, isRide(101), isStop('Museum'))
    expect(drawn).toEqual(seated)
    expect(drawn).toEqual(['Hotel', 'Museum', 'ride 09:00', 'Dinner'])
  })

  it('seats a timed note the same way and leaves an untimed one where it was dropped', () => {
    const day = setup()
    day.notes = [note(201, '12:30', 1.6), note(202, null, 6.5)]
    const isNote = (id: number) => (it: MergedItem) => it.type === 'note' && it.data.id === id
    const timed = drop(day, isNote(201), isStop('Isartor'))
    expect(timed.drawn).toEqual(timed.seated)
    expect(timed.drawn.indexOf('note 201')).toBe(timed.drawn.indexOf('Asamkirche') - 1)
    const untimed = drop(day, isNote(202), isStop('Palacio'))
    expect(untimed.drawn).toEqual(untimed.seated)
    expect(untimed.drawn.indexOf('note 202')).toBe(untimed.drawn.indexOf('Palacio') + 1)
  })

  it('returns a dropped stop as it came', () => {
    const order = draw(setup())
    expect(seatTimedDrop(order, 1, DAY)).toEqual(order)
  })
})

