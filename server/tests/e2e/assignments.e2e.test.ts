/**
 * Assignments module e2e — exercises both migrated controllers through the real
 * JwtAuthGuard against a temp SQLite db. AssignmentsService runs its real SQL
 * (DI-injected, no service mock); journeyService, the permission check,
 * canAccessTrip and the WebSocket broadcast stay mocked.
 */
import { AssignmentsModule } from '../../src/nest/assignments/assignments.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { JourneyDomainService } from '../../src/nest/journey/journey-domain.service';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { seedUser, sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  // Only what the un-mocked DI service actually touches: the auth guard reads
  // users; AssignmentsService's real SQL reads/writes the itinerary tables
  // (display_name/avatar feed the participants COALESCE projection).
  tmp.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0,
    display_name TEXT, avatar TEXT);`);
  tmp.exec(`CREATE TABLE days (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL);`);
  tmp.exec(`CREATE TABLE categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, color TEXT, icon TEXT);`);
  tmp.exec(`CREATE TABLE places (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL, name TEXT,
    description TEXT, lat REAL, lng REAL, address TEXT, category_id INTEGER, price REAL, currency TEXT,
    place_time TEXT, end_time TEXT, duration_minutes INTEGER DEFAULT 60, notes TEXT, image_url TEXT,
    transport_mode TEXT DEFAULT 'walking', google_place_id TEXT, google_ftid TEXT, osm_id TEXT, website TEXT, phone TEXT);`);
  tmp.exec(`CREATE TABLE day_assignments (id INTEGER PRIMARY KEY AUTOINCREMENT, day_id INTEGER NOT NULL,
    place_id INTEGER NOT NULL, order_index INTEGER NOT NULL DEFAULT 0, notes TEXT,
    assignment_time TEXT, assignment_end_time TEXT, leg_transport_mode TEXT,
    created_at TEXT DEFAULT (datetime('now')));`);
  tmp.exec(`CREATE TABLE assignment_participants (assignment_id INTEGER NOT NULL, user_id INTEGER NOT NULL,
    UNIQUE(assignment_id, user_id));`);
  tmp.exec(`CREATE TABLE tags (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, color TEXT, created_at TEXT);`);
  tmp.exec(`CREATE TABLE place_tags (place_id INTEGER NOT NULL, tag_id INTEGER NOT NULL);`);
  // StorageRegistryService (behind StorageModule, now in this module chain) reads
  // this at onModuleInit.
  tmp.exec('CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT);');
  return { db: tmp };
});

const { canAccessTrip } = vi.hoisted(() => ({ canAccessTrip: vi.fn() }));
vi.mock('../../src/db/database', () => ({
  db,
  canAccessTrip,
  isOwner: vi.fn(() => true),
  getPlaceWithTags: vi.fn(),
  closeDb: () => {},
  reinitialize: () => {},
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn() }));

const { reconcileTripSkeletons } = vi.hoisted(() => ({ reconcileTripSkeletons: vi.fn() }));

// Since the permissions DI migration, the check is a spy on the container's
// PermissionsService singleton (created in beforeAll, after build()).
let checkPermission: MockInstance;

describe('Assignments e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule, RealtimeModule, AssignmentsModule] })
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
    seedUser(db as never, { id: 1 });
    seedUser(db as never, { id: 2, username: 'peer', email: 'peer@example.test' });
    db.prepare('INSERT INTO days (id, trip_id) VALUES (3, 5), (4, 5)').run();
    db.prepare('INSERT INTO places (id, trip_id, name) VALUES (2, 5, ?)').run('Louvre');
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    server = app.getHttpServer();
  });

  beforeEach(() => {
    canAccessTrip.mockReturnValue({ id: 5, user_id: 1 });
    checkPermission.mockReturnValue(true);
    db.prepare('DELETE FROM day_assignments').run();
    db.prepare('DELETE FROM assignment_participants').run();
  });

  afterAll(async () => {
    await app.close();
  });

  const seedAssignment = (dayId = 3, placeId = 2, orderIndex = 0) =>
    Number(
      db
        .prepare('INSERT INTO day_assignments (day_id, place_id, order_index) VALUES (?, ?, ?)')
        .run(dayId, placeId, orderIndex).lastInsertRowid,
    );

  it('401 without a cookie', async () => {
    expect((await request(server).get('/api/trips/5/days/3/assignments')).status).toBe(401);
  });

  it('200 list day-assignments', async () => {
    const id = seedAssignment();
    const res = await request(server).get('/api/trips/5/days/3/assignments').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.assignments).toHaveLength(1);
    expect(res.body.assignments[0]).toMatchObject({
      id,
      day_id: 3,
      place_id: 2,
      order_index: 0,
      participants: [],
      place: { id: 2, name: 'Louvre', tags: [] },
    });
  });

  it('201 create, 404 place', async () => {
    reconcileTripSkeletons.mockClear();
    const ok = await request(server)
      .post('/api/trips/5/days/3/assignments')
      .set('Cookie', sessionCookie(1))
      .send({ place_id: 2 });
    expect(ok.status).toBe(201);
    expect(ok.body.assignment).toMatchObject({
      day_id: 3,
      place_id: 2,
      order_index: 0,
      notes: null,
      place: { id: 2, name: 'Louvre' },
    });
    const row = db.prepare('SELECT * FROM day_assignments WHERE id = ?').get(ok.body.assignment.id);
    expect(row).toMatchObject({ day_id: 3, place_id: 2, order_index: 0 });
    expect(reconcileTripSkeletons).toHaveBeenCalledWith(5, undefined);
    const miss = await request(server)
      .post('/api/trips/5/days/3/assignments')
      .set('Cookie', sessionCookie(1))
      .send({ place_id: 99 });
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

  it('200 update time reconciles journey skeletons', async () => {
    reconcileTripSkeletons.mockClear();
    const id = seedAssignment();
    const res = await request(server)
      .put(`/api/trips/5/assignments/${id}/time`)
      .set('Cookie', sessionCookie(1))
      .send({ place_time: '09:00', end_time: null });
    expect(res.status).toBe(200);
    expect(res.body.assignment).toMatchObject({ id, assignment_time: '09:00', assignment_end_time: null });
    expect(db.prepare('SELECT assignment_time FROM day_assignments WHERE id = ?').get(id)).toEqual({
      assignment_time: '09:00',
    });
    expect(reconcileTripSkeletons).toHaveBeenCalledWith(5, undefined);
  });

  it('200 participants (access-only)', async () => {
    const id = seedAssignment();
    db.prepare('INSERT INTO assignment_participants (assignment_id, user_id) VALUES (?, 2)').run(id);
    const res = await request(server)
      .get(`/api/trips/5/assignments/${id}/participants`)
      .set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ participants: [{ user_id: 2, username: 'peer', avatar: null }] });
  });

  it('400 from the Zod pipe on set participants with non-array', async () => {
    const res = await request(server)
      .put('/api/trips/5/assignments/9/participants')
      .set('Cookie', sessionCookie(1))
      .send({ user_ids: 'no' });
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
      canAccessTrip.mockImplementation((tripId: unknown) => (Number(tripId) === 5 ? { id: 5, user_id: 1 } : undefined));
      db.prepare('INSERT OR IGNORE INTO days (id, trip_id) VALUES (30, ?), (31, ?)').run(FOREIGN_TRIP, FOREIGN_TRIP);
      db.prepare('INSERT OR IGNORE INTO places (id, trip_id, name) VALUES (20, ?, ?)').run(FOREIGN_TRIP, 'Their hotel');
    });

    const seedForeignAssignment = () =>
      Number(
        db.prepare('INSERT INTO day_assignments (day_id, place_id, order_index) VALUES (30, 20, 0)').run()
          .lastInsertRowid,
      );

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
      expect(db.prepare('SELECT assignment_time FROM day_assignments WHERE id = ?').get(id)).toEqual({
        assignment_time: null,
      });
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
      expect(db.prepare('SELECT COUNT(*) AS n FROM assignment_participants WHERE assignment_id = ?').get(id)).toEqual({
        n: 0,
      });
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
      expect(db.prepare('SELECT COUNT(*) AS n FROM assignment_participants WHERE assignment_id = ?').get(id)).toEqual({
        n: 0,
      });
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
  });
});
