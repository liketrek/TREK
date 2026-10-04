import { createTestRegistry, type McpRegistry } from '../../src/nest-mcp';
import { SchoolHolidaysMcp } from '../../src/nest/school-holidays/school-holidays.mcp';
import { SchoolHolidaysService } from '../../src/nest/school-holidays/school-holidays.service';
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
import { DemoService } from '../../src/nest/common/demo.service';
import { RateLimitService } from '../../src/nest/common/rate-limit.service';
import { CollectionsMcp } from '../../src/nest/collections/collections.mcp';
import { CollectionsService } from '../../src/nest/collections/collections.service';
import { DayNotesMcp } from '../../src/nest/day-notes/day-notes.mcp';
import { DayNotesService } from '../../src/nest/day-notes/day-notes.service';
import { DaysMcp } from '../../src/nest/days/days.mcp';
import { DaysService } from '../../src/nest/days/days.service';
import { DayRemovalService } from '../../src/nest/days/day-removal.service';
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
import { ReservationsReadService } from '../../src/nest/reservations/reservations-read.service';
import { TagsMcp } from '../../src/nest/tags/tags.mcp';
import { TagsService } from '../../src/nest/tags/tags.service';
import { SettingsService } from '../../src/nest/settings/settings.service';
import { SettingsMcp } from '../../src/nest/settings/settings.mcp';
import { ShareMcp } from '../../src/nest/share/share.mcp';
import { ShareService } from '../../src/nest/share/share.service';
import { TodoMcp } from '../../src/nest/todo/todo.mcp';
import { TodoService } from '../../src/nest/todo/todo.service';
import { TransitMcp } from '../../src/nest/transit/transit.mcp';
import { GoogleTransitProvider } from '../../src/nest/transit/google-transit.provider';
import { TransitService } from '../../src/nest/transit/transit.service';
import { FilesService } from '../../src/nest/files/files.service';
import { FilesMcp } from '../../src/nest/files/files.mcp';
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
import { TrekPhotoRegistrationService } from '../../src/nest/photos/trek-photo-registration.service';
import { TrekPhotos } from '../../src/db/entities/TrekPhotos.entity';
import { TripPhotos } from '../../src/db/entities/TripPhotos.entity';
import { TripAlbumLinks } from '../../src/db/entities/TripAlbumLinks.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { TrekPhotoCacheMeta } from '../../src/db/entities/TrekPhotoCacheMeta.entity';
import { PhotoProviders } from '../../src/db/entities/PhotoProviders.entity';
import { UnsplashService } from '../../src/nest/unsplash/unsplash.service';
import { UserCleanupService } from '../../src/nest/auth/user-cleanup.service';
import { WebauthnConfigService } from '../../src/nest/auth/webauthn-config.service';
import { TripMembershipService } from '../../src/nest/trip-membership/trip-membership.service';
import { MailerService } from '../../src/nest/notifications/mailer/mailer.service';
import { CalendarService } from '../../src/nest/calendar/calendar.service';
import { FeedsMcp } from '../../src/nest/feeds/feeds.mcp';
import { FeedsService } from '../../src/nest/feeds/feeds.service';
import { TripInviteMcp } from '../../src/nest/trip-invite/trip-invite.mcp';
import { TripInviteService } from '../../src/nest/trip-invite/trip-invite.service';
import { AccommodationsService } from '../../src/nest/accommodations/accommodations.service';
import { AccommodationsMcp } from '../../src/nest/accommodations/accommodations.mcp';
import { TripMembersService } from '../../src/nest/trip-members/trip-members.service';
import { TripReadModelService } from '../../src/nest/trip-read-model/trip-read-model.service';
import { TripPromptsMcp } from '../../src/nest/trips/trip-prompts.mcp';
import { PlacePhotoCacheService } from '../../src/nest/place-photos/place-photo-cache.service';
import { RuntimeEnvService } from '../../src/nest/app-config/runtime-env.service';
import { makeNotificationsService, makeNotificationPreferencesService } from './notifications';
import { createTestAddonsService } from './test-addons';
import { RoadtripMcp } from '../../src/nest/roadtrip/roadtrip.mcp';
import { RoadtripPreferencesMcp } from '../../src/nest/roadtrip/roadtrip-preferences.mcp';
import { RoadtripPreferencesService } from '../../src/nest/roadtrip/roadtrip-preferences.service';
import { RoadtripService } from '../../src/nest/roadtrip/roadtrip.service';
import { notificationsStub } from './notifications';
import { EphemeralTokenService } from '../../src/nest/auth/ephemeral-token.service';
import { AllowedFileTypesService } from '../../src/nest/files/allowed-file-types.service';
import { MemoriesMcp } from '../../src/nest/memories/memories.mcp';
import { ImmichService } from '../../src/nest/memories/immich.service';
import { SynologyService } from '../../src/nest/memories/synology.service';
import { MemoriesAccessService } from '../../src/nest/memories/memories-access.service';
import { PhotoCaptureBackfillService } from '../../src/nest/memories/photo-capture-backfill.service';
import { JourneyPhotoCaptureService } from '../../src/nest/journey/journey-photo-capture.service';
import { PhotoResolverService } from '../../src/nest/memories/photo-resolver.service';
import { ThumbnailService } from '../../src/nest/memories/thumbnail.service';
import { TrekPhotoCacheService } from '../../src/nest/memories/trek-photo-cache.service';
import { PhotoProviderRegistry } from '../../src/nest/memories/photo-provider.registry';
import { ImmichPhotoProvider } from '../../src/nest/memories/providers/immich.provider';
import { SynologyPhotoProvider } from '../../src/nest/memories/providers/synology.provider';
import { AuditService } from '../../src/nest/audit/audit.service';
import { makeStorageFixture } from './storage-fixture';
// No plugin supervisor in this harness, so PluginHooks is built over an inert runtime
// and the warnings tool answers empty by default; the trip-warnings suite spies on
// PluginHooks.prototype to play the provider fan-out.
import { TripWarningsMcp } from '../../src/nest/plugins/contributions/trip-warnings.mcp';
import { PluginSearchMcp } from '../../src/nest/plugins/contributions/plugin-search.mcp';
import { PluginPoisMcp } from '../../src/nest/plugins/contributions/plugin-pois.mcp';
import { PluginPoisService } from '../../src/nest/plugins/contributions/plugin-pois.service';
import { PluginHooks } from '../../src/nest/plugins/plugin-hooks.service';
import type { PluginRuntimeService } from '../../src/nest/plugins/plugin-runtime.service';
import { AirtrailMcp } from '../../src/nest/integrations/airtrail.mcp';
import { AirtrailService } from '../../src/nest/integrations/airtrail.service';
import { AirtrailClient } from '../../src/nest/integrations/airtrail.client';
import { AirtrailImportService } from '../../src/nest/integrations/airtrail-import.service';
import { ReservationImportMcp } from '../../src/nest/reservation-import/reservation-import.mcp';
import { HelpMcp } from '../../src/nest/help/help.mcp';
import { AddonsMcp } from '../../src/nest/addons/addons.mcp';
import {
  createTestUnitOfWork, createTestAppSettingsRepo, createTestCategoriesRepo, createTestTagsRepo, createTestSettingsRepo,
  createTestDaysRepo, createTestDayAssignmentsRepo, createTestDayNotesRepo, createTestTripsRepo,
  createTestTripMembersRepo, createTestTripInviteTokensRepo, createTestPlaceRatingsRepo, createTestAssignmentParticipantsRepo,
  createTestGooglePlacePhotoMetaRepo, createTestPlacesRepo, createTestRoadtripViasRepo, createTestRoadtripDayTracksRepo,
  createTestPlaceDetailsCacheRepo,
  createTestRoadtripPreferencesRepo, createTestRoadtripDayBoundariesRepo,
  createTestReservationsRepo,
  createTestReservationEndpointsRepo,
  createTestReservationTravelersRepo,
  createTestReservationDayPositionsRepo,
  createTestDayAccommodationsRepo,
  createTestUsersRepo,
  createTestCollectionsRepo, createTestCollectionMembersRepo, createTestCollectionLabelsRepo,
  createTestCollectionPlacesRepo, createTestCollectionPlaceRatingsRepo,
  sharedTestOrm,
} from './test-uow';
import { createTestOrm } from './test-orm';
import { createTestTripFilesRepo, createTestFileLinksRepo, createTestBudgetItemsRepo } from './files-repos';
import { budgetRepoArgs } from './budget-repos';
import { createTestShareTokensRepo, shareServiceRepoArgs, createTestPluginsRepo, createTestPluginUserErasureQueueRepo } from './share-repos';
import {
  createTestCollabMessageReactionsRepo, createTestCollabNotesRepo, createTestCollabPollsRepo,
  createTestCollabPollVotesRepo, createTestCollabLinksRepo, createTestCollabMessagesRepo,
} from './collab-repos';
import {
  createTestPackingItemsRepo, createTestPackingItemContributorsRepo, createTestPackingBagsRepo,
  createTestPackingCategoryAssigneesRepo, createTestPackingTemplatesRepo, createTestPackingTemplateCategoriesRepo,
  createTestPackingTemplateItemsRepo,
} from './packing-repos';
import { createTestTodoItemsRepo, createTestTodoCategoryAssigneesRepo } from './todo-repos';
import {
  createTestSchoolHolidayCountriesRepo, createTestSchoolHolidayRegionsRepo,
  createTestSchoolHolidayPeriodsRepo, createTestVacayHolidayCalendarsRepo,
} from './school-holidays-repos';
import {
  createTestVacayPlansRepo, createTestVacayPlanMembersRepo, createTestVacayYearsRepo, createTestVacayUserYearsRepo,
  createTestVacayUserColorsRepo, createTestVacayEntriesRepo, createTestVacayCompanyHolidaysRepo,
  createTestVacaySharesRepo, createTestVacayUserSettingsRepo,
} from './vacay-repos';
import {
  createTestBucketListRepo, createTestHiddenCountriesRepo, createTestHiddenRegionsRepo,
  createTestVisitedCountriesRepo, createTestVisitedRegionsRepo, createTestPlaceRegionsRepo,
} from './atlas-repos';
import {
  createTestJourneysRepo, createTestJourneyContributorsRepo, createTestJourneyTripsRepo, createTestJourneyEntriesRepo,
  createTestJourneyPhotosRepo, createTestJourneyEntryPhotosRepo,
} from './journey-repos';
import { createTestJourneyShareTokensRepo } from './journey-share-repos';
import { AppSettings } from '../../src/db/entities/AppSettings.entity';
import { AuditLog } from '../../src/db/entities/AuditLog.entity';
import { Users } from '../../src/db/entities/Users.entity';
import { Settings } from '../../src/db/entities/Settings.entity';
import { InviteTokens } from '../../src/db/entities/InviteTokens.entity';
import { McpTokens } from '../../src/db/entities/McpTokens.entity';
import { OauthTokens } from '../../src/db/entities/OauthTokens.entity';
import { WebauthnCredentials } from '../../src/db/entities/WebauthnCredentials.entity';
import { PasswordResetTokens } from '../../src/db/entities/PasswordResetTokens.entity';
import { noGoogleQuota } from './google-quota';
import { createTestPushSubscriptionsRepo } from './notifications-repos';

/**
 * Hand-wired counterpart of the boot-time discovery in McpRegistryService,
 * for the no-Nest MCP harness. One line per migrated domain — add the new
 * @McpController instance here when a domain moves off the legacy registrar
 * fan-out. Constructing against the `db` Proxy keeps per-file vi.mock's of
 * src/db/database flowing through (same pattern as todo.bridge.ts).
 */
export async function createMcpTestRegistry(): Promise<McpRegistry> {
  // Plan 3c Task 0b / Plan 4 Task 4: `mcpOrm` gives every repository below
  // its `EntityManager` — `canAccessTrip`/`isOwner`/`rosterUserIds`/
  // `getPlaceWithTags` resolve `TripsRepository`/`TripMembersRepository`/
  // `PlacesRepository` through it directly now; `DatabaseService` is gone.
  const mcpOrm = await createTestOrm(db);
  // Plan 3i Task 3: DemoService, hand-built for the 4 *.mcp.ts controllers
  // below that used to take `isDemoUserId(env, db, userId)` as a free
  // function and now inject DemoService instead.
  const demoService = new DemoService(new RuntimeEnvService(), mcpOrm.em);
  const generalStorage = makeStorageFixture('').storage;
  const appSettings = (await createTestOrm(db)).repo(AppSettings);
  const auditLogRepo = mcpOrm.repo(AuditLog);
  const usersRepo = mcpOrm.repo(Users);
  const settingsRepo = mcpOrm.repo(Settings);
  const inviteTokensRepo = mcpOrm.repo(InviteTokens);
  const mcpTokensRepoForAuth = mcpOrm.repo(McpTokens);
  const oauthTokensRepo = mcpOrm.repo(OauthTokens);
  const webauthnCredentialsRepoForAuth = mcpOrm.repo(WebauthnCredentials);
  const passwordResetTokensRepo = mcpOrm.repo(PasswordResetTokens);
  const permissionsService = new PermissionsService(await createTestAppSettingsRepo(db), await createTestUnitOfWork(db));
  // Same argument list as auth.bridge.ts. AtlasService used to sit in third
  // place; when getTravelStats moved onto AtlasService itself the edge was
  // dropped and four collaborators took its place, but this call site kept the
  // old shape, so `membership` and `webauthn` held the wrong objects and
  // userCleanup/mailer/tokens were undefined.
  const realtimeService = new RealtimeService();
  // Plan 4 Task 1 constructor-ripple: the trip `user_id`/user `role` reads
  // moved off `DatabaseService` onto `TripsRepository`/`UsersRepository`.
  const guards = new McpToolGuardsService(mcpOrm.repo(Trips), usersRepo, permissionsService, realtimeService);
  const exchangeRatesService = new ExchangeRatesService();
  const budgetService = new BudgetService(permissionsService, exchangeRatesService, realtimeService, await createTestUnitOfWork(db), ...(await budgetRepoArgs(db)));
  const authService = new AuthService(
    permissionsService,
    new TripMembershipService(await createTestTripsRepo(db), await createTestTripMembersRepo(db)),
    new WebauthnConfigService(appSettings),
    new UserCleanupService(mcpOrm.em, budgetService, await createTestUnitOfWork(db), usersRepo, await createTestTripMembersRepo(db), await createTestBudgetItemsRepo(db), await createTestJourneyShareTokensRepo(db), await createTestJourneysRepo(db), await createTestJourneyEntriesRepo(db), await createTestJourneyContributorsRepo(db), await createTestShareTokensRepo(db), await createTestPluginsRepo(db), await createTestPluginUserErasureQueueRepo(db)),
    new MailerService(usersRepo, settingsRepo, appSettings),
    new EphemeralTokenService(),
    new AllowedFileTypesService(appSettings), await createTestUnitOfWork(db),
    appSettings, usersRepo, inviteTokensRepo, mcpTokensRepoForAuth, oauthTokensRepo, webauthnCredentialsRepoForAuth, passwordResetTokensRepo,
    await createTestPushSubscriptionsRepo(db),
  );
  const queryHelpersService = new QueryHelpersService(await createTestTagsRepo(db), await createTestPlaceRatingsRepo(db), await createTestAssignmentParticipantsRepo(db));
  const daysService = new DaysService(
    permissionsService,
    realtimeService,
    queryHelpersService,
    await createTestUnitOfWork(db),
    await createTestDaysRepo(db),
    await createTestDayAssignmentsRepo(db),
    await createTestDayNotesRepo(db),
    await createTestTripsRepo(db),
    await createTestReservationsRepo(db),
    await createTestReservationEndpointsRepo(db),
    await createTestDayAccommodationsRepo(db),
    await createTestRoadtripViasRepo(db),
    await createTestRoadtripDayBoundariesRepo(db),
  );
  const todoService = new TodoService(permissionsService, realtimeService, await createTestUnitOfWork(db), await createTestTodoItemsRepo(db), await createTestTodoCategoryAssigneesRepo(db), await createTestTripsRepo(db), await createTestTripMembersRepo(db));
  const packingService = new PackingService(
    permissionsService, realtimeService, notificationsStub(), await createTestUnitOfWork(db),
    await createTestPackingItemsRepo(db), await createTestPackingItemContributorsRepo(db), await createTestPackingBagsRepo(db),
    await createTestPackingCategoryAssigneesRepo(db), await createTestPackingTemplatesRepo(db), await createTestPackingTemplateCategoriesRepo(db),
    await createTestPackingTemplateItemsRepo(db), await createTestTripsRepo(db), await createTestTripMembersRepo(db),
  );
  const collabService = new CollabService(
    permissionsService, realtimeService, notificationsStub(), generalStorage, new RateLimitService(), await createTestUnitOfWork(db),
    await createTestCollabMessageReactionsRepo(db), await createTestCollabNotesRepo(db), await createTestCollabPollsRepo(db),
    await createTestCollabPollVotesRepo(db), await createTestCollabLinksRepo(db), await createTestCollabMessagesRepo(db),
    await createTestTripsRepo(db),
  );
  // Exactly one instance, shared by maps, places and share: its stampede guard
  // and its on-disk set only work if all three readers see the same maps.
  const placePhotoCache = new PlacePhotoCacheService(makeStorageFixture('photos/google/').storage, await createTestGooglePlacePhotoMetaRepo(db), await createTestPlacesRepo(db), await createTestCollectionPlacesRepo(db));
  const mapsService = new MapsService(placePhotoCache, appSettings, usersRepo, await createTestPlaceDetailsCacheRepo(db), await createTestPlacesRepo(db), noGoogleQuota);
  const journeyDomain = new JourneyDomainService(
    realtimeService, new TrekPhotoRegistrationService(mcpOrm.repo(TrekPhotos), mcpOrm.repo(TripPhotos), await createTestJourneyPhotosRepo(db)), await createTestUnitOfWork(db),
    // Plan 3g Task 1 — the constructor-ripple fix (R9): four journey-owned
    // repositories + the already-shared `TripsRepository` (AP1/`getTitle`).
    await createTestJourneysRepo(db), await createTestJourneyContributorsRepo(db),
    await createTestJourneyTripsRepo(db), await createTestJourneyEntriesRepo(db),
    await createTestTripsRepo(db),
    // Plan 3g Task 2 — a genuine follow-up constructor-ripple (git status
    // confirmed this file clean before editing, per the task brief's own
    // allowance): `JourneyPhotosRepository`/`JourneyEntryPhotosRepository`
    // (the photos surface, JG19/JG87-116) + `PlacesRepository` (JG44's
    // `findRaw`, already imported below for other MCP controllers).
    await createTestJourneyPhotosRepo(db), await createTestJourneyEntryPhotosRepo(db),
    await createTestPlacesRepo(db),
  );
  // The last three were previously omitted, which left them `undefined` at
  // runtime — silently fine while nothing called them, a TypeError the moment
  // the journey skeleton hooks landed on the place write paths. tsconfig.tests.json
  // covers `tests` now and CI runs it (npm run typecheck:tests), so a missed
  // dependency fails the build — pass them for real regardless of the gate.
  // One instance, four consumers: AssignmentsMcp, ReservationsMcp, PlacesMcp and
  // AccommodationsService, which writes the day stop a booked night implies.
  const assignmentsService = new AssignmentsService(
    await createTestTripsRepo(db), permissionsService, realtimeService, queryHelpersService, journeyDomain, await createTestUnitOfWork(db),
    await createTestDayAssignmentsRepo(db),
    await createTestAssignmentParticipantsRepo(db),
    await createTestDaysRepo(db),
    await createTestPlacesRepo(db),
    await createTestTripMembersRepo(db),
    await createTestRoadtripViasRepo(db),
  );
  const accommodationsService = new AccommodationsService(
    permissionsService, realtimeService, assignmentsService, await createTestUnitOfWork(db),
    await createTestTripsRepo(db),
    await createTestDayAccommodationsRepo(db),
    await createTestDayAssignmentsRepo(db),
    await createTestPlacesRepo(db),
    await createTestDaysRepo(db),
    await createTestRoadtripViasRepo(db),
    await createTestReservationsRepo(db),
    await createTestBudgetItemsRepo(db),
  );
  // Built after it: deleting a place cancels the nights booked at it through this one.
  const placesService = new PlacesService(
    permissionsService, realtimeService, mapsService, queryHelpersService,
    new UnsplashService(appSettings, usersRepo, new RuntimeEnvService(), generalStorage),
    placePhotoCache,
    journeyDomain,
    generalStorage,
    accommodationsService, await createTestUnitOfWork(db),
    await createTestPlacesRepo(db),
    await createTestTagsRepo(db),
    await createTestPlaceRatingsRepo(db),
    await createTestTripMembersRepo(db),
    await createTestDayAssignmentsRepo(db),
    await createTestCategoriesRepo(db),
  await createTestTripsRepo(db),
  await createTestBudgetItemsRepo(db),
  await createTestCollectionPlacesRepo(db),
  );
  // Built after it: a hotel booking writes the stay's day stop through this one.
  const reservationsService = new ReservationsService(permissionsService, budgetService, realtimeService, notificationsStub(), new ReservationsReadService(await createTestReservationsRepo(db), await createTestReservationEndpointsRepo(db), await createTestReservationTravelersRepo(db)), accommodationsService, await createTestUnitOfWork(db), await createTestReservationsRepo(db), await createTestReservationEndpointsRepo(db), await createTestReservationTravelersRepo(db), await createTestReservationDayPositionsRepo(db), await createTestDayAccommodationsRepo(db), await createTestDaysRepo(db), await createTestPlacesRepo(db), await createTestDayAssignmentsRepo(db), await createTestTripMembersRepo(db), await createTestUsersRepo(db), await createTestTripsRepo(db), await createTestBudgetItemsRepo(db));
  // Deleting a day cancels the stays on it through the same accommodations service.
  const dayRemovalService = new DayRemovalService(
    daysService, accommodationsService, assignmentsService, await createTestUnitOfWork(db),
    await createTestDaysRepo(db), await createTestDayAccommodationsRepo(db), await createTestRoadtripDayBoundariesRepo(db), await createTestTripsRepo(db),
  );
  const membersService = new TripMembersService(budgetService, new UserCleanupService(mcpOrm.em, budgetService, await createTestUnitOfWork(db), usersRepo, await createTestTripMembersRepo(db), await createTestBudgetItemsRepo(db), await createTestJourneyShareTokensRepo(db), await createTestJourneysRepo(db), await createTestJourneyEntriesRepo(db), await createTestJourneyContributorsRepo(db), await createTestShareTokensRepo(db), await createTestPluginsRepo(db), await createTestPluginUserErasureQueueRepo(db)), permissionsService, realtimeService, notificationsStub(), await createTestUnitOfWork(db), await createTestTripsRepo(db), await createTestTripMembersRepo(db), usersRepo);
  const tripsService = new TripsService(
    reservationsService,
    daysService,
    permissionsService,
    budgetService,
    new VacayService(
      await createTestVacayPlansRepo(db), await createTestVacayPlanMembersRepo(db),
      await createTestVacayYearsRepo(db), await createTestVacayUserYearsRepo(db),
      await createTestVacayUserColorsRepo(db), await createTestVacayEntriesRepo(db),
      await createTestVacayCompanyHolidaysRepo(db), await createTestVacayHolidayCalendarsRepo(db),
      await createTestVacaySharesRepo(db), await createTestVacayUserSettingsRepo(db),
      await createTestSchoolHolidayRegionsRepo(db),
      realtimeService, notificationsStub(), await createTestUnitOfWork(db),
    ),
    realtimeService,
    new UnsplashService(appSettings, usersRepo, new RuntimeEnvService(), generalStorage),
    generalStorage,
    await createTestUnitOfWork(db),
    mcpOrm.em,
    new SettingsService(await createTestUnitOfWork(db), appSettings, await createTestSettingsRepo(db)),
  );
  // Plan 3e Task 1 (files): FilesService now also takes uow + the repositories
  // its R2 transactions and R12 cross-object trip-scoping guard need. Built
  // once and shared by both consumers below (readModelService, FilesMcp)
  // rather than reconstructed twice with the same seven-repository tail.
  const filesService = new FilesService(
    await createTestTripsRepo(db), permissionsService, realtimeService, new EphemeralTokenService(), generalStorage, mcpOrm.em,
    await createTestUnitOfWork(db),
    await createTestTripFilesRepo(db),
    await createTestFileLinksRepo(db),
    await createTestReservationsRepo(db),
    await createTestPlacesRepo(db),
    await createTestDayAssignmentsRepo(db),
    await createTestBudgetItemsRepo(db),
  );
  const readModelService = new TripReadModelService(
    await createTestTripsRepo(db), membersService, daysService, accommodationsService, budgetService,
    packingService, reservationsService, collabService, placesService, todoService,
    filesService,
  );
  const calendarService = new CalendarService(
    reservationsService,
    await createTestTripsRepo(db), await createTestDaysRepo(db),
    await createTestDayNotesRepo(db), await createTestReservationsRepo(db),
  );
  // The nine addon-gated surfaces read their toggle off an injected service now
  // rather than off addons.bridge's own instance, so the harness has to supply
  // one — against the same test DB, which is what makes the `when:` gates
  // answer truthfully here instead of against the process-wide singleton.
  const addonsService = await createTestAddonsService(db);
  // The two photo providers, shared by MemoriesMcp (which browses them) and by
  // the capture backfill JourneyMcp schedules after a provider photo is attached
  // (which asks them when and where it was taken). Built for real rather than
  // stubbed: an empty provider registry would make the backfill answer "unknown
  // provider" for every id and hide a wiring mistake behind a caught error.
  const memoriesAccess = new MemoriesAccessService(
    mcpOrm.repo(TripPhotos), mcpOrm.repo(TrekPhotos), mcpOrm.repo(TripAlbumLinks), mcpOrm.repo(Trips),
    // Plan 3g Task 4 constructor-ripple: MA1/MA2/MA6's journey half.
    await createTestJourneysRepo(db), await createTestJourneyContributorsRepo(db), await createTestJourneyPhotosRepo(db),
  );
  const immichService = new ImmichService(new AuditService(auditLogRepo, usersRepo), memoriesAccess, generalStorage, usersRepo);
  const synologyService = new SynologyService(memoriesAccess, notificationsStub(), usersRepo);
  const trekPhotos = new TrekPhotoRegistrationService(mcpOrm.repo(TrekPhotos), mcpOrm.repo(TripPhotos), await createTestJourneyPhotosRepo(db));
  const captureBackfill = new PhotoCaptureBackfillService(new PhotoResolverService(trekPhotos, new ThumbnailService(addonsService, generalStorage, mcpOrm.repo(TrekPhotos)), new TrekPhotoCacheService(mcpOrm.repo(TrekPhotoCacheMeta), generalStorage), new PhotoProviderRegistry([new ImmichPhotoProvider(immichService), new SynologyPhotoProvider(synologyService)]), generalStorage), trekPhotos, generalStorage);
  return createTestRegistry(
    [
      new TagsMcp(new TagsService(await createTestTagsRepo(db)), authService),
      new CategoriesMcp(new CategoriesService(await createTestCategoriesRepo(db)), new RuntimeEnvService(), guards, demoService),
      // The weather and airport tools left the legacy mapsWeather registrar.
      new WeatherMcp(new WeatherService()),
      new AirportsMcp(),
      new AuthMcp(),
      new TodoMcp(todoService, authService, addonsService, guards),
      new PackingMcp(packingService, authService, addonsService, guards),
      new BudgetMcp(budgetService, exchangeRatesService, new RuntimeEnvService(), new TripMembershipService(await createTestTripsRepo(db), await createTestTripMembersRepo(db)), addonsService, guards, await createTestUnitOfWork(db), await createTestPlacesRepo(db), await createTestTripsRepo(db), demoService, await createTestTripMembersRepo(db)),
      new ReservationsMcp(reservationsService, daysService, budgetService, authService, assignmentsService, guards),
      new DayNotesMcp(new DayNotesService(await createTestTripsRepo(db), permissionsService, realtimeService, await createTestDayNotesRepo(db), await createTestDaysRepo(db)), authService, guards),
      new DaysMcp(daysService, authService, guards, dayRemovalService),
      new RoadtripMcp(
        new RoadtripService(
          realtimeService,
          await createTestUnitOfWork(db),
          await createTestDaysRepo(db),
          await createTestPlacesRepo(db),
          await createTestRoadtripViasRepo(db),
          await createTestRoadtripDayTracksRepo(db),
        ),
        await createTestTripsRepo(db),
        guards,
        authService,
        addonsService,
      ),
      new RoadtripPreferencesMcp(
        new RoadtripPreferencesService(realtimeService, await createTestUnitOfWork(db), await createTestRoadtripPreferencesRepo(db)),
        authService, addonsService, await createTestTripsRepo(db), guards,
      ),
      new FilesMcp(filesService, authService, guards, new AllowedFileTypesService(appSettings)),
      new AccommodationsMcp(accommodationsService, placesService, authService, guards, await createTestUnitOfWork(db)),
      new AssignmentsMcp(assignmentsService, daysService, authService, guards),
      new CollabMcp(collabService, authService, addonsService, guards),
      new VacayMcp(new VacayService(
      await createTestVacayPlansRepo(db), await createTestVacayPlanMembersRepo(db),
      await createTestVacayYearsRepo(db), await createTestVacayUserYearsRepo(db),
      await createTestVacayUserColorsRepo(db), await createTestVacayEntriesRepo(db),
      await createTestVacayCompanyHolidaysRepo(db), await createTestVacayHolidayCalendarsRepo(db),
      await createTestVacaySharesRepo(db), await createTestVacayUserSettingsRepo(db),
      await createTestSchoolHolidayRegionsRepo(db),
      realtimeService, notificationsStub(), await createTestUnitOfWork(db),
    ), authService, addonsService),
      new SchoolHolidaysMcp(
        new SchoolHolidaysService(
          await createTestSchoolHolidayCountriesRepo(db),
          await createTestSchoolHolidayRegionsRepo(db),
          await createTestSchoolHolidayPeriodsRepo(db),
          await createTestVacayHolidayCalendarsRepo(db),
          await createTestUnitOfWork(db),
        ),
        guards,
      ),
      new TripsMcp(tripsService, todoService, collabService, authService, calendarService, membersService, readModelService, addonsService, guards),
      new TripPromptsMcp(tripsService, readModelService, packingService, addonsService),
      new ShareMcp(new ShareService(new SettingsService(await createTestUnitOfWork(db), appSettings, await createTestSettingsRepo(db)), permissionsService, queryHelpersService, placePhotoCache, await createTestUnitOfWork(db), ...(await shareServiceRepoArgs(db))), authService, guards),
      new FeedsMcp(new FeedsService(await createTestTripsRepo(db), usersRepo, calendarService), await createTestTripsRepo(db), new RuntimeEnvService(), guards, demoService),
      new TripInviteMcp(new TripInviteService(await createTestTripsRepo(db), permissionsService, new TripMembershipService(await createTestTripsRepo(db), await createTestTripMembersRepo(db)), await createTestUnitOfWork(db), await createTestTripInviteTokensRepo(db)), new RuntimeEnvService(), guards, new AuditService(auditLogRepo, usersRepo), demoService),
      new MapsMcp(mapsService),
      new PlacesMcp(placesService, mapsService, await createTestTripsRepo(db), authService, journeyDomain, assignmentsService, guards, await createTestUnitOfWork(db)),
      new CollectionsMcp(
        new CollectionsService(
          permissionsService, realtimeService, notificationsStub(), generalStorage, await createTestUnitOfWork(db),
          // Plan 3h Task 1 — the constructor-ripple fix: collections part A's
          // own repositories, first cut, plus the already-DONE
          // `CategoriesRepository` (CL21 reuse).
          await createTestCollectionsRepo(db), await createTestCollectionMembersRepo(db),
          await createTestCollectionLabelsRepo(db), await createTestCategoriesRepo(db),
          // Plan 3h Task 2 — part B's own repositories: `DatabaseService`
          // dropped entirely (this service's LAST use of it — savePlace
          // onward is now 100% off `this.db`), the trip/place/tag/user
          // repositories AP1-AP6's `TripsRepository.findAccessible` calls
          // and the cross-domain writes need, injected directly.
          await createTestCollectionPlacesRepo(db), await createTestCollectionPlaceRatingsRepo(db),
          await createTestTripsRepo(db), await createTestTripMembersRepo(db),
          await createTestPlacesRepo(db), await createTestPlaceRatingsRepo(db),
          await createTestTagsRepo(db), usersRepo,
        ),
        // Plan 3h Task 1 — `CollectionsMcp`'s own constructor-ripple fix:
        // `DatabaseService` dropped (CL89's only use), `UsersRepository`
        // (`findUsernameEmail`, UM11's precedent) added in its place.
        usersRepo, authService, addonsService,
      ),
      new TransitMcp(new TransitService(new GoogleTransitProvider(appSettings, usersRepo, noGoogleQuota)), daysService, reservationsService, await createTestTripsRepo(db), authService, guards),
      new AtlasMcp(new AtlasService(
        await createTestBucketListRepo(db), await createTestHiddenCountriesRepo(db),
        await createTestHiddenRegionsRepo(db), await createTestVisitedCountriesRepo(db),
        await createTestVisitedRegionsRepo(db), await createTestPlaceRegionsRepo(db),
        await createTestTripsRepo(db), await createTestPlacesRepo(db),
        await createTestReservationEndpointsRepo(db), await createTestUnitOfWork(db), (await sharedTestOrm(db)).orm,
      ), addonsService, authService),
      new JourneyMcp(journeyDomain, new JourneyShareService(
        journeyDomain,
        new SettingsService(await createTestUnitOfWork(db), appSettings, await createTestSettingsRepo(db)),
        // Plan 3g Task 3 — the constructor-ripple fix: `JourneyShareTokensRepository`
        // (JS1-JS15) + the already-shared `JourneysRepository` (JS8/JS12).
        await createTestJourneyShareTokensRepo(db), await createTestJourneysRepo(db),
        // task-5-fix-brief constructor-ripple: `UnitOfWork` (L1) + `JourneyPhotosRepository` (L2).
        await createTestUnitOfWork(db), await createTestJourneyPhotosRepo(db),
        // Plan 4 Task 8b constructor-ripple: `JourneyEntriesRepository` (JS13)
        // + `JourneyEntryPhotosRepository` (JS14), relocated off
        // `JourneyShareTokensRepository`'s own fallback stub.
        await createTestJourneyEntriesRepo(db), await createTestJourneyEntryPhotosRepo(db),
      ), addonsService, authService, new JourneyPhotoCaptureService(captureBackfill, journeyDomain, { reverseGeocode: async () => ({ name: null, address: null }) } as never, mcpOrm.orm)),
      new MemoriesMcp(immichService, synologyService, addonsService, mcpOrm.repo(PhotoProviders)),
      new NotificationsMcp(await makeNotificationsService(db, realtimeService), authService),
      new AirtrailMcp(new AirtrailService(usersRepo, new AuditService(auditLogRepo, usersRepo), new AirtrailClient()), addonsService),
      new ReservationImportMcp(new AirtrailImportService(
        await createTestReservationsRepo(db), await createTestReservationEndpointsRepo(db), await createTestDaysRepo(db),
        realtimeService, reservationsService, new AirtrailClient(), new AirtrailService(usersRepo, new AuditService(auditLogRepo, usersRepo), new AirtrailClient()),
      ), await createTestTripsRepo(db), authService, guards, addonsService),
      new SettingsMcp(new SettingsService(await createTestUnitOfWork(db), appSettings, await createTestSettingsRepo(db)), authService),
      new HelpMcp(), new AddonsMcp(addonsService),
      new TripWarningsMcp(new PluginHooks({ providersOf: () => [], invokeHook: async () => [] } as unknown as PluginRuntimeService), await createTestTripsRepo(db)),
      new PluginSearchMcp(new PluginHooks({ providersOf: () => [], invokeHook: async () => [] } as unknown as PluginRuntimeService)),
      new PluginPoisMcp(new PluginPoisService(new PluginHooks({ providersOf: () => [], invokeHook: async () => [] } as unknown as PluginRuntimeService), await createTestPluginsRepo(db))),
    ],
    { accessPolicy: trekMcpAccessPolicy, validateAccess: trekMcpValidateAccess },
  );
}
