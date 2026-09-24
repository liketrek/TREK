import type { DawarichAtlasCountry, DawarichBucketMatch } from '@trek/shared'

/**
 * Pure shaping for the Atlas dialog — no React, so the ordering, the naming and
 * the window arithmetic can be tested without rendering anything.
 */

/**
 * A year back from the given moment.
 *
 * Long enough to cover the trips someone would be filling in, short enough that
 * a self-hosted instance is not asked to aggregate a decade of points for a card
 * nobody was looking at. Takes `now` rather than reading the clock so the window
 * is testable.
 */
export function countryWindow(now: Date): { from: string; to: string } {
  const from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
  return { from: from.toISOString(), to: now.toISOString() }
}

/**
 * The wishes worth showing, best first.
 *
 * Only entries the recordings actually found; the ones still open lead, because
 * they are the ones the reader can act on, and within each group the most recent
 * visit comes first — a wish reached last week is easier to confirm than one
 * reached ten months ago.
 */
export function orderedMatches(matches: DawarichBucketMatch[]): DawarichBucketMatch[] {
  return matches
    .filter(match => match.match !== null)
    .slice()
    .sort((a, b) => {
      if (a.alreadyVisited !== b.alreadyVisited) return a.alreadyVisited ? 1 : -1
      return (b.match?.at ?? '') < (a.match?.at ?? '') ? -1 : 1
    })
}

/** The countries a confirmation would actually change. */
export function newCountries(countries: DawarichAtlasCountry[]): DawarichAtlasCountry[] {
  return countries.filter(country => !country.alreadyVisited)
}

/**
 * A country's name in the reader's language, falling back to Dawarich's own
 * spelling.
 *
 * `Intl.DisplayNames` is missing on older WebViews and throws on a code it does
 * not know, so both are caught — the Atlas page's own resolver does the same.
 */
export function countryLabel(code: string, sourceName: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) || sourceName
  } catch {
    return sourceName
  }
}

/**
 * The first few cities, as one line.
 *
 * Three is what fits beside a flag at the width the dialog has on a phone, and
 * the count badge beside it already says how many there were in total.
 */
export function cityLine(cities: DawarichAtlasCountry['cities'], limit = 3): string {
  return cities
    .slice(0, limit)
    .map(city => city.name)
    .join(', ')
}

/**
 * A distance a person would say out loud: metres up to a kilometre, then one
 * decimal of a kilometre. `1400 m away` is a measurement; `1.4 km away` is how
 * far it was.
 */
export function formatDistance(
  meters: number,
  t: (key: string, params?: Record<string, unknown>) => string,
): string {
  return meters < 1000
    ? t('dawarich.bucket.metersAway', { meters: Math.round(meters) })
    : t('dawarich.bucket.kilometersAway', { km: (meters / 1000).toFixed(1) })
}
