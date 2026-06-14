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
import { mutationQueue, generateUUID } from '../../../src/sync/mutationQueue';
import { setAuthed } from '../../../src/sync/authGate';
import { offlineDb, clearAll } from '../../../src/db/offlineDb';
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
