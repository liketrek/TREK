/**
 * Admin e2e — exercises the migrated /api/admin endpoints through the real
 * JwtAuthGuard + AdminGuard against a temp SQLite db, DI-native: no
 * services/adminService path mock, so every route below runs its real SQL
 * (trips.e2e.test.ts pattern). Only the shared db module is mocked — the auth
 * guard reads users through the singleton and DatabaseModule's factory picks up
 * the same mocked db. Covers auth (401), the admin gate (403), create-201,
 * validation 400, the dev-only 404, and real read/write round trips.
 */
import { AdminModule } from '../../src/nest/admin/admin.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { NotificationsModule } from '../../src/nest/notifications/notifications.module';
// The admin surface is no longer one module: oidc, the account defaults and the admin
// preference matrix moved to the domains that own them, so the app has to assemble
// them too or those routes 404 here while working in production.
import { OidcModule } from '../../src/nest/oidc/oidc.module';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { SettingsModule } from '../../src/nest/settings/settings.module';
import { seedUser, sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  // `users` carries the columns listUsers/createUser/updateUser select, plus the
  // is_guest flag the #1362 COALESCE guards read.
  tmp.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0,
    password_hash TEXT, avatar TEXT, is_guest INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME);`);
  tmp.exec(`CREATE TABLE settings (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
    key TEXT NOT NULL, value TEXT, UNIQUE(user_id, key));`);
  tmp.exec('CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT);');
  // Slim audit_log mirror (no FKs), same shape as plugin-runtime.test.ts.
  tmp.exec(`CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER, action TEXT NOT NULL, resource TEXT, details TEXT, ip TEXT);`);
  // getStats counts these three alongside users.
  tmp.exec('CREATE TABLE trips (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, user_id INTEGER);');
  tmp.exec('CREATE TABLE places (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER);');
  tmp.exec('CREATE TABLE trip_files (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER);');
  tmp.exec(`CREATE TABLE invite_tokens (id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT NOT NULL,
    max_uses INTEGER, uses INTEGER DEFAULT 0, expires_at TEXT, created_by INTEGER NOT NULL,
    trip_id INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  tmp.exec(`CREATE TABLE packing_templates (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
    created_by INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  tmp.exec(`CREATE TABLE packing_template_categories (id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL, name TEXT NOT NULL, sort_order INTEGER DEFAULT 0);`);
  tmp.exec(`CREATE TABLE packing_template_items (id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL, name TEXT NOT NULL, sort_order INTEGER DEFAULT 0);`);
  tmp.exec(`CREATE TABLE addons (id TEXT PRIMARY KEY, name TEXT, description TEXT, icon TEXT,
    enabled INTEGER DEFAULT 0, config TEXT, sort_order INTEGER DEFAULT 0);`);
  tmp.exec(`CREATE TABLE photo_providers (id TEXT PRIMARY KEY, name TEXT, description TEXT,
    icon TEXT, enabled INTEGER DEFAULT 0, sort_order INTEGER DEFAULT 0);`);
  tmp.exec(`CREATE TABLE photo_provider_fields (id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id TEXT NOT NULL, field_key TEXT, label TEXT, input_type TEXT, placeholder TEXT,
    required INTEGER DEFAULT 0, secret INTEGER DEFAULT 0, settings_key TEXT, payload_key TEXT,
    sort_order INTEGER DEFAULT 0);`);
  tmp.exec(`CREATE TABLE mcp_tokens (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT,
    token_prefix TEXT, user_id INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME);`);
  tmp.exec('CREATE TABLE oauth_clients (client_id TEXT PRIMARY KEY, name TEXT);');
  tmp.exec(`CREATE TABLE oauth_tokens (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id TEXT NOT NULL,
    user_id INTEGER NOT NULL, scopes TEXT, access_token_expires_at DATETIME,
    refresh_token_expires_at DATETIME, revoked_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({ db, closeDb: () => {}, reinitialize: () => {} }));
// The audit domain is DI-native: writeAudit runs for real against the temp db's
// audit_log table; only the file logger is silenced.
vi.mock('../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));
vi.mock('../../src/mcp', () => ({ invalidateMcpSessions: vi.fn() }));
vi.mock('../../src/mcp/sessionManager', () => ({ revokeUserSessions: vi.fn(), revokeUserSessionsForClient: vi.fn() }));
// Preferences are a provider since the notifications fold; stub the two methods
// the admin surface calls on the prototype, so AdminService still resolves it
// through DI.
vi.mock('../../src/nest/notifications/notification-preferences.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/nest/notifications/notification-preferences.service')>();
  actual.NotificationPreferencesService.prototype.getPreferencesMatrix = vi.fn(() => ({}) as never);
  actual.NotificationPreferencesService.prototype.setAdminPreferences = vi.fn();
  return actual;
});

describe('Admin e2e (real auth + admin guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule, RealtimeModule, AdminModule, OidcModule, SettingsModule, NotificationsModule],
    }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    // Mirror the production APP_PIPE (app.module.ts): DTO-typed bodies validate
    // against their @trek/shared schemas.
    nest.useGlobalPipes(new ZodValidationPipe());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    seedUser(db as never, { id: 1, role: 'admin', email: 'admin@example.test', username: 'admin' });
    seedUser(db as never, { id: 2, role: 'user', email: 'member@example.test', username: 'member' });
    app = await build();
    server = app.getHttpServer();
  });

  beforeEach(() => {
    delete process.env.NODE_ENV;
  });

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

  it('200 list for an admin — real rows, guests excluded', async () => {
    const res = await request(server).get('/api/admin/users').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.users.map((u: { email: string }) => u.email).sort()).toEqual([
      'admin@example.test',
      'member@example.test',
    ]);
    expect(res.body.users[0]).toHaveProperty('avatar_url');
  });

  it('201 on user create — persists the row and writes an audit entry', async () => {
    const res = await request(server)
      .post('/api/admin/users')
      .set('Cookie', sessionCookie(1))
      .send({ username: 'created', email: 'new@x.y', password: 'Str0ng!Pass', role: 'user' });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ username: 'created', email: 'new@x.y', role: 'user' });

    const row = db.prepare('SELECT username, role FROM users WHERE email = ?').get('new@x.y');
    expect(row).toEqual({ username: 'created', role: 'user' });
    const audit = db.prepare("SELECT action FROM audit_log WHERE action = 'admin.user_create'").get();
    expect(audit).toBeDefined();
  });

  it('400 on user create with a weak password', async () => {
    const res = await request(server)
      .post('/api/admin/users')
      .set('Cookie', sessionCookie(1))
      .send({ username: 'weak', email: 'weak@x.y', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Password must be at least 8 characters' });
  });

  it('409 on a duplicate email', async () => {
    const res = await request(server)
      .post('/api/admin/users')
      .set('Cookie', sessionCookie(1))
      .send({ username: 'dupe', email: 'admin@example.test', password: 'Str0ng!Pass' });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'Email already taken' });
  });

  it('400 on a non-boolean feature toggle', async () => {
    // Post-ratchet: the inline typeof check is gone, so this is the pipe's
    // standard { error: 'field: message' } envelope.
    const res = await request(server)
      .put('/api/admin/places-photos')
      .set('Cookie', sessionCookie(1))
      .send({ enabled: 'yes' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'enabled: Invalid input: expected boolean, received string' });
  });

  it('places-photos toggle round-trips through app_settings', async () => {
    const off = await request(server)
      .put('/api/admin/places-photos')
      .set('Cookie', sessionCookie(1))
      .send({ enabled: false });
    expect(off.status).toBe(200);
    expect(db.prepare("SELECT value FROM app_settings WHERE key = 'places_photos_enabled'").get()).toEqual({
      value: 'false',
    });
    expect((await request(server).get('/api/admin/places-photos').set('Cookie', sessionCookie(1))).body).toEqual({
      enabled: false,
    });

    await request(server).put('/api/admin/places-photos').set('Cookie', sessionCookie(1)).send({ enabled: true });
    expect((await request(server).get('/api/admin/places-photos').set('Cookie', sessionCookie(1))).body).toEqual({
      enabled: true,
    });
  });

  it('GET /stats counts real rows', async () => {
    db.prepare("INSERT INTO trips (title, user_id) VALUES ('T', 1)").run();
    db.prepare('INSERT INTO places (trip_id) VALUES (1)').run();
    const res = await request(server).get('/api/admin/stats').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ totalTrips: 1, totalPlaces: 1, totalFiles: 0 });
    expect(res.body.totalUsers).toBeGreaterThanOrEqual(2);
  });

  it('invite create → list → delete round trip', async () => {
    const created = await request(server)
      .post('/api/admin/invites')
      .set('Cookie', sessionCookie(1))
      .send({ max_uses: 3 });
    expect(created.status).toBe(201);
    expect(created.body.invite.max_uses).toBe(3);
    expect(created.body.invite.created_by_name).toBe('admin');

    const listed = await request(server).get('/api/admin/invites').set('Cookie', sessionCookie(1));
    expect(listed.body.invites).toHaveLength(1);

    const del = await request(server)
      .delete(`/api/admin/invites/${created.body.invite.id}`)
      .set('Cookie', sessionCookie(1));
    expect(del.status).toBe(200);
    expect(db.prepare('SELECT COUNT(*) as c FROM invite_tokens').get()).toEqual({ c: 0 });
  });

  it('404 deleting an unknown invite', async () => {
    const res = await request(server).delete('/api/admin/invites/9999').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Invite not found' });
  });

  it('packing-template create → get → delete round trip', async () => {
    const created = await request(server)
      .post('/api/admin/packing-templates')
      .set('Cookie', sessionCookie(1))
      .send({ name: 'Beach' });
    expect(created.status).toBe(201);
    const id = created.body.template.id;

    const fetched = await request(server).get(`/api/admin/packing-templates/${id}`).set('Cookie', sessionCookie(1));
    expect(fetched.body.template.name).toBe('Beach');
    expect(fetched.body.categories).toEqual([]);

    expect(
      (await request(server).delete(`/api/admin/packing-templates/${id}`).set('Cookie', sessionCookie(1))).status,
    ).toBe(200);
    expect(db.prepare('SELECT COUNT(*) as c FROM packing_templates').get()).toEqual({ c: 0 });
  });

  it('GET /oidc reads app_settings defaults', async () => {
    const res = await request(server).get('/api/admin/oidc').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ issuer: '', client_id: '', client_secret_set: false });
  });

  it('GET /mcp-tokens and /oauth-sessions return empty lists', async () => {
    expect((await request(server).get('/api/admin/mcp-tokens').set('Cookie', sessionCookie(1))).body).toEqual({
      tokens: [],
    });
    expect((await request(server).get('/api/admin/oauth-sessions').set('Cookie', sessionCookie(1))).body).toEqual({
      sessions: [],
    });
  });

  it('404 on the dev-only test-notification outside development', async () => {
    const res = await request(server).post('/api/admin/dev/test-notification').set('Cookie', sessionCookie(1)).send({});
    expect(res.status).toBe(404);
  });
});
