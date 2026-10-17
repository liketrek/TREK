import type { ReservationCreateRequest, ReservationTraveler, ReservationUpdateRequest } from '@trek/shared'
import { reservationsApi } from '../api/client'
import { offlineDb, replaceTripRows } from '../db/offlineDb'
import { mutationQueue, generateUUID, nextTempId } from '../sync/mutationQueue'
import { isEffectivelyOffline } from '../sync/networkMode'
import { withTransportPositions } from '../utils/mergedOrder'
import { onlineThenCache } from './withOfflineFallback'
import type { Reservation } from '../types'

type ReservationBody = ReservationCreateRequest | ReservationUpdateRequest

export interface ReservationPosition {
  id: number
  day_plan_position: number
}

// Fields a booking write may carry that are instructions to the server, not
// columns of the row: the stay and the cost it creates alongside, and the legs
// it stores as endpoints.
const REQUEST_ONLY_FIELDS = ['create_accommodation', 'create_budget_entry', 'endpoints'] as const

/**
 * The booking an offline write leaves on screen until the queue replays it and
 * the server's own row replaces it. Metadata is kept as the JSON text the server
 * answers with, and the joined day and place names come from the cached rows.
 */
async function localReservation(id: number, tripId: number, body: ReservationBody, before: Reservation | undefined): Promise<Reservation> {
  const fields: Record<string, unknown> = { ...body }
  for (const key of REQUEST_ONLY_FIELDS) delete fields[key]
  if (fields.metadata !== undefined && fields.metadata !== null && typeof fields.metadata !== 'string') {
    fields.metadata = JSON.stringify(fields.metadata)
  }
  const row = {
    ...(before ?? { status: 'pending', type: 'other', travelers: [], endpoints: [] }),
    ...fields,
    id,
    trip_id: tripId,
  } as Reservation
  if (row.day_id) row.day_number = (await offlineDb.days.get(Number(row.day_id)))?.day_number ?? row.day_number ?? null
  if (row.place_id && row.place_id !== before?.place_id) row.place_name = (await offlineDb.places.get(Number(row.place_id)))?.name ?? null
  return row
}

/** Queue a write to one booking, held behind any older write to it. */
async function enqueueReservationWrite(tripId: number | string, id: number, method: 'PUT' | 'DELETE', suffix: string, body: unknown): Promise<void> {
  await mutationQueue.enqueue({
    id: generateUUID(),
    tripId: Number(tripId),
    method,
    url: `/trips/${tripId}/reservations/${id < 0 ? '{id}' : id}${suffix}`,
    body,
    resource: 'reservations',
    entityId: id,
    ...(id < 0 ? { tempEntityId: id } : {}),
  })
  mutationQueue.sendSoon()
}

/**
 * Bookings and transports through the offline core. Reads fall back to the
 * Dexie copy; a write made offline lands there and in the mutation queue and
 * replays once the connection is back. Booking writes carry no version token,
 * so an online write to a booking that still has an older one queued joins the
 * queue behind it (mustQueue).
 *
 * What the server does alongside a booking (the stay of a hotel, the linked
 * cost) happens when the queue sends it, and shows with the next read.
 */
export const reservationRepo = {
  async list(tripId: number | string): Promise<{ reservations: Reservation[] }> {
    return onlineThenCache(
      async () => {
        const result = await reservationsApi.list(tripId)
        void replaceTripRows('reservations', Number(tripId), result.reservations)
        return result
      },
      async () => ({
        reservations: await offlineDb.reservations
          .where('trip_id').equals(Number(tripId)).toArray(),
      }),
    )
  },

  async create(tripId: number | string, data: ReservationCreateRequest): Promise<{ reservation: Reservation }> {
    if (!isEffectivelyOffline()) {
      const result: { reservation: Reservation } = await reservationsApi.create(tripId, data)
      if (result?.reservation) await offlineDb.reservations.put(result.reservation)
      return result
    }
    const tid = Number(tripId)
    const tempId = nextTempId()
    const reservation = await localReservation(tempId, tid, data, undefined)
    await offlineDb.transaction('rw', offlineDb.reservations, offlineDb.mutationQueue, async () => {
      await offlineDb.reservations.put(reservation)
      await mutationQueue.enqueue({
        id: generateUUID(),
        tripId: tid,
        method: 'POST',
        url: `/trips/${tripId}/reservations`,
        body: data,
        resource: 'reservations',
        tempId,
      })
    })
    return { reservation }
  },

  async update(tripId: number | string, id: number, data: ReservationUpdateRequest): Promise<{ reservation: Reservation }> {
    if (!(await mutationQueue.mustQueue('reservations', id))) {
      const result: { reservation: Reservation } = await reservationsApi.update(tripId, id, data)
      if (result?.reservation) await offlineDb.reservations.put(result.reservation)
      return result
    }
    const reservation = await localReservation(id, Number(tripId), data, await offlineDb.reservations.get(id))
    await offlineDb.reservations.put(reservation)
    await enqueueReservationWrite(tripId, id, 'PUT', '', data)
    return { reservation }
  },

  /** Deleting a booking takes its linked costs with it, here as on the server. */
  async delete(tripId: number | string, id: number): Promise<void> {
    if (!(await mutationQueue.mustQueue('reservations', id))) {
      await reservationsApi.delete(tripId, id)
    } else {
      await enqueueReservationWrite(tripId, id, 'DELETE', '', undefined)
    }
    await offlineDb.reservations.delete(id)
    await offlineDb.budgetItems.where('trip_id').equals(Number(tripId)).filter(i => i.reservation_id === id).delete()
  },

  async setTravelers(tripId: number | string, id: number, userIds: number[]): Promise<{ travelers: ReservationTraveler[] }> {
    if (!(await mutationQueue.mustQueue('reservations', id))) {
      const result: { travelers: ReservationTraveler[] } = await reservationsApi.setTravelers(tripId, id, userIds)
      await offlineDb.reservations.where('id').equals(id).modify(r => { r.travelers = result.travelers })
      return result
    }
    const members = await offlineDb.tripMembers.where('tripId').equals(Number(tripId)).toArray()
    const travelers: ReservationTraveler[] = userIds.map(user_id => {
      const m = members.find(x => x.id === user_id)
      return { user_id, username: m?.username ?? '', avatar_url: m?.avatar_url ?? null }
    })
    await offlineDb.reservations.where('id').equals(id).modify(r => { r.travelers = travelers })
    await enqueueReservationWrite(tripId, id, 'PUT', '/travelers', { user_ids: userIds })
    return { travelers }
  },

  /**
   * Where the transports sit in a day's plan. Offline the order waits in the
   * queue; a booking created offline has no server id to name yet, so it keeps
   * the place the server gives it.
   */
  async updatePositions(tripId: number | string, positions: ReservationPosition[], dayId?: number): Promise<void> {
    const synced = positions.filter(p => p.id > 0)
    if (!isEffectivelyOffline()) {
      if (synced.length) await reservationsApi.updatePositions(tripId, synced, dayId)
      return
    }
    await offlineDb.transaction('rw', offlineDb.reservations, offlineDb.mutationQueue, async () => {
      const rows = await offlineDb.reservations.bulkGet(positions.map(p => p.id))
      const present = rows.filter((r): r is Reservation => r !== undefined)
      const moved = dayId === undefined
        ? present.map(r => ({ ...r, day_plan_position: positions.find(p => p.id === r.id)?.day_plan_position ?? r.day_plan_position }))
        : withTransportPositions(present, positions, dayId)
      await offlineDb.reservations.bulkPut(moved)
      await mutationQueue.enqueue({
        id: generateUUID(),
        tripId: Number(tripId),
        method: 'PUT',
        url: `/trips/${tripId}/reservations/positions`,
        body: { positions: synced, day_id: dayId },
      })
    })
  },
}
