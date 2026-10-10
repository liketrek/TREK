import { AppSettings } from '../../db/entities/AppSettings.entity';
import type { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';
import { logError } from '../audit/audit-log.logger';
import { UnitOfWork } from '../database/unit-of-work';
import { PermissionsCacheStore, permissionsCacheSlot } from './permissions-cache';
import { ValidationError } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { PERMISSION_ACTIONS, evaluatePermission, type PermissionAction, type PermissionLevel } from '@trek/shared';

// The catalog (keys, levels, defaults) and the decision rule live in
// @trek/shared, so the admin screen and the client read the same table the
// server enforces. Re-exported here for the server code that imported them.
export { PERMISSION_ACTIONS };
export type { PermissionLevel };

const ACTIONS_MAP = new Map<string, PermissionAction>(PERMISSION_ACTIONS.map((a) => [a.key, a]));

// The cache is a PermissionsCacheStore (./permissions-cache), injected so a
// store shared between processes can be plugged in later. A hand-built
// service takes the store installed in permissionsCacheSlot, the one the
// backup restore path (backup.impl.ts, plain functions, no DI) flushes too.

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(AppSettings) private readonly appSettings: AppSettingsRepository,
    private readonly uow: UnitOfWork,
    private readonly cacheStore: PermissionsCacheStore = permissionsCacheSlot.get(),
  ) {}

  private async loadPermissions(): Promise<Map<string, PermissionLevel>> {
    const cached = await this.cacheStore.get();
    if (cached) return cached;
    const cache = new Map<string, PermissionLevel>();
    try {
      const rows = await this.appSettings.findByKeyPrefix('perm_');
      for (const row of rows) {
        // A typing artefact, not a parity change: AppSettingsRow types both
        // columns nullable, but `key` can never actually be null here (a NULL
        // key never matches `LIKE 'perm_%'`), and skipping a null `value` is
        // exactly the legacy `allowedLevels.includes(null) === false` skip.
        if (row.key == null || row.value == null) continue;
        const actionKey = row.key.replace('perm_', '');
        const action = ACTIONS_MAP.get(actionKey);
        // Only cache values the action actually allows: a corrupt/empty stored
        // level would otherwise deny in checkPermission while getAllPermissions
        // displays the default — ignoring it makes every reader fall back to
        // the default consistently.
        if (action && action.allowedLevels.includes(row.value as PermissionLevel)) {
          cache.set(actionKey, row.value as PermissionLevel);
        }
      }
    } catch (e) {
      // A MikroORM ValidationError here (typically cannotUseGlobalContext) is not
      // a DB failure — it means this call reached the repository outside any
      // request context (D6: a non-HTTP entrypoint that isn't wrapped in
      // withRequestContext, or a bug in one that is). Serving defaults for that
      // is fail-OPEN: an admin who tightened a flag from its default gets the
      // looser default back, silently, for as long as the misuse persists
      // (task-2-review.md C3). A programming error rethrows instead of degrading;
      // the same rule applies to any later "log and serve defaults" branch this
      // plan adds (AddonsService's flag reads are Task 4's, not touched here).
      if (e instanceof ValidationError) throw e;
      // Under the legacy better-sqlite3 path a "no such table" error meant
      // first-boot init racing this read, before the table existed, and was
      // swallowed silently. Under the ORM, migrations run to completion in
      // buildApp() before any request (or MCP/WS/cron entrypoint) can reach
      // this service — there is no window left where app_settings can be
      // missing — so that message match is dropped and every failure here is
      // now a real, loggable DB error; defaults are still served either way.
      // One residual window this doesn't cover: backup.impl.ts's restore swaps
      // the database file under a live process, so a concurrent load can still
      // see a missing/mid-swap table and will now log here — behaviour
      // (defaults, uncached) is unchanged, so it is log noise only.
      const msg = e instanceof Error ? e.message : String(e);
      logError(`Permissions load failed: ${msg}`);
      // Serve defaults for THIS call, but do not install them: a half-built
      // cache would freeze every later reader on the defaults until somebody
      // invalidates by hand, which is how a stricter admin setting silently
      // stops applying. The next call retries the read instead.
      return cache;
    }
    // Only a completed read becomes the shared cache.
    return this.cacheStore.set(cache);
  }

  invalidatePermissionsCache(): Promise<void> {
    return this.cacheStore.invalidate();
  }

  async getPermissionLevel(actionKey: string): Promise<PermissionLevel> {
    const perms = await this.loadPermissions();
    const stored = perms.get(actionKey);
    if (stored) return stored;
    const action = ACTIONS_MAP.get(actionKey);
    return action?.defaultLevel ?? 'trip_owner';
  }

  async getAllPermissions(): Promise<Record<string, PermissionLevel>> {
    const perms = await this.loadPermissions();
    const result: Record<string, PermissionLevel> = {};
    for (const action of PERMISSION_ACTIONS) {
      result[action.key] = perms.get(action.key) ?? action.defaultLevel;
    }
    return result;
  }

  async savePermissions(settings: Record<string, string>): Promise<{ skipped: string[] }> {
    const skipped: string[] = [];
    const valid: Array<[string, string]> = [];
    for (const [actionKey, level] of Object.entries(settings)) {
      const action = ACTIONS_MAP.get(actionKey);
      if (!action || !action.allowedLevels.includes(level as PermissionLevel)) {
        skipped.push(actionKey);
        continue;
      }
      valid.push([actionKey, level]);
    }
    // Nothing valid to write → no prepare, no transaction, no cache flush.
    if (valid.length === 0) return { skipped };
    await this.uow.transactional(async () => {
      for (const [actionKey, level] of valid) {
        await this.appSettings.setValue(`perm_${actionKey}`, level);
      }
    });
    await this.invalidatePermissionsCache();
    return { skipped };
  }

  /**
   * Check if a user passes the permission check for a given action.
   *
   * @param actionKey - The permission action key
   * @param userRole - 'admin' | 'user'
   * @param tripUserId - The trip owner's user ID (null for non-trip actions like trip_create)
   * @param userId - The requesting user's ID
   * @param isMember - Whether the user is a trip member (not owner)
   */
  async checkPermission(
    actionKey: string,
    userRole: string,
    tripUserId: number | null,
    userId: number,
    isMember: boolean,
  ): Promise<boolean> {
    // Admins always pass, without reading the configured level.
    if (userRole === 'admin') return true;

    const required = await this.getPermissionLevel(actionKey);
    const isOwner = tripUserId !== null && tripUserId === userId;
    return evaluatePermission(required, { isAdmin: false, isOwner, isMember });
  }
}
