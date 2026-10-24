/**
 * mutationQueue replay of offline plan writes (#2601): a visit put on a day
 * moves to its real id and the new order of the day follows it, a note does the
 * same on its day, a day answer keeps the notes the cache holds, a trip answer
 * keeps the counts of the list, and a visit the server refuses with 409 fails
 * instead of waiting as a conflict.
 */
import 'fake-indexeddb/auto';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAll, offlineDb } from '../../../src/db/offlineDb';
import { assignmentRepo } from '../../../src/repo/assignmentRepo';
import { dayNoteRepo } from '../../../src/repo/dayNoteRepo';
import { dayRepo } from '../../../src/repo/dayRepo';
import { tripRepo } from '../../../src/repo/tripRepo';
import { setAuthed } from '../../../src/sync/authGate';
import { mutationQueue } from '../../../src/sync/mutationQueue';
import { buildAssignment, buildDay, buildDayNote, buildPlace, buildTrip } from '../../helpers/factories';
import { server } from '../../helpers/msw/server';

function setOnline(v: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value: v, writable: true, configurable: true });
}

const place = buildPlace({ id: 300, trip_id: 4 });

beforeEach(async () => {
  await clearAll();
  mutationQueue._resetFlushing();
  setAuthed(true);
  setOnline(false);
  await offlineDb.days.put(
    buildDay({
      id: 70,
      trip_id: 4,
      title: 'Old',
      assignments: [
        buildAssignment({ id: 500, day_id: 70, order_index: 0, place: buildPlace({ id: 301, trip_id: 4 }) }),
      ],
      notes_items: [buildDayNote({ id: 900, day_id: 70 })],
    })
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  setAuthed(false);
  setOnline(true);
});

describe('mutationQueue.flush, plan', () => {
  it('FE-SYNC-DAYS-001: a replayed visit takes its real id and the queued order names it', async () => {
    const visit = await assignmentRepo.create(4, 70, place);
    await assignmentRepo.reorder(4, 70, [visit.id, 500]);
    await assignmentRepo.setLegMode(4, visit.id, 'driving');
    const orders: unknown[] = [];
    const legs: string[] = [];
    server.use(
      http.post('/api/trips/4/days/70/assignments', () =>
        HttpResponse.json({ assignment: buildAssignment({ id: 520, day_id: 70, order_index: 1, place }) })
      ),
      http.put('/api/trips/4/days/70/assignments/reorder', async ({ request }) => {
        orders.push(await request.json());
        return HttpResponse.json({ success: true });
      }),
      http.put('/api/trips/4/assignments/:id/transport', ({ params }) => {
        legs.push(String(params.id));
        return HttpResponse.json({
          assignment: buildAssignment({ id: 520, day_id: 70, order_index: 0, leg_transport_mode: 'driving', place }),
        });
      })
    );
    setOnline(true);

    await mutationQueue.flush();

    expect(orders).toEqual([{ orderedIds: [520, 500] }]);
    expect(legs).toEqual(['520']);
    expect(await offlineDb.mutationQueue.count()).toBe(0);
    const ids = (await offlineDb.days.get(70))?.assignments?.map((a) => a.id);
    expect(ids).toContain(520);
    expect(ids).not.toContain(visit.id);
  });

  it('FE-SYNC-DAYS-002: an order that names a visit whose create failed is sent without it', async () => {
    const visit = await assignmentRepo.create(4, 70, place);
    await assignmentRepo.reorder(4, 70, [visit.id, 500]);
    const orders: unknown[] = [];
    server.use(
      http.post('/api/trips/4/days/70/assignments', () =>
        HttpResponse.json({ error: 'Place not found' }, { status: 404 })
      ),
      http.put('/api/trips/4/days/70/assignments/reorder', async ({ request }) => {
        orders.push(await request.json());
        return HttpResponse.json({ success: true });
      })
    );
    setOnline(true);

    await mutationQueue.flush();

    expect(orders).toEqual([{ orderedIds: [500] }]);
    expect((await offlineDb.days.get(70))?.assignments?.map((a) => a.id)).toEqual([500]);
  });

  it('FE-SYNC-DAYS-003: a visit refused with 409 fails, it does not wait as a conflict', async () => {
    await assignmentRepo.create(4, 70, place);
    server.use(
      http.post('/api/trips/4/days/70/assignments', () =>
        HttpResponse.json({ error: 'Tour is already assigned to this day' }, { status: 409 })
      )
    );
    setOnline(true);

    await mutationQueue.flush();

    const [row] = await offlineDb.mutationQueue.toArray();
    expect(row.status).toBe('failed');
    expect((await offlineDb.days.get(70))?.assignments?.map((a) => a.id)).toEqual([500]);
  });

  it('FE-SYNC-DAYS-004: the participants answer lands on the visit it names', async () => {
    await assignmentRepo.setParticipants(4, 500, [5]);
    server.use(
      http.put('/api/trips/4/assignments/500/participants', () =>
        HttpResponse.json({ participants: [{ user_id: 5, username: 'tom', avatar: null }] })
      )
    );
    setOnline(true);

    await mutationQueue.flush();

    expect((await offlineDb.days.get(70))?.assignments?.[0].participants).toEqual([
      { user_id: 5, username: 'tom', avatar: null },
    ]);
  });

  it('FE-SYNC-DAYS-005: a replayed note takes its real id and the queued edit follows it', async () => {
    const { note } = await dayNoteRepo.create(4, 70, { text: 'Lunch' });
    await dayNoteRepo.update(4, 70, note, { text: 'Brunch' });
    const puts: string[] = [];
    server.use(
      http.post('/api/trips/4/days/70/notes', () =>
        HttpResponse.json({ note: buildDayNote({ id: 901, day_id: 70, text: 'Lunch' }) })
      ),
      http.put('/api/trips/4/days/70/notes/:id', ({ params }) => {
        puts.push(String(params.id));
        return HttpResponse.json({ note: buildDayNote({ id: 901, day_id: 70, text: 'Brunch' }) });
      })
    );
    setOnline(true);

    await mutationQueue.flush();

    expect(puts).toEqual(['901']);
    expect((await offlineDb.days.get(70))?.notes_items?.map((n) => [n.id, n.text])).toEqual([
      [900, 'Test note'],
      [901, 'Brunch'],
    ]);
  });

  it('FE-SYNC-DAYS-006: the day answer keeps the notes and visits the cache holds', async () => {
    await dayRepo.update(4, 70, { title: 'Arrival' });
    server.use(
      http.put('/api/trips/4/days/70', () =>
        HttpResponse.json({ day: { id: 70, trip_id: 4, title: 'Arrival', notes: null, assignments: [] } })
      )
    );
    setOnline(true);

    await mutationQueue.flush();

    const day = await offlineDb.days.get(70);
    expect(day?.title).toBe('Arrival');
    expect(day?.notes_items?.map((n) => n.id)).toEqual([900]);
    expect(day?.assignments?.map((a) => a.id)).toEqual([500]);
  });

  it('FE-SYNC-DAYS-007: a trip renamed offline syncs and keeps the counts of the cached row', async () => {
    await offlineDb.trips.put({ ...buildTrip({ id: 4, title: 'Rome' }), place_count: 7 } as never);
    await tripRepo.update(4, { title: 'Roma', start_date: buildTrip({ id: 4 }).start_date });
    expect((await offlineDb.trips.get(4))?.title).toBe('Roma');
    server.use(http.put('/api/trips/4', () => HttpResponse.json({ trip: { ...buildTrip({ id: 4 }), title: 'Roma' } })));
    setOnline(true);

    await mutationQueue.flush();

    expect(await offlineDb.mutationQueue.count()).toBe(0);
    expect(await offlineDb.trips.get(4)).toMatchObject({ title: 'Roma', place_count: 7 });
  });
});
