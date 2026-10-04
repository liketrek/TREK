import type Database from 'better-sqlite3';
import { PluginRuntimeService } from '../../src/nest/plugins/plugin-runtime.service';
import { PluginUserSettingsService } from '../../src/nest/plugins/plugin-user-settings.service';
import type { PluginRegistryService } from '../../src/nest/plugins/registry/registry.service';
import { PluginRpcHostFactory } from '../../src/nest/plugins/host/plugin-rpc-host.factory';
import { PluginRpcRegistryService } from '../../src/nest/plugins/host/rpc-kit/registry.service';
import { createTestPluginRegistry } from '../../src/nest/plugins/host/rpc-kit/testing';
import { PluginGuards } from '../../src/nest/plugins/host/plugin-guards.service';
import { DbRpc } from '../../src/nest/plugins/host/rpc/db.rpc';
import { MetaRpc } from '../../src/nest/plugins/host/rpc/meta.rpc';
import { HostSurfaceRpc } from '../../src/nest/plugins/host/rpc/host-surface.rpc';
import { PluginHooks } from '../../src/nest/plugins/plugin-hooks.service';
import { PluginOAuthService } from '../../src/nest/plugins/oauth/plugin-oauth.service';
import { BudgetService } from '../../src/nest/budget/budget.service';
import { ExchangeRatesService } from '../../src/nest/budget/exchange-rates.service';
import { ReservationsService } from '../../src/nest/reservations/reservations.service';
import { ReservationsReadService } from '../../src/nest/reservations/reservations-read.service';
import { TagsService } from '../../src/nest/tags/tags.service';
import { CategoriesService } from '../../src/nest/categories/categories.service';
import { TodoService } from '../../src/nest/todo/todo.service';
import { PackingService } from '../../src/nest/packing/packing.service';
import { DayNotesService } from '../../src/nest/day-notes/day-notes.service';
import { DaysService } from '../../src/nest/days/days.service';
import { DayRemovalService } from '../../src/nest/days/day-removal.service';
import { AssignmentsService } from '../../src/nest/assignments/assignments.service';
import { LlmConfigResolver } from '../../src/nest/llm-parse/llm-config.resolver';
import { SettingsService } from '../../src/nest/settings/settings.service';
import { FilesService } from '../../src/nest/files/files.service';
import { CollabService } from '../../src/nest/collab/collab.service';
import { RateLimitService } from '../../src/nest/common/rate-limit.service';
import { VacayService } from '../../src/nest/vacay/vacay.service';
import { TripsService } from '../../src/nest/trips/trips.service';
import { PlacesService } from '../../src/nest/places/places.service';
import { CollectionsService } from '../../src/nest/collections/collections.service';
import { AtlasService } from '../../src/nest/atlas/atlas.service';
import { MapsService } from '../../src/nest/maps/maps.service';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { AuditService } from '../../src/nest/audit/audit.service';
import { createTestAddonsService } from './test-addons';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { QueryHelpersService } from '../../src/nest/query-helpers/query-helpers.service';
import { TripMembershipService } from '../../src/nest/trip-membership/trip-membership.service';
import { JourneyDomainService } from '../../src/nest/journey/journey-domain.service';
import { TagsRpc } from '../../src/nest/tags/tags.rpc';
import { CategoriesRpc } from '../../src/nest/categories/categories.rpc';
import { WeatherRpc } from '../../src/nest/weather/weather.rpc';
import { WeatherService } from '../../src/nest/weather/weather.service';
import { ExchangeRatesRpc } from '../../src/nest/budget/exchange-rates.rpc';
import { TodoRpc } from '../../src/nest/todo/todo.rpc';
import { DayNotesRpc } from '../../src/nest/day-notes/day-notes.rpc';
import { PackingRpc } from '../../src/nest/packing/packing.rpc';
import { FilesRpc } from '../../src/nest/files/files.rpc';
import { PlacesRpc } from '../../src/nest/places/places.rpc';
import { DaysRpc } from '../../src/nest/days/days.rpc';
import { AccommodationsRpc } from '../../src/nest/accommodations/accommodations.rpc';
import { AccommodationsService } from '../../src/nest/accommodations/accommodations.service';
import { TripMembersService } from '../../src/nest/trip-members/trip-members.service';
import { ItineraryRpc } from '../../src/nest/assignments/itinerary.rpc';
import { TripsRpc } from '../../src/nest/trips/trips.rpc';
import { CostsRpc } from '../../src/nest/budget/costs.rpc';
import { ReservationsRpc } from '../../src/nest/reservations/reservations.rpc';
import { CollabRpc } from '../../src/nest/collab/collab.rpc';
import { AtlasRpc } from '../../src/nest/atlas/atlas.rpc';
import { VacayRpc } from '../../src/nest/vacay/vacay.rpc';
import { JournalRpc } from '../../src/nest/journey/journal.rpc';
import { DemoService } from '../../src/nest/common/demo.service';
import { CollectionsRpc } from '../../src/nest/collections/collections.rpc';
import { makeNotificationsService } from './notifications';
import { notificationsStub } from './notifications';
import { EphemeralTokenService } from '../../src/nest/auth/ephemeral-token.service';
import { UserCleanupService } from '../../src/nest/auth/user-cleanup.service';
import { UnsplashService } from '../../src/nest/unsplash/unsplash.service';
import { PlacePhotoCacheService } from '../../src/nest/place-photos/place-photo-cache.service';
import { TrekPhotoRegistrationService } from '../../src/nest/photos/trek-photo-registration.service';
import { TrekPhotos } from '../../src/db/entities/TrekPhotos.entity';
import { TripPhotos } from '../../src/db/entities/TripPhotos.entity';
import { RuntimeEnvService } from '../../src/nest/app-config/runtime-env.service';
import { makeStorageFixture } from './storage-fixture';
import {
  createTestUnitOfWork, createTestAppSettingsRepo, createTestCategoriesRepo, createTestTagsRepo, createTestSettingsRepo, sharedTestOrm,
  createTestCollectionsRepo, createTestCollectionMembersRepo, createTestCollectionLabelsRepo,
  createTestCollectionPlacesRepo, createTestCollectionPlaceRatingsRepo,
  createTestDaysRepo, createTestDayAssignmentsRepo, createTestDayNotesRepo, createTestTripsRepo,
  createTestTripMembersRepo, createTestPlaceRatingsRepo, createTestAssignmentParticipantsRepo,
  createTestGooglePlacePhotoMetaRepo, createTestPlacesRepo, createTestRoadtripViasRepo,
  createTestPlaceDetailsCacheRepo,
  createTestReservationsRepo,
  createTestReservationEndpointsRepo,
  createTestReservationTravelersRepo,
  createTestReservationDayPositionsRepo,
  createTestDayAccommodationsRepo,
  createTestUsersRepo,
  createTestRoadtripDayBoundariesRepo,
} from './test-uow';
import { AppSettings } from '../../src/db/entities/AppSettings.entity';
import { Addons } from '../../src/db/entities/Addons.entity';
import { AuditLog } from '../../src/db/entities/AuditLog.entity';
import { Users } from '../../src/db/entities/Users.entity';
import { Plugins } from '../../src/db/entities/Plugins.entity';
import { PluginErrorLog } from '../../src/db/entities/PluginErrorLog.entity';
import { PluginScheduledTasks } from '../../src/db/entities/PluginScheduledTasks.entity';
import { PluginUserErasureQueue } from '../../src/db/entities/PluginUserErasureQueue.entity';
import { PluginEgressHosts } from '../../src/db/entities/PluginEgressHosts.entity';
import { PluginSettingsFields } from '../../src/db/entities/PluginSettingsFields.entity';
import { PluginActions } from '../../src/db/entities/PluginActions.entity';
import { PluginUserConfig } from '../../src/db/entities/PluginUserConfig.entity';
import { PluginEntityMetadata } from '../../src/db/entities/PluginEntityMetadata.entity';
import { PluginOauthTokens } from '../../src/db/entities/PluginOauthTokens.entity';
import { PluginOauthState } from '../../src/db/entities/PluginOauthState.entity';
import { PluginMetaMigrations } from '../../src/db/entities/PluginMetaMigrations.entity';
import { PluginCapabilityAudit } from '../../src/db/entities/PluginCapabilityAudit.entity';
import { Settings } from '../../src/db/entities/Settings.entity';
import { NotificationChannelPreferences } from '../../src/db/entities/NotificationChannelPreferences.entity';
import { createTestTripFilesRepo, createTestFileLinksRepo, createTestBudgetItemsRepo } from './files-repos';
import { budgetRepoArgs } from './budget-repos';
import { createTestShareTokensRepo, createTestPluginsRepo, createTestPluginUserErasureQueueRepo } from './share-repos';
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
import { createTestVacayHolidayCalendarsRepo, createTestSchoolHolidayRegionsRepo } from './school-holidays-repos';
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
import { noGoogleQuota } from './google-quota';

/**
 * Hand-wired counterpart of the PluginsModule DI graph for no-Nest tests
 * (same pattern as mcp-test-controllers.ts): real domain services over the
 * test DB, so runtime tests exercise the same wiring production gets from
 * the container.
 *
 * It used to build one 26-argument deps factory. The plugin surface now lives in the
 * domains, so what it builds is the same set of `@PluginController()` instances the
 * container would discover, handed to the host factory as a registry.
 */
export async function createPluginRpcHostFactory(db: Database.Database): Promise<PluginRpcHostFactory> {
  const generalStorage = makeStorageFixture('').storage;
  const appSettings = (await sharedTestOrm(db)).repo(AppSettings);
  const usersRepo = (await sharedTestOrm(db)).repo(Users);
  // Plan 3j Task 3 — `PluginRpcHostFactory`'s `audit` callback and `HostSurfaceRpc`'s
  // `budgetFor` calls now take `PluginCapabilityAuditRepository`, not a raw connection.
  const pluginAuditRepo = (await sharedTestOrm(db)).repo(PluginCapabilityAudit);
  const permissions = new PermissionsService(await createTestAppSettingsRepo(db), await createTestUnitOfWork(db));
  const exchangeRates = new ExchangeRatesService();
  const realtime = new RealtimeService();
  const budget = new BudgetService(permissions, exchangeRates, realtime, await createTestUnitOfWork(db), ...(await budgetRepoArgs(db)));
  const addons = await createTestAddonsService(db);
  const queryHelpers = new QueryHelpersService(await createTestTagsRepo(db), await createTestPlaceRatingsRepo(db), await createTestAssignmentParticipantsRepo(db));
  const todos = new TodoService(permissions, realtime, await createTestUnitOfWork(db), await createTestTodoItemsRepo(db), await createTestTodoCategoryAssigneesRepo(db), await createTestTripsRepo(db), await createTestTripMembersRepo(db));
  const packing = new PackingService(
    permissions, realtime, notificationsStub(), await createTestUnitOfWork(db),
    await createTestPackingItemsRepo(db), await createTestPackingItemContributorsRepo(db), await createTestPackingBagsRepo(db),
    await createTestPackingCategoryAssigneesRepo(db), await createTestPackingTemplatesRepo(db), await createTestPackingTemplateCategoriesRepo(db),
    await createTestPackingTemplateItemsRepo(db), await createTestTripsRepo(db), await createTestTripMembersRepo(db),
  );
  // Plan 3e Task 1 (files): FilesService now also takes uow + the repositories
  // its R2 transactions and R12 cross-object trip-scoping guard need.
  const files = new FilesService(
    await createTestTripsRepo(db), permissions, realtime, new EphemeralTokenService(), generalStorage, (await sharedTestOrm(db)).em,
    await createTestUnitOfWork(db),
    await createTestTripFilesRepo(db),
    await createTestFileLinksRepo(db),
    await createTestReservationsRepo(db),
    await createTestPlacesRepo(db),
    await createTestDayAssignmentsRepo(db),
    await createTestBudgetItemsRepo(db),
  );
  const collab = new CollabService(
    permissions, realtime, notificationsStub(), generalStorage, new RateLimitService(), await createTestUnitOfWork(db),
    await createTestCollabMessageReactionsRepo(db), await createTestCollabNotesRepo(db), await createTestCollabPollsRepo(db),
    await createTestCollabPollVotesRepo(db), await createTestCollabLinksRepo(db), await createTestCollabMessagesRepo(db),
    await createTestTripsRepo(db),
  );
  const vacay = new VacayService(
    await createTestVacayPlansRepo(db), await createTestVacayPlanMembersRepo(db),
    await createTestVacayYearsRepo(db), await createTestVacayUserYearsRepo(db),
    await createTestVacayUserColorsRepo(db), await createTestVacayEntriesRepo(db),
    await createTestVacayCompanyHolidaysRepo(db), await createTestVacayHolidayCalendarsRepo(db),
    await createTestVacaySharesRepo(db), await createTestVacayUserSettingsRepo(db),
    await createTestSchoolHolidayRegionsRepo(db),
    realtime, notificationsStub(), await createTestUnitOfWork(db),
  );
  const days = new DaysService(
    permissions,
    realtime,
    queryHelpers,
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
  const photoCache = new PlacePhotoCacheService(makeStorageFixture('photos/google/').storage, await createTestGooglePlacePhotoMetaRepo(db), await createTestPlacesRepo(db), await createTestCollectionPlacesRepo(db));
  const unsplash = new UnsplashService(appSettings, usersRepo, new RuntimeEnvService(), generalStorage);
  const journey = new JourneyDomainService(
    realtime, new TrekPhotoRegistrationService((await sharedTestOrm(db)).repo(TrekPhotos), (await sharedTestOrm(db)).repo(TripPhotos), await createTestJourneyPhotosRepo(db)), await createTestUnitOfWork(db),
    // Plan 3g Task 1 — the constructor-ripple fix (R9): four journey-owned
    // repositories + the already-shared `TripsRepository` (AP1/`getTitle`).
    await createTestJourneysRepo(db), await createTestJourneyContributorsRepo(db),
    await createTestJourneyTripsRepo(db), await createTestJourneyEntriesRepo(db),
    await createTestTripsRepo(db),
    // Plan 3g Task 2 — a genuine follow-up constructor-ripple (git status
    // confirmed this file clean before editing, per the task brief's own
    // allowance): `JourneyPhotosRepository`/`JourneyEntryPhotosRepository`
    // (the photos surface, JG19/JG87-116) + `PlacesRepository` (JG44's
    // `findRaw`, already imported above for `PlacePhotoCacheService`).
    await createTestJourneyPhotosRepo(db), await createTestJourneyEntryPhotosRepo(db),
    await createTestPlacesRepo(db),
  );
  const collections = new CollectionsService(
    permissions, realtime, notificationsStub(), generalStorage, await createTestUnitOfWork(db),
    // Plan 3h Task 1 — the constructor-ripple fix: collections part A's own
    // repositories, first cut (`CollectionMembersRepository` extended by
    // Task 2), plus the already-DONE `CategoriesRepository` (CL21 reuse).
    await createTestCollectionsRepo(db), await createTestCollectionMembersRepo(db),
    await createTestCollectionLabelsRepo(db), await createTestCategoriesRepo(db),
    // Plan 3h Task 2 — part B's own repositories: `DatabaseService` dropped
    // entirely (this service's last use of it), the trip/place/tag/user
    // repositories AP1-AP6's `TripsRepository.findAccessible` calls and the
    // cross-domain writes need, injected directly.
    await createTestCollectionPlacesRepo(db), await createTestCollectionPlaceRatingsRepo(db),
    await createTestTripsRepo(db), await createTestTripMembersRepo(db),
    await createTestPlacesRepo(db), await createTestPlaceRatingsRepo(db),
    await createTestTagsRepo(db), usersRepo,
  );
  const atlas = new AtlasService(
    await createTestBucketListRepo(db), await createTestHiddenCountriesRepo(db),
    await createTestHiddenRegionsRepo(db), await createTestVisitedCountriesRepo(db),
    await createTestVisitedRegionsRepo(db), await createTestPlaceRegionsRepo(db),
    await createTestTripsRepo(db), await createTestPlacesRepo(db),
    await createTestReservationEndpointsRepo(db), await createTestUnitOfWork(db), (await sharedTestOrm(db)).orm,
  );
  const dayNotes = new DayNotesService(await createTestTripsRepo(db), permissions, realtime, await createTestDayNotesRepo(db), await createTestDaysRepo(db));
  const assignments = new AssignmentsService(
    await createTestTripsRepo(db), permissions, realtime, queryHelpers, journey, await createTestUnitOfWork(db),
    await createTestDayAssignmentsRepo(db),
    await createTestAssignmentParticipantsRepo(db),
    await createTestDaysRepo(db),
    await createTestPlacesRepo(db),
    await createTestTripMembersRepo(db),
    await createTestRoadtripViasRepo(db),
  );
  const membership = new TripMembershipService(await createTestTripsRepo(db), await createTestTripMembersRepo(db));
  const notifications = await makeNotificationsService(db, realtime);
  // Plan 4 Task 1 constructor-ripple: LlmConfigResolver's addon-row read
  // moved off DatabaseService onto AddonsRepository.
  const llmConfig = new LlmConfigResolver(new SettingsService(await createTestUnitOfWork(db), appSettings, await createTestSettingsRepo(db)), (await sharedTestOrm(db)).repo(Addons), addons);
  const pluginOrm = await sharedTestOrm(db);
  const oauth = new PluginOAuthService(pluginOrm.repo(Plugins), pluginOrm.repo(PluginOauthTokens), pluginOrm.repo(PluginOauthState), pluginOrm.repo(PluginSettingsFields));
  const accommodations = new AccommodationsService(
    permissions, realtime, assignments, await createTestUnitOfWork(db),
    await createTestTripsRepo(db),
    await createTestDayAccommodationsRepo(db),
    await createTestDayAssignmentsRepo(db),
    await createTestPlacesRepo(db),
    await createTestDaysRepo(db),
    await createTestRoadtripViasRepo(db),
    await createTestReservationsRepo(db),
    await createTestBudgetItemsRepo(db),
  );
  // After it: deleting a place cancels the nights booked at it through this one.
  const places = new PlacesService(
    permissions, realtime, new MapsService(photoCache, appSettings, usersRepo, await createTestPlaceDetailsCacheRepo(db), await createTestPlacesRepo(db), noGoogleQuota), queryHelpers, unsplash, photoCache, journey, generalStorage, accommodations, await createTestUnitOfWork(db),
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
  // After accommodations: a hotel booking writes the stay's day stop through it.
  const reservations = new ReservationsService(permissions, budget, realtime, notificationsStub(), new ReservationsReadService(await createTestReservationsRepo(db), await createTestReservationEndpointsRepo(db), await createTestReservationTravelersRepo(db)), accommodations, await createTestUnitOfWork(db), await createTestReservationsRepo(db), await createTestReservationEndpointsRepo(db), await createTestReservationTravelersRepo(db), await createTestReservationDayPositionsRepo(db), await createTestDayAccommodationsRepo(db), await createTestDaysRepo(db), await createTestPlacesRepo(db), await createTestDayAssignmentsRepo(db), await createTestTripMembersRepo(db), await createTestUsersRepo(db), await createTestTripsRepo(db), await createTestBudgetItemsRepo(db));
  const trips = new TripsService(reservations, days, permissions, budget, vacay, realtime, unsplash, generalStorage, await createTestUnitOfWork(db), (await sharedTestOrm(db)).em, new SettingsService(await createTestUnitOfWork(db), appSettings, await createTestSettingsRepo(db)));
  // Plan 4 Task 4: UserCleanupService's UC1 now goes through a directly-injected
  // EntityManager (MaintenanceRepository.deletePluginUserData), not DatabaseService.
  const members = new TripMembersService(budget, new UserCleanupService((await sharedTestOrm(db)).em, budget, await createTestUnitOfWork(db), usersRepo, await createTestTripMembersRepo(db), await createTestBudgetItemsRepo(db), await createTestJourneyShareTokensRepo(db), await createTestJourneysRepo(db), await createTestJourneyEntriesRepo(db), await createTestJourneyContributorsRepo(db), await createTestShareTokensRepo(db), await createTestPluginsRepo(db), await createTestPluginUserErasureQueueRepo(db)), permissions, realtime, notificationsStub(), await createTestUnitOfWork(db), await createTestTripsRepo(db), await createTestTripMembersRepo(db), usersRepo);
  // Plan 3j Task 1 — PluginGuards' own role lookup (PG3/PG4) now goes
  // through UsersRepository.getRole; `usersRepo` above is the same
  // sharedTestOrm-backed repository every other service in this file uses.
  // Plan 4 Task 2 — PluginGuards' own canAccessTrip delegate is now
  // TripsRepository.findAccessible directly, in the same constructor slot.
  const guards = new PluginGuards(await createTestTripsRepo(db), permissions, addons, usersRepo);

  const registry = createTestPluginRegistry([
    new TagsRpc(new TagsService(await createTestTagsRepo(db))),
    new CategoriesRpc(new CategoriesService(await createTestCategoriesRepo(db))),
    new WeatherRpc(new WeatherService()),
    new ExchangeRatesRpc(exchangeRates),
    new TodoRpc(todos, realtime, guards),
    new DayNotesRpc(dayNotes, realtime, guards),
    new PackingRpc(packing, realtime, guards),
    new FilesRpc(files, realtime, usersRepo, guards, generalStorage),
    new PlacesRpc(places, journey, realtime, guards),
    new DaysRpc(days, realtime, guards, new DayRemovalService(
      days, accommodations, assignments, await createTestUnitOfWork(db),
      await createTestDaysRepo(db), await createTestDayAccommodationsRepo(db), await createTestRoadtripDayBoundariesRepo(db), await createTestTripsRepo(db),
    )),
    new AccommodationsRpc(accommodations, realtime, guards),
    new ItineraryRpc(assignments, realtime, guards),
    new TripsRpc(trips, reservations, days, membership, realtime, guards, accommodations, members, (await sharedTestOrm(db)).em),
    new CostsRpc(budget, await createTestTripsRepo(db), realtime, guards, membership),
    new ReservationsRpc(reservations, realtime, guards),
    new CollabRpc(collab, realtime, guards),
    new AtlasRpc(atlas, guards),
    new VacayRpc(vacay, guards),
    // The photo half needs storage plus the allowed-types setting and the EXIF
    // backfill; none of the tests on this harness write bytes, so they are stubs.
    // SV8 (Plan 3i, R-survivors) — JournalRpc's demo-mode gate (addEntryPhoto)
    // now injects DemoService, the same shared primitive mcp-test-controllers.ts
    // wires into the 4 *.mcp.ts survivor sites.
    new JournalRpc(journey, guards, generalStorage, { get: () => '*' } as never, { scheduleUpload: () => {} } as never, new DemoService(new RuntimeEnvService(), (await sharedTestOrm(db)).em)),
    new CollectionsRpc(collections, guards),
    new DbRpc(new PluginUserSettingsService(pluginOrm.repo(PluginSettingsFields), pluginOrm.repo(PluginUserConfig))),
    // Plan 3j Task 5 — MetaRpc's own MR1–MR9 conversion: PluginEntityMetadata plus
    // one typed trip-id read per entity table (R12's dispatch, no interpolation).
    // Plan 4 Task 2 — MetaRpc's own DatabaseService param is gone: canAccessTrip
    // now reads through the TripsRepository it already injects below.
    new MetaRpc(
      guards, pluginOrm.repo(PluginEntityMetadata), await createTestTripsRepo(db),
      await createTestPlacesRepo(db), await createTestDaysRepo(db),
      await createTestReservationsRepo(db), await createTestDayAccommodationsRepo(db),
    ),
    // Plan 3j Task 5 — HostSurfaceRpc's own HR1/HR5–HR9 conversion: the plugin-visible
    // user row, the bilateral trip-sharing gate, and its own scheduler.set/cancel.
    // Plan 4 Task 2 — its own DatabaseService param is gone the same way MetaRpc's is.
    new HostSurfaceRpc(
      realtime, notifications, llmConfig, oauth, guards, pluginAuditRepo,
      usersRepo, await createTestTripsRepo(db), pluginOrm.repo(PluginScheduledTasks),
    ),
    new PluginHooks(undefined as never),
  ]);
  return new PluginRpcHostFactory(pluginAuditRepo, registry as unknown as PluginRpcRegistryService);
}

/** A PluginRuntimeService constructed the way Nest would: with a real host factory. */
export async function createPluginRuntime(db: Database.Database, registry?: PluginRegistryService): Promise<PluginRuntimeService> {
  // The SAME shared ORM `createPluginRpcHostFactory` builds `permissions` from
  // (via createTestAppSettingsRepo/createTestUnitOfWork) — one MikroORM.init
  // per handle (task-1-2-rereview.md M-A), not a second one just for
  // AuditService. Passing this ORM as PluginRuntimeService's last arg is what
  // makes D6's request-context wrapper (task-2-review.md C3) fork from the em
  // PermissionsService's repository actually resolves through.
  const orm = await sharedTestOrm(db);
  return new PluginRuntimeService(
    new AuditService(orm.repo(AuditLog), orm.repo(Users)),
    await createTestAddonsService(db),
    new PluginUserSettingsService(orm.repo(PluginSettingsFields), orm.repo(PluginUserConfig)),
    // Plan 3j Task 2 — PR1-PR53's own tables, all repository-backed now.
    orm.repo(Plugins),
    orm.repo(PluginErrorLog),
    orm.repo(PluginScheduledTasks),
    orm.repo(PluginUserErasureQueue),
    orm.repo(PluginEgressHosts),
    orm.repo(PluginSettingsFields),
    orm.repo(PluginActions),
    orm.repo(PluginUserConfig),
    orm.repo(PluginEntityMetadata),
    orm.repo(PluginOauthTokens),
    orm.repo(PluginOauthState),
    orm.repo(PluginMetaMigrations),
    orm.repo(PluginCapabilityAudit),
    orm.repo(Settings),
    orm.repo(NotificationChannelPreferences),
    // Plan 4 Task 4: `uow` is no longer `@Optional()` — ordered ahead of
    // `registry?`/`hostFactory?` (TypeScript forbids a required parameter
    // after an optional one), matching the real constructor's own order.
    await createTestUnitOfWork(db),
    registry,
    await createPluginRpcHostFactory(db),
    orm.orm,
  );
}
