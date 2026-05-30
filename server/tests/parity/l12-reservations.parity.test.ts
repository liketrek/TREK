/**
 * S5 parity — reservations + accommodations (trip-scoped).
 *
 * Fires the same request at the legacy Express routes (reservations route +
 * accommodations sub-router from routes/days.ts, both mounted with mergeParams)
 * and the migrated Nest controllers, with the reservation/day/budget services,
 * the permission check, canAccessTrip, the WebSocket broadcast and auth all
 * mocked identically. Asserts client-identical status + body across the trip
 * 404, permission 403, validation 400/404 and the create 201.
 */
import { describe, it, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { expectParity } from './parity';

const { fixedUser, trip } = vi.hoisted(() => ({
  fixedUser: { id: 1, username: 'u', email: 'u@example.test', role: 'user' },
  trip: { id: 5, user_id: 1 },
}));

const { canAccessTrip } = vi.hoisted(() => ({ canAccessTrip: vi.fn() }));
vi.mock('../../src/db/database', () => ({
  db: { prepare: () => ({ get: () => undefined, all: () => [], run: () => undefined }) },
  canAccessTrip,
  isOwner: vi.fn(() => true),
  getPlaceWithTags: vi.fn(),
  closeDb: () => {},
  reinitialize: () => {},
}));

vi.mock('../../src/middleware/auth', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { user: unknown }).user = fixedUser;
    next();
  },
  extractToken: () => 'token',
  verifyJwtAndLoadUser: () => fixedUser,
}));

vi.mock('../../src/websocket', () => ({ broadcast: vi.fn() }));

const { checkPermission } = vi.hoisted(() => ({ checkPermission: vi.fn() }));
vi.mock('../../src/services/permissions', () => ({ checkPermission }));

const { resv, budget, day } = vi.hoisted(() => ({
  resv: {
    verifyTripAccess: vi.fn(), listReservations: vi.fn(), createReservation: vi.fn(), updatePositions: vi.fn(),
    getReservation: vi.fn(), updateReservation: vi.fn(), deleteReservation: vi.fn(),
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

import reservationsRoutes from '../../src/routes/reservations';
import { accommodationsRouter } from '../../src/routes/days';
import { ReservationsModule } from '../../src/nest/reservations/reservations.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('S5 parity (Express vs Nest)', () => {
  let expressServer: express.Express;
  let nestServer: Server;
  let nestApp: Awaited<ReturnType<typeof buildNest>>;

  function buildExpress() {
    const app = express();
    app.use(express.json());
    app.use('/api/trips/:tripId/reservations', reservationsRoutes);
    app.use('/api/trips/:tripId/accommodations', accommodationsRouter);
    return app;
  }

  async function buildNest() {
    const moduleRef = await Test.createTestingModule({ imports: [ReservationsModule] }).compile();
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
    resv.listReservations.mockReturnValue([{ id: 1, title: 'Hotel' }]);
    resv.createReservation.mockReturnValue({ reservation: { id: 9, title: 'Hotel' }, accommodationCreated: false });
    resv.getReservation.mockImplementation((id: string) => (id === '9' ? { title: 'Hotel', type: 'lodging' } : undefined));
    resv.updateReservation.mockReturnValue({ reservation: { id: 9 }, accommodationChanged: false });
    resv.deleteReservation.mockReturnValue({ deleted: { id: 9, title: 'Hotel', type: 'lodging', accommodation_id: null }, accommodationDeleted: false, deletedBudgetItemId: null });
    day.listAccommodations.mockReturnValue([{ id: 1 }]);
    day.validateAccommodationRefs.mockReturnValue([]);
    day.createAccommodation.mockReturnValue({ id: 9 });
    day.getAccommodation.mockImplementation((id: string) => (id === '9' ? { id: 9 } : undefined));
    day.updateAccommodation.mockReturnValue({ id: 9 });
    day.deleteAccommodation.mockReturnValue({ linkedReservationId: null, deletedBudgetItemId: null });
  });

  beforeEach(() => {
    resv.verifyTripAccess.mockReturnValue(trip);
    canAccessTrip.mockReturnValue(trip);
    checkPermission.mockReturnValue(true);
  });

  afterAll(async () => {
    await nestApp.close();
  });

  // Reservations
  it('GET /reservations', () => expectParity(expressServer, nestServer, { path: '/api/trips/5/reservations' }));
  it('GET /reservations 404 trip', () => {
    resv.verifyTripAccess.mockReturnValue(undefined);
    return expectParity(expressServer, nestServer, { path: '/api/trips/5/reservations' });
  });
  it('POST /reservations create (201)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/reservations', body: { title: 'Hotel' } }));
  it('POST /reservations 403', () => {
    checkPermission.mockReturnValue(false);
    return expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/reservations', body: { title: 'Hotel' } });
  });
  it('POST /reservations 400 missing title', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/reservations', body: {} }));
  it('PUT /reservations/positions 400 not array', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/trips/5/reservations/positions', body: { positions: 'no' } }));
  it('PUT /reservations/:id 404 missing', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/trips/5/reservations/77', body: { title: 'X' } }));
  it('DELETE /reservations/:id success', () =>
    expectParity(expressServer, nestServer, { method: 'delete', path: '/api/trips/5/reservations/9' }));

  // Accommodations
  it('GET /accommodations', () => expectParity(expressServer, nestServer, { path: '/api/trips/5/accommodations' }));
  it('GET /accommodations 404 trip', () => {
    canAccessTrip.mockReturnValue(undefined);
    return expectParity(expressServer, nestServer, { path: '/api/trips/5/accommodations' });
  });
  it('POST /accommodations create (201)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/accommodations', body: { place_id: 2, start_day_id: 10, end_day_id: 11 } }));
  it('POST /accommodations 400 missing refs', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/accommodations', body: { place_id: 2 } }));
  it('POST /accommodations 404 bad ref', () => {
    day.validateAccommodationRefs.mockReturnValue([{ field: 'place_id', message: 'Place not found' }]);
    return expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/accommodations', body: { place_id: 2, start_day_id: 10, end_day_id: 11 } });
  });
  it('PUT /accommodations/:id 404 missing', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/trips/5/accommodations/77', body: {} }));
  it('DELETE /accommodations/:id success', () =>
    expectParity(expressServer, nestServer, { method: 'delete', path: '/api/trips/5/accommodations/9' }));
});
