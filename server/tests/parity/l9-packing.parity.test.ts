/**
 * S2 parity — packing (trip-scoped).
 *
 * Fires the same request at the legacy Express /api/trips/:tripId/packing route
 * (mounted with mergeParams) and the migrated Nest controller, with
 * packingService, the permission check, the WebSocket broadcast and auth all
 * mocked identically for both. Asserts client-identical status + body, including
 * the trip-access 404, the permission 403, and POST /apply-template staying 200.
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

vi.mock('../../src/websocket', () => ({ broadcast: vi.fn() }));

const { checkPermission } = vi.hoisted(() => ({ checkPermission: vi.fn() }));
vi.mock('../../src/services/permissions', () => ({ checkPermission }));

const { svc } = vi.hoisted(() => ({
  svc: {
    verifyTripAccess: vi.fn(), listItems: vi.fn(), createItem: vi.fn(), updateItem: vi.fn(),
    deleteItem: vi.fn(), bulkImport: vi.fn(), reorderItems: vi.fn(), listBags: vi.fn(),
    createBag: vi.fn(), updateBag: vi.fn(), deleteBag: vi.fn(), applyTemplate: vi.fn(),
    saveAsTemplate: vi.fn(), setBagMembers: vi.fn(), getCategoryAssignees: vi.fn(),
    updateCategoryAssignees: vi.fn(), reorderBags: vi.fn(),
  },
}));
vi.mock('../../src/services/packingService', () => svc);

import packingRoutes from '../../src/routes/packing';
import { PackingModule } from '../../src/nest/packing/packing.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('S2 parity (Express vs Nest)', () => {
  let expressServer: express.Express;
  let nestServer: Server;
  let nestApp: Awaited<ReturnType<typeof buildNest>>;

  function buildExpress() {
    const app = express();
    app.use(express.json());
    app.use('/api/trips/:tripId/packing', packingRoutes);
    return app;
  }

  async function buildNest() {
    const moduleRef = await Test.createTestingModule({ imports: [PackingModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    expressServer = buildExpress();
    nestApp = await buildNest();
    nestServer = nestApp.getHttpServer();
    svc.listItems.mockReturnValue([{ id: 1, name: 'Socks' }]);
    svc.createItem.mockReturnValue({ id: 9, name: 'Socks' });
    svc.bulkImport.mockReturnValue([{ id: 1 }]);
    svc.updateItem.mockImplementation((_t: string, id: string) => (id === '9' ? { id: 9 } : null));
    svc.listBags.mockReturnValue([{ id: 1 }]);
    svc.createBag.mockReturnValue({ id: 2 });
    svc.applyTemplate.mockReturnValue([{ id: 1 }]);
    svc.getCategoryAssignees.mockReturnValue([]);
  });

  beforeEach(() => {
    svc.verifyTripAccess.mockReturnValue(trip);
    checkPermission.mockReturnValue(true);
  });

  afterAll(async () => {
    await nestApp.close();
  });

  it('GET / list', () => expectParity(expressServer, nestServer, { path: '/api/trips/5/packing' }));

  it('GET / 404 when trip not accessible', () => {
    svc.verifyTripAccess.mockReturnValue(undefined);
    return expectParity(expressServer, nestServer, { path: '/api/trips/5/packing' });
  });

  it('POST / create (201)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/packing', body: { name: 'Socks' } }));

  it('POST / 403 without permission', () => {
    checkPermission.mockReturnValue(false);
    return expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/packing', body: { name: 'Socks' } });
  });

  it('POST / 400 missing name', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/packing', body: {} }));

  it('POST /import 400 empty', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/packing/import', body: { items: [] } }));

  it('PUT /reorder', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/trips/5/packing/reorder', body: { orderedIds: [1, 2] } }));

  it('PUT /:id 404 when item missing', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/trips/5/packing/77', body: { name: 'X' } }));

  it('GET /bags', () => expectParity(expressServer, nestServer, { path: '/api/trips/5/packing/bags' }));

  it('POST /bags 400 blank name', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/packing/bags', body: { name: '  ' } }));

  it('POST /apply-template/:id stays 200', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/packing/apply-template/t1' }));

  it('GET /category-assignees', () =>
    expectParity(expressServer, nestServer, { path: '/api/trips/5/packing/category-assignees' }));
});
