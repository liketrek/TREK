// FE-PLANNER-HOURS-001 to FE-PLANNER-HOURS-003
import { describe, expect, it } from 'vitest'
import { cleanWeek, emptyWeek, hoursLines, periodsFromWeek, readWeek, weekdayNames, weekFromPeriods, writeWeek } from './placeHours'

const week = JSON.stringify([
  { closed: false, open: '09:00', close: '17:00' },
  { closed: false, open: '20:00', close: '02:00' },
  { closed: false },
  { closed: false, open: '10:00' },
  { closed: false },
  { closed: true },
  { closed: false, open: '22:00', close: '03:00' },
])

describe('hand-kept opening hours (#2472)', () => {
  it('FE-PLANNER-HOURS-001: an empty week is stored as nothing, and reads back as an empty week', () => {
    expect(writeWeek(emptyWeek())).toBe('')
    expect(readWeek('')).toEqual(emptyWeek())
    expect(readWeek(week)[0]).toEqual({ closed: false, open: '09:00', close: '17:00' })
    expect(weekdayNames('en')[0]).toBe('Monday')
  })

  it('FE-PLANNER-HOURS-002: the inspector lines read like looked-up ones, closed days and gaps included', () => {
    expect(hoursLines(week, 'en', 'Closed')).toEqual([
      'Monday: 09:00 – 17:00', 'Tuesday: 20:00 – 02:00', 'Wednesday: –', 'Thursday: 10:00 – …',
      'Friday: –', 'Saturday: Closed', 'Sunday: 22:00 – 03:00',
    ])
    expect(hoursLines(writeWeek(emptyWeek()), 'en', 'Closed')).toBeNull()
  })

  it('FE-PLANNER-HOURS-003: periods count from Sunday and carry an overnight close into the next day', () => {
    expect(periodsFromWeek(week)).toEqual([
      { open: { day: 1, hour: 9, minute: 0 }, close: { day: 1, hour: 17, minute: 0 } },
      { open: { day: 2, hour: 20, minute: 0 }, close: { day: 3, hour: 2, minute: 0 } },
      { open: { day: 0, hour: 22, minute: 0 }, close: { day: 1, hour: 3, minute: 0 } },
    ])
    expect(periodsFromWeek(null)).toEqual([])
  })
})

describe('typing and taking over (#2472)', () => {
  it('FE-PLANNER-HOURS-004: half-typed times stay out of what is stored', () => {
    const week = emptyWeek()
    week[0] = { closed: false, open: '09:3', close: '17:00' }
    expect(cleanWeek(week)[0]).toEqual({ closed: false, close: '17:00' })
    expect(readWeek(writeWeek(cleanWeek(week)))[0]).toEqual({ closed: false, close: '17:00' })
  })

  it('FE-PLANNER-HOURS-005: looked-up periods become a week: one range a day, the rest closed, overnight and 24h handled', () => {
    const p = (day: number, h: number, m = 0) => ({ day, hour: h, minute: m })
    const week = weekFromPeriods([
      { open: p(1, 9), close: p(1, 12) },
      { open: p(1, 14), close: p(1, 18, 30) },
      { open: p(5, 20), close: p(6, 2) },
      { open: p(0, 0), close: null },
    ])!
    expect(week[0]).toEqual({ closed: false, open: '09:00', close: '18:30' })
    expect(week[1]).toEqual({ closed: true })
    expect(week[4]).toEqual({ closed: false, open: '20:00', close: '02:00' })
    expect(week[6]).toEqual({ closed: false, open: '00:00', close: '23:59' })
    expect(weekFromPeriods(null)).toBeNull()
    expect(weekFromPeriods([])).toBeNull()
  })
})

