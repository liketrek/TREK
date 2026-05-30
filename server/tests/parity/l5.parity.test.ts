/**
 * L5 parity — tags CRUD.
 *
 * Fires the same request at the legacy Express /api/tags route and the migrated
 * Nest controller with tagService mocked identically for both, asserting
 * client-identical status + body. Auth is neutralised identically (a fixed user);
 * the 401 path is covered by the e2e test against the real guard.
 */
import { describe, it, beforeAll, afterAll, vi } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { expectParity } from './parity';

const { fixedUser } = vi.hoisted(() => ({
  fixedUser: { id: 5, username: 'u', email: 'u@example.test', role: 'user' },
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
    listTags: vi.fn(),
    createTag: vi.fn(),
    getTagByIdAndUser: vi.fn(),
    updateTag: vi.fn(),
    deleteTag: vi.fn(),
  },
}));
vi.mock('../../src/services/tagService', () => mocks);

import tagsRoutes from '../../src/routes/tags';
import { TagsModule } from '../../src/nest/tags/tags.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

const tag = { id: 1, user_id: 5, name: 'Beach', color: '#10b981' };

describe('L5 parity (Express vs Nest)', () => {
  let expressServer: express.Express;
  let nestServer: Server;
  let nestApp: Awaited<ReturnType<typeof buildNest>>;

  function buildExpress() {
    const app = express();
    app.use(express.json());
    app.use('/api/tags', tagsRoutes);
    return app;
  }

  async function buildNest() {
    const moduleRef = await Test.createTestingModule({ imports: [TagsModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    expressServer = buildExpress();
    nestApp = await buildNest();
    nestServer = nestApp.getHttpServer();
    mocks.listTags.mockReturnValue([tag]);
    mocks.createTag.mockReturnValue(tag);
    mocks.updateTag.mockReturnValue({ ...tag, name: 'Hike' });
    mocks.getTagByIdAndUser.mockImplementation((id: string | number) => (String(id) === '1' ? tag : undefined));
  });

  afterAll(async () => {
    await nestApp.close();
  });

  it('GET /', () => expectParity(expressServer, nestServer, { path: '/api/tags' }));

  it('POST / create (201)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/tags', body: { name: 'Beach', color: '#10b981' } }));

  it('POST / missing name (400)', () =>
    expectParity(expressServer, nestServer, { method: 'post', path: '/api/tags', body: {} }));

  it('PUT /:id found (200)', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/tags/1', body: { name: 'Hike' } }));

  it('PUT /:id not found (404)', () =>
    expectParity(expressServer, nestServer, { method: 'put', path: '/api/tags/9', body: { name: 'X' } }));

  it('DELETE /:id found (200)', () =>
    expectParity(expressServer, nestServer, { method: 'delete', path: '/api/tags/1' }));

  it('DELETE /:id not found (404)', () =>
    expectParity(expressServer, nestServer, { method: 'delete', path: '/api/tags/9' }));
});
