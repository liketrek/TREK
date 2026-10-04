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
 * mock); journeyService, the permission check and the WebSocket broadcast
 * stay mocked. Every `it(...)` body below is unchanged from before this
 * conversion — only the DB bootstrap changed.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { Test } from '@nestjs/testing';
import { sessionCookie } from './harness';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});
const { broadcast } = vi.hoisted(() => ({ broadcast: vi.fn() }));
vi.mock('../../src/websocket', () => ({ broadcast }));

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
import { createTestMikroOrmModule } from '../helpers/test-orm';

describe('Assignments e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), RealtimeModule, AssignmentsModule] })
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
    db.prepare("INSERT INTO users (id, username, email, password_hash, role, password_version) VALUES (1, 'e2e-user', 'e2e@example.test', 'x', 'user', 0)").run();
    db.prepare("INSERT INTO users (id, username, email, password_hash, role, password_version) VALUES (2, 'peer', 'peer@example.test', 'x', 'user', 0)").run();
    // Plan 3c Task 0b: TripAccessGuard reads TripsRepository.findAccessible
    // directly now, a real query — trip 5's real row (owned by user 1) is
    // seeded once here rather than faked per test. `days.day_number` is
    // `NOT NULL` on the real schema (the old hand-rolled DDL had no such
    // constraint).
    db.prepare("INSERT INTO trips (id, user_id, title) VALUES (5, 1, 'Trip')").run();
    db.prepare('INSERT INTO days (id, trip_id, day_number) VALUES (3, 5, 1), (4, 5, 2)').run();
    db.prepare('INSERT INTO places (id, trip_id, name) VALUES (2, 5, ?)').run('Louvre');
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    server = app.getHttpServer();
  });

  beforeEach(() => {
    checkPermission.mockReturnValue(true);
    db.prepare('DELETE FROM day_assignments').run();
    db.prepare('DELETE FROM assignment_participants').run();
  });

  afterAll(async () => {
    await app.close();
  });

  const seedAssignment = (dayId = 3, placeId = 2, orderIndex = 0) =>
    Number(db.prepare('INSERT INTO day_assignments (day_id, place_id, order_index) VALUES (?, ?, ?)').run(dayId, placeId, orderIndex).lastInsertRowid);

  it('401 without a cookie', async () => {
    expect((await request(server).get('/api/trips/5/days/3/assignments')).status).toBe(401);
  });

  it('200 list day-assignments', async () => {
    const id = seedAssignment();
    const res = await request(server).get('/api/trips/5/days/3/assignments').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.assignments).toHaveLength(1);
    expect(res.body.assignments[0]).toMatchObject({
      id, day_id: 3, place_id: 2, order_index: 0, participants: [],
      place: { id: 2, name: 'Louvre', tags: [] },
    });
  });

  it('201 create, 404 place', async () => {
    reconcileTripSkeletons.mockClear();
    const ok = await request(server).post('/api/trips/5/days/3/assignments').set('Cookie', sessionCookie(1)).send({ place_id: 2 });
    expect(ok.status).toBe(201);
    expect(ok.body.assignment).toMatchObject({ day_id: 3, place_id: 2, order_index: 0, notes: null, place: { id: 2, name: 'Louvre' } });
    const row = db.prepare('SELECT * FROM day_assignments WHERE id = ?').get(ok.body.assignment.id);
    expect(row).toMatchObject({ day_id: 3, place_id: 2, order_index: 0 });
    expect(reconcileTripSkeletons).toHaveBeenCalledWith(5, undefined);
    const miss = await request(server).post('/api/trips/5/days/3/assignments').set('Cookie', sessionCookie(1)).send({ place_id: 99 });
    expect(miss.status).toBe(404);
    expect(miss.body).toEqual({ error: 'Place not found' });
  });

  it('200 delete assignment reconciles journey skeletons', async () => {
    reconcileTripSkeletons.mockClear();
    const id = seedAssignment();
    const res = await request(server).delete(`/api/trips/5/days/3/assignments/${id}`).set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(db.prepare('SELECT id FROM day_assignments WHERE id = ?').get(id)).toBeUndefined();
    expect(reconcileTripSkeletons).toHaveBeenCalledWith(5, undefined);
  });

  it('200 clear day removes every place of the day and keeps the day (#2470)', async () => {
    reconcileTripSkeletons.mockClear();
    const first = seedAssignment(3, 2, 0);
    const second = seedAssignment(3, 2, 1);
    const elsewhere = seedAssignment(4, 2, 0);
    const res = await request(server).delete('/api/trips/5/days/3/assignments').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect([...res.body.removedIds].sort()).toEqual([first, second].sort());
    expect(db.prepare('SELECT COUNT(*) AS n FROM day_assignments WHERE day_id = 3').get()).toEqual({ n: 0 });
    expect(db.prepare('SELECT id FROM day_assignments WHERE id = ?').get(elsewhere)).toEqual({ id: elsewhere });
    expect(reconcileTripSkeletons).toHaveBeenCalledWith(5, undefined);
  });

  it('403 clear day without day_edit, 404 for a foreign day', async () => {
    seedAssignment();
    checkPermission.mockReturnValue(false);
    expect((await request(server).delete('/api/trips/5/days/3/assignments').set('Cookie', sessionCookie(1))).status).toBe(403);
    checkPermission.mockReturnValue(true);
    const miss = await request(server).delete('/api/trips/5/days/999/assignments').set('Cookie', sessionCookie(1));
    expect(miss.status).toBe(404);
    expect(miss.body).toEqual({ error: 'Day not found' });
  });

  it('200 route exclude roundtrip, 400 without a boolean (#2532)', async () => {
    const id = seedAssignment();
    const res = await request(server).put(`/api/trips/5/assignments/${id}/route`).set('Cookie', sessionCookie(1)).send({ excluded: true });
    expect(res.status).toBe(200);
    expect(res.body.assignment).toMatchObject({ id, route_excluded: true });
    const list = await request(server).get('/api/trips/5/days/3/assignments').set('Cookie', sessionCookie(1));
    expect(list.body.assignments[0].route_excluded).toBe(true);
    expect((await request(server).put(`/api/trips/5/assignments/${id}/route`).set('Cookie', sessionCookie(1)).send({ excluded: 'yes' })).status).toBe(400);
  });

  it('200 move assignment reconciles journey skeletons', async () => {
    reconcileTripSkeletons.mockClear();
    const id = seedAssignment();
    const res = await request(server)
      .put(`/api/trips/5/assignments/${id}/move`)
      .set('Cookie', sessionCookie(1))
      .send({ new_day_id: 4, order_index: 0 });
    expect(res.status).toBe(200);
    expect(res.body.assignment).toMatchObject({ id, day_id: 4, order_index: 0 });
    expect(db.prepare('SELECT day_id FROM day_assignments WHERE id = ?').get(id)).toEqual({ day_id: 4 });
    expect(reconcileTripSkeletons).toHaveBeenCalledWith(5, undefined);
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
    expect(db.prepare('SELECT notes FROM day_assignments WHERE id = ?').get(id)).toEqual({ notes: 'Arrive 15 minutes early' });

    const list = await request(server).get('/api/trips/5/days/3/assignments').set('Cookie', sessionCookie(1));
    expect(list.status).toBe(200);
    expect(list.body.assignments.find((a: { id: number }) => a.id === id).notes).toBe('Arrive 15 minutes early');
  });

  it('200 notes clear: null and empty string both null the column (#2163)', async () => {
    const id = seedAssignment();
    db.prepare('UPDATE day_assignments SET notes = ? WHERE id = ?').run('old note', id);
    const cleared = await request(server).put(`/api/trips/5/assignments/${id}/notes`).set('Cookie', sessionCookie(1)).send({ notes: null });
    expect(cleared.status).toBe(200);
    expect(cleared.body.assignment.notes).toBeNull();
    db.prepare('UPDATE day_assignments SET notes = ? WHERE id = ?').run('old note', id);
    const emptied = await request(server).put(`/api/trips/5/assignments/${id}/notes`).set('Cookie', sessionCookie(1)).send({ notes: '' });
    expect(emptied.status).toBe(200);
    expect(db.prepare('SELECT notes FROM day_assignments WHERE id = ?').get(id)).toEqual({ notes: null });
  });

  it('400 notes body without the notes key is rejected by the Zod pipe (#2163)', async () => {
    const id = seedAssignment();
    const res = await request(server).put(`/api/trips/5/assignments/${id}/notes`).set('Cookie', sessionCookie(1)).send({});
    expect(res.status).toBe(400);
  });

  it('200 update time reconciles journey skeletons', async () => {
    reconcileTripSkeletons.mockClear();
    const id = seedAssignment();
    const res = await request(server)
      .put(`/api/trips/5/assignments/${id}/time`)
      .set('Cookie', sessionCookie(1))
      .send({ place_time: '09:00', end_time: null });
    expect(res.status).toBe(200);
    expect(res.body.assignment).toMatchObject({ id, assignment_time: '09:00', assignment_end_time: null });
    expect(db.prepare('SELECT assignment_time FROM day_assignments WHERE id = ?').get(id)).toEqual({ assignment_time: '09:00' });
    expect(reconcileTripSkeletons).toHaveBeenCalledWith(5, undefined);
  });

  describe('PUT /:id/time and the order of the day', () => {
    const seedDay = (times: (string | null)[]) => times.map((time, i) => {
      const id = seedAssignment(3, 2, i);
      if (time) db.prepare('UPDATE day_assignments SET assignment_time = ? WHERE id = ?').run(time, id);
      return id;
    });
    const dayOrder = () =>
      (db.prepare('SELECT id FROM day_assignments WHERE day_id = 3 ORDER BY order_index, id').all() as { id: number }[]).map(r => r.id);
    const eventsSent = () => broadcast.mock.calls.map(call => call[1]);

    beforeEach(() => broadcast.mockClear());

    it('keeps the untimed stops in front of the stop that gets a start', async () => {
      const [a, b, c] = seedDay([null, null, null]);
      const res = await request(server)
        .put(`/api/trips/5/assignments/${c}/time`)
        .set('Cookie', sessionCookie(1))
        .set('X-Socket-Id', 'sock-1')
        .send({ place_time: '14:00', end_time: null });
      expect(res.status).toBe(200);
      expect(res.body.assignment).toMatchObject({ id: c, assignment_time: '14:00', order_index: 2 });
      expect(dayOrder()).toEqual([a, b, c]);
      expect(eventsSent()).toEqual(['assignment:updated']);
    });

    it('sorts the timed stops, keeps the untimed head first and sends the whole day', async () => {
      const [a, b, c] = seedDay([null, '15:00', null]);
      const res = await request(server)
        .put(`/api/trips/5/assignments/${c}/time`)
        .set('Cookie', sessionCookie(1))
        .set('X-Socket-Id', 'sock-1')
        .send({ place_time: '10:00', end_time: null });
      expect(res.status).toBe(200);
      expect(dayOrder()).toEqual([a, c, b]);
      // No socket left out, so the writer gets the order too.
      expect(broadcast).toHaveBeenCalledWith('5', 'assignment:reordered', { dayId: 3, orderedIds: [a, c, b] }, undefined);
      // No located stops and no vias on this day, so there is nothing to re-pin.
      expect(eventsSent()).not.toContain('roadtripVia:changed');
    });

    it('stores the order it sends: a day with a gap in its keys is numbered from 0', async () => {
      // The gap a deleted stop leaves. Clients number the ids they are sent by position.
      const [a, b, c] = [0, 4, 7].map(key => seedAssignment(3, 2, key));
      db.prepare('UPDATE day_assignments SET assignment_time = ? WHERE id = ?').run('15:00', b);
      const res = await request(server)
        .put(`/api/trips/5/assignments/${c}/time`)
        .set('Cookie', sessionCookie(1))
        .send({ place_time: '10:00', end_time: null });
      expect(res.status).toBe(200);
      const sent = broadcast.mock.calls.find(call => call[1] === 'assignment:reordered')?.[2] as { orderedIds: number[] };
      expect(sent.orderedIds).toEqual([a, c, b]);
      const keyOf = (id: number) => (db.prepare('SELECT order_index FROM day_assignments WHERE id = ?').get(id) as { order_index: number }).order_index;
      expect(sent.orderedIds.map(keyOf)).toEqual([0, 1, 2]);
      expect(res.body.assignment).toMatchObject({ id: c, order_index: 1 });
    });

    it('leaves a day dragged out of time order alone when only the End changes', async () => {
      const [a, b] = seedDay(['14:00', '10:00']);
      db.prepare("UPDATE day_assignments SET assignment_end_time = '11:00' WHERE id = ?").run(b);
      const res = await request(server)
        .put(`/api/trips/5/assignments/${b}/time`)
        .set('Cookie', sessionCookie(1))
        .set('X-Socket-Id', 'sock-1')
        .send({ place_time: '10:00', end_time: null });
      expect(res.status).toBe(200);
      expect(res.body.assignment).toMatchObject({ id: b, assignment_time: '10:00', assignment_end_time: null });
      expect(dayOrder()).toEqual([a, b]);
      expect(eventsSent()).toEqual(['assignment:updated']);
    });
  });

  it('200 set participants replaces the list (AS28-31, the roster-scoped roundtrip)', async () => {
    const id = seedAssignment();
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
    expect(db.prepare('SELECT user_id FROM assignment_participants WHERE assignment_id = ?').all(id)).toEqual([{ user_id: 1 }]);

    const cleared = await request(server)
      .put(`/api/trips/5/assignments/${id}/participants`)
      .set('Cookie', sessionCookie(1))
      .send({ user_ids: [] });
    expect(cleared.status).toBe(200);
    expect(cleared.body.participants).toEqual([]);
  });

  it('200 participants (access-only)', async () => {
    const id = seedAssignment();
    db.prepare('INSERT INTO assignment_participants (assignment_id, user_id) VALUES (?, 2)').run(id);
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
    const id = seedAssignment();
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

    beforeEach(() => {
      // Plan 3c Task 0b: real access now — trip 9 exists but is owned by
      // user 2 (not the caller, user 1, and not a member), so
      // TripsRepository.findAccessible genuinely refuses it, the same
      // outcome `canAccessTrip.mockImplementation` used to fake.
      db.prepare('INSERT OR IGNORE INTO trips (id, user_id, title) VALUES (?, 2, ?)').run(FOREIGN_TRIP, 'Their trip');
      // day_number is NOT NULL on the real schema (the old hand-rolled DDL had no such constraint).
      db.prepare('INSERT OR IGNORE INTO days (id, trip_id, day_number) VALUES (30, ?, 1), (31, ?, 2)').run(FOREIGN_TRIP, FOREIGN_TRIP);
      db.prepare('INSERT OR IGNORE INTO places (id, trip_id, name) VALUES (20, ?, ?)').run(FOREIGN_TRIP, 'Their hotel');
    });

    const seedForeignAssignment = () =>
      Number(db.prepare('INSERT INTO day_assignments (day_id, place_id, order_index) VALUES (30, 20, 0)').run().lastInsertRowid);

    it('404s a move instead of reordering their itinerary', async () => {
      const id = seedForeignAssignment();
      const res = await request(server)
        .put(`/api/trips/${FOREIGN_TRIP}/assignments/${id}/move`)
        .set('Cookie', sessionCookie(1))
        .send({ new_day_id: 31, order_index: 0 });
      expect(res.status).toBe(404);
      expect(db.prepare('SELECT day_id FROM day_assignments WHERE id = ?').get(id)).toEqual({ day_id: 30 });
    });

    it('404s a time change instead of rewriting their schedule', async () => {
      const id = seedForeignAssignment();
      const res = await request(server)
        .put(`/api/trips/${FOREIGN_TRIP}/assignments/${id}/time`)
        .set('Cookie', sessionCookie(1))
        .send({ place_time: '23:00', end_time: null });
      expect(res.status).toBe(404);
      expect(db.prepare('SELECT assignment_time FROM day_assignments WHERE id = ?').get(id)).toEqual({ assignment_time: null });
    });

    it('404s a transport change', async () => {
      const id = seedForeignAssignment();
      const res = await request(server)
        .put(`/api/trips/${FOREIGN_TRIP}/assignments/${id}/transport`)
        .set('Cookie', sessionCookie(1))
        .send({ transport_mode: 'driving' });
      expect(res.status).toBe(404);
    });

    it('404s setting participants instead of writing to their assignment', async () => {
      const id = seedForeignAssignment();
      const res = await request(server)
        .put(`/api/trips/${FOREIGN_TRIP}/assignments/${id}/participants`)
        .set('Cookie', sessionCookie(1))
        .send({ user_ids: [1] });
      expect(res.status).toBe(404);
      expect(db.prepare('SELECT COUNT(*) AS n FROM assignment_participants WHERE assignment_id = ?').get(id)).toEqual({ n: 0 });
    });

    it('404s reading participants instead of disclosing who is on it', async () => {
      const id = seedForeignAssignment();
      db.prepare('INSERT INTO assignment_participants (assignment_id, user_id) VALUES (?, 2)').run(id);
      const res = await request(server)
        .get(`/api/trips/${FOREIGN_TRIP}/assignments/${id}/participants`)
        .set('Cookie', sessionCookie(1));
      expect(res.status).toBe(404);
    });

    // The guard has to reject an assignment borrowed from elsewhere even when the
    // caller is legitimately on the trip named in the URL.
    it('404s an assignment that belongs to another trip than the URL says', async () => {
      const id = seedForeignAssignment();
      const res = await request(server)
        .put(`/api/trips/5/assignments/${id}/participants`)
        .set('Cookie', sessionCookie(1))
        .send({ user_ids: [1] });
      expect(res.status).toBe(404);
      expect(db.prepare('SELECT COUNT(*) AS n FROM assignment_participants WHERE assignment_id = ?').get(id)).toEqual({ n: 0 });
    });

    it('404s a notes change on a foreign assignment instead of editing it (#2163)', async () => {
      const id = seedForeignAssignment();
      const res = await request(server)
        .put(`/api/trips/${FOREIGN_TRIP}/assignments/${id}/notes`)
        .set('Cookie', sessionCookie(1))
        .send({ notes: 'hijacked' });
      expect(res.status).toBe(404);
      expect(db.prepare('SELECT notes FROM day_assignments WHERE id = ?').get(id)).toEqual({ notes: null });
    });

    it('403s when the caller is on the trip but lacks day_edit', async () => {
      const id = seedAssignment();
      checkPermission.mockReturnValue(false);
      const res = await request(server)
        .put(`/api/trips/5/assignments/${id}/time`)
        .set('Cookie', sessionCookie(1))
        .send({ place_time: '09:00', end_time: null });
      expect(res.status).toBe(403);
    });

    it('403s a notes change without day_edit (#2163)', async () => {
      const id = seedAssignment();
      checkPermission.mockReturnValue(false);
      const res = await request(server)
        .put(`/api/trips/5/assignments/${id}/notes`)
        .set('Cookie', sessionCookie(1))
        .send({ notes: 'nope' });
      expect(res.status).toBe(403);
      expect(db.prepare('SELECT notes FROM day_assignments WHERE id = ?').get(id)).toEqual({ notes: null });
    });
  });
});
