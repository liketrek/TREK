// FE-DAWARICH-ATLASMODEL-001 to FE-DAWARICH-ATLASMODEL-014
/**
 * The Atlas dialog's arithmetic, with no React around it.
 *
 * Everything here is small enough to look correct and wrong enough to matter if
 * it is not. Three of the five carry a real trap:
 *
 *  1. `orderedMatches` sorts on two keys with a hand-written comparator that
 *     never returns 0. That is fine for ordering and a hazard for anything else,
 *     so the cases below check that the order is the same whichever way round
 *     the input arrives and that two wishes reached at the same moment both
 *     survive the sort rather than one of them being swapped away.
 *  2. `countryLabel` runs on whatever `Intl` the device shipped. A WebView
 *     without `Intl.DisplayNames` throws, one with a partial region table
 *     answers `undefined`, and both have to end up as Dawarich's own spelling
 *     rather than as a crash or an empty label beside a flag.
 *  3. `formatDistance` switches units at exactly a kilometre, which is the one
 *     input a refactor gets wrong.
 */
import { describe, it, expect } from 'vitest'
import type { DawarichAtlasCountry, DawarichBucketMatch } from '@trek/shared'
import {
  cityLine,
  countryLabel,
  countryWindow,
  formatDistance,
  newCountries,
  orderedMatches,
} from './dawarichAtlasModel'

function match(over: Partial<DawarichBucketMatch> & { itemId: number }): DawarichBucketMatch {
  return {
    itemId: over.itemId,
    name: over.name ?? `Wish ${over.itemId}`,
    match: over.match === undefined ? { at: '2026-09-01T10:00:00Z', minutes: 90, distanceMeters: 40, points: 12 } : over.match,
    alreadyVisited: over.alreadyVisited ?? false,
  }
}

function country(over: Partial<DawarichAtlasCountry> & { countryCode: string }): DawarichAtlasCountry {
  return {
    countryCode: over.countryCode,
    sourceName: over.sourceName ?? over.countryCode,
    cities: over.cities ?? [],
    alreadyVisited: over.alreadyVisited ?? false,
  }
}

const t = (key: string, params?: Record<string, unknown>): string =>
  `${key}:${JSON.stringify(params ?? {})}`

describe('countryWindow', () => {
  it('FE-DAWARICH-ATLASMODEL-001: asks for exactly the year before the given moment', () => {
    const now = new Date('2026-09-12T18:00:00Z')
    const { from, to } = countryWindow(now)
    expect(to).toBe('2026-09-12T18:00:00.000Z')
    expect(from).toBe('2025-09-12T18:00:00.000Z')
  })
})

describe('orderedMatches', () => {
  it('FE-DAWARICH-ATLASMODEL-002: drops wishes the recordings found nothing for', () => {
    const ordered = orderedMatches([match({ itemId: 1, match: null }), match({ itemId: 2 })])
    expect(ordered.map(m => m.itemId)).toEqual([2])
  })

  it('FE-DAWARICH-ATLASMODEL-003: open wishes lead, already ticked ones follow', () => {
    const ordered = orderedMatches([
      match({ itemId: 1, alreadyVisited: true }),
      match({ itemId: 2 }),
    ])
    expect(ordered.map(m => m.itemId)).toEqual([2, 1])
  })

  it('FE-DAWARICH-ATLASMODEL-004: within a group the most recent visit comes first', () => {
    const ordered = orderedMatches([
      match({ itemId: 1, match: { at: '2026-01-02T10:00:00Z', minutes: 30, distanceMeters: 10, points: 3 } }),
      match({ itemId: 2, match: { at: '2026-06-02T10:00:00Z', minutes: 30, distanceMeters: 10, points: 3 } }),
    ])
    expect(ordered.map(m => m.itemId)).toEqual([2, 1])
  })

  it('FE-DAWARICH-ATLASMODEL-005: leaves the caller\'s array untouched', () => {
    const input = [match({ itemId: 1, alreadyVisited: true }), match({ itemId: 2 })]
    orderedMatches(input)
    expect(input.map(m => m.itemId)).toEqual([1, 2])
  })

  it('FE-DAWARICH-ATLASMODEL-011: the order they arrive in does not change the order they are shown in', () => {
    // Both arms of both comparisons. A comparator that answers consistently one
    // way round and not the other sorts whatever the scan happened to return,
    // which is a list that reshuffles itself between two identical scans.
    const ticked = match({ itemId: 1, alreadyVisited: true })
    const openWish = match({ itemId: 2 })
    expect(orderedMatches([ticked, openWish]).map(m => m.itemId)).toEqual([2, 1])
    expect(orderedMatches([openWish, ticked]).map(m => m.itemId)).toEqual([2, 1])

    const older = match({ itemId: 3, match: { at: '2026-01-02T10:00:00Z', minutes: 30, distanceMeters: 10, points: 3 } })
    const newer = match({ itemId: 4, match: { at: '2026-06-02T10:00:00Z', minutes: 30, distanceMeters: 10, points: 3 } })
    expect(orderedMatches([older, newer]).map(m => m.itemId)).toEqual([4, 3])
    expect(orderedMatches([newer, older]).map(m => m.itemId)).toEqual([4, 3])
  })

  it('FE-DAWARICH-ATLASMODEL-012: two wishes reached in the same moment both survive the sort', () => {
    // The comparator never answers 0, so equal timestamps are reported as "swap"
    // in both directions. Ordering them either way is fine; losing one is not.
    const at = '2026-08-02T11:00:00Z'
    const ordered = orderedMatches([
      match({ itemId: 1, match: { at, minutes: 95, distanceMeters: 30, points: 40 } }),
      match({ itemId: 2, match: { at, minutes: 120, distanceMeters: 55, points: 51 } }),
    ])
    expect(ordered.map(m => m.itemId).sort((a, b) => a - b)).toEqual([1, 2])
  })
})

describe('newCountries', () => {
  it('FE-DAWARICH-ATLASMODEL-006: only the ones a confirmation would actually change', () => {
    const offered = newCountries([
      country({ countryCode: 'DE', alreadyVisited: true }),
      country({ countryCode: 'NL' }),
    ])
    expect(offered.map(c => c.countryCode)).toEqual(['NL'])
  })
})

describe('countryLabel', () => {
  it('FE-DAWARICH-ATLASMODEL-007: names the country in the reader\'s language', () => {
    expect(countryLabel('NL', 'Netherlands', 'de')).toBe('Niederlande')
  })

  it('FE-DAWARICH-ATLASMODEL-008: falls back to Dawarich\'s own spelling for a code it cannot name', () => {
    // Not an ISO region: Intl either throws or echoes it back, and neither is a
    // name a reader would recognise.
    expect(countryLabel('ZZZZ', 'Freedonia', 'en')).toBe('Freedonia')
  })

  it('FE-DAWARICH-ATLASMODEL-013: a runtime whose Intl names nothing still labels the row', () => {
    // The other half of the fallback, and the one no desktop browser reproduces:
    // a WebView that ships Intl.DisplayNames with a partial region table answers
    // `undefined` instead of throwing, and an empty string beside a flag is a
    // row nobody can identify.
    const real = Intl.DisplayNames
    Object.defineProperty(Intl, 'DisplayNames', {
      configurable: true,
      writable: true,
      value: class {
        of(): string | undefined {
          return undefined
        }
      },
    })
    try {
      expect(countryLabel('NL', 'Netherlands', 'en')).toBe('Netherlands')
    } finally {
      Object.defineProperty(Intl, 'DisplayNames', { configurable: true, writable: true, value: real })
    }
  })
})

describe('cityLine', () => {
  it('FE-DAWARICH-ATLASMODEL-009: lists the first few cities and stops', () => {
    const cities = ['Cologne', 'Bonn', 'Aachen', 'Trier'].map(name => ({
      name,
      minutes: 60,
      lastSeenAt: '2026-09-01T10:00:00Z',
    }))
    expect(cityLine(cities)).toBe('Cologne, Bonn, Aachen')
    expect(cityLine(cities, 1)).toBe('Cologne')
    expect(cityLine([])).toBe('')
  })
})

describe('formatDistance', () => {
  it('FE-DAWARICH-ATLASMODEL-010: metres up to a kilometre, then kilometres with one decimal', () => {
    expect(formatDistance(49.4, t)).toBe('dawarich.bucket.metersAway:{"meters":49}')
    expect(formatDistance(999, t)).toBe('dawarich.bucket.metersAway:{"meters":999}')
    expect(formatDistance(1400, t)).toBe('dawarich.bucket.kilometersAway:{"km":"1.4"}')
  })

  it('FE-DAWARICH-ATLASMODEL-014: exactly a kilometre is already a kilometre', () => {
    // The switch is `< 1000`, so 1000 belongs to the other unit. Off by one here
    // reads as "1000 m away", which is the phrasing the rule exists to avoid.
    expect(formatDistance(1000, t)).toBe('dawarich.bucket.kilometersAway:{"km":"1.0"}')
    // One decimal, rounded, not truncated: 1049 and 1051 are not the same walk.
    expect(formatDistance(1049, t)).toBe('dawarich.bucket.kilometersAway:{"km":"1.0"}')
    expect(formatDistance(1051, t)).toBe('dawarich.bucket.kilometersAway:{"km":"1.1"}')
  })
})
