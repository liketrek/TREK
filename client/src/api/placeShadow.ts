import type { PlaceShadowPickRequest } from '@trek/shared'
import { apiClient } from './client'
import { useAuthStore } from '../store/authStore'

/**
 * Records which search result the user picked, for the local shadow corpus.
 *
 * Fire and forget in the strongest sense: it never throws, never blocks the
 * pick it is describing, and does nothing at all unless the instance switched
 * the log on. Adding a place must not get slower or more fragile because
 * somebody is collecting a measurement.
 *
 * The store flag is checked first so a switched-off instance makes no request
 * at all; the server checks it again, because a client is not a permission.
 */

/** About 100 m. Enough to reproduce a ranking, too coarse to place someone. */
function coarse(value: number): number {
  return Math.round(value * 1000) / 1000
}

export function recordPlacePick(pick: PlaceShadowPickRequest): void {
  if (!useAuthStore.getState().placeShadowEnabled) return
  if (!Number.isFinite(pick.pickedLat) || !Number.isFinite(pick.pickedLng)) return
  if (pick.liveRank >= pick.liveCount) return
  // A pick out of the offline cache describes the cache's ordering, not a
  // provider's, and the two numbers this corpus exists for — how often the live
  // answer was first, and how often it was in the top five — are averaged over
  // every row. Mixing local rows in would move exactly the figure a candidate
  // index is later judged against.
  //
  // Not merely an offline concern: the offline switch is a setting, so the
  // network is usually reachable and the POST would go through.
  if (pick.source.endsWith('offline-cache')) return

  const body: PlaceShadowPickRequest = {
    ...pick,
    query: pick.query.trim().slice(0, 200),
    pickedName: pick.pickedName.slice(0, 300),
    pickedLat: coarse(pick.pickedLat),
    pickedLng: coarse(pick.pickedLng),
    biasLat: pick.biasLat === undefined ? undefined : coarse(pick.biasLat),
    biasLng: pick.biasLng === undefined ? undefined : coarse(pick.biasLng),
  }
  // The contract requires both; an unnamed result is not worth a row anyway.
  if (!body.query || !body.pickedName) return

  void apiClient.post('/place-shadow/pick', body).catch(() => {
    // Deliberately silent. The user was adding a place, not running a study.
  })
}
