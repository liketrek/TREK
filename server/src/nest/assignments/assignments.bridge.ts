import { db } from '../../db/database';
import { DatabaseService } from '../database/database.service';
import { RealtimeService } from '../realtime/realtime.service';
import { AssignmentsService } from './assignments.service';
import { PermissionsService } from '../permissions/permissions.service';

/**
 * Non-Nest entry point for the assignments domain — for code running OUTSIDE
 * the Nest container (the legacy places and reservations MCP registrars in
 * src/mcp/tools/places.ts and src/mcp/tools/reservations.ts; the assignment
 * MCP tools moved to the DI-discovered assignments.mcp.ts, and the plugin RPC
 * host injects AssignmentsService via PluginHostDepsFactory). Exports only the
 * legacy services/assignmentService names still consumed outside the
 * container, 1:1, so repointing a consumer is an import-path-only diff. Inside
 * the container, inject AssignmentsService instead. Delete this file when
 * those legacy consumers migrate.
 *
 * Unlike todo/packing, the instance is built lazily on first call, NOT at
 * module scope: this bridge sits on the mcp tools fan-out while its service
 * has a deep legacy-services import closure, so a module-level
 * `new AssignmentsService` would crash with an uninitialized class binding if
 * a services→mcp import edge ever forms a cycle through here (one existed via
 * adminService importing the ../mcp barrel until that was rerouted to
 * mcp/sessionManager). By the time any bridge function is called, all modules
 * have finished evaluating. (`db` is the reinitialize-proof Proxy onto the
 * shared better-sqlite3 singleton.)
 */
let instance: AssignmentsService | undefined;
function assignments(): AssignmentsService {
  return (instance ??= new AssignmentsService(new DatabaseService(db), new PermissionsService(new DatabaseService(db)), new RealtimeService()));
}

export function createAssignment(dayId: string | number, placeId: string | number, notes: string | null) {
  return assignments().createAssignment(dayId, placeId, notes);
}

export function dayExists(dayId: string | number, tripId: string | number) {
  return assignments().dayExists(dayId, tripId);
}

export function placeExists(placeId: string | number, tripId: string | number) {
  return assignments().placeExists(placeId, tripId);
}

export function getAssignmentForTrip(id: string | number, tripId: string | number) {
  return assignments().getAssignmentForTrip(id, tripId);
}
