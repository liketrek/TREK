/**
 * L2 parity — airports + public config + system notices.
 *
 * Fires the same request at the legacy Express routes and the migrated Nest
 * controllers with the shared services mocked identically for both, then asserts
 * the responses are client-identical (status + body). This is the gate before
 * the prefixes are flipped to Nest: any difference here is a framework-layer
 * regression (routing, error envelope, status), which a migration must not cause.
 *
 * Auth is neutralised the same way for both apps — `verifyJwtAndLoadUser` /
 * `extractToken` are stubbed so the real Nest guard and the Express middleware
 * both authenticate the same fixed user. Auth behaviour itself is covered by the
 * per-module e2e tests.
 */
import { describe, it, beforeAll, afterAll, vi } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { expectParity } from './parity';

const { fixedUser } = vi.hoisted(() => ({
  fixedUser: { id: 1, username: 'parity', email: 'parity@example.test', role: 'user' },
}));

// The services under test are mocked below, so no real DB is needed. Stubbing
// the connection keeps the legacy database.ts init (and its lazy backfill
// require) out of the parity run, which otherwise clashes with the mocked
// airportService module.
vi.mock('../../src/db/database', () => ({ db: {}, closeDb: () => {}, reinitialize: () => {} }));

vi.mock('../../src/middleware/auth', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { user: unknown }).user = fixedUser;
    next();
  },
  extractToken: () => 'parity-token',
  verifyJwtAndLoadUser: () => fixedUser,
}));

const { mockSearch, mockFindByIata } = vi.hoisted(() => ({ mockSearch: vi.fn(), mockFindByIata: vi.fn() }));
vi.mock('../../src/services/airportService', async (importActual) => {
  const actual = await importActual<typeof import('../../src/services/airportService')>();
  return { ...actual, searchAirports: mockSearch, findByIata: mockFindByIata };
});

const { mockGetActive, mockDismiss } = vi.hoisted(() => ({ mockGetActive: vi.fn(), mockDismiss: vi.fn() }));
vi.mock('../../src/systemNotices/service', () => ({
  getActiveNoticesFor: mockGetActive,
  dismissNotice: mockDismiss,
}));

import airportsRoutes from '../../src/routes/airports';
import publicConfigRoutes from '../../src/routes/publicConfig';
import systemNoticesRoutes from '../../src/routes/systemNotices';
import { AirportsModule } from '../../src/nest/airports/airports.module';
import { ConfigModule } from '../../src/nest/config/config.module';
import { SystemNoticesModule } from '../../src/nest/system-notices/system-notices.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

const BER = {
  iata: 'BER', icao: 'EDDB', name: 'Berlin Brandenburg', city: 'Berlin',
  country: 'DE', lat: 52.36, lng: 13.5, tz: 'Europe/Berlin',
};
const notice = {
  id: 'welcome', display: 'modal', severity: 'info',
  titleKey: 'notice.welcome.title', bodyKey: 'notice.welcome.body', dismissible: true,
};

describe('L2 parity (Express vs Nest)', () => {
  let expressServer: express.Express;
  let nestServer: Server;
  let nestApp: Awaited<ReturnType<typeof buildNest>>;

  function buildExpress() {
    const app = express();
    app.use(express.json());
    app.use('/api/airports', airportsRoutes);
    app.use('/api/config', publicConfigRoutes);
    app.use('/api/system-notices', systemNoticesRoutes);
    return app;
  }

  async function buildNest() {
    const moduleRef = await Test.createTestingModule({
      imports: [AirportsModule, ConfigModule, SystemNoticesModule],
    }).compile();
    const nest = moduleRef.createNestApplication();
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    expressServer = buildExpress();
    nestApp = await buildNest();
    nestServer = nestApp.getHttpServer();
    mockSearch.mockReturnValue([BER]);
    mockFindByIata.mockImplementation((code: string) => (code === 'BER' ? BER : null));
    mockGetActive.mockReturnValue([notice]);
    mockDismiss.mockImplementation((_userId: number, id: string) => id === 'welcome');
  });

  afterAll(async () => {
    await nestApp.close();
  });

  it('GET /api/airports/search with a query', () =>
    expectParity(expressServer, nestServer, { path: '/api/airports/search', query: { q: 'ber' } }));

  it('GET /api/airports/search without a query', () =>
    expectParity(expressServer, nestServer, { path: '/api/airports/search' }));

  it('GET /api/airports/:iata found', () =>
    expectParity(expressServer, nestServer, { path: '/api/airports/BER' }));

  it('GET /api/airports/:iata not found (404)', () =>
    expectParity(expressServer, nestServer, { path: '/api/airports/ZZZ' }));

  it('GET /api/config (public)', () =>
    expectParity(expressServer, nestServer, { path: '/api/config' }));

  it('GET /api/system-notices/active', () =>
    expectParity(expressServer, nestServer, { path: '/api/system-notices/active' }));

  it('POST /api/system-notices/:id/dismiss success (204)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/system-notices/welcome/dismiss' }));

  it('POST /api/system-notices/:id/dismiss not found (404)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/system-notices/nope/dismiss' }));
});
