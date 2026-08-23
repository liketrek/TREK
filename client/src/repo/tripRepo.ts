import { tripsApi } from '../api/client'
import { offlineDb, upsertTrip } from '../db/offlineDb'
import { onlineThenCache } from './withOfflineFallback'
import type { Trip } from '../types'
import type { ActiveTripResponse } from '@trek/shared'

/**
 * Offline stand-in for GET /trips/active. Mirrors the server's ranking
 * (trips.service.ts activeTrip): the trip running today, else the next one to
 * start, else the most recently started. Dates are plain local calendar dates.
 */
function pickActive(trips: Trip[]): Trip | null {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const relevance = (t: Trip): number => {
    if (t.start_date && t.end_date && t.start_date <= today && t.end_date >= today) return 0
    if (t.start_date && t.start_date >= today) return 1
    return 2
  }
  const ranked = [...trips].sort((a, b) => {
    const ra = relevance(a)
    const rb = relevance(b)
    if (ra !== rb) return ra - rb
    // Upcoming: soonest first. Everything else: most recently started first.
    return ra === 2
      ? (b.start_date ?? '').localeCompare(a.start_date ?? '')
      : (a.start_date ?? '').localeCompare(b.start_date ?? '')
  })
  return ranked[0] ?? null
}

export const tripRepo = {
  async list(): Promise<{ trips: Trip[]; archivedTrips: Trip[] }> {
    return onlineThenCache(
      async () => {
        const [active, archived] = await Promise.all([
          tripsApi.list(),
          tripsApi.list({ archived: 1 }),
        ])
        active.trips.forEach(t => upsertTrip(t))
        archived.trips.forEach(t => upsertTrip(t))
        return { trips: active.trips, archivedTrips: archived.trips }
      },
      async () => {
        const all = await offlineDb.trips.toArray()
        return {
          trips: all.filter(t => !t.is_archived),
          archivedTrips: all.filter(t => t.is_archived),
        }
      },
    )
  },

  /**
   * The startup redirect asks for this on the very first paint, so it has to
   * answer offline too — otherwise "open my active trip on startup" drops the
   * user on the dashboard whenever the launch has no network.
   */
  async active(): Promise<ActiveTripResponse> {
    return onlineThenCache(
      () => tripsApi.active(),
      async () => {
        const all = await offlineDb.trips.toArray()
        const trip = pickActive(all.filter(t => !t.is_archived))
        return {
          trip: trip
            ? { id: trip.id, title: trip.title, start_date: trip.start_date, end_date: trip.end_date }
            : null,
        }
      },
    )
  },

  async get(tripId: number | string): Promise<{ trip: Trip }> {
    return onlineThenCache(
      async () => {
        const result = await tripsApi.get(tripId)
        upsertTrip(result.trip)
        return result
      },
      async () => {
        const cached = await offlineDb.trips.get(Number(tripId))
        if (cached) return { trip: cached }
        throw new Error('No cached trip data available offline')
      },
    )
  },
}
