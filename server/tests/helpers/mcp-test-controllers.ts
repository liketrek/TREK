import { createTestRegistry, type McpRegistry } from '@trek/nest-mcp';
import { db } from '../../src/db/database';
import { trekMcpAccessPolicy, trekMcpValidateAccess } from '../../src/mcp/nest-mcp-policy';
import { AssignmentsMcp } from '../../src/nest/assignments/assignments.mcp';
import { AssignmentsService } from '../../src/nest/assignments/assignments.service';
import { AtlasMcp } from '../../src/nest/atlas/atlas.mcp';
import { AtlasService } from '../../src/nest/atlas/atlas.service';
import { AuthService } from '../../src/nest/auth/auth.service';
import { BudgetMcp } from '../../src/nest/budget/budget.mcp';
import { BudgetService } from '../../src/nest/budget/budget.service';
import { ExchangeRatesService } from '../../src/nest/budget/exchange-rates.service';
import { CategoriesMcp } from '../../src/nest/categories/categories.mcp';
import { CategoriesService } from '../../src/nest/categories/categories.service';
import { CollabMcp } from '../../src/nest/collab/collab.mcp';
import { CollabService } from '../../src/nest/collab/collab.service';
import { CollectionsMcp } from '../../src/nest/collections/collections.mcp';
import { CollectionsService } from '../../src/nest/collections/collections.service';
import { DatabaseService } from '../../src/nest/database/database.service';
import { DayNotesMcp } from '../../src/nest/days/day-notes.mcp';
import { DayNotesService } from '../../src/nest/days/day-notes.service';
import { DaysMcp } from '../../src/nest/days/days.mcp';
import { DaysService } from '../../src/nest/days/days.service';
import { MapsMcp } from '../../src/nest/maps/maps.mcp';
import { MapsService } from '../../src/nest/maps/maps.service';
import { NotificationsMcp } from '../../src/nest/notifications/notifications.mcp';
import { NotificationsService } from '../../src/nest/notifications/notifications.service';
import { PackingMcp } from '../../src/nest/packing/packing.mcp';
import { PackingService } from '../../src/nest/packing/packing.service';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { PlacesMcp } from '../../src/nest/places/places.mcp';
import { PlacesService } from '../../src/nest/places/places.service';
import { ReservationsMcp } from '../../src/nest/reservations/reservations.mcp';
import { ReservationsService } from '../../src/nest/reservations/reservations.service';
import { TagsMcp } from '../../src/nest/tags/tags.mcp';
import { TagsService } from '../../src/nest/tags/tags.service';
import { SettingsService } from '../../src/nest/settings/settings.service';
import { ShareMcp } from '../../src/nest/share/share.mcp';
import { ShareService } from '../../src/nest/share/share.service';
import { TodoMcp } from '../../src/nest/todo/todo.mcp';
import { TodoService } from '../../src/nest/todo/todo.service';
import { TransitMcp } from '../../src/nest/transit/transit.mcp';
import { TransitService } from '../../src/nest/transit/transit.service';
import { FilesService } from '../../src/nest/files/files.service';
import { TripsMcp } from '../../src/nest/trips/trips.mcp';
import { TripsService } from '../../src/nest/trips/trips.service';
import { VacayMcp } from '../../src/nest/vacay/vacay.mcp';
import { VacayService } from '../../src/nest/vacay/vacay.service';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { QueryHelpersService } from '../../src/nest/query-helpers/query-helpers.service';
import { makeNotificationsService, makeNotificationPreferencesService } from './notifications';

/**
 * Hand-wired counterpart of the boot-time discovery in McpRegistryService,
 * for the no-Nest MCP harness. One line per migrated domain — add the new
 * @McpController instance here when a domain moves off the legacy registrar
 * fan-out. Constructing against the `db` Proxy keeps per-file vi.mock's of
 * src/db/database flowing through (same pattern as todo.bridge.ts).
 */
export function createMcpTestRegistry(): McpRegistry {
  const dbService = new DatabaseService(db);
  const permissionsService = new PermissionsService(dbService);
  const authService = new AuthService(dbService, permissionsService, new AtlasService(dbService));
  const realtimeService = new RealtimeService();
  const queryHelpersService = new QueryHelpersService(dbService);
  const daysService = new DaysService(dbService, permissionsService, realtimeService, queryHelpersService);
  const exchangeRatesService = new ExchangeRatesService();
  const budgetService = new BudgetService(dbService, permissionsService, exchangeRatesService, realtimeService);
  const todoService = new TodoService(dbService, permissionsService, realtimeService);
  const packingService = new PackingService(dbService, permissionsService, realtimeService);
  const collabService = new CollabService(dbService, permissionsService, realtimeService);
  const mapsService = new MapsService(dbService);
  const placesService = new PlacesService(dbService, permissionsService, realtimeService, mapsService, queryHelpersService);
  const reservationsService = new ReservationsService(dbService, permissionsService, budgetService, realtimeService);
  const tripsService = new TripsService(
    dbService,
    todoService,
    packingService,
    new FilesService(dbService, permissionsService, realtimeService),
    new ReservationsService(dbService, permissionsService, budgetService, realtimeService),
    daysService,
    permissionsService,
    budgetService,
    collabService,
    new VacayService(dbService, realtimeService),
    realtimeService,
    placesService,
  );
  return createTestRegistry(
    [
      new TagsMcp(new TagsService(dbService), authService),
      new CategoriesMcp(new CategoriesService(dbService)),
      new TodoMcp(todoService, authService),
      new PackingMcp(packingService, authService),
      new BudgetMcp(budgetService, exchangeRatesService, dbService, authService),
      new ReservationsMcp(reservationsService, daysService, budgetService, authService),
      new DayNotesMcp(new DayNotesService(dbService, permissionsService, realtimeService), authService),
      new DaysMcp(daysService, dbService, placesService, authService),
      new AssignmentsMcp(new AssignmentsService(dbService, permissionsService, realtimeService, queryHelpersService), daysService, authService),
      new CollabMcp(collabService, authService),
      new VacayMcp(new VacayService(dbService, realtimeService), authService),
      new TripsMcp(tripsService, todoService, collabService, authService),
      new ShareMcp(new ShareService(dbService, new SettingsService(dbService), permissionsService, queryHelpersService), authService),
      new MapsMcp(mapsService),
      new PlacesMcp(placesService, mapsService, dbService, authService),
      new CollectionsMcp(new CollectionsService(dbService, permissionsService, realtimeService), dbService, authService),
      new TransitMcp(new TransitService(), daysService, reservationsService, dbService, authService),
      new AtlasMcp(new AtlasService(dbService)),
      new NotificationsMcp(makeNotificationsService(dbService, realtimeService), authService),
    ],
    { accessPolicy: trekMcpAccessPolicy, validateAccess: trekMcpValidateAccess },
  );
}
