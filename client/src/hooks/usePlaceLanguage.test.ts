import { describe, it, expect } from 'vitest'
import { placeLanguage } from './usePlaceLanguage'

describe('placeLanguage', () => {
  it('FE-HOOK-PLACELANG-001: a chosen language wins over the app language', () => {
    expect(placeLanguage('de', 'en')).toBe('en')
    expect(placeLanguage('de', ' ja ')).toBe('ja')
  })

  it('FE-HOOK-PLACELANG-002: no choice follows the app language', () => {
    expect(placeLanguage('de', '')).toBe('de')
    expect(placeLanguage('de', '  ')).toBe('de')
    expect(placeLanguage('de', undefined)).toBe('de')
    expect(placeLanguage('de', null)).toBe('de')
  })
})
