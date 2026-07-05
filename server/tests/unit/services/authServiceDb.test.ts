/**
 * authServiceDb.test.ts
 *
 * DB-centric unit tests for authService.ts using a real in-memory SQLite database.
 * Pure function tests live in authService.test.ts (stub DB); this file covers
 * functions that require actual DB queries to exercise their logic.
 */

// ---------------------------------------------------------------------------
// vi.hoisted: build the real in-memory DB and the module mock before any import
// ---------------------------------------------------------------------------

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
    canAccessTrip: (tripId: any, userId: number) =>
      db
        .prepare(
          `SELECT t.id, t.user_id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)`
        )
        .get(userId, tripId, userId),
    isOwner: (tripId: any, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  SESSION_DURATION_SECONDS: 86400,
  updateJwtSecret: () => {},
}));
vi.mock('../../../src/services/mfaCrypto', () => ({
  encryptMfaSecret: vi.fn((s) => `enc:${s}`),
  decryptMfaSecret: vi.fn((s: string) => s.replace('enc:', '')),
}));
vi.mock('../../../src/services/apiKeyCrypto', () => ({
  decrypt_api_key: vi.fn((v) => v),
  maybe_encrypt_api_key: vi.fn((v) => v),
  mask_stored_api_key: vi.fn((v: string | null | undefined) => (v ? '••••••••' : null)),
  encrypt_api_key: vi.fn((v) => v),
}));
vi.mock('../../../src/services/permissions', () => ({
  getAllPermissions: vi.fn(() => ({})),
  checkPermission: vi.fn(),
}));
vi.mock('../../../src/services/ephemeralTokens', () => ({ createEphemeralToken: vi.fn() }));
vi.mock('../../../src/mcp', () => ({ revokeUserSessions: vi.fn() }));
vi.mock('../../../src/scheduler', () => ({
  startTripReminders: vi.fn(),
  buildCronExpression: vi.fn(),
  loadSettings: vi.fn(() => ({ enabled: false })),
  VALID_INTERVALS: ['daily', 'weekly', 'monthly'],
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createAdmin, createInviteToken } from '../../helpers/factories';
import {
  updateSettings,
  updateApiKeys,
  getSettings,
  listUsers,
  getAppSettings,
  validateKeys,
  isOidcOnlyMode,
  resolveAuthToggles,
  setupMfa,
  enableMfa,
  disableMfa,
  validateInviteToken,
  registerUser,
  loginUser,
  requestPasswordReset,
  changePassword,
  verifyMfaLogin,
  createMcpToken,
  deleteMcpToken,
  generateToken,
} from '../../../src/services/authService';
import { verifyJwtAndLoadUser } from '../../../src/middleware/auth';

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => resetTestDb(testDb));

afterAll(() => testDb.close());

// ---------------------------------------------------------------------------
// requestPasswordReset — OIDC/SSO accounts (#1129)
// ---------------------------------------------------------------------------

describe('requestPasswordReset — OIDC/SSO accounts', () => {
  it('AUTH-DB-PR1: refuses a reset for an OIDC-linked account that has a (random) password hash', () => {
    const { user } = createUser(testDb);
    // OIDC users are created with a random bcrypt hash, so password_hash is set —
    // the old guard keyed off a missing hash and therefore let the reset through.
    testDb.prepare('UPDATE users SET oidc_sub = ?, oidc_issuer = ? WHERE id = ?')
      .run('sub-1129', 'https://idp.example', user.id);

    const result = requestPasswordReset(user.email, null);

    expect(result.reason).toBe('oidc_only');
    expect(result.tokenForDelivery).toBeNull();
    const { n } = testDb.prepare('SELECT COUNT(*) AS n FROM password_reset_tokens WHERE user_id = ?')
      .get(user.id) as { n: number };
    expect(n).toBe(0);
  });

  it('AUTH-DB-PR2: still issues a reset for a normal local (non-SSO) account', () => {
    const { user } = createUser(testDb);
    const result = requestPasswordReset(user.email, null);
    expect(result.reason).toBe('issued');
    expect(result.tokenForDelivery).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// updateSettings
// ---------------------------------------------------------------------------

describe('updateSettings', () => {
  it('AUTH-DB-001: updates username successfully', () => {
    const { user } = createUser(testDb);
    const result = updateSettings(user.id, { username: 'newname' });
    expect(result.success).toBe(true);
    expect(result.user?.username).toBe('newname');
  });

  it('AUTH-DB-002: returns 400 when username is too short (< 2 chars)', () => {
    const { user } = createUser(testDb);
    const result = updateSettings(user.id, { username: 'x' });
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/between 2 and 50/i);
  });

  it('AUTH-DB-003: returns 400 when username has invalid characters (spaces)', () => {
    const { user } = createUser(testDb);
    const result = updateSettings(user.id, { username: 'bad name' });
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/only contain/i);
  });

  it('AUTH-DB-004: returns 409 when username is already taken by another user', () => {
    const { user: user1 } = createUser(testDb, { username: 'alice' });
    const { user: user2 } = createUser(testDb, { username: 'bob' });
    const result = updateSettings(user2.id, { username: user1.username });
    expect(result.status).toBe(409);
    expect(result.error).toMatch(/already taken/i);
  });

  it('AUTH-DB-005: updates email successfully', () => {
    const { user } = createUser(testDb);
    const result = updateSettings(user.id, { email: 'new@example.com' });
    expect(result.success).toBe(true);
    expect(result.user?.email).toBe('new@example.com');
  });

  it('AUTH-DB-006: returns 400 for invalid email format', () => {
    const { user } = createUser(testDb);
    const result = updateSettings(user.id, { email: 'not-an-email' });
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/invalid email/i);
  });

  it('AUTH-DB-007: returns 409 when email is already taken by another user', () => {
    const { user: user1 } = createUser(testDb, { email: 'taken@example.com' });
    const { user: user2 } = createUser(testDb);
    const result = updateSettings(user2.id, { email: user1.email });
    expect(result.status).toBe(409);
    expect(result.error).toMatch(/already taken/i);
  });

  it('AUTH-DB-008: returns success with no field changes when empty body is passed', () => {
    const { user } = createUser(testDb);
    const result = updateSettings(user.id, {});
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getSettings
// ---------------------------------------------------------------------------

describe('getSettings', () => {
  it('AUTH-DB-009: returns 403 for non-admin user', () => {
    const { user } = createUser(testDb);
    const result = getSettings(user.id);
    expect(result.status).toBe(403);
    expect(result.error).toMatch(/admin/i);
  });

  it('AUTH-DB-010: returns maps_api_key and openweather_api_key for admin', () => {
    const { user } = createAdmin(testDb);
    testDb
      .prepare('UPDATE users SET maps_api_key = ?, openweather_api_key = ? WHERE id = ?')
      .run('maps-key-value', 'weather-key-value', user.id);
    const result = getSettings(user.id);
    expect(result.status).toBeUndefined();
    expect(result.settings).toBeDefined();
    expect(result.settings).toHaveProperty('maps_api_key');
    expect(result.settings).toHaveProperty('openweather_api_key');
  });

  it('AUTH-DB-010b: round-trips unsplash_api_key through updateApiKeys — masked to the client, readable via getSettings', () => {
    const { user } = createAdmin(testDb);
    const result = updateApiKeys(user.id, { unsplash_api_key: 'unsplash-secret-key' });
    // Returned to the client masked, never in plaintext.
    expect(result.user.unsplash_api_key).toBe('-----key');
    // getSettings returns the stored key to the admin.
    expect(getSettings(user.id).settings?.unsplash_api_key).toBe('unsplash-secret-key');
  });
});

// ---------------------------------------------------------------------------
// listUsers
// ---------------------------------------------------------------------------

describe('listUsers', () => {
  it('AUTH-DB-011: returns all users except self, sorted by username', () => {
    const { user: self } = createUser(testDb, { username: 'zzself' });
    createUser(testDb, { username: 'alice' });
    createUser(testDb, { username: 'charlie' });
    createUser(testDb, { username: 'bob' });
    const result = listUsers(self.id);
    expect(result).toHaveLength(3);
    const names = result.map((u) => u.username);
    expect(names).toEqual([...names].sort());
    expect(names).not.toContain('zzself');
  });

  it('AUTH-DB-012: returns empty array when only one user exists', () => {
    const { user } = createUser(testDb);
    const result = listUsers(user.id);
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// getAppSettings
// ---------------------------------------------------------------------------

describe('getAppSettings', () => {
  it('AUTH-DB-013: returns 403 for non-admin', () => {
    const { user } = createUser(testDb);
    const result = getAppSettings(user.id);
    expect(result.status).toBe(403);
    expect(result.error).toMatch(/admin/i);
  });

  it('AUTH-DB-014: returns settings object for admin with known key allow_registration', () => {
    const { user } = createAdmin(testDb);
    testDb
      .prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('allow_registration', 'true')")
      .run();
    const result = getAppSettings(user.id);
    expect(result.status).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data).toHaveProperty('allow_registration', 'true');
  });
});

// ---------------------------------------------------------------------------
// validateKeys
// ---------------------------------------------------------------------------

describe('validateKeys', () => {
  it('AUTH-DB-015: returns 403 for non-admin', async () => {
    const { user } = createUser(testDb);
    const result = await validateKeys(user.id);
    expect(result.status).toBe(403);
    expect(result.error).toMatch(/admin/i);
    expect(result.maps).toBe(false);
    expect(result.weather).toBe(false);
  });

  it('AUTH-DB-016: returns { maps: false, weather: false } when no API keys are stored', async () => {
    const { user } = createAdmin(testDb);
    const result = await validateKeys(user.id);
    expect(result.maps).toBe(false);
    expect(result.weather).toBe(false);
    expect(result.maps_details).toBeNull();
  });

  it('AUTH-DB-017: returns { maps: true } when fetch returns 200', async () => {
    const { user } = createAdmin(testDb);
    testDb.prepare('UPDATE users SET maps_api_key = ? WHERE id = ?').run('test-key', user.id);

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      text: async () => '',
    } as Response);

    const result = await validateKeys(user.id);
    expect(result.maps).toBe(true);
    expect(result.maps_details?.ok).toBe(true);

    fetchSpy.mockRestore();
  });

  it('AUTH-DB-018: returns { maps: false } when fetch throws a network error', async () => {
    const { user } = createAdmin(testDb);
    testDb.prepare('UPDATE users SET maps_api_key = ? WHERE id = ?').run('test-key', user.id);

    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockRejectedValueOnce(new Error('Network failure'));

    const result = await validateKeys(user.id);
    expect(result.maps).toBe(false);
    expect(result.maps_details?.error_status).toBe('FETCH_ERROR');
    expect(result.maps_details?.error_message).toBe('Network failure');

    fetchSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// isOidcOnlyMode
// ---------------------------------------------------------------------------

describe('isOidcOnlyMode', () => {
  it('AUTH-DB-019: returns false when OIDC_ONLY env var is not set', () => {
    vi.stubEnv('OIDC_ONLY', '');
    expect(isOidcOnlyMode()).toBe(false);
    vi.unstubAllEnvs();
  });

  it('AUTH-DB-020: returns false when OIDC_ONLY=true but no OIDC_ISSUER configured', () => {
    vi.stubEnv('OIDC_ONLY', 'true');
    vi.stubEnv('OIDC_ISSUER', '');
    vi.stubEnv('OIDC_CLIENT_ID', '');
    expect(isOidcOnlyMode()).toBe(false);
    vi.unstubAllEnvs();
  });

  it('AUTH-DB-021: returns true when OIDC_ONLY=true AND OIDC_ISSUER AND OIDC_CLIENT_ID are set', () => {
    vi.stubEnv('OIDC_ONLY', 'true');
    vi.stubEnv('OIDC_ISSUER', 'https://sso.example.com');
    vi.stubEnv('OIDC_CLIENT_ID', 'trek-client');
    expect(isOidcOnlyMode()).toBe(true);
    vi.unstubAllEnvs();
  });
});

// ---------------------------------------------------------------------------
// resolveAuthToggles
// ---------------------------------------------------------------------------

describe('resolveAuthToggles', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    testDb.prepare("DELETE FROM app_settings WHERE key IN ('password_login','password_registration','oidc_login','oidc_registration','oidc_only','allow_registration')").run();
  });

  it('AUTH-DB-022a: returns all true by default (no DB keys, no env override)', () => {
    vi.stubEnv('OIDC_ONLY', '');
    const t = resolveAuthToggles();
    expect(t.password_login).toBe(true);
    expect(t.password_registration).toBe(true);
    expect(t.oidc_login).toBe(true);
    expect(t.oidc_registration).toBe(true);
  });

  it('AUTH-DB-022b: legacy — OIDC_ONLY=true with OIDC configured disables password_login and password_registration', () => {
    vi.stubEnv('OIDC_ONLY', 'true');
    vi.stubEnv('OIDC_ISSUER', 'https://sso.example.com');
    vi.stubEnv('OIDC_CLIENT_ID', 'trek-client');
    const t = resolveAuthToggles();
    expect(t.password_login).toBe(false);
    expect(t.password_registration).toBe(false);
    expect(t.oidc_login).toBe(true);
    expect(t.oidc_registration).toBe(true);
  });

  it('AUTH-DB-022c: legacy — allow_registration=false disables both password and oidc registration', () => {
    vi.stubEnv('OIDC_ONLY', '');
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('allow_registration', 'false')").run();
    const t = resolveAuthToggles();
    expect(t.password_login).toBe(true);
    expect(t.password_registration).toBe(false);
    expect(t.oidc_login).toBe(true);
    expect(t.oidc_registration).toBe(false);
  });

  it('AUTH-DB-022d: new granular keys take precedence over legacy keys', () => {
    vi.stubEnv('OIDC_ONLY', '');
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('allow_registration', 'false')").run();
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('password_registration', 'true')").run();
    const t = resolveAuthToggles();
    // New key present → use new keys, allow_registration ignored
    expect(t.password_registration).toBe(true);
    expect(t.oidc_registration).toBe(true); // defaults to true when key not set
  });

  it('AUTH-DB-022e: OIDC_ONLY env var overrides new granular keys for password toggles', () => {
    vi.stubEnv('OIDC_ONLY', 'true');
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('password_login', 'true')").run();
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('password_registration', 'true')").run();
    const t = resolveAuthToggles();
    // OIDC_ONLY forces password toggles off even when DB says true
    expect(t.password_login).toBe(false);
    expect(t.password_registration).toBe(false);
  });

  it('AUTH-DB-022f: individual granular keys can be set independently', () => {
    vi.stubEnv('OIDC_ONLY', '');
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('password_login', 'true')").run();
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('password_registration', 'false')").run();
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('oidc_login', 'true')").run();
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('oidc_registration', 'false')").run();
    const t = resolveAuthToggles();
    expect(t.password_login).toBe(true);
    expect(t.password_registration).toBe(false);
    expect(t.oidc_login).toBe(true);
    expect(t.oidc_registration).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// setupMfa
// ---------------------------------------------------------------------------

describe('setupMfa', () => {
  it('AUTH-DB-022: returns 403 in demo mode for demo@nomad.app', () => {
    vi.stubEnv('DEMO_MODE', 'true');
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const result = setupMfa(user.id, 'demo@nomad.app');
    expect(result.status).toBe(403);
    expect(result.error).toMatch(/demo mode/i);
    vi.unstubAllEnvs();
  });

  it('AUTH-DB-023: returns 400 when MFA is already enabled', () => {
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET mfa_enabled = 1 WHERE id = ?').run(user.id);
    const result = setupMfa(user.id, user.email);
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/already enabled/i);
  });

  it('AUTH-DB-024: returns secret and otpauth_url when MFA setup starts successfully', () => {
    const { user } = createUser(testDb);
    const result = setupMfa(user.id, user.email);
    expect(result.error).toBeUndefined();
    expect(typeof result.secret).toBe('string');
    expect(result.secret!.length).toBeGreaterThan(0);
    expect(typeof result.otpauth_url).toBe('string');
    expect(result.otpauth_url).toMatch(/^otpauth:\/\/totp\//);
    expect(result.qrPromise).toBeInstanceOf(Promise);
  });
});

// ---------------------------------------------------------------------------
// enableMfa
// ---------------------------------------------------------------------------

describe('enableMfa', () => {
  it('AUTH-DB-025: returns 400 when no verification code is provided', () => {
    const { user } = createUser(testDb);
    const result = enableMfa(user.id, undefined);
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/code is required/i);
  });

  it('AUTH-DB-026: returns 400 when there is no pending MFA setup', () => {
    const { user } = createUser(testDb);
    // No setupMfa called first, so no pending entry exists
    const result = enableMfa(user.id, '123456');
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/no mfa setup in progress/i);
  });
});

// ---------------------------------------------------------------------------
// disableMfa
// ---------------------------------------------------------------------------

describe('disableMfa', () => {
  it('AUTH-DB-027: returns 403 in demo mode for demo@nomad.app', () => {
    vi.stubEnv('DEMO_MODE', 'true');
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const result = disableMfa(user.id, 'demo@nomad.app', {
      password: 'password123',
      code: '000000',
    });
    expect(result.status).toBe(403);
    expect(result.error).toMatch(/demo mode/i);
    vi.unstubAllEnvs();
  });

  it('AUTH-DB-028: returns 400 when password or code is missing', () => {
    const { user } = createUser(testDb);

    const missingCode = disableMfa(user.id, user.email, { password: 'pass', code: undefined });
    expect(missingCode.status).toBe(400);
    expect(missingCode.error).toMatch(/password and authenticator code/i);

    const missingPassword = disableMfa(user.id, user.email, { password: undefined, code: '123456' });
    expect(missingPassword.status).toBe(400);
    expect(missingPassword.error).toMatch(/password and authenticator code/i);
  });

  it('AUTH-DB-029: returns 400 when MFA is not enabled on the account', () => {
    const { user } = createUser(testDb);
    // mfa_enabled defaults to 0 / not set
    const result = disableMfa(user.id, user.email, { password: 'password123', code: '000000' });
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/not enabled/i);
  });
});

// ---------------------------------------------------------------------------
// validateInviteToken
// ---------------------------------------------------------------------------

describe('validateInviteToken', () => {
  it('AUTH-DB-030: returns 404 for unknown token', () => {
    const result = validateInviteToken('no-such-token');
    expect(result.status).toBe(404);
  });

  it('AUTH-DB-031: returns 410 when max_uses exceeded', () => {
    // createInviteToken with used_count already at max
    const invite = createInviteToken(testDb, { max_uses: 1 });
    // manually set used_count = 1 to simulate exhaustion
    testDb.prepare('UPDATE invite_tokens SET used_count = 1 WHERE id = ?').run(invite.id);
    const result = validateInviteToken(invite.token);
    expect(result.status).toBe(410);
  });

  it('AUTH-DB-032: returns 410 when expired', () => {
    const invite = createInviteToken(testDb, { expires_at: '2000-01-01T00:00:00.000Z' });
    const result = validateInviteToken(invite.token);
    expect(result.status).toBe(410);
  });
});

// ---------------------------------------------------------------------------
// registerUser — OIDC-only / registration-disabled
// ---------------------------------------------------------------------------

describe('registerUser — OIDC-only / registration-disabled', () => {
  it('AUTH-DB-033: returns 403 when oidc_only=true and not first user', () => {
    createUser(testDb); // ensure userCount > 0
    testDb.prepare("INSERT INTO app_settings (key, value) VALUES ('oidc_only', 'true')").run();
    testDb.prepare("INSERT INTO app_settings (key, value) VALUES ('oidc_issuer', 'https://x')").run();
    testDb.prepare("INSERT INTO app_settings (key, value) VALUES ('oidc_client_id', 'id')").run();

    const result = registerUser({ username: 'u', email: 'new@x.com', password: 'Secure123!' });
    expect(result.status).toBe(403);
    expect(result.error).toMatch(/password registration is disabled/i);
  });

  it('AUTH-DB-034: returns 403 when registration is disabled and no invite', () => {
    createUser(testDb); // ensure userCount > 0
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('allow_registration', 'false')").run();

    const result = registerUser({ username: 'u2', email: 'n2@x.com', password: 'Secure123!' });
    expect(result.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// loginUser — OIDC-only mode
// ---------------------------------------------------------------------------

describe('loginUser — OIDC-only mode', () => {
  it('AUTH-DB-035: returns 403 when oidc_only=true', () => {
    const { user, password } = createUser(testDb);
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('oidc_only', 'true')").run();
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('oidc_issuer', 'https://x')").run();
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('oidc_client_id', 'id')").run();

    const result = loginUser({ email: user.email, password });
    expect(result.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// changePassword — OIDC-only mode
// ---------------------------------------------------------------------------

describe('changePassword — OIDC-only mode', () => {
  it('AUTH-DB-036: returns 403 when oidc_only=true', () => {
    const { user, password } = createUser(testDb);
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('oidc_only', 'true')").run();
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('oidc_issuer', 'https://x')").run();
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('oidc_client_id', 'id')").run();

    const result = changePassword(user.id, user.email, { current_password: password, new_password: 'New1234!' });
    expect(result.status).toBe(403);
  });
});

describe('changePassword — session invalidation', () => {
  const pvOf = (id: number) =>
    (testDb.prepare('SELECT password_version FROM users WHERE id = ?').get(id) as { password_version: number }).password_version;
  const mcpCount = (id: number) =>
    (testDb.prepare('SELECT COUNT(*) c FROM mcp_tokens WHERE user_id = ?').get(id) as { c: number }).c;

  it('AUTH-DB-036b: bumps password_version, prunes MCP tokens, and re-issues a session', () => {
    const { user, password } = createUser(testDb);
    createMcpToken(user.id, 'cli');

    expect(pvOf(user.id)).toBe(0);
    expect(mcpCount(user.id)).toBe(1);

    const result = changePassword(user.id, user.email, { current_password: password, new_password: 'New1234!' });

    expect(result.success).toBe(true);
    expect(typeof result.token).toBe('string'); // fresh session for the current device
    expect(pvOf(user.id)).toBe(1); // old JWT/cookie sessions now rejected by the pv gate
    expect(mcpCount(user.id)).toBe(0); // static MCP tokens revoked
  });

  it('AUTH-DB-036c: a token minted before the change no longer validates afterwards', () => {
    const { user, password } = createUser(testDb);
    const stolen = generateToken({ id: user.id }); // pv=0 at mint time

    expect(verifyJwtAndLoadUser(stolen)).not.toBeNull();

    changePassword(user.id, user.email, { current_password: password, new_password: 'New1234!' });

    expect(verifyJwtAndLoadUser(stolen)).toBeNull(); // invalidated by the pv bump
  });
});

// ---------------------------------------------------------------------------
// disableMfa — require_mfa policy
// ---------------------------------------------------------------------------

describe('disableMfa — require_mfa policy', () => {
  it('AUTH-DB-037: returns 403 when require_mfa=true is set globally', () => {
    const { user } = createUser(testDb);
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('require_mfa', 'true')").run();

    const result = disableMfa(user.id, user.email, { password: 'pass', code: '123456' });
    expect(result.status).toBe(403);
    expect(result.error).toMatch(/cannot be disabled/i);
  });
});

// ---------------------------------------------------------------------------
// verifyMfaLogin — validation
// ---------------------------------------------------------------------------

describe('verifyMfaLogin — validation', () => {
  it('AUTH-DB-038: returns 400 when mfa_token or code is missing', () => {
    const result = verifyMfaLogin({ mfa_token: undefined, code: undefined });
    expect(result.status).toBe(400);
  });

  it('AUTH-DB-039: returns 401 when mfa_token has wrong purpose', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const jwt = require('jsonwebtoken');
    const tok = jwt.sign({ id: 1, purpose: 'wrong' }, 'test-secret', { expiresIn: '5m', algorithm: 'HS256' });
    const result = verifyMfaLogin({ mfa_token: tok, code: '123456' });
    expect(result.status).toBe(401);
    expect(result.error).toMatch(/invalid/i);
  });

  it('AUTH-DB-040: returns 401 when user not found for valid mfa_token', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const jwt = require('jsonwebtoken');
    const tok = jwt.sign({ id: 99999, purpose: 'mfa_login' }, 'test-secret', { expiresIn: '5m', algorithm: 'HS256' });
    const result = verifyMfaLogin({ mfa_token: tok, code: '123456' });
    expect(result.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// MCP token service
// ---------------------------------------------------------------------------

describe('MCP token service', () => {
  it('AUTH-DB-041: createMcpToken returns 400 when name is missing', () => {
    const { user } = createUser(testDb);
    const result = createMcpToken(user.id, undefined);
    expect(result.status).toBe(400);
  });

  it('AUTH-DB-042: createMcpToken returns 400 when name exceeds 100 chars', () => {
    const { user } = createUser(testDb);
    const result = createMcpToken(user.id, 'a'.repeat(101));
    expect(result.status).toBe(400);
  });

  it('AUTH-DB-043: createMcpToken creates token and returns raw_token', () => {
    const { user } = createUser(testDb);
    const result = createMcpToken(user.id, 'My Token');
    expect(result.token).toBeDefined();
    expect((result.token as any).raw_token).toMatch(/^trek_/);
  });

  it('AUTH-DB-044: createMcpToken returns 400 when user has 10 tokens already', () => {
    const { user } = createUser(testDb);
    for (let i = 0; i < 10; i++) {
      testDb.prepare(
        'INSERT INTO mcp_tokens (user_id, name, token_hash, token_prefix) VALUES (?, ?, ?, ?)'
      ).run(user.id, `Token ${i}`, `hash${i}`, `trek_prefix${i}`);
    }
    const result = createMcpToken(user.id, 'One More');
    expect(result.status).toBe(400);
  });

  it('AUTH-DB-045: deleteMcpToken returns 404 for non-existent token', () => {
    const { user } = createUser(testDb);
    const result = deleteMcpToken(user.id, '99999');
    expect(result.status).toBe(404);
  });

  it('AUTH-DB-046: deleteMcpToken deletes the token and returns success', () => {
    const { user } = createUser(testDb);
    const created = createMcpToken(user.id, 'Deletable Token');
    const tokenId = String((created.token as any).id);

    const result = deleteMcpToken(user.id, tokenId);
    expect(result).toEqual({ success: true });

    const row = testDb.prepare('SELECT id FROM mcp_tokens WHERE id = ?').get(tokenId);
    expect(row).toBeUndefined();
  });
});
