/**
 * Assignments module e2e — exercises both migrated controllers through the real
 * JwtAuthGuard against a real migrated-and-seeded temp SQLite db
 * (createSnapshotTestDb(), Plan 3c Task 3 — this used to hand-roll a dozen
 * CREATE TABLEs, a second hand-maintained schema copy that (a) omitted
 * several `day_assignments` columns `insertAssignment`'s own `em.insert()`
 * RETURNING read-back names (`reservation_status`, `end_day`) and (b), per
 * the Task 2 review's warning for this exact file, would hit `no such
 * table` the moment any `find()` on an entity in this domain's graph needs
 * to resolve a hidden inverse relation this DDL never created — the same
 * class of failure `days.e2e.test.ts`'s own conversion (Task 2) fixed for
 * that file. AssignmentsService runs its real SQL (DI-injected, no service
 * mock); journeyService and the permission check stay mocked, and the
 * broadcast goes to a FakeRealtimeService. Every `it(...)` body below is unchanged from before this
 * conversion — only the DB bootstrap changed.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { Test } from '@nestjs/testing';
import { sessionCookie } from './harness';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

import { db } from '../../src/db/database';

const { reconcileTripSkeletons } = vi.hoisted(() => ({ reconcileTripSkeletons: vi.fn().mockResolvedValue(undefined) }));
import { JourneyDomainService } from '../../src/nest/journey/journey-domain.service';

import { PermissionsService } from '../../src/nest/permissions/permissions.service';

// Since the permissions DI migration, the check is a spy on the container's
// PermissionsService singleton (created in beforeAll, after build()).
let checkPermission: MockInstance;

import { AssignmentsModule } from '../../src/nest/assignments/assignments.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { makeUser } from '../helpers/factories/users';
import { makeTour } from '../helpers/factories/tours';
import type { DayAssignmentRow } from '../helpers/factories/itinerary';
import { countRows, deleteRows, findRow, findRows, insertRow, insertRowIgnoringConflict, insertRows, updateRows } from '../helpers/factories/rows';
import { AssignmentParticipants } from '../../src/db/entities/AssignmentParticipants.entity';
import { DayAssignments } from '../../src/db/entities/DayAssignments.entity';
import { Days } from '../../src/db/entities/Days.entity';
import { Places } from '../../src/db/entities/Places.entity';
import { Tours } from '../../src/db/entities/Tours.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { FakeRealtimeService } from '../helpers/fake-realtime';

const realtime = new FakeRealtimeService();
const broadcast = realtime.broadcastMock;

let orm: TestOrm;

/** The named columns of the assignment, or undefined once it is gone: what a `SELECT <cols> FROM day_assignments` read back. */
async function assignmentCols<K extends keyof DayAssignmentRow>(id: number, ...cols: K[]): Promise<Pick<DayAssignmentRow, K> | undefined> {
  const row = await findRow(orm, DayAssignments, { id });
  if (!row) return undefined;
  return Object.fromEntries(cols.map(c => [c, row[c]])) as Pick<DayAssignmentRow, K>;
}

/** Drops a place seeded for one test, with its tour and any assignment of it. */
async function dropTourPlace(placeId: number): Promise<void> {
  await deleteRows(orm, DayAssignments, { place: placeId });
  await deleteRows(orm, Tours, { place: placeId });
  await deleteRows(orm, Places, { id: placeId });
}

describe('Assignments e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), RealtimeModule, AssignmentsModule] })
      .overrideProvider(RealtimeService)
      .useValue(realtime)
      .overrideProvider(JourneyDomainService)
      .useValue({ reconcileTripSkeletons })
      .compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalPipes(new ZodValidationPipe());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    // harness.ts's seedUser() omits password_hash, which the real migrated
    // schema requires NOT NULL (days.e2e.test.ts's own precedent) — raw
    // inserts here instead, matching the SeededUser shape id/role/
    // password_version=0 that sessionCookie() needs. `username: 'e2e-user'`
    // (user 1) matches the harness default so assertion bodies that spell
    // out the owner's username stay unchanged.
    orm = await createTestOrm(db);
    await makeUser(orm, { id: 1, username: 'e2e-user', email: 'e2e@example.test' });
    await makeUser(orm, { id: 2, username: 'peer', email: 'peer@example.test' });
    // Plan 3c Task 0b: TripAccessGuard reads TripsRepository.findAccessible
    // directly now, a real query — trip 5's real row (owned by user 1) is
    // seeded once here rather than faked per test. `days.day_number` is
    // `NOT NULL` on the real schema (the old hand-rolled DDL had no such
    // constraint).
    await insertRow(orm, Trips, { id: 5, user: 1, title: 'Trip' });
    await insertRows(orm, Days, [{ id: 3, trip: 5, day_number: 1 }, { id: 4, trip: 5, day_number: 2 }]);
    await insertRow(orm, Places, { id: 2, trip: 5, name: 'Louvre' });
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    checkPermission.mockReturnValue(true);
    await deleteRows(orm, DayAssignments);
    await deleteRows(orm, AssignmentParticipants);
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  const seedAssignment = (dayId = 3, placeId = 2, orderIndex = 0) =>
    insertRow(orm, DayAssignments, { day: dayId, place: placeId, order_index: orderIndex });

  it('401 without a cookie', async () => {
    expect((await request(server).get('/api/trips/5/days/3/assignments')).status).toBe(401);
  });

  it('200 list day-assignments', async () => {
    const id = await seedAssignment();
    const res = await request(server).get('/api/trips/5/days/3/assignments').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.assignments).toHaveLength(1);
    expect(res.body.assignments[0]).toMatchObject({
      id, day_id: 3, place_id: 2, order_index: 0, participants: [],
      place: { id: 2, name: 'Louvre', tags: [] },
    });
  });

  it('200 list projects Tour facets once per assignment and leaves other tracks ordinary', async () => {
    const legacyGeometry = JSON.stringify([[48, 11, 600], [48.01, 11.02, 650]]);
    const tourGeometry = JSON.stringify([[48.02, 11.03, 700], [48.03, 11.04, 750]]);
    await insertRows(orm, Places, [
      { id: 3, trip: 5, name: 'Legacy track', route_geometry: legacyGeometry },
      { id: 4, trip: 5, name: 'Tour', route_geometry: tourGeometry },
    ]);
    await makeTour(orm, 4, { tourTypeRef: 'hike' });
    const assignmentIds = [
      await seedAssignment(3, 2, 0),
      await seedAssignment(3, 3, 1),
      await seedAssignment(3, 4, 2),
      await seedAssignment(3, 4, 3),
    ];

    const res = await request(server).get('/api/trips/5/days/3/assignments').set('Cookie', sessionCookie(1));

    expect(res.status).toBe(200);
    const assignments = res.body.assignments as Array<{
      id: number;
      place_id: number;
      order_index: number;
      tour_place_id: number | null;
      tour_route_geometry: string | null;
    }>;
    expect(assignments).toHaveLength(4);
    expect(assignments.map(a => a.id)).toEqual(assignmentIds);
    expect(assignments.map(a => a.order_index)).toEqual([0, 1, 2, 3]);
    expect(assignments[0]).toMatchObject({ place_id: 2, tour_place_id: null, tour_route_geometry: null });
    expect((await findRow(orm, Places, { id: 3 }))!.route_geometry).toBe(legacyGeometry);
    expect(await findRow(orm, Tours, { place: 3 })).toBeNull();
    expect((await findRow(orm, Tours, { place: 4 }))!.place_id).toBe(4);
    expect(assignments[1]).toMatchObject({ place_id: 3, tour_place_id: null, tour_route_geometry: null });
    expect(assignments.slice(2).map(a => ({
      place_id: a.place_id,
      tour_place_id: a.tour_place_id,
      tour_route_geometry: a.tour_route_geometry,
    }))).toEqual([
      { place_id: 4, tour_place_id: 4, tour_route_geometry: tourGeometry },
      { place_id: 4, tour_place_id: 4, tour_route_geometry: tourGeometry },
    ]);
  });

  it('201 create, 404 place', async () => {
    reconcileTripSkeletons.mockClear();
    const ok = await request(server).post('/api/trips/5/days/3/assignments').set('Cookie', sessionCookie(1)).send({ place_id: 2 });
    expect(ok.status).toBe(201);
    expect(ok.body.assignment).toMatchObject({ day_id: 3, place_id: 2, order_index: 0, notes: null, place: { id: 2, name: 'Louvre' } });
    const row = await findRow(orm, DayAssignments, { id: ok.body.assignment.id });
    expect(row).toMatchObject({ day_id: 3, place_id: 2, order_index: 0 });
    expect(reconcileTripSkeletons).toHaveBeenCalledWith(5, undefined);
    const miss = await request(server).post('/api/trips/5/days/3/assignments').set('Cookie', sessionCookie(1)).send({ place_id: 99 });
    expect(miss.status).toBe(404);
    expect(miss.body).toEqual({ error: 'Place not found' });
  });

  it('prevents duplicate Tour/day assignments through concurrent REST requests', async () => {
    const tourPlaceId = 20;
    await insertRow(orm, Places, { id: tourPlaceId, trip: 5, name: 'Ridge walk' });
    await makeTour(orm, tourPlaceId, { tourTypeRef: 'hike' });
    try {
      const createTourAssignment = () => request(server)
        .post('/api/trips/5/days/3/assignments')
        .set('Cookie', sessionCookie(1))
        .send({ place_id: tourPlaceId });
      const results = await Promise.all([createTourAssignment(), createTourAssignment()]);

      expect(results.map(result => result.status).sort()).toEqual([201, 409]);
      expect(await countRows(orm, DayAssignments, { day: 3, place: tourPlaceId })).toBe(1);

      const otherDay = await request(server).post('/api/trips/5/days/4/assignments')
        .set('Cookie', sessionCookie(1)).send({ place_id: tourPlaceId });
      expect(otherDay.status).toBe(201);
      expect(await countRows(orm, DayAssignments, { place: tourPlaceId })).toBe(2);

      const firstOrdinary = await request(server).post('/api/trips/5/days/3/assignments')
        .set('Cookie', sessionCookie(1)).send({ place_id: 2 });
      const secondOrdinary = await request(server).post('/api/trips/5/days/3/assignments')
        .set('Cookie', sessionCookie(1)).send({ place_id: 2 });
      expect(firstOrdinary.status).toBe(201);
      expect(secondOrdinary.status).toBe(201);
    } finally {
      await dropTourPlace(tourPlaceId);
    }
  });

  it('200 delete assignment reconciles journey skeletons', async () => {
    reconcileTripSkeletons.mockClear();
    const id = await seedAssignment();
    const res = await request(server).delete(`/api/trips/5/days/3/assignments/${id}`).set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(await findRow(orm, DayAssignments, { id })).toBeNull();
    expect(reconcileTripSkeletons).toHaveBeenCalledWith(5, undefined);
  });

  it('200 clear day removes every place of the day and keeps the day (#2470)', async () => {
    reconcileTripSkeletons.mockClear();
    const first = await seedAssignment(3, 2, 0);
    const second = await seedAssignment(3, 2, 1);
    const elsewhere = await seedAssignment(4, 2, 0);
    const res = await request(server).delete('/api/trips/5/days/3/assignments').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect([...res.body.removedIds].sort()).toEqual([first, second].sort());
    expect(await countRows(orm, DayAssignments, { day: 3 })).toBe(0);
    expect(await assignmentCols(elsewhere, 'id')).toEqual({ id: elsewhere });
    expect(reconcileTripSkeletons).toHaveBeenCalledWith(5, undefined);
  });

  it('403 clear day without day_edit, 404 for a foreign day', async () => {
    await seedAssignment();
    checkPermission.mockReturnValue(false);
    expect((await request(server).delete('/api/trips/5/days/3/assignments').set('Cookie', sessionCookie(1))).status).toBe(403);
    checkPermission.mockReturnValue(true);
    const miss = await request(server).delete('/api/trips/5/days/999/assignments').set('Cookie', sessionCookie(1));
    expect(miss.status).toBe(404);
    expect(miss.body).toEqual({ error: 'Day not found' });
  });

  it('200 route exclude roundtrip, 400 without a boolean (#2532)', async () => {
    const id = await seedAssignment();
    const res = await request(server).put(`/api/trips/5/assignments/${id}/route`).set('Cookie', sessionCookie(1)).send({ excluded: true });
    expect(res.status).toBe(200);
    expect(res.body.assignment).toMatchObject({ id, route_excluded: true });
    const list = await request(server).get('/api/trips/5/days/3/assignments').set('Cookie', sessionCookie(1));
    expect(list.body.assignments[0].route_excluded).toBe(true);
    expect((await request(server).put(`/api/trips/5/assignments/${id}/route`).set('Cookie', sessionCookie(1)).send({ excluded: 'yes' })).status).toBe(400);
  });

  it('200 move assignment reconciles journey skeletons', async () => {
    reconcileTripSkeletons.mockClear();
    const id = await seedAssignment();
    const res = await request(server)
      .put(`/api/trips/5/assignments/${id}/move`)
      .set('Cookie', sessionCookie(1))
      .send({ new_day_id: 4, order_index: 0 });
    expect(res.status).toBe(200);
    expect(res.body.assignment).toMatchObject({ id, day_id: 4, order_index: 0 });
    expect(await assignmentCols(id, 'day_id')).toEqual({ day_id: 4 });
    expect(reconcileTripSkeletons).toHaveBeenCalledWith(5, undefined);
  });

  it('409 moving a Tour onto a day that already holds it, the row stays put; a reorder within its day still works', async () => {
    const tourPlaceId = 21;
    await insertRow(orm, Places, { id: tourPlaceId, trip: 5, name: 'Lake loop' });
    await makeTour(orm, tourPlaceId, { tourTypeRef: 'hike' });
    try {
      await seedAssignment(4, tourPlaceId, 0);
      const moving = await seedAssignment(3, tourPlaceId, 0);
      const conflict = await request(server)
        .put(`/api/trips/5/assignments/${moving}/move`)
        .set('Cookie', sessionCookie(1))
        .send({ new_day_id: 4, order_index: 1 });
      expect(conflict.status).toBe(409);
      expect(conflict.body).toEqual({ error: 'Tour is already assigned to this day' });
      expect(await assignmentCols(moving, 'day_id', 'order_index')).toEqual({ day_id: 3, order_index: 0 });

      const reorder = await request(server)
        .put(`/api/trips/5/assignments/${moving}/move`)
        .set('Cookie', sessionCookie(1))
        .send({ new_day_id: 3, order_index: 2 });
      expect(reorder.status).toBe(200);
      expect(reorder.body.assignment).toMatchObject({ id: moving, day_id: 3, order_index: 2, tour_place_id: tourPlaceId });
    } finally {
      await dropTourPlace(tourPlaceId);
    }
  });

  it('200 notes roundtrip: create with note, PUT edits it, GET list shows the new value (#2163)', async () => {
    const create = await request(server).post('/api/trips/5/days/3/assignments').set('Cookie', sessionCookie(1))
      .send({ place_id: 2, notes: 'Book the 10:00 timed entry' });
    expect(create.status).toBe(201);
    expect(create.body.assignment.notes).toBe('Book the 10:00 timed entry');
    const id = create.body.assignment.id;

    const put = await request(server)
      .put(`/api/trips/5/assignments/${id}/notes`)
      .set('Cookie', sessionCookie(1))
      .send({ notes: 'Arrive 15 minutes early' });
    expect(put.status).toBe(200);
    expect(put.body.assignment).toMatchObject({ id, notes: 'Arrive 15 minutes early' });
    expect(await assignmentCols(id, 'notes')).toEqual({ notes: 'Arrive 15 minutes early' });

    const list = await request(server).get('/api/trips/5/days/3/assignments').set('Cookie', sessionCookie(1));
    expect(list.status).toBe(200);
    expect(list.body.assignments.find((a: { id: number }) => a.id === id).notes).toBe('Arrive 15 minutes early');
  });

  it('200 notes clear: null and empty string both null the column (#2163)', async () => {
    const id = await seedAssignment();
    await updateRows(orm, DayAssignments, { id }, { notes: 'old note' });
    const cleared = await request(server).put(`/api/trips/5/assignments/${id}/notes`).set('Cookie', sessionCookie(1)).send({ notes: null });
    expect(cleared.status).toBe(200);
    expect(cleared.body.assignment.notes).toBeNull();
    await updateRows(orm, DayAssignments, { id }, { notes: 'old note' });
    const emptied = await request(server).put(`/api/trips/5/assignments/${id}/notes`).set('Cookie', sessionCookie(1)).send({ notes: '' });
    expect(emptied.status).toBe(200);
    expect(await assignmentCols(id, 'notes')).toEqual({ notes: null });
  });

  it('400 notes body without the notes key is rejected by the Zod pipe (#2163)', async () => {
    const id = await seedAssignment();
    const res = await request(server).put(`/api/trips/5/assignments/${id}/notes`).set('Cookie', sessionCookie(1)).send({});
    expect(res.status).toBe(400);
  });

  it('200 update time reconciles journey skeletons', async () => {
    reconcileTripSkeletons.mockClear();
    const id = await seedAssignment();
    const res = await request(server)
      .put(`/api/trips/5/assignments/${id}/time`)
      .set('Cookie', sessionCookie(1))
      .send({ place_time: '09:00', end_time: null });
    expect(res.status).toBe(200);
    expect(res.body.assignment).toMatchObject({ id, assignment_time: '09:00', assignment_end_time: null });
    expect(await assignmentCols(id, 'assignment_time')).toEqual({ assignment_time: '09:00' });
    expect(reconcileTripSkeletons).toHaveBeenCalledWith(5, undefined);
  });

  describe('PUT /:id/time and the order of the day', () => {
    const seedDay = async (times: (string | null)[]) => {
      const ids: number[] = [];
      for (const [i, time] of times.entries()) {
        const id = await seedAssignment(3, 2, i);
        if (time) await updateRows(orm, DayAssignments, { id }, { assignment_time: time });
        ids.push(id);
      }
      return ids;
    };
    const dayOrder = async () =>
      (await findRows(orm, DayAssignments, { day: 3 }, { order_index: 'asc', id: 'asc' })).map(r => r.id);
    const eventsSent = () => broadcast.mock.calls.map(call => call[1]);

    beforeEach(() => broadcast.mockClear());

    it('keeps the untimed stops in front of the stop that gets a start', async () => {
      const [a, b, c] = await seedDay([null, null, null]);
      const res = await request(server)
        .put(`/api/trips/5/assignments/${c}/time`)
        .set('Cookie', sessionCookie(1))
        .set('X-Socket-Id', 'sock-1')
        .send({ place_time: '14:00', end_time: null });
      expect(res.status).toBe(200);
      expect(res.body.assignment).toMatchObject({ id: c, assignment_time: '14:00', order_index: 2 });
      expect(await dayOrder()).toEqual([a, b, c]);
      expect(eventsSent()).toEqual(['assignment:updated']);
    });

    it('sorts the timed stops, keeps the untimed head first and sends the whole day', async () => {
      const [a, b, c] = await seedDay([null, '15:00', null]);
      const res = await request(server)
        .put(`/api/trips/5/assignments/${c}/time`)
        .set('Cookie', sessionCookie(1))
        .set('X-Socket-Id', 'sock-1')
        .send({ place_time: '10:00', end_time: null });
      expect(res.status).toBe(200);
      expect(await dayOrder()).toEqual([a, c, b]);
      // No socket left out, so the writer gets the order too.
      expect(broadcast).toHaveBeenCalledWith('5', 'assignment:reordered', { dayId: 3, orderedIds: [a, c, b] }, undefined);
      // No located stops and no vias on this day, so there is nothing to re-pin.
      expect(eventsSent()).not.toContain('roadtripVia:changed');
    });

    it('stores the order it sends: a day with a gap in its keys is numbered from 0', async () => {
      // The gap a deleted stop leaves. Clients number the ids they are sent by position.
      const [a, b, c] = [await seedAssignment(3, 2, 0), await seedAssignment(3, 2, 4), await seedAssignment(3, 2, 7)];
      await updateRows(orm, DayAssignments, { id: b }, { assignment_time: '15:00' });
      const res = await request(server)
        .put(`/api/trips/5/assignments/${c}/time`)
        .set('Cookie', sessionCookie(1))
        .send({ place_time: '10:00', end_time: null });
      expect(res.status).toBe(200);
      const sent = broadcast.mock.calls.find(call => call[1] === 'assignment:reordered')?.[2] as { orderedIds: number[] };
      expect(sent.orderedIds).toEqual([a, c, b]);
      const keyOf = async (id: number) => (await findRow(orm, DayAssignments, { id }))!.order_index;
      expect(await Promise.all(sent.orderedIds.map(keyOf))).toEqual([0, 1, 2]);
      expect(res.body.assignment).toMatchObject({ id: c, order_index: 1 });
    });

    it('leaves a day dragged out of time order alone when only the End changes', async () => {
      const [a, b] = await seedDay(['14:00', '10:00']);
      await updateRows(orm, DayAssignments, { id: b }, { assignment_end_time: '11:00' });
      const res = await request(server)
        .put(`/api/trips/5/assignments/${b}/time`)
        .set('Cookie', sessionCookie(1))
        .set('X-Socket-Id', 'sock-1')
        .send({ place_time: '10:00', end_time: null });
      expect(res.status).toBe(200);
      expect(res.body.assignment).toMatchObject({ id: b, assignment_time: '10:00', assignment_end_time: null });
      expect(await dayOrder()).toEqual([a, b]);
      expect(eventsSent()).toEqual(['assignment:updated']);
    });
  });

  it('200 set participants replaces the list (AS28-31, the roster-scoped roundtrip)', async () => {
    const id = await seedAssignment();
    // user 1 is trip 5's owner — TripMembersRepository.rosterUserIds includes
    // the owner without a trip_members row (AS28), so this exercises the
    // replace-all write (AS29 delete + AS30 insertIgnore) without needing a
    // seeded membership row.
    const res = await request(server)
      .put(`/api/trips/5/assignments/${id}/participants`)
      .set('Cookie', sessionCookie(1))
      .send({ user_ids: [1, 1] }); // duplicate collapses via AS30's INSERT OR IGNORE
    expect(res.status).toBe(200);
    expect(res.body.participants).toEqual([{ user_id: 1, username: 'e2e-user', avatar: null }]);
    expect((await findRows(orm, AssignmentParticipants, { assignment: id }, { id: 'asc' })).map(r => ({ user_id: r.user_id }))).toEqual([{ user_id: 1 }]);

    const cleared = await request(server)
      .put(`/api/trips/5/assignments/${id}/participants`)
      .set('Cookie', sessionCookie(1))
      .send({ user_ids: [] });
    expect(cleared.status).toBe(200);
    expect(cleared.body.participants).toEqual([]);
  });

  it('200 participants (access-only)', async () => {
    const id = await seedAssignment();
    await insertRow(orm, AssignmentParticipants, { assignment: id, user: 2 });
    const res = await request(server).get(`/api/trips/5/assignments/${id}/participants`).set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ participants: [{ user_id: 2, username: 'peer', avatar: null }] });
  });

  it('400 from the Zod pipe on set participants with non-array', async () => {
    const res = await request(server).put('/api/trips/5/assignments/9/participants').set('Cookie', sessionCookie(1)).send({ user_ids: 'no' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('user_ids');
  });

  it('400 from the Zod pipe on create without a place_id', async () => {
    const res = await request(server).post('/api/trips/5/days/3/assignments').set('Cookie', sessionCookie(1)).send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('place_id');
  });

  it('move accepts the client api form order_index: null (coerces to 0)', async () => {
    const id = await seedAssignment();
    const res = await request(server)
      .put(`/api/trips/5/assignments/${id}/move`)
      .set('Cookie', sessionCookie(1))
      .send({ new_day_id: 4, order_index: null });
    expect(res.status).toBe(200);
    expect(res.body.assignment).toMatchObject({ id, day_id: 4, order_index: 0 });
  });

  // The per-assignment controller declared @RequirePermission but not the guard
  // that reads it, so the decorators were inert metadata and :tripId was never
  // checked against the caller at all. The handlers that ask
  // getAssignmentForTrip(id, tripId) were happy as long as the assignment sat on
  // the trip in the URL — which is true for the owner's trip too.
  describe('a trip the caller cannot see', () => {
    const FOREIGN_TRIP = 9;

    beforeEach(async () => {
      // Plan 3c Task 0b: real access now — trip 9 exists but is owned by
      // user 2 (not the caller, user 1, and not a member), so
      // TripsRepository.findAccessible genuinely refuses it, the same
      // outcome `canAccessTrip.mockImplementation` used to fake.
      await insertRowIgnoringConflict(orm, Trips, { id: FOREIGN_TRIP, user: 2, title: 'Their trip' });
      // day_number is NOT NULL on the real schema (the old hand-rolled DDL had no such constraint).
      await insertRowIgnoringConflict(orm, Days, { id: 30, trip: FOREIGN_TRIP, day_number: 1 });
      await insertRowIgnoringConflict(orm, Days, { id: 31, trip: FOREIGN_TRIP, day_number: 2 });
      await insertRowIgnoringConflict(orm, Places, { id: 20, trip: FOREIGN_TRIP, name: 'Their hotel' });
    });

    const seedForeignAssignment = () => insertRow(orm, DayAssignments, { day: 30, place: 20, order_index: 0 });

    it('404s a move instead of reordering their itinerary', async () => {
      const id = await seedForeignAssignment();
      const res = await request(server)
        .put(`/api/trips/${FOREIGN_TRIP}/assignments/${id}/move`)
        .set('Cookie', sessionCookie(1))
        .send({ new_day_id: 31, order_index: 0 });
      expect(res.status).toBe(404);
      expect(await assignmentCols(id, 'day_id')).toEqual({ day_id: 30 });
    });

    it('404s a time change instead of rewriting their schedule', async () => {
      const id = await seedForeignAssignment();
      const res = await request(server)
        .put(`/api/trips/${FOREIGN_TRIP}/assignments/${id}/time`)
        .set('Cookie', sessionCookie(1))
        .send({ place_time: '23:00', end_time: null });
      expect(res.status).toBe(404);
      expect(await assignmentCols(id, 'assignment_time')).toEqual({ assignment_time: null });
    });

    it('404s a transport change', async () => {
      const id = await seedForeignAssignment();
      const res = await request(server)
        .put(`/api/trips/${FOREIGN_TRIP}/assignments/${id}/transport`)
        .set('Cookie', sessionCookie(1))
        .send({ transport_mode: 'driving' });
      expect(res.status).toBe(404);
    });

    it('404s setting participants instead of writing to their assignment', async () => {
      const id = await seedForeignAssignment();
      const res = await request(server)
        .put(`/api/trips/${FOREIGN_TRIP}/assignments/${id}/participants`)
        .set('Cookie', sessionCookie(1))
        .send({ user_ids: [1] });
      expect(res.status).toBe(404);
      expect(await countRows(orm, AssignmentParticipants, { assignment: id })).toBe(0);
    });

    it('404s reading participants instead of disclosing who is on it', async () => {
      const id = await seedForeignAssignment();
      await insertRow(orm, AssignmentParticipants, { assignment: id, user: 2 });
      const res = await request(server)
        .get(`/api/trips/${FOREIGN_TRIP}/assignments/${id}/participants`)
        .set('Cookie', sessionCookie(1));
      expect(res.status).toBe(404);
    });

    // The guard has to reject an assignment borrowed from elsewhere even when the
    // caller is legitimately on the trip named in the URL.
    it('404s an assignment that belongs to another trip than the URL says', async () => {
      const id = await seedForeignAssignment();
      const res = await request(server)
        .put(`/api/trips/5/assignments/${id}/participants`)
        .set('Cookie', sessionCookie(1))
        .send({ user_ids: [1] });
      expect(res.status).toBe(404);
      expect(await countRows(orm, AssignmentParticipants, { assignment: id })).toBe(0);
    });

    it('404s a notes change on a foreign assignment instead of editing it (#2163)', async () => {
      const id = await seedForeignAssignment();
      const res = await request(server)
        .put(`/api/trips/${FOREIGN_TRIP}/assignments/${id}/notes`)
        .set('Cookie', sessionCookie(1))
        .send({ notes: 'hijacked' });
      expect(res.status).toBe(404);
      expect(await assignmentCols(id, 'notes')).toEqual({ notes: null });
    });

    it('403s when the caller is on the trip but lacks day_edit', async () => {
      const id = await seedAssignment();
      checkPermission.mockReturnValue(false);
      const res = await request(server)
        .put(`/api/trips/5/assignments/${id}/time`)
        .set('Cookie', sessionCookie(1))
        .send({ place_time: '09:00', end_time: null });
      expect(res.status).toBe(403);
    });

    it('403s a notes change without day_edit (#2163)', async () => {
      const id = await seedAssignment();
      checkPermission.mockReturnValue(false);
      const res = await request(server)
        .put(`/api/trips/5/assignments/${id}/notes`)
        .set('Cookie', sessionCookie(1))
        .send({ notes: 'nope' });
      expect(res.status).toBe(403);
      expect(await assignmentCols(id, 'notes')).toEqual({ notes: null });
    });
  });
});
