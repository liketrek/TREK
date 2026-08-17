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
vi.mock('../../src/app-config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/app-config')>();
  return { ...actual, getAppUrl: () => 'https://x' };
});

import { MailerService } from '../../src/nest/notifications/mailer/mailer.service';
import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';
import { createUser } from '../helpers/factories';
import { encrypt_api_key } from '../../src/nest/common/crypto/apiKeyCrypto';
import { resetRateLimits } from '../helpers/test-db';
import { AuthModule } from '../../src/nest/auth/auth.module';
import { AuthService } from '../../src/nest/auth/auth.service';
import { SessionRenewalInterceptor } from '../../src/nest/auth/session-renewal.interceptor';
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
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule, AuthModule] })
      // The mailer is a provider since the notifications fold; overriding it is
      // the DI-native replacement for the old services/notifications module mock.
      .overrideProvider(MailerService)
      .useValue({ sendPasswordResetEmail: vi.fn().mockResolvedValue({ delivered: 'email' }) })
      .compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    // Mirror the production APP_PIPE (app.module.ts): DTO-typed bodies validate
    // by metatype, exactly as they do under buildApp().
    nest.useGlobalPipes(new ZodValidationPipe());
    // Mirror the production APP_INTERCEPTOR: sliding session renewal (#1927).
    // Inert for the harness's exp-less tokens and freshly issued logins.
    nest.useGlobalInterceptors(new SessionRenewalInterceptor(moduleRef.get(AuthService)));
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

  it('renews the session cookie when the token is past half its lifetime (#1927)', async () => {
    // 70% of a 24h token consumed → the interceptor re-issues the cookie.
    const res = await request(server)
      .get('/api/auth/me')
      .set('Cookie', sessionCookie(userId, 0, { lifetime: 86400, consumed: 60000 }));
    expect(res.status).toBe(200);
    const setCookie = (res.headers['set-cookie'] ?? []) as unknown as string[];
    const renewed = setCookie.find((c) => c.startsWith('trek_session='))!;
    expect(renewed).toBeTruthy();
    expect(renewed).toMatch(/Max-Age=86400/i);
    // The renewed token is a fresh full-lifetime session for the same user.
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(/trek_session=([^;]+)/.exec(renewed)![1]) as { id: number; exp: number; iat: number };
    expect(decoded.id).toBe(userId);
    expect(decoded.exp - decoded.iat).toBe(86400);
  }, 10000);

  it('renews a remembered session with the long window and a remember:false one as a session cookie (#1927)', async () => {
    const long = await request(server)
      .get('/api/auth/me')
      .set('Cookie', sessionCookie(userId, 0, { lifetime: 2592000, consumed: 1600000, remember: true }));
    expect(long.status).toBe(200);
    const longCookie = ((long.headers['set-cookie'] ?? []) as unknown as string[]).find((c) => c.startsWith('trek_session='))!;
    expect(longCookie).toMatch(/Max-Age=2592000/i);

    const sess = await request(server)
      .get('/api/auth/me')
      .set('Cookie', sessionCookie(userId, 0, { lifetime: 86400, consumed: 60000, remember: false }));
    expect(sess.status).toBe(200);
    const sessCookie = ((sess.headers['set-cookie'] ?? []) as unknown as string[]).find((c) => c.startsWith('trek_session='))!;
    expect(sessCookie).not.toMatch(/Max-Age/i);
    expect(sessCookie).not.toMatch(/Expires/i);
  }, 10000);

  it('does not renew a young session cookie (#1927)', async () => {
    const res = await request(server)
      .get('/api/auth/me')
      .set('Cookie', sessionCookie(userId, 0, { lifetime: 86400, consumed: 1000 }));
    expect(res.status).toBe(200);
    const setCookie = (res.headers['set-cookie'] ?? []) as unknown as string[];
    expect(setCookie.some((c) => c.startsWith('trek_session='))).toBe(false);
  }, 10000);

  it('PUT /me/password preserves the remember choice on the re-issued cookie (#1927)', async () => {
    resetRateLimits(app); // earlier login cases share the same per-ip 'login' bucket
    const seeded = createUser(db as never, { username: 'pw-remember', email: 'pw-remember@example.test' });
    const login = await request(server)
      .post('/api/auth/login')
      .send({ email: seeded.user.email, password: seeded.password, remember_me: true });
    expect(login.status).toBe(200);
    const loginCookie = ((login.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('trek_session=')))!;
    const sessionValue = /trek_session=([^;]+)/.exec(loginCookie)![1];

    const change = await request(server)
      .put('/api/auth/me/password')
      .set('Cookie', `trek_session=${sessionValue}`)
      .send({ current_password: seeded.password, new_password: 'New1234!x' });
    expect(change.status).toBe(200);
    // The handler's re-issue is appended after any interceptor renewal — the
    // browser keeps the last trek_session cookie, so assert on that one.
    const setCookie = (change.headers['set-cookie'] ?? []) as unknown as string[];
    const finalCookie = setCookie.filter((c) => c.startsWith('trek_session=')).pop()!;
    expect(finalCookie).toMatch(/Max-Age=2592000/i);
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(/trek_session=([^;]+)/.exec(finalCookie)![1]) as { remember?: boolean; exp: number; iat: number };
    expect(decoded.remember).toBe(true);
    expect(decoded.exp - decoded.iat).toBe(2592000);
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

  it('PUT /me/api-keys stores the key instance-wide and audits it once (#1939)', async () => {
    const admin = createUser(db as never, { username: 'keys-admin', email: 'keys-admin@example.test', role: 'admin' });
    const before = auditRows('settings.api_keys_update');

    const res = await request(server)
      .put('/api/auth/me/api-keys')
      .set('Cookie', sessionCookie(admin.user.id))
      .send({ maps_api_key: 'e2e-google-key' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Masked in the response and never accompanied by the audit bookkeeping.
    expect(res.body.user.maps_api_key).not.toBe('e2e-google-key');
    expect(res.body).not.toHaveProperty('changedKeys');

    // What every member's search will now resolve to, encrypted at rest.
    const stored = db.prepare("SELECT value FROM app_settings WHERE key = 'maps_api_key'").get() as { value: string };
    expect(stored.value).toMatch(/^enc:v1:/);
    // And the admin panel reads back what the search uses.
    const settings = await request(server).get('/api/auth/me/settings').set('Cookie', sessionCookie(admin.user.id));
    expect(settings.body.settings.maps_api_key).toBe('e2e-google-key');

    expect(auditRows('settings.api_keys_update')).toBe(before + 1);
    const row = db
      .prepare("SELECT resource, details FROM audit_log WHERE action = 'settings.api_keys_update' ORDER BY id DESC LIMIT 1")
      .get() as { resource: string; details: string };
    expect(row.resource).toBe('api_keys');
    expect(row.details).toContain('maps_api_key');
    expect(row.details).not.toContain('e2e-google-key');

    // Saving the same value again is not a change, so the log does not grow.
    await request(server)
      .put('/api/auth/me/api-keys')
      .set('Cookie', sessionCookie(admin.user.id))
      .send({ maps_api_key: 'e2e-google-key' });
    expect(auditRows('settings.api_keys_update')).toBe(before + 1);
  }, 10000);

  it('GET /app-config answers has_maps_key from the instance row, never from an admin column (#1939)', async () => {
    const member = createUser(db as never, { username: 'keys-member', email: 'keys-member@example.test' });
    const admin = createUser(db as never, { username: 'keys-cfg-admin', email: 'keys-cfg-admin@example.test', role: 'admin' });
    // Seeded here instead of riding on the save above, so running this case on
    // its own asserts the same thing.
    const setInstanceKey = (value: string | null) => {
      if (value === null) {
        db.prepare("DELETE FROM app_settings WHERE key = 'maps_api_key'").run();
        return;
      }
      db.prepare(
        `INSERT INTO app_settings (key, value) VALUES ('maps_api_key', ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`
      ).run(encrypt_api_key(value));
    };
    const hasMapsKey = async (userId: number) => {
      const res = await request(server).get('/api/auth/app-config').set('Cookie', sessionCookie(userId));
      expect(res.status).toBe(200);
      return res.body.has_maps_key;
    };

    setInstanceKey('instance-configured-key');
    db.prepare('UPDATE users SET maps_api_key = NULL WHERE id = ?').run(admin.user.id);
    // Instance key, no column anywhere: the member searches with it, so the
    // client is told the feature is there.
    expect(await hasMapsKey(member.user.id)).toBe(true);

    // The reported half of #1939: the key exists only in one admin's column.
    // It is not the member's to spend, so they are told there is none instead
    // of being offered a Google search that answers 403.
    setInstanceKey(null);
    db.prepare('UPDATE users SET maps_api_key = ? WHERE id = ?').run(encrypt_api_key('admins-own-key'), admin.user.id);
    expect(await hasMapsKey(member.user.id)).toBe(false);
    // That same column still counts for the admin themselves.
    expect(await hasMapsKey(admin.user.id)).toBe(true);
  });

  it('POST /logout clears the session cookie', async () => {
    const res = await request(server).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    const setCookie = res.headers['set-cookie'] as unknown as string[];
    expect(setCookie.some((c) => c.startsWith('trek_session='))).toBe(true);
  });
});
