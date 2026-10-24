// FE-REPO-ACC-OFF-001 to FE-REPO-ACC-004
// Offline write paths (#2601), accommodationRepo.test.ts covers the reads.
import 'fake-indexeddb/auto';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildPlace } from '../../tests/helpers/factories';
import { server } from '../../tests/helpers/msw/server';
import type { QueuedMutation } from '../db/offlineDb';
import { clearAll, offlineDb } from '../db/offlineDb';
import { setAuthed } from '../sync/authGate';
import { mutationQueue } from '../sync/mutationQueue';
import { accommodationRepo } from './accommodationRepo';

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

describe('accommodationRepo offline writes', () => {
  it('FE-REPO-ACC-OFF-001: a new stay gets a temp row with its place and a queued POST', async () => {
    await offlineDb.places.put(
      buildPlace({ id: 40, trip_id: 4, name: 'Camping Nord', address: 'Seeweg 1', lat: 1, lng: 2 })
    );
    const body = { place_id: 40, start_day_id: '11', end_day_id: 12, check_in: '15:00' };

    const result = await accommodationRepo.create(4, body);

    expect(result.accommodation.id).toBeLessThan(0);
    expect(result.accommodation).toMatchObject({
      trip_id: 4,
      place_id: 40,
      start_day_id: 11,
      end_day_id: 12,
      check_in: '15:00',
      place_name: 'Camping Nord',
      place_address: 'Seeweg 1',
      place_lat: 1,
      place_lng: 2,
    });
    expect(result.assignment).toBeUndefined();
    expect(await offlineDb.accommodations.get(result.accommodation.id)).toMatchObject({ place_id: 40 });
    expect((await queue())[0]).toMatchObject({
      method: 'POST',
      url: '/trips/4/accommodations',
      resource: 'accommodations',
      tempId: result.accommodation.id,
      body,
    });
  });

  it('FE-REPO-ACC-OFF-002: an edit and a delete of an unsynced stay wait for its id, keepStop rides along', async () => {
    const { accommodation } = await accommodationRepo.create(4, { place_id: 40, start_day_id: 11, end_day_id: 12 });
    const { accommodation: edited } = await accommodationRepo.update(4, accommodation.id, { confirmation: 'AB12' });
    expect(edited).toMatchObject({ id: accommodation.id, place_id: 40, confirmation: 'AB12' });
    await accommodationRepo.delete(4, accommodation.id, { keepStop: true });

    expect(await offlineDb.accommodations.get(accommodation.id)).toBeUndefined();
    const [, edit, del] = await queue();
    expect(edit).toMatchObject({ method: 'PUT', url: '/trips/4/accommodations/{id}', tempEntityId: accommodation.id });
    expect(del).toMatchObject({
      method: 'DELETE',
      url: '/trips/4/accommodations/{id}?keepStop=true',
      tempEntityId: accommodation.id,
    });
  });

  it('FE-REPO-ACC-OFF-003: a replayed stay moves to the real id and the queued edit follows it', async () => {
    const { accommodation } = await accommodationRepo.create(4, { place_id: 40, start_day_id: 11, end_day_id: 12 });
    await accommodationRepo.update(4, accommodation.id, { notes: 'Late arrival' });
    const puts: string[] = [];
    server.use(
      http.post('/api/trips/4/accommodations', () =>
        HttpResponse.json({
          accommodation: { id: 700, trip_id: 4, place_id: 40, start_day_id: 11, end_day_id: 12 },
          assignment: null,
        })
      ),
      http.put('/api/trips/4/accommodations/:id', ({ params }) => {
        puts.push(String(params.id));
        return HttpResponse.json({
          accommodation: { id: 700, trip_id: 4, place_id: 40, start_day_id: 11, end_day_id: 12, notes: 'Late arrival' },
        });
      })
    );
    setAuthed(true);
    setOnline(true);

    await mutationQueue.flush();

    expect(puts).toEqual(['700']);
    expect(await offlineDb.mutationQueue.count()).toBe(0);
    expect(await offlineDb.accommodations.get(accommodation.id)).toBeUndefined();
    expect(await offlineDb.accommodations.get(700)).toMatchObject({ notes: 'Late arrival' });
  });

  it('FE-REPO-ACC-OFF-004: online, a delete goes straight out and hands back the stops it moved', async () => {
    setOnline(true);
    await offlineDb.accommodations.put({ id: 41, trip_id: 4, place_id: 40, start_day_id: 11, end_day_id: 12 });
    server.use(
      http.delete('/api/trips/4/accommodations/41', () =>
        HttpResponse.json({ success: true, removedAssignments: [{ id: 5, dayId: 11 }], updatedAssignments: [] })
      )
    );

    const result = await accommodationRepo.delete(4, 41);

    expect(result.removedAssignments).toEqual([{ id: 5, dayId: 11 }]);
    expect(await offlineDb.accommodations.get(41)).toBeUndefined();
    expect(await offlineDb.mutationQueue.count()).toBe(0);
  });
});
