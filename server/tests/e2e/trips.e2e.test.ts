/**
 * Trips module e2e — exercises the migrated /api/trips aggregate-root endpoints
 * through the real JwtAuthGuard against a temp SQLite db. tripService, the bundle
 * list-services, auditLog, demo, the permission check, canAccessTrip and the
 * WebSocket broadcast are mocked.
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
vi.mock('../../src/services/auditLog', () => ({ writeAudit: vi.fn(), getClientIp: vi.fn(() => '1.2.3.4'), logInfo: vi.fn() }));
vi.mock('../../src/services/demo', () => ({ isDemoEmail: vi.fn(() => false) }));

const { checkPermission } = vi.hoisted(() => ({ checkPermission: vi.fn() }));
vi.mock('../../src/services/permissions', () => ({ checkPermission }));

const { tripSvc } = vi.hoisted(() => ({
  tripSvc: {
    listTrips: vi.fn(), createTrip: vi.fn(), getTrip: vi.fn(), updateTrip: vi.fn(), deleteTrip: vi.fn(),
    getTripRaw: vi.fn(), getTripOwner: vi.fn(), deleteOldCover: vi.fn(), updateCoverImage: vi.fn(),
    listMembers: vi.fn(), addMember: vi.fn(), removeMember: vi.fn(), exportICS: vi.fn(), copyTripById: vi.fn(),
    verifyTripAccess: vi.fn(), NotFoundError: class NotFoundError extends Error {}, ValidationError: class ValidationError extends Error {}, TRIP_SELECT: 'SELECT',
  },
}));
vi.mock('../../src/services/tripService', () => tripSvc);
vi.mock('../../src/services/dayService', () => ({ listDays: () => ({ days: [] }), listAccommodations: () => [] }));
vi.mock('../../src/services/placeService', () => ({ listPlaces: () => [] }));
vi.mock('../../src/services/packingService', () => ({ listItems: () => [] }));
vi.mock('../../src/services/todoService', () => ({ listItems: () => [] }));
vi.mock('../../src/services/budgetService', () => ({ listBudgetItems: () => [] }));
vi.mock('../../src/services/reservationService', () => ({ listReservations: () => [] }));
vi.mock('../../src/services/fileService', () => ({ listFiles: () => [] }));

import { TripsModule } from '../../src/nest/trips/trips.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('Trips e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [TripsModule] }).compile();
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
    tripSvc.listTrips.mockReturnValue([{ id: 1, title: 'T' }]);
    tripSvc.createTrip.mockReturnValue({ trip: { id: 9 }, tripId: 9, reminderDays: 0 });
    tripSvc.getTrip.mockImplementation((id: string) => (id === '9' ? { id: 9, user_id: 1 } : undefined));
    tripSvc.listMembers.mockReturnValue({ owner: { id: 1 }, members: [] });
  });

  beforeEach(() => {
    canAccessTrip.mockReturnValue({ user_id: 1 });
    checkPermission.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 without a cookie', async () => {
    expect((await request(server).get('/api/trips')).status).toBe(401);
  });

  it('200 list', async () => {
    const res = await request(server).get('/api/trips').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ trips: [{ id: 1, title: 'T' }] });
  });

  it('201 create, 403 without permission', async () => {
    const ok = await request(server).post('/api/trips').set('Cookie', sessionCookie(1)).send({ title: 'T' });
    expect(ok.status).toBe(201);
    expect(ok.body).toEqual({ trip: { id: 9 } });
    checkPermission.mockReturnValue(false);
    const forbidden = await request(server).post('/api/trips').set('Cookie', sessionCookie(1)).send({ title: 'T' });
    expect(forbidden.status).toBe(403);
  });

  it('404 on a missing trip', async () => {
    const res = await request(server).get('/api/trips/77').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
  });

  it('200 bundle for an accessible trip', async () => {
    const res = await request(server).get('/api/trips/9/bundle').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ trip: { id: 9 }, days: [], members: [{ id: 1 }] });
  });
});
