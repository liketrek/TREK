/**
 * Auth e2e — exercises the migrated /api/auth endpoints through the real
 * JwtAuthGuard/OptionalJwtGuard, the real cookie service AND the real
 * DI-native AuthService (DatabaseModule + AuthModule, which pulls in
 * Audit/Permissions/AtlasModule) against a temp SQLite db (full schema).
 * No service mock (the legacy path-mock died with the auth fold): login runs
 * real bcrypt against a factory-seeded hash, audit rows land in audit_log for
 * real, and the httpOnly trek_session cookie set/clear is asserted end to end.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { sessionCookie } from './harness';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec('PRAGMA foreign_keys = ON');
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({
  db,
  closeDb: () => {},
  reinitialize: () => {},
  getPlaceWithTags: () => null,
  canAccessTrip: () => undefined,
  isOwner: () => false,
}));

vi.mock('../../src/websocket', () => ({ broadcastToUser: vi.fn(), broadcast: vi.fn() }));
// The audit domain is DI-native: writeAudit runs for real against the temp
// db's audit_log table; only the file logger is silenced.
vi.mock('../../src/nest/audit/audit-log.logger', () => ({ LOG_LEVEL: 'error', logInfo: vi.fn(), logDebug: vi.fn(), logError: vi.fn(), logWarn: vi.fn() }));
vi.mock('../../src/services/notifications', () => ({ sendPasswordResetEmail: vi.fn().mockResolvedValue({ delivered: true }) }));
vi.mock('../../src/app-config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/app-config')>();
  return { ...actual, getAppUrl: () => 'https://x' };
});

import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';
import { createUser } from '../helpers/factories';
import { AuthModule } from '../../src/nest/auth/auth.module';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';

describe('Auth e2e (real auth guard + real service + real cookie service + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let userId: number;
  let userEmail: string;
  let userPassword: string;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule, AuthModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    // Mirror the production APP_PIPE (app.module.ts): DTO-typed bodies validate
    // by metatype, exactly as they do under buildApp().
    nest.useGlobalPipes(new ZodValidationPipe());
    await nest.init();
    return nest;
  }

  const auditRows = (action: string) =>
    (db.prepare('SELECT COUNT(*) AS n FROM audit_log WHERE action = ?').get(action) as { n: number }).n;

  beforeAll(async () => {
    createTables(db as never);
    runMigrations(db as never);
    const seeded = createUser(db as never, { username: 'auth-e2e', email: 'u@example.test' });
    userId = seeded.user.id;
    userEmail = seeded.user.email;
    userPassword = seeded.password;
    app = await build();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /app-config is optional-auth (200 without a cookie, real toggles)', async () => {
    const res = await request(server).get('/api/auth/app-config');
    expect(res.status).toBe(200);
    expect(res.body.password_login).toBe(true);
    expect(res.body.has_users).toBe(true);
    expect(typeof res.body.version).toBe('string');
    expect(res.body.version.length).toBeGreaterThan(0);
    // Unauthenticated → no permissions block.
    expect(res.body.permissions).toBeUndefined();
  });

  it('GET /me requires a session (401 without a cookie)', async () => {
    expect((await request(server).get('/api/auth/me')).status).toBe(401);
  });

  it('GET /me returns the real user row with a valid session', async () => {
    const res = await request(server).get('/api/auth/me').set('Cookie', sessionCookie(userId));
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(userId);
    expect(res.body.user.email).toBe(userEmail);
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  it('POST /login sets the httpOnly trek_session cookie and audits user.login', async () => {
    const before = auditRows('user.login');
    const res = await request(server).post('/api/auth/login').send({ email: userEmail, password: userPassword });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user.id).toBe(userId);
    const setCookie = res.headers['set-cookie'] as unknown as string[];
    expect(setCookie.some((c) => c.startsWith('trek_session=') && /HttpOnly/i.test(c))).toBe(true);
    expect(auditRows('user.login')).toBe(before + 1);
  }, 10000);

  it('POST /login with a wrong password answers the generic 401 and audits user.login_failed', async () => {
    const before = auditRows('user.login_failed');
    const res = await request(server).post('/api/auth/login').send({ email: userEmail, password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid email or password' });
    expect(auditRows('user.login_failed')).toBe(before + 1);
  }, 10000);

  it('POST /login with remember_me sets a persistent cookie (Max-Age present)', async () => {
    const res = await request(server).post('/api/auth/login').send({ email: userEmail, password: userPassword, remember_me: true });
    expect(res.status).toBe(200);
    const setCookie = res.headers['set-cookie'] as unknown as string[];
    const cookie = setCookie.find((c) => c.startsWith('trek_session='))!;
    expect(cookie).toMatch(/Max-Age=\d+/i);
    // 30d default — well above the 24h (86400s) non-remember window.
    const maxAge = Number(/Max-Age=(\d+)/i.exec(cookie)?.[1]);
    expect(maxAge).toBeGreaterThan(86_400);
  }, 10000);

  it('POST /login without remember_me sets a session cookie (no Max-Age)', async () => {
    const res = await request(server).post('/api/auth/login').send({ email: userEmail, password: userPassword });
    expect(res.status).toBe(200);
    const setCookie = res.headers['set-cookie'] as unknown as string[];
    const cookie = setCookie.find((c) => c.startsWith('trek_session='))!;
    expect(cookie).not.toMatch(/Max-Age/i);
    expect(cookie).not.toMatch(/Expires/i);
  }, 10000);

  it('POST /register creates the user, sets the cookie and audits user.register', async () => {
    const before = auditRows('user.register');
    const res = await request(server)
      .post('/api/auth/register')
      .send({ username: 'fresh-e2e', email: 'fresh-e2e@example.test', password: 'Str0ng!Pass1' });
    expect(res.status).toBe(201);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user.username).toBe('fresh-e2e');
    const setCookie = res.headers['set-cookie'] as unknown as string[];
    expect(setCookie.some((c) => c.startsWith('trek_session=') && /HttpOnly/i.test(c))).toBe(true);
    expect(auditRows('user.register')).toBe(before + 1);
    const row = db.prepare('SELECT id FROM users WHERE email = ?').get('fresh-e2e@example.test');
    expect(row).toBeDefined();
  });

  it('POST /login with a shapeless body answers the pipe 400 envelope', async () => {
    const res = await request(server).post('/api/auth/login').send({ email: 'u@example.test' });
    expect(res.status).toBe(400);
    // The global ZodValidationPipe envelope: { error: 'field: message; ...' }.
    expect(res.body.error).toMatch(/password/i);
  });

  it('POST /logout clears the session cookie', async () => {
    const res = await request(server).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    const setCookie = res.headers['set-cookie'] as unknown as string[];
    expect(setCookie.some((c) => c.startsWith('trek_session='))).toBe(true);
  });
});
