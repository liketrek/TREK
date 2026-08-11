import { describe, it, expect } from 'vitest'
import { getGoogleMapsUrlForPlace } from './placeGoogleMaps'

const base = { name: 'Eiffel Tower', lat: 48.8584, lng: 2.2945, google_place_id: null, google_ftid: null } as any

describe('getGoogleMapsUrlForPlace', () => {
  it('FE-PLACE-GMAPS-001: uses a valid ftid for a precise /place link', () => {
    const url = getGoogleMapsUrlForPlace({ ...base, google_ftid: '0x47e66e2964e34e2d:0x8ddca9ee380ef7e0' })
    expect(url).toBe('https://www.google.com/maps/place/?q=Eiffel%20Tower&ftid=0x47e66e2964e34e2d:0x8ddca9ee380ef7e0')
  })

  it('FE-PLACE-GMAPS-002: falls back to query_place_id when there is no ftid', () => {
    const url = getGoogleMapsUrlForPlace({ ...base, google_place_id: 'ChIJ123' })
    expect(url).toBe('https://www.google.com/maps/search/?api=1&query=Eiffel%20Tower&query_place_id=ChIJ123')
  })

  it('FE-PLACE-GMAPS-003: ignores a malformed/hostile ftid and falls through to the place id', () => {
    const url = getGoogleMapsUrlForPlace({ ...base, google_ftid: '0xAB&q=evil', google_place_id: 'ChIJ123' })
    expect(url).toBe('https://www.google.com/maps/search/?api=1&query=Eiffel%20Tower&query_place_id=ChIJ123')
  })

  it('FE-PLACE-GMAPS-004: uses the details URL when there is no ftid or place id', () => {
    const url = getGoogleMapsUrlForPlace(base, 'https://maps.google.com/?cid=123')
    expect(url).toBe('https://maps.google.com/?cid=123')
  })

  it('FE-PLACE-GMAPS-005: searches by name and address when Google knows the place by neither id', () => {
    // #1278: coordinates alone open a nameless pin rather than the place, and
    // Google documents query=PLACE_NAME,ADDRESS for precisely this case.
    const url = getGoogleMapsUrlForPlace({ ...base, address: 'Champ de Mars, 75007 Paris' })
    expect(url).toBe('https://www.google.com/maps/search/?api=1&query=Eiffel%20Tower%2C%20Champ%20de%20Mars%2C%2075007%20Paris')
  })

  it('FE-PLACE-GMAPS-005b: a name with no address still falls back to coordinates', () => {
    // "Central Station" on its own would happily match a different city; the
    // position is the safer answer even though the pin carries no label.
    const url = getGoogleMapsUrlForPlace(base)
    expect(url).toBe('https://www.google.com/maps/search/?api=1&query=48.8584,2.2945')
  })

  it('FE-PLACE-GMAPS-006: returns null for no place or no location', () => {
    expect(getGoogleMapsUrlForPlace(null)).toBeNull()
    expect(getGoogleMapsUrlForPlace({ ...base, lat: null, lng: null })).toBeNull()
  })

  it('FE-PLACE-GMAPS-007: an address alone carries the link even without coordinates', () => {
    const url = getGoogleMapsUrlForPlace({ ...base, lat: null, lng: null, address: 'Champ de Mars, 75007 Paris' })
    expect(url).toBe('https://www.google.com/maps/search/?api=1&query=Eiffel%20Tower%2C%20Champ%20de%20Mars%2C%2075007%20Paris')
  })
})
