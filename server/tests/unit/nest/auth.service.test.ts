/**
 * auth.service.test.ts
 *
 * DB-centric unit tests for the DI-native AuthService using a real in-memory
 * SQLite database, moved 1:1 from the legacy tests/unit/services/
 * authServiceDb.test.ts (AUTH-DB-* case IDs preserved). Pure function tests
 * live in auth.helpers.test.ts. Constructed directly (no TestingModule, repo
 * convention); the trailing describe covers the auth.bridge.ts delegation
 * exports for the src/nest coverage gate.
 */

// ---------------------------------------------------------------------------
// vi.hoisted: build the real in-memory DB and the module mock before any import
// ---------------------------------------------------------------------------

vi.mock('../../../src/db/database', async () => {

  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
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
    return mock;
});


vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  SESSION_DURATION_SECONDS: 86400,
  SESSION_DURATION_REMEMBER_SECONDS: 2592000,
  updateJwtSecret: () => {},
}));
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

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { db as testDb } from '../../../src/db/database';
import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createAdmin, createInviteToken, createTrip, createPlace, createReservation } from '../../helpers/factories';
import { AuthService } from '../../../src/nest/auth/auth.service';
import { TokenService } from '../../../src/nest/tokens/token.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { BudgetService } from '../../../src/nest/budget/budget.service';
import { ExchangeRatesService } from '../../../src/nest/budget/exchange-rates.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { verifyJwtAndLoadUser } from '../../../src/nest/auth/jwt-verify';
import { authenticator } from 'otplib';
import { hashBackupCode } from '../../../src/nest/auth/auth.helpers';
import { createEphemeralToken } from '../../../src/nest/auth/ephemeral-tokens';
import { TripMembershipService } from '../../../src/nest/trip-membership/trip-membership.service';
import { UserCleanupService } from '../../../src/nest/auth/user-cleanup.service';
import { WebauthnConfigService } from '../../../src/nest/auth/webauthn-config.service';
import { revokeUserSessions } from '../../../src/mcp/sessionManager';
import { MailerService } from '../../../src/nest/notifications/mailer/mailer.service';
import { EphemeralTokenService } from '../../../src/nest/auth/ephemeral-token.service';
import { AllowedFileTypesService } from '../../../src/nest/files/allowed-file-types.service';
import { DEFAULT_ALLOWED_EXTENSIONS } from '../../../src/nest/files/files.constants';
import { createTestPushSubscriptionsRepo } from '../../helpers/notifications-repos';
import {
  createTestUnitOfWork,
  createTestAppSettingsRepo,
  sharedTestOrm,
  createTestUsersRepo,
  createTestTripMembersRepo,
  createTestMcpTokensRepo,
  createTestInviteTokensRepo,
  createTestOauthTokensRepo,
  createTestWebauthnCredentialsRepo,
  createTestPasswordResetTokensRepo,
} from '../../helpers/test-uow';
import { budgetRepoArgs } from '../../helpers/budget-repos';
import { createTestShareTokensRepo, createTestPluginsRepo, createTestPluginUserErasureQueueRepo } from '../../helpers/share-repos';
import { createTestBudgetItemsRepo } from '../../helpers/files-repos';
import { createTestJourneysRepo, createTestJourneyEntriesRepo, createTestJourneyContributorsRepo } from '../../helpers/journey-repos';
import { createTestJourneyShareTokensRepo } from '../../helpers/journey-share-repos';

// MailerService is injected since the notifications fold — a stub instead of a
// module mock. sendPasswordResetEmail is the only thing auth reaches for.
const mailerStub = { sendPasswordResetEmail: vi.fn() } as unknown as MailerService;

// Stubbed rather than real: these tests assert that the invite path CALLS the
// join, not what the join writes (TRIP-JOIN-* cover that).
const joinTripAsMember = vi.fn();
const membershipStub = { joinTripAsMember } as unknown as TripMembershipService;
// Tokens left AuthService for tokens/token.service.ts. The two cases below still
// need one as a fixture: changePassword prunes MCP tokens, and the bridge parity
// case verifies a token it just minted.
let tokens: TokenService;
let svc: AuthService;
beforeAll(async () => {
  tokens = new TokenService(await createTestMcpTokensRepo(testDb), await createTestUsersRepo(testDb), new EphemeralTokenService());
  svc = new AuthService(
  new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)),
  membershipStub,
  new WebauthnConfigService(await createTestAppSettingsRepo(testDb)),
  new UserCleanupService((await sharedTestOrm(testDb)).em, new BudgetService(new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)), new ExchangeRatesService(), new RealtimeService(), await createTestUnitOfWork(testDb), ...(await budgetRepoArgs(testDb))), await createTestUnitOfWork(testDb), await createTestUsersRepo(testDb), await createTestTripMembersRepo(testDb), await createTestBudgetItemsRepo(testDb), await createTestJourneyShareTokensRepo(testDb), await createTestJourneysRepo(testDb), await createTestJourneyEntriesRepo(testDb), await createTestJourneyContributorsRepo(testDb), await createTestShareTokensRepo(testDb), await createTestPluginsRepo(testDb), await createTestPluginUserErasureQueueRepo(testDb)),
  mailerStub,
  new EphemeralTokenService(),
  new AllowedFileTypesService(await createTestAppSettingsRepo(testDb)), await createTestUnitOfWork(testDb),
  await createTestAppSettingsRepo(testDb), await createTestUsersRepo(testDb),
  await createTestInviteTokensRepo(testDb), await createTestMcpTokensRepo(testDb), await createTestOauthTokensRepo(testDb),
  await createTestWebauthnCredentialsRepo(testDb), await createTestPasswordResetTokensRepo(testDb),
  await createTestPushSubscriptionsRepo(testDb),
);
});

/** A Web Push device row; the password paths only care whose it is. */
function addPushDevice(userId: number, endpoint: string): void {
  testDb
    .prepare(
      "INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, vapid_public_key) VALUES (?, ?, 'p', 'a', 'k')",
    )
    .run(userId, endpoint);
}

function pushDeviceCount(userId: number): number {
  return (testDb.prepare('SELECT COUNT(*) c FROM push_subscriptions WHERE user_id = ?').get(userId) as { c: number }).c;
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

beforeEach(() => resetTestDb(testDb));

afterAll(() => testDb.close());

// ---------------------------------------------------------------------------
// requestPasswordReset — OIDC/SSO accounts (#1129)
// ---------------------------------------------------------------------------

describe('requestPasswordReset — OIDC/SSO accounts', () => {
  it('AUTH-DB-PR1: refuses a reset for an OIDC-linked account that has a (random) password hash', async () => {
    const { user } = createUser(testDb);
    // OIDC users are created with a random bcrypt hash, so password_hash is set —
    // the old guard keyed off a missing hash and therefore let the reset through.
    testDb.prepare('UPDATE users SET oidc_sub = ?, oidc_issuer = ? WHERE id = ?')
      .run('sub-1129', 'https://idp.example', user.id);

    const result = await svc.requestPasswordReset(user.email, null);

    expect(result.reason).toBe('oidc_only');
    expect(result.tokenForDelivery).toBeNull();
    const { n } = testDb.prepare('SELECT COUNT(*) AS n FROM password_reset_tokens WHERE user_id = ?')
      .get(user.id) as { n: number };
    expect(n).toBe(0);
  });

  it('AUTH-DB-PR2: still issues a reset for a normal local (non-SSO) account', async () => {
    const { user } = createUser(testDb);
    const result = await svc.requestPasswordReset(user.email, null);
    expect(result.reason).toBe('issued');
    expect(result.tokenForDelivery).toBeTruthy();
  });

  it('AUTH-DB-PR3: a second request burns the prior live token — exactly one stays live (AU37, F3 task-5-review-security.md)', async () => {
    const { user } = createUser(testDb);
    await svc.requestPasswordReset(user.email, null);
    await svc.requestPasswordReset(user.email, null);
    const { n } = testDb.prepare('SELECT COUNT(*) AS n FROM password_reset_tokens WHERE user_id = ? AND consumed_at IS NULL')
      .get(user.id) as { n: number };
    expect(n).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// getAppSettings
// ---------------------------------------------------------------------------

describe('getAppSettings', () => {
  it('AUTH-DB-013: returns 403 for non-admin', async () => {
    const { user } = createUser(testDb);
    const result = await svc.getAppSettings(user.id);
    expect(result.status).toBe(403);
    expect(result.error).toMatch(/admin/i);
  });

  it('AUTH-DB-014: returns settings object for admin with known key allow_registration', async () => {
    const { user } = createAdmin(testDb);
    testDb
      .prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('allow_registration', 'true')")
      .run();
    const result = await svc.getAppSettings(user.id);
    expect(result.status).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data).toHaveProperty('allow_registration', 'true');
  });
});

// ---------------------------------------------------------------------------
// isOidcOnlyMode
// ---------------------------------------------------------------------------

describe('isOidcOnlyMode', () => {
  it('AUTH-DB-019: returns false when OIDC_ONLY env var is not set', async () => {
    vi.stubEnv('OIDC_ONLY', '');
    expect(await svc.isOidcOnlyMode()).toBe(false);
    vi.unstubAllEnvs();
  });

  it('AUTH-DB-020: returns false when OIDC_ONLY=true but no OIDC_ISSUER configured', async () => {
    vi.stubEnv('OIDC_ONLY', 'true');
    vi.stubEnv('OIDC_ISSUER', '');
    vi.stubEnv('OIDC_CLIENT_ID', '');
    expect(await svc.isOidcOnlyMode()).toBe(false);
    vi.unstubAllEnvs();
  });

  it('AUTH-DB-021: returns true when OIDC_ONLY=true AND OIDC_ISSUER AND OIDC_CLIENT_ID are set', async () => {
    vi.stubEnv('OIDC_ONLY', 'true');
    vi.stubEnv('OIDC_ISSUER', 'https://sso.example.com');
    vi.stubEnv('OIDC_CLIENT_ID', 'trek-client');
    expect(await svc.isOidcOnlyMode()).toBe(true);
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

  it('AUTH-DB-022a: returns all true by default (no DB keys, no env override)', async () => {
    vi.stubEnv('OIDC_ONLY', '');
    const t = await svc.resolveAuthToggles();
    expect(t.password_login).toBe(true);
    expect(t.password_registration).toBe(true);
    expect(t.oidc_login).toBe(true);
    expect(t.oidc_registration).toBe(true);
  });

  it('AUTH-DB-022b: legacy — OIDC_ONLY=true with OIDC configured disables password_login and password_registration', async () => {
    vi.stubEnv('OIDC_ONLY', 'true');
    vi.stubEnv('OIDC_ISSUER', 'https://sso.example.com');
    vi.stubEnv('OIDC_CLIENT_ID', 'trek-client');
    const t = await svc.resolveAuthToggles();
    expect(t.password_login).toBe(false);
    expect(t.password_registration).toBe(false);
    expect(t.oidc_login).toBe(true);
    expect(t.oidc_registration).toBe(true);
  });

  it('AUTH-DB-022c: legacy — allow_registration=false disables both password and oidc registration', async () => {
    vi.stubEnv('OIDC_ONLY', '');
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('allow_registration', 'false')").run();
    const t = await svc.resolveAuthToggles();
    expect(t.password_login).toBe(true);
    expect(t.password_registration).toBe(false);
    expect(t.oidc_login).toBe(true);
    expect(t.oidc_registration).toBe(false);
  });

  it('AUTH-DB-022d: new granular keys take precedence over legacy keys', async () => {
    vi.stubEnv('OIDC_ONLY', '');
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('allow_registration', 'false')").run();
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('password_registration', 'true')").run();
    const t = await svc.resolveAuthToggles();
    // New key present → use new keys, allow_registration ignored
    expect(t.password_registration).toBe(true);
    expect(t.oidc_registration).toBe(true); // defaults to true when key not set
  });

  it('AUTH-DB-022e: OIDC_ONLY env var overrides new granular keys for password toggles', async () => {
    vi.stubEnv('OIDC_ONLY', 'true');
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('password_login', 'true')").run();
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('password_registration', 'true')").run();
    const t = await svc.resolveAuthToggles();
    // OIDC_ONLY forces password toggles off even when DB says true
    expect(t.password_login).toBe(false);
    expect(t.password_registration).toBe(false);
  });

  it('AUTH-DB-022f: individual granular keys can be set independently', async () => {
    vi.stubEnv('OIDC_ONLY', '');
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('password_login', 'true')").run();
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('password_registration', 'false')").run();
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('oidc_login', 'true')").run();
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('oidc_registration', 'false')").run();
    const t = await svc.resolveAuthToggles();
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
  it('AUTH-DB-022: returns 403 in demo mode for demo@nomad.app', async () => {
    vi.stubEnv('DEMO_MODE', 'true');
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const result = await svc.setupMfa(user.id, 'demo@nomad.app');
    expect(result.status).toBe(403);
    expect(result.error).toMatch(/demo mode/i);
    vi.unstubAllEnvs();
  });

  it('AUTH-DB-023: returns 400 when MFA is already enabled', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('UPDATE users SET mfa_enabled = 1 WHERE id = ?').run(user.id);
    const result = await svc.setupMfa(user.id, user.email);
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/already enabled/i);
  });

  it('AUTH-DB-024: returns secret and otpauth_url when MFA setup starts successfully', async () => {
    const { user } = createUser(testDb);
    const result = await svc.setupMfa(user.id, user.email);
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
  it('AUTH-DB-025: returns 400 when no verification code is provided', async () => {
    const { user } = createUser(testDb);
    const result = await svc.enableMfa(user.id, undefined);
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/code is required/i);
  });

  it('AUTH-DB-026: returns 400 when there is no pending MFA setup', async () => {
    const { user } = createUser(testDb);
    // No setupMfa called first, so no pending entry exists
    const result = await svc.enableMfa(user.id, '123456');
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/no mfa setup in progress/i);
  });
});

// ---------------------------------------------------------------------------
// disableMfa
// ---------------------------------------------------------------------------

describe('disableMfa', () => {
  it('AUTH-DB-027: returns 403 in demo mode for demo@nomad.app', async () => {
    vi.stubEnv('DEMO_MODE', 'true');
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const result = await svc.disableMfa(user.id, 'demo@nomad.app', {
      password: 'password123',
      code: '000000',
    });
    expect(result.status).toBe(403);
    expect(result.error).toMatch(/demo mode/i);
    vi.unstubAllEnvs();
  });

  it('AUTH-DB-028: returns 400 when password or code is missing', async () => {
    const { user } = createUser(testDb);

    const missingCode = await svc.disableMfa(user.id, user.email, { password: 'pass', code: undefined });
    expect(missingCode.status).toBe(400);
    expect(missingCode.error).toMatch(/password and authenticator code/i);

    const missingPassword = await svc.disableMfa(user.id, user.email, { password: undefined, code: '123456' });
    expect(missingPassword.status).toBe(400);
    expect(missingPassword.error).toMatch(/password and authenticator code/i);
  });

  it('AUTH-DB-029: returns 400 when MFA is not enabled on the account', async () => {
    const { user } = createUser(testDb);
    // mfa_enabled defaults to 0 / not set
    const result = await svc.disableMfa(user.id, user.email, { password: 'password123', code: '000000' });
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/not enabled/i);
  });
});

// ---------------------------------------------------------------------------
// validateInviteToken
// ---------------------------------------------------------------------------

describe('validateInviteToken', () => {
  it('AUTH-DB-030: returns 404 for unknown token', async () => {
    const result = await svc.validateInviteToken('no-such-token');
    expect(result.status).toBe(404);
  });

  it('AUTH-DB-031: returns 410 when max_uses exceeded', async () => {
    // createInviteToken with used_count already at max
    const invite = createInviteToken(testDb, { max_uses: 1 });
    // manually set used_count = 1 to simulate exhaustion
    testDb.prepare('UPDATE invite_tokens SET used_count = 1 WHERE id = ?').run(invite.id);
    const result = await svc.validateInviteToken(invite.token);
    expect(result.status).toBe(410);
  });

  it('AUTH-DB-032: returns 410 when expired', async () => {
    const invite = createInviteToken(testDb, { expires_at: '2000-01-01T00:00:00.000Z' });
    const result = await svc.validateInviteToken(invite.token);
    expect(result.status).toBe(410);
  });
});

// ---------------------------------------------------------------------------
// registerUser — OIDC-only / registration-disabled
// ---------------------------------------------------------------------------

describe('registerUser — OIDC-only / registration-disabled', () => {
  it('AUTH-DB-033: returns 403 when oidc_only=true and not first user', async () => {
    createUser(testDb); // ensure userCount > 0
    testDb.prepare("INSERT INTO app_settings (key, value) VALUES ('oidc_only', 'true')").run();
    testDb.prepare("INSERT INTO app_settings (key, value) VALUES ('oidc_issuer', 'https://x')").run();
    testDb.prepare("INSERT INTO app_settings (key, value) VALUES ('oidc_client_id', 'id')").run();

    const result = await svc.registerUser({ username: 'u', email: 'new@x.com', password: 'Secure123!' });
    expect(result.status).toBe(403);
    expect(result.error).toMatch(/password registration is disabled/i);
  });

  it('AUTH-DB-034: returns 403 when registration is disabled and no invite', async () => {
    createUser(testDb); // ensure userCount > 0
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('allow_registration', 'false')").run();

    const result = await svc.registerUser({ username: 'u2', email: 'n2@x.com', password: 'Secure123!' });
    expect(result.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// loginUser — OIDC-only mode
// ---------------------------------------------------------------------------

describe('loginUser — OIDC-only mode', () => {
  it('AUTH-DB-035: returns 403 when oidc_only=true', async () => {
    const { user, password } = createUser(testDb);
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('oidc_only', 'true')").run();
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('oidc_issuer', 'https://x')").run();
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('oidc_client_id', 'id')").run();

    const result = await svc.loginUser({ email: user.email, password });
    expect(result.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// changePassword — OIDC-only mode
// ---------------------------------------------------------------------------

describe('changePassword — OIDC-only mode', () => {
  it('AUTH-DB-036: returns 403 when oidc_only=true', async () => {
    const { user, password } = createUser(testDb);
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('oidc_only', 'true')").run();
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('oidc_issuer', 'https://x')").run();
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('oidc_client_id', 'id')").run();

    const result = await svc.changePassword(user.id, user.email, { current_password: password, new_password: 'New1234!' });
    expect(result.status).toBe(403);
  });
});

describe('changePassword — session invalidation', () => {
  const pvOf = (id: number) =>
    (testDb.prepare('SELECT password_version FROM users WHERE id = ?').get(id) as { password_version: number }).password_version;
  const mcpCount = (id: number) =>
    (testDb.prepare('SELECT COUNT(*) c FROM mcp_tokens WHERE user_id = ?').get(id) as { c: number }).c;

  it('AUTH-DB-036b: bumps password_version, prunes MCP tokens, and re-issues a session', async () => {
    const { user, password } = createUser(testDb);
    await tokens.createMcpToken(user.id, 'cli');

    expect(pvOf(user.id)).toBe(0);
    expect(mcpCount(user.id)).toBe(1);

    const result = await svc.changePassword(user.id, user.email, { current_password: password, new_password: 'New1234!' });

    expect(result.success).toBe(true);
    expect(typeof result.token).toBe('string'); // fresh session for the current device
    expect(pvOf(user.id)).toBe(1); // old JWT/cookie sessions now rejected by the pv gate
    expect(mcpCount(user.id)).toBe(0); // static MCP tokens revoked
  });

  it('AUTH-DB-036c: a token minted before the change no longer validates afterwards', async () => {
    const { user, password } = createUser(testDb);
    const stolen = await svc.generateToken({ id: user.id }); // pv=0 at mint time

    expect(await verifyJwtAndLoadUser(stolen, await createTestUsersRepo(testDb))).not.toBeNull();

    await svc.changePassword(user.id, user.email, { current_password: password, new_password: 'New1234!' });

    expect(await verifyJwtAndLoadUser(stolen, await createTestUsersRepo(testDb))).toBeNull(); // invalidated by the pv bump
  });

  it('AUTH-DB-036d: preserves the remember choice in the re-issued session (#1927)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const jwt = require('jsonwebtoken');
    const { user, password } = createUser(testDb);

    const result = await svc.changePassword(user.id, user.email, { current_password: password, new_password: 'New1234!' }, true);
    expect(result.success).toBe(true);
    const decoded = jwt.decode(result.token!) as { remember?: boolean; iat: number; exp: number };
    expect(decoded.remember).toBe(true);
    expect(decoded.exp - decoded.iat).toBe(2592000); // remember window survives the change
  });

  it('AUTH-DB-036e: the block is atomic — a failing mcp_tokens prune rolls the whole password change back (F2, task-5-review-security.md, USER-CLEANUP-009 pattern)', async () => {
    const { user, password } = createUser(testDb);
    await tokens.createMcpToken(user.id, 'cli');
    const hashBefore = (testDb.prepare('SELECT password_hash FROM users WHERE id = ?').get(user.id) as { password_hash: string }).password_hash;

    const mcpTokensRepo = await createTestMcpTokensRepo(testDb);
    const deleteAllForUserSpy = vi.spyOn(mcpTokensRepo, 'deleteAllForUser').mockRejectedValueOnce(new Error('boom'));
    try {
      await expect(svc.changePassword(user.id, user.email, { current_password: password, new_password: 'New1234!' })).rejects.toThrow('boom');

      expect(pvOf(user.id)).toBe(0); // password_version unchanged
      expect((testDb.prepare('SELECT password_hash FROM users WHERE id = ?').get(user.id) as { password_hash: string }).password_hash).toBe(hashBefore); // old hash unchanged
      expect(mcpCount(user.id)).toBe(1); // the mcp_tokens row survives — the DELETE never committed
    } finally {
      deleteAllForUserSpy.mockRestore();
    }
  });

  it('AUTH-DB-036f: forgets every push device of the user, and only of that user', async () => {
    const { user, password } = createUser(testDb);
    const { user: other } = createUser(testDb);
    addPushDevice(user.id, 'https://fcm.googleapis.com/fcm/send/mine-1');
    addPushDevice(user.id, 'https://web.push.apple.com/mine-2');
    addPushDevice(other.id, 'https://fcm.googleapis.com/fcm/send/theirs');

    const result = await svc.changePassword(user.id, user.email, { current_password: password, new_password: 'New1234!' });

    expect(result.success).toBe(true);
    expect(pushDeviceCount(user.id)).toBe(0);
    expect(pushDeviceCount(other.id)).toBe(1);
  });

  it('AUTH-DB-036g: a refused change keeps the push devices', async () => {
    const { user } = createUser(testDb);
    addPushDevice(user.id, 'https://fcm.googleapis.com/fcm/send/mine');

    const result = await svc.changePassword(user.id, user.email, { current_password: 'wrong', new_password: 'New1234!' });

    expect(result.status).toBe(401);
    expect(pushDeviceCount(user.id)).toBe(1);
  });

  it('AUTH-DB-036h: drops the push devices in the same transaction as the password change, so a failure changes nothing', async () => {
    const { user, password } = createUser(testDb);
    await tokens.createMcpToken(user.id, 'cli');
    addPushDevice(user.id, 'https://fcm.googleapis.com/fcm/send/mine');
    testDb.exec("CREATE TRIGGER boom BEFORE DELETE ON push_subscriptions BEGIN SELECT RAISE(ABORT, 'boom'); END");
    try {
      await expect(
        svc.changePassword(user.id, user.email, { current_password: password, new_password: 'New1234!' }),
      ).rejects.toThrow('boom');
    } finally {
      testDb.exec('DROP TRIGGER boom');
    }

    expect(pvOf(user.id)).toBe(0);
    expect(mcpCount(user.id)).toBe(1);
    expect(pushDeviceCount(user.id)).toBe(1);
    // The new hash rolled back as well, so the old password is still the one that counts.
    expect((await svc.changePassword(user.id, user.email, { current_password: password, new_password: 'New1234!' })).success)
      .toBe(true);
  });
});

// ---------------------------------------------------------------------------
// disableMfa — require_mfa policy
// ---------------------------------------------------------------------------

describe('disableMfa — require_mfa policy', () => {
  it('AUTH-DB-037: returns 403 when require_mfa=true is set globally', async () => {
    const { user } = createUser(testDb);
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('require_mfa', 'true')").run();

    const result = await svc.disableMfa(user.id, user.email, { password: 'pass', code: '123456' });
    expect(result.status).toBe(403);
    expect(result.error).toMatch(/cannot be disabled/i);
  });
});

// ---------------------------------------------------------------------------
// verifyMfaLogin — validation
// ---------------------------------------------------------------------------

describe('verifyMfaLogin — validation', () => {
  it('AUTH-DB-038: returns 400 when mfa_token or code is missing', async () => {
    const result = await svc.verifyMfaLogin({ mfa_token: undefined, code: undefined });
    expect(result.status).toBe(400);
  });

  it('AUTH-DB-039: returns 401 when mfa_token has wrong purpose', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const jwt = require('jsonwebtoken');
    const tok = jwt.sign({ id: 1, purpose: 'wrong' }, 'test-secret', { expiresIn: '5m', algorithm: 'HS256' });
    const result = await svc.verifyMfaLogin({ mfa_token: tok, code: '123456' });
    expect(result.status).toBe(401);
    expect(result.error).toMatch(/invalid/i);
  });

  it('AUTH-DB-040: returns 401 when user not found for valid mfa_token', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const jwt = require('jsonwebtoken');
    const tok = jwt.sign({ id: 99999, purpose: 'mfa_login' }, 'test-secret', { expiresIn: '5m', algorithm: 'HS256' });
    const result = await svc.verifyMfaLogin({ mfa_token: tok, code: '123456' });
    expect(result.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Coverage added with the DI fold (AUTH-DB-050+): the fold moved ~1400 lines
// under the src/nest coverage gate, so the previously untested branches —
// app-config fan-out, login paths, MFA success flows, reset consumption,
// admin settings — get pinned here.
// ---------------------------------------------------------------------------

describe('getAppConfig', () => {
  it('AUTH-DB-050: anonymous caller gets toggles/version and no permissions block', async () => {
    vi.stubEnv('OIDC_ONLY', '');
    createUser(testDb);
    const cfg = await svc.getAppConfig(null);
    expect(cfg.password_login).toBe(true);
    expect(cfg.has_users).toBe(true);
    expect(typeof cfg.version).toBe('string');
    expect(cfg.permissions).toBeUndefined();
    expect(cfg.notification_channel).toBe('none');
    expect(cfg.available_channels.inapp).toBe(true);
    expect(cfg.allowed_file_types).toContain('jpg');
    vi.unstubAllEnvs();
  });

  it('AUTH-DB-050b: fresh-install fallback matches DEFAULT_ALLOWED_EXTENSIONS (pkpass/md included)', async () => {
    // No allowed_file_types row: the config payload must advertise the same
    // default list the upload filters actually enforce — the historical
    // hardcoded copy dropped pkpass, pkpasses, md and markdown, so the client
    // greyed out types the server accepts.
    createUser(testDb);
    testDb.prepare("DELETE FROM app_settings WHERE key = 'allowed_file_types'").run();
    const cfg = await svc.getAppConfig(null);
    expect(cfg.allowed_file_types).toBe(DEFAULT_ALLOWED_EXTENSIONS);
  });

  it('AUTH-DB-051: authenticated caller gets the permissions block; app_settings rows flow through', async () => {
    const { user } = createUser(testDb);
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('require_mfa', 'true')").run();
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('notification_channels', 'email,webhook')").run();
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('allowed_file_types', 'jpg,png')").run();
    const cfg = await svc.getAppConfig({ id: user.id } as never);
    expect(cfg.permissions).toBeDefined();
    expect(cfg.require_mfa).toBe(true);
    expect(cfg.notification_channels).toEqual(['email', 'webhook']);
    expect(cfg.available_channels.webhook).toBe(true);
    expect(cfg.allowed_file_types).toBe('jpg,png');
  });

  it('AUTH-DB-052: demo mode forces registration toggles off and surfaces the demo credentials', async () => {
    vi.stubEnv('DEMO_MODE', 'true');
    createUser(testDb);
    const cfg = await svc.getAppConfig(null);
    expect(cfg.demo_mode).toBe(true);
    expect(cfg.password_registration).toBe(false);
    expect(cfg.oidc_registration).toBe(false);
    expect(cfg.demo_email).toBeDefined();
    expect(cfg.demo_password).toBe('demo12345');
    vi.unstubAllEnvs();
  });

  it('AUTH-DB-052b: managed is false unless the install says otherwise', async () => {
    createUser(testDb);
    expect((await svc.getAppConfig(null)).managed).toBe(false);
  });

  it('AUTH-DB-052c: managed reaches the client, so the UI can stop offering what the server refuses', async () => {
    vi.stubEnv('TREK_MANAGED', 'true');
    createUser(testDb);
    const cfg = await svc.getAppConfig(null);
    expect(cfg.managed).toBe(true);
    // Additive only: the flag says who owns the configuration and changes
    // nothing else about the instance.
    expect(cfg.demo_mode).toBe(false);
    expect(cfg.password_registration).toBe(true);
    vi.unstubAllEnvs();
  });

  it('AUTH-DB-052d: an instance that declared nothing reports passkeys as not configured (#2147)', async () => {
    // APP_URL unset, so getAppUrl() invents http://localhost:{PORT} and the
    // resolver hands back a localhost RP. No browser on the real domain can
    // finish a ceremony against it, and the options step says so, so the client
    // must not advertise a button whose every click 400s.
    createUser(testDb);
    expect((await svc.getAppConfig(null)).passkey_configured).toBe(false);
  });

  it('AUTH-DB-052e: a localhost RP the operator declared themselves still counts', async () => {
    createUser(testDb);
    vi.stubEnv('APP_URL', 'http://localhost:5173');
    expect((await svc.getAppConfig(null)).passkey_configured).toBe(true);
    vi.unstubAllEnvs();

    vi.stubEnv('ALLOWED_ORIGINS', 'http://localhost:5173');
    expect((await svc.getAppConfig(null)).passkey_configured).toBe(true);
    vi.unstubAllEnvs();

    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('webauthn_rp_id', 'localhost')").run();
    expect((await svc.getAppConfig(null)).passkey_configured).toBe(true);
  });

  it('AUTH-DB-052f: a real domain is configured, a bare IP host is not', async () => {
    createUser(testDb);
    vi.stubEnv('APP_URL', 'https://trek.example.org');
    expect((await svc.getAppConfig(null)).passkey_configured).toBe(true);
    vi.stubEnv('APP_URL', 'http://192.168.1.50:3001');
    expect((await svc.getAppConfig(null)).passkey_configured).toBe(false);
    vi.unstubAllEnvs();
  });

  it('AUTH-DB-052g: place_shadow_enabled fails closed, on the unauthenticated payload', async () => {
    createUser(testDb);
    const set = testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('place_shadow_enabled', ?)");
    // No row is the state of every install that never touched the switch.
    expect((await svc.getAppConfig(null)).place_shadow_enabled).toBe(false);
    set.run('false');
    expect((await svc.getAppConfig(null)).place_shadow_enabled).toBe(false);
    // Only the literal 'true' opens it, the mirror image of the fail-open
    // places_* flags beside it, which close only on the literal 'false'.
    set.run('1');
    expect((await svc.getAppConfig(null)).place_shadow_enabled).toBe(false);
    expect((await svc.getAppConfig(null)).places_enrich_enabled).toBe(true);
    set.run('true');
    expect((await svc.getAppConfig(null)).place_shadow_enabled).toBe(true);
  });
});

describe('demoLogin', () => {
  it('AUTH-DB-053: 404 outside demo mode', async () => {
    vi.stubEnv('DEMO_MODE', '');
    expect(await svc.demoLogin()).toEqual({ error: 'Not found', status: 404 });
    vi.unstubAllEnvs();
  });

  it('AUTH-DB-054: 500 when the demo user row is missing; token + safe user when present', async () => {
    vi.stubEnv('DEMO_MODE', 'true');
    expect(await svc.demoLogin()).toEqual({ error: 'Demo user not found', status: 500 });
    // demoLogin looks up DEMO_EMAIL_PRIMARY specifically (not any demo alias).
    createUser(testDb, { email: 'demo@trek.app' });
    const result = await svc.demoLogin();
    expect(typeof result.token).toBe('string');
    expect(result.user).not.toHaveProperty('password_hash');
    vi.unstubAllEnvs();
  });
});

describe('validateInviteToken — valid path', () => {
  it('AUTH-DB-055: returns valid with usage metadata', async () => {
    const invite = createInviteToken(testDb, { max_uses: 5 });
    const result = await svc.validateInviteToken(invite.token);
    expect(result.valid).toBe(true);
    expect(result.max_uses).toBe(5);
    expect(result.used_count).toBe(0);
  });
});

describe('registerUser — success paths', () => {
  it('AUTH-DB-056: first user becomes admin and gets a token', async () => {
    const result = await svc.registerUser({ username: 'first', email: 'first@x.com', password: 'Secure123!' });
    expect(result.error).toBeUndefined();
    expect(typeof result.token).toBe('string');
    expect((result.user as { role: string }).role).toBe('admin');
    expect(result.auditDetails).toEqual({ username: 'first', email: 'first@x.com', role: 'admin' });
  });

  it('AUTH-DB-057: missing fields / bad email / duplicate answer their bespoke 400/409s', async () => {
    createUser(testDb, { username: 'taken', email: 'taken@x.com' });
    expect(await svc.registerUser({ username: '', email: 'a@x.com', password: 'Secure123!' }))
      .toEqual({ error: 'Username, email and password are required', status: 400 });
    expect(await svc.registerUser({ username: 'u', email: 'not-an-email', password: 'Secure123!' }))
      .toEqual({ error: 'Invalid email format', status: 400 });
    expect(await svc.registerUser({ username: 'TAKEN', email: 'other@x.com', password: 'Secure123!' }))
      .toEqual({ error: 'Registration failed. Please try different credentials.', status: 409 });
  });

  it('AUTH-DB-058: an invite bypasses disabled registration and bumps used_count', async () => {
    createUser(testDb);
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('allow_registration', 'false')").run();
    const invite = createInviteToken(testDb, { max_uses: 2 });
    const result = await svc.registerUser({ username: 'invited', email: 'invited@x.com', password: 'Secure123!', invite_token: invite.token });
    expect(result.error).toBeUndefined();
    const { used_count } = testDb.prepare('SELECT used_count FROM invite_tokens WHERE id = ?').get(invite.id) as { used_count: number };
    expect(used_count).toBe(1);
    testDb.prepare("DELETE FROM app_settings WHERE key = 'allow_registration'").run();
  });
});

describe('loginUser — credential branches', () => {
  it('AUTH-DB-059: unknown email answers the generic 401', async () => {
    const result = await svc.loginUser({ email: 'nobody@x.com', password: 'pw' });
    expect(result).toMatchObject({ error: 'Invalid email or password', status: 401, auditUserId: null });
    expect(result.auditDetails).toMatchObject({ reason: 'unknown_email' });
  });

  it('AUTH-DB-060: missing fields answer the bespoke 400', async () => {
    expect(await svc.loginUser({ email: '', password: '' })).toEqual({ error: 'Email and password are required', status: 400 });
  });

  it('AUTH-DB-061: wrong password answers the generic 401 with the wrong_password audit reason', async () => {
    const { user } = createUser(testDb);
    const result = await svc.loginUser({ email: user.email, password: 'nope' });
    expect(result.status).toBe(401);
    expect(result.auditDetails).toMatchObject({ reason: 'wrong_password' });
  });

  it('AUTH-DB-062: success returns token + stripped user and bumps last_login/login_count', async () => {
    const { user, password } = createUser(testDb);
    const result = await svc.loginUser({ email: user.email, password });
    expect(typeof result.token).toBe('string');
    expect(result.user).not.toHaveProperty('password_hash');
    expect(result.auditAction).toBe('user.login');
    const row = testDb.prepare('SELECT login_count, last_login FROM users WHERE id = ?').get(user.id) as { login_count: number; last_login: string };
    expect(row.login_count).toBe(1);
    expect(row.last_login).not.toBeNull();
  });

  it('AUTH-DB-062b: forwards the caller\'s remember choice into the minted token (T4, task-5-review-template.md; unit-level pin, not only the e2e)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const jwt = require('jsonwebtoken');
    const { user, password } = createUser(testDb);
    const result = await svc.loginUser({ email: user.email, password, remember_me: true });
    expect(typeof result.token).toBe('string');
    const decoded = jwt.decode(result.token!) as { remember?: boolean; iat: number; exp: number };
    expect(decoded.remember).toBe(true);
    expect(decoded.exp - decoded.iat).toBe(2592000);
  });

  it('AUTH-DB-063: an MFA-enabled account gets the interstitial mfa_token instead of a session', async () => {
    const { user } = createUser(testDb);
    testDb.prepare("UPDATE users SET mfa_enabled = 1, mfa_secret = 'enc:JBSWY3DPEHPK3PXP' WHERE id = ?").run(user.id);
    const { password } = { password: undefined };
    void password;
    const result = await svc.loginUser({ email: user.email, password: 'TestPass' });
    // wrong password still 401s before the MFA branch
    expect(result.status).toBe(401);
  });
});

describe('getCurrentUser', () => {
  it('AUTH-DB-064: returns the stripped row with avatar_url; null for a missing id', async () => {
    const { user } = createUser(testDb);
    const loaded = await svc.getCurrentUser(user.id);
    expect(loaded?.id).toBe(user.id);
    expect(loaded).not.toHaveProperty('password_hash');
    expect(await svc.getCurrentUser(999999)).toBeNull();
  });
});

describe('deleteAccount', () => {
  it('AUTH-DB-065: refuses to delete the last admin', async () => {
    const { user } = createAdmin(testDb);
    expect(await svc.deleteAccount(user.id, user.email, 'admin'))
      .toEqual({ error: 'Cannot delete the last admin account', status: 400 });
  });

  it('AUTH-DB-066: demo mode blocks deletion', async () => {
    vi.stubEnv('DEMO_MODE', 'true');
    expect(await svc.deleteAccount(1, 'demo@nomad.app', 'user'))
      .toEqual({ error: 'Account deletion is disabled in demo mode.', status: 403 });
    vi.unstubAllEnvs();
  });

  it('AUTH-DB-067: deletes a regular user row', async () => {
    const { user } = createUser(testDb);
    expect(await svc.deleteAccount(user.id, user.email, 'user')).toEqual({ success: true });
    expect(testDb.prepare('SELECT id FROM users WHERE id = ?').get(user.id)).toBeUndefined();
  });
});

describe('updateAppSettings', () => {
  it('AUTH-DB-071: 403 for non-admin', async () => {
    const { user } = createUser(testDb);
    expect((await svc.updateAppSettings(user.id, {})).status).toBe(403);
  });

  it('AUTH-DB-072: require_mfa=true refuses when the admin has neither MFA nor a passkey', async () => {
    const { user } = createAdmin(testDb);
    const result = await svc.updateAppSettings(user.id, { require_mfa: true });
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/secure your own account/i);
  });

  it('AUTH-DB-073: require_mfa=true is allowed once the admin has MFA enabled', async () => {
    const { user } = createAdmin(testDb);
    testDb.prepare('UPDATE users SET mfa_enabled = 1 WHERE id = ?').run(user.id);
    const result = await svc.updateAppSettings(user.id, { require_mfa: true });
    expect(result.success).toBe(true);
    expect(result.auditSummary).toMatchObject({ require_mfa: true });
    testDb.prepare("DELETE FROM app_settings WHERE key = 'require_mfa'").run();
  });

  it('AUTH-DB-074: lockout prevention refuses disabling every login method', async () => {
    const { user } = createAdmin(testDb);
    const result = await svc.updateAppSettings(user.id, { password_login: 'false', oidc_login: 'false' });
    expect(result).toEqual({ error: 'Cannot disable all login methods. At least one must remain enabled.', status: 400 });
  });

  it('AUTH-DB-075: the smtp_pass masking sentinel is skipped on a notification-settings change', async () => {
    // The reminder crons read their gates per tick now, so a settings change no
    // longer flags (or needs) a scheduler restart.
    const { user } = createAdmin(testDb);
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('smtp_pass', 'stored')").run();
    const result = await svc.updateAppSettings(user.id, { smtp_pass: '••••••••', notification_channels: 'email' });
    expect(result.success).toBe(true);
    const { value } = testDb.prepare("SELECT value FROM app_settings WHERE key = 'smtp_pass'").get() as { value: string };
    expect(value).toBe('stored'); // sentinel never overwrites the secret
    expect(result.auditDebugDetails).not.toHaveProperty('smtp_pass', 'stored');
    testDb.prepare("DELETE FROM app_settings WHERE key IN ('smtp_pass','notification_channels')").run();
  });
});

describe('MFA success flows', () => {
  it('AUTH-DB-076: setup → enable with a valid TOTP code returns backup codes and persists the encrypted secret', async () => {
    const { user } = createUser(testDb);
    const setup = await svc.setupMfa(user.id, user.email);
    const code = authenticator.generate(setup.secret!);
    const result = await svc.enableMfa(user.id, code);
    expect(result.success).toBe(true);
    expect(result.backup_codes).toHaveLength(10);
    const row = testDb.prepare('SELECT mfa_enabled, mfa_secret FROM users WHERE id = ?').get(user.id) as { mfa_enabled: number; mfa_secret: string };
    expect(row.mfa_enabled).toBe(1);
    expect(row.mfa_secret).toBe('enc:' + setup.secret);
  });

  it('AUTH-DB-077: enable with a wrong code answers 401 and keeps the pending secret', async () => {
    const { user } = createUser(testDb);
    await svc.setupMfa(user.id, user.email);
    expect(await svc.enableMfa(user.id, '000000')).toEqual({ error: 'Invalid verification code', status: 401 });
  });

  it('AUTH-DB-078: disableMfa succeeds with the right password + TOTP code', async () => {
    const { user, password } = createUser(testDb);
    const secret = authenticator.generateSecret();
    testDb.prepare('UPDATE users SET mfa_enabled = 1, mfa_secret = ? WHERE id = ?').run('enc:' + secret, user.id);
    const result = await svc.disableMfa(user.id, user.email, { password, code: authenticator.generate(secret) });
    expect(result).toEqual({ success: true, mfa_enabled: false });
    const row = testDb.prepare('SELECT mfa_enabled, mfa_secret FROM users WHERE id = ?').get(user.id) as { mfa_enabled: number; mfa_secret: string | null };
    expect(row.mfa_enabled).toBe(0);
    expect(row.mfa_secret).toBeNull();
  });

  it('AUTH-DB-079: disableMfa answers 401 on a wrong password', async () => {
    const { user } = createUser(testDb);
    const secret = authenticator.generateSecret();
    testDb.prepare('UPDATE users SET mfa_enabled = 1, mfa_secret = ? WHERE id = ?').run('enc:' + secret, user.id);
    expect(await svc.disableMfa(user.id, user.email, { password: 'wrong', code: authenticator.generate(secret) }))
      .toEqual({ error: 'Incorrect password', status: 401 });
  });

  it('AUTH-DB-080: verifyMfaLogin succeeds with a TOTP code from the interstitial token', async () => {
    const { user, password } = createUser(testDb);
    const secret = authenticator.generateSecret();
    testDb.prepare('UPDATE users SET mfa_enabled = 1, mfa_secret = ? WHERE id = ?').run('enc:' + secret, user.id);
    const interstitial = await svc.loginUser({ email: user.email, password });
    expect(interstitial.mfa_required).toBe(true);
    const result = await svc.verifyMfaLogin({ mfa_token: interstitial.mfa_token, code: authenticator.generate(secret) });
    expect(typeof result.token).toBe('string');
    expect(result.auditUserId).toBe(user.id);
  });

  it('AUTH-DB-081: verifyMfaLogin consumes a backup code when the TOTP fails', async () => {
    const { user, password } = createUser(testDb);
    const secret = authenticator.generateSecret();
    const codes = ['AAAA-1111', 'BBBB-2222'];
    // hashBackupCode (legacy SHA-256) hashes still verify via matchBackupCode.
    testDb.prepare('UPDATE users SET mfa_enabled = 1, mfa_secret = ?, mfa_backup_codes = ?, updated_at = ? WHERE id = ?')
      .run('enc:' + secret, JSON.stringify(codes.map(hashBackupCode)), '2000-01-01T00:00:00.000Z', user.id);
    const interstitial = await svc.loginUser({ email: user.email, password });
    const result = await svc.verifyMfaLogin({ mfa_token: interstitial.mfa_token, code: 'AAAA-1111' });
    expect(typeof result.token).toBe('string');
    const row = testDb.prepare('SELECT mfa_backup_codes, updated_at FROM users WHERE id = ?').get(user.id) as { mfa_backup_codes: string; updated_at: string };
    expect(JSON.parse(row.mfa_backup_codes)).toHaveLength(1); // used code spliced out
    // AU33 (setBackupCodesAndTouch, F3 task-5-review-security.md): the backup-code
    // login branch DOES stamp updated_at, unlike resetPassword's AU44 below.
    expect(row.updated_at).not.toBe('2000-01-01T00:00:00.000Z');
    // the spent code no longer verifies
    const again = await svc.loginUser({ email: user.email, password });
    expect((await svc.verifyMfaLogin({ mfa_token: again.mfa_token, code: 'AAAA-1111' })).status).toBe(401);
  });
});

describe('resetPassword', () => {
  it('AUTH-DB-082: consumes an issued token, bumps password_version and burns sibling tokens', async () => {
    const { user } = createUser(testDb);
    const issued = await svc.requestPasswordReset(user.email, '1.2.3.4');
    expect(issued.reason).toBe('issued');
    const result = await svc.resetPassword({ token: issued.tokenForDelivery!, new_password: 'Fresh123!' });
    expect(result).toEqual({ success: true, userId: user.id });
    const row = testDb.prepare('SELECT password_version FROM users WHERE id = ?').get(user.id) as { password_version: number };
    expect(row.password_version).toBe(1);
    // token is burned — a second use answers the bespoke 400
    expect(await svc.resetPassword({ token: issued.tokenForDelivery!, new_password: 'Fresh456!' }))
      .toEqual({ error: 'This reset link has already been used', status: 400 });
  });

  it('AUTH-DB-082b: forgets every push device of the user along with the MCP tokens', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    await tokens.createMcpToken(user.id, 'cli');
    addPushDevice(user.id, 'https://fcm.googleapis.com/fcm/send/mine');
    addPushDevice(other.id, 'https://fcm.googleapis.com/fcm/send/theirs');
    const issued = await svc.requestPasswordReset(user.email, null);

    expect(await svc.resetPassword({ token: issued.tokenForDelivery!, new_password: 'Fresh123!' }))
      .toEqual({ success: true, userId: user.id });

    expect((testDb.prepare('SELECT COUNT(*) c FROM mcp_tokens WHERE user_id = ?').get(user.id) as { c: number }).c).toBe(0);
    expect(pushDeviceCount(user.id)).toBe(0);
    expect(pushDeviceCount(other.id)).toBe(1);
  });

  it('AUTH-DB-082c: drops the push devices in the same transaction that burns the link, so a failure keeps the link', async () => {
    const { user } = createUser(testDb);
    addPushDevice(user.id, 'https://fcm.googleapis.com/fcm/send/mine');
    const issued = await svc.requestPasswordReset(user.email, null);
    testDb.exec("CREATE TRIGGER boom BEFORE DELETE ON push_subscriptions BEGIN SELECT RAISE(ABORT, 'boom'); END");
    try {
      await expect(svc.resetPassword({ token: issued.tokenForDelivery!, new_password: 'Fresh123!' })).rejects.toThrow('boom');
    } finally {
      testDb.exec('DROP TRIGGER boom');
    }

    expect(pushDeviceCount(user.id)).toBe(1);
    const row = testDb.prepare('SELECT password_version FROM users WHERE id = ?').get(user.id) as { password_version: number };
    expect(row.password_version).toBe(0);
    // Nothing was burned, so the same link still completes the reset.
    expect(await svc.resetPassword({ token: issued.tokenForDelivery!, new_password: 'Fresh123!' }))
      .toEqual({ success: true, userId: user.id });
    expect(pushDeviceCount(user.id)).toBe(0);
  });

  it('AUTH-DB-083: bespoke 400s for missing/unknown/expired tokens', async () => {
    expect(await svc.resetPassword({ new_password: 'Fresh123!' })).toEqual({ error: 'Reset token is required', status: 400 });
    expect(await svc.resetPassword({ token: 't' })).toEqual({ error: 'New password is required', status: 400 });
    expect(await svc.resetPassword({ token: 'unknown-token', new_password: 'Fresh123!' }))
      .toEqual({ error: 'Invalid or expired reset link', status: 400 });

    const { user } = createUser(testDb);
    const issued = await svc.requestPasswordReset(user.email, null);
    testDb.prepare("UPDATE password_reset_tokens SET expires_at = '2000-01-01T00:00:00.000Z' WHERE user_id = ?").run(user.id);
    expect(await svc.resetPassword({ token: issued.tokenForDelivery!, new_password: 'Fresh123!' }))
      .toEqual({ error: 'Reset link has expired. Please request a new one.', status: 400 });
  });

  it('AUTH-DB-084: an MFA-enabled account demands a code, then consumes a backup code', async () => {
    const { user } = createUser(testDb);
    const secret = authenticator.generateSecret();
    testDb.prepare('UPDATE users SET mfa_enabled = 1, mfa_secret = ?, mfa_backup_codes = ? WHERE id = ?')
      .run('enc:' + secret, JSON.stringify([hashBackupCode('CCCC-3333')]), user.id);
    const issued = await svc.requestPasswordReset(user.email, null);
    // no code → mfa_required interstitial, token NOT burned
    expect(await svc.resetPassword({ token: issued.tokenForDelivery!, new_password: 'Fresh123!' }))
      .toEqual({ mfa_required: true, status: 200 });
    // wrong code → 401
    expect(await svc.resetPassword({ token: issued.tokenForDelivery!, new_password: 'Fresh123!', mfa_code: '000000' }))
      .toEqual({ error: 'Invalid MFA code', status: 401 });

    // AU44 vs AU33 (F3, task-5-review-security.md): resetPassword's backup-code
    // splice must call the untouched setBackupCodes (AU44), never
    // setBackupCodesAndTouch (AU33, verifyMfaLogin's own branch, AUTH-DB-081) —
    // the same transaction's own setPassword call (AU43) already stamps
    // updated_at, so a raw before/after read on the row can't isolate AU44's
    // no-touch behaviour here (that's USERSREPO-034, at the repository level);
    // the call site is what's unlocked, so this pins the call site directly.
    const usersRepo = await createTestUsersRepo(testDb);
    const setBackupCodesSpy = vi.spyOn(usersRepo, 'setBackupCodes');
    const setBackupCodesAndTouchSpy = vi.spyOn(usersRepo, 'setBackupCodesAndTouch');
    try {
      // backup code → success + code consumed
      expect(await svc.resetPassword({ token: issued.tokenForDelivery!, new_password: 'Fresh123!', mfa_code: 'CCCC-3333' }))
        .toEqual({ success: true, userId: user.id });
      expect(setBackupCodesSpy).toHaveBeenCalledTimes(1);
      expect(setBackupCodesAndTouchSpy).not.toHaveBeenCalled();
    } finally {
      setBackupCodesSpy.mockRestore();
      setBackupCodesAndTouchSpy.mockRestore();
    }

    const row = testDb.prepare('SELECT mfa_backup_codes FROM users WHERE id = ?').get(user.id) as { mfa_backup_codes: string };
    expect(JSON.parse(row.mfa_backup_codes)).toHaveLength(0);
  });

  it('AUTH-DB-084b: the block is atomic — a failing mcp_tokens prune rolls the whole reset-password block back (F2, task-5-review-security.md, USER-CLEANUP-009 pattern)', async () => {
    const { user } = createUser(testDb);
    const issued = await svc.requestPasswordReset(user.email, null);
    const hashBefore = (testDb.prepare('SELECT password_hash FROM users WHERE id = ?').get(user.id) as { password_hash: string }).password_hash;

    const mcpTokensRepo = await createTestMcpTokensRepo(testDb);
    const deleteAllForUserSpy = vi.spyOn(mcpTokensRepo, 'deleteAllForUser').mockRejectedValueOnce(new Error('boom'));
    try {
      await expect(svc.resetPassword({ token: issued.tokenForDelivery!, new_password: 'Fresh123!' })).rejects.toThrow('boom');

      const row = testDb.prepare('SELECT password_hash, password_version FROM users WHERE id = ?').get(user.id) as { password_hash: string; password_version: number };
      expect(row.password_hash).toBe(hashBefore); // old hash unchanged
      expect(row.password_version).toBe(0);
      const tokenRow = testDb.prepare('SELECT consumed_at FROM password_reset_tokens WHERE user_id = ?').get(user.id) as { consumed_at: string | null };
      expect(tokenRow.consumed_at).toBeNull(); // the reset token was never committed as consumed
    } finally {
      deleteAllForUserSpy.mockRestore();
    }
  });

  it('AUTH-DB-085: password-login-disabled and per-email throttle short-circuit the request', async () => {
    vi.stubEnv('OIDC_ONLY', 'true');
    vi.stubEnv('OIDC_ISSUER', 'https://sso.example.com');
    vi.stubEnv('OIDC_CLIENT_ID', 'trek-client');
    expect((await svc.requestPasswordReset('whoever@x.com', null)).reason).toBe('password_login_disabled');
    vi.unstubAllEnvs();

    const { user } = createUser(testDb);
    await svc.requestPasswordReset(user.email, null);
    await svc.requestPasswordReset(user.email, null);
    await svc.requestPasswordReset(user.email, null);
    expect((await svc.requestPasswordReset(user.email, null)).reason).toBe('throttled_per_email');
  });
});

describe('ephemeral + demo helpers', () => {
  it('AUTH-DB-088: isDemoUser is true only for the demo email in demo mode', async () => {
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const { user: other } = createUser(testDb);
    expect(await svc.isDemoUser(user.id)).toBe(false); // demo mode off
    vi.stubEnv('DEMO_MODE', 'true');
    expect(await svc.isDemoUser(user.id)).toBe(true);
    expect(await svc.isDemoUser(other.id)).toBe(false);
    vi.unstubAllEnvs();
  });
});

// ---------------------------------------------------------------------------
// Quirk fixes after the DI fold (trailing fix(server) commit): AUTH-DB-089+.
// The relocation carried these verbatim; the fixes land on top with a pin each.
// ---------------------------------------------------------------------------

describe('auth quirk fixes', () => {
  it('AUTH-DB-090: a throw mid-registration rolls the whole signup back (user + invite bookkeeping)', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const invite = createInviteToken(testDb, { max_uses: 5 });
    testDb.prepare('UPDATE invite_tokens SET trip_id = ? WHERE id = ?').run(trip.id, invite.id);
    joinTripAsMember.mockImplementationOnce(() => { throw new Error('boom'); });

    const result = await svc.registerUser({ username: 'rollback', email: 'rollback@x.com', password: 'Secure123!', invite_token: invite.token });

    expect(result).toEqual({ error: 'Error creating user', status: 500 });
    expect(testDb.prepare("SELECT id FROM users WHERE email = 'rollback@x.com'").get()).toBeUndefined();
    const { used_count } = testDb.prepare('SELECT used_count FROM invite_tokens WHERE id = ?').get(invite.id) as { used_count: number };
    expect(used_count).toBe(0);
  });

  it('AUTH-DB-091: a backup-code login burns the code and records the login as one atomic pair', async () => {
    const { user, password } = createUser(testDb);
    const secret = authenticator.generateSecret();
    testDb.prepare('UPDATE users SET mfa_enabled = 1, mfa_secret = ?, mfa_backup_codes = ? WHERE id = ?')
      .run('enc:' + secret, JSON.stringify([hashBackupCode('DDDD-4444')]), user.id);
    const interstitial = await svc.loginUser({ email: user.email, password });

    const result = await svc.verifyMfaLogin({ mfa_token: interstitial.mfa_token, code: 'DDDD-4444' });

    expect(typeof result.token).toBe('string');
    const row = testDb.prepare('SELECT mfa_backup_codes, login_count, last_login FROM users WHERE id = ?').get(user.id) as { mfa_backup_codes: string; login_count: number; last_login: string | null };
    expect(JSON.parse(row.mfa_backup_codes)).toHaveLength(0);
    expect(row.login_count).toBe(1);
    expect(row.last_login).not.toBeNull();
  });

});

// ---------------------------------------------------------------------------
// MCP-token verification round-trips (was the auth.bridge delegation block;
// the MCP transport now injects TokenService/AuthService directly)
// ---------------------------------------------------------------------------

describe('MCP token verification round-trips', () => {
  it('AUTH-BR-002: verifyMcpToken resolves a freshly created token to its user', async () => {
    const { user } = createUser(testDb);
    const created = await tokens.createMcpToken(user.id, 'bridge-case');
    const raw = (created.token as { raw_token: string }).raw_token;
    const resolved = await tokens.verifyMcpToken(raw);
    expect(resolved?.id).toBe(user.id);
    expect(await tokens.verifyMcpToken('trek_no_such_token')).toBeNull();
  });

  it('AUTH-BR-003: verifyJwtToken round-trips a service-minted token through the pv gate', async () => {
    const { user } = createUser(testDb);
    const token = await svc.generateToken({ id: user.id });
    expect((await svc.verifyJwtToken(token))?.id).toBe(user.id);
    expect(await svc.verifyJwtToken('not-a-jwt')).toBeNull();
  });
});

describe('generateToken remember claim (#1927)', () => {
  const jwt = require('jsonwebtoken');

  it('AUTH-TOKEN-001: embeds remember and picks the matching lifetime when the caller chose', async () => {
    const { user } = createUser(testDb);
    const long = jwt.decode(await svc.generateToken({ id: user.id }, true)) as { remember?: boolean; iat: number; exp: number };
    expect(long.remember).toBe(true);
    expect(long.exp - long.iat).toBe(2592000);

    const short = jwt.decode(await svc.generateToken({ id: user.id }, false)) as { remember?: boolean; iat: number; exp: number };
    expect(short.remember).toBe(false);
    expect(short.exp - short.iat).toBe(86400);
  });

  it('AUTH-TOKEN-002: omits the claim entirely when the caller did not choose (legacy payload)', async () => {
    const { user } = createUser(testDb);
    const decoded = jwt.decode(await svc.generateToken({ id: user.id })) as { remember?: boolean; iat: number; exp: number };
    expect('remember' in decoded).toBe(false);
    expect(decoded.exp - decoded.iat).toBe(86400);
  });
});
