// FE-UTIL-DAYLINES-001 to FE-UTIL-DAYLINES-010
import { describe, it, expect } from 'vitest'
import { BedDouble, BedSingle, CalendarCheck, CalendarClock, CalendarPlus } from 'lucide-react'
import { dayChips, deleteDayLines, impactLines, shrinkTripLines } from './dayImpactLines'
import type { DayDeleteImpact, StayImpact } from './dayDeleteImpact'
import type { TripRangeImpact } from './tripRangeImpact'
import { buildDay } from '../../tests/helpers/factories'

const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}(${Object.entries(params).map(([k, v]) => `${k}=${v}`).join(',')})` : key

const nothing: DayDeleteImpact = {
  places: 0, notes: 0, texts: 0, bookings: 0, stays: [],
  shiftedDays: 0, shiftedBookings: 0, newEndDate: null, shortenedStays: [], datedSpare: null, isLastDay: false,
}

const stayOf = (overrides: Partial<StayImpact>): StayImpact =>
  ({ id: 9, name: 'Harbour Hotel', booking: null, moreBookings: 0, expense: null, ...overrides })

describe('impactLines', () => {
  it('FE-UTIL-DAYLINES-001: stays come first in the danger tone, then every kind that has something in it', () => {
    const lines = impactLines({
      places: 3, notes: 2, texts: 1, bookings: 4,
      stays: [stayOf({ booking: 'HH 1 night', expense: { amount: null } }), stayOf({ id: 10, name: 'Pension Alma' })],
    }, t, 'deleteDay')

    expect(lines.map(l => [l.key, l.tone, l.text, l.hint])).toEqual([
      ['stay-9', 'danger', 'dayplan.impactStay(name=Harbour Hotel)', 'dayplan.deleteDayStayBookedHint(booking=HH 1 night)'],
      ['stay-10', 'danger', 'dayplan.impactStay(name=Pension Alma)', 'dayplan.deleteDayStayHint'],
      ['places', 'neutral', 'dayplan.impactPlaces(count=3)', 'dayplan.impactPlacesHint'],
      ['notes', 'neutral', 'dayplan.impactNotes(count=2)', 'dayplan.impactDeletedHint'],
      ['texts', 'neutral', 'dayplan.impactTexts(count=1)', 'dayplan.impactDeletedHint'],
      ['bookings', 'neutral', 'dayplan.impactBookings(count=4)', 'dayplan.deleteDayBookingsHint'],
    ])
    expect(lines[0].icon).toBe(BedDouble)
  })

  it('FE-UTIL-DAYLINES-002: kinds with nothing in them are left out', () => {
    expect(impactLines({ ...nothing, notes: 1 }, t, 'deleteDay').map(l => l.key)).toEqual(['notes'])
    expect(impactLines(nothing, t, 'deleteDay')).toEqual([])
  })
})

describe('deleteDayLines', () => {
  const formatDate = (iso: string) => `<${iso}>`

  it('FE-UTIL-DAYLINES-003: moved dates follow the content, with the bookings that move along and the new end', () => {
    const lines = deleteDayLines({ ...nothing, places: 1, shiftedDays: 2, shiftedBookings: 3, newEndDate: '2026-06-02' }, t, formatDate)
    expect(lines.map(l => [l.key, l.tone, l.text, l.hint])).toEqual([
      ['places', 'neutral', 'dayplan.impactPlaces(count=1)', 'dayplan.impactPlacesHint'],
      ['shift', 'warning', 'dayplan.deleteDayShift(count=2)', 'dayplan.deleteDayShiftBookingsHint(count=3)'],
      ['shrink', 'warning', 'dayplan.deleteDayShrink(date=<2026-06-02>)', 'dayplan.deleteDayShrinkHint'],
    ])
    expect(deleteDayLines({ ...nothing, shiftedDays: 1 }, t, formatDate)[0].hint).toBe('dayplan.deleteDayShiftHint')
  })

  it('FE-UTIL-DAYLINES-004: a day with nothing on it and no dates to move gets one quiet row', () => {
    const lines = deleteDayLines(nothing, t, formatDate)
    expect(lines).toEqual([{ key: 'empty', icon: CalendarCheck, tone: 'muted', text: 'dayplan.deleteDayEmpty' }])
  })

  it('FE-UTIL-DAYLINES-010: a stay a night shorter follows the cancelled ones, the day taking the last date follows the shift', () => {
    const spareDay = buildDay({ id: 4, title: null, date: null })
    const lines = deleteDayLines({
      ...nothing,
      notes: 1,
      stays: [stayOf({ id: 10, name: 'Pension Alma' })],
      shortenedStays: [{ id: 9, name: 'Harbour Hotel', checkOut: '2026-06-02' }, { id: 11, name: 'Dune Lodge', checkOut: null }],
      shiftedDays: 1,
      datedSpare: { day: spareDay, index: 3, date: '2026-06-03' },
    }, t, formatDate, (day, index) => `name(${day.id},${index})`)

    expect(lines.map(l => [l.key, l.tone, l.text, l.hint])).toEqual([
      ['stay-10', 'danger', 'dayplan.impactStay(name=Pension Alma)', 'dayplan.deleteDayStayHint'],
      ['stay-short-9', 'warning', 'dayplan.impactStayShorter(name=Harbour Hotel)', 'dayplan.deleteDayStayShorterHint(date=<2026-06-02>)'],
      ['stay-short-11', 'warning', 'dayplan.impactStayShorter(name=Dune Lodge)', 'dayplan.deleteDayStayShorterUndatedHint'],
      ['notes', 'neutral', 'dayplan.impactNotes(count=1)', 'dayplan.impactDeletedHint'],
      ['shift', 'warning', 'dayplan.deleteDayShift(count=1)', 'dayplan.deleteDayShiftHint'],
      ['spare', 'warning', 'dayplan.deleteDaySpareDated(day=name(4,3),date=<2026-06-03>)', 'dayplan.deleteDaySpareDatedHint'],
    ])
    expect(lines[1].icon).toBe(BedSingle)
    expect(lines[5].icon).toBe(CalendarPlus)
    // Without a way to name days, a day is "Day n" by its place in the list.
    const plain = deleteDayLines({ ...nothing, datedSpare: { day: spareDay, index: 3, date: '2026-06-03' } }, t, formatDate)
    expect(plain[0].text).toBe('dayplan.deleteDaySpareDated(day=dayplan.dayN(n=4),date=<2026-06-03>)')
  })
})

describe('shrinkTripLines', () => {
  const shrink = (content: Partial<TripRangeImpact['content']>, startMoved = false): TripRangeImpact => ({
    removedDays: [],
    startMoved,
    content: { places: 0, notes: 0, texts: 0, bookings: 0, stays: [], ...content },
  })

  it('FE-UTIL-DAYLINES-005: the same rows, with the shortening hints: a removed stay leaves its booking behind', () => {
    const lines = shrinkTripLines(shrink({ places: 2, stays: [stayOf({ booking: 'HH', expense: { amount: null } }), stayOf({ id: 10, name: 'Alma' })] }), t)
    expect(lines.map(l => [l.key, l.tone, l.hint])).toEqual([
      ['stay-9', 'danger', 'dashboard.shrinkStayBookedHint(booking=HH)'],
      ['stay-10', 'danger', 'dashboard.shrinkStayHint'],
      ['places', 'neutral', 'dayplan.impactPlacesHint'],
    ])
  })

  it('FE-UTIL-DAYLINES-006: the booking hint follows the shift mode', () => {
    const hint = (mode?: 'keep_bookings' | 'shift_all') => shrinkTripLines(shrink({ bookings: 2 }), t, mode)[0].hint
    expect(hint()).toBe('dashboard.shrinkBookingsHint')
    expect(hint('keep_bookings')).toBe('dashboard.shrinkBookingsHint')
    expect(hint('shift_all')).toBe('dashboard.shrinkBookingsShiftHint')
    // Deleting a day keeps its own hint whatever mode is passed along.
    expect(impactLines(shrink({ bookings: 1 }).content, t, 'deleteDay', { shiftMode: 'shift_all' })[0].hint).toBe('dayplan.deleteDayBookingsHint')
  })

  it('FE-UTIL-DAYLINES-007: a moved start that still takes the last days gets a last row that says so', () => {
    const lines = shrinkTripLines(shrink({ notes: 1 }, true), t)
    expect(lines[lines.length - 1]).toEqual({
      key: 'lastDays',
      icon: CalendarClock,
      tone: 'warning',
      text: 'dashboard.shrinkLastDays',
      hint: 'dashboard.shrinkLastDaysHint',
    })
    expect(shrinkTripLines(shrink({ notes: 1 }), t).map(l => l.key)).toEqual(['notes'])
  })

  it('FE-UTIL-DAYLINES-009: a stay hint says what goes with the stay: its bookings, and the sum only where the expense is lost', () => {
    const hint = (stay: Partial<StayImpact>, variant: 'deleteDay' | 'shrinkTrip') =>
      impactLines({ places: 0, notes: 0, texts: 0, bookings: 0, stays: [stayOf(stay)] }, t, variant)[0].hint

    expect(hint({ booking: 'HH' }, 'deleteDay')).toBe('dayplan.deleteDayStayBookingHint(booking=HH)')
    expect(hint({ booking: 'HH', expense: { amount: null } }, 'deleteDay')).toBe('dayplan.deleteDayStayBookedHint(booking=HH)')
    expect(hint({ booking: 'HH', expense: { amount: '€200.00' } }, 'deleteDay')).toBe('dayplan.deleteDayStayPaidHint(booking=HH,amount=€200.00)')
    expect(hint({ booking: 'HH', moreBookings: 2 }, 'deleteDay')).toBe('dayplan.deleteDayStayBookingHint(booking=HH dashboard.shrinkMoreDays(count=2))')

    // Shortening leaves the expense in place: said when there is one, never by its sum.
    expect(hint({ booking: 'HH' }, 'shrinkTrip')).toBe('dashboard.shrinkStayBookingHint(booking=HH)')
    expect(hint({ booking: 'HH', expense: { amount: '€200.00' } }, 'shrinkTrip')).toBe('dashboard.shrinkStayBookedHint(booking=HH)')
    expect(hint({}, 'shrinkTrip')).toBe('dashboard.shrinkStayHint')
  })

  it('FE-UTIL-DAYLINES-008: day chips name six days and sum up the rest', () => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Day 8']
    expect(dayChips(labels.slice(0, 6), t)).toEqual(labels.slice(0, 6))
    expect(dayChips(labels, t)).toEqual([...labels.slice(0, 6), 'dashboard.shrinkMoreDays(count=2)'])
    expect(dayChips(labels, t, 3)).toEqual(['Mon', 'Tue', 'Wed', 'dashboard.shrinkMoreDays(count=5)'])
  })
})
