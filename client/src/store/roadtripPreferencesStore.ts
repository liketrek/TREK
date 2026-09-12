import { create } from 'zustand'
import type { RoadtripPreferences } from '@trek/shared'

export const EMPTY_ROADTRIP_PREFERENCES: RoadtripPreferences = {}

export const useRoadtripPreferencesStore = create<{
  byTrip: Record<string, RoadtripPreferences>
}>(() => ({ byTrip: {} }))

export function publishRoadtripPreferences(userId: number, tripId: number, preferences: RoadtripPreferences) {
  useRoadtripPreferencesStore.setState(state => ({
    byTrip: { ...state.byTrip, [`${userId}:${tripId}`]: preferences },
  }))
}
