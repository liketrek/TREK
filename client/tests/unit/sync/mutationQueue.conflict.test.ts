/**
 * mutationQueue conflict tests (#1135) — 409 handling + resolution.
 *
 * Covers: X-Base-Updated-At header, 'ask' parks a conflict, keep-mine re-sends
 * unconditionally, keep-theirs adopts the server entity, and the 'mine'/'server'
 * auto-strategies.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { server } from '../../helpers/msw/server'
import { http, HttpResponse } from 'msw'
import { setAuthed } from '../../../src/sync/authGate'
import { mutationQueue, generateUUID } from '../../../src/sync/mutationQueue'
import { offlineDb, clearAll } from '../../../src/db/offlineDb'
import { _resetNetworkMode } from '../../../src/sync/networkMode'
import { _resetOfflinePrefs, setConflictStrategy } from '../../../src/sync/offlinePrefs'
import { buildPlace } from '../../helpers/factories'

beforeEach(async () => {
  await clearAll()
  mutationQueue._resetFlushing()
  _resetNetworkMode()
  _resetOfflinePrefs()
  setAuthed(true)
  Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true })
})

afterEach(() => {
  vi.restoreAllMocks()
  setAuthed(false)
})

const BASE = '2026-01-01 00:00:00'

function enqueueConflictingPut(id: string, baseUpdatedAt: string | null = BASE) {
  return mutationQueue.enqueue({
    id, tripId: 1, method: 'PUT', url: '/trips/1/places/42',
    body: { name: 'Mine' }, resource: 'places', entityId: 42, baseUpdatedAt,
  })
}

/** Server that 409s when the base token is sent, and 200s once it isn't. */
function conflictThenAcceptHandler(serverName = 'Theirs') {
  server.use(
    http.put('/api/trips/1/places/42', ({ request }) => {
      if (request.headers.get('X-Base-Updated-At')) {
        return HttpResponse.json({ error: 'conflict', server: buildPlace({ trip_id: 1, id: 42, name: serverName }) }, { status: 409 })
      }
      return HttpResponse.json({ place: buildPlace({ trip_id: 1, id: 42, name: 'Mine' }) })
    }),
  )
}

describe('mutationQueue — base-version header', () => {
  it('sends X-Base-Updated-At when the mutation carries a base version', async () => {
    let captured: string | null = null
    server.use(http.put('/api/trips/1/places/42', ({ request }) => {
      captured = request.headers.get('X-Base-Updated-At')
      return HttpResponse.json({ place: buildPlace({ trip_id: 1, id: 42 }) })
    }))
    await enqueueConflictingPut(generateUUID())
    await mutationQueue.flush()
    expect(captured).toBe(BASE)
  })

  it('omits the header when there is no base version', async () => {
    let hadHeader = true
    server.use(http.put('/api/trips/1/places/42', ({ request }) => {
      hadHeader = request.headers.has('X-Base-Updated-At')
      return HttpResponse.json({ place: buildPlace({ trip_id: 1, id: 42 }) })
    }))
    await enqueueConflictingPut(generateUUID(), null)
    await mutationQueue.flush()
    expect(hadHeader).toBe(false)
  })
})

describe('mutationQueue — 409 with strategy "ask"', () => {
  it('parks the mutation as a conflict carrying the server version', async () => {
    const id = generateUUID()
    server.use(http.put('/api/trips/1/places/42', () =>
      HttpResponse.json({ error: 'conflict', server: buildPlace({ trip_id: 1, id: 42, name: 'Theirs' }) }, { status: 409 })))
    await enqueueConflictingPut(id)

    await mutationQueue.flush()

    const m = await offlineDb.mutationQueue.get(id)
    expect(m!.status).toBe('conflict')
    expect((m!.conflictServer as { name: string }).name).toBe('Theirs')
    expect(await mutationQueue.conflictCount()).toBe(1)
    expect(await mutationQueue.failedCount()).toBe(0)
  })

  it('does not count a conflict as pending and is skipped by later flushes', async () => {
    const id = generateUUID()
    server.use(http.put('/api/trips/1/places/42', () =>
      HttpResponse.json({ error: 'conflict', server: buildPlace({ trip_id: 1, id: 42 }) }, { status: 409 })))
    await enqueueConflictingPut(id)
    await mutationQueue.flush()
    expect(await mutationQueue.pendingCount()).toBe(0)
    // A second flush must not touch the parked conflict.
    await mutationQueue.flush()
    expect((await offlineDb.mutationQueue.get(id))!.status).toBe('conflict')
  })
})

describe('mutationQueue — conflict resolution', () => {
  it('keep-mine re-sends without the base token and clears the conflict', async () => {
    const id = generateUUID()
    conflictThenAcceptHandler()
    await enqueueConflictingPut(id)
    await mutationQueue.flush()
    expect((await offlineDb.mutationQueue.get(id))!.status).toBe('conflict')

    await mutationQueue.resolveKeepMine(id)

    expect(await offlineDb.mutationQueue.get(id)).toBeUndefined()
    expect((await offlineDb.places.get(42))!.name).toBe('Mine')
    expect(await mutationQueue.conflictCount()).toBe(0)
  })

  it('keep-theirs adopts the server entity and drops the queued write', async () => {
    const id = generateUUID()
    server.use(http.put('/api/trips/1/places/42', () =>
      HttpResponse.json({ error: 'conflict', server: buildPlace({ trip_id: 1, id: 42, name: 'Theirs' }) }, { status: 409 })))
    await enqueueConflictingPut(id)
    await mutationQueue.flush()

    await mutationQueue.resolveKeepServer(id)

    expect(await offlineDb.mutationQueue.get(id)).toBeUndefined()
    expect((await offlineDb.places.get(42))!.name).toBe('Theirs')
  })
})

describe('mutationQueue — chained edits to the same entity', () => {
  it('do NOT self-conflict: the new token is propagated to the next queued edit (#1135)', async () => {
    // A server that does real compare-and-swap on X-Base-Updated-At and bumps
    // the token on each accepted write.
    let token = 'T0'
    let serverPlace = { ...buildPlace({ trip_id: 1, id: 42, name: 'A' }), notes: 'orig', updated_at: token } as Record<string, unknown>
    server.use(http.put('/api/trips/1/places/42', async ({ request }) => {
      const base = request.headers.get('X-Base-Updated-At')
      if (base !== token) return HttpResponse.json({ error: 'conflict', server: serverPlace }, { status: 409 })
      const body = await request.json() as Record<string, unknown>
      token = token === 'T0' ? 'T1' : 'T2'
      serverPlace = { ...serverPlace, ...body, updated_at: token }
      return HttpResponse.json({ place: serverPlace })
    }))

    await offlineDb.places.put({ ...(serverPlace as object) } as never)
    // Two offline edits to different fields of place 42, both based on T0.
    await mutationQueue.enqueue({ id: 'm1', tripId: 1, method: 'PUT', url: '/trips/1/places/42', body: { name: 'B' }, resource: 'places', entityId: 42, baseUpdatedAt: 'T0' })
    await mutationQueue.enqueue({ id: 'm2', tripId: 1, method: 'PUT', url: '/trips/1/places/42', body: { notes: 'edited' }, resource: 'places', entityId: 42, baseUpdatedAt: 'T0' })

    await mutationQueue.flush()

    expect(await mutationQueue.conflictCount()).toBe(0)
    expect(await offlineDb.mutationQueue.count()).toBe(0)
    const final = await offlineDb.places.get(42) as unknown as { name: string; notes: string }
    expect(final.name).toBe('B')
    expect(final.notes).toBe('edited')
  })
})

describe('mutationQueue — auto strategies', () => {
  it('"server" adopts the server version automatically', async () => {
    setConflictStrategy('server')
    const id = generateUUID()
    server.use(http.put('/api/trips/1/places/42', () =>
      HttpResponse.json({ error: 'conflict', server: buildPlace({ trip_id: 1, id: 42, name: 'Theirs' }) }, { status: 409 })))
    await enqueueConflictingPut(id)

    await mutationQueue.flush()

    expect(await offlineDb.mutationQueue.get(id)).toBeUndefined()
    expect((await offlineDb.places.get(42))!.name).toBe('Theirs')
    expect(await mutationQueue.conflictCount()).toBe(0)
  })

  it('"mine" re-sends unconditionally and wins', async () => {
    setConflictStrategy('mine')
    const id = generateUUID()
    conflictThenAcceptHandler()
    await enqueueConflictingPut(id)

    await mutationQueue.flush()

    expect(await offlineDb.mutationQueue.get(id)).toBeUndefined()
    expect((await offlineDb.places.get(42))!.name).toBe('Mine')
    expect(await mutationQueue.conflictCount()).toBe(0)
  })
})
