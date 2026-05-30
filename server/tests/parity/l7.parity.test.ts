/**
 * L7 parity — atlas addon.
 *
 * Fires the same request at the legacy Express /api/addons/atlas route and the
 * migrated Nest controller with atlasService mocked identically for both,
 * asserting client-identical status + body. (Cache-Control headers are asserted
 * in the controller unit test; expectParity compares status + body.) Auth is
 * neutralised identically; the 401 path is covered by the e2e test.
 */
import { describe, it, beforeAll, afterAll, vi } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { expectParity } from './parity';

const { fixedUser } = vi.hoisted(() => ({
  fixedUser: { id: 1, username: 'u', email: 'u@example.test', role: 'user' },
}));

vi.mock('../../src/db/database', () => ({
  db: { prepare: () => ({ get: () => undefined, all: () => [], run: () => undefined }) },
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

const { mocks } = vi.hoisted(() => ({
  mocks: {
    getStats: vi.fn(),
    getCountryPlaces: vi.fn(),
    markCountryVisited: vi.fn(),
    unmarkCountryVisited: vi.fn(),
    markRegionVisited: vi.fn(),
    unmarkRegionVisited: vi.fn(),
    getVisitedRegions: vi.fn(),
    getRegionGeo: vi.fn(),
    listBucketList: vi.fn(),
    createBucketItem: vi.fn(),
    updateBucketItem: vi.fn(),
    deleteBucketItem: vi.fn(),
  },
}));
vi.mock('../../src/services/atlasService', () => mocks);

import atlasRoutes from '../../src/routes/atlas';
import { AtlasModule } from '../../src/nest/atlas/atlas.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('L7 parity (Express vs Nest)', () => {
  let expressServer: express.Express;
  let nestServer: Server;
  let nestApp: Awaited<ReturnType<typeof buildNest>>;

  function buildExpress() {
    const app = express();
    app.use(express.json());
    app.use('/api/addons/atlas', atlasRoutes);
    return app;
  }

  async function buildNest() {
    const moduleRef = await Test.createTestingModule({ imports: [AtlasModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    expressServer = buildExpress();
    nestApp = await buildNest();
    nestServer = nestApp.getHttpServer();
    mocks.getStats.mockResolvedValue({ countries: 3, cities: 10, continents: 2 });
    mocks.getVisitedRegions.mockResolvedValue({ regions: {} });
    mocks.getRegionGeo.mockResolvedValue({ type: 'FeatureCollection', features: [{ id: 1 }] });
    mocks.getCountryPlaces.mockReturnValue({ places: [] });
    mocks.listBucketList.mockReturnValue([{ id: 1, name: 'Tokyo' }]);
    mocks.createBucketItem.mockReturnValue({ id: 2, name: 'Kyoto' });
    mocks.updateBucketItem.mockImplementation((_u: number, id: string | number) => (String(id) === '1' ? { id: 1, name: 'Edited' } : null));
    mocks.deleteBucketItem.mockImplementation((_u: number, id: string | number) => String(id) === '1');
  });

  afterAll(async () => {
    await nestApp.close();
  });

  it('GET /stats', () => expectParity(expressServer, nestServer, { path: '/api/addons/atlas/stats' }));
  it('GET /regions', () => expectParity(expressServer, nestServer, { path: '/api/addons/atlas/regions' }));
  it('GET /regions/geo empty', () => expectParity(expressServer, nestServer, { path: '/api/addons/atlas/regions/geo' }));
  it('GET /regions/geo non-empty', () =>
    expectParity(expressServer, nestServer, { path: '/api/addons/atlas/regions/geo', query: { countries: 'DE,FR' } }));
  it('GET /country/:code', () => expectParity(expressServer, nestServer, { path: '/api/addons/atlas/country/de' }));
  it('POST /country/:code/mark (200)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/addons/atlas/country/de/mark' }));
  it('DELETE /country/:code/mark', () =>
    expectParity(expressServer, nestServer, { method: 'delete', path: '/api/addons/atlas/country/de/mark' }));
  it('POST /region/:code/mark (200)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/addons/atlas/region/by/mark', body: { name: 'Bavaria', country_code: 'de' } }));
  it('POST /region/:code/mark missing fields (400)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/addons/atlas/region/by/mark', body: { name: 'Bavaria' } }));
  it('DELETE /region/:code/mark', () =>
    expectParity(expressServer, nestServer, { method: 'delete', path: '/api/addons/atlas/region/by/mark' }));
  it('GET /bucket-list', () => expectParity(expressServer, nestServer, { path: '/api/addons/atlas/bucket-list' }));
  it('POST /bucket-list create (201)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/addons/atlas/bucket-list', body: { name: 'Kyoto' } }));
  it('POST /bucket-list blank name (400)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/addons/atlas/bucket-list', body: { name: '  ' } }));
  it('PUT /bucket-list/:id found (200)', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/addons/atlas/bucket-list/1', body: { name: 'Edited' } }));
  it('PUT /bucket-list/:id not found (404)', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/addons/atlas/bucket-list/9', body: { name: 'X' } }));
  it('DELETE /bucket-list/:id found (200)', () =>
    expectParity(expressServer, nestServer, { method: 'delete', path: '/api/addons/atlas/bucket-list/1' }));
  it('DELETE /bucket-list/:id not found (404)', () =>
    expectParity(expressServer, nestServer, { method: 'delete', path: '/api/addons/atlas/bucket-list/9' }));
});
