import { createTestRegistry, type McpRegistry } from '../../src/nest-mcp';
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
import { RateLimitService } from '../../src/nest/common/rate-limit.service';
import { CollectionsMcp } from '../../src/nest/collections/collections.mcp';
import { CollectionsService } from '../../src/nest/collections/collections.service';
import { DatabaseService } from '../../src/nest/database/database.service';
import { DayNotesMcp } from '../../src/nest/day-notes/day-notes.mcp';
import { DayNotesService } from '../../src/nest/day-notes/day-notes.service';
import { DaysMcp } from '../../src/nest/days/days.mcp';
import { DaysService } from '../../src/nest/days/days.service';
import { MapsMcp } from '../../src/nest/maps/maps.mcp';
import { WeatherMcp } from '../../src/nest/weather/weather.mcp';
import { WeatherService } from '../../src/nest/weather/weather.service';
import { AirportsMcp } from '../../src/nest/airports/airports.mcp';
import { AuthMcp } from '../../src/nest/auth/auth.mcp';
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
import { ReservationsReadRepository } from '../../src/nest/reservations/reservations-read.repository';
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
import { McpToolGuardsService } from '../../src/nest/mcp-shared/mcp-tool-guards.service';
import { QueryHelpersService } from '../../src/nest/query-helpers/query-helpers.service';
import { JourneyMcp } from '../../src/nest/journey/journey.mcp';
import { JourneyDomainService } from '../../src/nest/journey/journey-domain.service';
import { JourneyShareService } from '../../src/nest/journey/journey-share.service';
import { TrekPhotosRepository } from '../../src/nest/photos/trek-photos.repository';
import { UnsplashService } from '../../src/nest/unsplash/unsplash.service';
import { UserCleanupService } from '../../src/nest/auth/user-cleanup.service';
import { WebauthnConfigService } from '../../src/nest/auth/webauthn-config.service';
import { TripMembershipService } from '../../src/nest/trip-membership/trip-membership.service';
import { MailerService } from '../../src/nest/notifications/mailer/mailer.service';
import { CalendarService } from '../../src/nest/calendar/calendar.service';
import { AccommodationsService } from '../../src/nest/accommodations/accommodations.service';
import { AccommodationsMcp } from '../../src/nest/accommodations/accommodations.mcp';
import { TripMembersService } from '../../src/nest/trip-members/trip-members.service';
import { TripReadModelService } from '../../src/nest/trip-read-model/trip-read-model.service';
import { TripPromptsMcp } from '../../src/nest/trips/trip-prompts.mcp';
import { PlacePhotoCacheService } from '../../src/nest/place-photos/place-photo-cache.service';
import { RuntimeEnvService } from '../../src/nest/app-config/runtime-env.service';
import { makeNotificationsService, makeNotificationPreferencesService } from './notifications';
import { AddonsService } from '../../src/nest/addons/addons.service';
import { notificationsStub } from './notifications';
import { EphemeralTokenService } from '../../src/nest/auth/ephemeral-token.service';
import { AllowedFileTypesService } from '../../src/nest/files/allowed-file-types.service';
import { makeStorageFixture } from './storage-fixture';

/**
 * Hand-wired counterpart of the boot-time discovery in McpRegistryService,
 * for the no-Nest MCP harness. One line per migrated domain — add the new
 * @McpController instance here when a domain moves off the legacy registrar
 * fan-out. Constructing against the `db` Proxy keeps per-file vi.mock's of
 * src/db/database flowing through (same pattern as todo.bridge.ts).
 */
export function createMcpTestRegistry(): McpRegistry {
  const dbService = new DatabaseService(db);
  const generalStorage = makeStorageFixture('').storage;
  const permissionsService = new PermissionsService(dbService);
  // Same argument list as auth.bridge.ts. AtlasService used to sit in third
  // place; when getTravelStats moved onto AtlasService itself the edge was
  // dropped and four collaborators took its place, but this call site kept the
  // old shape, so `membership` and `webauthn` held the wrong objects and
  // userCleanup/mailer/tokens were undefined.
  const realtimeService = new RealtimeService();
  const guards = new McpToolGuardsService(dbService, permissionsService, realtimeService);
  const exchangeRatesService = new ExchangeRatesService();
  const budgetService = new BudgetService(dbService, permissionsService, exchangeRatesService, realtimeService);
  const authService = new AuthService(
    dbService,
    permissionsService,
    new TripMembershipService(dbService),
    new WebauthnConfigService(dbService),
    new UserCleanupService(dbService, budgetService),
    new MailerService(dbService),
    new EphemeralTokenService(),
    new AllowedFileTypesService(dbService),
  );
  const queryHelpersService = new QueryHelpersService(dbService);
  const daysService = new DaysService(dbService, permissionsService, realtimeService, queryHelpersService);
  const todoService = new TodoService(dbService, permissionsService, realtimeService);
  const packingService = new PackingService(dbService, permissionsService, realtimeService, notificationsStub());
  const collabService = new CollabService(dbService, permissionsService, realtimeService, notificationsStub(), generalStorage, new RateLimitService());
  // Exactly one instance, shared by maps, places and share: its stampede guard
  // and its on-disk set only work if all three readers see the same maps.
  const placePhotoCache = new PlacePhotoCacheService(dbService, makeStorageFixture('photos/google/').storage);
  const mapsService = new MapsService(dbService, placePhotoCache);
  const journeyDomain = new JourneyDomainService(dbService, realtimeService, new TrekPhotosRepository(dbService));
  // The last three were previously omitted, which left them `undefined` at
  // runtime — silently fine while nothing called them, a TypeError the moment
  // the journey skeleton hooks landed on the place write paths. tsconfig.tests.json
  // covers `tests` now and CI runs it (npm run typecheck:tests), so a missed
  // dependency fails the build — pass them for real regardless of the gate.
  const placesService = new PlacesService(
    dbService, permissionsService, realtimeService, mapsService, queryHelpersService,
    new UnsplashService(dbService, new RuntimeEnvService(), generalStorage),
    placePhotoCache,
    journeyDomain,
    generalStorage,
  );
  const reservationsService = new ReservationsService(dbService, permissionsService, budgetService, realtimeService, notificationsStub(), new ReservationsReadRepository(dbService));
  const accommodationsService = new AccommodationsService(dbService, permissionsService, realtimeService);
  const membersService = new TripMembersService(dbService, budgetService, new UserCleanupService(dbService, budgetService), permissionsService, realtimeService, notificationsStub());
  const tripsService = new TripsService(
    dbService,
    reservationsService,
    daysService,
    permissionsService,
    budgetService,
    new VacayService(dbService, realtimeService, notificationsStub()),
    realtimeService,
    new UnsplashService(dbService, new RuntimeEnvService(), generalStorage),
    generalStorage,
  );
  const readModelService = new TripReadModelService(
    dbService, membersService, daysService, accommodationsService, budgetService,
    packingService, reservationsService, collabService, placesService, todoService,
    new FilesService(dbService, permissionsService, realtimeService, new EphemeralTokenService(), generalStorage),
  );
  const calendarService = new CalendarService(dbService, reservationsService);
  // The nine addon-gated surfaces read their toggle off an injected service now
  // rather than off addons.bridge's own instance, so the harness has to supply
  // one — against the same test DB, which is what makes the `when:` gates
  // answer truthfully here instead of against the process-wide singleton.
  const addonsService = new AddonsService(dbService);
  // One instance, three consumers: AssignmentsMcp, ReservationsMcp and PlacesMcp.
  const assignmentsService = new AssignmentsService(dbService, permissionsService, realtimeService, queryHelpersService, journeyDomain);
  return createTestRegistry(
    [
      new TagsMcp(new TagsService(dbService), authService),
      new CategoriesMcp(new CategoriesService(dbService)),
      // The weather and airport tools left the legacy mapsWeather registrar.
      new WeatherMcp(new WeatherService()),
      new AirportsMcp(),
      new AuthMcp(),
      new TodoMcp(todoService, authService, addonsService, guards),
      new PackingMcp(packingService, authService, addonsService, guards),
      new BudgetMcp(budgetService, exchangeRatesService, dbService, new RuntimeEnvService(), new TripMembershipService(dbService), addonsService, guards),
      new ReservationsMcp(reservationsService, daysService, budgetService, authService, assignmentsService, guards),
      new DayNotesMcp(new DayNotesService(dbService, permissionsService, realtimeService), authService, guards),
      new DaysMcp(daysService, authService, guards),
      new AccommodationsMcp(accommodationsService, dbService, placesService, authService, guards),
      new AssignmentsMcp(assignmentsService, daysService, authService, guards),
      new CollabMcp(collabService, authService, addonsService, guards),
      new VacayMcp(new VacayService(dbService, realtimeService, notificationsStub()), authService, addonsService),
      new TripsMcp(tripsService, todoService, collabService, authService, calendarService, membersService, readModelService, addonsService, guards),
      new TripPromptsMcp(tripsService, readModelService, packingService, addonsService),
      new ShareMcp(new ShareService(dbService, new SettingsService(dbService), permissionsService, queryHelpersService, placePhotoCache), authService, guards),
      new MapsMcp(mapsService),
      new PlacesMcp(placesService, mapsService, dbService, authService, journeyDomain, assignmentsService, guards),
      new CollectionsMcp(new CollectionsService(dbService, permissionsService, realtimeService, notificationsStub(), generalStorage), dbService, authService, addonsService),
      new TransitMcp(new TransitService(), daysService, reservationsService, dbService, authService, guards),
      new AtlasMcp(new AtlasService(dbService), addonsService, authService),
      new JourneyMcp(journeyDomain, new JourneyShareService(dbService, journeyDomain, new SettingsService(dbService)), addonsService, authService),
      new NotificationsMcp(makeNotificationsService(dbService, realtimeService), authService),
    ],
    { accessPolicy: trekMcpAccessPolicy, validateAccess: trekMcpValidateAccess },
  );
}
