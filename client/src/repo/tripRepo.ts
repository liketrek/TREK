import { tripsApi } from '../api/client'
import { offlineDb, upsertTrip } from '../db/offlineDb'
import { generateUUID, mutationQueue } from '../sync/mutationQueue'
import { isEffectivelyOffline } from '../sync/networkMode'
import { onlineThenCache } from './withOfflineFallback'
import type { Trip } from '../types'
import type { ActiveTripResponse, TripUpdateRequest } from '@trek/shared'

/** A trip change refused offline because only the server can carry it out. */
export class TripNeedsConnectionError extends Error {
  constructor() {
    super('Changing the dates, the number of days, the currency or the cover needs a connection')
    this.name = 'TripNeedsConnectionError'
  }
}

/**
 * Does this change need the server? New dates or a day count rebuild the days,
 * another currency rebases the costs, a cover is stored there. A field sent
 * with the value the trip already has changes nothing, so the edit form, which
 * always sends every field, can still save a new name offline.
 */
export function tripChangeNeedsConnection(trip: Pick<Trip, 'start_date' | 'end_date' | 'currency'> | undefined, data: TripUpdateRequest): boolean {
  const differs = (key: 'start_date' | 'end_date' | 'currency') =>
    data[key] !== undefined && (!trip || (data[key] ?? null) !== (trip[key] ?? null))
  return differs('start_date') || differs('end_date') || differs('currency')
    || data.day_count !== undefined || data.cover_image !== undefined
}

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

  /**
   * A change to the trip itself. Its name, description, reminder and the archive
   * flag wait in the queue offline, and online too while an older write to the
   * trip still waits, since trip writes carry no version token. New dates, a new
   * day count, another currency or a cover need the server (it rebuilds the days,
   * rebases the costs or stores the image), so offline they are refused with
   * TripNeedsConnectionError and nothing is written.
   */
  async update(tripId: number | string, data: TripUpdateRequest): Promise<{ trip: Trip }> {
    const id = Number(tripId)
    if (!(await mutationQueue.mustQueue('trips', id))) {
      const result: { trip: Trip } = await tripsApi.update(tripId, data)
      const cached = await offlineDb.trips.get(id)
      void upsertTrip({ ...cached, ...result.trip })
      return result
    }
    const cached = await offlineDb.trips.get(id)
    if (isEffectivelyOffline() && tripChangeNeedsConnection(cached, data)) throw new TripNeedsConnectionError()
    const { date_shift_mode: _mode, ...fields } = data
    const trip = { ...(cached ?? { id }), ...fields } as Trip
    await offlineDb.transaction('rw', offlineDb.trips, offlineDb.mutationQueue, async () => {
      await offlineDb.trips.put(trip)
      await mutationQueue.enqueue({
        id: generateUUID(), tripId: id, method: 'PUT', url: `/trips/${id}`,
        body: data, resource: 'trips', entityId: id,
      })
    })
    mutationQueue.sendSoon()
    return { trip }
  },

  async get(tripId: number | string): Promise<{ trip: Trip }> {
    return onlineThenCache(
      async () => {
        const result = await tripsApi.get(tripId)
        void upsertTrip(result.trip)
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
