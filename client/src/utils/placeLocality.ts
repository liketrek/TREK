import { getIntlLanguage } from '@trek/shared'

export interface PlaceLocality {
  /** The country's name in the reader's language, or as the address spells it. */
  country: string | null
  /** State, province or prefecture, as resolved from the position. */
  region: string | null
}

interface LocatedPlace {
  address?: string | null
  country_code?: string | null
  region_name?: string | null
}

const hasDigits = (part: string) => /\d/.test(part)
const hasLetters = (part: string) => /\p{L}/u.test(part)

/** The last part of a formatted address is the country, when it reads like one. */
function countryFromAddress(address: string | null | undefined): string | null {
  const parts = (address ?? '').split(',').map(p => p.trim()).filter(Boolean)
  if (parts.length < 2) return null
  const last = parts[parts.length - 1]
  return !hasDigits(last) && hasLetters(last) ? last : null
}

/**
 * Where a place lies, for filtering the trip's places (#2537).
 *
 * Both halves come from the position the server resolved, which is exact: the country
 * code, named in the reader's language, and the region. A city is not offered, since a
 * formatted address cannot tell one apart reliably (it names the borough before Berlin
 * and the county before Schönefeld). A place not resolved yet falls back to the country
 * its address ends on.
 */
export function placeLocality(place: LocatedPlace, language: string): PlaceLocality {
  let country: string | null = null
  if (place.country_code) {
    try { country = new Intl.DisplayNames([getIntlLanguage(language)], { type: 'region' }).of(place.country_code.toUpperCase()) ?? null } catch { country = null }
  }
  return {
    country: country ?? countryFromAddress(place.address),
    region: place.region_name || null,
  }
}
