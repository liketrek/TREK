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

describe('mutationQueue.flush — interrupted flush recovery', () => {
  it('replays a row an earlier flush abandoned on syncing', async () => {
    let seen = 0;
    server.use(
      http.post('/api/trips/1/places', () => {
        seen += 1;
        return HttpResponse.json({ place: buildPlace({ id: 42 }) });
      }),
    );

    // What a killed tab leaves behind: marked syncing, stamped long enough ago
    // that no live request could still be in flight.
    const id = generateUUID();
    await offlineDb.mutationQueue.add({
      id, tripId: 1, method: 'POST', url: '/trips/1/places',
      body: { name: 'Eiffel Tower' }, resource: 'places',
      createdAt: Date.now() - 600_000, status: 'syncing', attempts: 0, lastError: null,
      syncingSince: Date.now() - 600_000,
    });

    await mutationQueue.flush();

    expect(seen).toBe(1);
    expect(await offlineDb.mutationQueue.get(id)).toBeUndefined();
  });

  it('leaves a freshly marked syncing row alone (a concurrent flush owns it)', async () => {
    const id = generateUUID();
    await offlineDb.mutationQueue.add({
      id, tripId: 1, method: 'POST', url: '/trips/1/places',
      body: { name: 'Eiffel Tower' }, resource: 'places',
      createdAt: Date.now(), status: 'syncing', attempts: 0, lastError: null,
      syncingSince: Date.now(),
    });

    await mutationQueue.flush();

    expect((await offlineDb.mutationQueue.get(id))!.status).toBe('syncing');
  });
});

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

describe('mutationQueue.flush: a write the server keeps failing on', () => {
  it('holds back only its own trip, with a growing gap, while other trips sync', async () => {
    const stuck = generateUUID();
    const sameTrip = generateUUID();
    const otherTrip = generateUUID();
    await mutationQueue.enqueue(makeMutation({ id: stuck }));
    await mutationQueue.enqueue(makeMutation({ id: sameTrip, body: { name: 'Louvre' } }));
    await mutationQueue.enqueue(makeMutation({ id: otherTrip, tripId: 2, url: '/trips/2/places' }));

    server.use(
      http.post('/api/trips/1/places', () => HttpResponse.json({ error: 'boom' }, { status: 500 })),
      http.post('/api/trips/2/places', () => HttpResponse.json({ place: buildPlace({ trip_id: 2, id: 77 }) })),
    );

    const before = Date.now();
    await mutationQueue.flush();

    const first = await offlineDb.mutationQueue.get(stuck);
    expect(first).toMatchObject({ status: 'pending', attempts: 1 });
    expect(first!.retryAfter).toBeGreaterThanOrEqual(before + 30_000);
    // The trip's later write keeps its place in line…
    expect(await offlineDb.mutationQueue.get(sameTrip)).toMatchObject({ status: 'pending', attempts: 0 });
    // …and the other trip is not held up at all.
    expect(await offlineDb.mutationQueue.get(otherTrip)).toBeUndefined();

    // Inside the gap the next trigger does not knock again.
    await mutationQueue.flush();
    expect((await offlineDb.mutationQueue.get(stuck))!.attempts).toBe(1);
  });

  it('parks it as failed once it has failed often enough, so the trip moves on', async () => {
    const stuck = generateUUID();
    const tempId = nextTempId();
    await offlineDb.places.put(buildPlace({ trip_id: 1, id: tempId }));
    await mutationQueue.enqueue(makeMutation({ id: stuck, tempId }));
    await offlineDb.mutationQueue.update(stuck, { attempts: 7 });

    server.use(http.post('/api/trips/1/places', () => HttpResponse.json({ error: 'boom' }, { status: 500 })));
    await mutationQueue.flush();

    expect(await offlineDb.mutationQueue.get(stuck)).toMatchObject({ status: 'failed', attempts: 8 });
    expect(await offlineDb.places.get(tempId)).toBeUndefined();
    expect(await mutationQueue.failedCount()).toBe(1);
  });

  it('counts a DELETE the server answers 404 as done', async () => {
    const id = generateUUID();
    await offlineDb.places.put(buildPlace({ trip_id: 1, id: 5 }));
    await mutationQueue.enqueue(makeMutation({ id, method: 'DELETE', url: '/trips/1/places/5', body: undefined, entityId: 5 }));

    server.use(http.delete('/api/trips/1/places/5', () => HttpResponse.json({ error: 'Place not found' }, { status: 404 })));
    await mutationQueue.flush();

    expect(await offlineDb.mutationQueue.get(id)).toBeUndefined();
    expect(await offlineDb.places.get(5)).toBeUndefined();
    expect(await mutationQueue.failedCount()).toBe(0);
  });
});

describe('mutationQueue: parked changes', () => {
  it('retryFailed puts them back in line from a fresh start and sends them', async () => {
    const id = generateUUID();
    await mutationQueue.enqueue(makeMutation({ id }));
    await offlineDb.mutationQueue.update(id, { status: 'failed', attempts: 8, lastError: 'boom' });
    server.use(http.post('/api/trips/1/places', () => HttpResponse.json({ place: buildPlace({ trip_id: 1, id: 91 }) })));

    await mutationQueue.retryFailed();

    expect(await offlineDb.mutationQueue.get(id)).toBeUndefined();
    expect(await offlineDb.places.get(91)).toBeDefined();
  });

  it('discardFailed drops only the parked ones', async () => {
    const parked = generateUUID();
    const waiting = generateUUID();
    await mutationQueue.enqueue(makeMutation({ id: parked }));
    await mutationQueue.enqueue(makeMutation({ id: waiting }));
    await offlineDb.mutationQueue.update(parked, { status: 'failed' });
    server.use(http.post('/api/trips/1/places', () => HttpResponse.json({ error: 'down' }, { status: 503 })));

    await mutationQueue.discardFailed();

    expect(await offlineDb.mutationQueue.get(parked)).toBeUndefined();
    expect(await offlineDb.mutationQueue.get(waiting)).toBeDefined();
  });
});

describe('mutationQueue: writes to one entity keep their order around a parked one', () => {
  function editPlace(id: string, name: string, placeId = 5) {
    return makeMutation({ id, method: 'PUT', url: `/trips/1/places/${placeId}`, body: { name }, entityId: placeId });
  }

  /** Answers every PUT of place 5 and 6 with `status`, recording the names in arrival order. */
  function recordPuts(status: number) {
    const seen: string[] = [];
    const answer = async (request: Request, id: number) => {
      const { name } = await request.json() as { name: string };
      seen.push(name);
      return status < 300
        ? HttpResponse.json({ place: buildPlace({ trip_id: 1, id, name }) })
        : HttpResponse.json({ error: 'boom' }, { status });
    };
    server.use(
      http.put('/api/trips/1/places/5', ({ request }) => answer(request, 5)),
      http.put('/api/trips/1/places/6', ({ request }) => answer(request, 6)),
    );
    return seen;
  }

  it('a write parked in this pass holds back the later write to the same entity', async () => {
    const first = generateUUID();
    const second = generateUUID();
    await mutationQueue.enqueue(editPlace(first, 'A'));
    await mutationQueue.enqueue(editPlace(second, 'B'));
    await offlineDb.mutationQueue.update(first, { attempts: 7 });
    const seen = recordPuts(500);

    await mutationQueue.flush();

    expect(seen).toEqual(['A']);
    expect(await offlineDb.mutationQueue.get(first)).toMatchObject({ status: 'failed' });
    expect(await offlineDb.mutationQueue.get(second)).toMatchObject({ status: 'pending', attempts: 0 });
  });

  it('Try again replays the parked write first, so it cannot overwrite the newer one', async () => {
    const first = generateUUID();
    const second = generateUUID();
    await mutationQueue.enqueue(editPlace(first, 'A'));
    await mutationQueue.enqueue(editPlace(second, 'B'));
    await offlineDb.mutationQueue.update(first, { status: 'failed', attempts: 8, lastError: 'boom' });

    const held = recordPuts(200);
    await mutationQueue.flush();
    expect(held).toEqual([]);

    await mutationQueue.retryFailed();
    expect(held).toEqual(['A', 'B']);
    expect(await offlineDb.mutationQueue.count()).toBe(0);
    expect((await offlineDb.places.get(5))!.name).toBe('B');
  });

  it('a terminal 4xx holds back the later write as well', async () => {
    const first = generateUUID();
    const second = generateUUID();
    await mutationQueue.enqueue(editPlace(first, 'A'));
    await mutationQueue.enqueue(editPlace(second, 'B'));
    const seen = recordPuts(400);

    await mutationQueue.flush();

    expect(seen).toEqual(['A']);
    expect(await offlineDb.mutationQueue.get(second)).toMatchObject({ status: 'pending' });
  });

  it('other entities and older writes are not held back', async () => {
    const older = generateUUID();
    const parked = generateUUID();
    const other = generateUUID();
    await mutationQueue.enqueue(editPlace(older, 'old'));
    await mutationQueue.enqueue(editPlace(parked, 'A'));
    await mutationQueue.enqueue(editPlace(other, 'C', 6));
    await offlineDb.mutationQueue.update(parked, { status: 'failed', attempts: 8 });
    const seen = recordPuts(200);

    await mutationQueue.flush();

    expect(seen).toEqual(['old', 'C']);
    expect(await offlineDb.mutationQueue.get(parked)).toMatchObject({ status: 'failed' });
  });

  it('Discard sends the writes that waited behind the parked one', async () => {
    const first = generateUUID();
    const second = generateUUID();
    await mutationQueue.enqueue(editPlace(first, 'A'));
    await mutationQueue.enqueue(editPlace(second, 'B'));
    await offlineDb.mutationQueue.update(first, { status: 'failed', attempts: 8 });
    const seen = recordPuts(200);

    await mutationQueue.discardFailed();

    expect(seen).toEqual(['B']);
    expect(await offlineDb.mutationQueue.count()).toBe(0);
  });

  it('writes queued against a parked offline create wait for it instead of failing', async () => {
    const create = generateUUID();
    const edit = generateUUID();
    const tempId = nextTempId();
    await mutationQueue.enqueue(makeMutation({ id: create, tempId }));
    await mutationQueue.enqueue(makeMutation({
      id: edit, method: 'PUT', url: '/trips/1/places/{id}', body: { name: 'Renamed' }, entityId: tempId, tempEntityId: tempId,
    }));
    await offlineDb.mutationQueue.update(create, { attempts: 7 });
    server.use(http.post('/api/trips/1/places', () => HttpResponse.json({ error: 'boom' }, { status: 500 })));

    await mutationQueue.flush();
    expect(await offlineDb.mutationQueue.get(create)).toMatchObject({ status: 'failed' });
    expect(await offlineDb.mutationQueue.get(edit)).toMatchObject({ status: 'pending', attempts: 0 });

    const sent: string[] = [];
    server.use(
      http.post('/api/trips/1/places', () => { sent.push('create'); return HttpResponse.json({ place: buildPlace({ trip_id: 1, id: 321 }) }); }),
      http.put('/api/trips/1/places/321', () => { sent.push('edit'); return HttpResponse.json({ place: buildPlace({ trip_id: 1, id: 321, name: 'Renamed' }) }); }),
    );
    await mutationQueue.retryFailed();

    expect(sent).toEqual(['create', 'edit']);
    expect(await offlineDb.mutationQueue.count()).toBe(0);
  });
});

describe('mutationQueue.mustQueue: a write to an entity with an older one still in the queue', () => {
  const visit = (status: 'pending' | 'syncing' | 'failed' | 'conflict', entityId = 7) => ({
    id: generateUUID(), tripId: 1, method: 'PUT' as const, url: `/trips/1/assignments/${entityId}/time`,
    body: {}, createdAt: 1, status, attempts: 0, lastError: null, resource: 'assignments', entityId,
  });

  it('is always true offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false });
    expect(await mutationQueue.mustQueue('assignments', 7)).toBe(true);
  });

  it('is false online while nothing is queued for the entity', async () => {
    await offlineDb.mutationQueue.put(visit('failed', 8));
    await offlineDb.mutationQueue.put({ ...visit('failed'), resource: 'places' });
    expect(await mutationQueue.mustQueue('assignments', 7)).toBe(false);
  });

  it.each(['pending', 'syncing', 'failed', 'conflict'] as const)('is true online behind a %s write to the entity', async status => {
    await offlineDb.mutationQueue.put(visit(status));
    expect(await mutationQueue.mustQueue('assignments', 7)).toBe(true);
  });

  it('is true for an edit of an offline create that has not synced yet', async () => {
    await mutationQueue.enqueue({ id: generateUUID(), tripId: 1, method: 'POST', url: '/trips/1/tours', body: {}, resource: 'tours', tempId: -42 });
    expect(await mutationQueue.mustQueue('tours', -42)).toBe(true);
  });
});

describe('mutationQueue.flush: one tab at a time', () => {
  /** A Web Locks stand-in: one holder per name, later requests wait their turn. */
  function fakeLocks() {
    const tails = new Map<string, Promise<unknown>>();
    const request = vi.fn((name: string, cb: (lock: { name: string }) => unknown) => {
      const run = (tails.get(name) ?? Promise.resolve()).then(() => cb({ name }));
      tails.set(name, run.catch(() => {}));
      return run;
    });
    Object.defineProperty(navigator, 'locks', { value: { request }, configurable: true });
    /** Another tab takes the lock and keeps it until the returned function runs. */
    const holdElsewhere = () => {
      let release = () => {};
      void request(`trek-mutation-flush:${offlineDb.name}`, () => new Promise<void>(r => { release = r; }));
      return () => release();
    };
    return { request, holdElsewhere };
  }

  const settle = () => new Promise(resolve => setTimeout(resolve, 20));

  afterEach(() => {
    Reflect.deleteProperty(navigator, 'locks');
  });

  it('waits for the tab that holds the lock, so what the caller does next sees its replay', async () => {
    const locks = fakeLocks();
    const releaseOther = locks.holdElsewhere();
    const id = generateUUID();
    await mutationQueue.enqueue(makeMutation({ id }));
    let sent = 0;
    server.use(http.post('/api/trips/1/places', () => { sent++; return HttpResponse.json({ place: buildPlace({ trip_id: 1, id: 61 }) }); }));

    let done = false;
    const flushed = mutationQueue.flush().then(() => { done = true; });
    await settle();
    // Still waiting: a caller chaining a re-seed onto this flush must not run yet.
    expect(done).toBe(false);
    expect(sent).toBe(0);

    // The other tab sends the row and lets go of the lock.
    await offlineDb.mutationQueue.delete(id);
    releaseOther();
    await flushed;

    expect(done).toBe(true);
    expect(sent).toBe(0);
    expect(locks.request).toHaveBeenCalledWith(`trek-mutation-flush:${offlineDb.name}`, expect.any(Function));
  });

  it('sends what the other tab left once it has the lock', async () => {
    const locks = fakeLocks();
    const releaseOther = locks.holdElsewhere();
    const id = generateUUID();
    await mutationQueue.enqueue(makeMutation({ id }));
    let sent = 0;
    server.use(http.post('/api/trips/1/places', () => { sent++; return HttpResponse.json({ place: buildPlace({ trip_id: 1, id: 63 }) }); }));

    const flushed = mutationQueue.flush();
    await settle();
    releaseOther();
    await flushed;

    expect(sent).toBe(1);
    expect(await offlineDb.mutationQueue.get(id)).toBeUndefined();
  });

  it('a second flush while the first waits for the lock resolves only with it', async () => {
    const locks = fakeLocks();
    const releaseOther = locks.holdElsewhere();
    const id = generateUUID();
    await mutationQueue.enqueue(makeMutation({ id }));
    let sent = 0;
    server.use(http.post('/api/trips/1/places', () => { sent++; return HttpResponse.json({ place: buildPlace({ trip_id: 1, id: 64 }) }); }));

    const first = mutationQueue.flush();
    await settle();
    // The socket's reconnect hook calls in here and refetches once this resolves.
    let secondDone = false;
    const second = mutationQueue.flush().then(() => { secondDone = true; });
    await settle();
    expect(secondDone).toBe(false);

    releaseOther();
    await Promise.all([first, second]);

    expect(secondDone).toBe(true);
    expect(sent).toBe(1);
    // One lock request for the waiting pass and one for the extra pass it was asked for.
    expect(locks.request).toHaveBeenCalledTimes(3);
  });

  it('a write queued during a pass goes out before the second caller resolves', async () => {
    const first = generateUUID();
    const later = generateUUID();
    await mutationQueue.enqueue(makeMutation({ id: first }));
    const sent: string[] = [];
    let second: Promise<string[]> | undefined;
    server.use(http.post('/api/trips/1/places', async ({ request }) => {
      const { name } = await request.json() as { name: string };
      sent.push(name);
      if (name === 'Eiffel Tower') {
        await mutationQueue.enqueue(makeMutation({ id: later, body: { name: 'Louvre' } }));
        // What had been sent at the moment this second call resolved.
        second = mutationQueue.flush().then(() => [...sent]);
      }
      return HttpResponse.json({ place: buildPlace({ trip_id: 1, id: sent.length + 70 }) });
    }));

    const firstRun = mutationQueue.flush();
    await vi.waitFor(() => expect(second).toBeDefined());

    // Resolved only after the extra pass sent the later write, not when it was asked for.
    expect(await second).toEqual(['Eiffel Tower', 'Louvre']);
    expect(await offlineDb.mutationQueue.count()).toBe(0);
    await firstRun;
  });

  it('flushes under the flag alone when the lock request is refused', async () => {
    Object.defineProperty(navigator, 'locks', {
      value: { request: vi.fn().mockRejectedValue(new DOMException('denied', 'SecurityError')) },
      configurable: true,
    });
    const id = generateUUID();
    await mutationQueue.enqueue(makeMutation({ id }));
    server.use(http.post('/api/trips/1/places', () => HttpResponse.json({ place: buildPlace({ trip_id: 1, id: 62 }) })));

    await mutationQueue.flush();

    expect(await offlineDb.mutationQueue.get(id)).toBeUndefined();
  });
});
