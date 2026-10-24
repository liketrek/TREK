// FE-REPO-FILE-OFF-001 to FE-REPO-FILE-OFF-008
// Offline write paths (#2601), fileRepo.test.ts covers the reads.
import 'fake-indexeddb/auto';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildTripFile } from '../../tests/helpers/factories';
import { server } from '../../tests/helpers/msw/server';
import { filesApi } from '../api/client';
import type { QueuedMutation } from '../db/offlineDb';
import { clearAll, offlineDb } from '../db/offlineDb';
import { setAuthed } from '../sync/authGate';
import { mutationQueue } from '../sync/mutationQueue';
import { fileRepo, NEEDS_CONNECTION } from './fileRepo';

function setOnline(v: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value: v, writable: true, configurable: true });
}

async function queue(): Promise<QueuedMutation[]> {
  return (await offlineDb.mutationQueue.toArray()).sort((a, b) => a.createdAt - b.createdAt);
}

beforeEach(async () => {
  await clearAll();
  mutationQueue._resetFlushing();
  setOnline(false);
});

afterEach(() => {
  vi.restoreAllMocks();
  setAuthed(false);
  setOnline(true);
});

describe('fileRepo — offline', () => {
  it('FE-REPO-FILE-OFF-001: a note and a place set offline land on the local file and wait in the queue', async () => {
    await offlineDb.tripFiles.put(
      buildTripFile({ id: 12, trip_id: 4, description: null, place_id: null, linked_place_ids: [7] })
    );

    const { file } = await fileRepo.update(4, 12, { description: 'Gate B', place_id: 5 });

    expect(file).toMatchObject({ id: 12, description: 'Gate B', place_id: 5, linked_place_ids: [7] });
    expect(await offlineDb.tripFiles.get(12)).toMatchObject({ description: 'Gate B', place_id: 5 });
    const [mutation] = await queue();
    expect(mutation).toMatchObject({
      method: 'PUT',
      url: '/trips/4/files/12',
      body: { description: 'Gate B', place_id: 5 },
      resource: 'tripFiles',
      entityId: 12,
    });
  });

  it('FE-REPO-FILE-OFF-002: each star toggle flips the local star and queues one PATCH', async () => {
    await offlineDb.tripFiles.put(buildTripFile({ id: 12, trip_id: 4, starred: 0 }));

    expect((await fileRepo.toggleStar(4, 12)).file.starred).toBe(1);
    expect((await fileRepo.toggleStar(4, 12)).file.starred).toBe(0);

    const rows = await queue();
    expect(rows.map((m) => [m.method, m.url])).toEqual([
      ['PATCH', '/trips/4/files/12/star'],
      ['PATCH', '/trips/4/files/12/star'],
    ]);
  });

  it('FE-REPO-FILE-OFF-003: a file moved to the trash leaves the local list and its DELETE waits', async () => {
    await offlineDb.tripFiles.bulkPut([buildTripFile({ id: 12, trip_id: 4 }), buildTripFile({ id: 13, trip_id: 4 })]);

    await fileRepo.delete(4, 12);

    expect((await fileRepo.list(4)).files.map((f) => f.id)).toEqual([13]);
    const [mutation] = await queue();
    expect(mutation).toMatchObject({ method: 'DELETE', url: '/trips/4/files/12', resource: 'tripFiles', entityId: 12 });
  });

  it('FE-REPO-FILE-OFF-004: a further link shows on the local file at once and its POST waits', async () => {
    await offlineDb.tripFiles.put(
      buildTripFile({
        id: 12,
        trip_id: 4,
        place_id: 1,
        reservation_id: 2,
        linked_place_ids: [],
        linked_reservation_ids: [],
      })
    );

    await fileRepo.addLink(4, 12, { place_id: 5 });
    await fileRepo.addLink(4, 12, { reservation_id: 9 });

    expect(await offlineDb.tripFiles.get(12)).toMatchObject({ linked_place_ids: [5], linked_reservation_ids: [9] });
    const rows = await queue();
    expect(rows.map((m) => [m.method, m.url, m.body])).toEqual([
      ['POST', '/trips/4/files/12/link', { place_id: 5 }],
      ['POST', '/trips/4/files/12/link', { reservation_id: 9 }],
    ]);
  });

  it('FE-REPO-FILE-OFF-005: restoring, deleting for good and emptying the trash wait in the queue in order', async () => {
    const trashed = buildTripFile({ id: 20, trip_id: 4, deleted_at: '2026-10-01 10:00:00' });

    await fileRepo.restore(4, 20, trashed);
    await fileRepo.permanentDelete(4, 21);
    await fileRepo.emptyTrash(4);

    expect(await offlineDb.tripFiles.get(20)).toMatchObject({ id: 20, deleted_at: null });
    const rows = await queue();
    expect(rows.map((m) => [m.method, m.url, m.resource])).toEqual([
      ['POST', '/trips/4/files/20/restore', 'tripFiles'],
      ['DELETE', '/trips/4/files/21/permanent', 'tripFiles'],
      ['DELETE', '/trips/4/files/trash/empty', undefined],
    ]);
  });

  it('FE-REPO-FILE-OFF-006: an upload and removing a further link say they need a connection and queue nothing', async () => {
    const upload = vi.spyOn(filesApi, 'upload');
    const getLinks = vi.spyOn(filesApi, 'getLinks');

    await expect(fileRepo.upload(4, new FormData())).rejects.toThrow(NEEDS_CONNECTION.uploadKey);
    await expect(fileRepo.removeLinkTo(4, 12, () => true)).rejects.toThrow(NEEDS_CONNECTION.linkKey);

    expect(upload).not.toHaveBeenCalled();
    expect(getLinks).not.toHaveBeenCalled();
    expect(await offlineDb.mutationQueue.count()).toBe(0);
  });
});

describe('fileRepo — online', () => {
  it('FE-REPO-FILE-OFF-007: an edit of a file with an older queued write joins the queue behind it', async () => {
    await offlineDb.tripFiles.put(buildTripFile({ id: 12, trip_id: 4, starred: 0 }));
    await fileRepo.toggleStar(4, 12);
    const update = vi.spyOn(filesApi, 'update');
    // Online now, but the flush that sendSoon starts must not run in this test.
    setOnline(true);
    vi.spyOn(mutationQueue, 'flush').mockResolvedValue(undefined);

    await fileRepo.update(4, 12, { description: 'Later' });

    expect(update).not.toHaveBeenCalled();
    const rows = await queue();
    expect(rows.map((m) => m.method)).toEqual(['PATCH', 'PUT']);
  });

  it('FE-REPO-FILE-OFF-008: online writes go straight out and keep the link ids the answer leaves out', async () => {
    setOnline(true);
    await offlineDb.tripFiles.put(buildTripFile({ id: 12, trip_id: 4, linked_place_ids: [7], description: null }));
    server.use(
      http.put('/api/trips/4/files/12', () =>
        HttpResponse.json({
          file: { ...buildTripFile({ id: 12, trip_id: 4, description: 'Seen' }), linked_place_ids: undefined },
        })
      )
    );

    await fileRepo.update(4, 12, { description: 'Seen' });

    expect(await offlineDb.tripFiles.get(12)).toMatchObject({ description: 'Seen', linked_place_ids: [7] });
    expect(await offlineDb.mutationQueue.count()).toBe(0);
  });
});
