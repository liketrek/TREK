// FE-PLANNER-LOCFILTER-001 to FE-PLANNER-LOCFILTER-002
import { describe, it, expect } from 'vitest'
import { localityGroups, matchesLocality } from './placeLocalityFilter'

describe('localityGroups', () => {
  it('FE-PLANNER-LOCFILTER-001: groups by country and region, most places first, unknown countries left out', () => {
    const groups = localityGroups([
      { country: 'Germany', region: 'Berlin' },
      { country: 'Germany', region: 'Berlin' },
      { country: 'Germany', region: 'Brandenburg' },
      { country: 'France', region: 'Île-de-France' },
      { country: null, region: null },
    ])
    expect(groups).toEqual([
      { country: 'Germany', count: 3, regions: [{ region: 'Berlin', count: 2 }, { region: 'Brandenburg', count: 1 }] },
      { country: 'France', count: 1, regions: [{ region: 'Île-de-France', count: 1 }] },
    ])
  })
})

describe('matchesLocality', () => {
  it('FE-PLANNER-LOCFILTER-002: a country filter takes all its regions, a region filter only that one', () => {
    const berlin = { country: 'Germany', region: 'Berlin' }
    expect(matchesLocality(berlin, { country: 'Germany', region: null })).toBe(true)
    expect(matchesLocality(berlin, { country: 'Germany', region: 'Brandenburg' })).toBe(false)
    expect(matchesLocality(berlin, { country: 'France', region: null })).toBe(false)
    expect(matchesLocality(undefined, { country: 'Germany', region: null })).toBe(false)
  })
})
