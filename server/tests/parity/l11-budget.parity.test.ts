/**
 * S4 parity — budget (trip-scoped).
 *
 * Same request at the legacy Express /api/trips/:tripId/budget route (mergeParams)
 * and the migrated Nest controller, with budgetService, the permission check, the
 * WebSocket broadcast, the DB and auth all mocked identically. Asserts
 * client-identical status + body across the trip 404, permission 403, validation
 * 400 and the create 201.
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
    verifyTripAccess: vi.fn(), listBudgetItems: vi.fn(), createBudgetItem: vi.fn(), updateBudgetItem: vi.fn(),
    deleteBudgetItem: vi.fn(), updateMembers: vi.fn(), toggleMemberPaid: vi.fn(), getPerPersonSummary: vi.fn(),
    calculateSettlement: vi.fn(), reorderBudgetItems: vi.fn(), reorderBudgetCategories: vi.fn(),
  },
}));
vi.mock('../../src/services/budgetService', () => svc);

import budgetRoutes from '../../src/routes/budget';
import { BudgetModule } from '../../src/nest/budget/budget.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('S4 parity (Express vs Nest)', () => {
  let expressServer: express.Express;
  let nestServer: Server;
  let nestApp: Awaited<ReturnType<typeof buildNest>>;

  function buildExpress() {
    const app = express();
    app.use(express.json());
    app.use('/api/trips/:tripId/budget', budgetRoutes);
    return app;
  }

  async function buildNest() {
    const moduleRef = await Test.createTestingModule({ imports: [BudgetModule] }).compile();
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
    svc.listBudgetItems.mockReturnValue([{ id: 1, name: 'Hotel' }]);
    svc.createBudgetItem.mockReturnValue({ id: 9, name: 'Hotel' });
    svc.updateBudgetItem.mockImplementation((id: string) => (id === '9' ? { id: 9, reservation_id: null, total_price: 100 } : null));
    svc.updateMembers.mockReturnValue({ members: [{ user_id: 2 }], item: { persons: 1 } });
    svc.toggleMemberPaid.mockReturnValue({ user_id: 2, paid: 1 });
    svc.getPerPersonSummary.mockReturnValue([{ userId: 1 }]);
    svc.calculateSettlement.mockReturnValue({ transfers: [] });
  });

  beforeEach(() => {
    svc.verifyTripAccess.mockReturnValue(trip);
    checkPermission.mockReturnValue(true);
  });

  afterAll(async () => {
    await nestApp.close();
  });

  it('GET / list', () => expectParity(expressServer, nestServer, { path: '/api/trips/5/budget' }));
  it('GET / 404 trip', () => {
    svc.verifyTripAccess.mockReturnValue(undefined);
    return expectParity(expressServer, nestServer, { path: '/api/trips/5/budget' });
  });
  it('GET /summary/per-person', () => expectParity(expressServer, nestServer, { path: '/api/trips/5/budget/summary/per-person' }));
  it('GET /settlement', () => expectParity(expressServer, nestServer, { path: '/api/trips/5/budget/settlement' }));
  it('POST / create (201)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/budget', body: { name: 'Hotel' } }));
  it('POST / 403 no permission', () => {
    checkPermission.mockReturnValue(false);
    return expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/budget', body: { name: 'Hotel' } });
  });
  it('POST / 400 missing name', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/trips/5/budget', body: {} }));
  it('PUT /reorder/items', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/trips/5/budget/reorder/items', body: { orderedIds: [1, 2] } }));
  it('PUT /reorder/categories', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/trips/5/budget/reorder/categories', body: { orderedCategories: ['a'] } }));
  it('PUT /:id 404 when item missing', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/trips/5/budget/77', body: { name: 'X' } }));
  it('PUT /:id/members 400 not array', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/trips/5/budget/9/members', body: { user_ids: 'no' } }));
  it('DELETE /:id 404 when missing', () => {
    svc.deleteBudgetItem.mockReturnValue(false);
    return expectParity(expressServer, nestServer, { method: 'delete', path: '/api/trips/5/budget/77' });
  });
});
