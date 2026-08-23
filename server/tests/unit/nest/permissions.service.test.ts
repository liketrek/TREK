/**
 * Unit tests for the DI-native PermissionsService — PERM-SVC-001 through
 * PERM-SVC-023 (001–013 moved 1:1 from the legacy
 * tests/unit/services/permissions.test.ts, which had no case IDs — the IDs are
 * introduced with the move; 014–016 pin the cache semantics the real DB now
 * makes testable; 017–020 pin the permissions.bridge delegation and the
 * module-scoped cache shared across the DI and bridge instances; 013 + 021–023
 * pin the quirk-fix pass: load-time level validation, the narrowed load-error
 * swallow, and the no-op-save early return). Uses a real in-memory SQLite DB
 * so the app_settings SQL is exercised faithfully.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

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
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
// The service logs unexpected load failures via the plain audit logger.
vi.mock('../../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

import Database from 'better-sqlite3';
import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { logError } from '../../../src/nest/audit/audit-log.logger';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { PermissionsService, PERMISSION_ACTIONS } from '../../../src/nest/permissions/permissions.service';
import {
  getPermissionsCache,
  invalidatePermissionsCache as invalidateSharedCache,
} from '../../../src/nest/permissions/permissions-cache';

const svc = new PermissionsService(new DatabaseService(testDb));

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  vi.clearAllMocks();
  testDb.prepare("DELETE FROM app_settings WHERE key LIKE 'perm_%'").run();
  svc.invalidatePermissionsCache();
});

afterAll(() => {
  testDb.close();
});

// ── checkPermission ───────────────────────────────────────────────────────────

describe('checkPermission — admin bypass', () => {
  it('PERM-SVC-001: admin always passes regardless of permission level', () => {
    for (const action of PERMISSION_ACTIONS) {
      expect(svc.checkPermission(action.key, 'admin', 1, 1, false)).toBe(true);
      expect(svc.checkPermission(action.key, 'admin', 99, 1, false)).toBe(true);
    }
  });
});

describe('checkPermission — everybody level', () => {
  it('PERM-SVC-002: trip_create (everybody) allows any authenticated user', () => {
    expect(svc.checkPermission('trip_create', 'user', null, 42, false)).toBe(true);
  });
});

describe('checkPermission — trip_owner level', () => {
  const ownerId = 10;
  const memberId = 20;

  it('PERM-SVC-003: trip owner passes trip_owner check', () => {
    expect(svc.checkPermission('trip_delete', 'user', ownerId, ownerId, false)).toBe(true);
  });

  it('PERM-SVC-004: member fails trip_owner check', () => {
    expect(svc.checkPermission('trip_delete', 'user', ownerId, memberId, true)).toBe(false);
  });

  it('PERM-SVC-005: non-member non-owner fails trip_owner check', () => {
    expect(svc.checkPermission('trip_delete', 'user', ownerId, memberId, false)).toBe(false);
  });
});

describe('checkPermission — trip_member level', () => {
  const ownerId = 10;
  const memberId = 20;
  const outsiderId = 30;

  it('PERM-SVC-006: trip owner passes trip_member check', () => {
    expect(svc.checkPermission('day_edit', 'user', ownerId, ownerId, false)).toBe(true);
  });

  it('PERM-SVC-007: trip member passes trip_member check', () => {
    expect(svc.checkPermission('day_edit', 'user', ownerId, memberId, true)).toBe(true);
  });

  it('PERM-SVC-008: outsider fails trip_member check', () => {
    expect(svc.checkPermission('day_edit', 'user', ownerId, outsiderId, false)).toBe(false);
  });
});

// ── getPermissionLevel ────────────────────────────────────────────────────────

describe('getPermissionLevel — defaults', () => {
  it('PERM-SVC-009: returns default level for known actions (no DB overrides)', () => {
    const defaults: Record<string, string> = {
      trip_create: 'everybody',
      trip_delete: 'trip_owner',
      day_edit: 'trip_member',
      budget_edit: 'trip_member',
    };
    for (const [key, expected] of Object.entries(defaults)) {
      expect(svc.getPermissionLevel(key)).toBe(expected);
    }
  });

  it('PERM-SVC-010: returns trip_owner for unknown action key', () => {
    expect(svc.getPermissionLevel('nonexistent_action')).toBe('trip_owner');
  });
});

// ── savePermissions ───────────────────────────────────────────────────────────

describe('savePermissions — invalid input is silently skipped', () => {
  it('PERM-SVC-011: returns skipped array containing invalid action key, writes no row', () => {
    const result = svc.savePermissions({ nonexistent_action: 'trip_member' });
    expect(result.skipped).toContain('nonexistent_action');
    const rows = testDb.prepare("SELECT key FROM app_settings WHERE key LIKE 'perm_%'").all();
    expect(rows).toEqual([]);
  });

  it('PERM-SVC-012: returns skipped array when level is not in allowedLevels for the action', () => {
    // trip_delete only allows ['admin', 'trip_owner'], so 'trip_member' is invalid
    const result = svc.savePermissions({ trip_delete: 'trip_member' });
    expect(result.skipped).toContain('trip_delete');
    const rows = testDb.prepare("SELECT key FROM app_settings WHERE key LIKE 'perm_%'").all();
    expect(rows).toEqual([]);
  });
});

describe('corrupt stored levels', () => {
  it('PERM-SVC-013: an unrecognized stored level is ignored — every reader falls back to the default', () => {
    testDb.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run('perm_trip_edit', 'unknown_level');
    testDb.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run('perm_trip_delete', '');
    svc.invalidatePermissionsCache();
    // Since the quirk fix the corrupt rows never enter the cache, so
    // getPermissionLevel, getAllPermissions and checkPermission agree on the
    // default instead of the old display-default/deny-in-check split.
    expect(svc.getPermissionLevel('trip_edit')).toBe('trip_owner');
    expect(svc.getAllPermissions().trip_edit).toBe('trip_owner');
    expect(svc.checkPermission('trip_edit', 'user', 10, 10, false)).toBe(true);   // owner passes the default
    expect(svc.checkPermission('trip_edit', 'user', 10, 20, true)).toBe(false);   // member still denied
    expect(svc.getPermissionLevel('trip_delete')).toBe('trip_owner');
  });

  it('PERM-SVC-021: a stored level outside the action\'s allowedLevels is ignored too', () => {
    // trip_edit only allows trip_owner/trip_member — a raw 'everybody' row must not widen it.
    testDb.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run('perm_trip_edit', 'everybody');
    svc.invalidatePermissionsCache();
    expect(svc.getPermissionLevel('trip_edit')).toBe('trip_owner');
    expect(svc.checkPermission('trip_edit', 'user', 10, 30, false)).toBe(false);
  });
});

describe('load failures', () => {
  it('PERM-SVC-022: a missing app_settings table stays silent and serves defaults; other DB failures are logged', () => {
    const bareDb = new Database(':memory:');
    const bareSvc = new PermissionsService(new DatabaseService(bareDb));
    bareSvc.invalidatePermissionsCache();
    expect(bareSvc.getPermissionLevel('trip_edit')).toBe('trip_owner');
    expect(logError).not.toHaveBeenCalled();
    // An unexpected failure (closed connection) must leave a trace.
    bareDb.close();
    bareSvc.invalidatePermissionsCache();
    expect(bareSvc.getPermissionLevel('trip_edit')).toBe('trip_owner');
    expect(logError).toHaveBeenCalledWith(expect.stringMatching(/^Permissions load failed: /));
    svc.invalidatePermissionsCache(); // don't leak the bare-DB cache to later tests
  });

  it('PERM-SVC-024: a failed read serves defaults without installing them, and a later read populates the cache', () => {
    const failing = { all: vi.fn((): { key: string; value: string }[] => { throw new Error('database connection is closed'); }) };
    const flakySvc = new PermissionsService(failing as unknown as DatabaseService);
    flakySvc.invalidatePermissionsCache();

    expect(flakySvc.getPermissionLevel('trip_edit')).toBe('trip_owner');
    // Nothing installed: an admin's stricter stored level would otherwise stay
    // invisible until somebody invalidated by hand.
    expect(getPermissionsCache()).toBe(null);

    failing.all.mockReturnValue([{ key: 'perm_trip_edit', value: 'trip_member' }]);
    expect(flakySvc.getPermissionLevel('trip_edit')).toBe('trip_member');
    expect(getPermissionsCache()).not.toBe(null);
    svc.invalidatePermissionsCache(); // don't leak the stub cache to later tests
  });

  it('PERM-SVC-023: an all-skipped save writes nothing and leaves the cache untouched', () => {
    expect(svc.getPermissionLevel('trip_edit')).toBe('trip_owner'); // prime the cache
    testDb.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run('perm_trip_edit', 'trip_member');
    const result = svc.savePermissions({ bogus: 'trip_member', trip_delete: 'trip_member' });
    expect(result.skipped).toEqual(['bogus', 'trip_delete']);
    // No valid entries → no transaction and no cache flush: the raw row above
    // stays invisible until an explicit invalidation.
    expect(svc.getPermissionLevel('trip_edit')).toBe('trip_owner');
    svc.invalidatePermissionsCache();
    expect(svc.getPermissionLevel('trip_edit')).toBe('trip_member');
  });
});

// ── cache semantics (real DB) ─────────────────────────────────────────────────

describe('stored overrides + cache', () => {
  it('PERM-SVC-014: stored perm_ row overrides the default after invalidation', () => {
    testDb.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run('perm_trip_edit', 'trip_member');
    svc.invalidatePermissionsCache();
    expect(svc.getPermissionLevel('trip_edit')).toBe('trip_member');
    // A plain member now passes what defaults to a trip_owner-only action.
    expect(svc.checkPermission('trip_edit', 'user', 10, 20, true)).toBe(true);
  });

  it('PERM-SVC-015: savePermissions persists the row and self-invalidates the cache', () => {
    // Prime the cache with the defaults first.
    expect(svc.getPermissionLevel('trip_edit')).toBe('trip_owner');
    const result = svc.savePermissions({ trip_edit: 'trip_member' });
    expect(result.skipped).toEqual([]);
    const row = testDb.prepare('SELECT value FROM app_settings WHERE key = ?').get('perm_trip_edit') as { value: string };
    expect(row.value).toBe('trip_member');
    // No manual invalidation — savePermissions did it.
    expect(svc.getPermissionLevel('trip_edit')).toBe('trip_member');
  });

  it('PERM-SVC-016: the cache memoizes until invalidated', () => {
    expect(svc.getPermissionLevel('trip_edit')).toBe('trip_owner');
    // Raw SQL write bypasses savePermissions' self-invalidation → stale value served.
    testDb.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run('perm_trip_edit', 'trip_member');
    expect(svc.getPermissionLevel('trip_edit')).toBe('trip_owner');
    svc.invalidatePermissionsCache();
    expect(svc.getPermissionLevel('trip_edit')).toBe('trip_member');
  });
});

// ── module-scoped cache across instances ──────────────────────────────────────

describe('module-scoped permissions cache', () => {
  const secondInstance = new PermissionsService(new DatabaseService(testDb));

  it('PERM-SVC-017: checkPermission agrees across independently built instances', () => {
    expect(secondInstance.checkPermission('trip_create', 'user', null, 42, false)).toBe(true);
    expect(secondInstance.checkPermission('trip_delete', 'user', 10, 20, true)).toBe(false);
  });

  it('PERM-SVC-020: the cache is module-scoped — shared by every service instance', () => {
    // Save through the DI instance; a second instance sees it immediately
    // (checkPermission for a plain member flips with the stored level).
    svc.savePermissions({ trip_edit: 'trip_member' });
    expect(secondInstance.checkPermission('trip_edit', 'user', 10, 20, true)).toBe(true);
    // Raw SQL write, then invalidate through permissions-cache — the plain
    // function backup.impl.ts calls after a restore. Both service instances
    // must serve the fresh value afterwards.
    testDb.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run('perm_trip_edit', 'trip_owner');
    expect(svc.getPermissionLevel('trip_edit')).toBe('trip_member'); // still cached
    invalidateSharedCache();
    expect(svc.getPermissionLevel('trip_edit')).toBe('trip_owner');
    expect(secondInstance.checkPermission('trip_edit', 'user', 10, 20, true)).toBe(false);
  });
});
