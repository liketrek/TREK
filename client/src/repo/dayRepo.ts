import { daysApi } from '../api/client'
import { offlineDb, upsertDays } from '../db/offlineDb'
import { onlineThenCache } from './withOfflineFallback'
import type { Day } from '../types'

export const dayRepo = {
  async list(tripId: number | string): Promise<{ days: Day[] }> {
    return onlineThenCache(
      async () => {
        const result = await daysApi.list(tripId)
        upsertDays(result.days)
        return result
      },
      async () => ({
        days: (await offlineDb.days
          .where('trip_id')
          .equals(Number(tripId))
          .sortBy('day_number' as keyof Day)) as Day[],
      }),
    )
  },
}
