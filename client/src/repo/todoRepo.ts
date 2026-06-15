import { todoApi } from '../api/client'
import { offlineDb, upsertTodoItems } from '../db/offlineDb'
import { onlineThenCache } from './withOfflineFallback'
import type { TodoItem } from '../types'

export const todoRepo = {
  async list(tripId: number | string): Promise<{ items: TodoItem[] }> {
    return onlineThenCache(
      async () => {
        const result = await todoApi.list(tripId)
        upsertTodoItems(result.items)
        return result
      },
      async () => ({
        items: await offlineDb.todoItems
          .where('trip_id').equals(Number(tripId)).toArray(),
      }),
    )
  },
}
