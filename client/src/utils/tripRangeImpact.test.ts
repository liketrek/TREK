// FE-UTIL-RANGEDEL-001 to FE-UTIL-RANGEDEL-008
import { describe, it, expect } from 'vitest'
import { planDayGrid } from '@trek/shared'
import { buildAssignment, buildDay, buildPlace, buildReservation } from '../../tests/helpers/factories'
import { hasVisibleContent, tripRangeImpact } from './tripRangeImpact'
import type { DayContentData } from './dayDeleteImpact'
import type { Accommodation, Day } from '../types'

/**
 * The trip of the plan: 1 to 10 October, a place on every day (ids 1 to 10),
 * then two days without a date: 11 is empty, 12 has a place on it.
 */
function tenDays(): Day[] {
  return [
    ...Array.from({ length: 10 }, (_, i) =>
      buildDay({ id: i + 1, day_number: i + 1, date: `2026-10-${String(i + 1).padStart(2, '0')}` })),
    buildDay({ id: 11, day_number: 11, date: null }),
    buildDay({ id: 12, day_number: 12, date: null }),
  ]
}

function contentOn(days: Day[]): DayContentData {
  const assignments: DayContentData['assignments'] = {}
  for (const day of days) {
    if (day.id !== 11) assignments[String(day.id)] = [buildAssignment({ day_id: day.id, place: buildPlace({ id: 100 + day.id }) })]
  }
  return { assignments, dayNotes: {}, reservations: [], accommodations: [] }
}

function impactFor(start: string | null, end: string | null, options = { startMoved: false }, days = tenDays(), data = contentOn(days)) {
  const plan = planDayGrid({
    days: days.map(d => ({
      id: d.id,
      day_number: d.day_number ?? 0,
      date: d.date,
      hasPlanItems: (data.assignments[String(d.id)]?.length ?? 0) > 0,
    })),
    stays: data.accommodations,
    startDate: start,
    endDate: end,
  })
  return tripRangeImpact(plan, days, data, options)
}

const ids = (impact: ReturnType<typeof impactFor>) => impact.removedDays.map(r => r.day.id)

describe('tripRangeImpact', () => {
  it('FE-UTIL-RANGEDEL-001: an earlier end takes the last days with their places, and the empty spare day', () => {
    const impact = impactFor('2026-10-01', '2026-10-08')
    expect(ids(impact)).toEqual([9, 10, 11])
    expect(impact.content.places).toBe(2)
    expect(impact.startMoved).toBe(false)
    expect(hasVisibleContent(impact)).toBe(true)
  })

  it('FE-UTIL-RANGEDEL-002: a later start with the same end still takes the last days, and says so', () => {
    const impact = impactFor('2026-10-03', '2026-10-10', { startMoved: true })
    expect(ids(impact)).toEqual([9, 10, 11])
    expect(impact.startMoved).toBe(true)
  })

  it('FE-UTIL-RANGEDEL-003: moving the whole range drops only the empty spare day, which is not worth a word', () => {
    const impact = impactFor('2026-10-05', '2026-10-14', { startMoved: true })
    expect(ids(impact)).toEqual([11])
    // Nothing dated went, so the "last days" row would be wrong here.
    expect(impact.startMoved).toBe(false)
    expect(hasVisibleContent(impact)).toBe(false)
  })

  it('FE-UTIL-RANGEDEL-004: a later end removes nothing', () => {
    const impact = impactFor('2026-10-01', '2026-10-11')
    expect(impact.removedDays).toEqual([])
    expect(hasVisibleContent(impact)).toBe(false)
  })

  it('FE-UTIL-RANGEDEL-005: clearing the dates keeps every day', () => {
    const impact = impactFor(null, null)
    expect(impact.removedDays).toEqual([])
    expect(impact.content).toEqual({ places: 0, notes: 0, texts: 0, bookings: 0, stays: [] })
  })

  it('FE-UTIL-RANGEDEL-006: a spare day with only a title goes, and its title is what the warning names', () => {
    const days = tenDays().map(d => (d.id === 11 ? { ...d, title: 'Buffer day' } : d))
    const impact = impactFor('2026-10-05', '2026-10-14', { startMoved: false }, days)
    expect(ids(impact)).toEqual([11])
    expect(impact.content.texts).toBe(1)
    expect(hasVisibleContent(impact)).toBe(true)
  })

  it('FE-UTIL-RANGEDEL-007: a stay on a removed day goes as a whole, with its booking, and a booking there counts', () => {
    const days = tenDays()
    const data = contentOn(days)
    data.accommodations = [
      { id: 5, trip_id: 1, start_day_id: 7, end_day_id: 9, place_name: 'Harbour Hotel' } as Accommodation,
      { id: 6, trip_id: 1, start_day_id: 2, end_day_id: 4, place_name: 'Pension Alma' } as Accommodation,
    ]
    data.reservations = [
      buildReservation({ id: 40, day_id: 7, type: 'hotel', title: 'Harbour, 2 nights', accommodation_id: 5 }),
      buildReservation({ id: 41, day_id: 10, title: 'Ferry' }),
    ]
    const impact = impactFor('2026-10-01', '2026-10-08', { startMoved: false }, days, data)
    // No expenses handed in: the booking may carry one, which the list then says.
    expect(impact.content.stays).toEqual([{ id: 5, name: 'Harbour Hotel', booking: 'Harbour, 2 nights', moreBookings: 0, expense: { amount: null } }])
    expect(impact.content.bookings).toBe(1)
  })

  it('FE-UTIL-RANGEDEL-008: the removed days come in list order, each with its place in the list', () => {
    const days = [...tenDays()].reverse()
    const impact = impactFor('2026-10-01', '2026-10-09', { startMoved: false }, days)
    expect(impact.removedDays.map(r => [r.day.id, r.index])).toEqual([[10, 9], [11, 10]])
  })
})
