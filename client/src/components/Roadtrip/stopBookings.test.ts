import { describe, expect, it } from 'vitest'
import { Car, Ticket, Utensils } from 'lucide-react'
import { bookingClock, bookingIcon, dayBookings } from './stopBookings'
import type { Reservation } from '../../types'

const booking = (over: Partial<Reservation>): Reservation =>
  ({ id: 1, trip_id: 1, title: 'Booking', type: 'restaurant', status: 'confirmed', day_id: 1, ...over }) as Reservation

const day = {
  dayId: 1,
  stops: [
    { assignmentId: -3000000140, placeId: -70, carrier: { reservationId: 70, type: 'flight', role: 'arrival' as const, title: 'LH', code: null, at: null } },
    { assignmentId: 11, placeId: 110 },
    { assignmentId: -2000000001, placeId: 110, automaticNight: { phase: 'end' as const, fromDayNumber: 1 } as never },
    { assignmentId: 12, placeId: 120 },
  ],
}

describe('dayBookings (#2428)', () => {
  it('FE-STOPBOOKINGS-001: a booking hangs under the stop it is pinned to, or under the stop at its place on its day, in clock order', () => {
    const { atStop, loose } = dayBookings(day, [
      booking({ id: 3, title: 'Late', reservation_time: '2026-10-05T20:00', assignment_id: 11 }),
      booking({ id: 2, title: 'Early', reservation_time: '2026-10-05T11:00', place_id: 110 }),
      booking({ id: 4, title: 'Untimed', place_id: 110 }),
      booking({ id: 5, title: 'Ticket', type: 'event', place_id: 120 }),
    ])
    expect([...atStop.keys()]).toEqual([1, 3])
    expect(atStop.get(1)!.map(r => r.title)).toEqual(['Early', 'Late', 'Untimed'])
    expect(atStop.get(3)!.map(r => r.title)).toEqual(['Ticket'])
    expect(loose).toEqual([])
  })

  it('FE-STOPBOOKINGS-002: a terminal and an automatic night hold nothing, even at the same place; a pinned booking needs no day', () => {
    // The night marker shares the hotel's place id; the booking still lands on the stop.
    const { atStop } = dayBookings(day, [booking({ id: 6, place_id: 110, day_id: 1 })])
    expect([...atStop.keys()]).toEqual([1])
    // Pinned to the assignment: on the stop whatever day the row names.
    const pinned = dayBookings(day, [booking({ id: 7, assignment_id: 12, day_id: 9 })])
    expect([...pinned.atStop.keys()]).toEqual([3])
    // A booking at the flight's negative place id is nobody's.
    expect(dayBookings(day, [booking({ id: 8, place_id: -70 })]).loose).toHaveLength(1)
  })

  it('FE-STOPBOOKINGS-003: the night, the hire car and the ride are drawn elsewhere; another day\'s booking is not this day\'s; a span ends on this day', () => {
    const { atStop, loose } = dayBookings(day, [
      booking({ id: 1, type: 'hotel', place_id: 110 }),
      booking({ id: 2, type: 'car', place_id: 110 }),
      booking({ id: 3, type: 'flight', place_id: 110 }),
      booking({ id: 4, type: 'train', place_id: 110 }),
      booking({ id: 5, title: 'Tomorrow', day_id: 2, place_id: 110 }),
      booking({ id: 6, title: 'Tour ends here', type: 'tour', day_id: 0, end_day_id: 1 }),
    ])
    expect(atStop.size).toBe(0)
    expect(loose.map(r => r.title)).toEqual(['Tour ends here'])
    expect(dayBookings(day, [])).toEqual({ atStop: new Map(), loose: [] })
  })

  it('FE-STOPBOOKINGS-005: a booking spanning several days is on the days between as well, unless its type hides there', () => {
    // Day ids out of order on purpose: the span is read by the days' position, not by id.
    const order = (dayId: number) => ({ 5: 0, 1: 1, 3: 2 } as Record<number, number>)[dayId] ?? null
    const tour = booking({ id: 1, title: 'Three-day tour', type: 'tour', day_id: 5, end_day_id: 3 })
    const parked = booking({ id: 2, title: 'Parked', type: 'parking', day_id: 5, end_day_id: 3 })
    const dinner = booking({ id: 3, title: 'Dinner', day_id: 5, end_day_id: 3, place_id: 110 })
    const { atStop, loose } = dayBookings(day, [tour, parked, dinner], order)
    expect(loose.map(r => r.title)).toEqual(['Three-day tour'])
    // On the day between, a booking for a place the day drives to still hangs under it.
    expect(atStop.get(1)!.map(r => r.title)).toEqual(['Dinner'])
    // Its first and last day list the parked car as before.
    expect(dayBookings({ ...day, dayId: 3 }, [parked], order).loose).toHaveLength(1)
    // Without a day order, or for a day the order does not know, only the two ends count.
    expect(dayBookings(day, [tour])).toEqual({ atStop: new Map(), loose: [] })
    expect(dayBookings({ ...day, dayId: 9 }, [tour], order)).toEqual({ atStop: new Map(), loose: [] })
  })

  it('FE-STOPBOOKINGS-004: the chip wears the booking panel\'s icon and the clock the booking starts at', () => {
    expect(bookingIcon('restaurant')).toBe(Utensils)
    expect(bookingIcon('car')).toBe(Car)
    expect(bookingIcon('nonsense')).toBe(Ticket)
    expect(bookingClock({ reservation_time: '2026-10-05T19:30' })).toBe('19:30')
    expect(bookingClock({ reservation_time: null })).toBeNull()
  })
})

describe('dayBookings and a booked night at the edge of the day', () => {
  it('FE-STOPBOOKINGS-006: a table at the hotel hangs under the hotel stop, never under the bookend in front of it', () => {
    const bookend = (phase: 'morning' | 'evening', assignmentId: number) => ({
      assignmentId,
      placeId: 900,
      bookend: { phase, accommodationId: 5, reservationId: null, checkingOut: false, checkingIn: false, checkOut: null },
    })
    const withHotel = {
      dayId: 1,
      stops: [bookend('morning', -6_000_000_002), { assignmentId: 11, placeId: 110 }, { assignmentId: 13, placeId: 900 }],
    }
    const dinner = booking({ id: 9, title: 'Dinner at the hotel', place_id: 900 })
    expect([...dayBookings(withHotel, [dinner]).atStop.keys()]).toEqual([2])
    // With the hotel only there as the evening's bookend, the table is the day's, for no stop.
    const backOnly = { dayId: 1, stops: [{ assignmentId: 11, placeId: 110 }, bookend('evening', -6_000_000_003)] }
    const { atStop, loose } = dayBookings(backOnly, [dinner])
    expect(atStop.size).toBe(0)
    expect(loose.map(r => r.title)).toEqual(['Dinner at the hotel'])
  })
})
