import { accommodationsApi } from '../api/client'
import { offlineDb, replaceTripRows } from '../db/offlineDb'
import { onlineThenCache } from './withOfflineFallback'
import type { Accommodation } from '../types'

export const accommodationRepo = {
  async list(tripId: number | string): Promise<{ accommodations: Accommodation[] }> {
    return onlineThenCache(
      async () => {
        const result = await accommodationsApi.list(tripId)
        replaceTripRows('accommodations', Number(tripId), result.accommodations || []).catch(() => {})
        return result
      },
      async () => ({
        accommodations: await offlineDb.accommodations
          .where('trip_id').equals(Number(tripId)).toArray(),
      }),
    )
  },
}
