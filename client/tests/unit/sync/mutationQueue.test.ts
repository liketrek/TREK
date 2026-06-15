/**
 * mutationQueue unit tests.
 *
 * Covers: enqueue, flush (2xx success, 4xx fail, network error), idempotency header,
 * pending count, create temp-id reconciliation, delete Dexie cleanup.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { server } from '../../helpers/msw/server';
import { http, HttpResponse } from 'msw';
import { setAuthed } from '../../../src/sync/authGate';
import { mutationQueue, generateUUID, nextTempId } from '../../../src/sync/mutationQueue';
import { offlineDb, clearAll } from '../../../src/db/offlineDb';
import { placeRepo } from '../../../src/repo/placeRepo';
import { buildPlace, buildPackingItem } from '../../helpers/factories';

beforeEach(async () => {
  await clearAll();
  mutationQueue._resetFlushing();
  setAuthed(true);
  Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
});

afterEach(() => {
  vi.restoreAllMocks();
  setAuthed(false);
});

// ── helpers ──────────────────────────────────────────────────────────────────

function makeMutation(overrides: Partial<Parameters<typeof mutationQueue.enqueue>[0]> = {}) {
  return {
    id: generateUUID(),
    tripId: 1,
    method: 'POST' as const,
    url: '/trips/1/places',
    body: { name: 'Eiffel Tower' },
    resource: 'places',
    ...overrides,
  };
}

// ── enqueue ───────────────────────────────────────────────────────────────────

describe('mutationQueue.enqueue', () => {
  it('stores mutation with pending status', async () => {
    const id = generateUUID();
    await mutationQueue.enqueue(makeMutation({ id }));

    const stored = await offlineDb.mutationQueue.get(id);
    expect(stored).toBeDefined();
    expect(stored!.status).toBe('pending');
    expect(stored!.attempts).toBe(0);
  });

  it('returns the mutation id', async () => {
    const id = generateUUID();
    const returned = await mutationQueue.enqueue(makeMutation({ id }));
    expect(returned).toBe(id);
  });
});

// ── flush — success path ──────────────────────────────────────────────────────

describe('mutationQueue.flush — 2xx success', () => {
  it('removes mutation from queue and writes canonical entity to Dexie', async () => {
    const place = buildPlace({ trip_id: 1, id: 42 });
    const id = generateUUID();
    await mutationQueue.enqueue(makeMutation({ id }));

    server.use(
      http.post('/api/trips/1/places', () => HttpResponse.json({ place })),
    );

    await mutationQueue.flush();

    const queued = await offlineDb.mutationQueue.get(id);
    expect(queued).toBeUndefined();

    const cached = await offlineDb.places.get(42);
    expect(cached).toBeDefined();
    expect(cached!.name).toBe(place.name);
  });

  it('attaches X-Idempotency-Key header matching the mutation id', async () => {
    const place = buildPlace({ trip_id: 1 });
    const id = generateUUID();
    await mutationQueue.enqueue(makeMutation({ id }));

    let capturedKey: string | null = null;
    server.use(
      http.post('/api/trips/1/places', ({ request }) => {
        capturedKey = request.headers.get('X-Idempotency-Key');
        return HttpResponse.json({ place });
      }),
    );

    await mutationQueue.flush();
    expect(capturedKey).toBe(id);
  });

  it('removes temp entry and adds canonical entry on CREATE flush', async () => {
    const tempId = -12345;
    const place = buildPlace({ trip_id: 1, id: 99 });
    const id = generateUUID();

    // Optimistic temp entry in Dexie
    await offlineDb.places.put({ ...place, id: tempId });

    await mutationQueue.enqueue(makeMutation({ id, tempId }));

    server.use(
      http.post('/api/trips/1/places', () => HttpResponse.json({ place })),
    );

    await mutationQueue.flush();

    expect(await offlineDb.places.get(tempId)).toBeUndefined();
    expect(await offlineDb.places.get(99)).toBeDefined();
  });

  it('handles DELETE: removes entity from Dexie after flush', async () => {
    const place = buildPlace({ trip_id: 1, id: 55 });
    await offlineDb.places.put(place);

    const id = generateUUID();
    await mutationQueue.enqueue({
      id,
      tripId: 1,
      method: 'DELETE',
      url: '/trips/1/places/55',
      body: undefined,
      resource: 'places',
      entityId: 55,
    });

    server.use(
      http.delete('/api/trips/1/places/55', () => HttpResponse.json({ success: true })),
    );

    await mutationQueue.flush();

    expect(await offlineDb.mutationQueue.get(id)).toBeUndefined();
    expect(await offlineDb.places.get(55)).toBeUndefined();
  });
});

// ── flush — error paths ───────────────────────────────────────────────────────

describe('mutationQueue.flush — 4xx client error', () => {
  it('marks mutation as failed and continues to next mutation', async () => {
    const id1 = generateUUID();
    const id2 = generateUUID();
    const place = buildPlace({ trip_id: 1 });

    // Enqueue in order
    await mutationQueue.enqueue(makeMutation({ id: id1 }));
    await mutationQueue.enqueue(makeMutation({ id: id2 }));

    let callCount = 0;
    server.use(
      http.post('/api/trips/1/places', () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json({ error: 'Bad request' }, { status: 400 });
        }
        return HttpResponse.json({ place });
      }),
    );

    await mutationQueue.flush();

    const m1 = await offlineDb.mutationQueue.get(id1);
    expect(m1).toBeDefined();
    expect(m1!.status).toBe('failed');

    // Second mutation succeeded and was removed
    expect(await offlineDb.mutationQueue.get(id2)).toBeUndefined();
  });
});

describe('mutationQueue.flush — network error', () => {
  it('resets to pending and stops flush without marking failed', async () => {
    const id = generateUUID();
    await mutationQueue.enqueue(makeMutation({ id }));

    server.use(
      http.post('/api/trips/1/places', () => HttpResponse.error()),
    );

    await mutationQueue.flush();

    const m = await offlineDb.mutationQueue.get(id);
    expect(m).toBeDefined();
    expect(m!.status).toBe('pending');
    expect(m!.attempts).toBe(1);
  });
});

// ── flush — offline guard ─────────────────────────────────────────────────────

describe('mutationQueue.flush — offline guard', () => {
  it('does nothing when offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false });
    const id = generateUUID();
    await mutationQueue.enqueue(makeMutation({ id }));

    let called = false;
    server.use(
      http.post('/api/trips/1/places', () => {
        called = true;
        return HttpResponse.json({ place: buildPlace({ trip_id: 1 }) });
      }),
    );

    await mutationQueue.flush();
    expect(called).toBe(false);
    const m = await offlineDb.mutationQueue.get(id);
    expect(m!.status).toBe('pending');
  });

  it('does nothing when logged out (auth gate closed)', async () => {
    setAuthed(false);
    const id = generateUUID();
    await mutationQueue.enqueue(makeMutation({ id }));

    let called = false;
    server.use(
      http.post('/api/trips/1/places', () => {
        called = true;
        return HttpResponse.json({ place: buildPlace({ trip_id: 1 }) });
      }),
    );

    await mutationQueue.flush();
    expect(called).toBe(false);
    const m = await offlineDb.mutationQueue.get(id);
    expect(m!.status).toBe('pending');
  });
});

// ── pending / pendingCount ────────────────────────────────────────────────────

describe('mutationQueue.pending', () => {
  it('returns pending mutations for a trip', async () => {
    const id1 = generateUUID();
    const id2 = generateUUID();
    await mutationQueue.enqueue(makeMutation({ id: id1, tripId: 1 }));
    await mutationQueue.enqueue(makeMutation({ id: id2, tripId: 2 }));

    const trip1 = await mutationQueue.pending(1);
    expect(trip1).toHaveLength(1);
    expect(trip1[0].id).toBe(id1);
  });

  it('returns all pending when no tripId given', async () => {
    await mutationQueue.enqueue(makeMutation({ id: generateUUID(), tripId: 1 }));
    await mutationQueue.enqueue(makeMutation({ id: generateUUID(), tripId: 2 }));

    const all = await mutationQueue.pending();
    expect(all).toHaveLength(2);
  });

  it('excludes failed mutations', async () => {
    const id = generateUUID();
    await mutationQueue.enqueue(makeMutation({ id }));
    await offlineDb.mutationQueue.update(id, { status: 'failed' });

    const pending = await mutationQueue.pending(1);
    expect(pending).toHaveLength(0);
  });
});

describe('mutationQueue.pendingCount', () => {
  it('returns zero for empty queue', async () => {
    expect(await mutationQueue.pendingCount()).toBe(0);
  });

  it('counts pending and syncing, excludes failed', async () => {
    const id1 = generateUUID();
    const id2 = generateUUID();
    const id3 = generateUUID();
    await mutationQueue.enqueue(makeMutation({ id: id1 }));
    await mutationQueue.enqueue(makeMutation({ id: id2 }));
    await mutationQueue.enqueue(makeMutation({ id: id3 }));
    await offlineDb.mutationQueue.update(id3, { status: 'failed' });

    expect(await mutationQueue.pendingCount()).toBe(2);
  });
});

describe('mutationQueue.failedCount', () => {
  it('counts only failed mutations (not pending/syncing)', async () => {
    const id1 = generateUUID();
    const id2 = generateUUID();
    await mutationQueue.enqueue(makeMutation({ id: id1 }));
    await mutationQueue.enqueue(makeMutation({ id: id2 }));
    await offlineDb.mutationQueue.update(id2, { status: 'failed' });

    expect(await mutationQueue.failedCount()).toBe(1);
    expect(await mutationQueue.pendingCount()).toBe(1);
  });
});

// ── B2: collision-free temp ids ────────────────────────────────────────────────

describe('nextTempId (B2)', () => {
  it('returns distinct negative ids even within the same millisecond', () => {
    mutationQueue._resetFlushing();
    const a = nextTempId();
    const b = nextTempId();
    const c = nextTempId();
    expect(a).toBeLessThan(0);
    expect(new Set([a, b, c]).size).toBe(3);
  });

  it('two tight offline creates produce two distinct Dexie rows', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false });
    await placeRepo.create(1, { name: 'First' });
    await placeRepo.create(1, { name: 'Second' });

    const rows = await offlineDb.places.where('trip_id').equals(1).toArray();
    expect(rows).toHaveLength(2);
    expect(rows.map(r => r.name).sort()).toEqual(['First', 'Second']);
  });
});

// ── B1: temp-id → real-id remapping ─────────────────────────────────────────────

describe('mutationQueue.flush — temp-id remapping (B1)', () => {
  it('rewrites a dependent PUT/DELETE to the real id within one flush', async () => {
    const tempId = -1;
    await offlineDb.places.put({ ...buildPlace({ trip_id: 1 }), id: tempId });

    const createId = generateUUID();
    const putId = generateUUID();
    const deleteId = generateUUID();

    await mutationQueue.enqueue({
      id: createId, tripId: 1, method: 'POST', url: '/trips/1/places',
      body: { name: 'Temp' }, resource: 'places', tempId,
    });
    await mutationQueue.enqueue({
      id: putId, tripId: 1, method: 'PUT', url: '/trips/1/places/{id}',
      body: { name: 'Edited' }, resource: 'places', entityId: tempId, tempEntityId: tempId,
    });
    await mutationQueue.enqueue({
      id: deleteId, tripId: 1, method: 'DELETE', url: '/trips/1/places/{id}',
      body: undefined, resource: 'places', entityId: tempId, tempEntityId: tempId,
    });

    const putUrls: string[] = [];
    const deleteUrls: string[] = [];
    server.use(
      http.post('/api/trips/1/places', () => HttpResponse.json({ place: buildPlace({ trip_id: 1, id: 42 }) })),
      http.put('/api/trips/1/places/:id', ({ params }) => { putUrls.push(String(params.id)); return HttpResponse.json({ place: buildPlace({ trip_id: 1, id: 42, name: 'Edited' }) }); }),
      http.delete('/api/trips/1/places/:id', ({ params }) => { deleteUrls.push(String(params.id)); return HttpResponse.json({ success: true }); }),
    );

    await mutationQueue.flush();

    expect(putUrls).toEqual(['42']);
    expect(deleteUrls).toEqual(['42']);
    expect(await mutationQueue.pendingCount()).toBe(0);
    expect(await mutationQueue.failedCount()).toBe(0);
  });

  it('durably rewrites a still-queued dependent after the CREATE flushes alone', async () => {
    const tempId = -7;
    await offlineDb.places.put({ ...buildPlace({ trip_id: 1 }), id: tempId });

    const createId = generateUUID();
    const putId = generateUUID();
    await mutationQueue.enqueue({
      id: createId, tripId: 1, method: 'POST', url: '/trips/1/places',
      body: { name: 'Temp' }, resource: 'places', tempId,
    });
    await mutationQueue.enqueue({
      id: putId, tripId: 1, method: 'PUT', url: '/trips/1/places/{id}',
      body: { name: 'Edited' }, resource: 'places', entityId: tempId, tempEntityId: tempId,
    });

    // Only the CREATE succeeds this round; the PUT errors out (network) and stays queued.
    let putAttempts = 0;
    server.use(
      http.post('/api/trips/1/places', () => HttpResponse.json({ place: buildPlace({ trip_id: 1, id: 88 }) })),
      http.put('/api/trips/1/places/:id', () => { putAttempts++; return HttpResponse.error(); }),
    );

    await mutationQueue.flush();

    const queuedPut = await offlineDb.mutationQueue.get(putId);
    expect(queuedPut).toBeDefined();
    expect(queuedPut!.url).toBe('/trips/1/places/88');
    expect(queuedPut!.entityId).toBe(88);
    expect(queuedPut!.tempEntityId).toBeUndefined();
    expect(putAttempts).toBeGreaterThanOrEqual(1);
  });

  it('marks an orphaned dependent (placeholder never resolved) as failed', async () => {
    const putId = generateUUID();
    await mutationQueue.enqueue({
      id: putId, tripId: 1, method: 'PUT', url: '/trips/1/places/{id}',
      body: { name: 'Edited' }, resource: 'places', entityId: -999, tempEntityId: -999,
    });

    await mutationQueue.flush();

    const m = await offlineDb.mutationQueue.get(putId);
    expect(m!.status).toBe('failed');
  });
});

// ── B3: terminal rollback + retryable classification ────────────────────────────

describe('mutationQueue.flush — failure handling (B3)', () => {
  it('rolls back the phantom optimistic row on a terminal 400 CREATE', async () => {
    const tempId = -3;
    await offlineDb.places.put({ ...buildPlace({ trip_id: 1 }), id: tempId });

    const id = generateUUID();
    await mutationQueue.enqueue(makeMutation({ id, tempId }));

    server.use(
      http.post('/api/trips/1/places', () => HttpResponse.json({ error: 'Bad' }, { status: 400 })),
    );

    await mutationQueue.flush();

    expect(await offlineDb.places.get(tempId)).toBeUndefined();
    const m = await offlineDb.mutationQueue.get(id);
    expect(m!.status).toBe('failed');
  });

  it('treats 429 as retryable: resets to pending and stops the flush', async () => {
    const id = generateUUID();
    await mutationQueue.enqueue(makeMutation({ id }));

    server.use(
      http.post('/api/trips/1/places', () => HttpResponse.json({ error: 'slow down' }, { status: 429 })),
    );

    await mutationQueue.flush();

    const m = await offlineDb.mutationQueue.get(id);
    expect(m!.status).toBe('pending');
    expect(m!.attempts).toBe(1);
    expect(await mutationQueue.failedCount()).toBe(0);
  });

  it('treats 401 as retryable rather than dropping the change', async () => {
    const id = generateUUID();
    await mutationQueue.enqueue(makeMutation({ id }));

    server.use(
      http.post('/api/trips/1/places', () => HttpResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })),
    );

    await mutationQueue.flush();

    const m = await offlineDb.mutationQueue.get(id);
    expect(m!.status).toBe('pending');
  });
});
