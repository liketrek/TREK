import type { PluginContext } from './index.js';

/**
 * A mock PluginContext for unit-testing a plugin without a running TREK
 * (#plugins, M6). It enforces the SAME permission model: calling a capability
 * your plugin wasn't granted throws PERMISSION_DENIED — so a test can prove your
 * plugin degrades gracefully. Data access returns configured fixtures; the db is
 * a lightweight recorder (configure results, or use an integration test for real
 * SQL).
 */

export interface MockHostOptions {
  grants?: string[];
  config?: Record<string, unknown>;
  /**
   * Fixtures keyed by trip id; `members` gates access like the real host.
   * `costs` seeds budget items; `canEditCosts` (default true) models the
   * 'budget_edit' permission for `costs.create`.
   */
  trips?: Record<
    number,
    { members: number[]; data?: unknown; places?: unknown[]; reservations?: unknown[]; costs?: unknown[]; canEditCosts?: boolean }
  >;
  users?: Record<number, unknown>;
  /** Optional canned db.query results, keyed by the exact sql string. */
  queryResults?: Record<string, unknown[]>;
  /** The host-bound acting user for costs.* (a job/onLoad has none → refused). */
  actingUserId?: number;
  /** Whether the Costs (budget) addon is enabled; gates all costs.* (default true). */
  budgetAddonEnabled?: boolean;
}

export interface MockHost {
  ctx: PluginContext;
  /** Everything the plugin did, for assertions. */
  calls: { method: string; args: unknown[] }[];
  logs: { level: string; msg: string }[];
  broadcasts: { kind: 'trip' | 'user'; target: number; event: string; data: unknown }[];
}

class PermissionDenied extends Error {}

export function createMockHost(opts: MockHostOptions = {}): MockHost {
  const grants = new Set(opts.grants ?? []);
  const calls: MockHost['calls'] = [];
  const logs: MockHost['logs'] = [];
  const broadcasts: MockHost['broadcasts'] = [];

  const need = (perm: string, method: string) => {
    calls.push({ method, args: [] });
    if (!grants.has(perm)) throw new PermissionDenied(`PERMISSION_DENIED: ${method} requires ${perm}`);
  };
  const assertMember = (tripId: number, asUserId: number) => {
    const t = opts.trips?.[tripId];
    if (!t || !t.members.includes(asUserId)) throw new Error(`RESOURCE_FORBIDDEN: no access to trip ${tripId}`);
    return t;
  };
  const requireBudgetAddon = () => {
    if (opts.budgetAddonEnabled === false) throw new Error('RESOURCE_FORBIDDEN: the costs addon is disabled');
  };
  const requireActingUser = (): number => {
    if (opts.actingUserId === undefined) throw new Error('RESOURCE_FORBIDDEN: costs calls require an authenticated user context');
    return opts.actingUserId;
  };

  const ctx: PluginContext = {
    id: 'mock-plugin',
    config: Object.freeze({ ...(opts.config ?? {}) }),
    db: {
      async query(sql) {
        need('db:own', 'db.query');
        return (opts.queryResults?.[sql] ?? []) as never[];
      },
      async exec() {
        need('db:own', 'db.exec');
        return { changes: 0 };
      },
      async migrate() {
        need('db:own', 'db.migrate');
        return { applied: true };
      },
    },
    trips: {
      async getById(tripId, asUserId) {
        need('db:read:trips', 'trips.getById');
        return assertMember(tripId, asUserId).data ?? null;
      },
      async getPlaces(tripId, asUserId) {
        need('db:read:trips', 'trips.getPlaces');
        return assertMember(tripId, asUserId).places ?? [];
      },
      async getReservations(tripId, asUserId) {
        need('db:read:trips', 'trips.getReservations');
        return assertMember(tripId, asUserId).reservations ?? [];
      },
    },
    costs: {
      async getByTrip(tripId) {
        need('db:read:costs', 'costs.getByTrip');
        requireBudgetAddon();
        return assertMember(tripId, requireActingUser()).costs ?? [];
      },
      async listMine() {
        need('db:read:costs', 'costs.listMine');
        requireBudgetAddon();
        const uid = requireActingUser();
        return Object.values(opts.trips ?? {})
          .filter((t) => t.members.includes(uid))
          .flatMap((t) => t.costs ?? []);
      },
      async create(tripId, input) {
        need('db:write:costs', 'costs.create');
        requireBudgetAddon();
        const t = assertMember(tripId, requireActingUser());
        if (t.canEditCosts === false) {
          throw new Error(`RESOURCE_FORBIDDEN: no permission to edit costs on trip ${tripId}`);
        }
        const item = { id: (t.costs?.length ?? 0) + 1, trip_id: tripId, ...input };
        (t.costs ??= []).push(item);
        return item;
      },
    },
    users: {
      async getById(id) {
        need('db:read:users', 'users.getById');
        return opts.users?.[id] ?? null;
      },
    },
    ws: {
      async broadcastToTrip(tripId, event, data) {
        need('ws:broadcast:trip', 'ws.broadcastToTrip');
        broadcasts.push({ kind: 'trip', target: tripId, event, data });
      },
      async broadcastToUser(userId, event, data) {
        need('ws:broadcast:user', 'ws.broadcastToUser');
        broadcasts.push({ kind: 'user', target: userId, event, data });
      },
    },
    log: {
      info: (msg) => logs.push({ level: 'info', msg }),
      warn: (msg) => logs.push({ level: 'warn', msg }),
      error: (msg) => logs.push({ level: 'error', msg }),
    },
  };

  return { ctx, calls, logs, broadcasts };
}
