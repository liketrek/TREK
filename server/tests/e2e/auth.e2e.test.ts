/**
 * Auth e2e — exercises the migrated /api/auth endpoints through the real
 * JwtAuthGuard/OptionalJwtGuard AND the real cookie service against a temp
 * SQLite db. Only the authService (credential/MFA logic) + audit/notifications
 * are mocked; this proves the httpOnly trek_session cookie is set on login and
 * cleared on logout, that /me requires a session, and that /app-config is
 * optional-auth.
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
vi.mock('../../src/services/auditLog', () => ({ writeAudit: vi.fn(), getClientIp: vi.fn(() => '1.2.3.4') }));
vi.mock('../../src/services/notifications', () => ({ getAppUrl: () => 'https://x', sendPasswordResetEmail: vi.fn().mockResolvedValue({ delivered: true }) }));

const { authSvc } = vi.hoisted(() => ({
  authSvc: {
    getAppConfig: vi.fn(), demoLogin: vi.fn(), validateInviteToken: vi.fn(), registerUser: vi.fn(), loginUser: vi.fn(),
    requestPasswordReset: vi.fn(), resetPassword: vi.fn(), verifyMfaLogin: vi.fn(), getCurrentUser: vi.fn(),
    changePassword: vi.fn(), deleteAccount: vi.fn(), updateMapsKey: vi.fn(), updateApiKeys: vi.fn(), updateSettings: vi.fn(),
    getSettings: vi.fn(), saveAvatar: vi.fn(), deleteAvatar: vi.fn(), listUsers: vi.fn(), validateKeys: vi.fn(),
    getAppSettings: vi.fn(), updateAppSettings: vi.fn(), getTravelStats: vi.fn(), setupMfa: vi.fn(), enableMfa: vi.fn(),
    disableMfa: vi.fn(), listMcpTokens: vi.fn(), createMcpToken: vi.fn(), deleteMcpToken: vi.fn(), createWsToken: vi.fn(),
    createResourceToken: vi.fn(),
  },
}));
vi.mock('../../src/services/authService', () => authSvc);

import { AuthModule } from '../../src/nest/auth/auth.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('Auth e2e (real auth guard + real cookie service + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [AuthModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    seedUser(db as never, { id: 1, email: 'u@example.test' });
    app = await build();
    server = app.getHttpServer();
    authSvc.getAppConfig.mockReturnValue({ version: '3' });
    authSvc.loginUser.mockReturnValue({ token: 'jwt.token.value', user: { id: 1 } });
    authSvc.getCurrentUser.mockReturnValue({ id: 1, email: 'u@example.test' });
  });

  beforeEach(() => vi.clearAllMocks());

  afterAll(async () => {
    await app.close();
  });

  it('GET /app-config is optional-auth (200 without a cookie)', async () => {
    authSvc.getAppConfig.mockReturnValue({ version: '3' });
    const res = await request(server).get('/api/auth/app-config');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ version: '3' });
  });

  it('GET /me requires a session (401 without a cookie)', async () => {
    expect((await request(server).get('/api/auth/me')).status).toBe(401);
  });

  it('GET /me returns the user with a valid session', async () => {
    authSvc.getCurrentUser.mockReturnValue({ id: 1, email: 'u@example.test' });
    const res = await request(server).get('/api/auth/me').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: { id: 1, email: 'u@example.test' } });
  });

  it('POST /login sets the httpOnly trek_session cookie', async () => {
    authSvc.loginUser.mockReturnValue({ token: 'jwt.token.value', user: { id: 1 } });
    const res = await request(server).post('/api/auth/login').send({ email: 'u@example.test', password: 'pw' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ token: 'jwt.token.value', user: { id: 1 } });
    const setCookie = res.headers['set-cookie'] as unknown as string[];
    expect(setCookie.some((c) => c.startsWith('trek_session=') && /HttpOnly/i.test(c))).toBe(true);
  }, 10000);

  it('POST /login with remember_me sets a persistent cookie (Max-Age present)', async () => {
    authSvc.loginUser.mockReturnValue({ token: 'jwt.token.value', user: { id: 1 }, remember: true });
    const res = await request(server).post('/api/auth/login').send({ email: 'u@example.test', password: 'pw', remember_me: true });
    expect(res.status).toBe(200);
    const setCookie = res.headers['set-cookie'] as unknown as string[];
    const cookie = setCookie.find((c) => c.startsWith('trek_session='))!;
    expect(cookie).toMatch(/Max-Age=\d+/i);
    // 30d default — well above the 24h (86400s) non-remember window.
    const maxAge = Number(/Max-Age=(\d+)/i.exec(cookie)?.[1]);
    expect(maxAge).toBeGreaterThan(86_400);
  }, 10000);

  it('POST /login without remember_me sets a session cookie (no Max-Age)', async () => {
    authSvc.loginUser.mockReturnValue({ token: 'jwt.token.value', user: { id: 1 }, remember: false });
    const res = await request(server).post('/api/auth/login').send({ email: 'u@example.test', password: 'pw' });
    expect(res.status).toBe(200);
    const setCookie = res.headers['set-cookie'] as unknown as string[];
    const cookie = setCookie.find((c) => c.startsWith('trek_session='))!;
    expect(cookie).not.toMatch(/Max-Age/i);
    expect(cookie).not.toMatch(/Expires/i);
  }, 10000);

  it('POST /logout clears the session cookie', async () => {
    const res = await request(server).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    const setCookie = res.headers['set-cookie'] as unknown as string[];
    expect(setCookie.some((c) => c.startsWith('trek_session='))).toBe(true);
  });
});
