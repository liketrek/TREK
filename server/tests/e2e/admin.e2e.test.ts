/**
 * Admin e2e — exercises the migrated /api/admin endpoints through the real
 * JwtAuthGuard + AdminGuard against a temp SQLite db. The admin service +
 * helpers are mocked; this focuses on auth (401), the admin gate (403 for a
 * non-admin), create-201, validation 400 and the dev-only 404.
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
vi.mock('../../src/services/auditLog', () => ({ writeAudit: vi.fn(), getClientIp: () => '1.2.3.4', logInfo: vi.fn() }));
vi.mock('../../src/mcp', () => ({ invalidateMcpSessions: vi.fn() }));
vi.mock('../../src/services/notificationPreferencesService', () => ({ getPreferencesMatrix: vi.fn(() => ({})), setAdminPreferences: vi.fn() }));
vi.mock('../../src/services/settingsService', () => ({ getAdminUserDefaults: vi.fn(() => ({})), setAdminUserDefaults: vi.fn() }));
vi.mock('../../src/services/notificationService', () => ({ send: vi.fn().mockResolvedValue(undefined) }));

const { adminSvc } = vi.hoisted(() => ({
  adminSvc: { listUsers: vi.fn(), createUser: vi.fn(), updatePlacesPhotos: vi.fn() },
}));
vi.mock('../../src/services/adminService', () => adminSvc);

import { AdminModule } from '../../src/nest/admin/admin.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('Admin e2e (real auth + admin guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [AdminModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    seedUser(db as never, { id: 1, role: 'admin', email: 'admin@example.test' });
    seedUser(db as never, { id: 2, role: 'user', email: 'member@example.test' });
    app = await build();
    server = app.getHttpServer();
    adminSvc.listUsers.mockReturnValue([{ id: 1 }]);
  });

  beforeEach(() => { delete process.env.NODE_ENV; });

  afterAll(async () => {
    await app.close();
  });

  it('401 without a session', async () => {
    expect((await request(server).get('/api/admin/users')).status).toBe(401);
  });

  it('403 for a non-admin', async () => {
    const res = await request(server).get('/api/admin/users').set('Cookie', sessionCookie(2));
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Admin access required' });
  });

  it('200 list for an admin', async () => {
    const res = await request(server).get('/api/admin/users').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ users: [{ id: 1 }] });
  });

  it('201 on user create', async () => {
    adminSvc.createUser.mockReturnValue({ user: { id: 3 }, insertedId: 3, auditDetails: {} });
    const res = await request(server).post('/api/admin/users').set('Cookie', sessionCookie(1)).send({ email: 'new@x.y' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ user: { id: 3 } });
  });

  it('400 on a non-boolean feature toggle', async () => {
    const res = await request(server).put('/api/admin/places-photos').set('Cookie', sessionCookie(1)).send({ enabled: 'yes' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'enabled must be a boolean' });
  });

  it('404 on the dev-only test-notification outside development', async () => {
    const res = await request(server).post('/api/admin/dev/test-notification').set('Cookie', sessionCookie(1)).send({});
    expect(res.status).toBe(404);
  });
});
