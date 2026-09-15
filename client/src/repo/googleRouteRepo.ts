import { googleRoutePreviewSchema, type GoogleRouteImport } from '@trek/shared'
import { apiClient } from '../api/client'
import { isEffectivelyOffline } from '../sync/networkMode'

export const googleRouteRepo = {
  async preview(url: string, signal: AbortSignal) {
    if (isEffectivelyOffline()) throw new Error('Import requires a connection')
    const reply = await apiClient.post('/roadtrip/google-maps-preview', { url }, { signal, timeout: 120000 })
    return googleRoutePreviewSchema.parse(reply.data)
  },
  async append(tripId: number, input: GoogleRouteImport, idempotencyKey: string) {
    if (isEffectivelyOffline()) throw new Error('Import requires a connection')
    await apiClient.post(`/trips/${tripId}/roadtrip/google-maps-import`, input, {
      headers: { 'X-Idempotency-Key': idempotencyKey },
    })
  },
}
