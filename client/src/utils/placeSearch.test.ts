// FE-UTIL-PLACESEARCH-001 to FE-UTIL-PLACESEARCH-004
import { describe, it, expect } from 'vitest'
import { foldForSearch, placeMatchesSearch, textMatchesSearch } from './placeSearch'

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

describe('search without accents (#3075)', () => {
  it('FE-UTIL-PLACESEARCH-005: a query without accents finds the accented name, and the other way round', () => {
    for (const [query, name] of [['Obidos', 'Óbidos'], ['Evora', 'Évora'], ['Sao Bras', 'São Brás'], ['Loule', 'Loulé']]) {
      expect(placeMatchesSearch({ name, address: null, description: null, notes: null }, query)).toBe(true)
      expect(placeMatchesSearch({ name: query, address: null, description: null, notes: null }, name)).toBe(true)
    }
  })

  it('FE-UTIL-PLACESEARCH-006: letters with the mark built in fold to their plain spelling', () => {
    expect(foldForSearch('Straße')).toBe('strasse')
    expect(foldForSearch('Łódź')).toBe('lodz')
    expect(foldForSearch('Ærø')).toBe('aero')
    expect(textMatchesSearch(['Kraków'], 'krakow')).toBe(true)
  })

  it('FE-UTIL-PLACESEARCH-007: marks that change a word outside Latin script stay, so が is not か', () => {
    expect(foldForSearch('が')).toBe('が')
    expect(textMatchesSearch(['かき'], 'がき')).toBe(false)
    expect(foldForSearch('한국')).toBe('한국')
  })
})
