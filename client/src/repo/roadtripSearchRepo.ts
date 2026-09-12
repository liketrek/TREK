import { roadtripSearchAreaResponseSchema } from '@trek/shared'
import { apiClient } from '../api/client'
import { isEffectivelyOffline } from '../sync/networkMode'

export const roadtripSearchRepo = {
  async search(categories: string[], bbox: { south: number; west: number; north: number; east: number }, lang: string, signal: AbortSignal) {
    if (isEffectivelyOffline()) throw new Error('Search requires a connection')
    const reply = await apiClient.post('/roadtrip/search-area', { categories, bbox, lang }, { signal, timeout: 20000 })
    return roadtripSearchAreaResponseSchema.parse(reply.data)
  },
}
