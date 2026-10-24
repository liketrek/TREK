// FE-UTIL-PLACESEARCH-001 to FE-UTIL-PLACESEARCH-004
import { describe, it, expect } from 'vitest'
import { placeMatchesSearch } from './placeSearch'

const place = {
  name: 'Café Central',
  address: 'Herrengasse 14, Wien',
  description: 'Classic Viennese coffee house',
  notes: 'Book a table ahead',
}

describe('placeMatchesSearch', () => {
  it('FE-UTIL-PLACESEARCH-001: an empty or blank query matches every place', () => {
    expect(placeMatchesSearch(place, '')).toBe(true)
    expect(placeMatchesSearch(place, '   ')).toBe(true)
  })

  it('FE-UTIL-PLACESEARCH-002: finds the name and the address, ignoring case', () => {
    expect(placeMatchesSearch(place, 'central')).toBe(true)
    expect(placeMatchesSearch(place, 'HERRENGASSE')).toBe(true)
  })

  it('FE-UTIL-PLACESEARCH-003: also finds the description and the notes (#2252)', () => {
    expect(placeMatchesSearch(place, 'viennese')).toBe(true)
    expect(placeMatchesSearch(place, 'table ahead')).toBe(true)
  })

  it('FE-UTIL-PLACESEARCH-004: missing fields are skipped, and a miss is a miss', () => {
    const bare = { name: 'Stop', address: null, description: undefined, notes: null }
    expect(placeMatchesSearch(bare, 'stop ')).toBe(true)
    expect(placeMatchesSearch(bare, 'nowhere')).toBe(false)
    expect(placeMatchesSearch(place, 'pizza')).toBe(false)
  })
})
