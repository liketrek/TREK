import { describe, it, expect } from 'vitest'
import { buildPlace } from '../../tests/helpers/factories'
import {
  RATING_FLOORS, countActivePlacesFilters, matchesCategoryFilter, matchesPlacesFilter,
  matchesPoolFilter, matchesRatingFloor,
} from './placesFilter'

const NONE = new Set<string>()

describe('placesFilter', () => {
  it('FE-UTIL-PLFILTER-001: offers the same floors as the collections bar', () => {
    expect(RATING_FLOORS).toEqual(['all', 5, 4, 3, 2, 1])
  })

  it('FE-UTIL-PLFILTER-002: an empty category set keeps everything; "uncategorized" stands for no category', () => {
    const tagged = buildPlace({ category_id: 4 })
    const bare = buildPlace({ category_id: null })
    expect(matchesCategoryFilter(tagged, NONE)).toBe(true)
    expect(matchesCategoryFilter(tagged, new Set(['4']))).toBe(true)
    expect(matchesCategoryFilter(tagged, new Set(['5']))).toBe(false)
    expect(matchesCategoryFilter(bare, new Set(['4']))).toBe(false)
    expect(matchesCategoryFilter(bare, new Set(['uncategorized']))).toBe(true)
  })

  it('FE-UTIL-PLFILTER-003: the rating floor keeps places at or above it and drops the unrated', () => {
    expect(matchesRatingFloor(buildPlace({ rating_avg: null }), 'all')).toBe(true)
    expect(matchesRatingFloor(buildPlace({ rating_avg: null }), 1)).toBe(false)
    expect(matchesRatingFloor(buildPlace({ rating_avg: 4 }), 4)).toBe(true)
    expect(matchesRatingFloor(buildPlace({ rating_avg: 3.9 }), 4)).toBe(false)
  })

  it('FE-UTIL-PLFILTER-004: the pool filter reads the planned sets, and a null set filters nothing', () => {
    const planned = buildPlace({ id: 1 })
    const loose = buildPlace({ id: 2, route_geometry: '[[1,2],[3,4]]' })
    const ids = new Set([1])
    expect(matchesPoolFilter(planned, 'all', { plannedIds: ids })).toBe(true)
    expect(matchesPoolFilter(planned, 'unplanned', { plannedIds: ids })).toBe(false)
    expect(matchesPoolFilter(loose, 'unplanned', { plannedIds: ids })).toBe(true)
    expect(matchesPoolFilter(planned, 'planned', { plannedIds: ids })).toBe(true)
    expect(matchesPoolFilter(loose, 'planned', { plannedIds: ids })).toBe(false)
    expect(matchesPoolFilter(planned, 'tracks', { plannedIds: ids })).toBe(false)
    expect(matchesPoolFilter(loose, 'tracks', { plannedIds: ids })).toBe(true)
    expect(matchesPoolFilter(planned, 'unplanned', { plannedIds: null })).toBe(true)
    expect(matchesPoolFilter(loose, 'planned', { plannedIds: null })).toBe(true)
  })

  it('FE-UTIL-PLFILTER-005: "planned" can be narrowed to the open day while "unplanned" stays trip-wide', () => {
    const elsewhere = buildPlace({ id: 1 })
    const sets = { plannedIds: new Set([1, 2]), plannedFilterIds: new Set([2]) }
    expect(matchesPoolFilter(elsewhere, 'planned', sets)).toBe(false)
    expect(matchesPoolFilter(elsewhere, 'unplanned', sets)).toBe(false)
  })

  it('FE-UTIL-PLFILTER-006: the combined matcher needs pool, category and rating to agree', () => {
    const place = buildPlace({ id: 1, category_id: 4, rating_avg: 4.5 })
    const sets = { plannedIds: new Set<number>() }
    const state = { filter: 'unplanned', categoryFilters: new Set(['4']), ratingFilter: 4 as const }
    expect(matchesPlacesFilter(place, state, sets)).toBe(true)
    expect(matchesPlacesFilter(place, { ...state, ratingFilter: 5 }, sets)).toBe(false)
    expect(matchesPlacesFilter(place, { ...state, categoryFilters: new Set(['9']) }, sets)).toBe(false)
    expect(matchesPlacesFilter(place, state, { plannedIds: new Set([1]) })).toBe(false)
  })

  it('FE-UTIL-PLFILTER-007: counts each filter that narrows, the category set once', () => {
    expect(countActivePlacesFilters({ filter: 'all', categoryFilters: NONE, ratingFilter: 'all' })).toBe(0)
    expect(countActivePlacesFilters({ filter: 'planned', categoryFilters: NONE, ratingFilter: 'all' })).toBe(1)
    expect(countActivePlacesFilters({ filter: 'all', categoryFilters: new Set(['1', '2']), ratingFilter: 'all' })).toBe(1)
    expect(countActivePlacesFilters({ filter: 'tracks', categoryFilters: new Set(['1']), ratingFilter: 3 })).toBe(3)
  })
})
