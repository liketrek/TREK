// FE-REPO-ASSIGN-OFF-001 to FE-REPO-ASSIGN-OFF-010
// Offline writes of a day's visits (#2601): put on a day, taken off, reordered,
// moved, who joins and how a leg is travelled.
import 'fake-indexeddb/auto';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildAssignment, buildDay, buildPlace } from '../../tests/helpers/factories';
import { server } from '../../tests/helpers/msw/server';
import type { QueuedMutation } from '../db/offlineDb';
import { clearAll, offlineDb } from '../db/offlineDb';
import { setAuthed } from '../sync/authGate';
import { mutationQueue } from '../sync/mutationQueue';
import { assignmentRepo } from './assignmentRepo';

function setOnline(v: boolean): void {
  Object.defineProperty(navigator, 'onLine', { value: v, writable: true, configurable: true });
}

async function queue(): Promise<QueuedMutation[]> {
  return (await offlineDb.mutationQueue.toArray()).sort((a, b) => a.createdAt - b.createdAt);
}

const place = buildPlace({ id: 300, trip_id: 4, name: 'Pantheon' });
const first = buildAssignment({ id: 500, day_id: 70, order_index: 0, place: buildPlace({ id: 301, trip_id: 4 }) });

beforeEach(async () => {
  await clearAll();
  mutationQueue._resetFlushing();
  setOnline(false);
  await offlineDb.days.bulkPut([
    buildDay({ id: 70, trip_id: 4, assignments: [first] }),
    buildDay({ id: 71, trip_id: 4, assignments: [] }),
  ]);
});

afterEach(() => {
  vi.restoreAllMocks();
  setAuthed(false);
  setOnline(true);
});

describe('assignmentRepo, offline', () => {
  it('FE-REPO-ASSIGN-OFF-001: a place put on a day lands there under a temp id and the POST waits', async () => {
    const visit = await assignmentRepo.create(4, 70, place);

    expect(visit.id).toBeLessThan(0);
    expect(visit).toMatchObject({ day_id: 70, place_id: 300, order_index: 1, place: { name: 'Pantheon' } });
    expect((await offlineDb.days.get(70))?.assignments?.map((a) => a.id)).toEqual([500, visit.id]);
    expect((await queue())[0]).toMatchObject({
      method: 'POST',
      url: '/trips/4/days/70/assignments',
      body: { place_id: 300 },
      resource: 'assignments',
      tempId: visit.id,
    });
  });

  it('FE-REPO-ASSIGN-OFF-002: a place created offline is put on a day through the queue even online', async () => {
    setOnline(true);
    vi.spyOn(mutationQueue, 'sendSoon').mockImplementation(() => {});
    const visit = await assignmentRepo.create(4, 70, buildPlace({ id: -42, trip_id: 4 }));

    expect(visit.id).toBeLessThan(0);
    expect((await queue())[0]).toMatchObject({ method: 'POST', body: { place_id: -42 } });
  });

  it('FE-REPO-ASSIGN-OFF-003: taking an unsynced visit off waits for its real id', async () => {
    const visit = await assignmentRepo.create(4, 70, place);
    await assignmentRepo.remove(4, 70, visit.id);

    expect((await offlineDb.days.get(70))?.assignments?.map((a) => a.id)).toEqual([500]);
    expect((await queue())[1]).toMatchObject({
      method: 'DELETE',
      url: '/trips/4/days/70/assignments/{id}',
      tempEntityId: visit.id,
      resource: 'assignments',
    });
  });

  it('FE-REPO-ASSIGN-OFF-004: a new order is cached and queued with the temp ids in it', async () => {
    const visit = await assignmentRepo.create(4, 70, place);
    await assignmentRepo.reorder(4, 70, [visit.id, 500]);

    expect((await offlineDb.days.get(70))?.assignments?.map((a) => [a.id, a.order_index])).toEqual([
      [visit.id, 0],
      [500, 1],
    ]);
    expect((await queue())[1]).toMatchObject({
      method: 'PUT',
      url: '/trips/4/days/70/assignments/reorder',
      body: { orderedIds: [visit.id, 500] },
    });
  });

  it('FE-REPO-ASSIGN-OFF-005: a move takes the visit to the other day and queues the move, then the order there', async () => {
    await offlineDb.days.update(71, { assignments: [buildAssignment({ id: 510, day_id: 71, order_index: 0 })] });

    await assignmentRepo.move(4, first, 71, 0, [500, 510]);

    expect((await offlineDb.days.get(70))?.assignments).toEqual([]);
    expect((await offlineDb.days.get(71))?.assignments?.map((a) => [a.id, a.day_id, a.order_index])).toEqual([
      [500, 71, 0],
      [510, 71, 1],
    ]);
    const [move, order] = await queue();
    expect(move).toMatchObject({
      url: '/trips/4/assignments/500/move',
      body: { new_day_id: 71, order_index: 0 },
      entityId: 500,
    });
    expect(order).toMatchObject({ url: '/trips/4/days/71/assignments/reorder', body: { orderedIds: [500, 510] } });
  });

  it('FE-REPO-ASSIGN-OFF-006: who joins a visit is named from the cached members of the trip', async () => {
    await offlineDb.tripMembers.bulkPut([
      { tripId: 4, id: 3, username: 'maurice', avatar: null },
      { tripId: 4, id: 5, username: 'tom', avatar: 'tom.png' },
    ]);

    const participants = await assignmentRepo.setParticipants(4, 500, [5]);

    expect(participants).toEqual([{ user_id: 5, username: 'tom', avatar: 'tom.png' }]);
    expect((await offlineDb.days.get(70))?.assignments?.[0].participants).toEqual(participants);
    expect((await queue())[0]).toMatchObject({ url: '/trips/4/assignments/500/participants', body: { user_ids: [5] } });
  });

  it('FE-REPO-ASSIGN-OFF-007: the travel mode of the leg entering a visit is cached and queued with its direction', async () => {
    await assignmentRepo.setLegMode(4, 500, 'driving', 'incoming');

    expect((await offlineDb.days.get(70))?.assignments?.[0].incoming_leg_transport_mode).toBe('driving');
    expect((await queue())[0]).toMatchObject({
      url: '/trips/4/assignments/500/transport',
      body: { transport_mode: 'driving', direction: 'incoming' },
      entityId: 500,
    });
  });

  it('FE-REPO-ASSIGN-OFF-008: online with nothing queued, a place goes on its day straight away', async () => {
    setOnline(true);
    server.use(
      http.post('/api/trips/4/days/70/assignments', () =>
        HttpResponse.json({ assignment: buildAssignment({ id: 520, day_id: 70, order_index: 1, place }) })
      )
    );

    const visit = await assignmentRepo.create(4, 70, place);

    expect(visit.id).toBe(520);
    expect(await offlineDb.mutationQueue.count()).toBe(0);
    expect((await offlineDb.days.get(70))?.assignments?.map((a) => a.id)).toEqual([500, 520]);
  });

  it('FE-REPO-ASSIGN-OFF-009: a stage of a multi-day tour goes on its day offline with its key, in the queued write too (MDT-02)', async () => {
    const visit = await assignmentRepo.create(4, 71, place, 'stop-hut');

    expect(visit).toMatchObject({ day_id: 71, place_id: 300, tour_stage_key: 'stop-hut' });
    expect((await offlineDb.days.get(71))?.assignments?.[0].tour_stage_key).toBe('stop-hut');
    expect((await queue())[0]).toMatchObject({ body: { place_id: 300, tour_stage_key: 'stop-hut' } });
  });

  it('FE-REPO-ASSIGN-OFF-010: online, the stage key goes with the request (MDT-02)', async () => {
    setOnline(true);
    let sent: unknown = null;
    server.use(
      http.post('/api/trips/4/days/71/assignments', async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({
          assignment: buildAssignment({ id: 530, day_id: 71, order_index: 0, place, tour_stage_key: 'stop-hut' }),
        });
      })
    );

    const visit = await assignmentRepo.create(4, 71, place, 'stop-hut');

    expect(sent).toEqual({ place_id: 300, tour_stage_key: 'stop-hut' });
    expect(visit).toMatchObject({ id: 530, tour_stage_key: 'stop-hut' });
  });
});
