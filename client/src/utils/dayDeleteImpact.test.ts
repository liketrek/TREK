// FE-UTIL-DAYDEL-001 to FE-UTIL-DAYDEL-016
import { describe, it, expect } from 'vitest'
import { buildAssignment, buildBudgetItem, buildDay, buildDayNote, buildPlace, buildReservation } from '../../tests/helpers/factories'
import { contentOnDays, dayDeleteImpact, deleteDayBlockedReason, type DayContentData } from './dayDeleteImpact'
import { formatMoney } from './formatters'
import type { Accommodation, Day } from '../types'

const stay = (overrides: Partial<Accommodation>): Accommodation =>
  ({ id: 1, trip_id: 1, place_id: null, start_day_id: 0, end_day_id: 0, ...overrides }) as Accommodation

const empty = (): DayContentData => ({ assignments: {}, dayNotes: {}, reservations: [], accommodations: [] })

/** Three dated days, 1 to 3 June, and optionally a spare day without a date at the end. */
function datedDays(spare = false): Day[] {
  const days = [
    buildDay({ id: 1, day_number: 1, date: '2026-06-01' }),
    buildDay({ id: 2, day_number: 2, date: '2026-06-02' }),
    buildDay({ id: 3, day_number: 3, date: '2026-06-03' }),
  ]
  return spare ? [...days, buildDay({ id: 4, day_number: 4, date: null })] : days
}

const range = { start_date: '2026-06-01', end_date: '2026-06-03' }

describe('contentOnDays', () => {
  it('FE-UTIL-DAYDEL-001: an empty day holds nothing', () => {
    const day = buildDay({ id: 7 })
    expect(contentOnDays([day], empty())).toEqual({ places: 0, notes: 0, texts: 0, bookings: 0, stays: [] })
  })

  it('FE-UTIL-DAYDEL-002: places count once each, and the stop a stay wrote is the stay, not a place', () => {
    const museum = buildPlace({ id: 50 })
    const cafe = buildPlace({ id: 51 })
    const hotel = buildPlace({ id: 52 })
    const data = {
      ...empty(),
      assignments: {
        '7': [
          buildAssignment({ day_id: 7, place: museum }),
          buildAssignment({ day_id: 7, place: museum }),
          buildAssignment({ day_id: 7, place: cafe }),
          buildAssignment({ day_id: 7, place: hotel, accommodation_id: 9 }),
        ],
        '8': [buildAssignment({ day_id: 8, place: buildPlace({ id: 53 }) })],
      },
    }
    expect(contentOnDays([buildDay({ id: 7 })], data).places).toBe(2)
  })

  it('FE-UTIL-DAYDEL-003: notes count one by one, a day title and a day description one each', () => {
    const data = { ...empty(), dayNotes: { '7': [buildDayNote({ day_id: 7 }), buildDayNote({ day_id: 7 })] } }
    expect(contentOnDays([buildDay({ id: 7, title: 'Harbour day', notes: 'Ferry at nine' })], data)).toMatchObject({ notes: 2, texts: 2 })
    expect(contentOnDays([buildDay({ id: 7, title: 'Harbour day', notes: null })], empty()).texts).toBe(1)
  })

  it('FE-UTIL-DAYDEL-004: bookings starting or ending on the day count, a cancelled stay\'s own booking does not', () => {
    const data = {
      ...empty(),
      accommodations: [stay({ id: 9, start_day_id: 7, end_day_id: 8 })],
      reservations: [
        buildReservation({ id: 1, day_id: 7 }),
        buildReservation({ id: 2, day_id: 6, end_day_id: 7 }),
        buildReservation({ id: 3, day_id: 8 }),
        buildReservation({ id: 4, day_id: 7, type: 'hotel', accommodation_id: '9' }),
      ],
    }
    expect(contentOnDays([buildDay({ id: 7 })], data).bookings).toBe(2)
  })

  it('FE-UTIL-DAYDEL-005: a stay checking in or out on the day goes, named by its place, with its booking', () => {
    const data: DayContentData = {
      ...empty(),
      places: [buildPlace({ id: 60, name: 'Pension Alma' })],
      accommodations: [
        stay({ id: 1, start_day_id: 7, end_day_id: 8, place_name: 'Harbour Hotel' }),
        stay({ id: 2, start_day_id: 5, end_day_id: 7, place_id: 60, reservation_title: 'Alma, two nights' }),
        stay({ id: 3, start_day_id: 5, end_day_id: 7 }),
        stay({ id: 4, start_day_id: 6, end_day_id: 8 }),
      ],
      reservations: [buildReservation({ id: 30, title: 'Harbour Hotel, 1 night', accommodation_id: 1 })],
    }
    expect(contentOnDays([buildDay({ id: 7 })], data).stays).toEqual([
      // Expenses not read: a linked booking may carry one, so the warning says it may.
      { id: 1, name: 'Harbour Hotel', booking: 'Harbour Hotel, 1 night', moreBookings: 0, expense: { amount: null } },
      { id: 2, name: 'Pension Alma', booking: 'Alma, two nights', moreBookings: 0, expense: null },
      { id: 3, name: '', booking: null, moreBookings: 0, expense: null },
    ])
  })
})

describe('dayDeleteImpact', () => {
  it('FE-UTIL-DAYDEL-006: with a spare day left, the later dated days move one date and their bookings go along', () => {
    const days = datedDays(true)
    const data = {
      ...empty(),
      reservations: [
        buildReservation({ id: 1, day_id: 3, reservation_time: '2026-06-03T10:00' }),
        buildReservation({ id: 2, day_id: 1, end_day_id: 3, reservation_end_time: '2026-06-03T09:00' }),
        buildReservation({ id: 3, day_id: 3, reservation_time: null }),
        buildReservation({ id: 4, day_id: 1, reservation_time: '2026-06-01T08:00' }),
      ],
    }
    expect(dayDeleteImpact(days[1], days, data, range)).toMatchObject({ shiftedDays: 1, shiftedBookings: 2, newEndDate: null, isLastDay: false })
  })

  it('FE-UTIL-DAYDEL-013: the first day without a date takes over the last date, and the question names it', () => {
    const days = datedDays(true)
    // A middle day goes: day 3 moves up to 2 June, the spare day takes 3 June.
    expect(dayDeleteImpact(days[1], days, empty(), range)).toMatchObject({
      shiftedDays: 1,
      datedSpare: { day: expect.objectContaining({ id: 4 }), index: 3, date: '2026-06-03' },
      newEndDate: null,
    })
    // The last dated day goes: nothing dated moves, the spare day still takes its date.
    expect(dayDeleteImpact(days[2], days, empty(), range)).toMatchObject({ shiftedDays: 0, datedSpare: { index: 3, date: '2026-06-03' } })
    // The spare day itself goes, or there is none: no day gets a date.
    expect(dayDeleteImpact(days[3], days, empty(), range).datedSpare).toBeNull()
    expect(dayDeleteImpact(datedDays()[1], datedDays(), empty(), range).datedSpare).toBeNull()
    // Only the first of two spare days is dated.
    const two = [...days, buildDay({ id: 5, day_number: 5, date: null })]
    expect(dayDeleteImpact(two[0], two, empty(), range).datedSpare).toMatchObject({ day: { id: 4 }, date: '2026-06-03' })
  })

  it('FE-UTIL-DAYDEL-014: a stay that only runs across the day keeps standing, one night shorter', () => {
    const days = datedDays(true)
    const data: DayContentData = {
      ...empty(),
      accommodations: [
        stay({ id: 9, start_day_id: 1, end_day_id: 3, place_name: 'Harbour Hotel' }),
        stay({ id: 10, start_day_id: 2, end_day_id: 3, place_name: 'Pension Alma' }),
        stay({ id: 11, start_day_id: 1, end_day_id: 2, place_name: 'Dune Lodge' }),
      ],
    }
    const impact = dayDeleteImpact(days[1], days, data, range)
    // Its check-out day moves up to the deleted day's slot, and takes 2 June.
    expect(impact.shortenedStays).toEqual([{ id: 9, name: 'Harbour Hotel', checkOut: '2026-06-02' }])
    // The stays checking in or out on the day are cancelled instead.
    expect(impact.stays.map(s => s.id)).toEqual([10, 11])

    // On a trip without dates the stay still ends a day earlier, without a date to name.
    const undated = [1, 2, 3].map(n => buildDay({ id: n, day_number: n, date: null }))
    expect(dayDeleteImpact(undated[1], undated, data, null).shortenedStays).toEqual([{ id: 9, name: 'Harbour Hotel', checkOut: null }])
    // A day outside the stay leaves it alone.
    expect(dayDeleteImpact(days[3], days, data, range).shortenedStays).toEqual([])
  })

  it('FE-UTIL-DAYDEL-007: with no spare day the last date goes, and a dated trip ends on the one before', () => {
    const days = datedDays()
    expect(dayDeleteImpact(days[0], days, empty(), range)).toMatchObject({ shiftedDays: 2, newEndDate: '2026-06-02' })
    // A trip without a range keeps it; only its days move.
    expect(dayDeleteImpact(days[0], days, empty(), { start_date: null, end_date: null }).newEndDate).toBeNull()
    // The last day of the list moves nothing.
    expect(dayDeleteImpact(days[2], days, empty(), range)).toMatchObject({ shiftedDays: 0, newEndDate: '2026-06-02' })
  })

  it('FE-UTIL-DAYDEL-008: a spare day moves no date, and the only day of a trip is the last one', () => {
    const days = datedDays(true)
    expect(dayDeleteImpact(days[3], days, empty(), range)).toMatchObject({ shiftedDays: 0, shiftedBookings: 0, newEndDate: null })
    const only = [buildDay({ id: 1, day_number: 1 })]
    expect(dayDeleteImpact(only[0], only, empty(), null).isLastDay).toBe(true)

    const t = (key: string) => key
    expect(deleteDayBlockedReason(1, true, t)).toBe('dayplan.deleteDayLast')
    expect(deleteDayBlockedReason(3, true, t)).toBe('dayplan.daysOffline')
    expect(deleteDayBlockedReason(3, false, t)).toBeNull()
  })
})

describe('contentOnDays: what a cancelled stay costs', () => {
  const hotelStay = (): DayContentData => ({
    ...empty(),
    accommodations: [stay({ id: 9, start_day_id: 7, end_day_id: 8, place_name: 'Harbour Hotel' })],
    reservations: [buildReservation({ id: 40, day_id: 7, type: 'hotel', title: 'Harbour, 1 night', accommodation_id: 9 })],
  })

  it('FE-UTIL-DAYDEL-015: the expense on the stay booking is named with its sum, in the trip currency when it has none', () => {
    const budget = {
      items: [
        buildBudgetItem({ id: 1, reservation_id: 40, total_price: 180, currency: null }),
        buildBudgetItem({ id: 2, reservation_id: 40, total_price: 20, currency: 'EUR' }),
        buildBudgetItem({ id: 3, reservation_id: 41, total_price: 999 }),
      ],
      currency: 'EUR',
      locale: 'en',
    }
    const [paid] = contentOnDays([buildDay({ id: 7 })], { ...hotelStay(), budget }).stays
    // 180 without a currency of its own is in the trip currency, so it adds up with the 20 EUR.
    expect(paid.expense?.amount).toBe(formatMoney(200, 'EUR', 'en'))

    // Read, and none on the booking: there is no expense to lose.
    expect(contentOnDays([buildDay({ id: 7 })], { ...hotelStay(), budget: { ...budget, items: [budget.items[2]] } }).stays[0].expense).toBeNull()
    // Read without a currency to name the sum in: there is one, sum unknown.
    expect(contentOnDays([buildDay({ id: 7 })], { ...hotelStay(), budget: { items: budget.items } }).stays[0].expense).toEqual({ amount: null })
    // An expense of nothing names no sum either.
    const free = { ...budget, items: [buildBudgetItem({ reservation_id: 40, total_price: 0 })] }
    expect(contentOnDays([buildDay({ id: 7 })], { ...hotelStay(), budget: free }).stays[0].expense).toEqual({ amount: null })
  })

  it('FE-UTIL-DAYDEL-016: every booking linked to the stay goes, the first by name and the rest counted', () => {
    const data = hotelStay()
    data.reservations.push(buildReservation({ id: 41, day_id: 7, type: 'hotel', title: 'Harbour, breakfast', accommodation_id: '9' }))
    const [cancelled] = contentOnDays([buildDay({ id: 7 })], { ...data, budget: { items: [], currency: 'EUR', locale: 'en' } }).stays
    expect(cancelled).toEqual({ id: 9, name: 'Harbour Hotel', booking: 'Harbour, 1 night', moreBookings: 1, expense: null })
  })
})

describe('contentOnDays over several days (the shrink warning)', () => {
  it('FE-UTIL-DAYDEL-009: counts across all the days at once', () => {
    const data = {
      ...empty(),
      assignments: {
        '7': [buildAssignment({ day_id: 7, place: buildPlace({ id: 50 }) })],
        '8': [buildAssignment({ day_id: 8, place: buildPlace({ id: 51 }) })],
      },
      dayNotes: { '7': [buildDayNote({ day_id: 7 })], '8': [buildDayNote({ day_id: 8 }), buildDayNote({ day_id: 8 })] },
      reservations: [buildReservation({ id: 1, day_id: 7 }), buildReservation({ id: 2, day_id: 8 }), buildReservation({ id: 3, day_id: 9 })],
    }
    const days = [buildDay({ id: 7, title: 'Harbour day' }), buildDay({ id: 8, notes: 'Ferry at nine' })]
    expect(contentOnDays(days, data)).toEqual({ places: 2, notes: 3, texts: 2, bookings: 2, stays: [] })
  })

  it('FE-UTIL-DAYDEL-010: a stay from one of the days to another counts once', () => {
    const data = { ...empty(), accommodations: [stay({ id: 9, start_day_id: 7, end_day_id: 8, place_name: 'Harbour Hotel' })] }
    expect(contentOnDays([buildDay({ id: 7 }), buildDay({ id: 8 })], data).stays).toEqual([
      { id: 9, name: 'Harbour Hotel', booking: null, moreBookings: 0, expense: null },
    ])
  })

  it('FE-UTIL-DAYDEL-011: the hotel booking of such a stay is the stay, not another booking', () => {
    const data = {
      ...empty(),
      accommodations: [stay({ id: 9, start_day_id: 7, end_day_id: 8 })],
      reservations: [buildReservation({ id: 4, day_id: 7, end_day_id: 8, type: 'hotel', title: 'Harbour, 1 night', accommodation_id: 9 })],
    }
    expect(contentOnDays([buildDay({ id: 7 }), buildDay({ id: 8 })], data)).toMatchObject({
      bookings: 0,
      stays: [{ id: 9, booking: 'Harbour, 1 night' }],
    })
  })

  it('FE-UTIL-DAYDEL-012: the same place on two days is one place, and the stops a stay wrote are none', () => {
    const museum = buildPlace({ id: 50 })
    const hotel = buildPlace({ id: 52 })
    const data = {
      ...empty(),
      assignments: {
        '7': [buildAssignment({ day_id: 7, place: museum }), buildAssignment({ day_id: 7, place: hotel, accommodation_id: 9 })],
        '8': [buildAssignment({ day_id: 8, place: museum }), buildAssignment({ day_id: 8, place: hotel, accommodation_id: 9 })],
      },
    }
    expect(contentOnDays([buildDay({ id: 7 }), buildDay({ id: 8 })], data).places).toBe(1)
  })
})
