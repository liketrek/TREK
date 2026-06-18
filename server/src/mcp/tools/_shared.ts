import { broadcast } from '../../websocket';
import { db } from '../../db/database';
import { checkPermission } from '../../services/permissions';

export function safeBroadcast(tripId: number, event: string, payload: Record<string, unknown>): void {
  try {
    broadcast(tripId, event, { ...payload, _source: 'mcp' });
  } catch (err) {
    console.error(`[MCP] broadcast failed for ${event}:`, err?.message ?? err);
  }
}

export const MAX_MCP_TRIP_DAYS = 90;

export const TOOL_ANNOTATIONS_READONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

export const TOOL_ANNOTATIONS_WRITE = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

export const TOOL_ANNOTATIONS_DELETE = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: true,
  openWorldHint: false,
} as const;

export const TOOL_ANNOTATIONS_NON_IDEMPOTENT = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false,
} as const;

export function demoDenied() {
  return { content: [{ type: 'text' as const, text: 'Write operations are disabled in demo mode.' }], isError: true };
}

export function noAccess() {
  return { content: [{ type: 'text' as const, text: 'Trip not found or access denied.' }], isError: true };
}

export function permissionDenied() {
  return { content: [{ type: 'text' as const, text: 'You do not have permission to perform this action on this trip.' }], isError: true };
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
  return { content: [{ type: 'text' as const, text: 'Admin access required' }], isError: true };
}

export function ok(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}
