import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { isLocalToday, localIsoDate, localMinutes } from './localDate'

/**
 * "Today" must be the user's local calendar date. `toISOString()` is the UTC
 * date — between local midnight and the UTC rollover it is YESTERDAY for any
 * TZ ahead of UTC, which misclassified trips/journeys in that window. On a UTC
 * machine local == UTC, so the distinction is vacuous there; these tests pin
 * the clock at 00:30 local, where any positive offset separates the two.
 */
describe('localIsoDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 25, 0, 30)) // local 2026-08-25 00:30
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('formats the local calendar date, zero-padded', () => {
    expect(localIsoDate()).toBe('2026-08-25')
    expect(localIsoDate(new Date(2026, 0, 3, 12))).toBe('2026-01-03')
  })

  it('defaults to now', () => {
    expect(localIsoDate()).toBe(localIsoDate(new Date()))
  })
})

describe('localMinutes', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('counts the minutes since local midnight', () => {
    expect(localMinutes(new Date(2026, 7, 25, 0, 0))).toBe(0)
    expect(localMinutes(new Date(2026, 7, 25, 13, 45, 59))).toBe(825)
    expect(localMinutes(new Date(2026, 7, 25, 23, 59))).toBe(1439)
  })

  it('defaults to now', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 25, 0, 30))
    expect(localMinutes()).toBe(30)
  })
})

describe('isLocalToday', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 25, 0, 30)) // local 2026-08-25 00:30
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('matches the local calendar date, with or without a time part', () => {
    expect(isLocalToday('2026-08-25')).toBe(true)
    expect(isLocalToday('2026-08-25T00:00:00.000Z')).toBe(true)
  })

  it('is false for another date or no date at all', () => {
    expect(isLocalToday('2026-08-24')).toBe(false)
    expect(isLocalToday('')).toBe(false)
    expect(isLocalToday(null)).toBe(false)
    expect(isLocalToday(undefined)).toBe(false)
  })
})
