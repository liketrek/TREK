import { useEffect } from 'react'
import { roadtripPreferencesSchema } from '@trek/shared'
import { addListener, removeListener } from '../api/websocket'
import { useAuthStore } from '../store/authStore'
import { publishRoadtripPreferences } from '../store/roadtripPreferencesStore'
import { offlineDb } from '../db/offlineDb'
import { cachedRoadtripPreferences } from '../repo/roadtripPreferencesRepo'

export function useRoadtripPreferencesSync() {
  const userId = useAuthStore(s => s.user?.id)
  useEffect(() => {
    if (!userId) return
    let disposed = false
    const listener = (event: Record<string, unknown>) => {
      if (event.type !== 'roadtripPreferences:changed') return
      const tripId = Number(event.tripId)
      const parsed = roadtripPreferencesSchema.safeParse(event.preferences)
      if (!parsed.success || !Number.isSafeInteger(tripId) || tripId < 1) return
      publishRoadtripPreferences(userId, tripId, parsed.data)
      void offlineDb.roadtripPreferences.put({ tripId, preferences: parsed.data }).then(() => cachedRoadtripPreferences(tripId)).then(preferences => {
        if (!disposed) publishRoadtripPreferences(userId, tripId, preferences)
      }).catch(() => {})
    }
    addListener(listener)
    return () => { disposed = true; removeListener(listener) }
  }, [userId])
}
