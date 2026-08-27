import { describe, it, expect } from 'vitest'
import {
  filterPool, firstPlannedDayNumbers, matchesCategoryFilter, matchesSearch,
  plannedPlaceIds, poolCounts,
} from './placesBrowserModel'
import type { AssignmentsMap, Day, Place } from '../../../../types'

const mkPlace = (id: number, over: Partial<Place> = {}): Place =>
  ({ id, name: `Place ${id}`, lat: 0, lng: 0, address: null, category_id: null, ...over } as Place)

describe('placesBrowserModel — planned pool', () => {
  const places = [mkPlace(1), mkPlace(2), mkPlace(3)]
  const plannedIds = new Set([1, 3]) // 1 and 3 are assigned to a day
  const noCats = new Set<string>()

  it('MOBILE-POOL-planned: keeps only planned places', () => {
    const out = filterPool(places, { filter: 'planned', categoryFilters: noCats, search: '', plannedIds })
    expect(out.map(p => p.id)).toEqual([1, 3])
  })

  it('MOBILE-POOL-unplanned: keeps only unplanned places (unchanged)', () => {
    const out = filterPool(places, { filter: 'unplanned', categoryFilters: noCats, search: '', plannedIds })
    expect(out.map(p => p.id)).toEqual([2])
  })

  it('MOBILE-POOL-all: keeps everything', () => {
    const out = filterPool(places, { filter: 'all', categoryFilters: noCats, search: '', plannedIds })
    expect(out.map(p => p.id)).toEqual([1, 2, 3])
  })

  it('MOBILE-POOL-planned+search: planned pool still honors the search box', () => {
    const named = [mkPlace(1, { name: 'Louvre' }), mkPlace(3, { name: 'Eiffel' })]
    const out = filterPool(named, { filter: 'planned', categoryFilters: noCats, search: 'eiff', plannedIds })
    expect(out.map(p => p.id)).toEqual([3])
  })

  it('MOBILE-POOL-counts: poolCounts reports planned alongside all/unplanned', () => {
    const c = poolCounts(places, noCats, '', plannedIds)
    expect(c.all).toBe(3)
    expect(c.planned).toBe(2)
    expect(c.unplanned).toBe(1)
  })
})

// FE-MOB-PMODEL-001 to FE-MOB-PMODEL-012

const mkAssignment = (id: number, placeId: number | null) =>
  ({ id, place: placeId == null ? null : { id: placeId, name: `Place ${placeId}` } })

const mkDays = (spec: [number, number | null][]): Day[] =>
  spec.map(([id, dayNumber]) => ({ id, day_number: dayNumber }) as Day)

describe('placesBrowserModel — assignment lookups', () => {
  it('FE-MOB-PMODEL-001: plannedPlaceIds collects every assigned place across all days', () => {
    const assignments = {
      '1': [mkAssignment(10, 5), mkAssignment(11, 6)],
      '2': [mkAssignment(12, 5)],
    } as unknown as AssignmentsMap
    expect([...plannedPlaceIds(assignments)].sort()).toEqual([5, 6])
  })

  it('FE-MOB-PMODEL-002: plannedPlaceIds skips assignments whose place did not join', () => {
    const assignments = { '1': [mkAssignment(10, null), mkAssignment(11, 7)] } as unknown as AssignmentsMap
    expect([...plannedPlaceIds(assignments)]).toEqual([7])
  })

  it('FE-MOB-PMODEL-003: plannedPlaceIds is empty without assignments', () => {
    expect(plannedPlaceIds({} as AssignmentsMap).size).toBe(0)
  })

  it('FE-MOB-PMODEL-004: firstPlannedDayNumbers keeps the lowest day a place appears on', () => {
    const assignments = {
      '30': [mkAssignment(10, 5)],
      '10': [mkAssignment(11, 5)],
      '20': [mkAssignment(12, 6)],
    } as unknown as AssignmentsMap
    const days = mkDays([[10, 1], [20, 2], [30, 3]])
    const result = firstPlannedDayNumbers(assignments, days)
    expect(result.get(5)).toBe(1)
    expect(result.get(6)).toBe(2)
  })

  it('FE-MOB-PMODEL-005: firstPlannedDayNumbers falls back to the array position without a day_number', () => {
    const assignments = { '20': [mkAssignment(10, 5)] } as unknown as AssignmentsMap
    const days = mkDays([[10, null], [20, null]])
    expect(firstPlannedDayNumbers(assignments, days).get(5)).toBe(2)
  })

  it('FE-MOB-PMODEL-006: firstPlannedDayNumbers ignores assignments of a day the trip no longer has', () => {
    const assignments = {
      '99': [mkAssignment(10, 5)],
      '10': [mkAssignment(11, 6), mkAssignment(12, null)],
    } as unknown as AssignmentsMap
    const result = firstPlannedDayNumbers(assignments, mkDays([[10, 1]]))
    expect(result.has(5)).toBe(false)
    expect(result.get(6)).toBe(1)
  })
})

describe('placesBrowserModel — predicates', () => {
  it('FE-MOB-PMODEL-007: an empty category set matches everything', () => {
    expect(matchesCategoryFilter(mkPlace(1), new Set())).toBe(true)
    expect(matchesCategoryFilter(mkPlace(2, { category_id: 4 }), new Set())).toBe(true)
  })

  it('FE-MOB-PMODEL-008: a category set matches on the stringified id', () => {
    const filters = new Set(['4'])
    expect(matchesCategoryFilter(mkPlace(1, { category_id: 4 }), filters)).toBe(true)
    expect(matchesCategoryFilter(mkPlace(2, { category_id: 5 }), filters)).toBe(false)
    expect(matchesCategoryFilter(mkPlace(3), filters)).toBe(false)
  })

  it('FE-MOB-PMODEL-009: places without a category need the uncategorized entry', () => {
    expect(matchesCategoryFilter(mkPlace(1), new Set(['uncategorized']))).toBe(true)
    expect(matchesCategoryFilter(mkPlace(2, { category_id: 4 }), new Set(['uncategorized']))).toBe(false)
  })

  it('FE-MOB-PMODEL-010: search is case-insensitive over name and address', () => {
    const place = mkPlace(1, { name: 'Louvre', address: 'Rue de Rivoli' })
    expect(matchesSearch(place, '')).toBe(true)
    expect(matchesSearch(place, 'LOUV')).toBe(true)
    expect(matchesSearch(place, 'rivoli')).toBe(true)
    expect(matchesSearch(place, 'eiffel')).toBe(false)
    // A null address must not blow up the lookup.
    expect(matchesSearch(mkPlace(2, { name: 'Eiffel' }), 'rivoli')).toBe(false)
  })
})

describe('placesBrowserModel — tracks pool', () => {
  const places = [
    mkPlace(1, { name: 'Ridge', route_geometry: 'abc', category_id: 4 }),
    mkPlace(2, { name: 'Museum', category_id: 4 }),
    mkPlace(3, { name: 'River', route_geometry: 'def' }),
  ]
  const plannedIds = new Set([1])

  it('FE-MOB-PMODEL-011: the tracks filter keeps only places carrying a geometry', () => {
    const out = filterPool(places, { filter: 'tracks', categoryFilters: new Set(), search: '', plannedIds })
    expect(out.map(p => p.id)).toEqual([1, 3])
  })

  it('FE-MOB-PMODEL-012: the tracks filter still honors category and search', () => {
    const out = filterPool(places, { filter: 'tracks', categoryFilters: new Set(['4']), search: 'rid', plannedIds })
    expect(out.map(p => p.id)).toEqual([1])
  })

  it('FE-MOB-PMODEL-013: poolCounts counts tracks on the category+search base set', () => {
    const c = poolCounts(places, new Set(['4']), '', plannedIds)
    expect(c.all).toBe(2)
    expect(c.tracks).toBe(1)
    expect(c.planned).toBe(1)
    expect(c.unplanned).toBe(1)
  })

  // #2072 — the phone pool has to agree with the desktop one; both ask the same
  // shared helper now.
  it('FE-MOB-PMODEL-014: a stay and a day-anchored booking both count as planned', () => {
    const ids = plannedPlaceIds(
      {},
      [{ place_id: 7, start_day_id: 10, end_day_id: 12 }],
      [{ place_id: 8, day_id: 10 }, { place_id: 9, day_id: null }],
    )
    expect([...ids].sort((a, b) => a - b)).toEqual([7, 8])
  })

})
