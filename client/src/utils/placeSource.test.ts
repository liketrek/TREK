import { describe, expect, it } from 'vitest'
import { googleHoldsSlot, offersGoogleRetry, placesGoogleOnlyHint, selectGoogleHoldsSlot, sourceLabelFor } from './placeSource'

describe('offersGoogleRetry', () => {
  it('FE-PLACESOURCE-001: offers Google for a list the index or OpenStreetMap answered, only where Google answers', () => {
    expect(offersGoogleRetry('trek-places+openstreetmap', true)).toBe(true)
    expect(offersGoogleRetry('openstreetmap', true)).toBe(true)
    expect(offersGoogleRetry('trek-places+plugin', true)).toBe(true)
    expect(offersGoogleRetry('trek-places+openstreetmap', false)).toBe(false)
  })

  it('FE-PLACESOURCE-002: a list Google produced, the offline cache and no list at all have nowhere further to go', () => {
    expect(offersGoogleRetry('google', true)).toBe(false)
    expect(offersGoogleRetry('google+plugin', true)).toBe(false)
    expect(offersGoogleRetry('offline-cache', true)).toBe(false)
    expect(offersGoogleRetry('', true)).toBe(false)
  })
})

describe('googleHoldsSlot', () => {
  it('FE-PLACESOURCE-004: a key holds the slot under auto and google, not under Amap or OpenStreetMap', () => {
    expect(googleHoldsSlot(true, 'auto')).toBe(true)
    expect(googleHoldsSlot(true, 'google')).toBe(true)
    // A stored key still serves photos and details here, but the server never
    // walks the Google chain for a search, so a link that offered it would be dead.
    expect(googleHoldsSlot(true, 'amap')).toBe(false)
    expect(googleHoldsSlot(true, 'openstreetmap')).toBe(false)
    expect(googleHoldsSlot(false, 'google')).toBe(false)
    // Unrecognised reads as auto, as the server reads it.
    expect(googleHoldsSlot(true, '')).toBe(true)
  })

  it('FE-PLACESOURCE-005: the store selector asks the same question of the auth state', () => {
    expect(selectGoogleHoldsSlot({ hasMapsKey: true, placesProvider: 'auto' })).toBe(true)
    expect(selectGoogleHoldsSlot({ hasMapsKey: true, placesProvider: 'openstreetmap' })).toBe(false)
    expect(selectGoogleHoldsSlot({ hasMapsKey: false, placesProvider: 'auto' })).toBe(false)
  })
})

describe('placesGoogleOnlyHint', () => {
  it('FE-PLACESOURCE-006: names what the admin has to do before the switch does anything', () => {
    expect(placesGoogleOnlyHint(false, 'auto')).toBe('admin.placesGoogleOnly.missingKey')
    expect(placesGoogleOnlyHint(false, 'openstreetmap')).toBe('admin.placesGoogleOnly.missingKey')
    expect(placesGoogleOnlyHint(true, 'amap')).toBe('admin.placesGoogleOnly.otherProvider')
    expect(placesGoogleOnlyHint(true, 'openstreetmap')).toBe('admin.placesGoogleOnly.otherProvider')
    expect(placesGoogleOnlyHint(true, 'auto')).toBe('admin.placesGoogleOnly.subtitle')
    expect(placesGoogleOnlyHint(true, 'google')).toBe('admin.placesGoogleOnly.subtitle')
  })
})

describe('sourceLabelFor', () => {
  it('FE-PLACESOURCE-003: a row names its own index, else the list it came from', () => {
    const t = (k: string) => k
    expect(sourceLabelFor({ source: 'openstreetmap' }, 'trek-places+openstreetmap', t)).toBe('OpenStreetMap')
    expect(sourceLabelFor({}, 'google', t)).toBe('Google')
    expect(sourceLabelFor({}, 'amap', t)).toBe('places.source.amap')
  })
})
