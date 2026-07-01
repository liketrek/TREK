import { describe, it, expect } from 'vitest'
import { getOpenStreetMapUrlForPlace } from './placeOpenStreetMap'

const base = { name: 'Eiffel Tower', lat: 48.8584, lng: 2.2945 } as any

describe('getOpenStreetMapUrlForPlace', () => {
  it('FE-PLACE-OSM-001: drops a marker at the coordinates', () => {
    const url = getOpenStreetMapUrlForPlace(base)
    expect(url).toBe('https://www.openstreetmap.org/?mlat=48.8584&mlon=2.2945#map=16/48.8584/2.2945')
  })

  it('FE-PLACE-OSM-002: keeps coordinate 0 (falsy but valid)', () => {
    const url = getOpenStreetMapUrlForPlace({ name: 'Null Island', lat: 0, lng: 0 })
    expect(url).toBe('https://www.openstreetmap.org/?mlat=0&mlon=0#map=16/0/0')
  })

  it('FE-PLACE-OSM-003: falls back to a name search when there are no coordinates', () => {
    const url = getOpenStreetMapUrlForPlace({ name: 'Café René', lat: null, lng: null })
    expect(url).toBe('https://www.openstreetmap.org/search?query=Caf%C3%A9%20Ren%C3%A9')
  })

  it('FE-PLACE-OSM-004: returns null with neither coordinates nor a name', () => {
    expect(getOpenStreetMapUrlForPlace({ name: '', lat: null, lng: null })).toBeNull()
    expect(getOpenStreetMapUrlForPlace(null)).toBeNull()
    expect(getOpenStreetMapUrlForPlace(undefined)).toBeNull()
  })
})
