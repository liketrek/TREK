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

const ADDRESS_ALIASES: Record<string, string> = { usa: 'US', 'u.s.a.': 'US', 'u.s.': 'US', uk: 'GB', 'u.k.': 'GB', uae: 'AE' }
const countryNameCache = new Map<string, Map<string, string>>()

/** Every country name (reader's language and English, lower case) mapped to its code. */
function countryNames(language: string): Map<string, string> {
  const cached = countryNameCache.get(language)
  if (cached) return cached
  const names = new Map<string, string>()
  try {
    const own = new Intl.DisplayNames([getIntlLanguage(language)], { type: 'region', fallback: 'none' })
    const english = new Intl.DisplayNames(['en'], { type: 'region', fallback: 'none' })
    for (let i = 65; i <= 90; i++) {
      for (let j = 65; j <= 90; j++) {
        const code = String.fromCharCode(i, j)
        const en = english.of(code)
        if (en) names.set(en.toLowerCase(), code)
      }
    }
    for (let i = 65; i <= 90; i++) {
      for (let j = 65; j <= 90; j++) {
        const code = String.fromCharCode(i, j)
        const name = own.of(code)
        if (name) names.set(name.toLowerCase(), code)
      }
    }
  } catch { /* no Intl.DisplayNames: nothing is recognised, so no fallback country */ }
  countryNameCache.set(language, names)
  return names
}

/**
 * The last part of a formatted address is the country, when it names one. A region or
 * city in that spot ("Shibuya City, Tokyo") is not a country and stays out of the filter.
 */
function countryFromAddress(address: string | null | undefined, language: string): string | null {
  const parts = (address ?? '').split(',').map(p => p.trim()).filter(Boolean)
  if (parts.length < 2) return null
  const last = parts[parts.length - 1]
  if (hasDigits(last) || !hasLetters(last)) return null
  const code = countryNames(language).get(last.toLowerCase()) ?? ADDRESS_ALIASES[last.toLowerCase()]
  if (!code) return null
  try { return new Intl.DisplayNames([getIntlLanguage(language)], { type: 'region' }).of(code) ?? last } catch { return last }
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
    country: country ?? countryFromAddress(place.address, language),
    region: place.region_name || null,
  }
}
