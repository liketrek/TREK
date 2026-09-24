import { roadtripHazardsSchema } from '@trek/shared'
import { apiClient } from '../api/client'

/**
 * How long the browser waits for the hazard feed.
 *
 * The server keeps the feed for ten minutes and, once that is up, answers the
 * next request only after it has fetched DWD and GDACS afresh: the GDACS event
 * list and then up to twelve polygon lookups, each allowed 15 s. A cold read
 * takes nine to twenty seconds, so at the shared 8 s the browser gave up on
 * every first read after the cache expired, the map showed no warnings, and
 * the next attempt was ten minutes away although the server had the answer a
 * moment later. The bound is the sum of the server's own ceilings.
 */
export const ROADTRIP_HAZARDS_TIMEOUT_MS = 45_000

export const roadtripHazardsRepo = {
  async read(tripId: number, signal: AbortSignal) {
    const fetched = await apiClient.get(`/trips/${tripId}/roadtrip/hazards`, { signal, timeout: ROADTRIP_HAZARDS_TIMEOUT_MS })
    return roadtripHazardsSchema.parse(fetched.data)
  },
}
