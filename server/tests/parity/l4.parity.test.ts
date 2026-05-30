/**
 * L4 parity — categories CRUD.
 *
 * Fires the same request at the legacy Express /api/categories route and the
 * migrated Nest controller with categoryService mocked identically for both,
 * asserting client-identical status + body. Auth + admin are neutralised the
 * same way for both apps (a fixed admin user); the 401/403 paths are covered by
 * the e2e test against the real guards.
 */
import { describe, it, beforeAll, afterAll, vi } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { expectParity } from './parity';

const { adminUser } = vi.hoisted(() => ({
  adminUser: { id: 1, username: 'admin', email: 'admin@example.test', role: 'admin' },
}));

vi.mock('../../src/db/database', () => ({
  db: { prepare: () => ({ get: () => undefined, all: () => [], run: () => undefined }) },
  closeDb: () => {},
  reinitialize: () => {},
}));

vi.mock('../../src/middleware/auth', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { user: unknown }).user = adminUser;
    next();
  },
  adminOnly: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  extractToken: () => 'token',
  verifyJwtAndLoadUser: () => adminUser,
}));

const { mocks } = vi.hoisted(() => ({
  mocks: {
    listCategories: vi.fn(),
    createCategory: vi.fn(),
    getCategoryById: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
}));
vi.mock('../../src/services/categoryService', () => mocks);

import categoriesRoutes from '../../src/routes/categories';
import { CategoriesModule } from '../../src/nest/categories/categories.module';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

const cat = { id: 1, name: 'Food', color: '#fff', icon: '🍔' };

describe('L4 parity (Express vs Nest)', () => {
  let expressServer: express.Express;
  let nestServer: Server;
  let nestApp: Awaited<ReturnType<typeof buildNest>>;

  function buildExpress() {
    const app = express();
    app.use(express.json());
    app.use('/api/categories', categoriesRoutes);
    return app;
  }

  async function buildNest() {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule, CategoriesModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    expressServer = buildExpress();
    nestApp = await buildNest();
    nestServer = nestApp.getHttpServer();
    mocks.listCategories.mockReturnValue([cat]);
    mocks.createCategory.mockReturnValue(cat);
    mocks.updateCategory.mockReturnValue({ ...cat, name: 'Drinks' });
    mocks.getCategoryById.mockImplementation((id: string | number) => (String(id) === '1' ? cat : undefined));
  });

  afterAll(async () => {
    await nestApp.close();
  });

  it('GET /', () => expectParity(expressServer, nestServer, { path: '/api/categories' }));

  it('POST / create (201)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/categories', body: { name: 'Food', color: '#fff', icon: '🍔' } }));

  it('POST / missing name (400)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/categories', body: {} }));

  it('PUT /:id found (200)', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/categories/1', body: { name: 'Drinks' } }));

  it('PUT /:id not found (404)', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/categories/9', body: { name: 'X' } }));

  it('DELETE /:id found (200)', () =>
    expectParity(expressServer, nestServer, { method: 'delete', path: '/api/categories/1' }));

  it('DELETE /:id not found (404)', () =>
    expectParity(expressServer, nestServer, { method: 'delete', path: '/api/categories/9' }));
});
