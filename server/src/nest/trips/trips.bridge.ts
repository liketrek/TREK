import { db } from '../../db/database';
import { DatabaseService } from '../database/database.service';
import { RealtimeService } from '../realtime/realtime.service';
import { PermissionsService } from '../permissions/permissions.service';
import { QueryHelpersService } from '../query-helpers/query-helpers.service';
import { UnsplashService } from '../unsplash/unsplash.service';
import { PlacePhotoCacheService } from '../place-photos/place-photo-cache.service';
import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { TripsService } from './trips.service';
import { TodoService } from '../todo/todo.service';
import { PackingService } from '../packing/packing.service';
import { FilesService } from '../files/files.service';
import { ReservationsService } from '../reservations/reservations.service';
import { DaysService } from '../days/days.service';
import { BudgetService } from '../budget/budget.service';
import { ExchangeRatesService } from '../budget/exchange-rates.service';
import { CollabService } from '../collab/collab.service';
import { VacayService } from '../vacay/vacay.service';
import { PlacesService } from '../places/places.service';
import { MapsService } from '../maps/maps.service';
import { UserCleanupService } from '../auth/user-cleanup.service';

/**
 * Non-Nest entry point for the trip domain — for the two consumers that cannot
 * inject TripsService: the legacy packing-list/budget-overview prompt
 * registrar in src/mcp/tools/prompts.ts (outside the container) and
 * budget.mcp.ts's owner/member lookups (injecting TripsService there would
 * need a forwardRef'd TripsModule↔BudgetModule cycle, so it stays on the
 * bridge seam migration-graph.md planned). Exports only the legacy
 * services/tripService names they consume, 1:1, so repointing was an
 * import-path-only diff. Everything else injects TripsService. Delete this
 * file when the prompts registrar migrates and the budget MCP surface can
 * inject TripsService without a module cycle.
 *
 * Module-level construction is safe: `db` is the reinitialize-proof Proxy onto
 * the shared better-sqlite3 singleton.
 */
const dbs = () => new DatabaseService(db);
// One instance, not one per consumer: the in-flight dedup only works if the
// stampede guard is shared (see PlacePhotoCacheService).
const photoCache = new PlacePhotoCacheService(dbs(), new RuntimeEnvService());
const budget = new BudgetService(dbs(), new PermissionsService(dbs()), new ExchangeRatesService(), new RealtimeService());
const trips = new TripsService(
  dbs(),
  new TodoService(dbs(), new PermissionsService(dbs()), new RealtimeService()),
  new PackingService(dbs(), new PermissionsService(dbs()), new RealtimeService()),
  new FilesService(dbs(), new PermissionsService(dbs()), new RealtimeService()),
  new ReservationsService(dbs(), new PermissionsService(dbs()), budget, new RealtimeService()),
  new DaysService(dbs(), new PermissionsService(dbs()), new RealtimeService(), new QueryHelpersService(dbs())),
  new PermissionsService(dbs()),
  budget,
  new CollabService(dbs(), new PermissionsService(dbs()), new RealtimeService()),
  new VacayService(dbs(), new RealtimeService()),
  new RealtimeService(),
  new PlacesService(dbs(), new PermissionsService(dbs()), new RealtimeService(), new MapsService(dbs(), photoCache), new QueryHelpersService(dbs()), new UnsplashService(dbs(), new RuntimeEnvService()), photoCache),
  new UnsplashService(dbs(), new RuntimeEnvService()),
  new UserCleanupService(dbs()),
);

export function getTripOwner(tripId: string | number) {
  return trips.getOwner(tripId);
}

export function listMembers(tripId: string | number, tripOwnerId: number) {
  return trips.listMembers(tripId, tripOwnerId);
}

export function getTripSummary(tripId: number, viewerUserId?: number) {
  return trips.getTripSummary(tripId, viewerUserId);
}
