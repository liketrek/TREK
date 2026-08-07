import { db } from '../../db/database';
import { DatabaseService } from '../database/database.service';
import { PermissionsService } from '../permissions/permissions.service';
import { AtlasService } from '../atlas/atlas.service';
import { AuthService } from './auth.service';
import { User } from '../../types';

/**
 * Non-Nest entry point for the auth domain — for code running OUTSIDE the
 * Nest container: the legacy MCP transport (mcp/index.ts token verification),
 * the legacy tool registrars (mcp/tools/journey|notifications|transports), the
 * not-yet-migrated services/adminService, and — as the one in-container
 * exception —
 * atlas.mcp.ts, which cannot inject AuthService without closing an
 * AuthModule↔AtlasModule cycle (AuthService injects AtlasService for
 * getTravelStats; same documented trade-off as places.mcp.ts keeping its
 * assignments.bridge imports).
 *
 * Exports the legacy services/authService names 1:1 so repointing a consumer
 * is an import-path-only diff. Inside the container, inject AuthService
 * instead. Delete exports as their last legacy consumer migrates.
 *
 * stripUserForClient is pure and re-exported straight from auth.helpers.ts;
 * avatarUrl keeps the legacy re-export shape (services/avatarUrl). The
 * pending-MFA and reset-throttle maps are module-scoped in auth.service.ts,
 * so this instance and the container singleton share one copy.
 *
 * Module-level construction is safe: `db` is the reinitialize-proof Proxy onto
 * the shared better-sqlite3 singleton (same pattern as permissions.bridge.ts).
 */
const auth = new AuthService(
  new DatabaseService(db),
  new PermissionsService(new DatabaseService(db)),
  new AtlasService(new DatabaseService(db)),
);

export { stripUserForClient } from './auth.helpers';
export { avatarUrl } from '../common/avatarUrl';

export function isDemoUser(userId: number): boolean {
  return auth.isDemoUser(userId);
}

export function verifyMcpToken(rawToken: string): User | null {
  return auth.verifyMcpToken(rawToken);
}

export function verifyJwtToken(token: string): User | null {
  return auth.verifyJwtToken(token);
}

export function resolveAuthToggles() {
  return auth.resolveAuthToggles();
}

export function generateToken(user: { id: number | bigint; password_version?: number }, rememberMe = false) {
  return auth.generateToken(user, rememberMe);
}

export function createWsToken(userId: number) {
  return auth.createWsToken(userId);
}
