/**
 * Trips module e2e — exercises the migrated /api/trips aggregate-root endpoints
 * through the real JwtAuthGuard against a real migrated-and-seeded temp SQLite
 * db (createSnapshotTestDb(), Task 9 fix wave M6 — this used to hand-roll
 * about two dozen CREATE TABLEs, a second hand-maintained schema copy that
 * diverged from the real migrated one in ways no `SELECT *`/`toMatchObject`
 * read could see: the hand-rolled `journey_entries` table had no
 * `author_id`/`entry_date` NOT NULL columns and no FK to a real `journeys`
 * row, so the delete-trip test's inserts would have failed loudly against
 * the real schema — see that test's setup below for the fix). TripsService
 * and every domain `bundle()` touches (days, places, packing, files,
 * reservations, todos) now run their real SQL over the same migrated
 * connection; trip access resolves through `TripsRepository.findAccessible`
 * via the real request-scoped `EntityManager` `createTestMikroOrmModule`
 * wires in, not a hand-rolled `canAccessTrip`/`getPlaceWithTags` mock (the
 * legacy overrides this file used to export from `db/database.ts` — deleted
 * there since Plan 3c Task 0b; a stale mock here would silently do nothing,
 * not fail loudly, which is worse than removing it — the same reasoning
 * `days.e2e.test.ts`'s identical comment gives). Only the permission check,
 * `BudgetService` (the budget fold's own container spy, unrelated to this
 * conversion) and the WebSocket broadcast stay mocked.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { Test } from '@nestjs/testing';
import { sessionCookie } from './harness';
import { MAX_TRIP_DAYS } from '@trek/shared';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn() }));
// The audit domain is DI-native now: writeAudit runs for real against the temp
// db's audit_log table; only the file logger is silenced.
vi.mock('../../src/nest/audit/audit-log.logger', () => ({ LOG_LEVEL: 'error', logInfo: vi.fn(), logDebug: vi.fn(), logError: vi.fn(), logWarn: vi.fn() }));
vi.mock('../../src/nest/common/demo', () => ({ isDemoEmail: vi.fn(() => false) }));

import { db } from '../../src/db/database';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';

// Since the permissions DI migration, the check is a spy on the container's
// PermissionsService singleton (created in beforeAll, after build()).
let checkPermission: MockInstance;

// TripsService itself is real since the trip fold — no tripService mock; the
// real migrated trips/trip_members/days tables serve its SQL.
// bundle()'s days + accommodations now run DaysService's real SQL (DI-injected,
// no mock). bundle()'s places now run PlacesService's real SQL (DI-injected
// since the place fold, no mock). bundle()'s budget items come from the
// DI-injected BudgetService since the budget fold — stubbed via a container
// spy in beforeAll (unrelated to this file's schema conversion).

import { BudgetService } from '../../src/nest/budget/budget.service';
import { TripsModule } from '../../src/nest/trips/trips.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { createTestMikroOrmModule } from '../helpers/test-orm';

describe('Trips e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), RealtimeModule, TripsModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    // harness.ts's seedUser() omits password_hash, which the real migrated
    // schema requires NOT NULL (days.e2e.test.ts/addons.e2e.test.ts hit the
    // same thing) — a raw insert here instead.
    db.prepare(
      "INSERT INTO users (id, username, email, password_hash, role, password_version) VALUES (1, 'e2e-user', 'e2e@example.test', 'x', 'user', 0)",
    ).run();
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    vi.spyOn(app.get(BudgetService), 'listBudgetItems').mockResolvedValue([]);
    vi.spyOn(app.get(BudgetService), 'rebaseTripCurrency').mockResolvedValue();
    server = app.getHttpServer();
  });

  beforeEach(() => {
    db.prepare('DELETE FROM trips').run();
    db.prepare('DELETE FROM trip_members').run();
    db.prepare('DELETE FROM days').run();
    db.prepare('DELETE FROM audit_log').run();
    db.prepare('DELETE FROM settings').run();
    // 0b review L2 / security review F-B7: dead mock scaffolding — see
    // budget.e2e.test.ts's identical comment.
    checkPermission.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
  });

  const seedTrip = (title = 'T', userId = 1) =>
    Number(db.prepare('INSERT INTO trips (user_id, title) VALUES (?, ?)').run(userId, title).lastInsertRowid);

  it('401 without a cookie', async () => {
    expect((await request(server).get('/api/trips')).status).toBe(401);
  });

  it('200 list (real TRIP_SELECT: is_owner + counts)', async () => {
    const tripId = seedTrip('T');
    const res = await request(server).get('/api/trips').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.trips).toHaveLength(1);
    expect(res.body.trips[0]).toMatchObject({ id: tripId, title: 'T', is_owner: 1, day_count: 0, place_count: 0, shared_count: 0 });
  });

  it('201 create (real insert + day generation), 403 without permission', async () => {
    const ok = await request(server).post('/api/trips').set('Cookie', sessionCookie(1)).send({ title: 'T' });
    expect(ok.status).toBe(201);
    // The dateless create seeds the default 7 placeholder days.
    expect(ok.body.trip).toMatchObject({ title: 'T', currency: 'EUR', day_count: 7, is_owner: 1 });
    const dayRows = db.prepare('SELECT COUNT(*) AS n FROM days WHERE trip_id = ?').get(ok.body.trip.id) as { n: number };
    expect(dayRows.n).toBe(7);
    // The DI-native AuditService wrote the real row (audit_log DDL above).
    const audit = db.prepare("SELECT user_id FROM audit_log WHERE action = 'trip.create'").get() as { user_id: number };
    expect(audit).toEqual({ user_id: 1 });
    checkPermission.mockReturnValue(false);
    const forbidden = await request(server).post('/api/trips').set('Cookie', sessionCookie(1)).send({ title: 'T' });
    expect(forbidden.status).toBe(403);
  });

  it('201 create without a currency takes the display currency from the settings', async () => {
    db.prepare("INSERT INTO settings (user_id, key, value) VALUES (1, 'default_currency', ?)").run(JSON.stringify('USD'));
    const preferred = await request(server).post('/api/trips').set('Cookie', sessionCookie(1)).send({ title: 'Road trip' });
    expect(preferred.status).toBe(201);
    expect(preferred.body.trip).toMatchObject({ title: 'Road trip', currency: 'USD' });
    const explicit = await request(server).post('/api/trips').set('Cookie', sessionCookie(1)).send({ title: 'Tokyo', currency: 'JPY' });
    expect(explicit.status).toBe(201);
    expect(explicit.body.trip).toMatchObject({ title: 'Tokyo', currency: 'JPY' });
  });

  it('201 create keeps every day of a trip longer than a year (#2403)', async () => {
    // 2025-01-26 .. 2026-01-28 is 368 days; the day list used to stop at 365.
    const res = await request(server).post('/api/trips').set('Cookie', sessionCookie(1))
      .send({ title: 'Gap year', start_date: '2025-01-26', end_date: '2026-01-28' });
    expect(res.status).toBe(201);
    expect(res.body.trip).toMatchObject({ start_date: '2025-01-26', end_date: '2026-01-28', day_count: 368 });
    const last = db.prepare('SELECT day_number, date FROM days WHERE trip_id = ? ORDER BY day_number DESC LIMIT 1')
      .get(res.body.trip.id) as { day_number: number; date: string };
    expect(last).toEqual({ day_number: 368, date: '2026-01-28' });
  });

  it('400 on a date range past MAX_TRIP_DAYS, for create and update alike', async () => {
    const tooLong = await request(server).post('/api/trips').set('Cookie', sessionCookie(1))
      .send({ title: 'Decade', start_date: '2026-01-01', end_date: '2036-01-01' });
    expect(tooLong.status).toBe(400);
    expect(tooLong.body).toEqual({ error: `A trip can span at most ${MAX_TRIP_DAYS} days` });
    expect(db.prepare('SELECT COUNT(*) AS n FROM trips').get()).toEqual({ n: 0 });

    const week = await request(server).post('/api/trips').set('Cookie', sessionCookie(1))
      .send({ title: 'Week', start_date: '2026-07-01', end_date: '2026-07-07' });
    const stretched = await request(server).put(`/api/trips/${week.body.trip.id}`).set('Cookie', sessionCookie(1))
      .send({ end_date: '2036-07-01' });
    expect(stretched.status).toBe(400);
    expect(stretched.body).toEqual({ error: `A trip can span at most ${MAX_TRIP_DAYS} days` });
    expect(db.prepare('SELECT end_date FROM trips WHERE id = ?').get(week.body.trip.id)).toEqual({ end_date: '2026-07-07' });
  });

  it('200 update with an earlier end drops the last days, and the answer stays { trip }', async () => {
    const week = await request(server).post('/api/trips').set('Cookie', sessionCookie(1))
      .send({ title: 'Week', start_date: '2026-07-01', end_date: '2026-07-07' });
    const kept = db.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number LIMIT 5').all(week.body.trip.id);
    const res = await request(server).put(`/api/trips/${week.body.trip.id}`).set('Cookie', sessionCookie(1))
      .send({ end_date: '2026-07-05' });
    expect(res.status).toBe(200);
    expect(Object.keys(res.body)).toEqual(['trip']);
    expect(res.body.trip).toMatchObject({ start_date: '2026-07-01', end_date: '2026-07-05', day_count: 5 });
    expect(db.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number').all(week.body.trip.id)).toEqual(kept);
  });

  it('404 on a missing trip', async () => {
    const res = await request(server).get('/api/trips/77').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
  });

  describe('GET /active (startup destination)', () => {
    const seedDated = (title: string, start: string, end: string) =>
      Number(db.prepare('INSERT INTO trips (user_id, title, start_date, end_date) VALUES (1, ?, ?, ?)')
        .run(title, start, end).lastInsertRowid);

    it('401 without a cookie', async () => {
      expect((await request(server).get('/api/trips/active')).status).toBe(401);
    });

    // The literal route sits above @Get(':id'); if it ever slips below, this
    // asks for a trip with the id "active" and comes back 404 instead.
    it('resolves as its own route rather than as /api/trips/:id', async () => {
      const running = seedDated('Running', '2000-01-01', '2999-12-31');
      const res = await request(server).get('/api/trips/active').set('Cookie', sessionCookie(1));
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ trip: { id: running, title: 'Running', start_date: '2000-01-01', end_date: '2999-12-31' } });
    });

    it('answers { trip: null } when the user has no trip at all', async () => {
      const res = await request(server).get('/api/trips/active').set('Cookie', sessionCookie(1));
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ trip: null });
    });

    it('carries no wide trip columns — it is read on first paint', async () => {
      seedDated('Running', '2000-01-01', '2999-12-31');
      const res = await request(server).get('/api/trips/active').set('Cookie', sessionCookie(1));
      expect(Object.keys(res.body.trip).sort()).toEqual(['end_date', 'id', 'start_date', 'title']);
    });
  });

  // Real CalendarService against the temp db: a title carrying U+3000 slipped
  // through the old \s keep-class into setHeader and 500'd the export (#2165).
  it('200 export.ics with a header-safe filename for a title full of ideographic whitespace', async () => {
    const tripId = Number(db.prepare('INSERT INTO trips (user_id, title, start_date, end_date) VALUES (1, ?, ?, ?)')
      .run('沖縄　4泊5日', '2026-05-01', '2026-05-05').lastInsertRowid);
    const res = await request(server).get(`/api/trips/${tripId}/export.ics`).set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/calendar');
    expect(res.headers['content-disposition']).toBe('attachment; filename="___4_5_.ics"');
    expect(res.text).toContain('BEGIN:VCALENDAR');
  });

  it('200 bundle for an accessible trip (real member list)', async () => {
    const tripId = seedTrip('B');
    const res = await request(server).get(`/api/trips/${tripId}/bundle`).set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ trip: { id: tripId }, days: [], members: [{ id: 1, role: 'owner' }] });
  });

  it('200 delete cleans up synced journey entries (real SQL)', async () => {
    const tripId = seedTrip('D');
    // Task 9 fix wave (M6) finding: the hand-rolled DDL this test used to run
    // against had no NOT NULL/FK constraints on `journey_entries` at all
    // (no `author_id`, no `entry_date`, no FK to a real `journeys` row) — a
    // bare `INSERT INTO journey_entries (journey_id, source_trip_id, type)
    // VALUES (1, ?, 'skeleton')` passed silently there. The real migrated
    // schema requires `journey_id` to reference a real `journeys` row (NOT
    // NULL FK) plus `author_id`/`entry_date`/`created_at`/`updated_at` NOT
    // NULL — a real journey row (and those columns) are seeded here so the
    // insert that used to pass for the wrong reason now passes for the real
    // one. The assertions below are untouched, character-for-character.
    const journeyId = Number(db.prepare(
      "INSERT INTO journeys (user_id, title, created_at, updated_at) VALUES (1, 'J', 0, 0)",
    ).run().lastInsertRowid);
    db.prepare(
      "INSERT INTO journey_entries (journey_id, source_trip_id, author_id, type, entry_date, created_at, updated_at) VALUES (?, ?, 1, 'skeleton', '2026-01-01', 0, 0)",
    ).run(journeyId, tripId);
    const filledId = Number(db.prepare(
      "INSERT INTO journey_entries (journey_id, source_trip_id, author_id, type, entry_date, created_at, updated_at) VALUES (?, ?, 1, 'story', '2026-01-01', 0, 0)",
    ).run(journeyId, tripId).lastInsertRowid);
    const res = await request(server).delete(`/api/trips/${tripId}`).set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(db.prepare('SELECT id FROM trips WHERE id = ?').get(tripId)).toBeUndefined();
    expect(db.prepare("SELECT id FROM journey_entries WHERE type = 'skeleton'").get()).toBeUndefined();
    expect((db.prepare('SELECT source_trip_id FROM journey_entries WHERE id = ?').get(filledId) as { source_trip_id: number | null }).source_trip_id).toBeNull();
  });
});
