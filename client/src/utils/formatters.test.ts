import { describe, it, expect } from 'vitest'
import { splitReservationDateTime } from './formatters'

describe('splitReservationDateTime', () => {
  it('parses full ISO datetime', () => {
    expect(splitReservationDateTime('2026-06-25T10:00')).toEqual({ date: '2026-06-25', time: '10:00' })
  })

  it('parses full datetime with seconds', () => {
    expect(splitReservationDateTime('2026-06-25T10:00:30')).toEqual({ date: '2026-06-25', time: '10:00' })
  })

  it('parses date-only string', () => {
    expect(splitReservationDateTime('2026-06-25')).toEqual({ date: '2026-06-25', time: null })
  })

  it('parses bare HH:MM (new dateless format)', () => {
    expect(splitReservationDateTime('10:00')).toEqual({ date: null, time: '10:00' })
  })

  it('parses bare single-digit hour time', () => {
    expect(splitReservationDateTime('9:30')).toEqual({ date: null, time: '9:30' })
  })

  it('handles legacy malformed T-prefixed time ("T10:00")', () => {
    expect(splitReservationDateTime('T10:00')).toEqual({ date: null, time: '10:00' })
  })

  it('returns null date for T-prefixed without valid date', () => {
    const result = splitReservationDateTime('T23:59')
    expect(result.date).toBeNull()
    expect(result.time).toBe('23:59')
  })

  it('returns nulls for null input', () => {
    expect(splitReservationDateTime(null)).toEqual({ date: null, time: null })
  })

  it('returns nulls for undefined input', () => {
    expect(splitReservationDateTime(undefined)).toEqual({ date: null, time: null })
  })

  it('returns nulls for empty string', () => {
    expect(splitReservationDateTime('')).toEqual({ date: null, time: null })
  })

  it('returns nulls for unrecognized string', () => {
    expect(splitReservationDateTime('garbage')).toEqual({ date: null, time: null })
  })
})
