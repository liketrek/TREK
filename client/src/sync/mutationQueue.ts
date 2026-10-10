/**
 * Mutation queue — offline write queue backed by IndexedDB (Dexie).
 *
 * Flow:
 *   offline create/update/delete → enqueue() → optimistic Dexie write (in repo)
 *   online trigger → flush() → replay REST with X-Idempotency-Key header → update Dexie
 */
import { offlineDb, MUTATION_SCHEMA_VERSION } from '../db/offlineDb'
import { apiClient } from '../api/client'
import { isAuthed } from './authGate'
import { isEffectivelyOffline } from './networkMode'
import { getOfflinePrefs } from './offlinePrefs'
import { randomId } from '../utils/randomId'
import type { QueuedMutation } from '../db/offlineDb'
import type { Table } from 'dexie'
import { roadtripPreferencesResponseSchema, assignmentSchema, tourCreateResponseSchema, type TourCreateResponse } from '@trek/shared'
import { cacheAssignment } from '../db/cacheAssignment'

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

/**
 * Generate a v4-style UUID using the platform crypto API.
 *
 * The implementation moved to utils/randomId so the axios interceptor, which
 * mints the same header for online writes, cannot drift away from it — this
 * value becomes the X-Idempotency-Key and a duplicate silently drops a write.
 */
export function generateUUID(): string {
  return randomId()
}

// The flush in progress, from the moment flush() is called until its last pass is
// done, including the time it waits for another tab's lock. A second call gets
// this same promise, so no caller resolves while a pass is still to come.
let _flushRun: Promise<void> | null = null
// Set when flush() is called while a pass is already running. That pass read its
// pending rows when it began, so a write queued since then waits for one more
// pass, which the running flush starts once that pass is done.
let _flushAgain = false

/**
 * Take the cross-tab flush lock, waiting while another tab holds it. Every open
 * tab of the account shares the queue and runs its own triggers, and the
 * in-progress flush only covers its own tab: two tabs read the same pending rows
 * and replay each of them twice, leaning on the server's replay cache to answer
 * the second. Waiting rather than skipping matters to the callers: the online
 * trigger re-seeds Dexie from the server once flush() resolves, and the socket
 * refetches the trip, so a flush that returned while another tab was still
 * replaying would let them lay the server's older rows over edits that are
 * about to land. The waiting tab then runs its own pass, which finds what the
 * holder left. Resolves to the release function. Where the Web Locks API is
 * missing or refuses the request, the flush runs as before, guarded by the
 * flag alone. The lock goes with the tab, so a tab killed mid-flush never
 * strands it.
 */
function acquireFlushLock(): Promise<() => void> {
  const noop = () => {}
  const locks = typeof navigator === 'undefined' ? undefined : navigator.locks
  if (!locks || typeof locks.request !== 'function') return Promise.resolve(noop)
  return new Promise(resolve => {
    locks
      .request(`trek-mutation-flush:${offlineDb.name}`, () => new Promise<void>(release => resolve(release)))
      .catch(() => resolve(noop))
  })
}
// A row sits on 'syncing' only while its request is in flight, and the shared
// axios instance times out at 8s. Anything still 'syncing' a minute later
// belongs to a flush that never reached its catch — the tab was killed, the PWA
// was evicted, the device slept mid-request. flush() only ever selects
// 'pending', so without recovery that row is stranded: counted in the badge,
// never replayed, and blocking every dependent behind it.
const STUCK_SYNCING_MS = 60_000
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

/**
 * A write the server answers with a 5xx this many times is parked as failed.
 * The gaps double from 30 s, so the last try comes about two hours after the
 * first: long enough for a restart or an outage, short of blocking forever.
 */
const MAX_SERVER_ERROR_ATTEMPTS = 8
const SERVER_ERROR_BACKOFF_MS = 30_000

/** HTTP statuses that should be retried later rather than treated as terminal. */
function isRetryableStatus(status: number | undefined): boolean {
  // 401: token expired mid-flush (offline window) — retry after re-auth.
  // 408/425/429: timeout / too-early / rate-limited — transient.
  return status === 401 || status === 408 || status === 425 || status === 429
}

/**
 * The entity a queued write targets, as `resource:id`. A create is keyed by its
 * temporary id, which is also what the writes queued against it carry until it
 * syncs. Undefined when the row names no entity (it is then never held back).
 */
function entityKey(m: QueuedMutation): string | undefined {
  if (!m.resource) return undefined
  const id = m.entityId ?? m.tempEntityId ?? (m.method === 'POST' ? m.tempId : undefined)
  return id === undefined ? undefined : `${m.resource}:${id}`
}

/**
 * Entities with a parked write ('failed', or a 'conflict' waiting for the user),
 * each with the time of the earliest such write. A later write to the same
 * entity must not overtake it: replayed afterwards by Try again or Keep mine,
 * the older write would silently overwrite the newer one, and only places and
 * packing items carry a token the server could refuse it with.
 */
async function parkedEntities(): Promise<Map<string, number>> {
  const parked = await offlineDb.mutationQueue.where('status').anyOf(['failed', 'conflict']).toArray()
  const held = new Map<string, number>()
  for (const m of parked) holdEntity(held, m)
  return held
}

function holdEntity(held: Map<string, number>, m: QueuedMutation): void {
  const key = entityKey(m)
  if (key === undefined) return
  const since = held.get(key)
  if (since === undefined || m.createdAt < since) held.set(key, m.createdAt)
}

// The UI build stamped onto each queued write, for diagnosis. Empty where the
// bundler defined none.
const BUILD_VERSION: string = typeof __TREK_UI_VERSION__ === 'string' ? __TREK_UI_VERSION__ : ''

/**
 * Was this write queued by a build whose row format this one does not know? A
 * tab still on the previous bundle, or an install rolled back, would otherwise
 * replay a shape it cannot read. Such a row stays in the queue as it is, for
 * the build that wrote it; a row without a stamp predates it and is format 1.
 */
function isFromNewerFormat(m: QueuedMutation): boolean {
  return (m.schemaVersion ?? 1) > MUTATION_SCHEMA_VERSION
}

/** Pull the server's current entity out of a 409 response body ({ server: {...} }). */
function extractConflictServer(err: unknown): unknown {
  const data = (err as { response?: { data?: unknown } })?.response?.data
  if (data && typeof data === 'object' && 'server' in data) {
    return (data as { server: unknown }).server
  }
  return null
}

/** Write a server entity into its Dexie table (used when "theirs" wins a conflict). */
async function applyServerEntity(mutation: QueuedMutation, server: unknown): Promise<void> {
  if (!mutation.resource || !server || typeof server !== 'object' || !('id' in server)) return
  const table = getTable(mutation.resource)
  if (table) await table.put(server)
}

/**
 * Roll back what an offline CREATE wrote under its temporary id, once the
 * server refused it for good. A tour is a place plus its facet, so both go.
 */
async function dropTempRows(mutation: QueuedMutation): Promise<void> {
  if (mutation.method === 'DELETE' || mutation.tempId === undefined || !mutation.resource) return
  if (mutation.resource === 'tours') {
    await offlineDb.places.delete(mutation.tempId)
    await offlineDb.tours.delete(mutation.tempId)
    return
  }
  const table = getTable(mutation.resource)
  if (table) await table.delete(mutation.tempId)
}

/**
 * A CREATE replayed and the server answered with the real id: later queued
 * writes still aimed at the temporary one are pointed at it, in memory for
 * this flush and durably for the next.
 */
async function remapTempId(mutation: QueuedMutation, realId: number, idMap: Map<number, number>): Promise<void> {
  if (mutation.tempId === undefined || mutation.tempId === realId) return
  idMap.set(mutation.tempId, realId)
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

/**
 * A replayed tour write. The answer names the tour by its place, so the
 * offline place and facet move from the temporary id to the real one. The
 * place keeps its offline copy until the next list replaces it: the server
 * created it from the same route.
 */
async function reconcileTour(mutation: QueuedMutation, saved: TourCreateResponse, idMap: Map<number, number>): Promise<void> {
  const realId = saved.tour.place_id
  await offlineDb.transaction('rw', offlineDb.places, offlineDb.tours, async () => {
    if (mutation.tempId !== undefined && mutation.tempId !== realId) {
      const temp = await offlineDb.places.get(mutation.tempId)
      await offlineDb.places.delete(mutation.tempId)
      await offlineDb.tours.delete(mutation.tempId)
      if (temp && !(await offlineDb.places.get(realId))) await offlineDb.places.put({ ...temp, id: realId })
    }
    await offlineDb.tours.put({ ...saved.tour, trip_id: mutation.tripId, waypoints: saved.waypoints })
  })
  await remapTempId(mutation, realId, idMap)
}

export const mutationQueue = {
  /**
   * Add a mutation to the queue.
   * Returns the UUID (= idempotency key).
   */
  async enqueue(
    mutation: Omit<QueuedMutation, 'status' | 'attempts' | 'createdAt' | 'lastError' | 'schemaVersion' | 'buildVersion'>,
  ): Promise<string> {
    const now = Date.now()
    _lastTs = now > _lastTs ? now : _lastTs + 1
    const item: QueuedMutation = {
      ...mutation,
      status: 'pending',
      attempts: 0,
      createdAt: _lastTs,
      lastError: null,
      schemaVersion: MUTATION_SCHEMA_VERSION,
      buildVersion: BUILD_VERSION,
    }
    await offlineDb.mutationQueue.put(item)
    return item.id
  },

  /**
   * Does a write to this entity have to join the queue? Offline, always. Online
   * too while an older write to the same entity is still queued, backing off,
   * parked as failed or waiting as a conflict: sent straight to the server the
   * new write would land first, and Try again or the next flush would replay
   * the older one over it. Queued, it waits behind the older write and keeps
   * the order the user made them in. The repos of visits, a day's visits, tours
   * and the driving settings ask this, because those writes carry no version
   * token; a place or packing item sends one, so the server refuses the older
   * write (409) and it becomes a conflict instead.
   */
  async mustQueue(resource: string, entityId: number): Promise<boolean> {
    if (isEffectivelyOffline()) return true
    const key = `${resource}:${entityId}`
    const older = await offlineDb.mutationQueue
      .where('status')
      .anyOf(['pending', 'syncing', 'failed', 'conflict'])
      .filter(m => entityKey(m) === key)
      .first()
    return older !== undefined
  },

  /**
   * Start a flush for a write that joined the queue while online (see
   * mustQueue). It goes out as soon as the write it waits for is through, not
   * at the next trigger: when a flush is already running, that flush runs one
   * more pass once it is done (see flush). Offline this does nothing.
   */
  sendSoon(): void {
    if (isEffectivelyOffline()) return
    this.flush().catch(console.error)
  },

  /**
   * Drain the queue: replay each pending mutation against the server in FIFO order.
   * Stops on the first network error (retried on the next trigger). 4xx answers
   * are marked failed and skipped; a DELETE answered 404 counts as done. A 5xx
   * holds back only its own trip, retried with growing gaps, and is parked as
   * failed once it has failed MAX_SERVER_ERROR_ATTEMPTS times. A write parked as
   * failed or as a conflict holds back the later writes to the same entity, so
   * they keep their order whatever the user decides about it. A write queued
   * by a newer build (a higher schemaVersion) is skipped and left pending, and
   * holds back the later writes to its entity the same way.
   *
   * A call that arrives while a flush is running, or still waiting for another
   * tab's lock, asks it for one more round (the running pass read the pending
   * rows when it began and would not see a write queued since) and resolves with
   * it. So whoever refetches once flush() resolves, like the socket's reconnect
   * hook, never does so while this tab or another one is still replaying.
   */
  flush(): Promise<void> {
    if (isEffectivelyOffline() || !isAuthed()) return Promise.resolve()
    if (_flushRun !== null) {
      _flushAgain = true
      return _flushRun
    }
    const run = (async () => {
      try {
        // A "mine wins" auto-resolution dropped its base token; one more pass now
        // overwrites the server unconditionally. Bounded: the retried write carries
        // no token, so it cannot 409 for the same reason. A flush asked for while a
        // pass ran gets its pass here too. Bounded as well: the flag is only set by
        // a call made during a pass, and every pass clears it when it starts.
        let again = true
        while (again) {
          _flushAgain = false
          const needsRetry = await this._flushPass()
          again = (needsRetry || _flushAgain) && !isEffectivelyOffline() && isAuthed()
        }
      } finally {
        _flushRun = null
      }
    })()
    _flushRun = run
    return run
  },

  /**
   * One pass over the pending rows, under the cross-tab lock. Only flush() calls
   * it. Resolves to true when a write was re-queued for another pass.
   */
  async _flushPass(): Promise<boolean> {
    const release = await acquireFlushLock()
    // tempId → realId learned during this flush, so a dependent edit/delete
    // queued against an offline-created entity (still holding the negative id)
    // can be rewritten to the server id before it is replayed.
    const idMap = new Map<number, number>()
    // resource:entityId → freshest updated_at applied during this flush. A second
    // queued edit of the same entity must send THIS token, not the stale one its
    // snapshot was loaded with, or it would 409 against our own first edit (#1135).
    const tokenMap = new Map<string, string>()
    // Set when a conflict auto-resolved as "mine wins": the mutation is re-queued
    // without its base token, so one more pass overwrites the server cleanly.
    let needsRetry = false
    try {
      // Reclaim what an interrupted flush left behind before picking up work.
      // Replaying is safe: the mutation id doubles as the X-Idempotency-Key, so
      // a write the server already applied is answered from its replay cache.
      const stuckBefore = Date.now() - STUCK_SYNCING_MS
      await offlineDb.mutationQueue
        .where('status')
        .equals('syncing')
        .filter(m => (m.syncingSince ?? 0) < stuckBefore)
        .modify(m => { m.status = 'pending'; m.syncingSince = undefined })

      const pending = await offlineDb.mutationQueue
        .where('status')
        .equals('pending')
        .sortBy('createdAt')

      // Trips whose queue waits behind a write the server failed on. Their later
      // writes must keep their order, but every other trip goes on syncing.
      const blockedTrips = new Set<number>()
      // Entities whose later writes wait behind a parked one, until the user
      // tries it again or discards it. Grows as writes park during this pass.
      const heldEntities = await parkedEntities()

      for (const mutation of pending) {
        // Re-checked every pass, not just on entry: this loop writes server
        // responses straight into Dexie, and after a logout the proxy points at
        // the shared anonymous database. A flush that started before logout
        // would otherwise seed it with the previous account's rows.
        if (!isAuthed()) break
        if (blockedTrips.has(mutation.tripId)) continue
        const key = entityKey(mutation)
        const heldSince = key === undefined ? undefined : heldEntities.get(key)
        if (heldSince !== undefined && heldSince < mutation.createdAt) continue
        // Queued by a newer build: not sent, not marked, not dropped. It keeps
        // its place for that build, and the later writes to the same entity
        // wait behind it as they do behind a parked one.
        if (isFromNewerFormat(mutation)) {
          holdEntity(heldEntities, mutation)
          continue
        }
        if (mutation.retryAfter !== undefined && mutation.retryAfter > Date.now()) {
          blockedTrips.add(mutation.tripId)
          continue
        }

        // Mark as syncing so UI can show progress. The stamp is what lets the
        // next flush tell an in-flight row from one a killed tab abandoned.
        await offlineDb.mutationQueue.update(mutation.id, { status: 'syncing', syncingSince: Date.now() })

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
          holdEntity(heldEntities, mutation)
          continue
        }

        try {
          // Send the optimistic-concurrency token when we have one so the server
          // can reject a stale overwrite (409). Absent header => unconditional
          // write (back-compat with servers / resources that don't check it).
          // A newer token learned earlier in THIS flush (an earlier edit of the
          // same entity) overrides the snapshot's stale base.
          const headers: Record<string, string> = { 'X-Idempotency-Key': mutation.id }
          const tokenKey = mutation.resource !== undefined && reqEntityId !== undefined ? `${mutation.resource}:${reqEntityId}` : undefined
          const baseToken = (tokenKey && tokenMap.get(tokenKey)) || mutation.baseUpdatedAt
          if (baseToken) headers['X-Base-Updated-At'] = baseToken
          const response = await apiClient.request({
            method: mutation.method,
            url: reqUrl,
            data: mutation.body,
            headers,
          })

          if (mutation.resource === 'roadtripPreferences') {
            const saved = roadtripPreferencesResponseSchema.parse(response.data)
            await offlineDb.roadtripPreferences.put(saved)
          }
          // Apply canonical server response to Dexie
          if (mutation.resource === 'assignments') {
            await cacheAssignment(assignmentSchema.parse(response.data.assignment))
          }
          if (mutation.resource === 'tours') {
            await reconcileTour(mutation, tourCreateResponseSchema.parse(response.data), idMap)
          } else if (mutation.method !== 'DELETE' && mutation.resource) {
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
                  await remapTempId(mutation, realId, idMap)
                }
                await table.put(entity)
                // Advance the base-version token of any other queued edits to the
                // same entity to the value we just wrote. Without this, a second
                // offline edit of the same place/item still carries the pre-flush
                // token and would 409 against our OWN just-applied first edit —
                // self-conflicting and risking loss of the later edit (#1135).
                const newToken = (entity as { updated_at?: unknown }).updated_at
                if (typeof newToken === 'string') {
                  // In-memory: consulted when the sibling is replayed later in this
                  // same flush (its snapshot still holds the stale base).
                  if (mutation.resource) tokenMap.set(`${mutation.resource}:${realId}`, newToken)
                  // Durable: survives a flush boundary / reload if the sibling is
                  // not reached this pass.
                  await offlineDb.mutationQueue
                    .where('tripId')
                    .equals(mutation.tripId)
                    .filter(m =>
                      m.id !== mutation.id &&
                      m.resource === mutation.resource &&
                      m.entityId === realId &&
                      (m.status === 'pending' || m.status === 'syncing'),
                    )
                    .modify(m => { m.baseUpdatedAt = newToken })
                }
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

          // A DELETE of something the server no longer has did what it set out
          // to do. Reporting it as a failed sync would flag a change that worked.
          if (httpStatus === 404 && mutation.method === 'DELETE') {
            if (mutation.resource && reqEntityId !== undefined) {
              const table = getTable(mutation.resource)
              if (table) await table.delete(reqEntityId)
            }
            await offlineDb.mutationQueue.delete(mutation.id)
            continue
          }

          // 409 = the entity changed on the server since this offline edit was
          // made. This is NOT a dropped change like other 4xx — resolve it per
          // the user's strategy instead of failing it. Deliberately scoped to
          // edits: an offline DELETE is "delete wins" by design (no CAS on the
          // delete path), so it never reaches here. See the wiki Offline doc.
          if (httpStatus === 409 && mutation.method !== 'DELETE') {
            const server = extractConflictServer(err)
            const strategy = getOfflinePrefs().conflictStrategy
            if (strategy === 'server') {
              // Theirs wins: adopt the server's version locally, drop our write.
              await applyServerEntity(mutation, server)
              await offlineDb.mutationQueue.delete(mutation.id)
            } else if (strategy === 'mine') {
              // Mine wins: re-queue without the base token so the next pass
              // overwrites unconditionally.
              await offlineDb.mutationQueue.update(mutation.id, {
                status: 'pending', baseUpdatedAt: null, conflictServer: undefined,
                attempts: mutation.attempts + 1, lastError: null,
              })
              needsRetry = true
            } else {
              // Ask: park it as a conflict for the user to resolve.
              await offlineDb.mutationQueue.update(mutation.id, {
                status: 'conflict', conflictServer: server ?? null, conflictAt: Date.now(),
                attempts: mutation.attempts + 1, lastError: 'conflict',
              })
              holdEntity(heldEntities, mutation)
            }
            continue
          }

          const isTerminal =
            httpStatus !== undefined && httpStatus >= 400 && httpStatus < 500 && !isRetryableStatus(httpStatus)
          if (isTerminal) {
            // Permanent client error — roll back the phantom optimistic CREATE so
            // it can't masquerade as synced, then mark failed and continue.
            await dropTempRows(mutation)
            await offlineDb.mutationQueue.update(mutation.id, {
              status: 'failed',
              attempts: mutation.attempts + 1,
              lastError: String(err),
            })
            holdEntity(heldEntities, mutation)
          } else if (httpStatus !== undefined && httpStatus >= 500) {
            // The server answered and failed. Retried with growing gaps, and
            // only this trip waits for it. One that never goes through is
            // parked as failed instead of holding every later write forever.
            const attempts = mutation.attempts + 1
            if (attempts >= MAX_SERVER_ERROR_ATTEMPTS) {
              await dropTempRows(mutation)
              await offlineDb.mutationQueue.update(mutation.id, { status: 'failed', attempts, lastError: String(err), retryAfter: undefined })
              holdEntity(heldEntities, mutation)
            } else {
              await offlineDb.mutationQueue.update(mutation.id, {
                status: 'pending',
                attempts,
                lastError: String(err),
                retryAfter: Date.now() + SERVER_ERROR_BACKOFF_MS * 2 ** (attempts - 1),
              })
              blockedTrips.add(mutation.tripId)
            }
          } else {
            // No answer at all (network) or a retryable status: reset to
            // pending and stop the flush; the next trigger retries.
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
      release()
    }
    return needsRetry
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

  /**
   * Put every parked change back in line, from a fresh start, and flush.
   * The later writes to the same entity made on this device waited behind it:
   * offline ones in the queue and, for visits, tours and the driving settings,
   * online ones too (mustQueue), so they go out after it in the order they were
   * made. A place or packing item still sends the token it was edited against,
   * so any newer version on the server, a collaborator's or one saved here
   * online, refuses it (409) and it becomes a conflict. A write without a token
   * overwrites what someone else changed on the server meanwhile, as every
   * replayed offline write of those resources does.
   */
  async retryFailed(): Promise<void> {
    await offlineDb.mutationQueue
      .where('status')
      .equals('failed')
      .modify(m => { m.status = 'pending'; m.attempts = 0; m.retryAfter = undefined; m.lastError = null })
    await this.flush()
  },

  /**
   * Drop every parked change. The local copy of an edit that never reached the
   * server goes with the next trip sync, which reads the server's version. The
   * later writes that waited behind a parked one are sent right away.
   */
  async discardFailed(): Promise<void> {
    await offlineDb.mutationQueue.where('status').equals('failed').delete()
    await this.flush()
  },

  /** Count unresolved sync conflicts (offline edits the server rejected as stale). */
  async conflictCount(): Promise<number> {
    return offlineDb.mutationQueue
      .where('status')
      .equals('conflict')
      .count()
  },

  /** All unresolved conflicts, newest first, optionally scoped to one trip. */
  async conflicts(tripId?: number): Promise<QueuedMutation[]> {
    const all = await offlineDb.mutationQueue.where('status').equals('conflict').toArray()
    const scoped = tripId === undefined ? all : all.filter(m => m.tripId === tripId)
    return scoped.sort((a, b) => (b.conflictAt ?? 0) - (a.conflictAt ?? 0))
  },

  /**
   * Resolve a conflict by keeping the local (offline) edit: re-queue it without
   * the base token so the next flush overwrites the server unconditionally.
   */
  async resolveKeepMine(id: string): Promise<void> {
    const m = await offlineDb.mutationQueue.get(id)
    if (!m || m.status !== 'conflict') return
    await offlineDb.mutationQueue.update(id, {
      status: 'pending', baseUpdatedAt: null, conflictServer: undefined, conflictAt: undefined, lastError: null,
    })
    await this.flush()
  },

  /**
   * Resolve a conflict by keeping the server's version: adopt it into the local
   * cache and drop the queued write.
   */
  async resolveKeepServer(id: string): Promise<void> {
    const m = await offlineDb.mutationQueue.get(id)
    if (!m || m.status !== 'conflict') return
    await applyServerEntity(m, m.conflictServer)
    await offlineDb.mutationQueue.delete(id)
    // Later writes to the same entity waited behind the conflict.
    await this.flush()
  },

  /** Reset internal flushing flag and timestamp counters — useful in tests. */
  _resetFlushing(): void {
    _flushRun = null
    _flushAgain = false
    _lastTs = 0
    _lastTempId = 0
  },
}
