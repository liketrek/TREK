import { db } from '../../db/database';
import { DatabaseService } from '../database/database.service';
import { RealtimeService } from '../realtime/realtime.service';
import { BudgetService } from './budget.service';
import { PermissionsService } from '../permissions/permissions.service';
import { ExchangeRatesService } from './exchange-rates.service';

/**
 * One in-container exception, and nothing else left:
 * UserCleanupService (nest/auth) takes removeUserFromBudgetItems from here
 * because BudgetModule imports AuthModule for BudgetMcp's demo guard, so
 * AuthModule cannot import BudgetModule back — see the note there. (The budget MCP
 * tools and resources moved to the DI-discovered budget.mcp.ts, the plugin
 * surface, CostsRpc, injects BudgetService directly, and the trip
 * domain folded into the DI-native TripsService, which injects BudgetService —
 * its bridge exports were pruned with it). Exports only the legacy
 * services/budgetService names still consumed outside the container, 1:1, so
 * Inside the container, inject BudgetService instead. The create_transport
 * registrar was the last outside-container consumer; it moved into
 * reservations.mcp.ts, so this file dies the moment BudgetMcp stops needing
 * AuthService.
 *
 * Module-level construction is safe: `db` is the reinitialize-proof Proxy onto
 * the shared better-sqlite3 singleton, and ExchangeRatesService keeps its FX
 * cache module-scoped on purpose so this instance and the DI singleton share
 * one cache.
 */
const budget = new BudgetService(new DatabaseService(db), new PermissionsService(new DatabaseService(db)), new ExchangeRatesService(), new RealtimeService());

export function removeUserFromBudgetItems(userId: number): void {
  budget.removeUserFromBudgetItems(userId);
}
