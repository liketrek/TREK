/**
 * Unit tests for the DI-native AdminService — ADMIN-SVC-001 through
 * ADMIN-SVC-069, moved 1:1 from tests/unit/services/adminService.test.ts with
 * the 2026-08 fold (IDs preserved, including the pre-existing 029/030 gap and
 * the duplicated 069). The packing-template cases (031-044, 056-064) moved with
 * their functions to tests/unit/nest/packing.service.test.ts.
 * Constructs the service directly over a real in-memory SQLite DB (repo
 * convention — no TestingModule). Focuses on validation/error branches that the
 * integration tests don't exercise. VCJOB-001 pins the version-check cron path
 * (it replaced ADMIN-BR-001 when the old admin bridge died with the cron move).
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';

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
    canAccessTrip: () => null,
    isOwner: () => false,
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));
vi.mock('../../../src/nest/common/crypto/apiKeyCrypto', () => ({
  encrypt_api_key: (v: string) => v,
  decrypt_api_key: (v: string) => v,
  maybe_encrypt_api_key: (v: string) => v,
}));
vi.mock('../../../src/mcp', () => ({
  revokeUserSessions: vi.fn(),
  invalidateMcpSessions: vi.fn(),
}));
vi.mock('../../../src/mcp/sessionManager', () => ({
  revokeUserSessions: vi.fn(),
  revokeUserSessionsForClient: vi.fn(),
}));
vi.mock('../../../src/demo/demo-reset', () => ({
  saveBaseline: vi.fn(),
}));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createUserWithMfa, createAdmin, createInviteToken } from '../../helpers/factories';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { AddonsService } from '../../../src/nest/addons/addons.service';
import { SettingsService } from '../../../src/nest/settings/settings.service';
import { AtlasService } from '../../../src/nest/atlas/atlas.service';
import { TripMembershipService } from '../../../src/nest/trip-membership/trip-membership.service';
import { UserCleanupService } from '../../../src/nest/auth/user-cleanup.service';
import { MailerService } from '../../../src/nest/notifications/mailer/mailer.service';
import { WebauthnConfigService } from '../../../src/nest/auth/webauthn-config.service';
import { AuthService } from '../../../src/nest/auth/auth.service';
import { PasskeyService } from '../../../src/nest/auth/passkey.service';
import { PackingService } from '../../../src/nest/packing/packing.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { BudgetService } from '../../../src/nest/budget/budget.service';
import { ExchangeRatesService } from '../../../src/nest/budget/exchange-rates.service';
import { NotificationsService } from '../../../src/nest/notifications/notifications.service';
import { AdminService } from '../../../src/nest/admin/admin.service';
import { VersionCheckJob } from '../../../src/nest/admin/version-check.job';
import type { CronRegistrarService } from '../../../src/nest/scheduling/cron-registrar.service';
import type { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import { __clearVersionCacheForTests } from '../../../src/nest/admin/admin.helpers';
import { makeNotificationsService, makeNotificationPreferencesService } from '../../helpers/notifications';
import { EphemeralTokenService } from '../../../src/nest/auth/ephemeral-token.service';
import { AllowedFileTypesService } from '../../../src/nest/files/allowed-file-types.service';

const dbs = new DatabaseService(testDb);
const realtime = new RealtimeService();
const permissions = new PermissionsService(dbs);
const webauthn = new WebauthnConfigService(dbs);
const userCleanup = new UserCleanupService(dbs, new BudgetService(dbs, permissions, new ExchangeRatesService(), realtime));
// Positional and previously wrong: an AtlasService sat in the membership slot
// and the mailer was missing entirely, so `auth` was built with its last four
// collaborators shifted by one. Nothing failed, because none of the cases below
// reach a path that uses them.
const auth = new AuthService(dbs, permissions, new TripMembershipService(dbs), webauthn, userCleanup, new MailerService(dbs), new EphemeralTokenService(), new AllowedFileTypesService(dbs));
const svc = new AdminService(
  dbs,
  new AddonsService(dbs),
  new PasskeyService(dbs, auth, webauthn),
  auth,
  permissions,
  makeNotificationsService(dbs, realtime),
  userCleanup,
  realtime,
);

// Legacy free-function names bound to the service, so the moved cases below read
// exactly as they did before the fold.
const listUsers = () => svc.listUsers();
const svcCreateUser = (d: Parameters<AdminService['createUser']>[0]) => svc.createUser(d);
const updateUser = (id: string, d: Parameters<AdminService['updateUser']>[1]) => svc.updateUser(id, d);
const deleteUser = (id: string, actingId: number) => svc.deleteUser(id, actingId);
const getStats = () => svc.getStats();
const getPermissions = () => svc.getPermissions();
const savePermissions = (p: Record<string, string>) => svc.savePermissions(p);
const getAuditLog = (q: { limit?: string; offset?: string }) => svc.getAuditLog(q);
const saveDemoBaseline = () => svc.saveDemoBaseline();
const getGithubReleases = (perPage?: string, page?: string) => svc.getGithubReleases(perPage, page);
const checkVersion = () => svc.checkVersion();
const listAddons = () => svc.listAddons();
const updateAddon = (id: string, d: Parameters<AdminService['updateAddon']>[1]) => svc.updateAddon(id, d);

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
});

afterAll(() => {
  testDb.close();
});

// ── listUsers ─────────────────────────────────────────────────────────────────

describe('listUsers', () => {
  it('ADMIN-SVC-001 — returns all users with online:false', () => {
    createUser(testDb);
    createUser(testDb);
    const users = listUsers() as any[];
    expect(users.length).toBeGreaterThanOrEqual(2);
    expect(users.every((u: any) => u.online === false)).toBe(true);
  });
});

// ── createUser ────────────────────────────────────────────────────────────────

describe('createUser (service)', () => {
  it('ADMIN-SVC-002 — creates a user successfully', () => {
    const result = svcCreateUser({ username: 'newuser', email: 'new@test.com', password: 'ValidPass1!' }) as any;
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('new@test.com');
  });

  it('ADMIN-SVC-003 — returns 400 when username is missing', () => {
    const result = svcCreateUser({ username: '', email: 'x@x.com', password: 'ValidPass1!' }) as any;
    expect(result.status).toBe(400);
  });

  it('ADMIN-SVC-004 — returns 400 for invalid role', () => {
    const result = svcCreateUser({ username: 'u1', email: 'u1@test.com', password: 'ValidPass1!', role: 'superuser' }) as any;
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/invalid role/i);
  });

  it('ADMIN-SVC-005 — returns 409 for duplicate username', () => {
    createUser(testDb);
    const { user } = createUser(testDb);
    const result = svcCreateUser({ username: user.username, email: 'unique@test.com', password: 'ValidPass1!' }) as any;
    expect(result.status).toBe(409);
  });

  it('ADMIN-SVC-006 — returns 409 for duplicate email', () => {
    const { user } = createUser(testDb);
    const result = svcCreateUser({ username: 'uniqueuser', email: user.email, password: 'ValidPass1!' }) as any;
    expect(result.status).toBe(409);
  });

  it('ADMIN-SVC-007 — returns 400 for weak password', () => {
    const result = svcCreateUser({ username: 'weakpwuser', email: 'weakpw@test.com', password: 'short' }) as any;
    expect(result.status).toBe(400);
  });
});

// ── updateUser ────────────────────────────────────────────────────────────────

describe('updateUser', () => {
  it('ADMIN-SVC-008 — updates username successfully', () => {
    const { user } = createUser(testDb);
    const result = updateUser(String(user.id), { username: 'updatedname' }) as any;
    expect(result.user).toBeDefined();
    expect(result.user.username).toBe('updatedname');
  });

  it('ADMIN-SVC-009 — returns 404 for non-existent user', () => {
    const result = updateUser('99999', { username: 'ghost' }) as any;
    expect(result.status).toBe(404);
  });

  it('ADMIN-SVC-010 — returns 400 for invalid role', () => {
    const { user } = createUser(testDb);
    const result = updateUser(String(user.id), { role: 'superadmin' }) as any;
    expect(result.status).toBe(400);
  });

  it('ADMIN-SVC-011 — returns 409 when username is taken', () => {
    const { user: u1 } = createUser(testDb);
    const { user: u2 } = createUser(testDb);
    const result = updateUser(String(u2.id), { username: u1.username }) as any;
    expect(result.status).toBe(409);
  });

  it('ADMIN-SVC-012 — returns 409 when email is taken', () => {
    const { user: u1 } = createUser(testDb);
    const { user: u2 } = createUser(testDb);
    const result = updateUser(String(u2.id), { email: u1.email }) as any;
    expect(result.status).toBe(409);
  });

  it('ADMIN-SVC-013 — returns 400 for weak password', () => {
    const { user } = createUser(testDb);
    const result = updateUser(String(user.id), { password: 'weak' }) as any;
    expect(result.status).toBe(400);
  });

  it('ADMIN-SVC-014 — tracks changed fields in result', () => {
    const { user } = createUser(testDb);
    const result = updateUser(String(user.id), { username: 'newname', role: 'admin' }) as any;
    expect(result.changed).toContain('username');
    expect(result.changed).toContain('role');
  });
});

// ── deleteUser ────────────────────────────────────────────────────────────────

describe('deleteUser', () => {
  it('ADMIN-SVC-015 — deletes user successfully', () => {
    const { user: admin } = createAdmin(testDb);
    const { user } = createUser(testDb);
    const result = deleteUser(String(user.id), admin.id) as any;
    expect(result.email).toBe(user.email);
  });

  it('ADMIN-SVC-016 — returns 400 when deleting own account', () => {
    const { user: admin } = createAdmin(testDb);
    const result = deleteUser(String(admin.id), admin.id) as any;
    expect(result.status).toBe(400);
  });

  it('ADMIN-SVC-017 — returns 404 for non-existent user', () => {
    const { user: admin } = createAdmin(testDb);
    const result = deleteUser('99999', admin.id) as any;
    expect(result.status).toBe(404);
  });
});

// ── getStats ──────────────────────────────────────────────────────────────────

describe('getStats', () => {
  it('ADMIN-SVC-018 — returns numeric counts for all stats', () => {
    const stats = getStats() as any;
    expect(typeof stats.totalUsers).toBe('number');
    expect(typeof stats.totalTrips).toBe('number');
    expect(typeof stats.totalPlaces).toBe('number');
    expect(typeof stats.totalFiles).toBe('number');
  });
});

// ── getPermissions / savePermissions ─────────────────────────────────────────

describe('Permissions', () => {
  it('ADMIN-SVC-019 — getPermissions returns an array of actions', () => {
    const result = getPermissions() as any;
    expect(Array.isArray(result.permissions)).toBe(true);
    expect(result.permissions.length).toBeGreaterThan(0);
  });

  it('ADMIN-SVC-020 — savePermissions persists a permission change', () => {
    savePermissions({ trip_create: 'admin' });
    const result = getPermissions() as any;
    const perm = result.permissions.find((p: any) => p.key === 'trip_create');
    expect(perm.level).toBe('admin');
  });
});

// ── getAuditLog ───────────────────────────────────────────────────────────────

describe('getAuditLog', () => {
  it('ADMIN-SVC-021 — returns entries array with total', () => {
    const result = getAuditLog({}) as any;
    expect(Array.isArray(result.entries)).toBe(true);
    expect(typeof result.total).toBe('number');
    expect(result.limit).toBe(100);
    expect(result.offset).toBe(0);
  });

  it('ADMIN-SVC-022 — respects limit and offset params', () => {
    const result = getAuditLog({ limit: '10', offset: '0' }) as any;
    expect(result.limit).toBe(10);
    expect(result.offset).toBe(0);
  });

  it('ADMIN-SVC-023 — caps limit at 500', () => {
    const result = getAuditLog({ limit: '9999' }) as any;
    expect(result.limit).toBe(500);
  });
});

// ── getAuditLog — JSON details parsing ───────────────────────────────────────

describe('getAuditLog — JSON details', () => {
  it('ADMIN-SVC-045 — parses JSON details when present', () => {
    const { user } = createUser(testDb);
    testDb.prepare('INSERT INTO audit_log (user_id, action, details) VALUES (?, ?, ?)').run(
      user.id, 'test_action', JSON.stringify({ key: 'val' })
    );
    const result = getAuditLog({}) as any;
    expect(result.entries.length).toBeGreaterThanOrEqual(1);
    const entry = result.entries.find((e: any) => e.action === 'test_action');
    expect(entry).toBeDefined();
    expect(entry.details).toEqual({ key: 'val' });
  });

  it('ADMIN-SVC-046 — falls back to the raw string when details are not valid JSON', () => {
    const { user } = createUser(testDb);
    testDb.prepare('INSERT INTO audit_log (user_id, action, details) VALUES (?, ?, ?)').run(
      user.id, 'bad_json_action', 'not-valid-json{'
    );
    const result = getAuditLog({}) as any;
    const entry = result.entries.find((e: any) => e.action === 'bad_json_action');
    expect(entry).toBeDefined();
    // Was { _parse_error: true } before the 2026-08 quirk fix — the admin UI
    // rendered that sentinel literally.
    expect(entry.details).toBe('not-valid-json{');
  });
});

// ── OIDC Settings ─────────────────────────────────────────────────────────────

// ── saveDemoBaseline ──────────────────────────────────────────────────────────

describe('saveDemoBaseline', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('ADMIN-SVC-050 — returns 404 when DEMO_MODE is not "true"', () => {
    vi.stubEnv('DEMO_MODE', 'false');
    const result = saveDemoBaseline() as any;
    expect(result.status).toBe(404);
    expect(result.error).toBeDefined();
  });

  it('ADMIN-SVC-051 — returns a defined result object when DEMO_MODE is "true"', () => {
    // saveDemoBaseline() uses a dynamic CJS require() whose mock cannot be
    // intercepted via vi.mock in this test environment (tsx runtime + CJS loader).
    // The function either succeeds (message) or falls through the catch to a
    // 500 error. Either way the result must be a defined, non-null object.
    vi.stubEnv('DEMO_MODE', 'true');
    const result = saveDemoBaseline() as any;
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    // The 404 branch must NOT be taken — DEMO_MODE is "true".
    expect(result.status).not.toBe(404);
  });
});

// ── getGithubReleases ─────────────────────────────────────────────────────────

describe('getGithubReleases', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('ADMIN-SVC-052 — returns empty array when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const result = await getGithubReleases();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('ADMIN-SVC-053 — returns releases array when fetch succeeds', async () => {
    const mockReleases = [
      { id: 1, tag_name: 'v3.0.0', name: 'Release 3.0.0', html_url: 'https://github.com/example/releases/tag/v3.0.0' },
      { id: 2, tag_name: 'v2.9.9', name: 'Release 2.9.9', html_url: 'https://github.com/example/releases/tag/v2.9.9' },
    ];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(mockReleases),
      json: async () => mockReleases,
    }));
    const result = await getGithubReleases();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect((result as any[])[0].tag_name).toBe('v3.0.0');
  });

  it('ADMIN-SVC-053a — clamps the paging query instead of interpolating it raw', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => '[]' });
    vi.stubGlobal('fetch', fetchMock);

    await getGithubReleases('9999', '0');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.github.com/repos/liketrek/TREK/releases?per_page=100&page=1',
    );

    await getGithubReleases('10&per_page=999', 'abc');
    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://api.github.com/repos/liketrek/TREK/releases?per_page=10&page=1',
    );
  });

  it('ADMIN-SVC-053b — round-trips the paging the admin UI actually sends', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => '[]' });
    vi.stubGlobal('fetch', fetchMock);

    await getGithubReleases('20', '2');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.github.com/repos/liketrek/TREK/releases?per_page=20&page=2',
    );
  });
});

// ── checkVersion ──────────────────────────────────────────────────────────────

describe('checkVersion', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Since the 2026-08 quirk fix, failures cache too (on a 60s TTL), so each case
  // clears the module-scoped cache rather than reading the previous one's result.
  beforeEach(() => { __clearVersionCacheForTests(); });

  it('ADMIN-SVC-054 — returns update_available:false when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const result = await checkVersion() as any;
    expect(result.update_available).toBe(false);
    expect(result.current).toBeDefined();
    expect(result.latest).toBeDefined();
  });

  it('ADMIN-SVC-055 — returns update_available:true when latest version is greater than current', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ tag_name: 'v999.0.0', html_url: 'https://github.com/example/releases/tag/v999.0.0' }),
      json: async () => ({ tag_name: 'v999.0.0', html_url: 'https://github.com/example/releases/tag/v999.0.0' }),
    }));
    const result = await checkVersion() as any;
    expect(result.update_available).toBe(true);
    expect(result.latest).toBe('999.0.0');
    expect(result.release_url).toBe('https://github.com/example/releases/tag/v999.0.0');
  });

  it('ADMIN-SVC-070 — a failed check is cached briefly instead of refetching per call', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.stubGlobal('fetch', fetchMock);
    await checkVersion();
    await checkVersion();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

// ── listAddons ────────────────────────────────────────────────────────────────

describe('listAddons', () => {
  it('ADMIN-SVC-065 — listAddons returns array containing seeded addon entries', () => {
    const result = listAddons() as any[];
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    const addonIds = result.map((a: any) => a.id);
    expect(addonIds).toContain('packing');
    expect(addonIds).toContain('budget');
  });
});

// ── updateAddon ───────────────────────────────────────────────────────────────

describe('updateAddon', () => {
  it('ADMIN-SVC-066 — updateAddon enables and disables a seeded addon', () => {
    const disabled = updateAddon('mcp', { enabled: false }) as any;
    expect(disabled.addon).toBeDefined();
    expect(disabled.addon.enabled).toBe(false);

    const enabled = updateAddon('mcp', { enabled: true }) as any;
    expect(enabled.addon.enabled).toBe(true);
  });

  it('ADMIN-SVC-067 — updateAddon returns 404 for unknown addon id', () => {
    const result = updateAddon('nonexistent-addon-xyz', { enabled: true }) as any;
    expect(result.status).toBe(404);
    expect(result.error).toBeDefined();
  });

  it('ADMIN-SVC-069 — mcpAffected only fires on a real enabled-flip of an MCP-relevant addon (#1414)', () => {
    updateAddon('packing', { enabled: true });
    // no-op save (enabled already true) → sessions survive
    expect((updateAddon('packing', { enabled: true }) as any).mcpAffected).toBe(false);
    // config-only save → sessions survive
    expect((updateAddon('packing', { config: { foo: 'bar' } }) as any).mcpAffected).toBe(false);
    // real flip of an MCP-relevant addon → invalidate
    expect((updateAddon('packing', { enabled: false }) as any).mcpAffected).toBe(true);
    expect((updateAddon('packing', { enabled: true }) as any).mcpAffected).toBe(true);
    // real flip of an addon with no MCP surface → sessions survive
    const docsFlip = updateAddon('documents', { enabled: false }) as any;
    if (!docsFlip.error) expect(docsFlip.mcpAffected).toBe(false);
  });
});

// ── version-check cron ────────────────────────────────────────────────────────

describe('version-check job', () => {
  const registrarStub = { isEnabled: () => true, register: vi.fn(() => true), unregister: vi.fn() } as unknown as CronRegistrarService;
  const envStub = { isManaged: () => false } as unknown as RuntimeEnvService;

  it('VCJOB-001 — the cron tick notifies and shares the module-scoped version cache with the route', async () => {
    createAdmin(testDb);
    __clearVersionCacheForTests();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ tag_name: 'v99.9.9', html_url: 'https://example.test/r' }),
      json: async () => ({ tag_name: 'v99.9.9', html_url: 'https://example.test/r' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await new VersionCheckJob(svc, registrarStub, envStub).tick();

    const notified = testDb
      .prepare('SELECT value FROM app_settings WHERE key = ?')
      .get('last_notified_version') as { value: string } | undefined;
    expect(notified?.value).toBe('99.9.9');

    // The version cache is module-scoped in admin.helpers, so the cron and
    // GET /api/admin/version-check hit GitHub once between them.
    expect(await svc.checkVersion()).toMatchObject({ latest: '99.9.9' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
    __clearVersionCacheForTests();
  });
});

// ── Quirk fixes landed after the 2026-08 fold ─────────────────────────────────

describe('admin quirk fixes (post-fold)', () => {

  it('ADMIN-SVC-072 — updateUser rejects an empty username/email instead of silently no-opping', () => {
    const { user } = createUser(testDb);
    expect(updateUser(String(user.id), { username: '' }) as any).toMatchObject({ status: 400, error: 'Username cannot be empty' });
    expect(updateUser(String(user.id), { email: '  ' }) as any).toMatchObject({ status: 400, error: 'Email cannot be empty' });
    // The row is untouched.
    const row = testDb.prepare('SELECT username FROM users WHERE id = ?').get(user.id) as { username: string };
    expect(row.username).toBe(user.username);
  });


});

// ── What an admin password reset ends, and what an ordinary edit must not ─────

const pv = (id: number): number =>
  (testDb.prepare('SELECT password_version FROM users WHERE id = ?').get(id) as { password_version: number | null })
    ?.password_version ?? 0;

const mcpTokenCount = (id: number): number =>
  (testDb.prepare('SELECT COUNT(*) AS n FROM mcp_tokens WHERE user_id = ?').get(id) as { n: number }).n;

describe('admin password reset revokes what an intruder already holds', () => {
  it('ADMIN-SVC-080 — setting a password bumps password_version, so existing cookies stop working', () => {
    // An admin sets somebody else's password for one reason: the account is
    // believed compromised. Without the bump, verifyJwtAndLoadUser keeps
    // accepting every cookie the intruder holds, and the one action taken to
    // lock them out is the one action that did not.
    const { user } = createUser(testDb);
    const before = pv(user.id);

    updateUser(String(user.id), { password: 'ANewStrongPass123!' });

    expect(pv(user.id)).toBe(before + 1);
  });

  it('ADMIN-SVC-081 — and clears the MCP tokens, which the version bump does not reach', () => {
    const { user } = createUser(testDb);
    testDb.prepare("INSERT INTO mcp_tokens (user_id, token_hash, token_prefix, name) VALUES (?, 'hash', 'trek_ab', 'cli')").run(user.id);

    updateUser(String(user.id), { password: 'ANewStrongPass123!' });

    expect(mcpTokenCount(user.id)).toBe(0);
  });

  it('ADMIN-SVC-082 — renaming a user touches neither, so an ordinary edit stays ordinary', () => {
    const { user } = createUser(testDb);
    const before = pv(user.id);
    testDb.prepare("INSERT INTO mcp_tokens (user_id, token_hash, token_prefix, name) VALUES (?, 'hash', 'trek_ab', 'cli')").run(user.id);

    updateUser(String(user.id), { username: 'renamed' });

    expect(pv(user.id)).toBe(before);
    expect(mcpTokenCount(user.id)).toBe(1);
  });
});

describe('resetUserMfa', () => {
  it('ADMIN-SVC-083 — clears the three columns disableMfa clears, so both paths leave one state', () => {
    // The passkey half has existed since passkeys landed; TOTP never had an
    // answer, which left "somebody on the trip lost their phone" with no way out
    // short of an operator reaching into the database.
    const admin = createAdmin(testDb);
    const { user } = createUserWithMfa(testDb);

    const result = svc.resetUserMfa(String(user.id), admin.user.id) as { success?: boolean; email?: string };

    expect(result.success).toBe(true);
    expect(result.email).toBe(user.email);
    const row = testDb
      .prepare('SELECT mfa_enabled, mfa_secret, mfa_backup_codes FROM users WHERE id = ?')
      .get(user.id) as { mfa_enabled: number; mfa_secret: string | null; mfa_backup_codes: string | null };
    expect(row.mfa_enabled).toBe(0);
    expect(row.mfa_secret).toBeNull();
    expect(row.mfa_backup_codes).toBeNull();
  });

  it('ADMIN-SVC-084 — refuses to strip the callers own second factor', () => {
    // Reachable from a stolen admin session otherwise, and it would take the
    // second factor off the very account that session came from. The
    // self-service path in Settings asks for the current password.
    const admin = createAdmin(testDb);

    const result = svc.resetUserMfa(String(admin.user.id), admin.user.id) as { error?: string; status?: number };

    expect(result.status).toBe(400);
    expect(result.error).toMatch(/your own/i);
  });

  it('ADMIN-SVC-085 — 404 for a user that is not there', () => {
    const admin = createAdmin(testDb);

    expect(svc.resetUserMfa('99999', admin.user.id) as { status?: number }).toMatchObject({ status: 404 });
  });
});

describe('checkVersion on a centrally administered install', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    __clearVersionCacheForTests();
  });

  it('ADMIN-SVC-086 — answers "up to date" without asking GitHub', () => {
    // Answered rather than refused: the admin page calls this on open, and a 403
    // would put an error where a quiet surface belongs. The operator decides when
    // this instance upgrades, so from inside it there is nothing available.
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubEnv('TREK_MANAGED', 'true');
    vi.stubEnv('APP_VERSION', '3.4.1');

    return checkVersion().then((info) => {
      expect(info.update_available).toBe(false);
      expect(info.latest).toBe('3.4.1');
      expect(info.current).toBe('3.4.1');
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });
});
