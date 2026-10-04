import { shoppingApi } from '../api/client'
import { offlineDb, upsertShoppingItems } from '../db/offlineDb'
import { onlineThenCache } from './withOfflineFallback'
import type { ShoppingItem } from '../types'

export const shoppingRepo = {
  async list(tripId: number | string): Promise<{ items: ShoppingItem[] }> {
    return onlineThenCache(
      async () => {
        const result = await shoppingApi.list(tripId)
        void upsertShoppingItems(result.items)
        return result
      },
      async () => ({
        items: await offlineDb.shoppingItems
          .where('trip_id').equals(Number(tripId)).toArray(),
      }),
    )
  },
}
