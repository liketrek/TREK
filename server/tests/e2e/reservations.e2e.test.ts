/**
 * Reservations + accommodations module e2e — exercises both migrated mounts
 * through the real JwtAuthGuard against a temp SQLite db. Reservation SQL runs
 * for real (ReservationsService is DI-native, no mock — the temp db carries the
 * full schema via createTables + runMigrations), and so does the accommodation
 * SQL (the injected DaysService is DI-native too); the budget service, the
 * permission check and the WebSocket broadcast stay mocked.
 */
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { ReservationsModule } from '../../src/nest/reservations/reservations.module';
// Accommodations left reservations/ for a domain of their own; this container has
// to assemble both or the /accommodations cases below 404 while production serves them.
import { AccommodationsModule } from '../../src/nest/accommodations/accommodations.module';
import { sessionCookie } from './harness';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
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
const { notificationSend } = vi.hoisted(() => ({ notificationSend: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../../src/nest/notifications/notifications.bridge', () => ({ send: notificationSend }));

import { PermissionsService } from '../../src/nest/permissions/permissions.service';

// Since the permissions DI migration, the check is a spy on the container's
// PermissionsService singleton (created in beforeAll, after build()).
let checkPermission: MockInstance;

// The budget-sync seam runs the real injected BudgetService (BudgetModule is
// imported by ReservationsModule since the budget fold) over the same temp db.

import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';

describe('Reservations + accommodations e2e (real auth guard + temp SQLite, real reservation SQL)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let tripId: number;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule, RealtimeModule, ReservationsModule, AccommodationsModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    nest.useGlobalPipes(new ZodValidationPipe());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    createTables(db);
    runMigrations(db);
    // The temp db carries the real schema (password_hash NOT NULL), so seed the
    // auth user directly instead of via the trimmed-DDL seedUser helper.
    db.prepare(
      "INSERT INTO users (id, username, email, password_hash, role, password_version) VALUES (1, 'e2e-user', 'e2e@example.test', 'x', 'user', 0)",
    ).run();
    tripId = Number(db.prepare("INSERT INTO trips (user_id, title) VALUES (1, 'E2E Trip')").run().lastInsertRowid);
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    server = app.getHttpServer();
  });

  beforeEach(() => {
    canAccessTrip.mockImplementation((id: unknown) => db.prepare('SELECT * FROM trips WHERE id = ?').get(id));
    checkPermission.mockReturnValue(true);
    notificationSend.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 without a cookie (reservations)', async () => {
    expect((await request(server).get(`/api/trips/${tripId}/reservations`)).status).toBe(401);
  });

  it('200 list reservations (real SQL, joins attached)', async () => {
    const rid = db.prepare("INSERT INTO reservations (trip_id, title, type) VALUES (?, 'Hotel', 'hotel')").run(tripId).lastInsertRowid;
    const res = await request(server).get(`/api/trips/${tripId}/reservations`).set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    const row = res.body.reservations.find((r: { id: number }) => r.id === Number(rid));
    expect(row).toMatchObject({ title: 'Hotel', type: 'hotel', endpoints: [], travelers: [] });
  });

  it('401 without a cookie (upcoming feed)', async () => {
    expect((await request(server).get('/api/reservations/upcoming')).status).toBe(401);
  });

  it('200 cross-trip upcoming reservations feed', async () => {
    db.prepare("INSERT INTO reservations (trip_id, title, type, reservation_time) VALUES (?, 'Flight', 'flight', '2999-01-01T10:00:00')").run(tripId);
    const res = await request(server).get('/api/reservations/upcoming').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.reservations.map((r: { title: string }) => r.title)).toContain('Flight');
  });

  it('404 when trip not accessible (reservations)', async () => {
    canAccessTrip.mockReturnValue(undefined);
    const res = await request(server).get(`/api/trips/${tripId}/reservations`).set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
  });

  it('201 create reservation (real insert + booking notification), 400 without title', async () => {
    const ok = await request(server)
      .post(`/api/trips/${tripId}/reservations`)
      .set('Cookie', sessionCookie(1))
      .send({ title: 'Hotel' });
    expect(ok.status).toBe(201);
    expect(ok.body.reservation).toMatchObject({ title: 'Hotel', type: 'other', status: 'pending' });
    expect(db.prepare('SELECT title FROM reservations WHERE id = ?').get(ok.body.reservation.id)).toEqual({ title: 'Hotel' });
    // The fire-and-forget booking notification reaches the (mocked) notification service.
    await vi.waitFor(() => expect(notificationSend).toHaveBeenCalled());
    expect(notificationSend).toHaveBeenCalledWith(expect.objectContaining({ event: 'booking_change', actorId: 1 }));

    const bad = await request(server).post(`/api/trips/${tripId}/reservations`).set('Cookie', sessionCookie(1)).send({});
    expect(bad.status).toBe(400);
    expect(bad.body.error).toContain('title');
  });

  it('200 list accommodations + 201 create (real insert + auto hotel reservation), 404 on bad refs', async () => {
    const placeId = Number(db.prepare('INSERT INTO places (trip_id, name) VALUES (?, ?)').run(tripId, 'Grand Hotel').lastInsertRowid);
    const dayId = Number(db.prepare('INSERT INTO days (trip_id, day_number, date) VALUES (?, 1, ?)').run(tripId, '2026-03-01').lastInsertRowid);
    const create = await request(server)
      .post(`/api/trips/${tripId}/accommodations`)
      .set('Cookie', sessionCookie(1))
      .send({ place_id: placeId, start_day_id: dayId, end_day_id: dayId, check_in: '15:00' });
    expect(create.status).toBe(201);
    expect(create.body.accommodation).toMatchObject({ place_id: placeId, start_day_id: dayId, end_day_id: dayId, place_name: 'Grand Hotel' });
    // The partner hotel reservation is auto-created by the real DaysService SQL.
    const linked = db.prepare('SELECT * FROM reservations WHERE accommodation_id = ?').get(create.body.accommodation.id) as { type: string; status: string };
    expect(linked).toMatchObject({ type: 'hotel', status: 'confirmed' });
    const list = await request(server).get(`/api/trips/${tripId}/accommodations`).set('Cookie', sessionCookie(1));
    expect(list.status).toBe(200);
    expect(list.body.accommodations).toHaveLength(1);
    expect(list.body.accommodations[0]).toMatchObject({ id: create.body.accommodation.id, place_name: 'Grand Hotel' });
    const badRefs = await request(server)
      .post(`/api/trips/${tripId}/accommodations`)
      .set('Cookie', sessionCookie(1))
      .send({ place_id: 99999, start_day_id: dayId, end_day_id: dayId });
    expect(badRefs.status).toBe(404);
    expect(badRefs.body).toEqual({ error: 'Place not found' });
  });

  it('404 when trip not accessible (accommodations)', async () => {
    canAccessTrip.mockReturnValue(undefined);
    const res = await request(server).get(`/api/trips/${tripId}/accommodations`).set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
  });

  it('400 accommodation create without refs', async () => {
    const res = await request(server)
      .post(`/api/trips/${tripId}/accommodations`)
      .set('Cookie', sessionCookie(1))
      .send({ place_id: 2 });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'place_id, start_day_id, and end_day_id are required' });
  });
});
