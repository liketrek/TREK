/**
 * Mutation queue — offline write queue backed by IndexedDB (Dexie).
 *
 * Flow:
 *   offline create/update/delete → enqueue() → optimistic Dexie write (in repo)
 *   online trigger → flush() → replay REST with X-Idempotency-Key header → update Dexie
 */
import { offlineDb } from '../db/offlineDb'
import { apiClient } from '../api/client'
import { isAuthed } from './authGate'
import type { QueuedMutation } from '../db/offlineDb'
import type { Table } from 'dexie'

// Map Dexie table names used in `resource` field → actual Dexie tables.
function getTable(resource: string): Table | undefined {
  const map: Record<string, Table> = {
    places:       offlineDb.places,
    packingItems: offlineDb.packingItems,
    todoItems:    offlineDb.todoItems,
    budgetItems:  offlineDb.budgetItems,
    reservations: offlineDb.reservations,
    tripFiles:    offlineDb.tripFiles,
  }
  return map[resource]
}

/** Generate a v4-style UUID using the platform crypto API. */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID (e.g. old Node)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

let _flushing = false
// Monotonically increasing timestamp so same-millisecond enqueues
// still get a deterministic FIFO order when sorted by createdAt.
let _lastTs = 0
// Monotonic counter for offline temp ids. Date.now() alone collides when two
// creates land in the same millisecond (bulk import, rapid tapping), which would
// overwrite one optimistic Dexie row. This guarantees distinct negative ids.
let _lastTempId = 0

/**
 * Mint a collision-free temporary (negative) id for an offline-created entity.
 * Monotonic across the session so same-millisecond creates never collide.
 */
export function nextTempId(): number {
  const now = Date.now()
  _lastTempId = now > _lastTempId ? now : _lastTempId + 1
  return -_lastTempId
}

/** HTTP statuses that should be retried later rather than treated as terminal. */
function isRetryableStatus(status: number | undefined): boolean {
  // 401: token expired mid-flush (offline window) — retry after re-auth.
  // 408/425/429: timeout / too-early / rate-limited — transient.
  return status === 401 || status === 408 || status === 425 || status === 429
}

export const mutationQueue = {
  /**
   * Add a mutation to the queue.
   * Returns the UUID (= idempotency key).
   */
  async enqueue(
    mutation: Omit<QueuedMutation, 'status' | 'attempts' | 'createdAt' | 'lastError'>,
  ): Promise<string> {
    const now = Date.now()
    _lastTs = now > _lastTs ? now : _lastTs + 1
    const item: QueuedMutation = {
      ...mutation,
      status: 'pending',
      attempts: 0,
      createdAt: _lastTs,
      lastError: null,
    }
    await offlineDb.mutationQueue.put(item)
    return item.id
  },

  /**
   * Drain the queue: replay each pending mutation against the server in FIFO order.
   * Stops on first network error (will retry on next trigger).
   * 4xx responses are marked failed and skipped.
   */
  async flush(): Promise<void> {
    if (_flushing || !navigator.onLine || !isAuthed()) return
    _flushing = true
    // tempId → realId learned during this flush, so a dependent edit/delete
    // queued against an offline-created entity (still holding the negative id)
    // can be rewritten to the server id before it is replayed.
    const idMap = new Map<number, number>()
    try {
      const pending = await offlineDb.mutationQueue
        .where('status')
        .equals('pending')
        .sortBy('createdAt')

      for (const mutation of pending) {
        // Mark as syncing so UI can show progress
        await offlineDb.mutationQueue.update(mutation.id, { status: 'syncing' })

        // Resolve a temp-id reference now that earlier CREATEs in this flush
        // may have completed (FIFO order guarantees the CREATE ran first).
        let reqUrl = mutation.url
        let reqEntityId = mutation.entityId
        if (mutation.tempEntityId !== undefined) {
          const realId = idMap.get(mutation.tempEntityId)
          if (realId !== undefined) {
            reqUrl = reqUrl.replace('{id}', String(realId))
            reqEntityId = realId
          }
        }
        // Placeholder still unresolved → the create it depended on is gone
        // (failed or missing). Surface it as failed rather than firing a 404.
        if (reqUrl.includes('{id}')) {
          await offlineDb.mutationQueue.update(mutation.id, {
            status: 'failed',
            attempts: mutation.attempts + 1,
            lastError: 'unresolved temp id (dependent create did not sync)',
          })
          continue
        }

        try {
          const response = await apiClient.request({
            method: mutation.method,
            url: reqUrl,
            data: mutation.body,
            headers: { 'X-Idempotency-Key': mutation.id },
          })

          // Apply canonical server response to Dexie
          if (mutation.method !== 'DELETE' && mutation.resource) {
            const table = getTable(mutation.resource)
            if (table && response.data && typeof response.data === 'object') {
              // Server returns { place: {...} } or { item: {...} } — grab first value
              const values = Object.values(response.data as Record<string, unknown>)
              const entity = values[0]
              if (entity && typeof entity === 'object' && 'id' in entity) {
                const realId = (entity as { id: number }).id
                // Remove temp optimistic entry if id changed (CREATE case) and
                // remap any queued mutations that still target the negative id.
                if (mutation.tempId !== undefined && mutation.tempId !== realId) {
                  await table.delete(mutation.tempId)
                  idMap.set(mutation.tempId, realId)
                  // Durable rewrite so dependents survive a flush boundary / reload.
                  await offlineDb.mutationQueue
                    .where('tripId')
                    .equals(mutation.tripId)
                    .filter(m => m.tempEntityId === mutation.tempId)
                    .modify(m => {
                      m.url = m.url.replace('{id}', String(realId))
                      m.entityId = realId
                      m.tempEntityId = undefined
                    })
                }
                await table.put(entity)
              }
            }
          } else if (mutation.method === 'DELETE' && mutation.resource && reqEntityId !== undefined) {
            // DELETE was already applied optimistically; ensure it's gone
            const table = getTable(mutation.resource)
            if (table) await table.delete(reqEntityId)
          }

          await offlineDb.mutationQueue.delete(mutation.id)
        } catch (err: unknown) {
          const httpStatus = (err as { response?: { status: number } })?.response?.status
          const isTerminal =
            httpStatus !== undefined && httpStatus >= 400 && httpStatus < 500 && !isRetryableStatus(httpStatus)
          if (isTerminal) {
            // Permanent client error — roll back the phantom optimistic CREATE so
            // it can't masquerade as synced, then mark failed and continue.
            if (mutation.method !== 'DELETE' && mutation.tempId !== undefined && mutation.resource) {
              const table = getTable(mutation.resource)
              if (table) await table.delete(mutation.tempId)
            }
            await offlineDb.mutationQueue.update(mutation.id, {
              status: 'failed',
              attempts: mutation.attempts + 1,
              lastError: String(err),
            })
          } else {
            // Network / transient error — reset to pending, abort flush (retry next trigger)
            await offlineDb.mutationQueue.update(mutation.id, {
              status: 'pending',
              attempts: mutation.attempts + 1,
              lastError: String(err),
            })
            break
          }
        }
      }
    } finally {
      _flushing = false
    }
  },

  /**
   * Return all pending/syncing mutations, optionally filtered by tripId.
   * Used by the UI to show per-item pending indicators.
   */
  async pending(tripId?: number): Promise<QueuedMutation[]> {
    if (tripId !== undefined) {
      return offlineDb.mutationQueue
        .where('tripId')
        .equals(tripId)
        .filter(m => m.status === 'pending' || m.status === 'syncing')
        .toArray()
    }
    return offlineDb.mutationQueue
      .where('status')
      .anyOf(['pending', 'syncing'])
      .toArray()
  },

  /** Count pending mutations (for banner badge). */
  async pendingCount(): Promise<number> {
    return offlineDb.mutationQueue
      .where('status')
      .anyOf(['pending', 'syncing'])
      .count()
  },

  /** Count permanently-failed mutations (surfaced separately so the user knows
   *  changes were dropped — they are NOT folded into pendingCount). */
  async failedCount(): Promise<number> {
    return offlineDb.mutationQueue
      .where('status')
      .equals('failed')
      .count()
  },

  /** Reset internal flushing flag and timestamp counters — useful in tests. */
  _resetFlushing(): void {
    _flushing = false
    _lastTs = 0
    _lastTempId = 0
  },
}
