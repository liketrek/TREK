import { budgetApi } from '../api/client'
import { offlineDb, replaceTripRows } from '../db/offlineDb'
import { onlineThenCache } from './withOfflineFallback'
import type { BudgetItem } from '../types'

export const budgetRepo = {
  async list(tripId: number | string): Promise<{ items: BudgetItem[] }> {
    return onlineThenCache(
      async () => {
        const result = await budgetApi.list(tripId)
        void replaceTripRows('budgetItems', Number(tripId), result.items)
        return result
      },
      async () => ({
        items: await offlineDb.budgetItems
          .where('trip_id').equals(Number(tripId)).toArray(),
      }),
    )
  },
}
