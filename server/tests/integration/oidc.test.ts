/**
 * OIDC integration tests — OIDC-001 through OIDC-010.
 * Covers /api/auth/oidc/login, /callback, /exchange.
 * HTTP calls (discover, exchangeCodeForToken, getUserInfo) are mocked.
 * State management, auth codes, and findOrCreateUser run against the real test DB.
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
  DEFAULT_LANGUAGE: 'en',
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn(), broadcastToUser: vi.fn() }));

// ── Mock only the HTTP-calling functions from oidcService ────────────────────
vi.mock('../../src/services/oidcService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/oidcService')>();
  return {
    ...actual,
    discover: vi.fn(),
    exchangeCodeForToken: vi.fn(),
    getUserInfo: vi.fn(),
    // Bypass real JWKS fetch + signature verification in tests. Callers
    // that exercise the security of verifyIdToken should unit-test the
    // function directly instead; integration tests here focus on the
    // callback flow, not the crypto.
    verifyIdToken: vi.fn(),
  };
});

import { buildApp } from '../../src/bootstrap';
import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import { createUser } from '../helpers/factories';
import * as oidcService from '../../src/services/oidcService';

const mockDiscover = vi.mocked(oidcService.discover);
const mockExchangeCode = vi.mocked(oidcService.exchangeCodeForToken);
const mockGetUserInfo = vi.mocked(oidcService.getUserInfo);
const mockVerifyIdToken = vi.mocked(oidcService.verifyIdToken);

const MOCK_DISCOVERY_DOC = {
  authorization_endpoint: 'https://oidc.example.com/auth',
  token_endpoint: 'https://oidc.example.com/token',
  userinfo_endpoint: 'https://oidc.example.com/userinfo',
};

let nestApp: INestApplication;
let app: Application;

beforeAll(async () => {
  createTables(testDb);
  runMigrations(testDb);
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
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
    const { state } = oidcService.createState('http://localhost:3001/api/auth/oidc/callback');

    const res = await request(app).get(`/api/auth/oidc/callback?code=authcode123&state=${state}`).set('Cookie', `trek_oidc_state=${state}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/login?oidc_code=');
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

    const { state } = oidcService.createState('http://localhost:3001/api/auth/oidc/callback');

    const res = await request(app).get(`/api/auth/oidc/callback?code=code999&state=${state}`).set('Cookie', `trek_oidc_state=${state}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/login?oidc_code=');

    // Verify user was created in DB
    const newUser = testDb.prepare("SELECT * FROM users WHERE email = 'newuser@example.com'").get();
    expect(newUser).toBeDefined();
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

    const { state } = oidcService.createState('http://localhost:3001/api/auth/oidc/callback');

    const res = await request(app).get(`/api/auth/oidc/callback?code=badcode&state=${state}`).set('Cookie', `trek_oidc_state=${state}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('oidc_error=token_failed');
  });

  it('OIDC-010a: missing id_token in token response → redirects with no_id_token error', async () => {
    mockDiscover.mockResolvedValueOnce(MOCK_DISCOVERY_DOC);
    mockExchangeCode.mockResolvedValueOnce({ access_token: 'tok', _ok: true, _status: 200 }); // no id_token

    const { state } = oidcService.createState('http://localhost:3001/api/auth/oidc/callback');

    const res = await request(app).get(`/api/auth/oidc/callback?code=anycode&state=${state}`).set('Cookie', `trek_oidc_state=${state}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('oidc_error=no_id_token');
  });

  it('OIDC-010b: verifyIdToken failure → redirects with id_token_invalid error', async () => {
    mockDiscover.mockResolvedValueOnce(MOCK_DISCOVERY_DOC);
    mockExchangeCode.mockResolvedValueOnce({ access_token: 'tok', id_token: 'bad.id.token', _ok: true, _status: 200 });
    mockVerifyIdToken.mockResolvedValueOnce({ ok: false, error: 'signature_or_claim_mismatch: invalid signature' });

    const { state } = oidcService.createState('http://localhost:3001/api/auth/oidc/callback');

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

    const { state } = oidcService.createState('http://localhost:3001/api/auth/oidc/callback');

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

    const { state } = oidcService.createState('http://localhost:3001/api/auth/oidc/callback');

    const res = await request(app).get(`/api/auth/oidc/callback?code=anycode&state=${state}`).set('Cookie', `trek_oidc_state=${state}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('oidc_error=registration_disabled');
  });
});

// ── /exchange ─────────────────────────────────────────────────────────────────

describe('GET /api/auth/oidc/exchange', () => {
  it('OIDC-011: valid auth code returns JWT and sets cookie', async () => {
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.sig';
    const code = oidcService.createAuthCode(fakeToken);

    const res = await request(app).get(`/api/auth/oidc/exchange?code=${code}`);

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

  it('OIDC-014: auth code is single-use (second use returns 400)', async () => {
    const fakeToken = 'test.token.here';
    const code = oidcService.createAuthCode(fakeToken);

    // First use: success
    const res1 = await request(app).get(`/api/auth/oidc/exchange?code=${code}`);
    expect(res1.status).toBe(200);

    // Second use: rejected
    const res2 = await request(app).get(`/api/auth/oidc/exchange?code=${code}`);
    expect(res2.status).toBe(400);
  });
});
