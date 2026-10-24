// FE-PLANNER-SORT-001 to FE-PLANNER-SORT-003
import { afterEach, describe, expect, it } from 'vitest'
import { readPlacesSort, sortPlaces, writePlacesSort } from './placesSort'

const places = [
  { id: 3, name: 'Zoo', rating_avg: null, created_at: '2026-03-03', updated_at: '2026-03-04' },
  { id: 2, name: 'apple store', rating_avg: 4.5, created_at: '2026-02-02', updated_at: '2026-05-01' },
  { id: 1, name: 'Bakery 10', rating_avg: 4.5, created_at: '2026-01-01' },
  { id: 4, name: 'Bakery 9', rating_avg: 3, created_at: '2026-01-01' },
]
const ids = (list: { id: number }[]) => list.map(p => p.id)

describe('sortPlaces (#2093)', () => {
  afterEach(() => localStorage.clear())

  it('FE-PLANNER-SORT-001: newest keeps the list as it came, oldest turns it round', () => {
    expect(sortPlaces(places, 'newest')).toBe(places)
    expect(ids(sortPlaces(places, 'oldest'))).toEqual([1, 4, 2, 3])
  })

  it('FE-PLANNER-SORT-002: name ignores case and reads numbers as numbers; rating sinks the unrated; changed uses the update time', () => {
    expect(ids(sortPlaces(places, 'name', 'en'))).toEqual([2, 4, 1, 3])
    expect(ids(sortPlaces(places, 'rating'))).toEqual([2, 1, 4, 3])
    expect(ids(sortPlaces(places, 'updated'))).toEqual([2, 3, 4, 1])
  })

  it('FE-PLANNER-SORT-003: the choice is remembered, newest by clearing it, and junk reads as newest', () => {
    expect(readPlacesSort()).toBe('newest')
    writePlacesSort('rating')
    expect(readPlacesSort()).toBe('rating')
    writePlacesSort('newest')
    expect(localStorage.getItem('trek:places-sort')).toBeNull()
    localStorage.setItem('trek:places-sort', 'bogus')
    expect(readPlacesSort()).toBe('newest')
  })
})
