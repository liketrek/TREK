import { chargingInfoSchema, type ChargingInfo } from '@trek/shared'
import { apiClient } from '../api/client'
import { isEffectivelyOffline } from '../sync/networkMode'

const pending = new Map<string, { until: number; value: Promise<ChargingInfo> }>()
export const chargingRepo = {
  async read(tripId: number, placeId: number) {
    if (isEffectivelyOffline()) throw new Error('Offline')
    const key = `${tripId}/${placeId}`
    const cached = pending.get(key)
    if (cached && cached.until > Date.now()) return cached.value
    if (pending.size > 200) pending.clear()
    const value = apiClient.get(`/trips/${tripId}/roadtrip/charging/${placeId}`).then(reply => chargingInfoSchema.parse(reply.data))
    pending.set(key, { until: Date.now() + 55000, value })
    return value
  },
}
