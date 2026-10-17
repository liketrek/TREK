/**
 * mutationQueue replay of offline booking writes (#2601): a created booking
 * moves to its real id, the travelers answer only ever touches the booking it
 * names, and a hotel booked offline at a place created offline reaches the
 * server linked to the place's real id, in the booking and in its stay.
 */
import 'fake-indexeddb/auto';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAll, offlineDb } from '../../../src/db/offlineDb';
import { placeRepo } from '../../../src/repo/placeRepo';
import { reservationRepo } from '../../../src/repo/reservationRepo';
import { setAuthed } from '../../../src/sync/authGate';
import { mutationQueue } from '../../../src/sync/mutationQueue';
import { buildPlace, buildReservation } from '../../helpers/factories';
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

describe('mutationQueue.flush of bookings', () => {
  it('FE-SYNC-RESV-001: a replayed booking moves to the real id and the queued edit follows it', async () => {
    const { reservation } = await reservationRepo.create(3, { title: 'Flight' });
    await reservationRepo.update(3, reservation.id, { title: 'Flight LH 400' });
    const puts: string[] = [];
    server.use(
      http.post('/api/trips/3/reservations', () =>
        HttpResponse.json({ reservation: buildReservation({ id: 901, trip_id: 3, title: 'Flight' }) })
      ),
      http.put('/api/trips/3/reservations/:id', ({ params }) => {
        puts.push(String(params.id));
        return HttpResponse.json({ reservation: buildReservation({ id: 901, trip_id: 3, title: 'Flight LH 400' }) });
      })
    );
    setOnline(true);

    await mutationQueue.flush();

    expect(puts).toEqual(['901']);
    expect(await offlineDb.mutationQueue.count()).toBe(0);
    expect(await offlineDb.reservations.get(reservation.id)).toBeUndefined();
    expect(await offlineDb.reservations.get(901)).toMatchObject({ title: 'Flight LH 400' });
  });

  it('FE-SYNC-RESV-002: the travelers answer lands on the booking it names', async () => {
    await offlineDb.reservations.put(buildReservation({ id: 92, trip_id: 3, title: 'Tour', travelers: [] }));
    await reservationRepo.setTravelers(3, 92, [4]);
    const travelers = [{ user_id: 4, username: 'lena', avatar_url: null }];
    server.use(
      http.put('/api/trips/3/reservations/92/travelers', () =>
        HttpResponse.json({ travelers, reservation: buildReservation({ id: 92, trip_id: 3, title: 'Tour' }) })
      )
    );
    setOnline(true);

    await mutationQueue.flush();

    expect(await offlineDb.mutationQueue.count()).toBe(0);
    const rows = await offlineDb.reservations.toArray();
    expect(rows.map((r) => r.id)).toEqual([92]);
    expect(rows[0].travelers).toEqual(travelers);
  });

  it('FE-SYNC-RESV-003: a hotel booked at a place created offline is sent with the real place id', async () => {
    const { place } = await placeRepo.create(3, { name: 'Hotel Adler' });
    await reservationRepo.create(3, {
      title: 'Hotel Adler',
      type: 'hotel',
      place_id: place.id,
      create_accommodation: { place_id: place.id, start_day_id: 1, end_day_id: 2 },
    });
    let sent: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/trips/3/places', () =>
        HttpResponse.json({ place: buildPlace({ id: 77, trip_id: 3, name: 'Hotel Adler' }) })
      ),
      http.post('/api/trips/3/reservations', async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ reservation: buildReservation({ id: 902, trip_id: 3, place_id: 77 }) });
      })
    );
    setOnline(true);

    await mutationQueue.flush();

    expect(sent).toMatchObject({
      place_id: 77,
      create_accommodation: { place_id: 77, start_day_id: 1, end_day_id: 2 },
    });
    expect(await offlineDb.mutationQueue.count()).toBe(0);
  });
});
