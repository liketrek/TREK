import apiClient from '../../api/client'
import iso31662 from 'iso-3166-2'

// Loads the subdivision (state/region) options for a holiday-calendar country.
//
// The subdivision list is sourced from ISO 3166-2 (proper names, complete per country)
// rather than inferred from which subdivisions happen to have a holiday this year — the
// latter silently dropped states with no state-specific holiday (e.g. US-WA, issue #1456).
// We only surface a list for countries that are actually region-partitioned, so countries
// with only nationwide holidays keep showing no region picker (and allow a country-level
// calendar, matching the server's applyHolidayCalendars behaviour).
export async function fetchRegionOptions(country: string): Promise<{ value: string; label: string }[]> {
  try {
    const year = new Date().getFullYear()
    const r = await apiClient.get(`/addons/vacay/holidays/${year}/${country}`)
    const hasRegions = r.data.some(h => h.counties && h.counties.length > 0)
    if (!hasRegions) return []

    const opts = new Map<string, string>() // ISO code -> display name
    const sub = iso31662.country(country)?.sub || {}
    for (const [code, info] of Object.entries(sub)) opts.set(code, info.name)

    // Fall back to any nager county code ISO doesn't know about, so nothing regresses.
    r.data.forEach(h => h.counties?.forEach(c => {
      if (!opts.has(c)) opts.set(c, iso31662.subdivision(c)?.name || c.split('-')[1] || c)
    }))

    return [...opts]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  } catch {
    return []
  }
}
