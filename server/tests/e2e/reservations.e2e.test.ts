/**
 * Reservations + accommodations module e2e — exercises both migrated mounts
 * through the real JwtAuthGuard against a temp SQLite db. The reservation/day/
 * budget services, the permission check, canAccessTrip and the WebSocket
 * broadcast are mocked.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { seedUser, sessionCookie } from './harness';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0);`);
  tmp.exec('CREATE TABLE trips (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT);');
  return { db: tmp };
});

const { canAccessTrip } = vi.hoisted(() => ({ canAccessTrip: vi.fn() }));
vi.mock('../../src/db/database', () => ({
  db, canAccessTrip, isOwner: vi.fn(() => true), getPlaceWithTags: vi.fn(), closeDb: () => {}, reinitialize: () => {},
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn() }));
vi.mock('../../src/services/notificationService', () => ({ send: vi.fn().mockResolvedValue(undefined) }));

const { checkPermission } = vi.hoisted(() => ({ checkPermission: vi.fn() }));
vi.mock('../../src/services/permissions', () => ({ checkPermission }));

const { resv, budget, day } = vi.hoisted(() => ({
  resv: {
    verifyTripAccess: vi.fn(), listReservations: vi.fn(), createReservation: vi.fn(), updatePositions: vi.fn(),
    getReservation: vi.fn(), updateReservation: vi.fn(), deleteReservation: vi.fn(), getUpcomingReservations: vi.fn(),
  },
  budget: { createBudgetItem: vi.fn(), updateBudgetItem: vi.fn(), deleteBudgetItem: vi.fn(), linkBudgetItemToReservation: vi.fn() },
  day: {
    listAccommodations: vi.fn(), validateAccommodationRefs: vi.fn(), createAccommodation: vi.fn(),
    getAccommodation: vi.fn(), updateAccommodation: vi.fn(), deleteAccommodation: vi.fn(),
  },
}));
vi.mock('../../src/services/reservationService', () => resv);
vi.mock('../../src/services/budgetService', () => budget);
vi.mock('../../src/services/dayService', () => day);

import { ReservationsModule } from '../../src/nest/reservations/reservations.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('Reservations + accommodations e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [ReservationsModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    seedUser(db as never, { id: 1 });
    app = await build();
    server = app.getHttpServer();
    resv.listReservations.mockReturnValue([{ id: 1, title: 'Hotel' }]);
    resv.createReservation.mockReturnValue({ reservation: { id: 9, title: 'Hotel' }, accommodationCreated: false });
    day.listAccommodations.mockReturnValue([{ id: 1 }]);
    day.validateAccommodationRefs.mockReturnValue([]);
    day.createAccommodation.mockReturnValue({ id: 9 });
    resv.getUpcomingReservations.mockReturnValue([{ id: 1, trip_id: 5, title: 'Flight' }]);
  });

  beforeEach(() => {
    resv.verifyTripAccess.mockReturnValue({ id: 5, user_id: 1 });
    canAccessTrip.mockReturnValue({ id: 5, user_id: 1 });
    checkPermission.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 without a cookie (reservations)', async () => {
    expect((await request(server).get('/api/trips/5/reservations')).status).toBe(401);
  });

  it('200 list reservations', async () => {
    const res = await request(server).get('/api/trips/5/reservations').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ reservations: [{ id: 1, title: 'Hotel' }] });
  });

  it('401 without a cookie (upcoming feed)', async () => {
    expect((await request(server).get('/api/reservations/upcoming')).status).toBe(401);
  });

  it('200 cross-trip upcoming reservations feed', async () => {
    const res = await request(server).get('/api/reservations/upcoming').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ reservations: [{ id: 1, trip_id: 5, title: 'Flight' }] });
  });

  it('404 when trip not accessible (reservations)', async () => {
    resv.verifyTripAccess.mockReturnValue(undefined);
    const res = await request(server).get('/api/trips/5/reservations').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
  });

  it('201 create reservation, 400 without title', async () => {
    const ok = await request(server).post('/api/trips/5/reservations').set('Cookie', sessionCookie(1)).send({ title: 'Hotel' });
    expect(ok.status).toBe(201);
    expect(ok.body).toEqual({ reservation: { id: 9, title: 'Hotel' } });
    const bad = await request(server).post('/api/trips/5/reservations').set('Cookie', sessionCookie(1)).send({});
    expect(bad.status).toBe(400);
    expect(bad.body).toEqual({ error: 'Title is required' });
  });

  it('200 list accommodations + 201 create', async () => {
    const list = await request(server).get('/api/trips/5/accommodations').set('Cookie', sessionCookie(1));
    expect(list.status).toBe(200);
    expect(list.body).toEqual({ accommodations: [{ id: 1 }] });
    const create = await request(server).post('/api/trips/5/accommodations').set('Cookie', sessionCookie(1)).send({ place_id: 2, start_day_id: 10, end_day_id: 11 });
    expect(create.status).toBe(201);
    expect(create.body).toEqual({ accommodation: { id: 9 } });
  });

  it('404 when trip not accessible (accommodations)', async () => {
    canAccessTrip.mockReturnValue(undefined);
    const res = await request(server).get('/api/trips/5/accommodations').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
  });

  it('400 accommodation create without refs', async () => {
    const res = await request(server).post('/api/trips/5/accommodations').set('Cookie', sessionCookie(1)).send({ place_id: 2 });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'place_id, start_day_id, and end_day_id are required' });
  });
});
