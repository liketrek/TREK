// FE-UTIL-LOCALITY-001 to FE-UTIL-LOCALITY-003
import { describe, it, expect } from 'vitest'
import { placeLocality } from './placeLocality'

describe('placeLocality', () => {
  it('FE-UTIL-LOCALITY-001: a resolved place is named in the reader language with its region', () => {
    expect(placeLocality({ country_code: 'DE', region_name: 'Brandenburg' }, 'de')).toEqual({ country: 'Deutschland', region: 'Brandenburg' })
    expect(placeLocality({ country_code: 'fr', region_name: 'Île-de-France' }, 'en')).toEqual({ country: 'France', region: 'Île-de-France' })
  })

  it('FE-UTIL-LOCALITY-002: an unresolved place falls back to the country its address ends on', () => {
    expect(placeLocality({ address: 'Pariser Platz, 10117 Berlin, Germany' }, 'en')).toEqual({ country: 'Germany', region: null })
    expect(placeLocality({ address: 'Mildred-Harnack-Straße 11, 10243 Berlin' }, 'en')).toEqual({ country: null, region: null })
  })

  it('FE-UTIL-LOCALITY-003: nothing to go on gives nulls', () => {
    expect(placeLocality({ address: null }, 'en')).toEqual({ country: null, region: null })
  })
})
