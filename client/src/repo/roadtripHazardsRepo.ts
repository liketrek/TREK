import { roadtripHazardsSchema } from '@trek/shared'
import { apiClient } from '../api/client'

export const roadtripHazardsRepo = {
  async read(tripId: number, signal: AbortSignal) {
    const fetched = await apiClient.get(`/trips/${tripId}/roadtrip/hazards`, { signal })
    return roadtripHazardsSchema.parse(fetched.data)
  },
}
