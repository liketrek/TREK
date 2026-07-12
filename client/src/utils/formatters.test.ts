import { describe, it, expect } from 'vitest'
import { splitReservationDateTime, resolveDayId, formatMoney, currencyDecimals } from './formatters'
import { CURRENCIES, SYMBOLS, currenciesWith } from '../components/Budget/BudgetPanel.constants'
import type { Day } from '../types'

const days = [
  { id: 10, date: '2026-05-03' },
  { id: 11, date: '2026-05-04' },
  { id: 12, date: '2026-05-22' },
] as Day[]

describe('resolveDayId', () => {
  it('returns the exact-match day id', () => {
    expect(resolveDayId(days, '2026-05-04')).toBe(11)
  })
  it('accepts a full ISO timestamp', () => {
    expect(resolveDayId(days, '2026-05-22T13:30:00')).toBe(12)
  })
  it('falls back to the nearest day when there is no exact match', () => {
    expect(resolveDayId(days, '2026-05-05')).toBe(11)
  })
  it('returns "" for a missing/invalid date or no days', () => {
    expect(resolveDayId(days, null)).toBe('')
    expect(resolveDayId(days, 'not a date')).toBe('')
    expect(resolveDayId([], '2026-05-04')).toBe('')
  })
})

describe('KGS currency (#1400)', () => {
  it('is selectable everywhere the shared currency list feeds', () => {
    expect(CURRENCIES).toContain('KGS')
    expect(SYMBOLS.KGS).toBeTruthy()
  })
  it('formats without throwing', () => {
    // Lenient: older ICU builds may lack ru-KG/KGS display data and fall back.
    const out = formatMoney(1234.56, 'KGS', 'en')
    expect(out).toMatch(/сом|KGS/)
    expect(out).toContain('234')
  })
})

describe('Frankfurter-supported currency list (#1470)', () => {
  it('offers the currencies that were previously missing', () => {
    for (const c of ['OMR', 'CRC', 'UGX', 'MKD', 'ALL']) {
      expect(CURRENCIES).toContain(c)
    }
  })
  it('drops currencies Frankfurter has archived', () => {
    expect(CURRENCIES).not.toContain('BGN')
    expect(CURRENCIES).not.toContain('HRK')
  })
  it('has a symbol for every selectable currency', () => {
    for (const c of CURRENCIES) expect(SYMBOLS[c]).toBeTruthy()
  })
})

describe('currencyDecimals', () => {
  it('uses 2 decimals for standard currencies', () => {
    expect(currencyDecimals('USD')).toBe(2)
    expect(currencyDecimals('EUR')).toBe(2)
  })
  it('uses 0 decimals for zero-decimal currencies', () => {
    for (const c of ['JPY', 'HUF', 'UGX', 'XOF', 'RWF', 'VUV']) {
      expect(currencyDecimals(c)).toBe(0)
    }
  })
  it('uses 3 decimals for the Gulf/dinar currencies', () => {
    for (const c of ['OMR', 'KWD', 'BHD', 'TND']) {
      expect(currencyDecimals(c)).toBe(3)
    }
  })
})

describe('currenciesWith (legacy safeguard)', () => {
  it('returns the base list unchanged for a supported currency', () => {
    expect(currenciesWith('EUR')).toBe(CURRENCIES)
    expect(currenciesWith(null)).toBe(CURRENCIES)
  })
  it('keeps an archived/legacy selection selectable', () => {
    const opts = currenciesWith('HRK')
    expect(opts).toContain('HRK')
    expect(opts.length).toBe(CURRENCIES.length + 1)
  })
})

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
