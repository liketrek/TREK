import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { logError } from '../audit/audit-log.logger';
import {
  getPermissionsCache,
  setPermissionsCache,
  invalidatePermissionsCache as invalidateSharedCache,
} from './permissions-cache';

/**
 * Permission levels (hierarchical, higher includes lower):
 *   admin > trip_owner > trip_member > everybody
 *
 * "everybody" means any authenticated user with trip access.
 * For trip_create, "everybody" means any authenticated user (no trip context).
 */
export type PermissionLevel = 'admin' | 'trip_owner' | 'trip_member' | 'everybody';

export interface PermissionAction {
  key: string;
  defaultLevel: PermissionLevel;
  allowedLevels: PermissionLevel[];
}

// All configurable actions with their defaults matching upstream behavior
export const PERMISSION_ACTIONS: PermissionAction[] = [
  // Trip management
  { key: 'trip_create',        defaultLevel: 'everybody',   allowedLevels: ['admin', 'everybody'] },
  { key: 'trip_edit',          defaultLevel: 'trip_owner',   allowedLevels: ['trip_owner', 'trip_member'] },
  { key: 'trip_delete',        defaultLevel: 'trip_owner',   allowedLevels: ['admin', 'trip_owner'] },
  { key: 'trip_archive',       defaultLevel: 'trip_owner',   allowedLevels: ['trip_owner', 'trip_member'] },
  { key: 'trip_cover_upload',  defaultLevel: 'trip_owner',   allowedLevels: ['trip_owner', 'trip_member'] },

  // Member management
  { key: 'member_manage',      defaultLevel: 'trip_owner',   allowedLevels: ['admin', 'trip_owner', 'trip_member'] },

  // Files
  { key: 'file_upload',        defaultLevel: 'trip_member',  allowedLevels: ['admin', 'trip_owner', 'trip_member'] },
  { key: 'file_edit',          defaultLevel: 'trip_member',  allowedLevels: ['trip_owner', 'trip_member'] },
  { key: 'file_delete',        defaultLevel: 'trip_member',  allowedLevels: ['trip_owner', 'trip_member'] },

  // Places
  { key: 'place_edit',         defaultLevel: 'trip_member',  allowedLevels: ['trip_owner', 'trip_member'] },

  // Budget
  { key: 'budget_edit',        defaultLevel: 'trip_member',  allowedLevels: ['trip_owner', 'trip_member'] },

  // Packing
  { key: 'packing_edit',       defaultLevel: 'trip_member',  allowedLevels: ['trip_owner', 'trip_member'] },

  // Reservations
  { key: 'reservation_edit',   defaultLevel: 'trip_member',  allowedLevels: ['trip_owner', 'trip_member'] },

  // Day notes & schedule
  { key: 'day_edit',           defaultLevel: 'trip_member',  allowedLevels: ['trip_owner', 'trip_member'] },

  // Collaboration (notes, polls, messages)
  { key: 'collab_edit',        defaultLevel: 'trip_member',  allowedLevels: ['trip_owner', 'trip_member'] },

  // Share link management
  { key: 'share_manage',       defaultLevel: 'trip_owner',   allowedLevels: ['trip_owner', 'trip_member'] },
];

const ACTIONS_MAP = new Map(PERMISSION_ACTIONS.map(a => [a.key, a]));

// The in-memory cache is deliberately MODULE-scoped, not instance state, and
// lives in ./permissions-cache: two service instances exist at runtime (the
// container singleton and the permissions.bridge instance for
// out-of-container consumers), and the backup restore path — plain functions,
// no DI — must flush the same cache the request path reads. Both instances
// wrap the same shared connection, so a single cache is also the correct
// data shape.

@Injectable()
export class PermissionsService {
  constructor(private readonly dbs: DatabaseService) {}

  private loadPermissions(): Map<string, PermissionLevel> {
    const cached = getPermissionsCache();
    if (cached) return cached;
    const cache = new Map<string, PermissionLevel>();
    try {
      const rows = this.dbs.all<{ key: string; value: string }>(
        "SELECT key, value FROM app_settings WHERE key LIKE 'perm_%'"
      );
      for (const row of rows) {
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
      // Missing table is expected during first-boot init; anything else is a
      // real DB failure that must not stay invisible (we still serve defaults).
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes('no such table')) logError(`Permissions load failed: ${msg}`);
      // Serve defaults for THIS call, but do not install them: a half-built
      // cache would freeze every later reader on the defaults until somebody
      // invalidates by hand, which is how a stricter admin setting silently
      // stops applying. The next call retries the read instead.
      return cache;
    }
    // Only a completed read becomes the shared cache.
    return setPermissionsCache(cache);
  }

  invalidatePermissionsCache(): void {
    invalidateSharedCache();
  }

  getPermissionLevel(actionKey: string): PermissionLevel {
    const perms = this.loadPermissions();
    const stored = perms.get(actionKey);
    if (stored) return stored;
    const action = ACTIONS_MAP.get(actionKey);
    return action?.defaultLevel ?? 'trip_owner';
  }

  getAllPermissions(): Record<string, PermissionLevel> {
    const perms = this.loadPermissions();
    const result: Record<string, PermissionLevel> = {};
    for (const action of PERMISSION_ACTIONS) {
      result[action.key] = perms.get(action.key) ?? action.defaultLevel;
    }
    return result;
  }

  savePermissions(settings: Record<string, string>): { skipped: string[] } {
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
    const upsert = this.dbs.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)');
    this.dbs.transaction(() => {
      for (const [actionKey, level] of valid) {
        upsert.run(`perm_${actionKey}`, level);
      }
    });
    this.invalidatePermissionsCache();
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
  checkPermission(
    actionKey: string,
    userRole: string,
    tripUserId: number | null,
    userId: number,
    isMember: boolean
  ): boolean {
    // Admins always pass
    if (userRole === 'admin') return true;

    const required = this.getPermissionLevel(actionKey);

    switch (required) {
      case 'admin':
        return false; // already checked above
      case 'trip_owner':
        return tripUserId !== null && tripUserId === userId;
      case 'trip_member':
        return (tripUserId !== null && tripUserId === userId) || isMember;
      case 'everybody':
        return true;
      default:
        return false;
    }
  }
}
