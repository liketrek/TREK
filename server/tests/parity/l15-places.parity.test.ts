/**
 * S8 parity — places (trip-scoped).
 *
 * Same request at the legacy Express /api/trips/:tripId/places route (mergeParams)
 * and the migrated Nest controller, with placeService, journeyService, the
 * permission check, canAccessTrip, the WebSocket broadcast and auth mocked
 * identically. Covers the JSON endpoints (the multer file imports are covered by
 * the controller unit test): trip 404, length 400, permission 403, name 400,
 * list-import error mapping, bulk-delete validation, and the create 201.
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
  canAccessTrip, isOwner: vi.fn(() => true), getPlaceWithTags: vi.fn(), closeDb: () => {}, reinitialize: () => {},
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
vi.mock('../../src/services/journeyService', () => ({ onPlaceCreated: vi.fn(), onPlaceUpdated: vi.fn(), onPlaceDeleted: vi.fn() }));

const { checkPermission } = vi.hoisted(() => ({ checkPermission: vi.fn() }));
vi.mock('../../src/services/permissions', () => ({ checkPermission }));

const { pl } = vi.hoisted(() => ({
  pl: {
    listPlaces: vi.fn(), createPlace: vi.fn(), getPlace: vi.fn(), updatePlace: vi.fn(), deletePlace: vi.fn(),
    deletePlacesMany: vi.fn(), importGpx: vi.fn(), importMapFile: vi.fn(), importGoogleList: vi.fn(),
    importNaverList: vi.fn(), searchPlaceImage: vi.fn(),
  },
}));
vi.mock('../../src/services/placeService', () => pl);

import placesRoutes from '../../src/routes/places';
import { PlacesModule } from '../../src/nest/places/places.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('S8 parity (Express vs Nest)', () => {
  let expressServer: express.Express;
  let nestServer: Server;
  let nestApp: Awaited<ReturnType<typeof buildNest>>;

  function buildExpress() {
    const app = express();
    app.use(express.json());
    app.use('/api/trips/:tripId/places', placesRoutes);
    return app;
  }

  async function buildNest() {
    const moduleRef = await Test.createTestingModule({ imports: [PlacesModule] }).compile();
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
    pl.listPlaces.mockReturnValue([{ id: 1, name: 'Spot' }]);
    pl.createPlace.mockReturnValue({ id: 9, name: 'Spot' });
    pl.getPlace.mockImplementation((_t: string, id: string) => (id === '9' ? { id: 9 } : undefined));
    pl.updatePlace.mockImplementation((_t: string, id: string) => (id === '9' ? { id: 9 } : null));
    pl.deletePlace.mockImplementation((_t: string, id: string) => id === '9');
    pl.deletePlacesMany.mockReturnValue([1, 2]);
    pl.importGoogleList.mockResolvedValue({ places: [{ id: 1 }], listName: 'L', skipped: 0 });
    pl.importNaverList.mockResolvedValue({ error: 'List is empty', status: 400 });
    pl.searchPlaceImage.mockResolvedValue({ photos: [{ url: 'x' }] });
  });

  beforeEach(() => {
    canAccessTrip.mockReturnValue(trip);
    checkPermission.mockReturnValue(true);
  });

  afterAll(async () => {
    await nestApp.close();
  });

  it('GET / list', () => expectParity(expressServer, nestServer, { path: '/api/trips/5/places', query: { search: 'sp' } }));
  it('GET / 404 trip', () => {
    canAccessTrip.mockReturnValue(undefined);
    return expectParity(expressServer, nestServer, { path: '/api/trips/5/places' });
  });
  it('POST / create (201)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/places', body: { name: 'Spot' } }));
  it('POST / 400 over-long name', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/places', body: { name: 'x'.repeat(201) } }));
  it('POST / 403', () => {
    checkPermission.mockReturnValue(false);
    return expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/places', body: { name: 'Spot' } });
  });
  it('POST / 400 missing name', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/places', body: {} }));
  it('POST /import/google-list success (201)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/places/import/google-list', body: { url: 'http://x' } }));
  it('POST /import/google-list 400 missing url', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/places/import/google-list', body: {} }));
  it('POST /import/naver-list service error', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/places/import/naver-list', body: { url: 'http://x' } }));
  it('POST /bulk-delete 400 not numbers', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/places/bulk-delete', body: { ids: ['a'] } }));
  it('POST /bulk-delete empty', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/places/bulk-delete', body: { ids: [] } }));
  it('POST /bulk-delete success', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/places/bulk-delete', body: { ids: [1, 2] } }));
  it('GET /:id 404', () =>
    expectParity(expressServer, nestServer, { path: '/api/trips/5/places/77' }));
  it('GET /:id found', () =>
    expectParity(expressServer, nestServer, { path: '/api/trips/5/places/9' }));
  it('GET /:id/image', () =>
    expectParity(expressServer, nestServer, { path: '/api/trips/5/places/9/image' }));
  it('PUT /:id 404', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/trips/5/places/77', body: { name: 'X' } }));
  it('DELETE /:id success', () =>
    expectParity(expressServer, nestServer, { method: 'delete', path: '/api/trips/5/places/9' }));
});
