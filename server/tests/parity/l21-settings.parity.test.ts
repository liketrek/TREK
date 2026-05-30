/**
 * C6 parity — user settings.
 *
 * Same request at the legacy Express /api/settings route and the migrated Nest
 * controller, with settingsService and auth mocked identically. Pins routing,
 * the 400 guards, the masked-sentinel no-op and the bulk 200.
 */
import { describe, it, beforeAll, afterAll, vi } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { expectParity } from './parity';

const { fixedUser } = vi.hoisted(() => ({ fixedUser: { id: 1, username: 'u', email: 'u@example.test', role: 'user' } }));

vi.mock('../../src/db/database', () => ({
  db: { prepare: () => ({ get: () => undefined, all: () => [], run: () => undefined }) }, closeDb: () => {}, reinitialize: () => {},
}));

vi.mock('../../src/middleware/auth', () => ({
  authenticate: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { user: unknown }).user = fixedUser;
    next();
  },
  extractToken: () => 'token',
  verifyJwtAndLoadUser: () => fixedUser,
}));

const { settingsSvc } = vi.hoisted(() => ({
  settingsSvc: { getUserSettings: vi.fn(), upsertSetting: vi.fn(), bulkUpsertSettings: vi.fn() },
}));
vi.mock('../../src/services/settingsService', () => settingsSvc);

import settingsRoutes from '../../src/routes/settings';
import { SettingsModule } from '../../src/nest/settings/settings.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('C6 parity (Express vs Nest)', () => {
  let expressServer: express.Express;
  let nestServer: Server;
  let nestApp: Awaited<ReturnType<typeof buildNest>>;

  function buildExpress() {
    const app = express();
    app.use(express.json());
    app.use('/api/settings', settingsRoutes);
    return app;
  }

  async function buildNest() {
    const moduleRef = await Test.createTestingModule({ imports: [SettingsModule] }).compile();
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
    settingsSvc.getUserSettings.mockReturnValue({ theme: 'dark' });
    settingsSvc.bulkUpsertSettings.mockReturnValue(2);
  });

  afterAll(async () => {
    await nestApp.close();
  });

  it('GET /settings', () => expectParity(expressServer, nestServer, { path: '/api/settings' }));
  it('PUT /settings', () => expectParity(expressServer, nestServer, { method: 'put', path: '/api/settings', body: { key: 'theme', value: 'dark' } }));
  it('PUT /settings 400 no key', () => expectParity(expressServer, nestServer, { method: 'put', path: '/api/settings', body: { value: 'x' } }));
  it('PUT /settings masked sentinel no-op', () => expectParity(expressServer, nestServer, { method: 'put', path: '/api/settings', body: { key: 'k', value: '••••••••' } }));
  it('POST /settings/bulk (200)', () => expectParity(expressServer, nestServer, { method: 'post', path: '/api/settings/bulk', body: { settings: { a: 1, b: 2 } } }));
  it('POST /settings/bulk 400 no object', () => expectParity(expressServer, nestServer, { method: 'post', path: '/api/settings/bulk', body: {} }));
});
