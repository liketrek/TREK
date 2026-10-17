// FE-UTIL-CALWEEK-001 to FE-UTIL-CALWEEK-005
import { describe, it, expect } from 'vitest'
import { leadingBlanks, weekdayLabels, weekStartDay, weekStartOptions } from './calendarWeek'

describe('calendarWeek (#2029)', () => {
  it('FE-UTIL-CALWEEK-001: maps the setting to getDay() and falls back to Monday', () => {
    expect(weekStartDay('monday')).toBe(1)
    expect(weekStartDay('sunday')).toBe(0)
    expect(weekStartDay('saturday')).toBe(6)
    // Missing, unknown and the Vacay-style number all read as Monday, what every picker showed before.
    expect(weekStartDay(undefined)).toBe(1)
    expect(weekStartDay('friday')).toBe(1)
    expect(weekStartDay(0)).toBe(1)
  })

  it('FE-UTIL-CALWEEK-002: counts the blanks before the 1st for each first weekday', () => {
    // 1 March 2026 is a Sunday.
    expect(leadingBlanks(2026, 2, 1)).toBe(6)
    expect(leadingBlanks(2026, 2, 0)).toBe(0)
    expect(leadingBlanks(2026, 2, 6)).toBe(1)
    // 1 January 2024 is a Monday.
    expect(leadingBlanks(2024, 0, 1)).toBe(0)
    expect(leadingBlanks(2024, 0, 0)).toBe(1)
    expect(leadingBlanks(2024, 0, 6)).toBe(2)
  })

  it('FE-UTIL-CALWEEK-003: rotates the header row to the first weekday', () => {
    expect(weekdayLabels('en-US', 1, 'short')).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    expect(weekdayLabels('en-US', 0, 'short')).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
    expect(weekdayLabels('en-US', 6, 'short')).toEqual(['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
    expect(weekdayLabels('en-US', 0).join('')).toBe('SMTWTFS')
  })

  it('FE-UTIL-CALWEEK-004: speaks the app locale, not the browser one', () => {
    expect(weekdayLabels('de-DE', 1, 'short')[0]).toBe('Mo')
  })

  it('FE-UTIL-CALWEEK-005: labels the choices with capitalised day names in the app language', () => {
    expect(weekStartOptions('en-US')).toEqual([
      { value: 'monday', label: 'Monday' },
      { value: 'sunday', label: 'Sunday' },
      { value: 'saturday', label: 'Saturday' },
    ])
    // French writes weekday names lower-case; standing alone on a button they start upper-case.
    expect(weekStartOptions('fr-FR').map(o => o.label)).toEqual(['Lundi', 'Dimanche', 'Samedi'])
  })
})
