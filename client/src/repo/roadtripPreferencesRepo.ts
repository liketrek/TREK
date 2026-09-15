import { roadtripPreferencesResponseSchema, roadtripPreferencesUpdateSchema, type RoadtripPreferences } from '@trek/shared'
import { apiClient } from '../api/client'
import { offlineDb } from '../db/offlineDb'
import { generateUUID, mutationQueue } from '../sync/mutationQueue'
import { isEffectivelyOffline } from '../sync/networkMode'
import { onlineThenCache } from './withOfflineFallback'

export async function cachedRoadtripPreferences(tripId: number, excludeMutation?: string): Promise<RoadtripPreferences> {
  const cached = await offlineDb.roadtripPreferences.get(tripId)
  if (!cached) throw new Error('Driving settings are not available offline.')
  const pending = await offlineDb.mutationQueue.where('tripId').equals(tripId).sortBy('createdAt')
  return pending.reduce((preferences, mutation) => {
    if (mutation.resource !== 'roadtripPreferences' || mutation.id === excludeMutation || !['pending', 'syncing'].includes(mutation.status)) return preferences
    return { ...preferences, ...roadtripPreferencesUpdateSchema.parse(mutation.body) }
  }, cached.preferences)
}

const writes = new Map<number, Promise<RoadtripPreferences>>()

export const roadtripPreferencesRepo = {
  async read(tripId: number): Promise<RoadtripPreferences> {
    const cacheName = offlineDb.name
    return onlineThenCache(async () => {
      const fetched = await apiClient.get(`/trips/${tripId}/roadtrip/preferences`)
      if (offlineDb.name !== cacheName) throw new Error('Account changed.')
      const saved = roadtripPreferencesResponseSchema.parse(fetched.data)
      await offlineDb.roadtripPreferences.put(saved)
      return cachedRoadtripPreferences(tripId)
    }, () => cachedRoadtripPreferences(tripId))
  },

  update(tripId: number, patch: RoadtripPreferences): Promise<RoadtripPreferences> {
    const cacheName = offlineDb.name
    const save = (writes.get(tripId) ?? Promise.resolve({})).catch(() => ({})).then(async () => {
      if (offlineDb.name !== cacheName) throw new Error('Account changed.')
      const validated = roadtripPreferencesUpdateSchema.parse(patch)
      if (!isEffectivelyOffline()) {
        const saved = await apiClient.put(`/trips/${tripId}/roadtrip/preferences`, validated)
        if (offlineDb.name !== cacheName) throw new Error('Account changed.')
        await offlineDb.roadtripPreferences.put(roadtripPreferencesResponseSchema.parse(saved.data))
      } else {
        const next = { ...await cachedRoadtripPreferences(tripId), ...validated }
        if (next.roadtrip_day_start && next.roadtrip_day_end && next.roadtrip_day_end <= next.roadtrip_day_start) throw new Error('Day end must be later than day start.')
        await mutationQueue.enqueue({
          id: generateUUID(), tripId, method: 'PUT', url: `/trips/${tripId}/roadtrip/preferences`,
          body: validated, resource: 'roadtripPreferences', entityId: tripId,
        })
      }
      return cachedRoadtripPreferences(tripId)
    })
    writes.set(tripId, save)
    void save.finally(() => { if (writes.get(tripId) === save) writes.delete(tripId) }).catch(() => {})
    return save
  },
}
