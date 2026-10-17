import type { AccommodationCreateRequest, AccommodationUpdateRequest } from '@trek/shared'
import { accommodationsApi } from '../api/client'
import { offlineDb, replaceTripRows } from '../db/offlineDb'
import { mutationQueue, generateUUID, nextTempId } from '../sync/mutationQueue'
import { isEffectivelyOffline } from '../sync/networkMode'
import { onlineThenCache } from './withOfflineFallback'
import type { Accommodation, Assignment } from '../types'

/** The day-plan half of what an accommodation write answers with. */
export interface StayStopsResult {
  assignment?: Assignment | null
  /** The booking's own stop, carried to the day the booking now covers. */
  movedAssignment?: { assignment: Assignment; oldDayId: number } | null
  /** Stops the booking let go of but left standing (a night dropped, the place kept). */
  updatedAssignments?: Assignment[]
  removedAssignments?: { id: number; dayId: number }[]
}

/** What a stay write answers with: the stay, and the day stops it moved. */
export type StayWriteResult = StayStopsResult & { accommodation: Accommodation }

const STAY_FIELDS = ['place_id', 'start_day_id', 'end_day_id', 'check_in', 'check_in_end', 'check_out', 'confirmation', 'notes'] as const

/**
 * The stay an offline write leaves on screen until the queue replays it. The
 * place fields the server joins in come from the cached place. The day stop
 * the server seats for a new night arrives with the next read once it is sent.
 */
async function localStay(id: number, tripId: number, body: AccommodationUpdateRequest, before: Accommodation | undefined): Promise<Accommodation> {
  const row: Record<string, unknown> = { ...(before ?? {}), id, trip_id: tripId }
  for (const field of STAY_FIELDS) {
    if (body[field] === undefined) continue
    const value = body[field]
    row[field] = field.endsWith('_id') && value != null ? Number(value) : value
  }
  if (row.place_id != null && row.place_id !== before?.place_id) {
    const place = await offlineDb.places.get(Number(row.place_id))
    Object.assign(row, {
      place_name: place?.name ?? null,
      place_address: place?.address ?? null,
      place_image: place?.image_url ?? null,
      place_lat: place?.lat ?? null,
      place_lng: place?.lng ?? null,
    })
  }
  return row as Accommodation
}

/** Queue a write to one stay, held behind any older write to it. */
async function enqueueStayWrite(tripId: number | string, id: number, method: 'PUT' | 'DELETE', url: string, body: unknown): Promise<void> {
  await mutationQueue.enqueue({
    id: generateUUID(),
    tripId: Number(tripId),
    method,
    url,
    body,
    resource: 'accommodations',
    entityId: id,
    ...(id < 0 ? { tempEntityId: id } : {}),
  })
  mutationQueue.sendSoon()
}

function stayUrl(tripId: number | string, id: number): string {
  return `/trips/${tripId}/accommodations/${id < 0 ? '{id}' : id}`
}

/**
 * Stays (booked nights) through the offline core, the way bookings go: reads
 * fall back to the Dexie copy, a write made offline lands there and in the
 * mutation queue, and an online write to a stay with an older one still queued
 * joins the queue behind it, since stay writes carry no version token.
 */
export const accommodationRepo = {
  async list(tripId: number | string): Promise<{ accommodations: Accommodation[] }> {
    return onlineThenCache(
      async () => {
        const result = await accommodationsApi.list(tripId)
        replaceTripRows('accommodations', Number(tripId), result.accommodations || []).catch(() => {})
        return result
      },
      async () => ({
        accommodations: await offlineDb.accommodations
          .where('trip_id').equals(Number(tripId)).toArray(),
      }),
    )
  },

  async create(tripId: number | string, data: AccommodationCreateRequest): Promise<StayWriteResult> {
    if (!isEffectivelyOffline()) {
      const result: StayWriteResult = await accommodationsApi.create(tripId, data)
      if (result?.accommodation) await offlineDb.accommodations.put(result.accommodation)
      return result
    }
    const tid = Number(tripId)
    const tempId = nextTempId()
    const accommodation = await localStay(tempId, tid, data, undefined)
    await offlineDb.transaction('rw', offlineDb.accommodations, offlineDb.mutationQueue, async () => {
      await offlineDb.accommodations.put(accommodation)
      await mutationQueue.enqueue({
        id: generateUUID(),
        tripId: tid,
        method: 'POST',
        url: `/trips/${tripId}/accommodations`,
        body: data,
        resource: 'accommodations',
        tempId,
      })
    })
    return { accommodation }
  },

  async update(tripId: number | string, id: number, data: AccommodationUpdateRequest): Promise<StayWriteResult> {
    if (!(await mutationQueue.mustQueue('accommodations', id))) {
      const result: StayWriteResult = await accommodationsApi.update(tripId, id, data)
      if (result?.accommodation) await offlineDb.accommodations.put(result.accommodation)
      return result
    }
    const accommodation = await localStay(id, Number(tripId), data, await offlineDb.accommodations.get(id))
    await offlineDb.accommodations.put(accommodation)
    await enqueueStayWrite(tripId, id, 'PUT', stayUrl(tripId, id), data)
    return { accommodation }
  },

  /** `keepStop` leaves the night's stop on the day as an ordinary pause (road trip mode). */
  async delete(tripId: number | string, id: number, opts?: { keepStop?: boolean }): Promise<StayStopsResult> {
    let result: StayStopsResult = {}
    if (!(await mutationQueue.mustQueue('accommodations', id))) {
      result = await accommodationsApi.delete(tripId, id, opts)
    } else {
      await enqueueStayWrite(tripId, id, 'DELETE', `${stayUrl(tripId, id)}${opts?.keepStop ? '?keepStop=true' : ''}`, undefined)
    }
    await offlineDb.accommodations.delete(id)
    return result
  },
}
