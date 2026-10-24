/**
 * Unit tests for the DI-native PermissionsService — PERM-SVC-001 through
 * PERM-SVC-024 (001–013 moved 1:1 from the legacy
 * tests/unit/services/permissions.test.ts, which had no case IDs — the IDs are
 * introduced with the move; 014–016 pin the cache semantics the real DB now
 * makes testable; 017–020 pin the permissions.bridge delegation and the
 * module-scoped cache shared across the DI and bridge instances; 013 + 021–023
 * pin the quirk-fix pass: load-time level validation, the narrowed load-error
 * swallow, and the no-op-save early return). Uses a real in-memory SQLite DB
 * so the app_settings SQL is exercised faithfully.
 *
 * Repository conversion (ORM Phase 3a, Task 2): PermissionsService no longer
 * holds a DatabaseService — it is built from AppSettingsRepository +
 * UnitOfWork, the same `t.repo(AppSettings)` pattern SettingsService's own
 * unit test established. 022/024 (the two load-failure cases) now drive the
 * failure through `vi.spyOn(appSettings, 'findByKeyPrefix')` instead of a
 * hand-rolled DatabaseService/all() stub.
 */
import { db as testDb } from '../../../src/db/database';
import { AppSettings } from '../../../src/db/entities/AppSettings.entity';
import type { AppSettingsRepository } from '../../../src/db/repositories/AppSettings.repository';
import { logError } from '../../../src/nest/audit/audit-log.logger';
import {
  getPermissionsCache,
  invalidatePermissionsCache as invalidateSharedCache,
} from '../../../src/nest/permissions/permissions-cache';
import { PermissionsService, PERMISSION_ACTIONS } from '../../../src/nest/permissions/permissions.service';
import { deleteRows, findRows } from '../../helpers/factories/rows';
import { readAppSetting, setAppSetting } from '../../helpers/factories/settings';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import { createTestUnitOfWork } from '../../helpers/test-uow';
import { ValidationError } from '@mikro-orm/core';

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

// ── DB setup ──────────────────────────────────────────────────────────────────

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
  };
  return mock;
});

// The service logs unexpected load failures via the plain audit logger.
vi.mock('../../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

let svc: PermissionsService;
let t: TestOrm;
let appSettings: AppSettingsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  appSettings = t.repo(AppSettings);
  svc = new PermissionsService(appSettings, await createTestUnitOfWork(testDb));
});

beforeEach(async () => {
  vi.clearAllMocks();
  await deleteRows(t, AppSettings, { key: { $like: 'perm_%' } });
  t.clear();
  await svc.invalidatePermissionsCache();
});

afterAll(async () => {
  await t.close();
  testDb.close();
});

// ── checkPermission ───────────────────────────────────────────────────────────

describe('checkPermission — admin bypass', () => {
  it('PERM-SVC-001: admin always passes regardless of permission level', async () => {
    for (const action of PERMISSION_ACTIONS) {
      expect(await svc.checkPermission(action.key, 'admin', 1, 1, false)).toBe(true);
      expect(await svc.checkPermission(action.key, 'admin', 99, 1, false)).toBe(true);
    }
  });
});

describe('checkPermission — everybody level', () => {
  it('PERM-SVC-002: trip_create (everybody) allows any authenticated user', async () => {
    expect(await svc.checkPermission('trip_create', 'user', null, 42, false)).toBe(true);
  });
});

describe('checkPermission: admin level', () => {
  it('PERM-SVC-026: trip_create narrowed to admin refuses every non-admin, the trip owner included', async () => {
    await svc.savePermissions({ trip_create: 'admin' });
    expect(await svc.checkPermission('trip_create', 'user', 42, 42, false)).toBe(false);
    expect(await svc.checkPermission('trip_create', 'user', null, 42, true)).toBe(false);
    expect(await svc.checkPermission('trip_create', 'admin', null, 42, false)).toBe(true);
  });
});

describe('checkPermission — trip_owner level', () => {
  const ownerId = 10;
  const memberId = 20;

  it('PERM-SVC-003: trip owner passes trip_owner check', async () => {
    expect(await svc.checkPermission('trip_delete', 'user', ownerId, ownerId, false)).toBe(true);
  });

  it('PERM-SVC-004: member fails trip_owner check', async () => {
    expect(await svc.checkPermission('trip_delete', 'user', ownerId, memberId, true)).toBe(false);
  });

  it('PERM-SVC-005: non-member non-owner fails trip_owner check', async () => {
    expect(await svc.checkPermission('trip_delete', 'user', ownerId, memberId, false)).toBe(false);
  });
});

describe('checkPermission — trip_member level', () => {
  const ownerId = 10;
  const memberId = 20;
  const outsiderId = 30;

  it('PERM-SVC-006: trip owner passes trip_member check', async () => {
    expect(await svc.checkPermission('day_edit', 'user', ownerId, ownerId, false)).toBe(true);
  });

  it('PERM-SVC-007: trip member passes trip_member check', async () => {
    expect(await svc.checkPermission('day_edit', 'user', ownerId, memberId, true)).toBe(true);
  });

  it('PERM-SVC-008: outsider fails trip_member check', async () => {
    expect(await svc.checkPermission('day_edit', 'user', ownerId, outsiderId, false)).toBe(false);
  });
});

// ── getPermissionLevel ────────────────────────────────────────────────────────

describe('getPermissionLevel — defaults', () => {
  it('PERM-SVC-009: returns default level for known actions (no DB overrides)', async () => {
    const defaults: Record<string, string> = {
      trip_create: 'everybody',
      trip_delete: 'trip_owner',
      day_edit: 'trip_member',
      budget_edit: 'trip_member',
    };
    for (const [key, expected] of Object.entries(defaults)) {
      expect(await svc.getPermissionLevel(key)).toBe(expected);
    }
  });

  it('PERM-SVC-010: returns trip_owner for unknown action key', async () => {
    expect(await svc.getPermissionLevel('nonexistent_action')).toBe('trip_owner');
  });
});

// ── savePermissions ───────────────────────────────────────────────────────────

describe('savePermissions — invalid input is silently skipped', () => {
  it('PERM-SVC-011: returns skipped array containing invalid action key, writes no row', async () => {
    const result = await svc.savePermissions({ nonexistent_action: 'trip_member' });
    expect(result.skipped).toContain('nonexistent_action');
    const rows = await findRows(t, AppSettings, { key: { $like: 'perm_%' } });
    expect(rows).toEqual([]);
  });

  it('PERM-SVC-012: returns skipped array when level is not in allowedLevels for the action', async () => {
    // trip_delete only allows ['admin', 'trip_owner'], so 'trip_member' is invalid
    const result = await svc.savePermissions({ trip_delete: 'trip_member' });
    expect(result.skipped).toContain('trip_delete');
    const rows = await findRows(t, AppSettings, { key: { $like: 'perm_%' } });
    expect(rows).toEqual([]);
  });
});

describe('corrupt stored levels', () => {
  it('PERM-SVC-013: an unrecognized stored level is ignored — every reader falls back to the default', async () => {
    await setAppSetting(t, 'perm_trip_edit', 'unknown_level');
    await setAppSetting(t, 'perm_trip_delete', '');
    await svc.invalidatePermissionsCache();
    // Since the quirk fix the corrupt rows never enter the cache, so
    // getPermissionLevel, getAllPermissions and checkPermission agree on the
    // default instead of the old display-default/deny-in-check split.
    expect(await svc.getPermissionLevel('trip_edit')).toBe('trip_owner');
    expect((await svc.getAllPermissions()).trip_edit).toBe('trip_owner');
    expect(await svc.checkPermission('trip_edit', 'user', 10, 10, false)).toBe(true); // owner passes the default
    expect(await svc.checkPermission('trip_edit', 'user', 10, 20, true)).toBe(false); // member still denied
    expect(await svc.getPermissionLevel('trip_delete')).toBe('trip_owner');
  });

  it("PERM-SVC-021: a stored level outside the action's allowedLevels is ignored too", async () => {
    // trip_edit only allows trip_owner/trip_member — a raw 'everybody' row must not widen it.
    await setAppSetting(t, 'perm_trip_edit', 'everybody');
    await svc.invalidatePermissionsCache();
    expect(await svc.getPermissionLevel('trip_edit')).toBe('trip_owner');
    expect(await svc.checkPermission('trip_edit', 'user', 10, 30, false)).toBe(false);
  });
});

describe('load failures', () => {
  it('PERM-SVC-022: a "no such table" read failure is no longer swallowed — migrations guarantee the table exists, so it is logged like any other failure, and defaults are still served', async () => {
    // Under the legacy better-sqlite3 path this exact message meant first-boot
    // init racing the read, before app_settings existed, and was swallowed
    // silently. Under the ORM, buildApp() runs migrations to completion
    // before any request/MCP/WS/cron entrypoint can reach this service, so
    // that race no longer exists — the message-specific swallow is dropped
    // and this failure now takes the same "log and serve defaults" path as
    // every other repository error. (task-6-review-template.md Minor 4: this
    // case does not itself assert getPermissionsCache() stays null for the
    // same branch — PERM-SVC-024 below does.)
    const spy = vi
      .spyOn(appSettings, 'findByKeyPrefix')
      .mockRejectedValueOnce(new Error('no such table: app_settings'));
    await svc.invalidatePermissionsCache();
    expect(await svc.getPermissionLevel('trip_edit')).toBe('trip_owner');
    expect(logError).toHaveBeenCalledWith('Permissions load failed: no such table: app_settings');
    spy.mockRestore();
    await svc.invalidatePermissionsCache(); // don't leak the failed-read (uncached) state
  });

  it('PERM-SVC-024: a failed read serves defaults without installing them, and a later read populates the cache', async () => {
    const spy = vi
      .spyOn(appSettings, 'findByKeyPrefix')
      .mockRejectedValueOnce(new Error('database connection is closed'));
    await svc.invalidatePermissionsCache();

    expect(await svc.getPermissionLevel('trip_edit')).toBe('trip_owner');
    expect(logError).toHaveBeenCalledWith('Permissions load failed: database connection is closed');
    // Nothing installed: an admin's stricter stored level would otherwise stay
    // invisible until somebody invalidated by hand.
    expect(await getPermissionsCache()).toBe(null);

    // The mock is exhausted after the one queued rejection — the next call
    // falls through to the real (now-working) repository read.
    await setAppSetting(t, 'perm_trip_edit', 'trip_member');
    expect(await svc.getPermissionLevel('trip_edit')).toBe('trip_member');
    expect(await getPermissionsCache()).not.toBe(null);
    spy.mockRestore();
    await svc.invalidatePermissionsCache(); // don't leak this test's cache to later tests
  });

  it('PERM-SVC-025: a MikroORM ValidationError (context misuse) is a programming error and propagates, uncached — it does not get the "log and serve defaults" treatment', async () => {
    // The concrete case this protects (task-2-review.md C3): checkPermission
    // reached from a non-HTTP entrypoint outside any request context throws
    // exactly this on a cold cache. Swallowing it and serving defaults was
    // fail-open — an admin's tightened flag silently reverted to its looser
    // default for as long as the misuse persisted. loadPermissions must rethrow
    // instead of degrading.
    const spy = vi
      .spyOn(appSettings, 'findByKeyPrefix')
      .mockRejectedValueOnce(ValidationError.cannotUseGlobalContext());
    await svc.invalidatePermissionsCache();

    await expect(svc.getPermissionLevel('trip_edit')).rejects.toThrow(ValidationError);
    expect(logError).not.toHaveBeenCalled();
    expect(await getPermissionsCache()).toBe(null);

    spy.mockRestore();
    await svc.invalidatePermissionsCache();
  });

  it('PERM-SVC-023: an all-skipped save writes nothing and leaves the cache untouched', async () => {
    expect(await svc.getPermissionLevel('trip_edit')).toBe('trip_owner'); // prime the cache
    await setAppSetting(t, 'perm_trip_edit', 'trip_member');
    const result = await svc.savePermissions({ bogus: 'trip_member', trip_delete: 'trip_member' });
    expect(result.skipped).toEqual(['bogus', 'trip_delete']);
    // No valid entries → no transaction and no cache flush: the raw row above
    // stays invisible until an explicit invalidation.
    expect(await svc.getPermissionLevel('trip_edit')).toBe('trip_owner');
    await svc.invalidatePermissionsCache();
    expect(await svc.getPermissionLevel('trip_edit')).toBe('trip_member');
  });
});

// ── cache semantics (real DB) ─────────────────────────────────────────────────

describe('stored overrides + cache', () => {
  it('PERM-SVC-014: stored perm_ row overrides the default after invalidation', async () => {
    await setAppSetting(t, 'perm_trip_edit', 'trip_member');
    await svc.invalidatePermissionsCache();
    expect(await svc.getPermissionLevel('trip_edit')).toBe('trip_member');
    // A plain member now passes what defaults to a trip_owner-only action.
    expect(await svc.checkPermission('trip_edit', 'user', 10, 20, true)).toBe(true);
  });

  it('PERM-SVC-015: savePermissions persists the row and self-invalidates the cache', async () => {
    // Prime the cache with the defaults first.
    expect(await svc.getPermissionLevel('trip_edit')).toBe('trip_owner');
    const result = await svc.savePermissions({ trip_edit: 'trip_member' });
    expect(result.skipped).toEqual([]);
    expect(await readAppSetting(t, 'perm_trip_edit')).toBe('trip_member');
    // No manual invalidation — savePermissions did it.
    expect(await svc.getPermissionLevel('trip_edit')).toBe('trip_member');
  });

  it('PERM-SVC-016: the cache memoizes until invalidated', async () => {
    expect(await svc.getPermissionLevel('trip_edit')).toBe('trip_owner');
    // A direct row write bypasses savePermissions' self-invalidation → stale value served.
    await setAppSetting(t, 'perm_trip_edit', 'trip_member');
    expect(await svc.getPermissionLevel('trip_edit')).toBe('trip_owner');
    await svc.invalidatePermissionsCache();
    expect(await svc.getPermissionLevel('trip_edit')).toBe('trip_member');
  });
});

// ── module-scoped cache across instances ──────────────────────────────────────

describe('module-scoped permissions cache', () => {
  let secondInstance: PermissionsService;

  // A nested beforeAll, not a top-level await in the describe callback (the
  // legacy file's shape): `appSettings` comes from the file-level beforeAll
  // above, which vitest guarantees has already run by the time any nested
  // beforeAll here executes, but would still be undefined during collection.
  beforeAll(async () => {
    secondInstance = new PermissionsService(appSettings, await createTestUnitOfWork(testDb));
  });

  it('PERM-SVC-017: checkPermission agrees across independently built instances', async () => {
    expect(await secondInstance.checkPermission('trip_create', 'user', null, 42, false)).toBe(true);
    expect(await secondInstance.checkPermission('trip_delete', 'user', 10, 20, true)).toBe(false);
  });

  it('PERM-SVC-020: the cache is module-scoped — shared by every service instance', async () => {
    // Save through the DI instance; a second instance sees it immediately
    // (checkPermission for a plain member flips with the stored level).
    await svc.savePermissions({ trip_edit: 'trip_member' });
    expect(await secondInstance.checkPermission('trip_edit', 'user', 10, 20, true)).toBe(true);
    // A direct row write, then invalidate through permissions-cache, the plain
    // function backup.impl.ts calls after a restore. Both service instances
    // must serve the fresh value afterwards.
    await setAppSetting(t, 'perm_trip_edit', 'trip_owner');
    expect(await svc.getPermissionLevel('trip_edit')).toBe('trip_member'); // still cached
    await invalidateSharedCache();
    expect(await svc.getPermissionLevel('trip_edit')).toBe('trip_owner');
    expect(await secondInstance.checkPermission('trip_edit', 'user', 10, 20, true)).toBe(false);
  });
});
