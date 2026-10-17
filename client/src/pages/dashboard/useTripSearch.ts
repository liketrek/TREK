import { useEffect, useMemo, useState } from 'react'
import { tripsApi } from '../../api/client'
import { isEffectivelyOffline } from '../../sync/networkMode'
import type { DashboardTrip } from './dashboardModel'

/** Lower-cased, accents folded, so "cafe" finds "Café". */
const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

/**
 * Whether a trip's own words match (#2190): its title, its description, and its
 * dates both as written (2024-05) and as read (May 2024, in the viewer's language).
 */
export function tripMatchesText(trip: DashboardTrip, query: string, locale?: string): boolean {
  const q = fold(query.trim())
  if (!q) return true
  const dates = [trip.start_date, trip.end_date].filter((d): d is string => !!d)
  const spoken = dates.map(d => {
    const parsed = new Date(`${d}T00:00:00`)
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  })
  const haystack = [trip.title, trip.description ?? '', ...dates, ...spoken].map(fold).join(' \n ')
  return q.split(/\s+/).every(word => haystack.includes(word))
}

const DEBOUNCE_MS = 250

/**
 * The dashboard's trip search (#2190). Searches every trip, archived ones too,
 * by its own words on the device and by its places on the server; offline the
 * place half simply stays out. Returns the matching trips and, per trip, the
 * places that made it match.
 */
export function useTripSearch(trips: DashboardTrip[], archivedTrips: DashboardTrip[], locale?: string) {
  const [query, setQuery] = useState('')
  const [placeHits, setPlaceHits] = useState<Map<number, string[]>>(new Map())
  const active = query.trim().length > 0

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2 || isEffectivelyOffline()) { setPlaceHits(new Map()); return }
    let cancelled = false
    const timer = setTimeout(() => {
      tripsApi.search(q)
        .then(({ matches }) => { if (!cancelled) setPlaceHits(new Map(matches.map(m => [m.trip_id, m.places]))) })
        // The place half is a bonus on top of the local match; a failed request
        // leaves the title and date results standing.
        .catch(() => { if (!cancelled) setPlaceHits(new Map()) })
    }, DEBOUNCE_MS)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [query])

  const results = useMemo(() => {
    if (!active) return []
    const seen = new Set<number>()
    return [...trips, ...archivedTrips].filter(trip => {
      if (seen.has(trip.id)) return false
      seen.add(trip.id)
      return tripMatchesText(trip, query, locale) || placeHits.has(trip.id)
    })
  }, [active, trips, archivedTrips, query, locale, placeHits])

  return { query, setQuery, active, results, placeHits }
}
