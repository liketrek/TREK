/**
 * mutationQueue replay of offline file writes (#2601): the file answers carry no
 * ids of further links, so a replayed edit or star keeps the ones the local copy
 * holds, the link answer ({ success, links }) writes no row, and a queued trash
 * move takes the file off the local list for good.
 */
import 'fake-indexeddb/auto';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAll, offlineDb } from '../../../src/db/offlineDb';
import { fileRepo } from '../../../src/repo/fileRepo';
import { setAuthed } from '../../../src/sync/authGate';
import { mutationQueue } from '../../../src/sync/mutationQueue';
import { buildTripFile } from '../../helpers/factories';
import { server } from '../../helpers/msw/server';

function setOnline(v: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value: v, writable: true, configurable: true });
}

beforeEach(async () => {
  await clearAll();
  mutationQueue._resetFlushing();
  setAuthed(true);
  setOnline(false);
});

afterEach(() => {
  vi.restoreAllMocks();
  setAuthed(false);
  setOnline(true);
});

describe('mutationQueue.flush — files', () => {
  it('FE-SYNC-FILES-001: a replayed note, star and link keep the further links and send in order', async () => {
    await offlineDb.tripFiles.put(
      buildTripFile({
        id: 12,
        trip_id: 4,
        description: null,
        starred: 0,
        linked_place_ids: [7],
        linked_reservation_ids: [],
      })
    );
    await fileRepo.update(4, 12, { description: 'Gate B' });
    await fileRepo.toggleStar(4, 12);
    await fileRepo.addLink(4, 12, { reservation_id: 9 });
    const sent: string[] = [];
    // The single-file routes answer the stored row without the link ids.
    const row = (fields: object) => ({ file: { ...buildTripFile({ id: 12, trip_id: 4 }), ...fields } });
    server.use(
      http.put('/api/trips/4/files/12', () => {
        sent.push('PUT');
        return HttpResponse.json(row({ description: 'Gate B', starred: 0 }));
      }),
      http.patch('/api/trips/4/files/12/star', () => {
        sent.push('PATCH');
        return HttpResponse.json(row({ description: 'Gate B', starred: 1 }));
      }),
      http.post('/api/trips/4/files/12/link', () => {
        sent.push('POST');
        return HttpResponse.json({ success: true, links: [{ id: 3, file_id: 12, reservation_id: 9 }] });
      })
    );
    setOnline(true);

    await mutationQueue.flush();

    expect(sent).toEqual(['PUT', 'PATCH', 'POST']);
    expect(await offlineDb.mutationQueue.count()).toBe(0);
    expect(await offlineDb.tripFiles.get(12)).toMatchObject({
      description: 'Gate B',
      starred: 1,
      linked_place_ids: [7],
      linked_reservation_ids: [9],
    });
    // The link answer named no file, so no other row appeared.
    expect(await offlineDb.tripFiles.count()).toBe(1);
  });

  it('FE-SYNC-FILES-002: a replayed trash move and a restore leave the local list as the server has it', async () => {
    await offlineDb.tripFiles.put(buildTripFile({ id: 12, trip_id: 4 }));
    await fileRepo.delete(4, 12);
    await fileRepo.restore(4, 20, buildTripFile({ id: 20, trip_id: 4, deleted_at: '2026-10-01 10:00:00' }));
    server.use(
      http.delete('/api/trips/4/files/12', () => HttpResponse.json({ success: true })),
      http.post('/api/trips/4/files/20/restore', () =>
        HttpResponse.json({ file: buildTripFile({ id: 20, trip_id: 4, deleted_at: null, original_name: 'back.pdf' }) })
      )
    );
    setOnline(true);

    await mutationQueue.flush();

    expect(await offlineDb.mutationQueue.count()).toBe(0);
    expect(await offlineDb.tripFiles.get(12)).toBeUndefined();
    expect(await offlineDb.tripFiles.get(20)).toMatchObject({ original_name: 'back.pdf', deleted_at: null });
  });
});
