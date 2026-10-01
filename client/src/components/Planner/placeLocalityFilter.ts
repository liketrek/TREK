import type { PlaceLocality } from '../../utils/placeLocality'

/** A country on its own, or one region in it. */
export interface LocalityFilter {
  country: string
  region: string | null
}

export interface LocalityGroup {
  country: string
  count: number
  regions: { region: string; count: number }[]
}

/**
 * The trip's places by country and region, for the filter's list (#2537). Countries by
 * how many places they hold, then by name; the same for the regions inside each. Places
 * whose address names no country are left out, they have nothing to be filtered by.
 */
export function localityGroups(localities: PlaceLocality[]): LocalityGroup[] {
  const byCountry = new Map<string, { count: number; regions: Map<string, number> }>()
  for (const { country, region } of localities) {
    if (!country) continue
    const entry = byCountry.get(country) ?? { count: 0, regions: new Map<string, number>() }
    entry.count++
    if (region) entry.regions.set(region, (entry.regions.get(region) ?? 0) + 1)
    byCountry.set(country, entry)
  }
  const byCountThenName = <T extends { count: number }>(a: T, b: T, na: string, nb: string) => b.count - a.count || na.localeCompare(nb)
  return [...byCountry.entries()]
    .map(([country, { count, regions }]) => ({
      country,
      count,
      regions: [...regions.entries()].map(([region, n]) => ({ region, count: n })).sort((a, b) => byCountThenName(a, b, a.region, b.region)),
    }))
    .sort((a, b) => byCountThenName(a, b, a.country, b.country))
}

export function matchesLocality(locality: PlaceLocality | undefined, filter: LocalityFilter): boolean {
  if (!locality || locality.country !== filter.country) return false
  return filter.region == null || locality.region === filter.region
}
