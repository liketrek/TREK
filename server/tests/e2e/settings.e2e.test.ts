/**
 * Settings e2e — exercises the migrated /api/settings endpoints through the real
 * JwtAuthGuard against a temp SQLite db. The settings service is mocked; this
 * focuses on auth, the 400 guards, the masked-sentinel no-op and status codes.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { seedUser, sessionCookie } from './harness';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0);`);
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({ db, closeDb: () => {}, reinitialize: () => {} }));

const { settingsSvc } = vi.hoisted(() => ({
  settingsSvc: { getUserSettings: vi.fn(), upsertSetting: vi.fn(), bulkUpsertSettings: vi.fn() },
}));
vi.mock('../../src/services/settingsService', () => settingsSvc);

import { SettingsModule } from '../../src/nest/settings/settings.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('Settings e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [SettingsModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    seedUser(db as never, { id: 1 });
    app = await build();
    server = app.getHttpServer();
    settingsSvc.getUserSettings.mockReturnValue({ theme: 'dark' });
    settingsSvc.bulkUpsertSettings.mockReturnValue(2);
  });

  beforeEach(() => vi.clearAllMocks());

  afterAll(async () => {
    await app.close();
  });

  it('401 without a session cookie', async () => {
    expect((await request(server).get('/api/settings')).status).toBe(401);
  });

  it('200 list with a session', async () => {
    settingsSvc.getUserSettings.mockReturnValue({ theme: 'dark' });
    const res = await request(server).get('/api/settings').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ settings: { theme: 'dark' } });
  });

  it('PUT 400 without a key', async () => {
    const res = await request(server).put('/api/settings').set('Cookie', sessionCookie(1)).send({ value: 'x' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Key is required' });
  });

  it('PUT no-ops on the masked sentinel', async () => {
    const res = await request(server).put('/api/settings').set('Cookie', sessionCookie(1)).send({ key: 'secret', value: '••••••••' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, key: 'secret', unchanged: true });
    expect(settingsSvc.upsertSetting).not.toHaveBeenCalled();
  });

  it('POST /bulk 200', async () => {
    settingsSvc.bulkUpsertSettings.mockReturnValue(2);
    const res = await request(server).post('/api/settings/bulk').set('Cookie', sessionCookie(1)).send({ settings: { a: 1, b: 2 } });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, updated: 2 });
  });
});
