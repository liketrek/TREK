import { placesApi } from '../api/client'
import { offlineDb, upsertPlaces } from '../db/offlineDb'
import { mutationQueue, generateUUID, nextTempId } from '../sync/mutationQueue'
import { isEffectivelyOffline } from '../sync/networkMode'
import { onlineThenCache } from './withOfflineFallback'
import type { Place } from '../types'

export const placeRepo = {
  async list(tripId: number | string, params?: Record<string, unknown>): Promise<{ places: Place[] }> {
    return onlineThenCache(
      async () => {
        const result = await placesApi.list(tripId, params)
        upsertPlaces(result.places)
        return result
      },
      async () => ({
        places: await offlineDb.places
          .where('trip_id').equals(Number(tripId)).toArray(),
      }),
    )
  },

  async create(tripId: number | string, data: Record<string, unknown> & { name: string }): Promise<{ place: Place }> {
    if (isEffectivelyOffline()) {
      const tempId = nextTempId()
      const tempPlace: Place = {
        ...(data as Partial<Place>),
        id: tempId,
        trip_id: Number(tripId),
        name: (data.name as string) ?? 'New place',
      } as Place
      await offlineDb.places.put(tempPlace)
      const id = generateUUID()
      await mutationQueue.enqueue({
        id,
        tripId: Number(tripId),
        method: 'POST',
        url: `/trips/${tripId}/places`,
        body: data,
        resource: 'places',
        tempId,
      })
      return { place: tempPlace }
    }
    const result = await placesApi.create(tripId, data)
    offlineDb.places.put(result.place)
    return result
  },

  async update(tripId: number | string, id: number | string, data: Record<string, unknown>): Promise<{ place: Place }> {
    if (isEffectivelyOffline()) {
      const existing = await offlineDb.places.get(Number(id))
      const optimistic: Place = { ...(existing ?? {} as Place), ...(data as Partial<Place>), id: Number(id) }
      await offlineDb.places.put(optimistic)
      const mutId = generateUUID()
      const isTemp = Number(id) < 0
      await mutationQueue.enqueue({
        id: mutId,
        tripId: Number(tripId),
        method: 'PUT',
        url: isTemp ? `/trips/${tripId}/places/{id}` : `/trips/${tripId}/places/${id}`,
        body: data,
        resource: 'places',
        entityId: Number(id),
        baseUpdatedAt: existing?.updated_at ?? null,
        ...(isTemp ? { tempEntityId: Number(id) } : {}),
      })
      return { place: optimistic }
    }
    const result = await placesApi.update(tripId, id, data)
    offlineDb.places.put(result.place)
    return result
  },

  async delete(tripId: number | string, id: number | string): Promise<unknown> {
    if (isEffectivelyOffline()) {
      await offlineDb.places.delete(Number(id))
      const mutId = generateUUID()
      const isTemp = Number(id) < 0
      await mutationQueue.enqueue({
        id: mutId,
        tripId: Number(tripId),
        method: 'DELETE',
        url: isTemp ? `/trips/${tripId}/places/{id}` : `/trips/${tripId}/places/${id}`,
        body: undefined,
        resource: 'places',
        entityId: Number(id),
        ...(isTemp ? { tempEntityId: Number(id) } : {}),
      })
      return { success: true }
    }
    const result = await placesApi.delete(tripId, id)
    offlineDb.places.delete(Number(id))
    return result
  },

  async deleteMany(tripId: number | string, ids: number[]): Promise<unknown> {
    if (isEffectivelyOffline()) {
      await offlineDb.places.bulkDelete(ids)
      for (const id of ids) {
        const mutId = generateUUID()
        const isTemp = id < 0
        await mutationQueue.enqueue({
          id: mutId,
          tripId: Number(tripId),
          method: 'DELETE',
          url: isTemp ? `/trips/${tripId}/places/{id}` : `/trips/${tripId}/places/${id}`,
          body: undefined,
          resource: 'places',
          entityId: id,
          ...(isTemp ? { tempEntityId: id } : {}),
        })
      }
      return { deleted: ids, count: ids.length }
    }
    const result = await placesApi.bulkDelete(tripId, ids)
    await offlineDb.places.bulkDelete(ids)
    return result
  },

  async updateMany(tripId: number | string, ids: number[], data: Record<string, unknown>): Promise<{ updated: number[]; count: number }> {
    if (isEffectivelyOffline()) {
      // Offline fans out one queued PUT per id (mirrors deleteMany's DELETE fan-out).
      for (const id of ids) {
        const existing = await offlineDb.places.get(id)
        if (existing) await offlineDb.places.put({ ...existing, ...(data as Partial<Place>) })
        const mutId = generateUUID()
        const isTemp = id < 0
        await mutationQueue.enqueue({
          id: mutId,
          tripId: Number(tripId),
          method: 'PUT',
          url: isTemp ? `/trips/${tripId}/places/{id}` : `/trips/${tripId}/places/${id}`,
          body: data,
          resource: 'places',
          entityId: id,
          baseUpdatedAt: existing?.updated_at ?? null,
          ...(isTemp ? { tempEntityId: id } : {}),
        })
      }
      return { updated: ids, count: ids.length }
    }
    const result = await placesApi.bulkUpdate(tripId, ids, data as Parameters<typeof placesApi.bulkUpdate>[2])
    const cached = await offlineDb.places.bulkGet(ids)
    await offlineDb.places.bulkPut(cached.filter(Boolean).map(p => ({ ...(p as Place), ...(data as Partial<Place>) })))
    return result
  },
}
