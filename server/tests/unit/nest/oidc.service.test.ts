/**
 * Unit tests for the DI-native OidcService — OIDC-SVC-001 through OIDC-SVC-054
 * (moved 1:1 from the legacy tests/unit/services/oidcService.test.ts with case
 * IDs preserved; 046–048 carry over the wrapper cases from the superseded
 * delegation-shim suite; 049–054 pin the post-fold `fix(server)` quirk fixes —
 * fetch timeout/validation, per-URL discovery cache, userinfo ok-check, the
 * no_email guard and the post-insert re-select). Covers state management,
 * auth codes, role resolution, findOrCreateUser, discover caching, and the
 * ReDoS-sensitive issuer trailing-slash regex. Constructed directly (no
 * TestingModule, repo convention) over a real in-memory SQLite database.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll, afterEach } from 'vitest';
import { generateKeyPairSync } from 'crypto';
import jwtLib from 'jsonwebtoken';

// ── DB setup ──────────────────────────────────────────────────────────────────

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
      db.prepare(`
        SELECT t.id, t.user_id FROM trips t
        LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
        WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)
      `).get(userId, tripId, userId),
    isOwner: (tripId: any, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  SESSION_DURATION_SECONDS: 86400,
  SESSION_DURATION_REMEMBER_SECONDS: 2592000,
  updateJwtSecret: () => {},
}));

// Construction insurance for the injected AuthService's import graph (same set
// as auth.service.test.ts) — TripMembershipService is deliberately the real one,
// not a stub: OIDC-SVC-045 asserts the actual trip_members row a trip-bound
// invite creates.
vi.mock('../../../src/nest/common/crypto/mfaCrypto', () => ({
  encryptMfaSecret: vi.fn((s) => `enc:${s}`),
  decryptMfaSecret: vi.fn((s: string) => s.replace('enc:', '')),
}));
vi.mock('../../../src/nest/common/crypto/apiKeyCrypto', () => ({
  decrypt_api_key: vi.fn((v) => v),
  maybe_encrypt_api_key: vi.fn((v) => v),
  mask_stored_api_key: vi.fn((v: string | null | undefined) => (v ? '••••••••' : null)),
  encrypt_api_key: vi.fn((v) => v),
}));
vi.mock('../../../src/nest/auth/ephemeral-tokens', () => ({ createEphemeralToken: vi.fn() }));
vi.mock('../../../src/mcp/sessionManager', () => ({ revokeUserSessions: vi.fn() }));
// The four provider calls go through the SSRF guard now (link-local and the
// cloud-metadata range are refused, every redirect hop re-checked). These tests
// exercise OIDC logic, not the guard, so the guard delegates to whatever fetch
// the case stubbed — and OIDC-SVC-SSRF-001 below pins that it is really there.
vi.mock('../../../src/utils/ssrfGuard', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/utils/ssrfGuard')>();
  return {
    ...actual,
    safeFetchAdminConfigured: vi.fn((url: string, init?: RequestInit) => fetch(url, init)),
  };
});


const { getAppUrlMock } = vi.hoisted(() => ({ getAppUrlMock: vi.fn() }));
vi.mock('../../../src/app-config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/app-config')>();
  return { ...actual, getAppUrl: getAppUrlMock };
});

const { setAuthCookieMock } = vi.hoisted(() => ({ setAuthCookieMock: vi.fn() }));
vi.mock('../../../src/nest/common/cookie', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/nest/common/cookie')>();
  return { ...actual, setAuthCookie: setAuthCookieMock };
});

import type { Request, Response } from 'express';
import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip } from '../../helpers/factories';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { BudgetService } from '../../../src/nest/budget/budget.service';
import { ExchangeRatesService } from '../../../src/nest/budget/exchange-rates.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { TripMembershipService } from '../../../src/nest/trip-membership/trip-membership.service';
import { AuthService } from '../../../src/nest/auth/auth.service';
import { WebauthnConfigService } from '../../../src/nest/auth/webauthn-config.service';
import { UserCleanupService } from '../../../src/nest/auth/user-cleanup.service';
import { EphemeralTokenService } from '../../../src/nest/auth/ephemeral-token.service';
import { AllowedFileTypesService } from '../../../src/nest/files/allowed-file-types.service';
import { OidcService } from '../../../src/nest/oidc/oidc.service';
import { MailerService } from '../../../src/nest/notifications/mailer/mailer.service';

// MailerService is injected since the notifications fold — a stub instead of a
// module mock. sendPasswordResetEmail is the only thing auth reaches for.
const mailerStub = { sendPasswordResetEmail: vi.fn() } as unknown as MailerService;

const membership = new TripMembershipService(new DatabaseService(testDb));
// Positional, and previously shifted by one: an AtlasService sat in the membership
// slot, which AuthService no longer takes at all, so webauthn/userCleanup/mailer
// each landed one place too late and the EphemeralTokenService was missing
// entirely. Nothing failed, because no case below reaches those collaborators.
const auth = new AuthService(
  new DatabaseService(testDb),
  new PermissionsService(new DatabaseService(testDb)),
  membership,
  new WebauthnConfigService(new DatabaseService(testDb)),
  new UserCleanupService(new DatabaseService(testDb), new BudgetService(new DatabaseService(testDb), new PermissionsService(new DatabaseService(testDb)), new ExchangeRatesService(), new RealtimeService())),
  mailerStub,
  new EphemeralTokenService(),
  new AllowedFileTypesService(new DatabaseService(testDb)),
);
const svc = new OidcService(new DatabaseService(testDb), auth, membership);

const MOCK_CONFIG = {
  issuer: 'https://oidc.example.com',
  clientId: 'client-id',
  clientSecret: 'client-secret',
  displayName: 'SSO',
  discoveryUrl: null,
};

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  delete process.env.OIDC_ADMIN_VALUE;
  delete process.env.OIDC_ADMIN_CLAIM;
  delete process.env.NODE_ENV;
});

afterAll(() => {
  vi.unstubAllGlobals();
  svc.onModuleDestroy();
  testDb.close();
});

// ── createState / consumeState ────────────────────────────────────────────────

describe('createState / consumeState', () => {
  it('OIDC-SVC-001: createState returns a hex token + PKCE S256 challenge', () => {
    const { state, codeChallenge } = svc.createState('https://example.com/callback');
    expect(state).toMatch(/^[0-9a-f]{64}$/);
    expect(codeChallenge).toMatch(/^[A-Za-z0-9_-]{43}$/); // base64url SHA-256, no padding
  });

  it('OIDC-SVC-002: consumeState returns stored data (incl. verifier) and deletes state', () => {
    const { state } = svc.createState('https://example.com/callback', 'invite-abc');
    const data = svc.consumeState(state);
    expect(data).not.toBeNull();
    expect(data!.redirectUri).toBe('https://example.com/callback');
    expect(data!.inviteToken).toBe('invite-abc');
    expect(typeof data!.codeVerifier).toBe('string');
    expect(data!.codeVerifier.length).toBeGreaterThan(20);
    // State is consumed — second call returns null
    expect(svc.consumeState(state)).toBeNull();
  });

  it('OIDC-SVC-003: consumeState returns null for unknown state', () => {
    expect(svc.consumeState('not-a-real-state')).toBeNull();
  });

  it('OIDC-SVC-055: createState stores the remember flag and consumeState returns it', () => {
    const { state: sTrue } = svc.createState('https://example.com/cb', undefined, true);
    const { state: sFalse } = svc.createState('https://example.com/cb', undefined, false);
    const { state: sAbsent } = svc.createState('https://example.com/cb');
    expect(svc.consumeState(sTrue)!.remember).toBe(true);
    expect(svc.consumeState(sFalse)!.remember).toBe(false);
    expect(svc.consumeState(sAbsent)!.remember).toBeUndefined();
  });

  it('OIDC-SVC-004: two different states do not conflict', () => {
    const { state: s1 } = svc.createState('http://a.example.com');
    const { state: s2 } = svc.createState('http://b.example.com');
    expect(s1).not.toBe(s2);
    expect(svc.consumeState(s1)!.redirectUri).toBe('http://a.example.com');
    expect(svc.consumeState(s2)!.redirectUri).toBe('http://b.example.com');
  });
});

// ── createAuthCode / consumeAuthCode ─────────────────────────────────────────

describe('createAuthCode / consumeAuthCode', () => {
  it('OIDC-SVC-005: createAuthCode returns a UUID-like string', () => {
    const code = svc.createAuthCode('my.jwt.token');
    expect(typeof code).toBe('string');
    expect(code.length).toBeGreaterThan(0);
  });

  it('OIDC-SVC-006: consumeAuthCode returns the stored token', () => {
    const code = svc.createAuthCode('real.jwt.here');
    const result = svc.consumeAuthCode(code);
    expect('token' in result).toBe(true);
    expect((result as { token: string }).token).toBe('real.jwt.here');
  });

  it('OIDC-SVC-007: auth code is single-use (second consume returns error)', () => {
    const code = svc.createAuthCode('single.use.token');
    svc.consumeAuthCode(code); // first use
    const second = svc.consumeAuthCode(code);
    expect('error' in second).toBe(true);
  });

  it('OIDC-SVC-008: consumeAuthCode returns error for unknown code', () => {
    const result = svc.consumeAuthCode('not-a-real-code');
    expect('error' in result).toBe(true);
  });

  it('OIDC-SVC-056: auth code round-trips the remember flag', () => {
    const cTrue = svc.createAuthCode('t1', true);
    const cFalse = svc.createAuthCode('t2', false);
    const cAbsent = svc.createAuthCode('t3');
    expect((svc.consumeAuthCode(cTrue) as { remember?: boolean }).remember).toBe(true);
    expect((svc.consumeAuthCode(cFalse) as { remember?: boolean }).remember).toBe(false);
    expect((svc.consumeAuthCode(cAbsent) as { remember?: boolean }).remember).toBeUndefined();
  });
});

// ── generateToken ─────────────────────────────────────────────────────────────

describe('generateToken', () => {
  it('OIDC-SVC-057: remember=true signs with the SESSION_DURATION_REMEMBER lifetime', () => {
    const { user } = createUser(testDb, { email: 'remember@example.com' });
    const token = svc.generateToken({ id: user.id }, true);
    const decoded = jwtLib.decode(token) as { iat: number; exp: number };
    expect(decoded.exp - decoded.iat).toBe(2592000);
  });

  it('OIDC-SVC-058: remember=false or absent signs with the default SESSION_DURATION lifetime', () => {
    const { user } = createUser(testDb, { email: 'default@example.com' });
    for (const token of [svc.generateToken({ id: user.id }, false), svc.generateToken({ id: user.id })]) {
      const decoded = jwtLib.decode(token) as { iat: number; exp: number };
      expect(decoded.exp - decoded.iat).toBe(86400);
    }
  });
});

// ── resolveOidcRole ───────────────────────────────────────────────────────────

describe('resolveOidcRole', () => {
  it('OIDC-SVC-009: returns admin when isFirstUser is true', () => {
    expect(svc.resolveOidcRole({ sub: 'x' }, true)).toBe('admin');
  });

  it('OIDC-SVC-010: returns user when no OIDC_ADMIN_VALUE is set', () => {
    delete process.env.OIDC_ADMIN_VALUE;
    expect(svc.resolveOidcRole({ sub: 'x', groups: ['admins'] }, false)).toBe('user');
  });

  it('OIDC-SVC-011: returns admin when groups array contains OIDC_ADMIN_VALUE', () => {
    process.env.OIDC_ADMIN_VALUE = 'trek-admins';
    expect(svc.resolveOidcRole({ sub: 'x', groups: ['trek-users', 'trek-admins'] }, false)).toBe('admin');
  });

  it('OIDC-SVC-012: returns user when groups array does not contain OIDC_ADMIN_VALUE', () => {
    process.env.OIDC_ADMIN_VALUE = 'trek-admins';
    expect(svc.resolveOidcRole({ sub: 'x', groups: ['trek-users'] }, false)).toBe('user');
  });

  it('OIDC-SVC-013: uses custom OIDC_ADMIN_CLAIM when set', () => {
    process.env.OIDC_ADMIN_VALUE = 'superadmin';
    process.env.OIDC_ADMIN_CLAIM = 'roles';
    expect(svc.resolveOidcRole({ sub: 'x', roles: ['superadmin', 'editor'] }, false)).toBe('admin');
  });

  it('OIDC-SVC-014: handles string claim (exact match)', () => {
    process.env.OIDC_ADMIN_VALUE = 'admin';
    process.env.OIDC_ADMIN_CLAIM = 'role';
    expect(svc.resolveOidcRole({ sub: 'x', role: 'admin' }, false)).toBe('admin');
    expect(svc.resolveOidcRole({ sub: 'x', role: 'editor' }, false)).toBe('user');
  });
});

// ── frontendUrl ───────────────────────────────────────────────────────────────

describe('frontendUrl', () => {
  it('OIDC-SVC-015: prepends localhost:5173 in non-production', () => {
    delete process.env.NODE_ENV;
    expect(svc.frontendUrl('/login?oidc_code=abc')).toBe('http://localhost:5173/login?oidc_code=abc');
  });

  it('OIDC-SVC-016: returns bare path in production', () => {
    process.env.NODE_ENV = 'production';
    expect(svc.frontendUrl('/login?oidc_code=abc')).toBe('/login?oidc_code=abc');
    delete process.env.NODE_ENV;
  });
});

// ── discover ──────────────────────────────────────────────────────────────────

describe('discover', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('OIDC-SVC-017: fetches and returns discovery document', async () => {
    const doc = {
      authorization_endpoint: 'https://oidc.example.com/auth',
      token_endpoint: 'https://oidc.example.com/token',
      userinfo_endpoint: 'https://oidc.example.com/userinfo',
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => doc,
    }));

    // Use unique issuer to bypass the instance-level cache from other tests
    const result = await svc.discover('https://unique-1.example.com');
    expect(result.authorization_endpoint).toBe(doc.authorization_endpoint);
    expect(result.token_endpoint).toBe(doc.token_endpoint);
  });

  it('OIDC-SVC-018: throws when provider returns non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    await expect(svc.discover('https://bad-issuer.example.com')).rejects.toThrow();
  });

  it('OIDC-SVC-037: accepts mismatched doc issuer when discoveryUrl is explicit', async () => {
    const doc = {
      issuer: 'https://auth.example.com/application/o/myapp/',
      authorization_endpoint: 'https://auth.example.com/application/o/myapp/authorize/',
      token_endpoint: 'https://auth.example.com/application/o/token/',
      userinfo_endpoint: 'https://auth.example.com/application/o/userinfo/',
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => doc }));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await svc.discover(
      'https://auth.example.com',
      'https://auth.example.com/application/o/myapp/.well-known/openid-configuration',
    );

    expect(result.issuer).toBe(doc.issuer);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('differs from configured OIDC_ISSUER'));
    warnSpy.mockRestore();
  });

  it('OIDC-SVC-038: throws on mismatched doc issuer when discoveryUrl is omitted', async () => {
    const doc = {
      issuer: 'https://evil.example.com',
      authorization_endpoint: 'https://unique-2.example.com/auth',
      token_endpoint: 'https://unique-2.example.com/token',
      userinfo_endpoint: 'https://unique-2.example.com/userinfo',
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => doc }));

    await expect(svc.discover('https://unique-2.example.com')).rejects.toThrow(
      'OIDC discovery issuer mismatch',
    );
  });

  it('OIDC-SVC-049: passes an abort-signal timeout to the discovery fetch', async () => {
    const doc = {
      authorization_endpoint: 'https://unique-t.example.com/auth',
      token_endpoint: 'https://unique-t.example.com/token',
      userinfo_endpoint: 'https://unique-t.example.com/userinfo',
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => doc }));

    await svc.discover('https://unique-t.example.com');

    const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(fetchCall[1].signal).toBeInstanceOf(AbortSignal);
  });

  it('OIDC-SVC-050: rejects a discovery document missing the required endpoints', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ foo: 'bar' }) }));
    await expect(svc.discover('https://unique-bad.example.com')).rejects.toThrow(
      'Invalid OIDC discovery document',
    );
  });

  it('OIDC-SVC-051: caches per discovery URL — two issuers do not thrash each other', async () => {
    const docFor = (base: string) => ({
      authorization_endpoint: `${base}/auth`,
      token_endpoint: `${base}/token`,
      userinfo_endpoint: `${base}/userinfo`,
      issuer: base,
    });
    const fetchMock = vi.fn((url: string) => {
      const base = url.replace('/.well-known/openid-configuration', '');
      return Promise.resolve({ ok: true, json: async () => docFor(base) });
    });
    vi.stubGlobal('fetch', fetchMock);

    await svc.discover('https://unique-3.example.com');
    await svc.discover('https://unique-4.example.com');
    const again3 = await svc.discover('https://unique-3.example.com');
    const again4 = await svc.discover('https://unique-4.example.com');

    // One network round-trip per URL — the second pair served from cache.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(again3.issuer).toBe('https://unique-3.example.com');
    expect(again4.issuer).toBe('https://unique-4.example.com');
  });

  it('OIDC-SVC-039: trailing-slash-only mismatch with explicit discoveryUrl does not warn', async () => {
    const doc = {
      issuer: 'https://auth.example.com/',
      authorization_endpoint: 'https://auth.example.com/auth',
      token_endpoint: 'https://auth.example.com/token',
      userinfo_endpoint: 'https://auth.example.com/userinfo',
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => doc }));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await svc.discover(
      'https://auth.example.com',
      'https://auth.example.com/.well-known/openid-configuration',
    );

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

// ── issuer trailing-slash regex (ReDoS guard) ─────────────────────────────────

describe('getOidcConfig issuer trailing-slash regex', () => {
  it('OIDC-SVC-019: /\\/+$/ strips trailing slashes in < 5ms', () => {
    // The regex /\/+$/ in getOidcConfig: issuer.replace(/\/+$/, '')
    // Adversarial input: many trailing slashes — should not backtrack catastrophically
    const adversarial = 'https://oidc.example.com' + '/'.repeat(10000);
    const start = Date.now();
    const result = adversarial.replace(/\/+$/, '');
    const elapsed = Date.now() - start;
    expect(result).toBe('https://oidc.example.com');
    expect(elapsed).toBeLessThan(100);
  });
});

// ── findOrCreateUser ──────────────────────────────────────────────────────────

describe('findOrCreateUser', () => {
  it('OIDC-SVC-020: finds existing user by oidc_sub', () => {
    const { user } = createUser(testDb, { email: 'alice@example.com' });
    // Link the sub manually
    testDb.prepare('UPDATE users SET oidc_sub = ?, oidc_issuer = ? WHERE id = ?')
      .run('sub-alice-123', MOCK_CONFIG.issuer, user.id);

    const result = svc.findOrCreateUser(
      { sub: 'sub-alice-123', email: 'alice@example.com', name: 'Alice' },
      MOCK_CONFIG
    );
    expect('user' in result).toBe(true);
    expect((result as { user: any }).user.id).toBe(user.id);
  });

  it('OIDC-SVC-021: finds existing user by email when no sub match', () => {
    const { user } = createUser(testDb, { email: 'bob@example.com' });

    const result = svc.findOrCreateUser(
      { sub: 'sub-bob-new', email: 'bob@example.com', name: 'Bob', email_verified: true },
      MOCK_CONFIG
    );
    expect('user' in result).toBe(true);
    expect((result as { user: any }).user.id).toBe(user.id);
  });

  it('OIDC-SVC-022: creates new user when registration is open', () => {
    const result = svc.findOrCreateUser(
      { sub: 'sub-new-1', email: 'newuser@example.com', name: 'New User' },
      MOCK_CONFIG
    );
    expect('user' in result).toBe(true);
    const newUser = testDb.prepare("SELECT * FROM users WHERE email = 'newuser@example.com'").get();
    expect(newUser).toBeDefined();
  });

  it('OIDC-SVC-023: first user gets admin role', () => {
    // DB is empty after resetTestDb
    const result = svc.findOrCreateUser(
      { sub: 'sub-first', email: 'first@example.com', name: 'First' },
      MOCK_CONFIG
    );
    expect('user' in result).toBe(true);
    expect((result as { user: any }).user.role).toBe('admin');
  });

  it('OIDC-SVC-024: returns registration_disabled error when registration is off', () => {
    createUser(testDb, { email: 'existing@example.com' });
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('allow_registration', 'false')").run();

    const result = svc.findOrCreateUser(
      { sub: 'sub-blocked', email: 'blocked@example.com', name: 'Blocked' },
      MOCK_CONFIG
    );
    expect('error' in result).toBe(true);
    expect((result as { error: string }).error).toBe('registration_disabled');
  });

  it('OIDC-SVC-025: links oidc_sub when existing user has none (verified email)', () => {
    const { user } = createUser(testDb, { email: 'charlie@example.com' });
    // Ensure no oidc_sub set
    testDb.prepare('UPDATE users SET oidc_sub = NULL, oidc_issuer = NULL WHERE id = ?').run(user.id);

    svc.findOrCreateUser(
      { sub: 'sub-charlie-linked', email: 'charlie@example.com', name: 'Charlie', email_verified: true },
      MOCK_CONFIG
    );

    const updated = testDb.prepare('SELECT oidc_sub FROM users WHERE id = ?').get(user.id) as any;
    expect(updated.oidc_sub).toBe('sub-charlie-linked');
  });

  it('OIDC-SVC-025b: refuses to link an unverified email to an existing local account', () => {
    const { user } = createUser(testDb, { email: 'dora@example.com' });
    testDb.prepare('UPDATE users SET oidc_sub = NULL, oidc_issuer = NULL WHERE id = ?').run(user.id);

    // No email_verified claim — an IdP that lets users set arbitrary emails must
    // not be able to take over a pre-existing password account.
    const result = svc.findOrCreateUser(
      { sub: 'sub-dora-attacker', email: 'dora@example.com', name: 'Dora' },
      MOCK_CONFIG
    );

    expect('error' in result).toBe(true);
    expect((result as { error: string }).error).toBe('email_not_verified');
    const updated = testDb.prepare('SELECT oidc_sub FROM users WHERE id = ?').get(user.id) as any;
    expect(updated.oidc_sub).toBeNull(); // account not linked / not hijacked
  });

  it('OIDC-SVC-026: existing user role is updated when OIDC claim mapping changes it', () => {
    const { user } = createUser(testDb, { email: 'diana@example.com', role: 'user' });
    // Link oidc_sub manually so the user is found by sub lookup
    testDb.prepare('UPDATE users SET oidc_sub = ?, oidc_issuer = ? WHERE id = ?')
      .run('sub-diana-role', MOCK_CONFIG.issuer, user.id);

    process.env.OIDC_ADMIN_VALUE = 'admins';

    const result = svc.findOrCreateUser(
      { sub: 'sub-diana-role', email: 'diana@example.com', name: 'Diana', groups: ['admins'] },
      MOCK_CONFIG
    );

    expect('user' in result).toBe(true);
    expect((result as { user: any }).user.role).toBe('admin');

    const dbUser = testDb.prepare('SELECT role FROM users WHERE id = ?').get(user.id) as any;
    expect(dbUser.role).toBe('admin');
  });

  it('OIDC-SVC-027: new user with valid invite token increments used_count', () => {
    const { user: creator } = createUser(testDb, { email: 'creator@example.com' });
    testDb.prepare(
      "INSERT INTO invite_tokens (token, max_uses, used_count, created_by) VALUES ('tok-valid', 5, 0, ?)"
    ).run(creator.id);

    const result = svc.findOrCreateUser(
      { sub: 'sub-invite-user', email: 'invitee@example.com', name: 'Invitee' },
      MOCK_CONFIG,
      'tok-valid'
    );

    expect('user' in result).toBe(true);

    const token = testDb.prepare("SELECT used_count FROM invite_tokens WHERE token = 'tok-valid'").get() as any;
    expect(token.used_count).toBe(1);
  });

  it('OIDC-SVC-028: new user with expired invite token is created but invite is ignored', () => {
    const { user: creator } = createUser(testDb, { email: 'creator2@example.com' });
    testDb.prepare(
      "INSERT INTO invite_tokens (token, max_uses, used_count, expires_at, created_by) VALUES ('tok-expired', 5, 0, '2000-01-01T00:00:00.000Z', ?)"
    ).run(creator.id);

    const result = svc.findOrCreateUser(
      { sub: 'sub-expired-invite', email: 'expired-invitee@example.com', name: 'ExpiredInvitee' },
      MOCK_CONFIG,
      'tok-expired'
    );

    // User is still created because open registration is allowed
    expect('user' in result).toBe(true);
    const newUser = testDb.prepare("SELECT id FROM users WHERE email = 'expired-invitee@example.com'").get();
    expect(newUser).toBeDefined();

    // Invite used_count must remain 0 (token was treated as invalid)
    const token = testDb.prepare("SELECT used_count FROM invite_tokens WHERE token = 'tok-expired'").get() as any;
    expect(token.used_count).toBe(0);
  });

  it('OIDC-SVC-029: new user with max_uses exceeded invite token is created but invite is ignored', () => {
    const { user: creator } = createUser(testDb, { email: 'creator3@example.com' });
    testDb.prepare(
      "INSERT INTO invite_tokens (token, max_uses, used_count, created_by) VALUES ('tok-full', 1, 1, ?)"
    ).run(creator.id);

    const result = svc.findOrCreateUser(
      { sub: 'sub-full-invite', email: 'full-invitee@example.com', name: 'FullInvitee' },
      MOCK_CONFIG,
      'tok-full'
    );

    // User is still created because open registration is allowed
    expect('user' in result).toBe(true);
    const newUser = testDb.prepare("SELECT id FROM users WHERE email = 'full-invitee@example.com'").get();
    expect(newUser).toBeDefined();

    // Invite used_count must remain 1 (token was treated as invalid)
    const token = testDb.prepare("SELECT used_count FROM invite_tokens WHERE token = 'tok-full'").get() as any;
    expect(token.used_count).toBe(1);
  });

  // ── OIDC picture claim → avatar (#1399) ──────────────────────────────────

  it('OIDC-SVC-040: new user stores the https picture claim as their avatar', () => {
    const result = svc.findOrCreateUser(
      { sub: 'sub-pic-1', email: 'pic1@example.com', name: 'Pic One', picture: 'https://idp.example.com/u/pic1.png' },
      MOCK_CONFIG
    );
    expect('user' in result).toBe(true);
    const row = testDb.prepare("SELECT avatar FROM users WHERE email = 'pic1@example.com'").get() as any;
    expect(row.avatar).toBe('https://idp.example.com/u/pic1.png');
  });

  it('OIDC-SVC-041: new user with a non-https picture claim stores no avatar', () => {
    svc.findOrCreateUser(
      { sub: 'sub-pic-2', email: 'pic2@example.com', name: 'Pic Two', picture: 'http://idp.example.com/u/pic2.png' },
      MOCK_CONFIG
    );
    const row = testDb.prepare("SELECT avatar FROM users WHERE email = 'pic2@example.com'").get() as any;
    expect(row.avatar).toBeNull();
  });

  it('OIDC-SVC-042: existing user with no avatar gets the OIDC picture', () => {
    const { user } = createUser(testDb, { email: 'pic3@example.com' });
    testDb.prepare('UPDATE users SET oidc_sub = ?, oidc_issuer = ?, avatar = NULL WHERE id = ?')
      .run('sub-pic-3', MOCK_CONFIG.issuer, user.id);
    svc.findOrCreateUser(
      { sub: 'sub-pic-3', email: 'pic3@example.com', name: 'Pic Three', picture: 'https://idp.example.com/u/pic3.png' },
      MOCK_CONFIG
    );
    const row = testDb.prepare('SELECT avatar FROM users WHERE id = ?').get(user.id) as any;
    expect(row.avatar).toBe('https://idp.example.com/u/pic3.png');
  });

  it('OIDC-SVC-043: a custom uploaded avatar is never overwritten by the OIDC picture', () => {
    const { user } = createUser(testDb, { email: 'pic4@example.com' });
    testDb.prepare('UPDATE users SET oidc_sub = ?, oidc_issuer = ?, avatar = ? WHERE id = ?')
      .run('sub-pic-4', MOCK_CONFIG.issuer, 'uploaded-abc.jpg', user.id);
    svc.findOrCreateUser(
      { sub: 'sub-pic-4', email: 'pic4@example.com', name: 'Pic Four', picture: 'https://idp.example.com/u/pic4.png' },
      MOCK_CONFIG
    );
    const row = testDb.prepare('SELECT avatar FROM users WHERE id = ?').get(user.id) as any;
    expect(row.avatar).toBe('uploaded-abc.jpg');
  });

  it('OIDC-SVC-044: a previously stored OIDC picture URL is refreshed on next login', () => {
    const { user } = createUser(testDb, { email: 'pic5@example.com' });
    testDb.prepare('UPDATE users SET oidc_sub = ?, oidc_issuer = ?, avatar = ? WHERE id = ?')
      .run('sub-pic-5', MOCK_CONFIG.issuer, 'https://idp.example.com/u/old.png', user.id);
    svc.findOrCreateUser(
      { sub: 'sub-pic-5', email: 'pic5@example.com', name: 'Pic Five', picture: 'https://idp.example.com/u/new.png' },
      MOCK_CONFIG
    );
    const row = testDb.prepare('SELECT avatar FROM users WHERE id = ?').get(user.id) as any;
    expect(row.avatar).toBe('https://idp.example.com/u/new.png');
  });

  // #2110 — the admin repoints the instance at a different IdP. The user still logs in,
  // because the verified-email lookup finds the row, but everything the old provider put
  // on it used to survive: an avatar URL on a host this instance no longer talks to, and
  // a sub/issuer pair pinning the account to a provider that is gone.
  it('OIDC-SVC-060: a provider without a picture claim clears the previous provider avatar', () => {
    const { user } = createUser(testDb, { email: 'switch1@example.com' });
    testDb.prepare('UPDATE users SET oidc_sub = ?, oidc_issuer = ?, avatar = ? WHERE id = ?')
      .run('sub-old-1', 'https://old-idp.example.com', 'https://old-idp.example.com/u/me.png', user.id);

    svc.findOrCreateUser(
      { sub: 'sub-new-1', email: 'switch1@example.com', name: 'Switcher', email_verified: true },
      { ...MOCK_CONFIG, issuer: 'https://new-idp.example.com' },
    );

    const row = testDb.prepare('SELECT avatar FROM users WHERE id = ?').get(user.id) as any;
    expect(row.avatar).toBeNull();
  });

  it('OIDC-SVC-061: an uploaded avatar survives the same switch', () => {
    const { user } = createUser(testDb, { email: 'switch2@example.com' });
    // A local upload is a bare filename, not a URL, and belongs to the user.
    testDb.prepare('UPDATE users SET oidc_sub = ?, oidc_issuer = ?, avatar = ? WHERE id = ?')
      .run('sub-old-2', 'https://old-idp.example.com', 'uploaded-abc.jpg', user.id);

    svc.findOrCreateUser(
      { sub: 'sub-new-2', email: 'switch2@example.com', name: 'Switcher', email_verified: true },
      { ...MOCK_CONFIG, issuer: 'https://new-idp.example.com' },
    );

    const row = testDb.prepare('SELECT avatar FROM users WHERE id = ?').get(user.id) as any;
    expect(row.avatar).toBe('uploaded-abc.jpg');
  });

  it('OIDC-SVC-062: the account is relinked to the new provider sub and issuer', () => {
    const { user } = createUser(testDb, { email: 'switch3@example.com' });
    testDb.prepare('UPDATE users SET oidc_sub = ?, oidc_issuer = ? WHERE id = ?')
      .run('sub-old-3', 'https://old-idp.example.com', user.id);

    svc.findOrCreateUser(
      { sub: 'sub-new-3', email: 'switch3@example.com', name: 'Switcher', email_verified: true },
      { ...MOCK_CONFIG, issuer: 'https://new-idp.example.com' },
    );

    const row = testDb.prepare('SELECT oidc_sub, oidc_issuer FROM users WHERE id = ?').get(user.id) as any;
    expect(row.oidc_sub).toBe('sub-new-3');
    expect(row.oidc_issuer).toBe('https://new-idp.example.com');
  });

  it('OIDC-SVC-053: returns no_email when the email claim is missing (no throw)', () => {
    const result = svc.findOrCreateUser({ sub: 'sub-no-email', name: 'No Email' }, MOCK_CONFIG);
    expect('error' in result).toBe(true);
    expect((result as { error: string }).error).toBe('no_email');
  });

  it('OIDC-SVC-054: a new user is returned as the re-selected DB row, not a hand-built partial', () => {
    const result = svc.findOrCreateUser(
      { sub: 'sub-full-row', email: 'fullrow@example.com', name: 'Full Row' },
      MOCK_CONFIG
    );
    expect('user' in result).toBe(true);
    const user = (result as { user: any }).user;
    // Columns the legacy hand-built object silently lacked.
    expect(user.password_version).toBeDefined();
    expect(user.is_guest).toBeDefined();
    expect(user.created_at).toBeDefined();
    expect(user.email).toBe('fullrow@example.com');
  });

  it('OIDC-SVC-045: a trip-bound invite auto-adds the new SSO user as a trip member (#1402)', () => {
    const { user: admin } = createUser(testDb, { role: 'admin' });
    const trip = createTrip(testDb, admin.id);
    testDb.prepare(
      'INSERT INTO invite_tokens (token, max_uses, used_count, expires_at, created_by, trip_id) VALUES (?, 5, 0, NULL, ?, ?)'
    ).run('inv-trip-join', admin.id, trip.id);

    const result = svc.findOrCreateUser(
      { sub: 'sub-trip-join', email: 'joiner@example.com', name: 'Joiner' },
      MOCK_CONFIG,
      'inv-trip-join'
    );
    expect('user' in result).toBe(true);
    const uid = (result as { user: any }).user.id;
    const member = testDb.prepare('SELECT * FROM trip_members WHERE trip_id = ? AND user_id = ?').get(trip.id, uid);
    expect(member).toBeTruthy();
  });
});

// ── exchangeCodeForToken ──────────────────────────────────────────────────────

describe('exchangeCodeForToken', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('OIDC-SVC-030: sends correct POST body and returns token data', async () => {
    const mockTokenData = { access_token: 'tok', token_type: 'Bearer' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockTokenData,
    }));

    const doc = { token_endpoint: 'https://oidc.example.com/token' } as any;
    const result = await svc.exchangeCodeForToken(doc, 'auth-code-123', 'https://app/callback', 'client-id', 'client-secret');

    expect(result.access_token).toBe('tok');
    expect(result._ok).toBe(true);
    expect(result._status).toBe(200);

    const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(fetchCall[0]).toBe('https://oidc.example.com/token');
    expect(fetchCall[1].method).toBe('POST');
  });

  it('OIDC-SVC-031: reflects _ok=false when provider returns error status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'invalid_grant' }),
    }));

    const doc = { token_endpoint: 'https://oidc.example.com/token' } as any;
    const result = await svc.exchangeCodeForToken(doc, 'bad-code', 'https://app/callback', 'c', 's');

    expect(result._ok).toBe(false);
    expect(result._status).toBe(400);
  });
});

// ── getUserInfo ───────────────────────────────────────────────────────────────

describe('getUserInfo', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('OIDC-SVC-032: fetches userinfo with Bearer token and returns parsed JSON', async () => {
    const userInfoData = { sub: 'user-sub', email: 'user@example.com', name: 'User Name' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => userInfoData,
    }));

    const result = await svc.getUserInfo('https://oidc.example.com/userinfo', 'access-token-123');

    expect(result.sub).toBe('user-sub');
    expect(result.email).toBe('user@example.com');

    const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(fetchCall[1].headers.Authorization).toBe('Bearer access-token-123');
  });

  it('OIDC-SVC-052: throws on a non-ok userinfo response instead of parsing the error body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'invalid_token' }),
    }));

    await expect(svc.getUserInfo('https://oidc.example.com/userinfo', 'expired-token')).rejects.toThrow(
      'Userinfo fetch failed: HTTP 401',
    );
  });
});

// ── verifyIdToken ─────────────────────────────────────────────────────────────

describe('verifyIdToken', () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = publicKey.export({ format: 'jwk' }) as Record<string, unknown>;
  const ISSUER = 'https://auth.example.com/application/o/trek';
  const CLIENT_ID = 'trek-client';
  const JWKS_URI = 'https://auth.example.com/.well-known/jwks.json';

  function mockJwks() {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ keys: [jwk] }),
    }));
  }

  function makeToken(iss: string, overrides: object = {}) {
    return jwtLib.sign(
      { sub: 'user-sub', email: 'user@example.com', ...overrides },
      privateKey,
      { algorithm: 'RS256', audience: CLIENT_ID, issuer: iss, expiresIn: '1h' }
    );
  }

  const doc = { jwks_uri: JWKS_URI } as any;

  afterEach(() => { vi.unstubAllGlobals(); });

  it('OIDC-SVC-033: accepts token whose iss matches expectedIssuer exactly', async () => {
    mockJwks();
    const token = makeToken(ISSUER);
    const result = await svc.verifyIdToken(token, doc, CLIENT_ID, ISSUER);
    expect(result.ok).toBe(true);
  });

  it('OIDC-SVC-034: accepts token whose iss has a trailing slash (Authentik)', async () => {
    mockJwks();
    const token = makeToken(ISSUER + '/');
    const result = await svc.verifyIdToken(token, doc, CLIENT_ID, ISSUER);
    expect(result.ok).toBe(true);
  });

  it('OIDC-SVC-035: rejects token with wrong issuer', async () => {
    mockJwks();
    const token = makeToken('https://evil.example.com');
    const result = await svc.verifyIdToken(token, doc, CLIENT_ID, ISSUER);
    expect(result.ok).toBe(false);
    expect((result as any).error).toMatch('jwt issuer invalid');
  });

  it('OIDC-SVC-036: rejects token with wrong audience', async () => {
    mockJwks();
    const wrongAudToken = jwtLib.sign(
      { sub: 'user-sub', iss: ISSUER },
      privateKey,
      { algorithm: 'RS256', audience: 'wrong-client', expiresIn: '1h' }
    );
    const result = await svc.verifyIdToken(wrongAudToken, doc, CLIENT_ID, ISSUER);
    expect(result.ok).toBe(false);
  });
});

// ── wrapper methods (carried over from the delegation-shim suite) ────────────

describe('wrapper methods', () => {
  it('OIDC-SVC-046: oidcLoginEnabled reads the resolved auth toggle', () => {
    const spy = vi.spyOn(auth, 'resolveAuthToggles');
    spy.mockReturnValue({ oidc_login: true } as ReturnType<AuthService['resolveAuthToggles']>);
    expect(svc.oidcLoginEnabled()).toBe(true);
    spy.mockReturnValue({ oidc_login: false } as ReturnType<AuthService['resolveAuthToggles']>);
    expect(svc.oidcLoginEnabled()).toBe(false);
    spy.mockRestore();
  });

  it('OIDC-SVC-047: getAppUrl delegates to app-config getAppUrl', () => {
    getAppUrlMock.mockReturnValue('https://app');
    expect(svc.getAppUrl()).toBe('https://app');
  });

  it('OIDC-SVC-048: setAuthCookie forwards res, token and req to the cookie helper', () => {
    const res = {} as Response;
    const req = {} as Request;
    svc.setAuthCookie(res, 'jwt', req);
    expect(setAuthCookieMock).toHaveBeenCalledWith(res, 'jwt', req, undefined);
  });

  it('OIDC-SVC-059: setAuthCookie forwards the remember option to the cookie helper', () => {
    const res = {} as Response;
    const req = {} as Request;
    svc.setAuthCookie(res, 'jwt', req, true);
    expect(setAuthCookieMock).toHaveBeenCalledWith(res, 'jwt', req, true);
    svc.setAuthCookie(res, 'jwt', req, false);
    expect(setAuthCookieMock).toHaveBeenCalledWith(res, 'jwt', req, false);
  });
});

// The SSO configuration read/write moved here from AdminService, which held the SQL
// for a domain that already had a module. Same cases, same service, new owner.
describe('OIDC settings', () => {
  it('ADMIN-SVC-047 — getOidcSettings returns default empty values when no OIDC configured', () => {
    const result = svc.getOidcSettings() as any;
    expect(result.issuer).toBe('');
    expect(result.client_id).toBe('');
    expect(result.oidc_only).toBe(false);
    expect(result.client_secret_set).toBe(false);
    expect(result.display_name).toBe('');
    expect(result.discovery_url).toBe('');
  });

  it('ADMIN-SVC-048 — updateOidcSettings persists issuer and client_id, then getOidcSettings returns them', () => {
    svc.updateOidcSettings({ issuer: 'https://auth.example.com', client_id: 'my-client' });
    const result = svc.getOidcSettings() as any;
    expect(result.issuer).toBe('https://auth.example.com');
    expect(result.client_id).toBe('my-client');
  });

  it('ADMIN-SVC-049 — updateOidcSettings does not write oidc_only (replaced by granular toggles)', () => {
    svc.updateOidcSettings({ issuer: 'https://auth.example.com', client_id: 'my-client' });
    const result = svc.getOidcSettings() as any;
    // oidc_only is no longer managed by updateOidcSettings; use password_login/oidc_login toggles
    expect(result.oidc_only).toBe(false);
  });

  it('ADMIN-SVC-075 — updateOidcSettings applies all five writes atomically', () => {
    const result = svc.updateOidcSettings({ issuer: 'https://idp', client_id: 'cid', display_name: 'IdP' }) as any;
    expect(result.success).toBe(true);
    const settings = svc.getOidcSettings();
    expect(settings).toMatchObject({ issuer: 'https://idp', client_id: 'cid', display_name: 'IdP' });
  });
});

describe('OIDC settings — the lockout guard', () => {
  it('OIDC-SETTINGS-050 refuses to clear the config while password login is off', () => {
    // Clearing the issuer with password login disabled locks every user out of the
    // instance: no SSO to log in through, and no password form either.
    const toggles = vi.spyOn(auth, 'resolveAuthToggles').mockReturnValue({ password_login: false } as never);
    expect(svc.updateOidcSettings({ issuer: '', client_id: 'x' })).toMatchObject({ status: 400 });
    expect(svc.updateOidcSettings({ issuer: 'x', client_id: '' })).toMatchObject({ status: 400 });
    expect((svc.updateOidcSettings({ issuer: '', client_id: '' }) as { error?: string }).error).toMatch(/password login/i);
    toggles.mockRestore();
  });

  it('OIDC-SETTINGS-051 allows the same clear once password login is back on', () => {
    const toggles = vi.spyOn(auth, 'resolveAuthToggles').mockReturnValue({ password_login: true } as never);
    expect(svc.updateOidcSettings({ issuer: '', client_id: '' })).toEqual({ success: true });
    toggles.mockRestore();
  });

  it('OIDC-SETTINGS-052 an omitted client_secret keeps the stored one, an empty string clears it', () => {
    const toggles = vi.spyOn(auth, 'resolveAuthToggles').mockReturnValue({ password_login: true } as never);
    svc.updateOidcSettings({ issuer: 'https://idp', client_id: 'c', client_secret: 'shh' });
    expect(svc.getOidcSettings().client_secret_set).toBe(true);
    // Omitted: the write skips the column entirely rather than blanking it, which is
    // what lets the admin panel save the form without re-typing the secret.
    svc.updateOidcSettings({ issuer: 'https://idp', client_id: 'c' });
    expect(svc.getOidcSettings().client_secret_set).toBe(true);
    svc.updateOidcSettings({ issuer: 'https://idp', client_id: 'c', client_secret: '' });
    expect(svc.getOidcSettings().client_secret_set).toBe(false);
    toggles.mockRestore();
  });
});
