import crypto from 'node:crypto';

/**
 * Host-side, hash-chained capability audit (#plugins, L1 hardening).
 *
 * Every host-mediated core-data / broadcast call a plugin makes is recorded at
 * the RPC boundary — the one place the plugin provably can't reach — with the
 * HOST-bound acting user (not a value the plugin supplies) and a per-plugin hash
 * chain (hash = sha256(prev_hash + row)). That makes wide data grants
 * attributable, tamper-evident, and user-visible, which is exactly what lets
 * TREK grant broad reads to large addons without raising risk.
 */

interface AuditDb {
  prepare(sql: string): {
    get(...args: unknown[]): unknown;
    run(...args: unknown[]): unknown;
    all(...args: unknown[]): unknown[];
  };
}

export interface AuditEntry {
  pluginId: string;
  actingUserId?: number;
  method: string;
  resource?: string | null;
  code: string;
}

/** The methods worth auditing: core-data reads + broadcasts, not own-db noise. */
export function auditResource(method: string, params: Record<string, unknown>): string | null {
  if (method.startsWith('trips.')) return `trip:${params.tripId ?? '?'}`;
  if (method === 'costs.listMine') return 'costs:all';
  if (method.startsWith('costs.')) return `trip:${params.tripId ?? '?'}`;
  if (method.startsWith('places.') || method.startsWith('days.') || method.startsWith('itinerary.')) return `trip:${params.tripId ?? '?'}`;
  if (method.startsWith('packing.') || method.startsWith('files.')) return `trip:${params.tripId ?? '?'}`;
  if (method.startsWith('meta.')) return `${params.entityType ?? '?'}:${params.entityId ?? '?'}`;
  if (method === 'users.getById') return `user:${params.id ?? '?'}`;
  if (method === 'ws.broadcastToTrip') return `trip:${params.tripId ?? '?'}`;
  if (method === 'ws.broadcastToUser') return `user:${params.userId ?? '?'}`;
  if (method === 'plugins.call') return `plugin:${params.targetId ?? '?'}#${params.fn ?? '?'}`;
  if (method === 'events.emit') return `event:${params.event ?? '?'}`;
  return null;
}

/** True for calls we record (core data + ws); a plugin's own-db calls are skipped. */
export function isAuditable(method: string): boolean {
  return (
    method.startsWith('trips.') ||
    method.startsWith('costs.') ||
    method.startsWith('places.') ||
    method.startsWith('days.') ||
    method.startsWith('itinerary.') ||
    method.startsWith('packing.') ||
    method.startsWith('files.') ||
    method.startsWith('meta.') ||
    method.startsWith('users.') ||
    method.startsWith('ws.') ||
    method.startsWith('plugins.') ||
    method.startsWith('events.')
  );
}

/** Append one entry to the per-plugin hash chain. Synchronous (better-sqlite3). */
export function appendAudit(db: AuditDb, e: AuditEntry): void {
  const prev =
    (db.prepare('SELECT hash FROM plugin_capability_audit WHERE plugin_id = ? ORDER BY id DESC LIMIT 1').get(e.pluginId) as
      | { hash: string }
      | undefined)?.hash ?? '';
  const ts = new Date().toISOString();
  const row = JSON.stringify([e.pluginId, e.actingUserId ?? null, e.method, e.resource ?? null, e.code, ts]);
  const hash = crypto.createHash('sha256').update(prev + row).digest('hex');
  db.prepare(
    'INSERT INTO plugin_capability_audit (plugin_id, acting_user_id, method, resource, code, ts, prev_hash, hash) VALUES (?,?,?,?,?,?,?,?)',
  ).run(e.pluginId, e.actingUserId ?? null, e.method, e.resource ?? null, e.code, ts, prev || null, hash);
}

/** Read the most recent audit rows for a plugin (admin view). */
export function readAudit(db: AuditDb, pluginId: string, limit = 200): unknown[] {
  return db
    .prepare('SELECT ts, acting_user_id, method, resource, code FROM plugin_capability_audit WHERE plugin_id = ? ORDER BY id DESC LIMIT ?')
    .all(pluginId, limit);
}
