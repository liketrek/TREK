import { db, canAccessTrip } from '../../../db/database';
import { broadcast, broadcastToUser } from '../../../websocket';
import { listBudgetItems } from '../../../services/budgetService';
import { checkPermission } from '../../../services/permissions';
import { listTrips } from '../../../services/tripService';
import { isAddonEnabled } from '../../../services/adminService';
import { ADDON_IDS } from '../../../addons';
import { BudgetService } from '../../budget/budget.service';
import { PluginDataDb } from './plugin-data.service';
import { PluginRpcHost } from './rpc-host';
import { appendAudit } from './plugin-audit';

// Reused for costs.create so a plugin write frozen-FX and members/payers logic
// matches a normal web-app budget write exactly (it has no injected deps).
const budgetSvc = new BudgetService();

/**
 * Wires a plugin's capability host to the REAL privileged modules (#plugins,
 * M1). This is the ONLY plugin file that imports db/websocket — it runs in the
 * host (parent), never in the child. Broadcasts are force-namespaced to
 * `plugin:{id}:{event}` so a plugin can't forge a core event.
 */

const dataDbs = new Map<string, PluginDataDb>();

export function getPluginDataDb(id: string): PluginDataDb {
  let d = dataDbs.get(id);
  if (!d) {
    d = new PluginDataDb(id);
    dataDbs.set(id, d);
  }
  return d;
}

export function closePluginDataDb(id: string): void {
  dataDbs.get(id)?.close();
  dataDbs.delete(id);
}

export function createRealRpcHost(id: string, granted: ReadonlySet<string>): PluginRpcHost {
  return new PluginRpcHost(id, granted, {
    data: getPluginDataDb(id),
    db,
    canAccessTrip: (tripId, userId) => canAccessTrip(tripId, userId),
    // Two users "share a trip" when both are owner-or-member of the same trip.
    canSeeUser: (actingUserId, targetUserId) =>
      !!db
        .prepare(
          `SELECT 1 FROM trips t
             LEFT JOIN trip_members m1 ON m1.trip_id = t.id AND m1.user_id = ?
             LEFT JOIN trip_members m2 ON m2.trip_id = t.id AND m2.user_id = ?
            WHERE (t.user_id = ? OR m1.user_id IS NOT NULL)
              AND (t.user_id = ? OR m2.user_id IS NOT NULL)
            LIMIT 1`,
        )
        .get(actingUserId, targetUserId, actingUserId, targetUserId),
    broadcastToTrip: (tripId, event, payload) => broadcast(tripId, `plugin:${id}:${event}`, payload),
    broadcastToUser: (userId, payload) => broadcastToUser(userId, { type: `plugin:${id}`, ...payload }),
    audit: (entry) => appendAudit(db, entry),
    // --- Costs (budget items) ---
    budgetAddonEnabled: () => isAddonEnabled(ADDON_IDS.BUDGET),
    // Same gate as a REST/MCP budget mutation: the acting user must have trip
    // access AND the 'budget_edit' permission for their global role.
    canEditCosts: (tripId, userId) => {
      const trip = canAccessTrip(tripId, userId) as { user_id: number } | undefined;
      if (!trip) return false;
      const u = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role?: string } | undefined;
      if (!u) return false;
      return checkPermission('budget_edit', u.role ?? 'user', trip.user_id, userId, trip.user_id !== userId);
    },
    listCostsForTrip: (tripId) => listBudgetItems(tripId),
    // Cross-trip: every accessible trip's budget items (membership predicate is
    // baked into listTrips). Reuses the hydrated list so members/payers come too.
    listCostsForUser: (userId) => {
      const trips = listTrips(userId, null) as Array<{ id: number }>;
      return trips.flatMap((t) => listBudgetItems(t.id));
    },
    // Reuses BudgetService.create (frozen FX + members/payers), then broadcasts
    // the same 'budget:created' event the controller emits so the web app updates
    // live. No X-Socket-Id — a plugin has no originating socket.
    createCost: async (tripId, input) => {
      const item = await budgetSvc.create(String(tripId), input);
      broadcast(tripId, 'budget:created', { item });
      return item;
    },
  });
}
