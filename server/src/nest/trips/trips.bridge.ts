import { db } from '../../db/database';
import { JourneyDomainService } from '../journey/journey-domain.service';
import { TrekPhotosRepository } from '../photos/trek-photos.repository';
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
import { AccommodationsService } from '../accommodations/accommodations.service';
import { TripMembersService } from '../trip-members/trip-members.service';
import { TripReadModelService } from '../trip-read-model/trip-read-model.service';

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
const journeyDomain = new JourneyDomainService(dbs(), new RealtimeService(), new TrekPhotosRepository(dbs()));
const budget = new BudgetService(dbs(), new PermissionsService(dbs()), new ExchangeRatesService(), new RealtimeService());
const permissions = new PermissionsService(dbs());
const realtime = new RealtimeService();
const days = new DaysService(dbs(), permissions, realtime, new QueryHelpersService(dbs()));
const accommodations = new AccommodationsService(dbs(), permissions, realtime);
const reservations = new ReservationsService(dbs(), permissions, budget, realtime);
const places = new PlacesService(dbs(), permissions, realtime, new MapsService(dbs(), photoCache), new QueryHelpersService(dbs()), new UnsplashService(dbs(), new RuntimeEnvService()), photoCache, journeyDomain);
const trips = new TripsService(
  dbs(),
  reservations,
  days,
  permissions,
  budget,
  new VacayService(dbs(), realtime),
  realtime,
  new UnsplashService(dbs(), new RuntimeEnvService()),
);
const members = new TripMembersService(dbs(), budget, new UserCleanupService(dbs()), permissions, realtime);
const readModel = new TripReadModelService(
  dbs(),
  members,
  days,
  accommodations,
  budget,
  new PackingService(dbs(), permissions, realtime),
  reservations,
  new CollabService(dbs(), permissions, realtime),
  places,
  new TodoService(dbs(), permissions, realtime),
  new FilesService(dbs(), permissions, realtime),
);

export function getTripOwner(tripId: string | number) {
  return trips.getOwner(tripId);
}

export function listMembers(tripId: string | number, tripOwnerId: number) {
  return members.listMembers(tripId, tripOwnerId);
}

export function getTripSummary(tripId: number, viewerUserId?: number) {
  return readModel.getTripSummary(tripId, viewerUserId);
}

/**
 * Every trip the user can access. Used by CostsRpc for the cross-trip cost feed:
 * BudgetModule cannot import TripsModule, because TripsModule already imports
 * BudgetModule, and injecting it would need a forwardRef'd cycle. Same reason
 * budget.mcp.ts reaches for this file.
 */
export function listTripsForUser(userId: number) {
  return trips.list(userId, null) as Array<{ id: number }>;
}
