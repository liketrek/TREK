import { describe, it, expect } from 'vitest'
import { hopIsVisible, isRoutableReservation, labelFloorPx, lineFloorPx, runsOnDay, visibleRouteReservations } from './reservationRoutes'
import type { Day, Reservation, ReservationEndpoint } from '../types'

function endpoint(role: 'from' | 'to', lat: number, lng: number): ReservationEndpoint {
  return { role, sequence: role === 'from' ? 0 : 1, name: role, code: null, lat, lng, timezone: null, local_time: null, local_date: null }
}

function reservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: 1, trip_id: 1, title: 'Flight', type: 'flight', status: 'confirmed',
    reservation_time: null, reservation_end_time: null, location: null,
    confirmation_number: null, notes: null, url: null,
    ...overrides,
  } as Reservation
}

describe('isRoutableReservation', () => {
  it('is false with no endpoints', () => {
    expect(isRoutableReservation(reservation())).toBe(false)
  })

  it('is false with a single endpoint', () => {
    expect(isRoutableReservation(reservation({ endpoints: [endpoint('from', 1, 2)] }))).toBe(false)
  })

  it('is true with 2+ endpoints', () => {
    expect(isRoutableReservation(reservation({ endpoints: [endpoint('from', 1, 2), endpoint('to', 3, 4)] }))).toBe(true)
  })
})

describe('visibleRouteReservations', () => {
  const twoStop = [endpoint('from', 1, 2), endpoint('to', 3, 4)]

  it('includes a transit reservation only when showTransitRoutes is on', () => {
    const r = reservation({ id: 1, type: 'transit', endpoints: twoStop })
    expect(visibleRouteReservations([r], { visibleConnectionIds: [], showTransitRoutes: false })).toEqual([])
    expect(visibleRouteReservations([r], { visibleConnectionIds: [], showTransitRoutes: true })).toEqual([r])
  })

  it('includes a reservation whose id is in visibleConnectionIds regardless of type', () => {
    const r = reservation({ id: 5, type: 'flight', endpoints: twoStop })
    expect(visibleRouteReservations([r], { visibleConnectionIds: [5], showTransitRoutes: false })).toEqual([r])
  })

  it('excludes a routable reservation when neither rule applies', () => {
    const r = reservation({ id: 7, type: 'flight', endpoints: twoStop })
    expect(visibleRouteReservations([r], { visibleConnectionIds: [], showTransitRoutes: false })).toEqual([])
  })

  it('does not duplicate a reservation matched by both rules', () => {
    const r = reservation({ id: 10, type: 'transit', endpoints: twoStop })
    const result = visibleRouteReservations([r], { visibleConnectionIds: [10], showTransitRoutes: true })
    expect(result).toEqual([r])
  })
})

describe('visibleRouteReservations with a selected day', () => {
  const twoStop = [endpoint('from', 1, 2), endpoint('to', 3, 4)]
  const days = [
    { id: 10, trip_id: 1, day_number: 1 },
    { id: 11, trip_id: 1, day_number: 2 },
    { id: 20, trip_id: 1, day_number: 3 },
  ] as Day[]

  function transit(overrides: Partial<Reservation>): Reservation {
    return reservation({ type: 'transit', endpoints: twoStop, ...overrides })
  }

  it('excludes a transit journey that runs on another day', () => {
    const r = transit({ id: 1, day_id: 20, end_day_id: 20 })
    expect(visibleRouteReservations([r], { visibleConnectionIds: [], showTransitRoutes: true, selectedDayId: 10, days })).toEqual([])
  })

  it('includes a transit journey that runs on the selected day', () => {
    const r = transit({ id: 1, day_id: 10, end_day_id: 10 })
    expect(visibleRouteReservations([r], { visibleConnectionIds: [], showTransitRoutes: true, selectedDayId: 10, days })).toEqual([r])
  })

  it('keeps an overnight journey on both its departure and its arrival day', () => {
    const r = transit({ id: 1, day_id: 10, end_day_id: 11 })
    expect(visibleRouteReservations([r], { visibleConnectionIds: [], showTransitRoutes: true, selectedDayId: 10, days })).toEqual([r])
    expect(visibleRouteReservations([r], { visibleConnectionIds: [], showTransitRoutes: true, selectedDayId: 11, days })).toEqual([r])
  })

  it('keeps a multi-day journey on the days in between', () => {
    const r = transit({ id: 1, day_id: 10, end_day_id: 20 })
    expect(visibleRouteReservations([r], { visibleConnectionIds: [], showTransitRoutes: true, selectedDayId: 11, days })).toEqual([r])
  })

  it('goes by day order, not by day id', () => {
    // Days dragged into a new order: id 20 is now the first day, id 10 the last.
    const reordered = [
      { id: 20, trip_id: 1, day_number: 1 },
      { id: 11, trip_id: 1, day_number: 2 },
      { id: 10, trip_id: 1, day_number: 3 },
    ] as Day[]
    const r = transit({ id: 1, day_id: 20, end_day_id: 11 })
    expect(visibleRouteReservations([r], { visibleConnectionIds: [], showTransitRoutes: true, selectedDayId: 11, days: reordered })).toEqual([r])
    expect(visibleRouteReservations([r], { visibleConnectionIds: [], showTransitRoutes: true, selectedDayId: 10, days: reordered })).toEqual([])
  })

  it('keeps a transit journey that is bound to no day', () => {
    const r = transit({ id: 1, day_id: null, end_day_id: null })
    expect(visibleRouteReservations([r], { visibleConnectionIds: [], showTransitRoutes: true, selectedDayId: 10, days })).toEqual([r])
  })

  it('leaves the per-item route toggle day-agnostic', () => {
    const r = reservation({ id: 5, type: 'train', endpoints: twoStop, day_id: 20, end_day_id: 20 })
    expect(visibleRouteReservations([r], { visibleConnectionIds: [5], showTransitRoutes: false, selectedDayId: 10, days })).toEqual([r])
  })

  it('does not scope transit without a selected day', () => {
    const r = transit({ id: 1, day_id: 20, end_day_id: 20 })
    expect(visibleRouteReservations([r], { visibleConnectionIds: [], showTransitRoutes: true, days })).toEqual([r])
    expect(visibleRouteReservations([r], { visibleConnectionIds: [], showTransitRoutes: true, selectedDayId: null, days })).toEqual([r])
  })
})

// The phone's plan map shows one day, so it asks for the per-item toggle to follow the
// selected day the way the transit toggle does. The span rule is the transit one.
describe('visibleRouteReservations with the per-item toggle scoped to the day', () => {
  const twoStop = [endpoint('from', 1, 2), endpoint('to', 3, 4)]
  const days = [
    { id: 10, trip_id: 1, day_number: 1 },
    { id: 11, trip_id: 1, day_number: 2 },
    { id: 20, trip_id: 1, day_number: 3 },
  ] as Day[]

  function booking(overrides: Partial<Reservation>): Reservation {
    return reservation({ id: 5, type: 'flight', endpoints: twoStop, ...overrides })
  }

  const drawn = (r: Reservation, selectedDayId: number | null | undefined, onDays: Day[] = days) =>
    visibleRouteReservations([r], {
      visibleConnectionIds: [r.id], showTransitRoutes: false, selectedDayId, days: onDays, scopeConnectionsToDay: true,
    })

  it('leaves out a booking switched on for another day', () => {
    expect(drawn(booking({ day_id: 20, end_day_id: 20 }), 10)).toEqual([])
  })

  it('draws a booking on the day it runs on', () => {
    const r = booking({ day_id: 10, end_day_id: 10 })
    expect(drawn(r, 10)).toEqual([r])
  })

  it('keeps an overnight booking on both of its days and off the rest', () => {
    const r = booking({ day_id: 10, end_day_id: 11 })
    expect(drawn(r, 10)).toEqual([r])
    expect(drawn(r, 11)).toEqual([r])
    expect(drawn(r, 20)).toEqual([])
  })

  it('keeps a multi-day booking on the days in between', () => {
    const r = booking({ day_id: 10, end_day_id: 20 })
    expect(drawn(r, 11)).toEqual([r])
  })

  it('goes by day order, not by day id', () => {
    const reordered = [
      { id: 20, trip_id: 1, day_number: 1 },
      { id: 11, trip_id: 1, day_number: 2 },
      { id: 10, trip_id: 1, day_number: 3 },
    ] as Day[]
    const r = booking({ day_id: 20, end_day_id: 11 })
    expect(drawn(r, 11, reordered)).toEqual([r])
    expect(drawn(r, 10, reordered)).toEqual([])
  })

  it('keeps a booking that is bound to no day', () => {
    const r = booking({ day_id: null, end_day_id: null })
    expect(drawn(r, 10)).toEqual([r])
  })

  it('keeps every switched-on booking while no day is selected', () => {
    const r = booking({ day_id: 20, end_day_id: 20 })
    expect(drawn(r, undefined)).toEqual([r])
    expect(drawn(r, null)).toEqual([r])
  })

  it('still draws nothing that was not switched on', () => {
    const r = booking({ day_id: 10, end_day_id: 10 })
    expect(visibleRouteReservations([r], {
      visibleConnectionIds: [], showTransitRoutes: false, selectedDayId: 10, days, scopeConnectionsToDay: true,
    })).toEqual([])
  })
})

describe('runsOnDay', () => {
  const days = [
    { id: 10, trip_id: 1, day_number: 1 },
    { id: 11, trip_id: 1, day_number: 2 },
  ] as Day[]

  it('reads a booking with only an arrival day as running on that day', () => {
    expect(runsOnDay({ day_id: null, end_day_id: 11 }, 11, days)).toBe(true)
    expect(runsOnDay({ day_id: null, end_day_id: 11 }, 10, days)).toBe(false)
  })

  it('does not rule a booking out for a selected day it cannot find', () => {
    expect(runsOnDay({ day_id: 10, end_day_id: 10 }, 99, days)).toBe(true)
  })
})

describe('hopIsVisible (#2275)', () => {
  // A flat projection: one unit of lat or lng is one pixel.
  const px = (p: readonly [number, number]) => ({ x: p[1], y: p[0] })

  it('keeps the type floors of the old endpoint check', () => {
    expect(lineFloorPx('car')).toBe(80)
    expect(lineFloorPx('flight')).toBe(50)
    expect(lineFloorPx('cruise')).toBe(150)
    expect(lineFloorPx('train')).toBe(200)
    expect(labelFloorPx('car')).toBe(150)
    expect(labelFloorPx('transit')).toBe(900)
    expect(labelFloorPx('bus')).toBe(400)
  })

  it('measures a straight two-point line exactly as the endpoint gap', () => {
    expect(hopIsVisible('car', [[[0, 0], [0, 79]]], px)).toBe(false)
    expect(hopIsVisible('car', [[[0, 0], [0, 80]]], px)).toBe(true)
  })

  it('walks a routed line, so a loop between close ends counts its full length', () => {
    const loop: [number, number][] = [[0, 0], [30, 0], [30, 30], [0, 30], [0, 5]]
    expect(hopIsVisible('car', [loop], px)).toBe(true)
    expect(hopIsVisible('train', [loop], px)).toBe(false)
  })

  it('adds the legs of a multi-stop booking together', () => {
    const legs: [number, number][][] = [[[0, 0], [0, 50]], [[0, 50], [0, 100]]]
    expect(hopIsVisible('car', legs, px)).toBe(false)
    expect(hopIsVisible('car', [[[0, 0], [0, 50], [0, 100]]], px)).toBe(true)
  })

  it('draws nothing for an empty or one-point line', () => {
    expect(hopIsVisible('car', [], px)).toBe(false)
    expect(hopIsVisible('car', [[]], px)).toBe(false)
    expect(hopIsVisible('car', [[[0, 0]]], px)).toBe(false)
  })
})
