import { describe, expect, it } from 'vitest'
import { filesForPlace } from '../../../src/utils/placeFiles'
import type { Reservation, TripFile } from '../../../src/types'

// FE-UTIL-PLACEFILES-001 to FE-UTIL-PLACEFILES-006

const file = (over: Partial<TripFile>): TripFile => ({
  id: 1, trip_id: 5, original_name: 'a.pdf', url: '/uploads/a.pdf',
  place_id: null, reservation_id: null, deleted_at: null,
  ...over,
} as unknown as TripFile)

const booking = (over: Partial<Reservation>): Reservation => ({
  id: 90, trip_id: 5, title: 'Table', type: 'restaurant',
  place_id: null, assignment_id: null,
  ...over,
} as unknown as Reservation)

describe('filesForPlace', () => {
  it('FE-UTIL-PLACEFILES-001: keeps the files the place owns, by column and by link', () => {
    const own = file({ id: 1, place_id: 7 })
    const linked = file({ id: 2, linked_place_ids: [7] })
    const other = file({ id: 3, place_id: 8 })
    expect(filesForPlace([own, linked, other], 7, []).map(f => f.id)).toEqual([1, 2])
  })

  it('FE-UTIL-PLACEFILES-002: adds the files of a booking that sits on the place (#2217)', () => {
    const files = [file({ id: 4, reservation_id: 90 })]
    const bookings = [booking({ id: 90, place_id: 7 })]
    expect(filesForPlace(files, 7, bookings).map(f => f.id)).toEqual([4])
  })

  it('FE-UTIL-PLACEFILES-003: reaches a booking through the stop it hangs on, not only through place_id', () => {
    const files = [file({ id: 5, reservation_id: 90 })]
    const bookings = [booking({ id: 90, assignment_id: 11 })]
    expect(filesForPlace(files, 7, bookings, [11]).map(f => f.id)).toEqual([5])
    // Without that stop in the day, the booking is not this place's business.
    expect(filesForPlace(files, 7, bookings, [12])).toEqual([])
  })

  it('FE-UTIL-PLACEFILES-004: a file linked to the booking counts like one stored on it', () => {
    const files = [file({ id: 6, linked_reservation_ids: [90] })]
    expect(filesForPlace(files, 7, [booking({ id: 90, place_id: 7 })]).map(f => f.id)).toEqual([6])
  })

  it('FE-UTIL-PLACEFILES-005: lists a file once when it is both the place\'s and the booking\'s', () => {
    const both = file({ id: 7, place_id: 7, reservation_id: 90 })
    expect(filesForPlace([both], 7, [booking({ id: 90, place_id: 7 })]).map(f => f.id)).toEqual([7])
  })

  it('FE-UTIL-PLACEFILES-006: drops deleted files and answers empty without a place', () => {
    const gone = file({ id: 8, place_id: 7, deleted_at: '2026-09-01' })
    const bookingFileGone = file({ id: 9, reservation_id: 90, deleted_at: '2026-09-01' })
    expect(filesForPlace([gone, bookingFileGone], 7, [booking({ id: 90, place_id: 7 })])).toEqual([])
    expect(filesForPlace([file({ id: 10, place_id: 7 })], undefined, [])).toEqual([])
  })
})
