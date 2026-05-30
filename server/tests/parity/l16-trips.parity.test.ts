/**
 * C1 parity — trips aggregate root.
 *
 * Same request at the legacy Express /api/trips route and the migrated Nest
 * controller, with tripService, the bundle list-services, auditLog, demo,
 * the permission check, the WebSocket broadcast and auth mocked identically.
 * Covers the own-routes (list/create/get/update/delete/members/copy/bundle);
 * the exact-prefix routing (not capturing collab/files) is unit-tested in the
 * strangler spec.
 */
import { describe, it, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { expectParity } from './parity';

const { fixedUser } = vi.hoisted(() => ({ fixedUser: { id: 1, username: 'u', email: 'u@example.test', role: 'user' } }));

const { canAccessTrip } = vi.hoisted(() => ({ canAccessTrip: vi.fn() }));
vi.mock('../../src/db/database', () => ({
  db: { prepare: () => ({ get: () => ({ id: 42 }), all: () => [], run: () => undefined }) },
  canAccessTrip, isOwner: vi.fn(() => true), getPlaceWithTags: vi.fn(), closeDb: () => {}, reinitialize: () => {},
}));

vi.mock('../../src/middleware/auth', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { user: unknown }).user = fixedUser;
    next();
  },
  demoUploadBlock: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  extractToken: () => 'token',
  verifyJwtAndLoadUser: () => fixedUser,
}));

vi.mock('../../src/websocket', () => ({ broadcast: vi.fn() }));
vi.mock('../../src/services/auditLog', () => ({ writeAudit: vi.fn(), getClientIp: vi.fn(() => '1.2.3.4'), logInfo: vi.fn() }));
vi.mock('../../src/services/demo', () => ({ isDemoEmail: vi.fn(() => false) }));

const { checkPermission } = vi.hoisted(() => ({ checkPermission: vi.fn() }));
vi.mock('../../src/services/permissions', () => ({ checkPermission }));

const { tripSvc } = vi.hoisted(() => ({
  tripSvc: {
    listTrips: vi.fn(), createTrip: vi.fn(), getTrip: vi.fn(), updateTrip: vi.fn(), deleteTrip: vi.fn(),
    getTripRaw: vi.fn(), getTripOwner: vi.fn(), deleteOldCover: vi.fn(), updateCoverImage: vi.fn(),
    listMembers: vi.fn(), addMember: vi.fn(), removeMember: vi.fn(), exportICS: vi.fn(), copyTripById: vi.fn(),
    verifyTripAccess: vi.fn(), NotFoundError: class NotFoundError extends Error {}, ValidationError: class ValidationError extends Error {},
    TRIP_SELECT: 'SELECT * FROM trips t',
  },
}));
vi.mock('../../src/services/tripService', () => tripSvc);
// Bundle list-services — return empty collections.
vi.mock('../../src/services/dayService', () => ({ listDays: () => ({ days: [] }), listAccommodations: () => [] }));
vi.mock('../../src/services/placeService', () => ({ listPlaces: () => [] }));
vi.mock('../../src/services/packingService', () => ({ listItems: () => [] }));
vi.mock('../../src/services/todoService', () => ({ listItems: () => [] }));
vi.mock('../../src/services/budgetService', () => ({ listBudgetItems: () => [] }));
vi.mock('../../src/services/reservationService', () => ({ listReservations: () => [] }));
vi.mock('../../src/services/fileService', () => ({ listFiles: () => [] }));

import tripsRoutes from '../../src/routes/trips';
import { TripsModule } from '../../src/nest/trips/trips.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('C1 parity (Express vs Nest)', () => {
  let expressServer: express.Express;
  let nestServer: Server;
  let nestApp: Awaited<ReturnType<typeof buildNest>>;

  function buildExpress() {
    const app = express();
    app.use(express.json());
    app.use('/api/trips', tripsRoutes);
    return app;
  }

  async function buildNest() {
    const moduleRef = await Test.createTestingModule({ imports: [TripsModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expressServer = buildExpress();
    nestApp = await buildNest();
    nestServer = nestApp.getHttpServer();
    tripSvc.listTrips.mockReturnValue([{ id: 1, title: 'T' }]);
    tripSvc.createTrip.mockReturnValue({ trip: { id: 9 }, tripId: 9, reminderDays: 0 });
    tripSvc.getTrip.mockImplementation((id: string) => (id === '9' ? { id: 9, user_id: 1 } : undefined));
    tripSvc.updateTrip.mockReturnValue({ updatedTrip: { id: 9 }, changes: {}, newTitle: 'T', newReminder: 0, oldReminder: 0 });
    tripSvc.getTripOwner.mockReturnValue({ user_id: 1 });
    tripSvc.deleteTrip.mockReturnValue({ tripId: 9, title: 'T', isAdminDelete: false });
    tripSvc.listMembers.mockReturnValue({ owner: { id: 1 }, members: [] });
    tripSvc.copyTripById.mockReturnValue(42);
  });

  beforeEach(() => {
    canAccessTrip.mockReturnValue({ user_id: 1 });
    checkPermission.mockReturnValue(true);
  });

  afterAll(async () => {
    await nestApp.close();
  });

  it('GET /', () => expectParity(expressServer, nestServer, { path: '/api/trips' }));
  it('POST / create (201)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips', body: { title: 'T' } }));
  it('POST / 403', () => {
    checkPermission.mockReturnValue(false);
    return expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips', body: { title: 'T' } });
  });
  it('POST / 400 missing title', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips', body: {} }));
  it('POST / 400 end before start', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips', body: { title: 'T', start_date: '2026-07-10', end_date: '2026-07-01' } }));
  it('GET /:id found', () => expectParity(expressServer, nestServer, { path: '/api/trips/9' }));
  it('GET /:id 404', () => {
    tripSvc.getTrip.mockReturnValueOnce(undefined).mockReturnValueOnce(undefined);
    return expectParity(expressServer, nestServer, { path: '/api/trips/77' });
  });
  it('PUT /:id', () => expectParity(expressServer, nestServer, { method: 'put', path: '/api/trips/9', body: { title: 'b' } }));
  it('PUT /:id 404 no access', () => {
    canAccessTrip.mockReturnValue(undefined);
    return expectParity(expressServer, nestServer, { method: 'put', path: '/api/trips/9', body: { title: 'b' } });
  });
  it('POST /:id/copy (201)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/9/copy', body: { title: 'Copy' } }));
  it('DELETE /:id', () => expectParity(expressServer, nestServer, { method: 'delete', path: '/api/trips/9' }));
  it('GET /:id/members', () => expectParity(expressServer, nestServer, { path: '/api/trips/9/members' }));
  it('POST /:id/members (201)', () => {
    tripSvc.addMember.mockReturnValue({ member: { id: 2, email: 'b@x.y' }, targetUserId: 2, tripTitle: 'T' });
    return expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/9/members', body: { identifier: 'b@x.y' } });
  });
  it('GET /:id/bundle', () => expectParity(expressServer, nestServer, { path: '/api/trips/9/bundle' }));
});
