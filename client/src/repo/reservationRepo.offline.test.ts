// FE-REPO-RESV-OFF-001 to FE-REPO-RESV-007
// Offline write paths (#2601), reservationRepo.test.ts covers the reads.
import 'fake-indexeddb/auto';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildBudgetItem, buildPlace, buildReservation } from '../../tests/helpers/factories';
import { server } from '../../tests/helpers/msw/server';
import type { QueuedMutation } from '../db/offlineDb';
import { clearAll, offlineDb } from '../db/offlineDb';
import { setAuthed } from '../sync/authGate';
import { mutationQueue } from '../sync/mutationQueue';
import { reservationRepo } from './reservationRepo';

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

describe('reservationRepo offline writes', () => {
  it('FE-REPO-RESV-OFF-001: a new booking gets a temp row and a queued POST with the body as sent', async () => {
    await offlineDb.places.put(buildPlace({ id: 30, trip_id: 4, name: 'Hotel Adler' }));
    const body = {
      title: 'Hotel Adler',
      type: 'hotel',
      place_id: 30,
      metadata: { check_in_time: '15:00' },
      create_accommodation: { place_id: 30, start_day_id: 1, end_day_id: 2 },
    };

    const { reservation } = await reservationRepo.create(4, body);

    expect(reservation.id).toBeLessThan(0);
    expect(reservation).toMatchObject({
      trip_id: 4,
      title: 'Hotel Adler',
      type: 'hotel',
      status: 'pending',
      place_name: 'Hotel Adler',
      metadata: '{"check_in_time":"15:00"}',
    });
    expect(reservation).not.toHaveProperty('create_accommodation');
    expect(await offlineDb.reservations.get(reservation.id)).toMatchObject({ title: 'Hotel Adler' });
    const [mutation] = await queue();
    expect(mutation).toMatchObject({
      method: 'POST',
      url: '/trips/4/reservations',
      resource: 'reservations',
      tempId: reservation.id,
      body,
    });
  });

  it('FE-REPO-RESV-OFF-002: an edit, the travelers and a delete of an unsynced booking wait for its id', async () => {
    await offlineDb.tripMembers.put({ tripId: 4, id: 7, username: 'lena', avatar_url: null } as never);
    const { reservation } = await reservationRepo.create(4, { title: 'Train' });
    const { reservation: edited } = await reservationRepo.update(4, reservation.id, { status: 'confirmed' });
    expect(edited).toMatchObject({ id: reservation.id, title: 'Train', status: 'confirmed' });
    const { travelers } = await reservationRepo.setTravelers(4, reservation.id, [7]);
    expect(travelers).toEqual([{ user_id: 7, username: 'lena', avatar_url: null }]);
    await reservationRepo.delete(4, reservation.id);

    expect(await offlineDb.reservations.get(reservation.id)).toBeUndefined();
    const [, edit, travel, del] = await queue();
    expect(edit).toMatchObject({
      method: 'PUT',
      url: '/trips/4/reservations/{id}',
      tempEntityId: reservation.id,
      entityId: reservation.id,
    });
    expect(travel).toMatchObject({
      method: 'PUT',
      url: '/trips/4/reservations/{id}/travelers',
      body: { user_ids: [7] },
    });
    expect(del).toMatchObject({ method: 'DELETE', url: '/trips/4/reservations/{id}', tempEntityId: reservation.id });
  });

  it('FE-REPO-RESV-OFF-003: an edit of a synced booking keeps the fields it does not name', async () => {
    await offlineDb.reservations.put(
      buildReservation({ id: 20, trip_id: 4, title: 'Museum', notes: 'Bring ID', status: 'pending' })
    );

    const { reservation } = await reservationRepo.update(4, 20, { status: 'confirmed' });

    expect(reservation).toMatchObject({ id: 20, title: 'Museum', notes: 'Bring ID', status: 'confirmed' });
    const [mutation] = await queue();
    expect(mutation).toMatchObject({
      method: 'PUT',
      url: '/trips/4/reservations/20',
      entityId: 20,
      body: { status: 'confirmed' },
    });
    expect(mutation.tempEntityId).toBeUndefined();
  });

  it('FE-REPO-RESV-OFF-004: deleting a booking offline also drops its linked costs from the cache', async () => {
    await offlineDb.reservations.put(buildReservation({ id: 21, trip_id: 4 }));
    await offlineDb.budgetItems.bulkPut([
      buildBudgetItem({ id: 300, trip_id: 4, reservation_id: 21 }),
      buildBudgetItem({ id: 301, trip_id: 4, reservation_id: null }),
    ]);

    await reservationRepo.delete(4, 21);

    expect(await offlineDb.reservations.get(21)).toBeUndefined();
    expect((await offlineDb.budgetItems.toArray()).map((i) => i.id)).toEqual([301]);
    expect((await queue())[0]).toMatchObject({ method: 'DELETE', url: '/trips/4/reservations/21' });
  });

  it('FE-REPO-RESV-OFF-005: transport positions for a day are written here and queued without temp ids', async () => {
    await offlineDb.reservations.put(buildReservation({ id: 22, trip_id: 4, day_positions: { 5: 1 } }));

    await reservationRepo.updatePositions(
      4,
      [
        { id: 22, day_plan_position: 2.5 },
        { id: -9, day_plan_position: 3 },
      ],
      6
    );

    expect(await offlineDb.reservations.get(22)).toMatchObject({
      day_plan_position: 2.5,
      day_positions: { 5: 1, 6: 2.5 },
    });
    expect((await queue())[0]).toMatchObject({
      method: 'PUT',
      url: '/trips/4/reservations/positions',
      body: { positions: [{ id: 22, day_plan_position: 2.5 }], day_id: 6 },
    });
  });

  it('FE-REPO-RESV-OFF-006: online, an edit of a booking with an older queued write joins the queue', async () => {
    await offlineDb.reservations.put(buildReservation({ id: 23, trip_id: 4, title: 'Ferry' }));
    await reservationRepo.update(4, 23, { title: 'Ferry 1' });
    setOnline(true);
    setAuthed(false);
    const direct = vi.fn();
    server.use(
      http.put('/api/trips/4/reservations/23', () => {
        direct();
        return HttpResponse.json({});
      })
    );

    await reservationRepo.update(4, 23, { title: 'Ferry 2' });

    expect(direct).not.toHaveBeenCalled();
    expect((await queue()).map((m) => (m.body as { title: string }).title)).toEqual(['Ferry 1', 'Ferry 2']);
  });

  it('FE-REPO-RESV-OFF-007: online, a new booking goes straight out and is cached', async () => {
    setOnline(true);
    server.use(
      http.post('/api/trips/4/reservations', () =>
        HttpResponse.json({ reservation: buildReservation({ id: 50, trip_id: 4, title: 'Dinner' }) })
      )
    );

    const { reservation } = await reservationRepo.create(4, { title: 'Dinner' });

    expect(reservation.id).toBe(50);
    expect(await offlineDb.reservations.get(50)).toMatchObject({ title: 'Dinner' });
    expect(await offlineDb.mutationQueue.count()).toBe(0);
  });
});
