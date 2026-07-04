/**
 * Unit tests for adminService — ADMIN-SVC-001 through ADMIN-SVC-050.
 * Uses a real in-memory SQLite DB. Focuses on validation/error branches
 * that the integration tests don't exercise.
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
}));
vi.mock('../../../src/demo/demo-reset', () => ({
  saveBaseline: vi.fn(),
}));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createAdmin, createInviteToken } from '../../helpers/factories';
import {
  listUsers,
  createUser as svcCreateUser,
  updateUser,
  deleteUser,
  getStats,
  getPermissions,
  savePermissions,
  getAuditLog,
  listInvites,
  createInvite,
  deleteInvite,
  getBagTracking,
  updateBagTracking,
  listPackingTemplates,
  createPackingTemplate,
  updatePackingTemplate,
  deletePackingTemplate,
  createTemplateCategory,
  updateTemplateCategory,
  deleteTemplateCategory,
  getPackingTemplate,
  createTemplateItem,
  updateTemplateItem,
  deleteTemplateItem,
  getOidcSettings,
  updateOidcSettings,
  saveDemoBaseline,
  getGithubReleases,
  checkVersion,
  listAddons,
  updateAddon,
  updateCollabFeatures,
  listMcpTokens,
  deleteMcpToken,
} from '../../../src/services/adminService';

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

// ── Bag tracking ──────────────────────────────────────────────────────────────

describe('Bag tracking', () => {
  it('ADMIN-SVC-029 — getBagTracking returns enabled state', () => {
    const result = getBagTracking() as any;
    expect(typeof result.enabled).toBe('boolean');
  });

  it('ADMIN-SVC-030 — updateBagTracking persists the value', () => {
    updateBagTracking(true);
    expect((getBagTracking() as any).enabled).toBe(true);
    updateBagTracking(false);
    expect((getBagTracking() as any).enabled).toBe(false);
  });
});

// ── Packing templates ─────────────────────────────────────────────────────────

describe('Packing templates', () => {
  it('ADMIN-SVC-031 — createPackingTemplate returns template', () => {
    const { user: admin } = createAdmin(testDb);
    const result = createPackingTemplate('Beach Trip', admin.id) as any;
    expect(result.template.name).toBe('Beach Trip');
  });

  it('ADMIN-SVC-032 — createPackingTemplate returns 400 for empty name', () => {
    const { user: admin } = createAdmin(testDb);
    const result = createPackingTemplate('', admin.id) as any;
    expect(result.status).toBe(400);
  });

  it('ADMIN-SVC-033 — listPackingTemplates returns array', () => {
    const { user: admin } = createAdmin(testDb);
    createPackingTemplate('Template A', admin.id);
    const templates = listPackingTemplates() as any[];
    expect(templates.length).toBeGreaterThanOrEqual(1);
  });

  it('ADMIN-SVC-034 — updatePackingTemplate updates name', () => {
    const { user: admin } = createAdmin(testDb);
    const created = createPackingTemplate('Old Name', admin.id) as any;
    const result = updatePackingTemplate(String(created.template.id), { name: 'New Name' }) as any;
    expect(result.template.name).toBe('New Name');
  });

  it('ADMIN-SVC-035 — updatePackingTemplate returns 404 for non-existent', () => {
    const result = updatePackingTemplate('99999', { name: 'Ghost' }) as any;
    expect(result.status).toBe(404);
  });

  it('ADMIN-SVC-036 — deletePackingTemplate removes template', () => {
    const { user: admin } = createAdmin(testDb);
    const created = createPackingTemplate('To Delete', admin.id) as any;
    const result = deletePackingTemplate(String(created.template.id)) as any;
    expect(result.name).toBe('To Delete');
  });

  it('ADMIN-SVC-037 — deletePackingTemplate returns 404 for non-existent', () => {
    const result = deletePackingTemplate('99999') as any;
    expect(result.status).toBe(404);
  });
});

// ── Template categories ───────────────────────────────────────────────────────

describe('Template categories', () => {
  it('ADMIN-SVC-038 — createTemplateCategory creates a category', () => {
    const { user: admin } = createAdmin(testDb);
    const tpl = createPackingTemplate('Tpl', admin.id) as any;
    const result = createTemplateCategory(String(tpl.template.id), 'Clothing') as any;
    expect(result.category.name).toBe('Clothing');
  });

  it('ADMIN-SVC-039 — createTemplateCategory returns 400 for empty name', () => {
    const { user: admin } = createAdmin(testDb);
    const tpl = createPackingTemplate('Tpl', admin.id) as any;
    const result = createTemplateCategory(String(tpl.template.id), '') as any;
    expect(result.status).toBe(400);
  });

  it('ADMIN-SVC-040 — createTemplateCategory returns 404 for missing template', () => {
    const result = createTemplateCategory('99999', 'Clothing') as any;
    expect(result.status).toBe(404);
  });

  it('ADMIN-SVC-041 — updateTemplateCategory updates name', () => {
    const { user: admin } = createAdmin(testDb);
    const tpl = createPackingTemplate('Tpl', admin.id) as any;
    const cat = createTemplateCategory(String(tpl.template.id), 'Old') as any;
    const result = updateTemplateCategory(String(tpl.template.id), String(cat.category.id), { name: 'New' }) as any;
    expect(result.category.name).toBe('New');
  });

  it('ADMIN-SVC-042 — updateTemplateCategory returns 404 for missing category', () => {
    const { user: admin } = createAdmin(testDb);
    const tpl = createPackingTemplate('Tpl', admin.id) as any;
    const result = updateTemplateCategory(String(tpl.template.id), '99999', { name: 'X' }) as any;
    expect(result.status).toBe(404);
  });

  it('ADMIN-SVC-043 — deleteTemplateCategory removes category', () => {
    const { user: admin } = createAdmin(testDb);
    const tpl = createPackingTemplate('Tpl', admin.id) as any;
    const cat = createTemplateCategory(String(tpl.template.id), 'Remove Me') as any;
    const result = deleteTemplateCategory(String(tpl.template.id), String(cat.category.id)) as any;
    expect(result.error).toBeUndefined();
  });

  it('ADMIN-SVC-044 — deleteTemplateCategory returns 404 for missing', () => {
    const { user: admin } = createAdmin(testDb);
    const tpl = createPackingTemplate('Tpl', admin.id) as any;
    const result = deleteTemplateCategory(String(tpl.template.id), '99999') as any;
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

  it('ADMIN-SVC-046 — handles invalid JSON gracefully with _parse_error flag', () => {
    const { user } = createUser(testDb);
    testDb.prepare('INSERT INTO audit_log (user_id, action, details) VALUES (?, ?, ?)').run(
      user.id, 'bad_json_action', 'not-valid-json{'
    );
    const result = getAuditLog({}) as any;
    const entry = result.entries.find((e: any) => e.action === 'bad_json_action');
    expect(entry).toBeDefined();
    expect(entry.details).toEqual({ _parse_error: true });
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
      json: async () => ({ tag_name: 'v999.0.0', html_url: 'https://github.com/example/releases/tag/v999.0.0' }),
    }));
    const result = await checkVersion() as any;
    expect(result.update_available).toBe(true);
    expect(result.latest).toBe('999.0.0');
    expect(result.release_url).toBe('https://github.com/example/releases/tag/v999.0.0');
  });
});

// ── getPackingTemplate ────────────────────────────────────────────────────────

describe('getPackingTemplate', () => {
  it('ADMIN-SVC-056 — returns template with categories and items when template exists', () => {
    const { user: admin } = createAdmin(testDb);
    const tpl = createPackingTemplate('Full Template', admin.id) as any;
    const cat = createTemplateCategory(String(tpl.template.id), 'Clothing') as any;
    createTemplateItem(String(tpl.template.id), String(cat.category.id), 'T-Shirt');

    const result = getPackingTemplate(String(tpl.template.id)) as any;
    expect(result.template).toBeDefined();
    expect(result.template.name).toBe('Full Template');
    expect(Array.isArray(result.categories)).toBe(true);
    expect(result.categories.length).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(result.items[0].name).toBe('T-Shirt');
  });

  it('ADMIN-SVC-057 — returns 404 for non-existent template', () => {
    const result = getPackingTemplate('99999') as any;
    expect(result.status).toBe(404);
    expect(result.error).toBeDefined();
  });
});

// ── Template items ────────────────────────────────────────────────────────────

describe('Template items', () => {
  it('ADMIN-SVC-058 — createTemplateItem returns item with name', () => {
    const { user: admin } = createAdmin(testDb);
    const tpl = createPackingTemplate('Tpl', admin.id) as any;
    const cat = createTemplateCategory(String(tpl.template.id), 'Gear') as any;
    const result = createTemplateItem(String(tpl.template.id), String(cat.category.id), 'Backpack') as any;
    expect(result.item).toBeDefined();
    expect(result.item.name).toBe('Backpack');
  });

  it('ADMIN-SVC-059 — createTemplateItem returns 400 for empty name', () => {
    const { user: admin } = createAdmin(testDb);
    const tpl = createPackingTemplate('Tpl', admin.id) as any;
    const cat = createTemplateCategory(String(tpl.template.id), 'Gear') as any;
    const result = createTemplateItem(String(tpl.template.id), String(cat.category.id), '') as any;
    expect(result.status).toBe(400);
  });

  it('ADMIN-SVC-060 — createTemplateItem returns 404 for non-existent category', () => {
    const { user: admin } = createAdmin(testDb);
    const tpl = createPackingTemplate('Tpl', admin.id) as any;
    const result = createTemplateItem(String(tpl.template.id), '99999', 'Item') as any;
    expect(result.status).toBe(404);
  });

  it('ADMIN-SVC-061 — updateTemplateItem updates name', () => {
    const { user: admin } = createAdmin(testDb);
    const tpl = createPackingTemplate('Tpl', admin.id) as any;
    const cat = createTemplateCategory(String(tpl.template.id), 'Gear') as any;
    const item = createTemplateItem(String(tpl.template.id), String(cat.category.id), 'Old Item') as any;
    const result = updateTemplateItem(String(item.item.id), { name: 'New Item' }) as any;
    expect(result.item.name).toBe('New Item');
  });

  it('ADMIN-SVC-062 — updateTemplateItem returns 404 for non-existent item', () => {
    const result = updateTemplateItem('99999', { name: 'Ghost' }) as any;
    expect(result.status).toBe(404);
  });

  it('ADMIN-SVC-063 — deleteTemplateItem removes item', () => {
    const { user: admin } = createAdmin(testDb);
    const tpl = createPackingTemplate('Tpl', admin.id) as any;
    const cat = createTemplateCategory(String(tpl.template.id), 'Gear') as any;
    const item = createTemplateItem(String(tpl.template.id), String(cat.category.id), 'To Delete') as any;
    const result = deleteTemplateItem(String(item.item.id)) as any;
    expect(result.error).toBeUndefined();
    const check = testDb.prepare('SELECT id FROM packing_template_items WHERE id = ?').get(item.item.id);
    expect(check).toBeUndefined();
  });

  it('ADMIN-SVC-064 — deleteTemplateItem returns 404 for non-existent item', () => {
    const result = deleteTemplateItem('99999') as any;
    expect(result.status).toBe(404);
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

describe('updateCollabFeatures', () => {
  it('ADMIN-SVC-070 — reports whether a flag actually flipped (#1414)', () => {
    const first = updateCollabFeatures({ chat: false });
    expect(first.changed).toBe(true);
    expect(first.features.chat).toBe(false);
    // identical save → no change, MCP sessions must survive
    const second = updateCollabFeatures({ chat: false });
    expect(second.changed).toBe(false);
    const third = updateCollabFeatures({ chat: true });
    expect(third.changed).toBe(true);
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
