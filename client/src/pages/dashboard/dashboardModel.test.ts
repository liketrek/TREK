import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MOMENT_LABEL, daysUntil, fullDate, getTripStatus, sortTrips, localIsoToday } from './dashboardModel'

/**
 * The dashboard classifies trips against the user's WALL CLOCK — `daysUntil`
 * always did (it parses dates as local midnight). But the "ongoing" check and
 * the sort ranking derived "today" from `toISOString()`, which is UTC — so in
 * any non-UTC timezone, between local midnight and the UTC rollover, a trip
 * that ended yesterday still ranked as "running" and a trip starting today
 * wasn't "ongoing". These tests pin the clock inside that window (00:30 local).
 * On a UTC machine local == UTC and the old bug is unobservable, so the
 * regression cases below are vacuous there — they bite on any offset TZ.
 */
describe('dashboardModel — "today" is the user\'s local date', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Local 2026-08-25 00:30 — for any TZ ahead of UTC, the UTC date is still 08-24.
    vi.setSystemTime(new Date(2026, 7, 25, 0, 30))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('localIsoToday() is the local calendar date, not the UTC one', () => {
    expect(localIsoToday()).toBe('2026-08-25')
  })

  it('daysUntil counts from local midnight', () => {
    expect(daysUntil('2026-08-25')).toBe(0)
    expect(daysUntil('2026-08-26')).toBe(1)
    expect(daysUntil('2026-08-24')).toBe(-1)
    expect(daysUntil(null)).toBeNull()
  })

  it('a trip spanning the local today is ongoing', () => {
    expect(getTripStatus({ start_date: '2026-08-25', end_date: '2026-08-26' } as never)).toBe('ongoing')
  })

  it('a trip starting on the local today (no end) is "today"', () => {
    expect(getTripStatus({ start_date: '2026-08-25', end_date: null } as never)).toBe('today')
  })

  it('a trip that ended yesterday (local) is past — and sorts after one starting today', () => {
    expect(getTripStatus({ start_date: '2026-08-20', end_date: '2026-08-24' } as never)).toBe('past')

    const endedYesterday = { id: 1, start_date: '2026-08-20', end_date: '2026-08-24' }
    const startsToday = { id: 2, start_date: '2026-08-25', end_date: '2026-08-26' }
    const sorted = sortTrips([endedYesterday, startsToday] as never[])
    expect(sorted.map((t: { id: number }) => t.id)).toEqual([2, 1])
  })
})

describe('dashboardModel: fullDate', () => {
  afterEach(() => { vi.useRealTimers() })

  it('shows the year only for another year and survives a missing or malformed date', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-01T12:00:00Z'))
    expect(fullDate('2026-09-10', 'en-US')).toBe('Sep 10')
    expect(fullDate('2024-09-10', 'en-US')).toBe('Sep 10, 2024')
    expect(fullDate(null, 'en-US')).toBeNull()
    expect(fullDate('not-a-date', 'en-US')).toBeNull()
  })
})

describe('dashboardModel: MOMENT_LABEL', () => {
  it('labels only the two moments of a stay', () => {
    expect(MOMENT_LABEL).toEqual({ checkin: 'day.checkIn', checkout: 'day.checkOut' })
    expect(MOMENT_LABEL.flight).toBeUndefined()
  })
})
