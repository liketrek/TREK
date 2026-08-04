// FE-W4LOC-001 to FE-W4LOC-014
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { formatLocationName, formatDate, formatTime } from './formatters'

describe('formatLocationName', () => {
  it('FE-W4LOC-001: returns an empty string for a missing name', () => {
    expect(formatLocationName(null)).toBe('')
    expect(formatLocationName(undefined)).toBe('')
    expect(formatLocationName('')).toBe('')
  })

  it('FE-W4LOC-002: passes a short name through untouched', () => {
    expect(formatLocationName('  Blue Lagoon, Grindavík, Iceland  ')).toBe('Blue Lagoon, Grindavík, Iceland')
    expect(formatLocationName('Reykjavik')).toBe('Reykjavik')
  })

  it('FE-W4LOC-003: collapses a verbose Nominatim string to name, postcode, country', () => {
    const raw = 'Hallgrimskirkja, 1, Skolavorduholt, Midborg, Reykjavik, Capital Region, Iceland, 101'
    expect(formatLocationName(raw)).toBe('Hallgrimskirkja, 101, Iceland')
  })

  it('FE-W4LOC-004: drops the postcode when the tail is not one', () => {
    const raw = 'Blue Lagoon, Norðurljósavegur, Grindavík, Southern Peninsula, Iceland'
    expect(formatLocationName(raw)).toBe('Blue Lagoon, Iceland')
  })

  it('FE-W4LOC-005: deduplicates repeated parts before shortening', () => {
    expect(formatLocationName('Paris, Paris, Paris, France')).toBe('Paris, France')
  })

  it('FE-W4LOC-006: keeps a deduplicated list of three or fewer parts intact', () => {
    expect(formatLocationName('A, A, B, C')).toBe('A, B, C')
  })

  it('FE-W4LOC-007: never repeats the name as country or postcode', () => {
    expect(formatLocationName('101, Skolavorduholt, Midborg, Reykjavik, 101')).toBe('101, Reykjavik')
  })

  it('FE-W4LOC-008: rejects an over-long tail as a postcode', () => {
    const raw = 'Museum, Street, District, City, Region, Country, 1234567890AB'
    expect(formatLocationName(raw)).toBe('Museum, 1234567890AB')
  })
})

describe('formatDate', () => {
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'))
  })
  afterAll(() => {
    vi.useRealTimers()
  })

  it('FE-W4LOC-009: omits the year for a date in the current year', () => {
    const out = formatDate('2026-08-01', 'en-US')

    expect(out).toContain('Aug')
    expect(out).not.toContain('2026')
  })

  it('FE-W4LOC-010: adds the year for another year and returns null without a date', () => {
    expect(formatDate('2025-08-01', 'en-US')).toContain('2025')
    expect(formatDate(null, 'en-US')).toBeNull()
    expect(formatDate('', 'en-US')).toBeNull()
  })
})

describe('formatTime', () => {
  it('FE-W4LOC-011: renders a padded 24h time', () => {
    expect(formatTime('9:05', 'en-US', '24h')).toBe('09:05')
    expect(formatTime('', 'en-US', '24h')).toBe('')
  })

  it('FE-W4LOC-012: appends Uhr for German locales', () => {
    expect(formatTime('18:30', 'de-DE', '24h')).toBe('18:30 Uhr')
  })

  it('FE-W4LOC-013: renders a 12h time with the right period', () => {
    expect(formatTime('00:15', 'en-US', '12h')).toBe('12:15 AM')
    expect(formatTime('12:00', 'en-US', '12h')).toBe('12:00 PM')
    expect(formatTime('13:05', 'en-US', '12h')).toBe('1:05 PM')
    expect(formatTime('09:00', 'en-US', '12h')).toBe('9:00 AM')
  })

  it('FE-W4LOC-014: treats unparseable parts as zero', () => {
    expect(formatTime('abc', 'en-US', '24h')).toBe('00:00')
  })
})
