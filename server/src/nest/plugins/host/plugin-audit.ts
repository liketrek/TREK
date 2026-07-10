import crypto from 'node:crypto';
import { METHOD_PERMISSION } from '../protocol/envelope';

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
  if (method === 'trips.create') return 'trips:new';
  if (method === 'trips.listMine') return 'trips:all';
  if (method === 'reservations.listMine') return 'reservations:all';
  if (method.startsWith('trips.') || method.startsWith('reservations.') || method.startsWith('accommodations.')) return `trip:${params.tripId ?? '?'}`;
  if (method === 'costs.listMine') return 'costs:all';
  if (method.startsWith('costs.')) return `trip:${params.tripId ?? '?'}`;
  if (method.startsWith('places.') || method.startsWith('days.') || method.startsWith('itinerary.')) return `trip:${params.tripId ?? '?'}`;
  if (method.startsWith('packing.') || method.startsWith('files.')) return `trip:${params.tripId ?? '?'}`;
  if (method === 'journal.listMine') return 'journal:all';
  if (method.startsWith('journal.')) return `journal:entry:${params.entryId ?? params.journeyId ?? '?'}`;
  if (method === 'atlas.visited') return 'atlas:all';
  if (method.startsWith('atlas.')) return 'atlas:own';
  if (method === 'vacay.mine') return 'vacay:all';
  if (method.startsWith('vacay.')) return 'vacay:own';
  if (method === 'collections.listMine') return 'collections:all';
  if (method.startsWith('collections.')) return `collection:${params.id ?? params.placeId ?? '?'}`;
  if (method.startsWith('daynotes.')) return `trip:${params.tripId ?? '?'}`;
  if (method.startsWith('collab.')) return `trip:${params.tripId ?? '?'}`;
  if (method.startsWith('todos.')) return `trip:${params.tripId ?? '?'}`;
  if (method === 'weather.get') return 'weather:global';
  if (method === 'rates.get') return 'rates:global';
  if (method === 'categories.list') return 'categories:all';
  if (method.startsWith('tags.')) return 'tags:own';
  if (method.startsWith('meta.')) return `${params.entityType ?? '?'}:${params.entityId ?? '?'}`;
  if (method === 'users.getById') return `user:${params.id ?? '?'}`;
  if (method === 'ws.broadcastToTrip') return `trip:${params.tripId ?? '?'}`;
  if (method === 'ws.broadcastToUser') return `user:${params.userId ?? '?'}`;
  if (method === 'notify.send') { const i = (params.input ?? {}) as Record<string, unknown>; return `notify:${i.scope ?? '?'}:${i.targetId ?? '?'}`; }
  if (method === 'ai.complete' || method === 'ai.extract') return 'ai:invoke';
  if (method === 'oauth.getToken') return 'oauth:token';
  if (method.startsWith('scheduler.')) return `scheduler:${params.name ?? '?'}`;
  if (method === 'plugins.call') return `plugin:${params.targetId ?? '?'}#${params.fn ?? '?'}`;
  if (method === 'events.emit') return `event:${params.event ?? '?'}`;
  return null;
}

/** True for calls we record (core data + ws); a plugin's own-db calls are skipped.
 *
 * Derived from METHOD_PERMISSION so a NEW capability method is auto-audited: anything
 * that unlocks via a permission other than `db:own` is core surface worth recording.
 * `plugins.call`/`events.emit` carry no permission (registered unconditionally) but are
 * core surface too, so they are named explicitly. This makes it impossible to add a
 * capability that reaches core data without an audit entry by omission. */
export function isAuditable(method: string): boolean {
  if (method === 'plugins.call' || method === 'events.emit') return true;
  const perm = (METHOD_PERMISSION as Record<string, string | undefined>)[method];
  return perm !== undefined && perm !== 'db:own';
}

// Per-plugin retention cap for the audit table — it lives in the SHARED trek.db, and a
// busy granted plugin at the sustained RPC rate could otherwise add a million rows a day
// with no reclaim path. Default 20k rows/plugin (weeks of normal activity), env-tunable;
// 0 disables pruning. Pruning is chain-SAFE: each retained row's hash still equals
// sha256(its stored prev_hash + its content), so the retained window stays tamper-evident
// — only continuity to a now-deleted genesis is lost, which is inherent to any retention.
const MAX_AUDIT_ROWS = envInt('TREK_PLUGIN_AUDIT_MAX_ROWS', 20_000);
const PRUNE_EVERY = 500; // amortise the COUNT/DELETE over this many appends per plugin
const appendsSincePrune = new Map<string, number>();

function envInt(name: string, def: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return def;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : def;
}

/** Keep only the newest `MAX_AUDIT_ROWS` rows for a plugin. Called amortised from
 * appendAudit; exported for tests. No-op when disabled or under the cap. */
export function pruneAudit(db: AuditDb, pluginId: string, keep = MAX_AUDIT_ROWS): void {
  if (keep <= 0) return;
  db.prepare(
    `DELETE FROM plugin_capability_audit WHERE plugin_id = ? AND id NOT IN
       (SELECT id FROM plugin_capability_audit WHERE plugin_id = ? ORDER BY id DESC LIMIT ?)`,
  ).run(pluginId, pluginId, keep);
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
  // Amortised retention: prune roughly every PRUNE_EVERY appends per plugin.
  const n = (appendsSincePrune.get(e.pluginId) ?? 0) + 1;
  if (n >= PRUNE_EVERY) { appendsSincePrune.set(e.pluginId, 0); pruneAudit(db, e.pluginId); }
  else appendsSincePrune.set(e.pluginId, n);
}

/** Read the most recent audit rows across ALL plugins for one acting user — the
 * "what have plugins done in my name?" view. This is what legitimizes the broad
 * read grants: the user, not just the admin, can see every plugin action bound to
 * them. Joined with the plugin name for display; capped. */
export function readAuditForUser(db: AuditDb, userId: number, limit = 200): unknown[] {
  return db
    .prepare(
      `SELECT a.ts, a.plugin_id, p.name AS plugin_name, a.method, a.resource, a.code
       FROM plugin_capability_audit a LEFT JOIN plugins p ON p.id = a.plugin_id
       WHERE a.acting_user_id = ? ORDER BY a.id DESC LIMIT ?`,
    )
    .all(userId, limit);
}

/** Read the most recent audit rows for a plugin (admin view). */
export function readAudit(db: AuditDb, pluginId: string, limit = 200): unknown[] {
  return db
    .prepare('SELECT ts, acting_user_id, method, resource, code FROM plugin_capability_audit WHERE plugin_id = ? ORDER BY id DESC LIMIT ?')
    .all(pluginId, limit);
}
