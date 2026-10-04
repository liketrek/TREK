import { describe, expect, it } from 'vitest'
import { BedDouble } from 'lucide-react'
import { BOOKEND_DISC, BOOKEND_ICON, bookendBadge, bookendBooking, leavesAfterCheckOut, staysAtTheirPlaces } from './nightBookend'
import type { BookendReading } from './roadtripRowModel'
import { serviceColor } from './roadtripModel'

// FE-BOOKEND-001 to FE-BOOKEND-010

const reading = (over: Partial<BookendReading> = {}): BookendReading => ({
  phase: 'morning',
  variant: 'from',
  name: 'Hotel Alpenblick',
  until: null,
  from: null,
  reservationId: 41,
  accommodationId: 5,
  placeId: 900,
  ...over,
})

/** A translator that shows the key and what went into it, so a test reads which sentence was asked for. */
const t = (key: string, params?: Record<string, string | number | null>) =>
  params ? `${key}(${Object.entries(params).map(([k, v]) => `${k}=${v}`).join(',')})` : key

describe('a booked night as the rail and the phone say it', () => {
  it('FE-BOOKEND-001: the badge names the edge of the stay the day stands at, the row names the hotel', () => {
    expect(bookendBadge(reading({ variant: 'checkOut' }), undefined, t, false).lead).toBe('roadtrip.bookend.checkOut')
    expect(bookendBadge(reading({ variant: 'from' }), undefined, t, false).lead).toBe('roadtrip.bookend.from')
    expect(bookendBadge(reading({ phase: 'evening', variant: 'back' }), undefined, t, false).lead).toBe('roadtrip.bookend.back')
    expect(bookendBadge(reading({ phase: 'evening', variant: 'checkIn' }), undefined, t, false).lead).toBe('roadtrip.bookend.checkIn')
  })

  it('FE-BOOKEND-002: the check-out hour is the figure of the badge, in the clock of the reader', () => {
    expect(bookendBadge(reading({ variant: 'checkOut', until: '10:00' }), undefined, t, false))
      .toEqual({ lead: 'roadtrip.bookend.checkOut', value: '10:00', warning: false, hint: 'roadtrip.stay.until(time=10:00)' })
    expect(bookendBadge(reading({ variant: 'checkOut', until: '14:30' }), undefined, t, true).value).toBe('2:30 PM')
  })

  it('FE-BOOKEND-003: a morning that hands no room back, or an evening back at the stay, is the word alone', () => {
    expect(bookendBadge(reading(), undefined, t, false)).toEqual({ lead: 'roadtrip.bookend.from', value: null, warning: false, hint: null })
    expect(bookendBadge(reading({ phase: 'evening', variant: 'back' }), undefined, t, false).value).toBeNull()
  })

  it('FE-BOOKEND-010: a check-in evening carries the hour the room is ready, and leaving late turns the check-out badge', () => {
    expect(bookendBadge(reading({ phase: 'evening', variant: 'checkIn', from: '15:00' }), undefined, t, false))
      .toEqual({ lead: 'roadtrip.bookend.checkIn', value: '15:00', warning: false, hint: null })
    expect(bookendBadge(reading({ variant: 'checkOut', until: '10:00' }), { arrival: '12:27', dayOffset: 0 }, t, false))
      .toEqual({ lead: 'roadtrip.bookend.checkOut', value: '10:00', warning: true, hint: 'roadtrip.bookend.afterCheckOut' })
  })

  it('FE-BOOKEND-007: a day that sets out after the room is handed back says so', () => {
    const checkOut = reading({ variant: 'checkOut', until: '10:00' })
    expect(leavesAfterCheckOut(checkOut, { arrival: '12:27', dayOffset: 0 })).toBe(true)
    expect(leavesAfterCheckOut(checkOut, { arrival: '10:01', dayOffset: 0 })).toBe(true)
    expect(leavesAfterCheckOut(checkOut, { arrival: '10:00', dayOffset: 0 })).toBe(false)
    expect(leavesAfterCheckOut(checkOut, { arrival: '08:30', dayOffset: 0 })).toBe(false)
    // Past midnight it is later than any hour of the morning before.
    expect(leavesAfterCheckOut(checkOut, { arrival: '01:00', dayOffset: 1 })).toBe(true)
  })

  it('FE-BOOKEND-008: nothing to say without a check-out hour or a clock to hold it against', () => {
    expect(leavesAfterCheckOut(reading(), { arrival: '12:27', dayOffset: 0 })).toBe(false)
    expect(leavesAfterCheckOut(reading({ variant: 'checkOut', until: '10:00' }), { arrival: null, dayOffset: 0 })).toBe(false)
    expect(leavesAfterCheckOut(reading({ variant: 'checkOut', until: '10:00' }), undefined)).toBe(false)
  })

  it('FE-BOOKEND-004: a tap opens the booking behind the night for somebody who may edit bookings', () => {
    expect(bookendBooking(reading(), true)).toBe(41)
    // The editor is the only view a hotel booking has, so anybody else gets the place.
    expect(bookendBooking(reading(), false)).toBeNull()
    // A stay entered without a booking has none to open.
    expect(bookendBooking(reading({ reservationId: null }), true)).toBeNull()
  })

  it('FE-BOOKEND-005: the hotel wears the bed the stay chips wear', () => {
    expect(BOOKEND_ICON).toBe(BedDouble)
  })

  it('FE-BOOKEND-009: on the disc the hotel stop wears, in its signage colour with the bed in white', () => {
    expect(BOOKEND_DISC.background).toBe(serviceColor('hotel'))
    expect(BOOKEND_DISC.color).toBe('#fff')
  })
})

describe('the hotel a booked night stands for', () => {
  it('FE-BOOKEND-006: is read off the trip place as it is now, and the stay row stands in only where there is none', () => {
    const moved = { id: 1, place_id: 10, place_name: 'Old name', place_lat: 47.2, place_lng: 11.4 }
    const unknown = { id: 2, place_id: 20, place_name: 'Elsewhere', place_lat: 48.1, place_lng: 11.6 }
    const placeless = { id: 3, place_id: null, place_name: null, place_lat: null, place_lng: null }
    const places = [
      { id: 10, name: 'Hotel Alpenblick', lat: 47.3, lng: 11.5 },
      { id: 30, name: 'Unrelated', lat: 1, lng: 2 },
    ]

    const read = staysAtTheirPlaces([moved, unknown, placeless], places)
    expect(read[0]).toEqual({ id: 1, place_id: 10, place_name: 'Hotel Alpenblick', place_lat: 47.3, place_lng: 11.5 })
    expect(read[1]).toBe(unknown)
    expect(read[2]).toBe(placeless)

    // A place that lost its pin takes the bookend with it, as the server's join does.
    expect(staysAtTheirPlaces([moved], [{ id: 10, name: 'Hotel Alpenblick', lat: null, lng: null }])[0])
      .toMatchObject({ place_lat: null, place_lng: null })

    // Nothing to change hands the list back as it came, so nothing downstream recomputes.
    const current = [{ ...moved, place_name: 'Hotel Alpenblick', place_lat: 47.3, place_lng: 11.5 }]
    expect(staysAtTheirPlaces(current, places)).toBe(current)
    expect(staysAtTheirPlaces(current, [])).toBe(current)
  })
})
