import { db } from '../../db/database';
import { DatabaseService } from '../database/database.service';
import { RealtimeService } from '../realtime/realtime.service';
import { DaysService } from './days.service';
import { PermissionsService } from '../permissions/permissions.service';

/**
 * Non-Nest entry point for the day domain — for code running OUTSIDE the
 * Nest container (the legacy transports MCP registrar in src/mcp/tools/;
 * the day MCP tools and resources moved to the DI-discovered days.mcp.ts,
 * the transit tools to the DI-discovered transit.mcp.ts (which injects
 * DaysService), the plugin RPC host injects DaysService via
 * PluginHostDepsFactory, and the trip domain folded into the DI-native
 * TripsService, which injects DaysService — its bridge exports were pruned
 * with it). Exports only the legacy services/dayService names still consumed
 * outside the container, 1:1, so repointing a consumer is an import-path-only
 * diff. Inside the container, inject DaysService instead. Delete this file
 * when the transports registrar migrates.
 *
 * Module-level construction is safe: `db` is the reinitialize-proof Proxy onto
 * the shared better-sqlite3 singleton.
 */
const days = new DaysService(new DatabaseService(db), new PermissionsService(new DatabaseService(db)), new RealtimeService());

export function getDay(id: string | number, tripId: string | number) {
  return days.getDay(id, tripId);
}

export function listDays(tripId: string | number) {
  return days.list(tripId);
}
