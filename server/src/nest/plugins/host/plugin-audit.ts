import type {
  PluginCapabilityAuditRepository,
  AuditForPluginRow,
  AuditForUserRow,
} from '../../../db/repositories/PluginCapabilityAudit.repository';
import { METHOD_PERMISSION } from '../protocol/envelope';

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
  if (method.startsWith('trips.') || method.startsWith('reservations.') || method.startsWith('accommodations.'))
    return `trip:${params.tripId ?? '?'}`;
  if (method === 'costs.listMine') return 'costs:all';
  if (method.startsWith('costs.')) return `trip:${params.tripId ?? '?'}`;
  if (method.startsWith('places.') || method.startsWith('days.') || method.startsWith('itinerary.'))
    return `trip:${params.tripId ?? '?'}`;
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
  if (method === 'notify.send') {
    const i = (params.input ?? {}) as Record<string, unknown>;
    return `notify:${i.scope ?? '?'}:${i.targetId ?? '?'}`;
  }
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

/**
 * Plan 3j Task 7 fix wave, must-land 1 (task-7-review.md R-hash-chain): a
 * per-plugin promise tail serializing `appendAudit`'s read-previous-hash +
 * insert pair. Before this, two RPCs from the SAME plugin racing through
 * `appendAudit` concurrently could both read the same `lastHash` before
 * either's INSERT committed, forking the chain — a live 40-way burst left
 * 108 of 120 rows unlinked. Queuing per plugin id (the SAME module-mutable-
 * state shape `appendsSincePrune` above already uses for the amortised
 * prune counter) fixes it: a plugin's Nth append always reads the (N-1)th's
 * committed hash, while a DIFFERENT plugin's chain never waits on this one's.
 *
 * `uow.transactional` (wrapping `lastHash` + `insertRow` in a real SQLite
 * transaction) was the fix brief's other option, but `isAuditable` covers
 * EVERY core-data/broadcast method, so it runs on nearly every granted RPC
 * call — wrapping each one in a transaction would serialize the app's single
 * connection mutex (`unit-of-work.ts`'s own docstring: "an open transaction
 * holds it for every other request") behind the audit write on every
 * authorized plugin call, a far larger blast radius than queuing one
 * plugin's own chain in JS. No DB transaction opens here, so rule 24 ("a
 * transactional body awaits DB work only") is not engaged either way. The
 * IPC answer-then-throw ruling (`rpc-host.ts#dispatch` computes the RPC
 * answer FIRST, then `try { await this.deps.audit(...) } catch { /*
 * auditing must never break a call * / }` afterward) is preserved unchanged:
 * a queued append's rejection surfaces only to the dispatch() call that
 * queued it, through that same swallow — never to an unrelated later call.
 */
const auditAppendTails = new Map<string, Promise<unknown>>();

/**
 * Runs `run` after every earlier queued append for `pluginId` has settled,
 * whether that one resolved or rejected — `.then(run, run)`, never a bare
 * `.then(run)`, which would leave every later append for this plugin
 * permanently queued behind one rejected promise. The stored tail is a
 * swallowed copy (`.then(() => undefined, () => undefined)`) so a later
 * call's own `auditAppendTails.get(pluginId)` read never itself rejects;
 * the returned promise is the UNswallowed one, so the caller that queued
 * THIS run still sees its own failure.
 */
function serializePerPlugin<T>(pluginId: string, run: () => Promise<T>): Promise<T> {
  const prevTail = auditAppendTails.get(pluginId) ?? Promise.resolve();
  const result = prevTail.then(run, run);
  auditAppendTails.set(
    pluginId,
    result.then(
      () => undefined,
      () => undefined,
    ),
  );
  return result;
}

function envInt(name: string, def: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return def;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : def;
}

/** Keep only the newest `MAX_AUDIT_ROWS` rows for a plugin. Called amortised from
 * appendAudit; exported for tests. No-op when disabled or under the cap. */
export async function pruneAudit(
  audit: PluginCapabilityAuditRepository,
  pluginId: string,
  keep = MAX_AUDIT_ROWS,
): Promise<void> {
  if (keep <= 0) return;
  await audit.pruneKeepingNewest(pluginId, keep);
}

/**
 * Append one entry to the per-plugin hash chain.
 *
 * R-hash-chain: the hash input is `prev_hash + JSON.stringify([pluginId,
 * actingUserId ?? null, method, resource ?? null, code, ts])`, in that field
 * order, with `ts` computed in JS as `new Date().toISOString()` BEFORE the
 * hash (never a DB-generated timestamp — see {@link verifyChain}'s docstring
 * for why that would make the chain non-reproducible). This construction is
 * byte-for-byte unchanged from the pre-conversion function; only the
 * persistence calls (the previous-hash read, the row write, the amortised
 * prune) now go through the repository instead of a raw `better-sqlite3`
 * handle.
 */
export async function appendAudit(audit: PluginCapabilityAuditRepository, e: AuditEntry): Promise<void> {
  // The read-previous-hash + insert pair, serialized per plugin — see
  // `serializePerPlugin`'s docstring above (must-land 1).
  await serializePerPlugin(e.pluginId, async () => {
    const prev = (await audit.lastHash(e.pluginId)) ?? '';
    const ts = new Date().toISOString();
    const row = JSON.stringify([e.pluginId, e.actingUserId ?? null, e.method, e.resource ?? null, e.code, ts]);
    const hash = crypto
      .createHash('sha256')
      .update(prev + row)
      .digest('hex');
    await audit.insertRow({
      plugin_id: e.pluginId,
      acting_user_id: e.actingUserId ?? null,
      method: e.method,
      resource: e.resource ?? null,
      code: e.code,
      ts,
      prev_hash: prev || null,
      hash,
    });
  });
  // Amortised retention: prune roughly every PRUNE_EVERY appends per plugin.
  const n = (appendsSincePrune.get(e.pluginId) ?? 0) + 1;
  if (n >= PRUNE_EVERY) {
    appendsSincePrune.set(e.pluginId, 0);
    await pruneAudit(audit, e.pluginId);
  } else appendsSincePrune.set(e.pluginId, n);
}

/** Read the most recent audit rows across ALL plugins for one acting user — the
 * "what have plugins done in my name?" view. This is what legitimizes the broad
 * read grants: the user, not just the admin, can see every plugin action bound to
 * them. Joined with the plugin name for display; capped. */
export async function readAuditForUser(
  audit: PluginCapabilityAuditRepository,
  userId: number,
  limit = 200,
): Promise<AuditForUserRow[]> {
  return audit.forUser(userId, limit);
}

/** Read the most recent audit rows for a plugin (admin view). */
export async function readAudit(
  audit: PluginCapabilityAuditRepository,
  pluginId: string,
  limit = 200,
): Promise<AuditForPluginRow[]> {
  return audit.forPlugin(pluginId, limit);
}

/**
 * Verify a hash chain's internal consistency: every row's `hash` reproduces
 * from its OWN `prev_hash` + fields (the exact {@link appendAudit}
 * construction above), and every row's `prev_hash` equals the immediately
 * preceding row's `hash` (or `''`/absent for the first row in the given
 * slice). `rows` must be ordered OLDEST FIRST (ascending `id`) — the reverse
 * of {@link readAudit}/{@link readAuditForUser}, which return newest-first
 * for display.
 *
 * Built to prove R-hash-chain's replay/extension property in tests (a
 * mutation dropping one field from the hash input makes this return false
 * on a chain that construction would otherwise still accept); kept as a
 * permanent utility rather than a throwaway test fixture, since an eventual
 * admin "verify audit integrity" surface would want exactly this.
 */
export function verifyChain(
  rows: Array<{
    plugin_id: string;
    acting_user_id: number | null;
    method: string;
    resource: string | null;
    code: string;
    ts: string;
    prev_hash: string | null;
    hash: string;
  }>,
): boolean {
  let prev = '';
  for (const r of rows) {
    if ((r.prev_hash ?? '') !== prev) return false;
    const row = JSON.stringify([r.plugin_id, r.acting_user_id ?? null, r.method, r.resource ?? null, r.code, r.ts]);
    const hash = crypto
      .createHash('sha256')
      .update(prev + row)
      .digest('hex');
    if (hash !== r.hash) return false;
    prev = r.hash;
  }
  return true;
}
