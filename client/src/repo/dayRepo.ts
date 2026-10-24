import { daysApi } from '../api/client'
import { offlineDb, replaceTripRows, upsertTrip } from '../db/offlineDb'
import { generateUUID, mutationQueue } from '../sync/mutationQueue'
import { isEffectivelyOffline } from '../sync/networkMode'
import { onlineThenCache } from './withOfflineFallback'
import type { Day, Trip } from '../types'
import type { DayUpdateRequest } from '@trek/shared'

/** A cache write after the server already answered: its failure is logged, not the caller's. */
export function cacheAfterWrite(write: Promise<unknown>, what: string): void {
  write.catch((err: unknown) => console.warn(`Offline cache not updated after ${what}:`, err))
}

/**
 * The cached day with the fields of a write laid over it. The day answers carry
 * no notes of the day, so the ones the cache holds stay.
 */
async function cacheDayFields(dayId: number, fields: Partial<Day>): Promise<void> {
  await offlineDb.days.where('id').equals(dayId).modify(day => { Object.assign(day, fields) })
}

/** Queue a write to one day, held behind any older write to it. */
async function enqueueDayWrite(tripId: number | string, dayId: number, url: string, body: unknown, fields: Partial<Day>): Promise<void> {
  await offlineDb.transaction('rw', offlineDb.days, offlineDb.mutationQueue, async () => {
    await mutationQueue.enqueue({
      id: generateUUID(), tripId: Number(tripId), method: 'PUT', url, body, resource: 'days', entityId: dayId,
    })
    await cacheDayFields(dayId, fields)
  })
  mutationQueue.sendSoon()
}

export const dayRepo = {
  async list(tripId: number | string): Promise<{ days: Day[] }> {
    return onlineThenCache(
      async () => {
        const result = await daysApi.list(tripId)
        void replaceTripRows('days', Number(tripId), result.days)
        return result
      },
      async () => ({
        days: (await offlineDb.days
          .where('trip_id')
          .equals(Number(tripId))
          .sortBy('day_number' as keyof Day)) as Day[],
      }),
    )
  },

  /**
   * A day's title or its notes text. The server keeps the field a write leaves
   * out, so each goes on its own. Day writes carry no version token, so offline,
   * and online while an older write to the day still waits, it joins the queue.
   */
  async update(tripId: number | string, dayId: number, data: DayUpdateRequest): Promise<void> {
    const fields: Partial<Day> = {
      ...('title' in data ? { title: data.title ?? null } : {}),
      ...('notes' in data ? { notes: data.notes || null } : {}),
    }
    if (!(await mutationQueue.mustQueue('days', dayId))) {
      await daysApi.update(tripId, dayId, data)
      cacheAfterWrite(cacheDayFields(dayId, fields), 'renaming a day')
      return
    }
    await enqueueDayWrite(tripId, dayId, `/trips/${tripId}/days/${dayId}`, data, fields)
  },

  /** The whole-day default route mode, queued the same way as update. */
  async setTransport(tripId: number | string, dayId: number, mode: string | null): Promise<void> {
    const fields: Partial<Day> = { default_transport_mode: mode }
    if (!(await mutationQueue.mustQueue('days', dayId))) {
      await daysApi.updateTransport(tripId, dayId, mode)
      cacheAfterWrite(cacheDayFields(dayId, fields), 'changing the travel mode of a day')
      return
    }
    await enqueueDayWrite(tripId, dayId, `/trips/${tripId}/days/${dayId}/transport`, { transport_mode: mode }, fields)
  },

  /**
   * Delete a day. Online only, deliberately: the server cancels the stays on the
   * day, lets go of its bookings and moves the dates of the days after it, and a
   * queued offline write could not replay that faithfully. The cached row goes
   * right away, since this tab never hears its own day:deleted, and the trip the
   * server answers with (new day count, maybe a new end date) replaces the cached one.
   *
   * The cache is written without waiting, the way the other repos write after an
   * online call: once the server has deleted the day, a failing IndexedDB (full,
   * closed, blocked) must not report the delete as failed.
   */
  async remove(tripId: number | string, dayId: number): Promise<{ trip?: Trip }> {
    if (isEffectivelyOffline()) throw new Error('Deleting a day needs a connection')
    const result = await daysApi.delete(tripId, dayId)
    cacheAfterWrite(offlineDb.days.delete(dayId), 'deleting a day')
    if (result.trip) cacheAfterWrite(upsertTrip(result.trip), 'deleting a day')
    return { trip: result.trip }
  },

  /**
   * Put the days in a new order. Online only, like remove: on a trip with dates
   * the server moves the dates of the bookings along with their days, which the
   * cache cannot follow.
   */
  async reorder(tripId: number | string, orderedIds: number[]): Promise<void> {
    if (isEffectivelyOffline()) throw new Error('Reordering days needs a connection')
    await daysApi.reorder(tripId, orderedIds)
  },

  /** An empty day at a 1-based position, or at the end. Online only, like appendDated. */
  async insert(tripId: number | string, position?: number): Promise<{ day: Day; trip?: Trip }> {
    if (isEffectivelyOffline()) throw new Error('Adding a day needs a connection')
    const result = await daysApi.create(tripId, { position })
    if (result.trip) cacheAfterWrite(upsertTrip(result.trip), 'adding a day')
    return result
  },

  /**
   * Add the calendar day after the trip's last date, which extends the trip by
   * one day. Online only, like remove: the server picks the date and moves the
   * days without one back, and a queued offline write replayed later could land
   * on a date the trip has grown past by then. The trip the server answers with
   * (new end date, new day count) replaces the cached one, without waiting, as
   * in remove; the days are the caller's to refresh, since the ones behind the
   * new day moved.
   */
  async appendDated(tripId: number | string): Promise<{ day: Day; trip?: Trip }> {
    if (isEffectivelyOffline()) throw new Error('Adding a day needs a connection')
    const result = await daysApi.create(tripId, { dated: true })
    if (result.trip) cacheAfterWrite(upsertTrip(result.trip), 'adding a day')
    return { day: result.day, trip: result.trip }
  },
}
