import { liveQuery } from 'dexie'
import { onNetworkModeChange } from '../sync/networkMode'
import { useEffect, useState } from 'react'
import type { RoadtripPreferences } from '@trek/shared'
import { useAuthStore } from '../store/authStore'
import { useTripStore } from '../store/tripStore'
import { EMPTY_ROADTRIP_PREFERENCES, publishRoadtripPreferences, useRoadtripPreferencesStore } from '../store/roadtripPreferencesStore'
import { cachedRoadtripPreferences, roadtripPreferencesRepo } from '../repo/roadtripPreferencesRepo'

export function useRoadtripSettings<T>(select: (settings: RoadtripPreferences) => T, requestedTripId?: number | string | null): T {
  const activeTripId = useTripStore(s => s.trip?.id)
  const userId = useAuthStore(s => s.user?.id)
  const key = `${userId}:${requestedTripId ?? activeTripId}`
  return useRoadtripPreferencesStore(s => select(s.byTrip[key] ?? EMPTY_ROADTRIP_PREFERENCES))
}

export function useLoadRoadtripSettings(tripId: number, enabled: boolean) {
  const userId = useAuthStore(s => s.user?.id)
  const [loadedKey, setLoadedKey] = useState('')
  const [failedKey, setFailedKey] = useState('')
  const key = `${userId}:${tripId}`
  useEffect(() => {
    if (!enabled || !userId || !Number.isFinite(tripId)) return
    let cancelled = false
    const load = () => {
      roadtripPreferencesRepo.read(tripId).then(preferences => {
        if (cancelled) return
        publishRoadtripPreferences(userId, tripId, preferences)
        setLoadedKey(key)
        setFailedKey('')
      }).catch(() => { if (!cancelled) setFailedKey(key) })
    }
    const cacheSubscription = liveQuery(() => cachedRoadtripPreferences(tripId).catch(() => null)).subscribe(preferences => {
      if (!cancelled && preferences) publishRoadtripPreferences(userId, tripId, preferences)
    })
    load()
    const unsubscribe = onNetworkModeChange(load)
    window.addEventListener('online', load)
    return () => { cancelled = true; cacheSubscription.unsubscribe(); unsubscribe(); window.removeEventListener('online', load) }
  }, [tripId, userId, enabled, key])
  return { ready: loadedKey === key, failed: failedKey === key }
}
