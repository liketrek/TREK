import { todoApi } from '../api/client'
import { offlineDb, replaceTripRows } from '../db/offlineDb'
import { mutationQueue, generateUUID, nextTempId } from '../sync/mutationQueue'
import { isEffectivelyOffline } from '../sync/networkMode'
import { onlineThenCache } from './withOfflineFallback'
import type { TodoItem } from '../types'
import type { TodoCreateItemRequest, TodoUpdateItemRequest } from '@trek/shared'

/**
 * The task an offline create leaves on screen until the queue replays it. The
 * defaults are the ones the server fills in, and it goes to the end of the list
 * as a new task does there.
 */
async function localItem(tempId: number, tripId: number, data: TodoCreateItemRequest): Promise<TodoItem> {
  const rows = await offlineDb.todoItems.where('trip_id').equals(tripId).toArray()
  const last = rows.reduce((max, row) => Math.max(max, row.sort_order ?? -1), -1)
  return {
    id: tempId,
    trip_id: tripId,
    name: data.name,
    category: data.category || null,
    checked: 0,
    sort_order: last + 1,
    due_date: data.due_date || null,
    description: data.description || null,
    assigned_user_id: data.assigned_user_id || null,
    priority: data.priority || 0,
  }
}

/** The fields of an edit as the row keeps them: the tick as 0/1, a null priority as none. */
function editedFields(data: TodoUpdateItemRequest): Partial<TodoItem> {
  const { checked, priority, ...rest } = data
  return {
    ...rest,
    ...(checked === undefined ? {} : { checked: checked ? 1 : 0 }),
    ...(priority === undefined ? {} : { priority: priority ?? 0 }),
  } as Partial<TodoItem>
}

/** Queue a write to one task, held behind any older write to it. */
async function enqueueItemWrite(tripId: number | string, id: number, method: 'PUT' | 'DELETE', body: unknown): Promise<void> {
  await mutationQueue.enqueue({
    id: generateUUID(),
    tripId: Number(tripId),
    method,
    url: `/trips/${tripId}/todo/${id < 0 ? '{id}' : id}`,
    body,
    resource: 'todoItems',
    entityId: id,
    ...(id < 0 ? { tempEntityId: id } : {}),
  })
  mutationQueue.sendSoon()
}

/**
 * Tasks through the offline core. Reads fall back to the Dexie copy; a write
 * made offline lands there and in the mutation queue and replays once the
 * connection is back. Task writes carry no version token, so an online write to
 * a task that still has an older one queued joins the queue behind it
 * (mustQueue).
 */
export const todoRepo = {
  async list(tripId: number | string): Promise<{ items: TodoItem[] }> {
    return onlineThenCache(
      async () => {
        const result = await todoApi.list(tripId)
        void replaceTripRows('todoItems', Number(tripId), result.items)
        return result
      },
      async () => ({
        items: await offlineDb.todoItems
          .where('trip_id').equals(Number(tripId)).toArray(),
      }),
    )
  },

  async create(tripId: number | string, data: TodoCreateItemRequest): Promise<{ item: TodoItem }> {
    if (!isEffectivelyOffline()) {
      const result: { item: TodoItem } = await todoApi.create(tripId, data)
      await offlineDb.todoItems.put(result.item)
      return result
    }
    const tid = Number(tripId)
    const tempId = nextTempId()
    const item = await localItem(tempId, tid, data)
    await offlineDb.transaction('rw', offlineDb.todoItems, offlineDb.mutationQueue, async () => {
      await offlineDb.todoItems.put(item)
      await mutationQueue.enqueue({
        id: generateUUID(),
        tripId: tid,
        method: 'POST',
        url: `/trips/${tripId}/todo`,
        body: data,
        resource: 'todoItems',
        tempId,
      })
    })
    return { item }
  },

  async update(tripId: number | string, id: number, data: TodoUpdateItemRequest): Promise<{ item: TodoItem }> {
    if (!(await mutationQueue.mustQueue('todoItems', id))) {
      const result: { item: TodoItem } = await todoApi.update(tripId, id, data)
      await offlineDb.todoItems.put(result.item)
      return result
    }
    const before = await offlineDb.todoItems.get(id)
    const item = { ...(before ?? {}), ...editedFields(data), id, trip_id: Number(tripId) } as TodoItem
    await offlineDb.todoItems.put(item)
    await enqueueItemWrite(tripId, id, 'PUT', data)
    return { item }
  },

  async delete(tripId: number | string, id: number): Promise<void> {
    if (!(await mutationQueue.mustQueue('todoItems', id))) {
      await todoApi.delete(tripId, id)
      await offlineDb.todoItems.delete(id)
      return
    }
    await offlineDb.todoItems.delete(id)
    await enqueueItemWrite(tripId, id, 'DELETE', undefined)
  },

  /**
   * The new order of the tasks. Offline it waits in the queue; a task created
   * offline has no server id to name yet, so it keeps the place the server
   * gives a new one, at the end.
   */
  async reorder(tripId: number | string, orderedIds: number[]): Promise<void> {
    if (!isEffectivelyOffline()) {
      await todoApi.reorder(tripId, orderedIds)
      return
    }
    await offlineDb.transaction('rw', offlineDb.todoItems, offlineDb.mutationQueue, async () => {
      for (const [index, id] of orderedIds.entries()) {
        await offlineDb.todoItems.update(id, { sort_order: index })
      }
      await mutationQueue.enqueue({
        id: generateUUID(),
        tripId: Number(tripId),
        method: 'PUT',
        url: `/trips/${tripId}/todo/reorder`,
        body: { orderedIds: orderedIds.filter(id => id > 0) },
      })
    })
  },
}
