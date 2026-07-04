import {
  KNOWN_METHODS,
  type KnownMethod,
  type RpcError,
  type RpcRequest,
  type RpcResponse,
} from '../protocol/envelope';
import type { PluginDataDb } from './plugin-data.service';
import { auditResource, isAuditable } from './plugin-audit';

/**
 * The per-plugin capability router (#plugins, M1) — the ENFORCEMENT POINT.
 *
 * Built from the plugin's GRANTED permission set. Only the methods a permission
 * unlocks are registered; an ungranted method is simply never in the map, so the
 * plugin cannot "call it anyway" — there is no shared object, only messages, and
 * the host is the sole holder of the trek.db handle and the broadcast fns.
 *
 * Runs in the HOST (parent) process.
 */

/** Thrown by a handler when the acting user may not touch the requested resource. */
export class ForbiddenResource extends Error {}

interface CoreDb {
  prepare(sql: string): {
    all(...args: unknown[]): unknown[];
    get(...args: unknown[]): unknown;
  };
}

export interface HostDeps {
  /** The plugin's own sqlite (db:own). */
  data: PluginDataDb;
  /** Read-only handle to the core trek.db, used ONLY through the typed readers here. */
  db: CoreDb;
  /** Returns the trip row if the user may access it, else undefined. */
  canAccessTrip(tripId: number, userId: number): unknown;
  /** True if the target user is the acting user or co-members a trip with them. */
  canSeeUser(actingUserId: number, targetUserId: number): boolean;
  /** Namespaced trip broadcast (host forces the plugin:{id}:{event} event type). */
  broadcastToTrip(tripId: number, eventType: string, payload: Record<string, unknown>): void;
  /** Namespaced per-user broadcast. */
  broadcastToUser(userId: number, payload: Record<string, unknown>): void;
  /** Optional sink for the capability audit log (host-side, hash-chained). */
  audit?(entry: { pluginId: string; actingUserId?: number; method: string; resource: string | null; code: string }): void;
}

type Handler = (params: Record<string, unknown>, actingUserId: number | undefined) => unknown;

const num = (v: unknown, name: string): number => {
  const n = typeof v === 'string' ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isFinite(n)) throw new BadParams(`${name} must be a number`);
  return n;
};
const str = (v: unknown, name: string): string => {
  if (typeof v !== 'string') throw new BadParams(`${name} must be a string`);
  return v;
};
class BadParams extends Error {}

export class PluginRpcHost {
  private methods = new Map<string, Handler>();

  constructor(
    private readonly pluginId: string,
    granted: ReadonlySet<string>,
    private readonly deps: HostDeps,
  ) {
    const has = (p: string) => granted.has(p);

    if (has('db:own')) {
      this.methods.set('db.query', (p) => deps.data.query(str(p.sql, 'sql'), asArgs(p.args)));
      this.methods.set('db.exec', (p) => deps.data.exec(str(p.sql, 'sql'), asArgs(p.args)));
      this.methods.set('db.migrate', (p) => deps.data.migrate(str(p.id, 'id'), str(p.sql, 'sql')));
    }

    if (has('db:read:trips')) {
      this.methods.set('trips.getById', (p, uid) =>
        this.tripRead(p, uid, () => deps.db.prepare('SELECT * FROM trips WHERE id = ?').get(num(p.tripId, 'tripId'))),
      );
      this.methods.set('trips.getPlaces', (p, uid) =>
        this.tripRead(p, uid, () => deps.db.prepare('SELECT * FROM places WHERE trip_id = ? ORDER BY day_id, position').all(num(p.tripId, 'tripId'))),
      );
      this.methods.set('trips.getReservations', (p, uid) =>
        this.tripRead(p, uid, () => deps.db.prepare('SELECT * FROM reservations WHERE trip_id = ? ORDER BY reservation_time').all(num(p.tripId, 'tripId'))),
      );
    }

    if (has('db:read:users')) {
      // Scope to people the acting user can actually see (self or a trip they
      // share) so a plugin can't enumerate every account's profile by looping ids.
      this.methods.set('users.getById', (p, uid) => {
        const id = num(p.id, 'id');
        if (uid === undefined) throw new ForbiddenResource('user reads require an authenticated user context');
        if (id !== uid && !this.deps.canSeeUser(uid, id)) throw new ForbiddenResource(`no access to user ${id}`);
        return deps.db.prepare('SELECT id, username, display_name, avatar FROM users WHERE id = ?').get(id);
      });
    }

    if (has('ws:broadcast:trip')) {
      // Gate the TARGET the same way reads are gated: a plugin may only push to a
      // trip room the acting user is a member of — never an arbitrary/other-tenant
      // trip. (Event-type namespacing alone doesn't cross the membership boundary.)
      this.methods.set('ws.broadcastToTrip', (p, uid) => {
        const tripId = num(p.tripId, 'tripId');
        if (uid === undefined) throw new ForbiddenResource('broadcasts require an authenticated user context');
        if (!this.deps.canAccessTrip(tripId, uid)) throw new ForbiddenResource(`no access to trip ${tripId}`);
        deps.broadcastToTrip(tripId, str(p.event, 'event'), asPayload(p.data));
        return { ok: true };
      });
    }
    if (has('ws:broadcast:user')) {
      // Restrict to the acting user's own connections — a plugin may not push to
      // an arbitrary user it has no relationship to.
      this.methods.set('ws.broadcastToUser', (p, uid) => {
        const userId = num(p.userId, 'userId');
        if (uid === undefined || userId !== uid) {
          throw new ForbiddenResource('a plugin may only broadcast to the acting user');
        }
        deps.broadcastToUser(userId, { event: str(p.event, 'event'), ...asPayload(p.data) });
        return { ok: true };
      });
    }
  }

  /**
   * Membership-check every trip read against the acting user. The acting user is
   * bound by the HOST from the authenticated invocation (see the supervisor's
   * invocation map) — NOT taken from a plugin-supplied `asUserId`, which a plugin
   * could set to any id to read another user's trips. If no acting user is bound
   * (a job / onLoad, or a forged call), the read is forbidden.
   */
  private tripRead(p: Record<string, unknown>, actingUserId: number | undefined, read: () => unknown): unknown {
    const tripId = num(p.tripId, 'tripId');
    if (actingUserId === undefined) {
      throw new ForbiddenResource('trip reads require an authenticated user context');
    }
    if (!this.deps.canAccessTrip(tripId, actingUserId)) {
      throw new ForbiddenResource(`no access to trip ${tripId}`);
    }
    return read();
  }

  async dispatch(req: RpcRequest, actingUserId?: number): Promise<RpcResponse | RpcError> {
    const params = (req.params ?? {}) as Record<string, unknown>;
    const res = await this.handle(req, params, actingUserId);
    // Audit the core-data / broadcast surface (incl. denials) at the boundary.
    if (this.deps.audit && isAuditable(req.method)) {
      try {
        this.deps.audit({
          pluginId: this.pluginId,
          actingUserId,
          method: req.method,
          resource: auditResource(req.method, params),
          code: res.ok ? 'ok' : (res as RpcError).error.code,
        });
      } catch {
        /* auditing must never break a call */
      }
    }
    return res;
  }

  private async handle(
    req: RpcRequest,
    params: Record<string, unknown>,
    actingUserId?: number,
  ): Promise<RpcResponse | RpcError> {
    const handler = this.methods.get(req.method);
    if (!handler) {
      const known = (KNOWN_METHODS as readonly string[]).includes(req.method as KnownMethod);
      return this.err(
        req.id,
        known ? 'PERMISSION_DENIED' : 'UNKNOWN_METHOD',
        known
          ? `${req.method} requires a permission "${this.pluginId}" was not granted`
          : `unknown method ${req.method}`,
      );
    }
    try {
      const result = await handler(params, actingUserId);
      return { k: 'res', id: req.id, ok: true, result };
    } catch (e) {
      if (e instanceof BadParams) return this.err(req.id, 'BAD_PARAMS', e.message);
      if (e instanceof ForbiddenResource) return this.err(req.id, 'RESOURCE_FORBIDDEN', e.message);
      return this.err(req.id, 'HOST_ERROR', e instanceof Error ? e.message : 'internal error');
    }
  }

  private err(id: string, code: RpcError['error']['code'], message: string): RpcError {
    return { k: 'res', id, ok: false, error: { code, message } };
  }

  /** Release host-held resources (the plugin's own db handle) on terminal stop. */
  dispose(): void {
    try {
      this.deps.data.close();
    } catch {
      /* already closed */
    }
  }
}

function asArgs(v: unknown): unknown[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v;
  throw new BadParams('args must be an array');
}
function asPayload(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : { value: v };
}
