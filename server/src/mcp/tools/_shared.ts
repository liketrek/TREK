import { errorResult } from '@trek/nest-mcp';
import { db } from '../../db/database';
import { checkPermission } from '../../services/permissions';
import { broadcast } from '../../websocket';

// Generic MCP result helpers and annotation presets live in @trek/nest-mcp
// (single source for the legacy registrars below and the decorator-based
// domains). Re-exported so registrar files keep importing from here.
export {
  demoDenied,
  errorResult,
  ok,
  TOOL_ANNOTATIONS_DELETE,
  TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  TOOL_ANNOTATIONS_OPEN_WORLD_NON_IDEMPOTENT,
  TOOL_ANNOTATIONS_OPEN_WORLD_READONLY,
  TOOL_ANNOTATIONS_READONLY,
  TOOL_ANNOTATIONS_WRITE,
} from '@trek/nest-mcp';

export function safeBroadcast(tripId: number, event: string, payload: Record<string, unknown>): void {
  try {
    broadcast(tripId, event, { ...payload, _source: 'mcp' });
  } catch (err) {
    console.error(`[MCP] broadcast failed for ${event}:`, err?.message ?? err);
  }
}

export const MAX_MCP_TRIP_DAYS = 90;

export function noAccess() {
  return errorResult('Trip not found or access denied.');
}

export function permissionDenied() {
  return errorResult('You do not have permission to perform this action on this trip.');
}

/**
 * RBAC gate for MCP tools, mirroring the checkPermission() calls the REST/Nest
 * routes run. Call this after canAccessTrip() with the same action key the
 * matching REST route uses. Returns true when the user may perform `action`
 * on `tripId`.
 */
export function hasTripPermission(action: string, tripId: number | string, userId: number): boolean {
  const trip = db.prepare('SELECT user_id FROM trips WHERE id = ?').get(tripId) as { user_id?: number } | undefined;
  if (!trip) return false;
  const userRow = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role?: string } | undefined;
  const tripOwnerId = typeof trip.user_id === 'number' ? trip.user_id : null;
  return checkPermission(action, userRow?.role ?? 'user', tripOwnerId, userId, tripOwnerId !== userId);
}

/** True when the user has the global admin role (mirrors REST `user.role === 'admin'` gates). */
export function isAdminUser(userId: number): boolean {
  const userRow = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role?: string } | undefined;
  return userRow?.role === 'admin';
}

/** Error response for admin-only tools, reproducing the REST `{ error: 'Admin access required' }` string. */
export function adminRequired() {
  return errorResult('Admin access required');
}
