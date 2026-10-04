import { describe, expect, it } from 'vitest'
import { stayPlaces } from './stayPlaces'

// FE-UTIL-STAYPLACES-001 to FE-UTIL-STAYPLACES-003

describe('stayPlaces', () => {
  const hotel = { id: 1, route_geometry: null }
  const hut = { id: 2 }
  const track = { id: 3, route_geometry: '[[50.1,7.6],[50.2,7.7]]' }

  it('FE-UTIL-STAYPLACES-001: offers every place but an imported track', () => {
    expect(stayPlaces([hotel, hut, track]).map(p => p.id)).toEqual([1, 2])
    expect(stayPlaces([hotel, hut, track], '').map(p => p.id)).toEqual([1, 2])
    expect(stayPlaces([hotel, hut, track], null).map(p => p.id)).toEqual([1, 2])
  })

  it('FE-UTIL-STAYPLACES-002: keeps the track a stay already names, by number or by text', () => {
    expect(stayPlaces([hotel, track], 3).map(p => p.id)).toEqual([1, 3])
    expect(stayPlaces([hotel, track], '3').map(p => p.id)).toEqual([1, 3])
  })

  it('FE-UTIL-STAYPLACES-003: a stay at an ordinary place lets no track in', () => {
    expect(stayPlaces([hotel, track], 1).map(p => p.id)).toEqual([1])
  })
})
