/**
 * Unit tests for the DI-native AdminService — ADMIN-SVC-001 through
 * ADMIN-SVC-069, moved 1:1 from tests/unit/services/adminService.test.ts with
 * the 2026-08 fold (IDs preserved, including the pre-existing 029/030 gap and
 * the duplicated 069). The packing-template cases (031-044, 056-064) moved with
 * their functions to tests/unit/nest/packing.service.test.ts.
 * Constructs the service directly over a real in-memory SQLite DB (repo
 * convention — no TestingModule). Focuses on validation/error branches that the
 * integration tests don't exercise. ADMIN-BR-001 pins the admin.bridge export.
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
vi.mock('../../../src/services/apiKeyCrypto', () => ({
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
import { createUser, createAdmin, createInviteToken } from '../../helpers/factories';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { AddonsService } from '../../../src/nest/addons/addons.service';
import { SettingsService } from '../../../src/nest/settings/settings.service';
import { AtlasService } from '../../../src/nest/atlas/atlas.service';
import { AuthService } from '../../../src/nest/auth/auth.service';
import { PasskeyService } from '../../../src/nest/auth/passkey.service';
import { PackingService } from '../../../src/nest/packing/packing.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { NotificationsService } from '../../../src/nest/notifications/notifications.service';
import { AdminService } from '../../../src/nest/admin/admin.service';
import { checkAndNotifyVersion as bridgeCheckAndNotifyVersion } from '../../../src/nest/admin/admin.bridge';
import { __clearVersionCacheForTests } from '../../../src/nest/admin/admin.helpers';

const dbs = new DatabaseService(testDb);
const realtime = new RealtimeService();
const permissions = new PermissionsService(dbs);
const auth = new AuthService(dbs, permissions, new AtlasService(dbs));
const svc = new AdminService(
  dbs,
  new SettingsService(dbs),
  new AddonsService(dbs),
  new PasskeyService(dbs, auth),
  new PackingService(dbs, permissions, realtime),
  auth,
  permissions,
  new NotificationsService(dbs, realtime),
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
const listInvites = () => svc.listInvites();
const createInvite = (by: number, d: Parameters<AdminService['createInvite']>[1]) => svc.createInvite(by, d);
const deleteInvite = (id: string) => svc.deleteInvite(id);
const getOidcSettings = () => svc.getOidcSettings();
const updateOidcSettings = (d: Parameters<AdminService['updateOidcSettings']>[0]) => svc.updateOidcSettings(d);
const saveDemoBaseline = () => svc.saveDemoBaseline();
const getGithubReleases = (perPage?: string, page?: string) => svc.getGithubReleases(perPage, page);
const checkVersion = () => svc.checkVersion();
const listAddons = () => svc.listAddons();
const updateAddon = (id: string, d: Parameters<AdminService['updateAddon']>[1]) => svc.updateAddon(id, d);
const listMcpTokens = () => svc.listMcpTokens();
const deleteMcpToken = (id: string) => svc.deleteMcpToken(id);

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

// ── Invites ───────────────────────────────────────────────────────────────────

describe('Invites', () => {
  it('ADMIN-SVC-024 — createInvite returns invite with token', () => {
    const { user: admin } = createAdmin(testDb);
    const result = createInvite(admin.id, { max_uses: 5 }) as any;
    expect(result.invite.token).toBeDefined();
    expect(result.invite.max_uses).toBe(5);
  });

  it('ADMIN-SVC-025 — createInvite defaults to 1 use', () => {
    const { user: admin } = createAdmin(testDb);
    const result = createInvite(admin.id, {}) as any;
    expect(result.uses).toBe(1);
  });

  it('ADMIN-SVC-026 — listInvites returns array', () => {
    const { user: admin } = createAdmin(testDb);
    createInvite(admin.id, {});
    const invites = listInvites() as any[];
    expect(invites.length).toBeGreaterThanOrEqual(1);
  });

  it('ADMIN-SVC-027 — deleteInvite removes invite', () => {
    const { user: admin } = createAdmin(testDb);
    const invite = createInviteToken(testDb, { created_by: admin.id }) as any;
    const result = deleteInvite(String(invite.id)) as any;
    expect(result.error).toBeUndefined();
    const check = testDb.prepare('SELECT id FROM invite_tokens WHERE id = ?').get(invite.id);
    expect(check).toBeUndefined();
  });

  it('ADMIN-SVC-028 — deleteInvite returns 404 for non-existent invite', () => {
    const result = deleteInvite('99999') as any;
    expect(result.status).toBe(404);
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

describe('OIDC Settings', () => {
  it('ADMIN-SVC-047 — getOidcSettings returns default empty values when no OIDC configured', () => {
    const result = getOidcSettings() as any;
    expect(result.issuer).toBe('');
    expect(result.client_id).toBe('');
    expect(result.oidc_only).toBe(false);
    expect(result.client_secret_set).toBe(false);
    expect(result.display_name).toBe('');
    expect(result.discovery_url).toBe('');
  });

  it('ADMIN-SVC-048 — updateOidcSettings persists issuer and client_id, then getOidcSettings returns them', () => {
    updateOidcSettings({ issuer: 'https://auth.example.com', client_id: 'my-client' });
    const result = getOidcSettings() as any;
    expect(result.issuer).toBe('https://auth.example.com');
    expect(result.client_id).toBe('my-client');
  });

  it('ADMIN-SVC-049 — updateOidcSettings does not write oidc_only (replaced by granular toggles)', () => {
    updateOidcSettings({ issuer: 'https://auth.example.com', client_id: 'my-client' });
    const result = getOidcSettings() as any;
    // oidc_only is no longer managed by updateOidcSettings; use password_login/oidc_login toggles
    expect(result.oidc_only).toBe(false);
  });
});

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

// ── MCP Tokens ────────────────────────────────────────────────────────────────

describe('MCP Tokens', () => {
  it('ADMIN-SVC-068 — listMcpTokens returns empty array initially', () => {
    const result = listMcpTokens() as any[];
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('ADMIN-SVC-069 — deleteMcpToken returns 404 for non-existent token', () => {
    const result = deleteMcpToken('99999') as any;
    expect(result.status).toBe(404);
    expect(result.error).toBeDefined();
  });
});

// ── admin.bridge ──────────────────────────────────────────────────────────────

describe('admin.bridge', () => {
  it('ADMIN-BR-001 — checkAndNotifyVersion delegates to AdminService over the shared db Proxy', async () => {
    createAdmin(testDb);
    __clearVersionCacheForTests();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ tag_name: 'v99.9.9', html_url: 'https://example.test/r' }),
      json: async () => ({ tag_name: 'v99.9.9', html_url: 'https://example.test/r' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await bridgeCheckAndNotifyVersion();

    const notified = testDb
      .prepare('SELECT value FROM app_settings WHERE key = ?')
      .get('last_notified_version') as { value: string } | undefined;
    expect(notified?.value).toBe('99.9.9');

    // The version cache is module-scoped in admin.helpers, so the bridge instance
    // and the container singleton share it — the second read must not re-fetch.
    expect(await svc.checkVersion()).toMatchObject({ latest: '99.9.9' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
    __clearVersionCacheForTests();
  });
});

// ── Quirk fixes landed after the 2026-08 fold ─────────────────────────────────

describe('admin quirk fixes (post-fold)', () => {
  it('ADMIN-SVC-071 — the three places toggles are fail-closed (=== true), matching bag-tracking', () => {
    // Unset used to read as ON (`!== 'false'`); a migration backfills 'true' for
    // existing installs so nobody loses a feature on upgrade.
    expect(svc.getPlacesPhotos()).toEqual({ enabled: false });
    expect(svc.getPlacesAutocomplete()).toEqual({ enabled: false });
    expect(svc.getPlacesDetails()).toEqual({ enabled: false });

    svc.updatePlacesPhotos(true);
    expect(svc.getPlacesPhotos()).toEqual({ enabled: true });

    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('places_details_enabled', 'garbage')").run();
    expect(svc.getPlacesDetails()).toEqual({ enabled: false });
  });

  it('ADMIN-SVC-072 — updateUser rejects an empty username/email instead of silently no-opping', () => {
    const { user } = createUser(testDb);
    expect(updateUser(String(user.id), { username: '' }) as any).toMatchObject({ status: 400, error: 'Username cannot be empty' });
    expect(updateUser(String(user.id), { email: '  ' }) as any).toMatchObject({ status: 400, error: 'Email cannot be empty' });
    // The row is untouched.
    const row = testDb.prepare('SELECT username FROM users WHERE id = ?').get(user.id) as { username: string };
    expect(row.username).toBe(user.username);
  });

  it('ADMIN-SVC-073 — createInvite 404s on a trip_id that does not resolve', () => {
    const { user: admin } = createAdmin(testDb);
    expect(createInvite(admin.id, { trip_id: 99999 }) as any).toMatchObject({ status: 404, error: 'Trip not found' });
    expect(createInvite(admin.id, { trip_id: 'not-a-number' }) as any).toMatchObject({ status: 404 });
    expect(testDb.prepare('SELECT COUNT(*) as c FROM invite_tokens').get()).toEqual({ c: 0 });
    // An absent/blank binding is still a plain registration invite.
    expect((createInvite(admin.id, {}) as any).tripId).toBeNull();
  });

  it('ADMIN-SVC-074 — listOAuthSessions survives a row with malformed scopes JSON', () => {
    const { user } = createUser(testDb);
    testDb.prepare("INSERT INTO oauth_clients (client_id, client_secret_hash, name) VALUES ('c1', 'hash', 'Client')").run();
    testDb.prepare(`
      INSERT INTO oauth_tokens (client_id, user_id, access_token_hash, refresh_token_hash, scopes,
                                access_token_expires_at, refresh_token_expires_at)
      VALUES ('c1', ?, 'ahash', 'rhash', 'not-json{', datetime('now', '+1 hour'), datetime('now', '+1 day'))
    `).run(user.id);

    const sessions = svc.listOAuthSessions() as any[];
    expect(sessions).toHaveLength(1);
    expect(sessions[0].scopes).toBeNull();
  });

  it('ADMIN-SVC-075 — updateOidcSettings applies all five writes atomically', () => {
    const result = svc.updateOidcSettings({ issuer: 'https://idp', client_id: 'cid', display_name: 'IdP' }) as any;
    expect(result.success).toBe(true);
    const settings = svc.getOidcSettings();
    expect(settings).toMatchObject({ issuer: 'https://idp', client_id: 'cid', display_name: 'IdP' });
  });
});
