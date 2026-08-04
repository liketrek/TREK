import { db } from '../../db/database';
import { DatabaseService } from '../database/database.service';
import { RealtimeService } from '../realtime/realtime.service';
import { PackingService } from './packing.service';
import { PermissionsService } from '../permissions/permissions.service';

/**
 * Non-Nest entry point for the packing domain — for code running OUTSIDE the
 * Nest container (the legacy packing-list prompt registrar in
 * src/mcp/tools/prompts.ts; the packing MCP tools and resources moved to the
 * DI-discovered packing.mcp.ts, the plugin RPC host injects PackingService
 * via PluginHostDepsFactory, and the trip domain folded into the DI-native
 * TripsService, which injects PackingService). Exports only the legacy
 * services/packingService names still consumed outside the container, 1:1, so
 * repointing a consumer is an import-path-only diff. Inside the container,
 * inject PackingService instead. Delete this file when the prompts registrar
 * migrates.
 *
 * Module-level construction is safe: `db` is the reinitialize-proof Proxy onto
 * the shared better-sqlite3 singleton.
 */
const packing = new PackingService(new DatabaseService(db), new PermissionsService(new DatabaseService(db)), new RealtimeService());

export function listItems(tripId: string | number, userId?: number) {
  return packing.listItems(tripId, userId);
}
