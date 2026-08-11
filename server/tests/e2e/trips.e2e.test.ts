/**
 * Trips module e2e — exercises the migrated /api/trips aggregate-root endpoints
 * through the real JwtAuthGuard against a temp SQLite db. tripService, the bundle
 * list-services, auditLog, demo, the permission check, canAccessTrip and the
 * WebSocket broadcast are mocked.
 */
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { TripsModule } from '../../src/nest/trips/trips.module';
import { seedUser, sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

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
  db,
  canAccessTrip,
  isOwner: vi.fn(() => true),
  getPlaceWithTags: vi.fn(),
  closeDb: () => {},
  reinitialize: () => {},
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn() }));
vi.mock('../../src/services/notificationService', () => ({ send: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../../src/services/auditLog', () => ({
  writeAudit: vi.fn(),
  getClientIp: vi.fn(() => '1.2.3.4'),
  logInfo: vi.fn(),
}));
vi.mock('../../src/services/demo', () => ({ isDemoEmail: vi.fn(() => false) }));

const { checkPermission } = vi.hoisted(() => ({ checkPermission: vi.fn() }));
vi.mock('../../src/services/permissions', () => ({ checkPermission }));

const { tripSvc } = vi.hoisted(() => ({
  tripSvc: {
    listTrips: vi.fn(),
    createTrip: vi.fn(),
    getTrip: vi.fn(),
    updateTrip: vi.fn(),
    deleteTrip: vi.fn(),
    getTripRaw: vi.fn(),
    getTripOwner: vi.fn(),
    deleteOldCover: vi.fn(),
    updateCoverImage: vi.fn(),
    listMembers: vi.fn(),
    addMember: vi.fn(),
    removeMember: vi.fn(),
    exportICS: vi.fn(),
    copyTripById: vi.fn(),
    listGuestIdentityTransferCandidates: vi.fn(),
    runNewMemberIdentityCheck: vi.fn(),
    completeNewMemberIdentityCheck: vi.fn(),
    transferGuestIdentity: vi.fn(),
    verifyTripAccess: vi.fn(),
    NotFoundError: class NotFoundError extends Error {},
    ValidationError: class ValidationError extends Error {},
    GuestIdentityTransferError: class GuestIdentityTransferError extends Error {
      constructor(
        public code: string,
        public conflicts: unknown[] = [],
      ) {
        super(code);
      }
    },
    TRIP_SELECT: 'SELECT',
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
    tripSvc.runNewMemberIdentityCheck.mockReturnValue({ required: true, candidates: [{ guest_user_id: 7 }] });
    tripSvc.listGuestIdentityTransferCandidates.mockReturnValue([{ guest_user_id: 7 }]);
    tripSvc.transferGuestIdentity.mockReturnValue({ transferred_guest_user_id: 7 });
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

  it('exposes identity-check, decline, candidate, and session-bound transfer endpoints', async () => {
    const check = await request(server).post('/api/trips/9/new-member-identity-check').set('Cookie', sessionCookie(1));
    expect(check.status).toBe(201);
    expect(check.body).toEqual({ required: true, candidates: [{ guest_user_id: 7 }] });
    expect(tripSvc.runNewMemberIdentityCheck).toHaveBeenCalledWith('9', 1);

    const declined = await request(server)
      .post('/api/trips/9/new-member-identity-check/decline')
      .set('Cookie', sessionCookie(1));
    expect(declined.status).toBe(201);
    expect(tripSvc.completeNewMemberIdentityCheck).toHaveBeenCalledWith('9', 1);

    const candidates = await request(server)
      .get('/api/trips/9/guest-identity-transfers/candidates')
      .set('Cookie', sessionCookie(1));
    expect(candidates.status).toBe(200);
    expect(candidates.body).toEqual({ candidates: [{ guest_user_id: 7 }] });
    expect(tripSvc.listGuestIdentityTransferCandidates).toHaveBeenCalledWith('9', 1);

    const claim = await request(server)
      .post('/api/trips/9/guests/7/identity-transfer')
      .set('Cookie', sessionCookie(1))
      .send({ targetUserId: 999 });
    expect(claim.status).toBe(201);
    expect(claim.body).toEqual({ transferred_guest_user_id: 7 });
    expect(tripSvc.transferGuestIdentity).toHaveBeenCalledWith('9', 7, 1);
  });

  it('returns stable guest-identity-transfer conflict details', async () => {
    tripSvc.transferGuestIdentity.mockImplementationOnce(() => {
      throw new tripSvc.GuestIdentityTransferError('GUEST_IDENTITY_TRANSFER_CONFLICT', [
        { type: 'expense_share_overlap', record_id: 44 },
      ]);
    });
    const response = await request(server)
      .post('/api/trips/9/guests/7/identity-transfer')
      .set('Cookie', sessionCookie(1));
    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      code: 'GUEST_IDENTITY_TRANSFER_CONFLICT',
      conflicts: [{ type: 'expense_share_overlap', record_id: 44 }],
    });
  });
});
