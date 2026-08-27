import { describe, it, expect } from 'vitest'
import {
  DEFAULT_YEAR_SETTINGS,
  currentPeriodYear,
  defaultPeriodYear,
  gridWindow,
  inGridWindow,
  resolveYearWindow,
  windowCalendarYears,
  windowMonths,
} from './yearWindow'
import type { VacayYearSettings } from '../types'

const fiscal = (month: number, day = 1): VacayYearSettings => ({
  year_type: 'fiscal', year_start_month: month, year_start_day: day, hire_date: null,
})

const anniversary = (hire: string | null): VacayYearSettings => ({
  year_type: 'anniversary', year_start_month: 1, year_start_day: 1, hire_date: hire,
})

describe('resolveYearWindow', () => {
  // FE-VACAY-YEARWINDOW-001
  it('defaults to the plain calendar year', () => {
    expect(resolveYearWindow(2026)).toEqual({ start: '2026-01-01', end: '2027-01-01' })
    expect(resolveYearWindow(2026, DEFAULT_YEAR_SETTINGS)).toEqual({ start: '2026-01-01', end: '2027-01-01' })
  })

  // FE-VACAY-YEARWINDOW-002
  it('starts a fiscal year on the configured month and day', () => {
    expect(resolveYearWindow(2026, fiscal(7))).toEqual({ start: '2026-07-01', end: '2027-07-01' })
    expect(resolveYearWindow(2026, fiscal(4, 6))).toEqual({ start: '2026-04-06', end: '2027-04-06' })
  })

  // FE-VACAY-YEARWINDOW-003
  it('follows the hire date for an anniversary year, falling back to January 1 without one', () => {
    expect(resolveYearWindow(2026, anniversary('2019-09-16'))).toEqual({ start: '2026-09-16', end: '2027-09-16' })
    expect(resolveYearWindow(2026, anniversary(null))).toEqual({ start: '2026-01-01', end: '2027-01-01' })
  })

  // FE-VACAY-YEARWINDOW-004
  it('matches the server: consecutive periods meet exactly', () => {
    expect(resolveYearWindow(2025, fiscal(7)).end).toBe(resolveYearWindow(2026, fiscal(7)).start)
  })

  // FE-VACAY-YEARWINDOW-004a
  it('ignores a month left behind by a previous fiscal setting when there is no hire date', () => {
    // The settings UI sends the whole object, so switching to anniversary carries
    // the old fiscal month along until a hire date is entered.
    const stale = { year_type: 'anniversary' as const, year_start_month: 4, year_start_day: 1, hire_date: null }
    expect(resolveYearWindow(2026, stale)).toEqual({ start: '2026-01-01', end: '2027-01-01' })
    expect(windowMonths(2026, stale)[0]).toEqual({ year: 2026, month: 0 })
  })

  // FE-VACAY-YEARWINDOW-004b
  it('clamps a start day the month cannot have, matching the server', () => {
    expect(resolveYearWindow(2026, anniversary('2024-02-29'))).toEqual({ start: '2026-02-28', end: '2027-02-28' })
    expect(resolveYearWindow(2026, fiscal(2, 31))).toEqual({ start: '2026-02-28', end: '2027-02-28' })
  })
})

describe('windowMonths', () => {
  // FE-VACAY-YEARWINDOW-005
  it('lists January to December of the year for a calendar window', () => {
    const months = windowMonths(2026)
    expect(months).toHaveLength(12)
    expect(months[0]).toEqual({ year: 2026, month: 0 })
    expect(months[11]).toEqual({ year: 2026, month: 11 })
  })

  // FE-VACAY-YEARWINDOW-006
  it('rolls over the calendar year for a fiscal window', () => {
    const months = windowMonths(2026, fiscal(7))
    expect(months[0]).toEqual({ year: 2026, month: 6 })   // Jul 2026
    expect(months[5]).toEqual({ year: 2026, month: 11 })  // Dec 2026
    expect(months[6]).toEqual({ year: 2027, month: 0 })   // Jan 2027
    expect(months[11]).toEqual({ year: 2027, month: 5 })  // Jun 2027
  })

  // FE-VACAY-YEARWINDOW-007
  it('ignores the start day — the grid always renders whole months', () => {
    expect(windowMonths(2026, fiscal(4, 6))[0]).toEqual({ year: 2026, month: 3 })
  })
})

describe('gridWindow / inGridWindow', () => {
  // FE-VACAY-YEARWINDOW-008
  it('is the window itself whenever it starts on the first of a month', () => {
    expect(gridWindow(2026)).toEqual(resolveYearWindow(2026))
    expect(gridWindow(2026, fiscal(7))).toEqual(resolveYearWindow(2026, fiscal(7)))
  })

  // FE-VACAY-YEARWINDOW-009
  it('widens to whole months when the window starts later in the month', () => {
    expect(gridWindow(2026, fiscal(4, 6))).toEqual({ start: '2026-04-01', end: '2027-04-01' })
  })

  // FE-VACAY-YEARWINDOW-010
  it('accepts the days the grid shows and rejects the neighbouring periods', () => {
    expect(inGridWindow('2026-12-31', 2026, fiscal(7))).toBe(true)
    expect(inGridWindow('2027-01-01', 2026, fiscal(7))).toBe(true)
    expect(inGridWindow('2027-06-30', 2026, fiscal(7))).toBe(true)
    expect(inGridWindow('2026-06-30', 2026, fiscal(7))).toBe(false)
    expect(inGridWindow('2027-07-01', 2026, fiscal(7))).toBe(false)
  })
})

describe('windowCalendarYears', () => {
  // FE-VACAY-YEARWINDOW-011
  it('is one year for a calendar window and two for a shifted one', () => {
    expect(windowCalendarYears(2026)).toEqual([2026])
    expect(windowCalendarYears(2026, fiscal(7))).toEqual([2026, 2027])
  })
})

describe('currentPeriodYear', () => {
  // FE-VACAY-YEARWINDOW-012
  it('is today’s year for a calendar user', () => {
    expect(currentPeriodYear(DEFAULT_YEAR_SETTINGS, new Date(2026, 2, 15))).toBe(2026)
  })

  // FE-VACAY-YEARWINDOW-013
  it('is the previous year while a shifted period has not started yet', () => {
    expect(currentPeriodYear(fiscal(7), new Date(2026, 2, 15))).toBe(2025)
    expect(currentPeriodYear(fiscal(7), new Date(2026, 7, 15))).toBe(2026)
    expect(currentPeriodYear(fiscal(7), new Date(2026, 6, 1))).toBe(2026)
  })
})

describe('defaultPeriodYear', () => {
  // FE-VACAY-YEARWINDOW-014
  it('picks the current period when the plan has it', () => {
    const today = new Date(2026, 2, 15)
    expect(defaultPeriodYear([2024, 2025, 2026, 2030], DEFAULT_YEAR_SETTINGS, today)).toBe(2026)
  })

  // FE-VACAY-YEARWINDOW-015
  it('falls back to the closest year and prefers the coming one on a tie', () => {
    const today = new Date(2026, 2, 15)
    expect(defaultPeriodYear([2022, 2024], DEFAULT_YEAR_SETTINGS, today)).toBe(2024)
    expect(defaultPeriodYear([2028, 2030], DEFAULT_YEAR_SETTINGS, today)).toBe(2028)
    expect(defaultPeriodYear([2024, 2028], DEFAULT_YEAR_SETTINGS, today)).toBe(2028)
  })

  // FE-VACAY-YEARWINDOW-016
  it('is the current period for an empty plan', () => {
    expect(defaultPeriodYear([], DEFAULT_YEAR_SETTINGS, new Date(2026, 2, 15))).toBe(2026)
  })

  // FE-VACAY-YEARWINDOW-017
  it('follows a shifted leave year rather than the calendar year', () => {
    const today = new Date(2026, 2, 15)
    expect(defaultPeriodYear([2025, 2026], fiscal(7), today)).toBe(2025)
    expect(defaultPeriodYear([2026], fiscal(7), today)).toBe(2026)
  })
})
