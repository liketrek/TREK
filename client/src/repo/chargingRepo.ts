import { chargingInfoSchema, type ChargingInfo } from '@trek/shared'
import { apiClient } from '../api/client'
import { isEffectivelyOffline } from '../sync/networkMode'

const pending = new Map<string, { until: number; value: Promise<ChargingInfo> }>()

/**
 * One request per station per minute, however many places ask for it.
 *
 * The rail renders a badge for every charging stop, the inspector a panel for the same
 * one and the add dialog a third for a station that is not on the trip yet, each on
 * its own refresh timer. The window is a shade under the server's own minute of cache,
 * so a refresh that gets through lands on a fresh answer rather than the cached one.
 *
 * A rejection stays in the map for the full window on purpose: a station the upstream
 * registry cannot answer for should not be asked again a second later.
 */
function coalesce(key: string, load: () => Promise<ChargingInfo>): Promise<ChargingInfo> {
  const cached = pending.get(key)
  if (cached && cached.until > Date.now()) return cached.value
  if (pending.size > 200) pending.clear()
  const value = load()
  pending.set(key, { until: Date.now() + 55000, value })
  return value
}

export const chargingRepo = {
  async read(tripId: number, placeId: number) {
    if (isEffectivelyOffline()) throw new Error('Offline')
    return coalesce(`${tripId}/${placeId}`, () =>
      apiClient.get(`/trips/${tripId}/roadtrip/charging/${placeId}`).then(reply => chargingInfoSchema.parse(reply.data)))
  },
  /**
   * The same answer for a station the trip has not saved yet, which is the only way to
   * ask before adding it: the saved-stop route takes a place id, and a hit found along
   * the route has none. Cached under the coordinate rather than an id, so looking at
   * the same charger twice is one request.
   */
  async readAt(tripId: number, lat: number, lng: number, name: string) {
    if (isEffectivelyOffline()) throw new Error('Offline')
    return coalesce(`${tripId}/at:${lat},${lng}:${name}`, () =>
      apiClient.post(`/trips/${tripId}/roadtrip/charging-lookup`, { lat, lng, name }).then(reply => chargingInfoSchema.parse(reply.data)))
  },
}
