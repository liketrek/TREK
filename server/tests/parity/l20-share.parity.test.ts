/**
 * C5 parity — trip share links + the public shared-trip read.
 *
 * Same request at the legacy Express /api route and the migrated Nest
 * controllers, with shareService, the permission check, the trip-access lookup
 * and auth mocked identically. Pins routing, trip-access 404, permission 403,
 * the create-201-vs-update-200 split and the unguarded public 404/JSON.
 */
import { describe, it, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { expectParity } from './parity';

const { fixedUser } = vi.hoisted(() => ({ fixedUser: { id: 1, username: 'u', email: 'u@example.test', role: 'user' } }));

const { canAccessTrip } = vi.hoisted(() => ({ canAccessTrip: vi.fn() }));
vi.mock('../../src/db/database', () => ({
  db: { prepare: () => ({ get: () => undefined, all: () => [], run: () => undefined }) },
  canAccessTrip, closeDb: () => {}, reinitialize: () => {},
}));

vi.mock('../../src/middleware/auth', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { user: unknown }).user = fixedUser;
    next();
  },
  extractToken: () => 'token',
  verifyJwtAndLoadUser: () => fixedUser,
}));

const { checkPermission } = vi.hoisted(() => ({ checkPermission: vi.fn() }));
vi.mock('../../src/services/permissions', () => ({ checkPermission }));

const { shareSvc } = vi.hoisted(() => ({
  shareSvc: { createOrUpdateShareLink: vi.fn(), getShareLink: vi.fn(), deleteShareLink: vi.fn(), getSharedTripData: vi.fn() },
}));
vi.mock('../../src/services/shareService', () => shareSvc);

import shareRoutes from '../../src/routes/share';
import { ShareModule } from '../../src/nest/share/share.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('C5 parity (Express vs Nest)', () => {
  let expressServer: express.Express;
  let nestServer: Server;
  let nestApp: Awaited<ReturnType<typeof buildNest>>;

  function buildExpress() {
    const app = express();
    app.use(express.json());
    app.use('/api', shareRoutes);
    return app;
  }

  async function buildNest() {
    const moduleRef = await Test.createTestingModule({ imports: [ShareModule] }).compile();
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
    shareSvc.getShareLink.mockReturnValue({ token: 't', share_map: 1 });
    shareSvc.getSharedTripData.mockReturnValue({ trip: { id: 9 } });
  });

  beforeEach(() => {
    canAccessTrip.mockReturnValue({ user_id: 1 });
    checkPermission.mockReturnValue(true);
  });

  afterAll(async () => {
    await nestApp.close();
  });

  it('POST /trips/:id/share-link (201 created)', () => {
    shareSvc.createOrUpdateShareLink.mockReturnValue({ token: 't', created: true });
    return expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/share-link', body: { share_map: true } });
  });
  it('POST /trips/:id/share-link (200 update)', () => {
    shareSvc.createOrUpdateShareLink.mockReturnValue({ token: 't', created: false });
    return expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/share-link', body: {} });
  });
  it('POST /trips/:id/share-link 404 no access', () => {
    canAccessTrip.mockReturnValue(undefined);
    return expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/share-link', body: {} });
  });
  it('POST /trips/:id/share-link 403', () => {
    checkPermission.mockReturnValue(false);
    return expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/share-link', body: {} });
  });
  it('GET /trips/:id/share-link', () => expectParity(expressServer, nestServer, { path: '/api/trips/5/share-link' }));
  it('GET /trips/:id/share-link null token', () => {
    shareSvc.getShareLink.mockReturnValueOnce(null).mockReturnValueOnce(null);
    return expectParity(expressServer, nestServer, { path: '/api/trips/5/share-link' });
  });
  it('GET /trips/:id/share-link 404 no access', () => {
    canAccessTrip.mockReturnValue(undefined);
    return expectParity(expressServer, nestServer, { path: '/api/trips/5/share-link' });
  });
  it('DELETE /trips/:id/share-link', () => expectParity(expressServer, nestServer, { method: 'delete', path: '/api/trips/5/share-link' }));
  it('DELETE /trips/:id/share-link 403', () => {
    checkPermission.mockReturnValue(false);
    return expectParity(expressServer, nestServer, { method: 'delete', path: '/api/trips/5/share-link' });
  });

  it('GET /shared/:token', () => expectParity(expressServer, nestServer, { path: '/api/shared/tok' }));
  it('GET /shared/:token 404', () => {
    shareSvc.getSharedTripData.mockReturnValueOnce(null).mockReturnValueOnce(null);
    return expectParity(expressServer, nestServer, { path: '/api/shared/bad' });
  });
});
