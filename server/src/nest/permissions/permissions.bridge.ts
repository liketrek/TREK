import { db } from '../../db/database';
import { DatabaseService } from '../database/database.service';
import { PermissionsService } from './permissions.service';
import type { PermissionLevel } from './permissions.service';

/**
 * Non-Nest entry point for the permissions domain — for code running OUTSIDE
 * the Nest container (the legacy MCP _shared.ts hasTripPermission helper and
 * the legacy adminService/authService/backupService).
 * Exports the legacy services/permissions names 1:1 so repointing a consumer
 * is an import-path-only diff. Inside the container, inject PermissionsService
 * instead. Delete this file when the last legacy consumer migrates.
 *
 * The permissions cache is module-scoped in permissions.service.ts, so this
 * instance and the container singleton share one cache — invalidating through
 * either flushes both (backupService restores depend on this).
 *
 * Module-level construction is safe: `db` is the reinitialize-proof Proxy onto
 * the shared better-sqlite3 singleton.
 */
const permissions = new PermissionsService(new DatabaseService(db));

export { PERMISSION_ACTIONS } from './permissions.service';
export type { PermissionLevel, PermissionAction } from './permissions.service';

export function invalidatePermissionsCache(): void {
  permissions.invalidatePermissionsCache();
}

export function getPermissionLevel(actionKey: string): PermissionLevel {
  return permissions.getPermissionLevel(actionKey);
}

export function getAllPermissions(): Record<string, PermissionLevel> {
  return permissions.getAllPermissions();
}

export function savePermissions(settings: Record<string, string>): { skipped: string[] } {
  return permissions.savePermissions(settings);
}

export function checkPermission(
  actionKey: string,
  userRole: string,
  tripUserId: number | null,
  userId: number,
  isMember: boolean
): boolean {
  return permissions.checkPermission(actionKey, userRole, tripUserId, userId, isMember);
}
