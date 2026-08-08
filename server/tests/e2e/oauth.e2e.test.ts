/**
 * OAuth e2e — exercises the migrated /oauth/* and /api/oauth/* endpoints through
 * the real JwtAuthGuard / CookieAuthGuard / OptionalJwtGuard against a temp
 * SQLite db. The OAuth service + addon gate are mocked; this focuses on the
 * public token/userinfo guards, the MCP 404/403 gates, and the cookie-only auth
 * on the management endpoints (a Bearer must NOT satisfy them).
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { seedUser, sessionCookie, signSession } from './harness';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0);`);
  // AuditService now runs its real INSERT (DI-injected, no mock) — slim
  // audit_log mirror (no FKs), same shape as plugin-runtime.test.ts.
  tmp.exec(`CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER, action TEXT NOT NULL, resource TEXT, details TEXT, ip TEXT);`);
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({ db, closeDb: () => {}, reinitialize: () => {} }));
// The audit domain is DI-native now: writeAudit runs for real against the temp
// db's audit_log table; only the file logger is silenced.
vi.mock('../../src/nest/audit/audit-log.logger', () => ({ LOG_LEVEL: 'error', logInfo: vi.fn(), logDebug: vi.fn(), logError: vi.fn(), logWarn: vi.fn() }));
vi.mock('../../src/app-config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/app-config')>();
  return { ...actual, getMcpSafeUrl: () => 'https://app' };
});

const { isAddonEnabled } = vi.hoisted(() => ({ isAddonEnabled: vi.fn(() => true) }));

// Stubbed at the provider, not the module path: the domain folded into
// OauthService, so there is no legacy module left to vi.mock. Same six cases,
// same assertions — these pin the guard/gate layer, not the OAuth logic.
const { oauthSvc } = vi.hoisted(() => ({
  oauthSvc: {
    validateAuthorizeRequest: vi.fn(), createAuthCode: vi.fn(), consumeAuthCode: vi.fn(), saveConsent: vi.fn(),
    issueTokens: vi.fn(), issueClientCredentialsToken: vi.fn(), refreshTokens: vi.fn(), revokeToken: vi.fn(),
    verifyPKCE: vi.fn(), authenticateClient: vi.fn(), listOAuthClients: vi.fn(), createOAuthClient: vi.fn(),
    deleteOAuthClient: vi.fn(), rotateOAuthClientSecret: vi.fn(), listOAuthSessions: vi.fn(), revokeSession: vi.fn(),
    getUserByAccessToken: vi.fn(),
  },
}));

import { OauthModule } from '../../src/nest/oauth/oauth.module';
import { OauthService } from '../../src/nest/oauth/oauth.service';
import { AddonsService } from '../../src/nest/addons/addons.service';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('OAuth e2e (real guards + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule, OauthModule] })
      .overrideProvider(AddonsService)
      .useValue({ isAddonEnabled })
      .overrideProvider(OauthService)
      .useValue({ ...oauthSvc, mcpEnabled: () => isAddonEnabled(), mcpSafeUrl: () => 'https://mcp.test' })
      .compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    seedUser(db as never, { id: 1 });
    app = await build();
    server = app.getHttpServer();
    oauthSvc.listOAuthClients.mockReturnValue([{ id: 'c1' }]);
  });

  beforeEach(() => { isAddonEnabled.mockReturnValue(true); });

  afterAll(async () => {
    await app.close();
  });

  it('POST /oauth/token is public — 401 invalid_client without client_id', async () => {
    const res = await request(server).post('/oauth/token').send({});
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'invalid_client', error_description: 'client_id is required' });
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('POST /oauth/token 404 (empty) when MCP is disabled', async () => {
    isAddonEnabled.mockReturnValue(false);
    const res = await request(server).post('/oauth/token').send({ client_id: 'c' });
    expect(res.status).toBe(404);
    expect(res.text).toBe('');
  });

  it('GET /oauth/userinfo 401 with a WWW-Authenticate challenge', async () => {
    const res = await request(server).get('/oauth/userinfo');
    expect(res.status).toBe(401);
    expect(res.headers['www-authenticate']).toContain('Bearer');
  });

  it('GET /api/oauth/clients 401 without a session', async () => {
    expect((await request(server).get('/api/oauth/clients')).status).toBe(401);
  });

  it('GET /api/oauth/clients works with a Bearer (authenticate) session', async () => {
    const res = await request(server).get('/api/oauth/clients').set('Authorization', `Bearer ${signSession(1)}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ clients: [{ id: 'c1' }] });
  });

  it('POST /api/oauth/clients requires a COOKIE session (a Bearer is rejected)', async () => {
    const bearer = await request(server).post('/api/oauth/clients').set('Authorization', `Bearer ${signSession(1)}`).send({ name: 'CLI', allowed_scopes: ['a'] });
    expect(bearer.status).toBe(401);
    expect(bearer.body).toEqual({ error: 'Cookie session required for this endpoint', code: 'COOKIE_AUTH_REQUIRED' });

    oauthSvc.createOAuthClient.mockReturnValue({ client_id: 'c1', client_secret: 's' });
    const cookie = await request(server).post('/api/oauth/clients').set('Cookie', sessionCookie(1)).send({ name: 'CLI', allowed_scopes: ['a'] });
    expect(cookie.status).toBe(201);
    expect(cookie.body).toEqual({ client_id: 'c1', client_secret: 's' });
  });
});
