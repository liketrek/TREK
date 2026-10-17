/**
 * The format stamp on queued writes.
 *
 * A queued write can be replayed by a different build than the one that queued
 * it. Rows are stamped with MUTATION_SCHEMA_VERSION; a build replays its own
 * format and older ones (an unstamped row is format 1), and leaves a row from a
 * newer format in the queue untouched, holding back the later writes to the
 * same entity.
 */
import 'fake-indexeddb/auto';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { clearAll, MUTATION_SCHEMA_VERSION, offlineDb, type QueuedMutation } from '../../../src/db/offlineDb';
import { setAuthed } from '../../../src/sync/authGate';
import { generateUUID, mutationQueue } from '../../../src/sync/mutationQueue';
import { buildPlace } from '../../helpers/factories';
import { server } from '../../helpers/msw/server';

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

/** A queued PUT of place `placeId`, written straight into the queue as a build would. */
function queuedPut(placeId: number, createdAt: number, extra: Partial<QueuedMutation> = {}): QueuedMutation {
  return {
    id: generateUUID(),
    tripId: 1,
    method: 'PUT',
    url: `/trips/1/places/${placeId}`,
    body: { name: `Place ${placeId}` },
    createdAt,
    status: 'pending',
    attempts: 0,
    lastError: null,
    resource: 'places',
    entityId: placeId,
    ...extra,
  };
}

/** Answer every place PUT with the place, and record which ids were sent. */
function answerPlacePuts(): number[] {
  const sent: number[] = [];
  server.use(
    http.put('/api/trips/1/places/:id', ({ params }) => {
      const id = Number(params.id);
      sent.push(id);
      return HttpResponse.json({ place: buildPlace({ id, trip_id: 1 }) });
    })
  );
  return sent;
}

describe('mutationQueue format stamp', () => {
  it('stamps a queued write with the format and the build that queued it', async () => {
    const id = await mutationQueue.enqueue({
      id: generateUUID(),
      tripId: 1,
      method: 'POST',
      url: '/trips/1/places',
      body: { name: 'Belem' },
      resource: 'places',
    });

    const stored = await offlineDb.mutationQueue.get(id);
    expect(stored?.schemaVersion).toBe(MUTATION_SCHEMA_VERSION);
    expect(stored?.buildVersion).toBe(__TREK_UI_VERSION__);
  });

  it('replays a write queued before the stamp existed', async () => {
    const legacy = queuedPut(21, 1);
    expect(legacy.schemaVersion).toBeUndefined();
    await offlineDb.mutationQueue.put(legacy);
    const sent = answerPlacePuts();

    await mutationQueue.flush();

    expect(sent).toEqual([21]);
    expect(await offlineDb.mutationQueue.get(legacy.id)).toBeUndefined();
  });

  it('replays a write stamped with its own format', async () => {
    const own = queuedPut(21, 1, { schemaVersion: MUTATION_SCHEMA_VERSION });
    await offlineDb.mutationQueue.put(own);
    const sent = answerPlacePuts();

    await mutationQueue.flush();

    expect(sent).toEqual([21]);
    expect(await offlineDb.mutationQueue.get(own.id)).toBeUndefined();
  });

  it('leaves a write from a newer format in the queue, unsent and unchanged', async () => {
    const newer = queuedPut(21, 1, { schemaVersion: MUTATION_SCHEMA_VERSION + 1, buildVersion: '99.0.0' });
    await offlineDb.mutationQueue.put(newer);
    const sent = answerPlacePuts();

    await mutationQueue.flush();

    expect(sent).toEqual([]);
    expect(await offlineDb.mutationQueue.get(newer.id)).toEqual(newer);
    expect(await mutationQueue.pendingCount()).toBe(1);
    expect(await mutationQueue.failedCount()).toBe(0);
  });

  it('holds back later writes to the same entity, and only those', async () => {
    const newer = queuedPut(21, 1, { schemaVersion: MUTATION_SCHEMA_VERSION + 1 });
    const sameEntity = queuedPut(21, 2, { schemaVersion: MUTATION_SCHEMA_VERSION });
    const otherEntity = queuedPut(22, 3, { schemaVersion: MUTATION_SCHEMA_VERSION });
    await offlineDb.mutationQueue.bulkPut([newer, sameEntity, otherEntity]);
    const sent = answerPlacePuts();

    await mutationQueue.flush();

    expect(sent).toEqual([22]);
    expect(await offlineDb.mutationQueue.get(otherEntity.id)).toBeUndefined();
    expect((await offlineDb.mutationQueue.get(newer.id))?.status).toBe('pending');
    expect((await offlineDb.mutationQueue.get(sameEntity.id))?.status).toBe('pending');
  });

  it('keeps a write from a newer format pending when Try again puts parked writes back', async () => {
    const newer = queuedPut(21, 1, { schemaVersion: MUTATION_SCHEMA_VERSION + 1, status: 'failed', attempts: 3 });
    await offlineDb.mutationQueue.put(newer);
    const sent = answerPlacePuts();

    await mutationQueue.retryFailed();

    expect(sent).toEqual([]);
    const stored = await offlineDb.mutationQueue.get(newer.id);
    expect(stored).toMatchObject({ status: 'pending', schemaVersion: MUTATION_SCHEMA_VERSION + 1 });
  });
});
