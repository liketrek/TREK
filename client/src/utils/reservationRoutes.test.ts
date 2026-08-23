import { describe, it, expect } from 'vitest'
import { isRoutableReservation, visibleRouteReservations } from './reservationRoutes'
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
