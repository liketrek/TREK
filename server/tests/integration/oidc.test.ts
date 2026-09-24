/**
 * OIDC integration tests — OIDC-001 through OIDC-014.
 * Covers /api/auth/oidc/login, /callback, /exchange.
 * HTTP calls (discover, exchangeCodeForToken, getUserInfo, verifyIdToken) are
 * stubbed with vi.spyOn on the container's OidcService instance (the domain is
 * DI-native since the oidc fold — a services/oidcService path mock would
 * silently miss). State management, auth codes, and findOrCreateUser run for
 * real on that same instance against the real test DB.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import type { INestApplication } from '@nestjs/common';

// ── DB mock (inline vi.hoisted pattern) ──────────────────────────────────────

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: (tripId: any, userId: number) =>
      db.prepare(`SELECT t.id, t.user_id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)`).get(userId, tripId, userId),
    isOwner: (tripId: any, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../src/db/database', () => dbMock);
vi.mock('../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
  SESSION_DURATION: '24h',
  SESSION_DURATION_MS: 86400000,
  SESSION_DURATION_SECONDS: 86400,
  SESSION_DURATION_REMEMBER: '30d',
  SESSION_DURATION_REMEMBER_MS: 2592000000,
  SESSION_DURATION_REMEMBER_SECONDS: 2592000,
  DEFAULT_LANGUAGE: 'en',
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn(), broadcastToUser: vi.fn() }));

import type { MockInstance } from 'vitest';
import { buildApp } from '../../src/bootstrap';
import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import { createUser } from '../helpers/factories';
import { OidcService } from '../../src/nest/oidc/oidc.service';

/** Read one cookie's value out of a response's Set-Cookie header, as a browser would. */
function readCookie(res: request.Response, name: string): string | undefined {
  const raw = res.headers['set-cookie'];
  const all: string[] = Array.isArray(raw) ? raw : raw ? [raw as unknown as string] : [];
  const hit = all.filter((c) => c.startsWith(`${name}=`)).pop();
  const value = hit?.split(';')[0].slice(name.length + 1);
  // An expired clear-cookie carries an empty value; treat that as "gone".
  return value ? decodeURIComponent(value) : undefined;
}

const MOCK_DISCOVERY_DOC = {
  authorization_endpoint: 'https://oidc.example.com/auth',
  token_endpoint: 'https://oidc.example.com/token',
  userinfo_endpoint: 'https://oidc.example.com/userinfo',
};

let nestApp: INestApplication;
let app: Application;
let oidcSvc: OidcService;
let mockDiscover: MockInstance<OidcService['discover']>;
let mockExchangeCode: MockInstance<OidcService['exchangeCodeForToken']>;
let mockGetUserInfo: MockInstance<OidcService['getUserInfo']>;
let mockVerifyIdToken: MockInstance<OidcService['verifyIdToken']>;

beforeAll(async () => {
  createTables(testDb);
  runMigrations(testDb);
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
  // Stub only the HTTP-calling methods on the container's OidcService — the
  // default implementation resolves undefined so an unexpected call fails the
  // flow (matching the old vi.fn() mocks) instead of hitting the network.
  // Bypasses real JWKS fetch + signature verification: callers that exercise
  // the security of verifyIdToken unit-test the method directly; integration
  // tests here focus on the callback flow, not the crypto. State management,
  // auth codes, and findOrCreateUser run for real on this same instance.
  oidcSvc = nestApp.get(OidcService);
  mockDiscover = vi.spyOn(oidcSvc, 'discover').mockImplementation(async () => undefined as never);
  mockExchangeCode = vi.spyOn(oidcSvc, 'exchangeCodeForToken').mockImplementation(async () => undefined as never);
  mockGetUserInfo = vi.spyOn(oidcSvc, 'getUserInfo').mockImplementation(async () => undefined as never);
  mockVerifyIdToken = vi.spyOn(oidcSvc, 'verifyIdToken').mockImplementation(async () => undefined as never);
});

beforeEach(() => {
  resetTestDb(testDb);
  resetRateLimits(nestApp);
  vi.clearAllMocks();

  // Set OIDC environment variables for each test
  process.env.OIDC_ISSUER = 'https://oidc.example.com';
  process.env.OIDC_CLIENT_ID = 'test-client-id';
  process.env.OIDC_CLIENT_SECRET = 'test-client-secret';
  process.env.APP_URL = 'http://localhost:3001';
});

afterEach(() => {
  delete process.env.OIDC_ISSUER;
  delete process.env.OIDC_CLIENT_ID;
  delete process.env.OIDC_CLIENT_SECRET;
  delete process.env.APP_URL;
});

afterAll(async () => {
  await nestApp.close();
  testDb.close();
});

// ── /login ───────────────────────────────────────────────────────────────────

describe('GET /api/auth/oidc/login', () => {
  it('OIDC-001: redirects to OIDC authorization endpoint (302)', async () => {
    mockDiscover.mockResolvedValueOnce(MOCK_DISCOVERY_DOC);

    const res = await request(app).get('/api/auth/oidc/login');

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('https://oidc.example.com/auth');
    expect(res.headers.location).toContain('client_id=test-client-id');
    expect(res.headers.location).toContain('response_type=code');
    expect(res.headers.location).toContain('redirect_uri=');
    expect(res.headers.location).toContain('state=');
  });

  it('OIDC-002: returns 400 when OIDC is not configured', async () => {
    delete process.env.OIDC_ISSUER;
    delete process.env.OIDC_CLIENT_ID;
    delete process.env.OIDC_CLIENT_SECRET;

    const res = await request(app).get('/api/auth/oidc/login');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('OIDC-003: includes invite token in state when provided', async () => {
    mockDiscover.mockResolvedValueOnce(MOCK_DISCOVERY_DOC);

    const res = await request(app).get('/api/auth/oidc/login?invite=abc123');
    expect(res.status).toBe(302);
    // State is a hex token; the invite is embedded in pendingStates (internal)
    // We just verify the redirect happened successfully
    expect(res.headers.location).toContain('state=');
  });
});

// ── /callback ────────────────────────────────────────────────────────────────

describe('GET /api/auth/oidc/callback', () => {
  it('OIDC-004: valid code for existing user → redirects to frontend with oidc_code', async () => {
    const { user } = createUser(testDb, { email: 'alice@example.com' });

    mockDiscover.mockResolvedValueOnce(MOCK_DISCOVERY_DOC);
    mockExchangeCode.mockResolvedValueOnce({
      access_token: 'test-access-token',
      id_token: 'fake.id.token',
      _ok: true,
      _status: 200,
    });
    mockVerifyIdToken.mockResolvedValueOnce({ ok: true, claims: { sub: 'sub-alice-123' } });
    mockGetUserInfo.mockResolvedValueOnce({
      sub: 'sub-alice-123',
      email: 'alice@example.com',
      name: 'Alice',
      email_verified: true, // verified IdP — required to auto-link onto the existing account
    });

    // Create a valid state token
    const { state } = oidcSvc.createState('http://localhost:3001/api/auth/oidc/callback');

    const res = await request(app).get(`/api/auth/oidc/callback?code=authcode123&state=${state}`).set('Cookie', `trek_oidc_state=${state}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/login?oidc_code=');
  });

  it('OIDC-004b: a successful login writes the user.login row every other method writes (#2417)', async () => {
    const { user } = createUser(testDb, { email: 'audited@example.com' });
    mockDiscover.mockResolvedValueOnce(MOCK_DISCOVERY_DOC);
    mockExchangeCode.mockResolvedValueOnce({ access_token: 'test-access-token', id_token: 'fake.id.token', _ok: true, _status: 200 });
    mockVerifyIdToken.mockResolvedValueOnce({ ok: true, claims: { sub: 'sub-audited-1' } });
    mockGetUserInfo.mockResolvedValueOnce({ sub: 'sub-audited-1', email: 'audited@example.com', name: 'Audited', email_verified: true });
    const { state } = oidcSvc.createState('http://localhost:3001/api/auth/oidc/callback');

    const res = await request(app).get(`/api/auth/oidc/callback?code=authcode123&state=${state}`).set('Cookie', `trek_oidc_state=${state}`);

    expect(res.status).toBe(302);
    // The query from the report, against the same table.
    const rows = testDb.prepare('SELECT user_id, action, details FROM audit_log WHERE user_id = ? ORDER BY id DESC').all(user.id) as
      { user_id: number; action: string; details: string | null }[];
    expect(rows.map(r => r.action)).toContain('user.login');
    const login = rows.find(r => r.action === 'user.login')!;
    expect(JSON.parse(login.details || '{}')).toEqual({ method: 'oidc' });
    const counted = testDb.prepare('SELECT login_count FROM users WHERE id = ?').get(user.id) as { login_count: number };
    expect(counted.login_count).toBe(1);
  });

  it('OIDC-005: new user gets created when registration is open', async () => {
    mockDiscover.mockResolvedValueOnce(MOCK_DISCOVERY_DOC);
    mockExchangeCode.mockResolvedValueOnce({ access_token: 'new-token', id_token: 'fake.id.token', _ok: true, _status: 200 });
    mockVerifyIdToken.mockResolvedValueOnce({ ok: true, claims: { sub: 'sub-newuser-999' } });
    mockGetUserInfo.mockResolvedValueOnce({
      sub: 'sub-newuser-999',
      email: 'newuser@example.com',
      name: 'New User',
    });

    const { state } = oidcSvc.createState('http://localhost:3001/api/auth/oidc/callback');

    const res = await request(app).get(`/api/auth/oidc/callback?code=code999&state=${state}`).set('Cookie', `trek_oidc_state=${state}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/login?oidc_code=');

    // Verify user was created in DB
    const newUser = testDb.prepare("SELECT * FROM users WHERE email = 'newuser@example.com'").get() as { id: number; username: string; role: string } | undefined;
    expect(newUser).toBeDefined();
    // Registered, the way the audit log reports a password signup, and then logged in:
    // an admin reading user.register for who got an account sees the SSO ones too.
    const rows = testDb.prepare('SELECT action, details FROM audit_log WHERE user_id = ? ORDER BY id').all(newUser!.id) as
      { action: string; details: string | null }[];
    expect(rows.map(r => r.action)).toEqual(['user.register', 'user.login']);
    expect(JSON.parse(rows[0].details || '{}')).toEqual({ username: newUser!.username, email: 'newuser@example.com', role: newUser!.role, method: 'oidc' });
  });

  it('OIDC-006: invalid state → redirects with invalid_state error', async () => {
    const res = await request(app).get('/api/auth/oidc/callback?code=abc&state=invalid-state-xyz');

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('oidc_error=invalid_state');
  });

  it('OIDC-007: provider error param → redirects with error', async () => {
    const res = await request(app).get('/api/auth/oidc/callback?error=access_denied');

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('oidc_error=access_denied');
  });

  it('OIDC-008: missing code or state → redirects with missing_params error', async () => {
    const res = await request(app).get('/api/auth/oidc/callback');

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('oidc_error=missing_params');
  });

  it('OIDC-009: token exchange failure → redirects with token_failed error', async () => {
    mockDiscover.mockResolvedValueOnce(MOCK_DISCOVERY_DOC);
    mockExchangeCode.mockResolvedValueOnce({ _ok: false, _status: 400 });

    const { state } = oidcSvc.createState('http://localhost:3001/api/auth/oidc/callback');

    const res = await request(app).get(`/api/auth/oidc/callback?code=badcode&state=${state}`).set('Cookie', `trek_oidc_state=${state}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('oidc_error=token_failed');
  });

  it('OIDC-010a: missing id_token in token response → redirects with no_id_token error', async () => {
    mockDiscover.mockResolvedValueOnce(MOCK_DISCOVERY_DOC);
    mockExchangeCode.mockResolvedValueOnce({ access_token: 'tok', _ok: true, _status: 200 }); // no id_token

    const { state } = oidcSvc.createState('http://localhost:3001/api/auth/oidc/callback');

    const res = await request(app).get(`/api/auth/oidc/callback?code=anycode&state=${state}`).set('Cookie', `trek_oidc_state=${state}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('oidc_error=no_id_token');
  });

  it('OIDC-010b: verifyIdToken failure → redirects with id_token_invalid error', async () => {
    mockDiscover.mockResolvedValueOnce(MOCK_DISCOVERY_DOC);
    mockExchangeCode.mockResolvedValueOnce({ access_token: 'tok', id_token: 'bad.id.token', _ok: true, _status: 200 });
    mockVerifyIdToken.mockResolvedValueOnce({ ok: false, error: 'signature_or_claim_mismatch: invalid signature' });

    const { state } = oidcSvc.createState('http://localhost:3001/api/auth/oidc/callback');

    const res = await request(app).get(`/api/auth/oidc/callback?code=anycode&state=${state}`).set('Cookie', `trek_oidc_state=${state}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('oidc_error=id_token_invalid');
  });

  it('OIDC-010c: userinfo.sub does not match id_token.sub → redirects with subject_mismatch error', async () => {
    mockDiscover.mockResolvedValueOnce(MOCK_DISCOVERY_DOC);
    mockExchangeCode.mockResolvedValueOnce({ access_token: 'tok', id_token: 'fake.id.token', _ok: true, _status: 200 });
    mockVerifyIdToken.mockResolvedValueOnce({ ok: true, claims: { sub: 'sub-from-token' } });
    mockGetUserInfo.mockResolvedValueOnce({
      sub: 'sub-different-from-userinfo',
      email: 'alice@example.com',
      name: 'Alice',
    });

    const { state } = oidcSvc.createState('http://localhost:3001/api/auth/oidc/callback');

    const res = await request(app).get(`/api/auth/oidc/callback?code=anycode&state=${state}`).set('Cookie', `trek_oidc_state=${state}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('oidc_error=subject_mismatch');
  });

  it('OIDC-010: registration disabled for new user → redirects with registration_disabled error', async () => {
    // Need at least one existing user so isFirstUser=false
    createUser(testDb, { email: 'existing@example.com' });
    // Disable registration
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('allow_registration', 'false')").run();

    mockDiscover.mockResolvedValueOnce(MOCK_DISCOVERY_DOC);
    mockExchangeCode.mockResolvedValueOnce({ access_token: 'tok', id_token: 'fake.id.token', _ok: true, _status: 200 });
    mockVerifyIdToken.mockResolvedValueOnce({ ok: true, claims: { sub: 'sub-blocked-user' } });
    mockGetUserInfo.mockResolvedValueOnce({
      sub: 'sub-blocked-user',
      email: 'blocked@example.com',
      name: 'Blocked',
    });

    const { state } = oidcSvc.createState('http://localhost:3001/api/auth/oidc/callback');

    const res = await request(app).get(`/api/auth/oidc/callback?code=anycode&state=${state}`).set('Cookie', `trek_oidc_state=${state}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('oidc_error=registration_disabled');
  });
});

// ── /exchange ─────────────────────────────────────────────────────────────────

describe('GET /api/auth/oidc/exchange', () => {
  it('OIDC-011: valid auth code returns JWT and sets cookie', async () => {
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.sig';
    const { code, binding } = oidcSvc.createAuthCode(fakeToken);

    const res = await request(app)
      .get(`/api/auth/oidc/exchange?code=${code}`)
      .set('Cookie', `trek_oidc_exchange=${binding}`);

    expect(res.status).toBe(200);
    expect(res.body.token).toBe(fakeToken);
    expect(res.headers['set-cookie']).toBeDefined();
    const cookieHeader = Array.isArray(res.headers['set-cookie'])
      ? res.headers['set-cookie'].join(';')
      : res.headers['set-cookie'];
    expect(cookieHeader).toContain('trek_session');
  });

  it('OIDC-012: missing code returns 400', async () => {
    const res = await request(app).get('/api/auth/oidc/exchange');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('OIDC-013: invalid/expired code returns 400', async () => {
    const res = await request(app).get('/api/auth/oidc/exchange?code=not-a-real-code');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('OIDC-013b: a real code without its binding cookie returns 400 and buys nothing', async () => {
    const { code } = oidcSvc.createAuthCode('valid.but.unbound');

    const res = await request(app).get(`/api/auth/oidc/exchange?code=${code}`);

    expect(res.status).toBe(400);
    // Same wording as an unknown code: presenting a code must not confirm it exists.
    expect(res.body.error).toBe('Invalid or expired code');
    expect(readCookie(res, 'trek_session')).toBeUndefined();
  });

  it('OIDC-014: auth code is single-use (second use returns 400)', async () => {
    const fakeToken = 'test.token.here';
    const { code, binding } = oidcSvc.createAuthCode(fakeToken);
    const cookie = `trek_oidc_exchange=${binding}`;

    // First use: success
    const res1 = await request(app).get(`/api/auth/oidc/exchange?code=${code}`).set('Cookie', cookie);
    expect(res1.status).toBe(200);

    // Second use: rejected, even from the same browser
    const res2 = await request(app).get(`/api/auth/oidc/exchange?code=${code}`).set('Cookie', cookie);
    expect(res2.status).toBe(400);
  });
});

// ── remember-me across the full flow (#1927) ─────────────────────────────────

describe('OIDC remember-me (#1927)', () => {
  // Runs the real /login → /callback → /exchange chain, following the state the
  // controller minted, and returns the exchange response for cookie assertions.
  async function runFlow(loginQuery: string, sub: string, email: string) {
    mockDiscover.mockResolvedValue(MOCK_DISCOVERY_DOC);
    mockExchangeCode.mockResolvedValue({ access_token: 'tok', id_token: 'fake.id.token', _ok: true, _status: 200 });
    mockVerifyIdToken.mockResolvedValue({ ok: true, claims: { sub } });
    mockGetUserInfo.mockResolvedValue({ sub, email, name: 'Flow User' });

    const login = await request(app).get(`/api/auth/oidc/login${loginQuery}`);
    expect(login.status).toBe(302);
    const state = new URL(login.headers.location!).searchParams.get('state')!;

    const cb = await request(app)
      .get(`/api/auth/oidc/callback?code=anycode&state=${state}`)
      .set('Cookie', `trek_oidc_state=${state}`);
    expect(cb.status).toBe(302);
    const oidcCode = new URL(cb.headers.location!, 'http://localhost').searchParams.get('oidc_code')!;
    expect(oidcCode).toBeTruthy();
    // The browser carries the binding cookie the callback just set back to /exchange.
    const binding = readCookie(cb, 'trek_oidc_exchange')!;
    expect(binding).toBeTruthy();

    return request(app)
      .get(`/api/auth/oidc/exchange?code=${oidcCode}`)
      .set('Cookie', `trek_oidc_exchange=${binding}`);
  }

  function sessionCookie(res: request.Response): string {
    const cookies = Array.isArray(res.headers['set-cookie']) ? res.headers['set-cookie'] : [res.headers['set-cookie']];
    return cookies.filter((c: string) => c.startsWith('trek_session=')).pop()!;
  }

  it('OIDC-015: remember=1 issues a 30d JWT and a Max-Age=2592000 cookie', async () => {
    const res = await runFlow('?remember=1', 'sub-rm-1', 'rm1@example.com');
    expect(res.status).toBe(200);
    expect(sessionCookie(res)).toContain('Max-Age=2592000');
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(res.body.token) as { iat: number; exp: number };
    expect(decoded.exp - decoded.iat).toBe(2592000);
  });

  it('OIDC-016: remember=0 issues a browser-session cookie (no Max-Age) with the default JWT', async () => {
    const res = await runFlow('?remember=0', 'sub-rm-0', 'rm0@example.com');
    expect(res.status).toBe(200);
    const cookie = sessionCookie(res);
    expect(cookie).not.toContain('Max-Age=');
    expect(cookie).not.toContain('Expires=');
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(res.body.token) as { iat: number; exp: number };
    expect(decoded.exp - decoded.iat).toBe(86400);
  });

  it('OIDC-017: no remember param keeps the historical 24h persistent cookie', async () => {
    const res = await runFlow('', 'sub-rm-abs', 'rmabs@example.com');
    expect(res.status).toBe(200);
    expect(sessionCookie(res)).toContain('Max-Age=86400');
    // The JWT must not carry `remember: false` either — the sliding renewal
    // re-issues the cookie from that claim, and `false` would turn the
    // persistent default into a browser-session cookie half a day later.
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(res.body.token) as { remember?: boolean };
    expect(decoded.remember).toBeUndefined();
  });
});

// ── the auth code is bound to one browser (GHSA / session fixation) ───────────

describe('OIDC auth-code binding', () => {
  // Walks /login → /callback for one "browser" and hands back everything that
  // browser holds afterwards: the code out of the redirect URL, and the binding
  // cookie out of the callback response.
  async function loginUpToCallback(sub: string, email: string) {
    mockDiscover.mockResolvedValue(MOCK_DISCOVERY_DOC);
    mockExchangeCode.mockResolvedValue({ access_token: 'tok', id_token: 'fake.id.token', _ok: true, _status: 200 });
    mockVerifyIdToken.mockResolvedValue({ ok: true, claims: { sub } });
    mockGetUserInfo.mockResolvedValue({ sub, email, name: 'Binding User' });

    const login = await request(app).get('/api/auth/oidc/login');
    const state = new URL(login.headers.location!).searchParams.get('state')!;
    const cb = await request(app)
      .get(`/api/auth/oidc/callback?code=anycode&state=${state}`)
      .set('Cookie', `trek_oidc_state=${state}`);

    return {
      code: new URL(cb.headers.location!, 'http://localhost').searchParams.get('oidc_code')!,
      binding: readCookie(cb, 'trek_oidc_exchange'),
      response: cb,
    };
  }

  it('OIDC-018: /callback sets the binding as an httpOnly cookie that dies with the code', async () => {
    const { response } = await loginUpToCallback('sub-bind-1', 'bind1@example.com');

    const raw = (response.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('trek_oidc_exchange='))!;
    expect(raw).toMatch(/HttpOnly/i);
    expect(raw).toMatch(/SameSite=Lax/i);
    // Same minute the code lives; a cookie that outlived it could only ever fail.
    expect(raw).toContain('Max-Age=60;');
  });

  it('OIDC-019: a code captured in browser A is refused in browser B', async () => {
    // Browser A finishes the handshake. B is anything that only got to see the
    // URL: history on a shared machine, a referrer, a proxy log, a screen share.
    const a = await loginUpToCallback('sub-bind-2', 'bind2@example.com');

    const inB = await request(app).get(`/api/auth/oidc/exchange?code=${a.code}`);

    expect(inB.status).toBe(400);
    expect(readCookie(inB, 'trek_session')).toBeUndefined();
  });

  it('OIDC-020: the failed attempt burns the code, so a stolen code is never redeemable', async () => {
    const a = await loginUpToCallback('sub-bind-3', 'bind3@example.com');

    await request(app).get(`/api/auth/oidc/exchange?code=${a.code}`);
    // A retries with the right cookie and is refused too. Deliberate: a code that
    // someone else has already presented is treated as spent, and A only has to
    // log in again.
    const retryInA = await request(app)
      .get(`/api/auth/oidc/exchange?code=${a.code}`)
      .set('Cookie', `trek_oidc_exchange=${a.binding}`);

    expect(retryInA.status).toBe(400);
    expect(readCookie(retryInA, 'trek_session')).toBeUndefined();
  });

  it('OIDC-021: an attacker-minted code cannot be forced onto a victim browser', async () => {
    // The session-fixation direction: the attacker completes a real login as
    // themselves, then makes the victim's browser call /exchange with that code.
    // If it worked, the victim would be silently signed into the attacker's
    // account and would write their next trip into it.
    const attacker = await loginUpToCallback('sub-attacker', 'attacker@example.com');
    const victimHasHisOwnFlow = await loginUpToCallback('sub-victim', 'victim@example.com');

    const forced = await request(app)
      .get(`/api/auth/oidc/exchange?code=${attacker.code}`)
      // The victim's browser carries its own binding, never the attacker's.
      .set('Cookie', `trek_oidc_exchange=${victimHasHisOwnFlow.binding}`);

    expect(forced.status).toBe(400);
    expect(readCookie(forced, 'trek_session')).toBeUndefined();
  });

  it('OIDC-022: /exchange clears the binding cookie on the way out', async () => {
    const a = await loginUpToCallback('sub-bind-4', 'bind4@example.com');

    const ok = await request(app)
      .get(`/api/auth/oidc/exchange?code=${a.code}`)
      .set('Cookie', `trek_oidc_exchange=${a.binding}`);

    expect(ok.status).toBe(200);
    const cleared = (ok.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('trek_oidc_exchange='))!;
    expect(cleared).toContain('Expires=Thu, 01 Jan 1970');
  });
});
