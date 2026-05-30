/**
 * S3 parity — to-dos (trip-scoped).
 *
 * Same request at the legacy Express /api/trips/:tripId/todo route (mergeParams)
 * and the migrated Nest controller, with todoService, the permission check, the
 * WebSocket broadcast and auth all mocked identically. Asserts client-identical
 * status + body, including trip 404, permission 403, and the create 201.
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
    deleteItem: vi.fn(), reorderItems: vi.fn(), getCategoryAssignees: vi.fn(), updateCategoryAssignees: vi.fn(),
  },
}));
vi.mock('../../src/services/todoService', () => svc);

import todoRoutes from '../../src/routes/todo';
import { TodoModule } from '../../src/nest/todo/todo.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('S3 parity (Express vs Nest)', () => {
  let expressServer: express.Express;
  let nestServer: Server;
  let nestApp: Awaited<ReturnType<typeof buildNest>>;

  function buildExpress() {
    const app = express();
    app.use(express.json());
    app.use('/api/trips/:tripId/todo', todoRoutes);
    return app;
  }

  async function buildNest() {
    const moduleRef = await Test.createTestingModule({ imports: [TodoModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    expressServer = buildExpress();
    nestApp = await buildNest();
    nestServer = nestApp.getHttpServer();
    svc.listItems.mockReturnValue([{ id: 1, name: 'Book hotel' }]);
    svc.createItem.mockReturnValue({ id: 9, name: 'Book hotel' });
    svc.updateItem.mockImplementation((_t: string, id: string) => (id === '9' ? { id: 9 } : null));
    svc.getCategoryAssignees.mockReturnValue([]);
  });

  beforeEach(() => {
    svc.verifyTripAccess.mockReturnValue(trip);
    checkPermission.mockReturnValue(true);
  });

  afterAll(async () => {
    await nestApp.close();
  });

  it('GET / list', () => expectParity(expressServer, nestServer, { path: '/api/trips/5/todo' }));

  it('GET / 404 when trip not accessible', () => {
    svc.verifyTripAccess.mockReturnValue(undefined);
    return expectParity(expressServer, nestServer, { path: '/api/trips/5/todo' });
  });

  it('POST / create (201)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/todo', body: { name: 'Book hotel' } }));

  it('POST / 403 without permission', () => {
    checkPermission.mockReturnValue(false);
    return expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/todo', body: { name: 'Book hotel' } });
  });

  it('POST / 400 missing name', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/todo', body: {} }));

  it('PUT /reorder', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/trips/5/todo/reorder', body: { orderedIds: [1, 2] } }));

  it('PUT /:id 404 when item missing', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/trips/5/todo/77', body: { name: 'X' } }));

  it('GET /category-assignees', () =>
    expectParity(expressServer, nestServer, { path: '/api/trips/5/todo/category-assignees' }));
});
