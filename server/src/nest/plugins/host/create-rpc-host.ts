import { db, canAccessTrip } from '../../../db/database';
import { broadcast, broadcastToUser } from '../../../websocket';
import { listBudgetItems } from '../../../services/budgetService';
import { checkPermission } from '../../../services/permissions';
import { listTrips, updateTrip, NotFoundError, ValidationError } from '../../../services/tripService';
import { createPlace, updatePlace, deletePlace } from '../../../services/placeService';
import { createDay, getDay, updateDay, deleteDay } from '../../../services/dayService';
import { createAssignment, deleteAssignment, dayExists, placeExists, getAssignmentForTrip } from '../../../services/assignmentService';
import { isAddonEnabled } from '../../../services/adminService';
import { ADDON_IDS } from '../../../addons';
import { BudgetService } from '../../budget/budget.service';
import { PluginDataDb } from './plugin-data.service';
import { PluginRpcHost, ForbiddenResource, BadParams } from './rpc-host';
import { appendAudit } from './plugin-audit';

/**
 * The trip-access + role gate used by every planner write, mirroring the app's
 * per-domain `canEdit` (canAccessTrip + checkPermission for the entity's *_edit
 * action). Returns false — never throws — so the caller maps it to a clean
 * RESOURCE_FORBIDDEN.
 */
function canEditTripAs(action: string, tripId: number, userId: number): boolean {
  const trip = canAccessTrip(tripId, userId) as { user_id: number } | undefined;
  if (!trip) return false;
  const u = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role?: string } | undefined;
  if (!u) return false;
  return checkPermission(action, u.role ?? 'user', trip.user_id, userId, trip.user_id !== userId);
}

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
    // --- Places (place_edit). Delegate to the same placeService the REST/MCP paths
    // use, then broadcast the same events so open web sessions update live. ---
    canEditPlaces: (tripId, userId) => canEditTripAs('place_edit', tripId, userId),
    createPlace: (tripId, input) => {
      const place = createPlace(String(tripId), input as Parameters<typeof createPlace>[1]);
      broadcast(tripId, 'place:created', { place });
      return place;
    },
    updatePlace: (tripId, placeId, input) => {
      const place = updatePlace(String(tripId), String(placeId), input as Parameters<typeof updatePlace>[2]);
      if (place === null) throw new ForbiddenResource(`no place ${placeId} on trip ${tripId}`);
      broadcast(tripId, 'place:updated', { place });
      return place;
    },
    deletePlace: (tripId, placeId) => {
      const deleted = deletePlace(String(tripId), String(placeId));
      if (!deleted) throw new ForbiddenResource(`no place ${placeId} on trip ${tripId}`);
      broadcast(tripId, 'place:deleted', { placeId });
      return { deleted: true };
    },
    // --- Days (day_edit). getDay scopes the row to the trip before any write. ---
    canEditDays: (tripId, userId) => canEditTripAs('day_edit', tripId, userId),
    createDay: (tripId, input) => {
      const i = input as { date?: string; notes?: string };
      const day = createDay(tripId, i.date, i.notes);
      broadcast(tripId, 'day:created', { day });
      return day;
    },
    updateDay: (tripId, dayId, input) => {
      const current = getDay(dayId, tripId);
      if (!current) throw new ForbiddenResource(`no day ${dayId} on trip ${tripId}`);
      const day = updateDay(dayId, current, input as { notes?: string; title?: string | null });
      broadcast(tripId, 'day:updated', { day });
      return day;
    },
    deleteDay: (tripId, dayId) => {
      const current = getDay(dayId, tripId);
      if (!current) throw new ForbiddenResource(`no day ${dayId} on trip ${tripId}`);
      deleteDay(dayId);
      broadcast(tripId, 'day:deleted', { dayId });
      return { deleted: true };
    },
    // --- Itinerary (day_edit). Both the day AND the place must belong to the trip,
    // so a plugin can't cross-link another trip's rows (assignmentService doesn't
    // self-check this — the controllers do, so we reproduce it here). ---
    assignPlaceToDay: (tripId, dayId, placeId, notes) => {
      if (!dayExists(dayId, tripId)) throw new ForbiddenResource(`no day ${dayId} on trip ${tripId}`);
      if (!placeExists(placeId, tripId)) throw new ForbiddenResource(`no place ${placeId} on trip ${tripId}`);
      const assignment = createAssignment(dayId, placeId, notes);
      broadcast(tripId, 'assignment:created', { assignment });
      return assignment;
    },
    unassignPlace: (tripId, assignmentId) => {
      if (!getAssignmentForTrip(assignmentId, tripId)) throw new ForbiddenResource(`no assignment ${assignmentId} on trip ${tripId}`);
      deleteAssignment(assignmentId);
      broadcast(tripId, 'assignment:deleted', { assignmentId });
      return { deleted: true };
    },
    // --- Trip (trip_edit). Only the schema-writable fields reach updateTrip; its
    // NotFound/Validation errors are mapped to clean RPC codes. ---
    canEditTrip: (tripId, userId) => canEditTripAs('trip_edit', tripId, userId),
    updateTrip: (tripId, userId, input) => {
      const u = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role?: string } | undefined;
      try {
        const result = updateTrip(tripId, userId, input as Parameters<typeof updateTrip>[2], u?.role ?? 'user');
        broadcast(tripId, 'trip:updated', { trip: result.updatedTrip });
        return result.updatedTrip;
      } catch (e) {
        if (e instanceof ValidationError) throw new BadParams(e.message);
        if (e instanceof NotFoundError) throw new ForbiddenResource(e.message);
        throw e;
      }
    },
  });
}
