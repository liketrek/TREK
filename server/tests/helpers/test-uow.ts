import { AppSettings } from '../../src/db/entities/AppSettings.entity';
import { AssignmentParticipants } from '../../src/db/entities/AssignmentParticipants.entity';
import { Categories } from '../../src/db/entities/Categories.entity';
import { CollectionLabels } from '../../src/db/entities/CollectionLabels.entity';
import { CollectionMembers } from '../../src/db/entities/CollectionMembers.entity';
import { CollectionPlaceRatings } from '../../src/db/entities/CollectionPlaceRatings.entity';
import { CollectionPlaces } from '../../src/db/entities/CollectionPlaces.entity';
import { Collections } from '../../src/db/entities/Collections.entity';
import { DayAccommodations } from '../../src/db/entities/DayAccommodations.entity';
import { DayAssignments } from '../../src/db/entities/DayAssignments.entity';
import { DayNotes } from '../../src/db/entities/DayNotes.entity';
import { Days } from '../../src/db/entities/Days.entity';
import { GooglePlacePhotoMeta } from '../../src/db/entities/GooglePlacePhotoMeta.entity';
import { IdempotencyKeys } from '../../src/db/entities/IdempotencyKeys.entity';
import { InviteTokens } from '../../src/db/entities/InviteTokens.entity';
import { McpTokens } from '../../src/db/entities/McpTokens.entity';
import { OauthTokens } from '../../src/db/entities/OauthTokens.entity';
import { PasswordResetTokens } from '../../src/db/entities/PasswordResetTokens.entity';
import { Photos } from '../../src/db/entities/Photos.entity';
import { PlaceDetailsCache } from '../../src/db/entities/PlaceDetailsCache.entity';
import { PlaceRatings } from '../../src/db/entities/PlaceRatings.entity';
import { PlaceShadowPicks } from '../../src/db/entities/PlaceShadowPicks.entity';
import { Places } from '../../src/db/entities/Places.entity';
import { ReservationDayPositions } from '../../src/db/entities/ReservationDayPositions.entity';
import { ReservationEndpoints } from '../../src/db/entities/ReservationEndpoints.entity';
import { ReservationTravelers } from '../../src/db/entities/ReservationTravelers.entity';
import { Reservations } from '../../src/db/entities/Reservations.entity';
import { RoadtripDayBoundaries } from '../../src/db/entities/RoadtripDayBoundaries.entity';
import { RoadtripDayTracks } from '../../src/db/entities/RoadtripDayTracks.entity';
import { RoadtripPreferences } from '../../src/db/entities/RoadtripPreferences.entity';
import { RoadtripVias } from '../../src/db/entities/RoadtripVias.entity';
import { Settings } from '../../src/db/entities/Settings.entity';
import { Tags } from '../../src/db/entities/Tags.entity';
import { TripInviteTokens } from '../../src/db/entities/TripInviteTokens.entity';
import { TripMembers } from '../../src/db/entities/TripMembers.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { Users } from '../../src/db/entities/Users.entity';
import { WebauthnChallenges } from '../../src/db/entities/WebauthnChallenges.entity';
import { WebauthnCredentials } from '../../src/db/entities/WebauthnCredentials.entity';
import type { AppSettingsRepository } from '../../src/db/repositories/AppSettings.repository';
import type { AssignmentParticipantsRepository } from '../../src/db/repositories/AssignmentParticipants.repository';
import type { CategoriesRepository } from '../../src/db/repositories/Categories.repository';
import type { CollectionLabelsRepository } from '../../src/db/repositories/CollectionLabels.repository';
import type { CollectionMembersRepository } from '../../src/db/repositories/CollectionMembers.repository';
import type { CollectionPlaceRatingsRepository } from '../../src/db/repositories/CollectionPlaceRatings.repository';
import type { CollectionPlacesRepository } from '../../src/db/repositories/CollectionPlaces.repository';
import type { CollectionsRepository } from '../../src/db/repositories/Collections.repository';
import type { DayAccommodationsRepository } from '../../src/db/repositories/DayAccommodations.repository';
import type { DayAssignmentsRepository } from '../../src/db/repositories/DayAssignments.repository';
import type { DayNotesRepository } from '../../src/db/repositories/DayNotes.repository';
import type { DaysRepository } from '../../src/db/repositories/Days.repository';
import type { GooglePlacePhotoMetaRepository } from '../../src/db/repositories/GooglePlacePhotoMeta.repository';
import type { IdempotencyKeysRepository } from '../../src/db/repositories/IdempotencyKeys.repository';
import type { InviteTokensRepository } from '../../src/db/repositories/InviteTokens.repository';
import type { McpTokensRepository } from '../../src/db/repositories/McpTokens.repository';
import type { OauthTokensRepository } from '../../src/db/repositories/OauthTokens.repository';
import type { PasswordResetTokensRepository } from '../../src/db/repositories/PasswordResetTokens.repository';
import type { PhotosRepository } from '../../src/db/repositories/Photos.repository';
import type { PlaceDetailsCacheRepository } from '../../src/db/repositories/PlaceDetailsCache.repository';
import type { PlaceRatingsRepository } from '../../src/db/repositories/PlaceRatings.repository';
import type { PlaceShadowPicksRepository } from '../../src/db/repositories/PlaceShadowPicks.repository';
import type { PlacesRepository } from '../../src/db/repositories/Places.repository';
import type { ReservationDayPositionsRepository } from '../../src/db/repositories/ReservationDayPositions.repository';
import type { ReservationEndpointsRepository } from '../../src/db/repositories/ReservationEndpoints.repository';
import type { ReservationTravelersRepository } from '../../src/db/repositories/ReservationTravelers.repository';
import type { ReservationsRepository } from '../../src/db/repositories/Reservations.repository';
import type { RoadtripDayBoundariesRepository } from '../../src/db/repositories/RoadtripDayBoundaries.repository';
import type { RoadtripDayTracksRepository } from '../../src/db/repositories/RoadtripDayTracks.repository';
import type { RoadtripPreferencesRepository } from '../../src/db/repositories/RoadtripPreferences.repository';
import type { RoadtripViasRepository } from '../../src/db/repositories/RoadtripVias.repository';
import type { SettingsRepository } from '../../src/db/repositories/Settings.repository';
import type { TagsRepository } from '../../src/db/repositories/Tags.repository';
import type { TripInviteTokensRepository } from '../../src/db/repositories/TripInviteTokens.repository';
import type { TripMembersRepository } from '../../src/db/repositories/TripMembers.repository';
import type { TripsRepository } from '../../src/db/repositories/Trips.repository';
import { UserAirtrailRepository } from '../../src/db/repositories/UserAirtrail.repository';
import { UserImmichRepository } from '../../src/db/repositories/UserImmich.repository';
import { UserSynologyRepository } from '../../src/db/repositories/UserSynology.repository';
import type { UsersRepository } from '../../src/db/repositories/Users.repository';
import type { WebauthnChallengesRepository } from '../../src/db/repositories/WebauthnChallenges.repository';
import type { WebauthnCredentialsRepository } from '../../src/db/repositories/WebauthnCredentials.repository';
import { UnitOfWork } from '../../src/nest/database/unit-of-work';
import { createTestOrm, type TestOrm } from './test-orm';
import { Module, type DynamicModule } from '@nestjs/common';

import type Database from 'better-sqlite3';

const perHandle = new WeakMap<Database.Database, Promise<UnitOfWork>>();
const appSettingsPerHandle = new WeakMap<Database.Database, Promise<AppSettingsRepository>>();
const categoriesPerHandle = new WeakMap<Database.Database, Promise<CategoriesRepository>>();
const tagsPerHandle = new WeakMap<Database.Database, Promise<TagsRepository>>();
const settingsPerHandle = new WeakMap<Database.Database, Promise<SettingsRepository>>();
const usersPerHandle = new WeakMap<Database.Database, Promise<UsersRepository>>();
// ONE MikroORM per handle, shared by createTestUnitOfWork and
// createTestAppSettingsRepo (task-2-review.md I2; reworded per
// task-1-2-rereview.md's I-A — the original wording here claimed a
// functional bug that measurement disproved): each used to call
// createTestOrm(db) independently, which opened a SECOND MikroORM.init over
// the same better-sqlite3 handle — two identity maps and two Kysely clients,
// neither ever closed. That is NOT the same as a repository write silently
// running outside a transaction: `TransactionContext.getEntityManager(name)`
// keys on the EntityManager's CONTEXT NAME ('default'), not on which ORM
// instance created it, so a repository built from ORM B still resolved ORM
// A's transactional fork correctly even under the old split wiring —
// transaction resolution worked either way. The reason to share one ORM per
// handle is simpler: it is the same EntityManager Nest's real DI graph would
// inject (one MikroORM per app, not one per consumer), and it stops leaking
// a second identity map and Kysely client per test file. Both functions below
// now derive from this single `t.em`, so a repository resolved from
// `t.repo(X)` and a `UnitOfWork` built from `t.em` share the same
// context-resolving EntityManager, exactly like Nest's real DI graph.
const ormPerHandle = new WeakMap<Database.Database, Promise<TestOrm>>();
/**
 * Exported so a caller that needs the raw `MikroORM` instance itself — not a
 * repository or a `UnitOfWork` derived from it — can still share it: e.g.
 * `plugin-host.ts`'s `createPluginRuntime` passes `(await sharedTestOrm(db)).orm`
 * to `PluginRuntimeService` so `PluginSupervisor`'s D6 request-context wrapper
 * (task-2-review.md C3) forks from the SAME `em` `PermissionsService`'s
 * repository resolves through — a wrapper built from a different ORM instance
 * would fork a context a repository bound to this one never sees.
 */
export function sharedTestOrm(db: Database.Database): Promise<TestOrm> {
  const existing = ormPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = createTestOrm(db);
  ormPerHandle.set(db, pending);
  return pending;
}

/**
 * The `UnitOfWork` a hand-constructed service needs, bound to the suite's own
 * better-sqlite3 handle.
 *
 * `UnitOfWork.transactional` opens the transaction through MikroORM on that same
 * handle, so the legacy raw statements a service still issues inside the
 * callback run inside it — the arrangement the Phase 1 sweep relies on. Memoised
 * per handle via `sharedTestOrm`: one ORM per test file, however many services
 * the file builds — and the SAME one `createTestAppSettingsRepo` below draws
 * from, so a repository and this `UnitOfWork` resolve the same transaction.
 */
export function createTestUnitOfWork(db: Database.Database): Promise<UnitOfWork> {
  // `=== undefined` rather than a truthiness test: a Promise is always truthy,
  // which is exactly what no-misused-promises/checksConditionals rejects.
  const existing = perHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => new UnitOfWork(t.em));
  perHandle.set(db, pending);
  return pending;
}

/**
 * The `AppSettingsRepository` a hand-constructed service needs (`PermissionsService`,
 * mirroring `SettingsService`'s own `t.repo(AppSettings)` in its unit test), bound to
 * the suite's own better-sqlite3 handle the same way `createTestUnitOfWork` is.
 *
 * Memoised per handle via the same `sharedTestOrm` `createTestUnitOfWork` uses —
 * not a second `createTestOrm` call — so this repository and that `UnitOfWork`
 * resolve through the identical `EntityManager` and a `uow.transactional(...)`
 * write this repository makes is actually inside the open transaction.
 */
export function createTestAppSettingsRepo(db: Database.Database): Promise<AppSettingsRepository> {
  const existing = appSettingsPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(AppSettings));
  appSettingsPerHandle.set(db, pending);
  return pending;
}

/**
 * The `CategoriesRepository` a hand-constructed `CategoriesService` needs
 * (Plan 3a Task 3), bound to the suite's own better-sqlite3 handle and
 * memoised via the same `sharedTestOrm` the other helpers here use — not a
 * second `createTestOrm` call (task-2-review.md I2's one-ORM-per-handle
 * ruling).
 */
export function createTestCategoriesRepo(db: Database.Database): Promise<CategoriesRepository> {
  const existing = categoriesPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(Categories));
  categoriesPerHandle.set(db, pending);
  return pending;
}

/**
 * The `TagsRepository` a hand-constructed `TagsService` needs (Plan 3a Task
 * 3), same memoisation as `createTestCategoriesRepo`.
 */
export function createTestTagsRepo(db: Database.Database): Promise<TagsRepository> {
  const existing = tagsPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(Tags));
  tagsPerHandle.set(db, pending);
  return pending;
}

/**
 * The `SettingsRepository` a hand-constructed `SettingsService` needs (Plan
 * 3a Task 5 — the per-user `settings` table repository), same memoisation as
 * `createTestAppSettingsRepo`/`createTestCategoriesRepo`.
 */
export function createTestSettingsRepo(db: Database.Database): Promise<SettingsRepository> {
  const existing = settingsPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(Settings));
  settingsPerHandle.set(db, pending);
  return pending;
}

/**
 * The `UsersRepository` a hand-constructed service passes into
 * `instance-api-keys.ts`'s `resolveApiKey` (and the other functions there
 * that take one) — an explicit parameter, not resolved off an ambient
 * MikroORM request context (Plan 3a Task 5; an earlier version of that file
 * tried the request-context approach and broke 185 unit tests across 12
 * files that build a service with no request context around it — see that
 * file's own docstring). Same memoisation as the others in this file.
 */
export function createTestUsersRepo(db: Database.Database): Promise<UsersRepository> {
  const existing = usersPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(Users));
  usersPerHandle.set(db, pending);
  return pending;
}

/** The Immich connection repository over the handle's shared ORM (same `users` table as {@link createTestUsersRepo}). */
export async function createTestUserImmichRepo(db: Database.Database): Promise<UserImmichRepository> {
  return new UserImmichRepository((await sharedTestOrm(db)).orm.em);
}

/** The Synology connection repository over the handle's shared ORM. */
export async function createTestUserSynologyRepo(db: Database.Database): Promise<UserSynologyRepository> {
  return new UserSynologyRepository((await sharedTestOrm(db)).orm.em);
}

/** The AirTrail connection repository over the handle's shared ORM. */
export async function createTestUserAirtrailRepo(db: Database.Database): Promise<UserAirtrailRepository> {
  return new UserAirtrailRepository((await sharedTestOrm(db)).orm.em);
}

/**
 * The same `UnitOfWork`, as a **global** Nest module.
 *
 * A `Test.createTestingModule({ providers: [...] })` entry only reaches the root
 * testing module, so a service resolved inside its own feature module (the
 * `PermissionsService` in `PermissionsModule`, say) still finds no `UnitOfWork`.
 * `OrmModule` is `@Global()` in the app graph for exactly that reason, and the
 * partial containers the e2e suites build need the same shape.
 */
@Module({})
export class TestUnitOfWorkModule {
  static async forRoot(db: Database.Database): Promise<DynamicModule> {
    const uow = await createTestUnitOfWork(db);
    return {
      module: TestUnitOfWorkModule,
      global: true,
      providers: [{ provide: UnitOfWork, useValue: uow }],
      exports: [UnitOfWork],
    };
  }
}

// ---------------------------------------------------------------------------
// Plan 3b Task 2 (TokenService) — appended after every Task 0/1/3a helper
// above, before Task 3's own block (which appends after this one, per each
// task's file-ownership rule). Same memoisation-per-handle pattern as every
// helper above.
// ---------------------------------------------------------------------------

const mcpTokensPerHandle = new WeakMap<Database.Database, Promise<McpTokensRepository>>();

/** The `McpTokensRepository` a hand-constructed `TokenService` needs (Plan 3b Task 2). */
export function createTestMcpTokensRepo(db: Database.Database): Promise<McpTokensRepository> {
  const existing = mcpTokensPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(McpTokens));
  mcpTokensPerHandle.set(db, pending);
  return pending;
}

// ---------------------------------------------------------------------------
// Plan 3b Task 3 (PasskeyService / RegistrationInvitesService) — appended at
// the end per the task's own file-ownership rule (Task 2 owns everything
// above this point in this file). Same memoisation-per-handle pattern as
// every helper above: one ORM per test file's better-sqlite3 handle, shared
// with whatever `UnitOfWork`/other repository that same file also builds.
// ---------------------------------------------------------------------------

const webauthnCredentialsPerHandle = new WeakMap<Database.Database, Promise<WebauthnCredentialsRepository>>();
const webauthnChallengesPerHandle = new WeakMap<Database.Database, Promise<WebauthnChallengesRepository>>();
const inviteTokensPerHandle = new WeakMap<Database.Database, Promise<InviteTokensRepository>>();

/** The `WebauthnCredentialsRepository` a hand-constructed `PasskeyService` needs. */
export function createTestWebauthnCredentialsRepo(db: Database.Database): Promise<WebauthnCredentialsRepository> {
  const existing = webauthnCredentialsPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(WebauthnCredentials));
  webauthnCredentialsPerHandle.set(db, pending);
  return pending;
}

/** The `WebauthnChallengesRepository` a hand-constructed `PasskeyService` needs. */
export function createTestWebauthnChallengesRepo(db: Database.Database): Promise<WebauthnChallengesRepository> {
  const existing = webauthnChallengesPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(WebauthnChallenges));
  webauthnChallengesPerHandle.set(db, pending);
  return pending;
}

/**
 * The `InviteTokensRepository` a hand-constructed `RegistrationInvitesService`
 * (or `AuthService`) needs — Task 0 built the class, this is the first test
 * helper for it.
 */
export function createTestInviteTokensRepo(db: Database.Database): Promise<InviteTokensRepository> {
  const existing = inviteTokensPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(InviteTokens));
  inviteTokensPerHandle.set(db, pending);
  return pending;
}

// ---------------------------------------------------------------------------
// Plan 3b Task 5 (AuthService / UserCleanupService) — appended at the end per
// the task's own file-ownership rule. Same memoisation-per-handle pattern as
// every helper above: one ORM per test file's better-sqlite3 handle, shared
// with whatever `UnitOfWork`/other repository that same file also builds —
// required per the Task 4 review ("append createTestOauthTokensRepo to
// test-uow.ts through the existing sharedTestOrm memoisation — a repository
// from a different ORM instance resolves a different fork and the
// transaction test lies").
// ---------------------------------------------------------------------------

const oauthTokensPerHandle = new WeakMap<Database.Database, Promise<OauthTokensRepository>>();
const passwordResetTokensPerHandle = new WeakMap<Database.Database, Promise<PasswordResetTokensRepository>>();

/** The `OauthTokensRepository` a hand-constructed `AuthService` needs (Plan 3b Task 4's `revokeAllForUser`, consumed by Task 5). */
export function createTestOauthTokensRepo(db: Database.Database): Promise<OauthTokensRepository> {
  const existing = oauthTokensPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(OauthTokens));
  oauthTokensPerHandle.set(db, pending);
  return pending;
}

/** The `PasswordResetTokensRepository` a hand-constructed `AuthService` needs (Plan 3b Task 5, new repository). */
export function createTestPasswordResetTokensRepo(db: Database.Database): Promise<PasswordResetTokensRepository> {
  const existing = passwordResetTokensPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(PasswordResetTokens));
  passwordResetTokensPerHandle.set(db, pending);
  return pending;
}

// ---------------------------------------------------------------------------
// Plan 3c Task 0b (trip-access primitives onto TripsRepository/
// TripMembersRepository/PlacesRepository) — appended at the end per the
// task's own file-ownership rule. Same memoisation-per-handle pattern as
// every helper above.
// ---------------------------------------------------------------------------

const tripsRepoPerHandle = new WeakMap<Database.Database, Promise<TripsRepository>>();
const tripMembersRepoPerHandle = new WeakMap<Database.Database, Promise<TripMembersRepository>>();
const placesRepoPerHandle = new WeakMap<Database.Database, Promise<PlacesRepository>>();

/** The `TripsRepository` a hand-constructed `TripAccessGuard` double needs. */
export function createTestTripsRepo(db: Database.Database): Promise<TripsRepository> {
  const existing = tripsRepoPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(Trips));
  tripsRepoPerHandle.set(db, pending);
  return pending;
}

/** The `TripMembersRepository` `PackingService`/`BudgetService`/`TodoService`'s `rosterUserIds` needs. */
export function createTestTripMembersRepo(db: Database.Database): Promise<TripMembersRepository> {
  const existing = tripMembersRepoPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(TripMembers));
  tripMembersRepoPerHandle.set(db, pending);
  return pending;
}

/** The `PlacesRepository` `PlacesService.findWithTagsAndRatings` needs. */
export function createTestPlacesRepo(db: Database.Database): Promise<PlacesRepository> {
  const existing = placesRepoPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(Places));
  placesRepoPerHandle.set(db, pending);
  return pending;
}

// ---------------------------------------------------------------------------
// Plan 3c Task 2 (`DaysService` + day notes onto `DaysRepository`/
// `DayAssignmentsRepository`/`DayNotesRepository`/`TripsRepository.setEndDate`)
// — appended at the end per the task's own file-ownership rule (append only).
// Same memoisation-per-handle pattern as every helper above.
// ---------------------------------------------------------------------------

const daysRepoPerHandle = new WeakMap<Database.Database, Promise<DaysRepository>>();
const dayAssignmentsRepoPerHandle = new WeakMap<Database.Database, Promise<DayAssignmentsRepository>>();
const dayNotesRepoPerHandle = new WeakMap<Database.Database, Promise<DayNotesRepository>>();

/** The `DaysRepository` a hand-constructed `DaysService` needs. */
export function createTestDaysRepo(db: Database.Database): Promise<DaysRepository> {
  const existing = daysRepoPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(Days));
  daysRepoPerHandle.set(db, pending);
  return pending;
}

/** The `DayAssignmentsRepository` a hand-constructed `DaysService` needs. */
export function createTestDayAssignmentsRepo(db: Database.Database): Promise<DayAssignmentsRepository> {
  const existing = dayAssignmentsRepoPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(DayAssignments));
  dayAssignmentsRepoPerHandle.set(db, pending);
  return pending;
}

/** The `DayNotesRepository` a hand-constructed `DaysService` needs (DY4). */
export function createTestDayNotesRepo(db: Database.Database): Promise<DayNotesRepository> {
  const existing = dayNotesRepoPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(DayNotes));
  dayNotesRepoPerHandle.set(db, pending);
  return pending;
}

// ---------------------------------------------------------------------------
// Plan 3c Task 1 (`QueryHelpersService`/`TripMembershipService`/
// `PlaceShadowService`/`PlaceEnrichmentService`/`PlacePhotoCacheService` onto
// repositories) — appended at the end per the task's own file-ownership rule
// (append only). Same memoisation-per-handle pattern as every helper above.
// `TagsRepository` already has `createTestTagsRepo` (Plan 3a Task 3) — a
// hand-constructed `QueryHelpersService` reuses that one rather than a second
// copy. `TripsRepository`/`TripMembersRepository` already have
// `createTestTripsRepo`/`createTestTripMembersRepo` (Plan 3c Task 0b) — a
// hand-constructed `TripMembershipService` reuses those too.
// ---------------------------------------------------------------------------

const placeRatingsRepoPerHandle = new WeakMap<Database.Database, Promise<PlaceRatingsRepository>>();
const assignmentParticipantsRepoPerHandle = new WeakMap<Database.Database, Promise<AssignmentParticipantsRepository>>();
const placeShadowPicksRepoPerHandle = new WeakMap<Database.Database, Promise<PlaceShadowPicksRepository>>();
const googlePlacePhotoMetaRepoPerHandle = new WeakMap<Database.Database, Promise<GooglePlacePhotoMetaRepository>>();
const placeDetailsCacheRepoPerHandle = new WeakMap<Database.Database, Promise<PlaceDetailsCacheRepository>>();

/** The `PlaceRatingsRepository` a hand-constructed `QueryHelpersService` needs (QH2). */
export function createTestPlaceRatingsRepo(db: Database.Database): Promise<PlaceRatingsRepository> {
  const existing = placeRatingsRepoPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(PlaceRatings));
  placeRatingsRepoPerHandle.set(db, pending);
  return pending;
}

/** The `AssignmentParticipantsRepository` a hand-constructed `QueryHelpersService` needs (QH3). */
export function createTestAssignmentParticipantsRepo(db: Database.Database): Promise<AssignmentParticipantsRepository> {
  const existing = assignmentParticipantsRepoPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(AssignmentParticipants));
  assignmentParticipantsRepoPerHandle.set(db, pending);
  return pending;
}

/** The `PlaceShadowPicksRepository` a hand-constructed `PlaceShadowService` needs. */
export function createTestPlaceShadowPicksRepo(db: Database.Database): Promise<PlaceShadowPicksRepository> {
  const existing = placeShadowPicksRepoPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(PlaceShadowPicks));
  placeShadowPicksRepoPerHandle.set(db, pending);
  return pending;
}

/** The `GooglePlacePhotoMetaRepository` a hand-constructed `PlacePhotoCacheService` needs. */
export function createTestGooglePlacePhotoMetaRepo(db: Database.Database): Promise<GooglePlacePhotoMetaRepository> {
  const existing = googlePlacePhotoMetaRepoPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(GooglePlacePhotoMeta));
  googlePlacePhotoMetaRepoPerHandle.set(db, pending);
  return pending;
}

/** The `PlaceDetailsCacheRepository` a hand-constructed `PlaceEnrichmentService` needs. */
export function createTestPlaceDetailsCacheRepo(db: Database.Database): Promise<PlaceDetailsCacheRepository> {
  const existing = placeDetailsCacheRepoPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(PlaceDetailsCache));
  placeDetailsCacheRepoPerHandle.set(db, pending);
  return pending;
}

// ---------------------------------------------------------------------------
// Plan 3d Task 2 (`ReservationsService`/`DaysService`'s DY14–DY18/DY23 onto
// `ReservationsRepository`/`ReservationEndpointsRepository`/
// `ReservationTravelersRepository`/`ReservationDayPositionsRepository`/
// `DayAccommodationsRepository`) — appended at the end per the task's own
// file-ownership rule (append only). Same memoisation-per-handle pattern as
// every helper above.
// ---------------------------------------------------------------------------

const reservationsRepoPerHandle = new WeakMap<Database.Database, Promise<ReservationsRepository>>();
const reservationEndpointsRepoPerHandle = new WeakMap<Database.Database, Promise<ReservationEndpointsRepository>>();
const reservationTravelersRepoPerHandle = new WeakMap<Database.Database, Promise<ReservationTravelersRepository>>();
const reservationDayPositionsRepoPerHandle = new WeakMap<
  Database.Database,
  Promise<ReservationDayPositionsRepository>
>();
const dayAccommodationsRepoPerHandle = new WeakMap<Database.Database, Promise<DayAccommodationsRepository>>();

/** The `ReservationsRepository` a hand-constructed `ReservationsService`/`DaysService` needs. */
export function createTestReservationsRepo(db: Database.Database): Promise<ReservationsRepository> {
  const existing = reservationsRepoPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(Reservations));
  reservationsRepoPerHandle.set(db, pending);
  return pending;
}

/** The `ReservationEndpointsRepository` a hand-constructed `ReservationsService`/`DaysService` needs. */
export function createTestReservationEndpointsRepo(db: Database.Database): Promise<ReservationEndpointsRepository> {
  const existing = reservationEndpointsRepoPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(ReservationEndpoints));
  reservationEndpointsRepoPerHandle.set(db, pending);
  return pending;
}

/** The `ReservationTravelersRepository` a hand-constructed `ReservationsService` needs. */
export function createTestReservationTravelersRepo(db: Database.Database): Promise<ReservationTravelersRepository> {
  const existing = reservationTravelersRepoPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(ReservationTravelers));
  reservationTravelersRepoPerHandle.set(db, pending);
  return pending;
}

/** The `ReservationDayPositionsRepository` a hand-constructed `ReservationsService` needs. */
export function createTestReservationDayPositionsRepo(
  db: Database.Database,
): Promise<ReservationDayPositionsRepository> {
  const existing = reservationDayPositionsRepoPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(ReservationDayPositions));
  reservationDayPositionsRepoPerHandle.set(db, pending);
  return pending;
}

/** The `DayAccommodationsRepository` a hand-constructed `ReservationsService` needs. */
export function createTestDayAccommodationsRepo(db: Database.Database): Promise<DayAccommodationsRepository> {
  const existing = dayAccommodationsRepoPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(DayAccommodations));
  dayAccommodationsRepoPerHandle.set(db, pending);
  return pending;
}

// ---------------------------------------------------------------------------
// Plan 3d Task 1 (`RoadtripService`/`RoadtripPlanService`/
// `RoadtripPreferencesService`/`DayBoundariesService`/`ChargingService`/
// `GoogleRouteService`, `AssignmentsService`'s AS20–AS23) — appended at the
// end per this task's own file-ownership rule (append only). Same
// memoisation-per-handle pattern as every helper above.
// ---------------------------------------------------------------------------

const roadtripViasRepoPerHandle = new WeakMap<Database.Database, Promise<RoadtripViasRepository>>();
const roadtripDayTracksRepoPerHandle = new WeakMap<Database.Database, Promise<RoadtripDayTracksRepository>>();
const roadtripPreferencesRepoPerHandle = new WeakMap<Database.Database, Promise<RoadtripPreferencesRepository>>();
const roadtripDayBoundariesRepoPerHandle = new WeakMap<Database.Database, Promise<RoadtripDayBoundariesRepository>>();

/** The `RoadtripViasRepository` a hand-constructed `RoadtripService`/`AssignmentsService` needs. */
export function createTestRoadtripViasRepo(db: Database.Database): Promise<RoadtripViasRepository> {
  const existing = roadtripViasRepoPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(RoadtripVias));
  roadtripViasRepoPerHandle.set(db, pending);
  return pending;
}

/** The `RoadtripDayTracksRepository` a hand-constructed `RoadtripService` needs. */
export function createTestRoadtripDayTracksRepo(db: Database.Database): Promise<RoadtripDayTracksRepository> {
  const existing = roadtripDayTracksRepoPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(RoadtripDayTracks));
  roadtripDayTracksRepoPerHandle.set(db, pending);
  return pending;
}

/** The `RoadtripPreferencesRepository` a hand-constructed `RoadtripPreferencesService` needs. */
export function createTestRoadtripPreferencesRepo(db: Database.Database): Promise<RoadtripPreferencesRepository> {
  const existing = roadtripPreferencesRepoPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(RoadtripPreferences));
  roadtripPreferencesRepoPerHandle.set(db, pending);
  return pending;
}

/** The `RoadtripDayBoundariesRepository` a hand-constructed `DayBoundariesService` needs. */
export function createTestRoadtripDayBoundariesRepo(db: Database.Database): Promise<RoadtripDayBoundariesRepository> {
  const existing = roadtripDayBoundariesRepoPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(RoadtripDayBoundaries));
  roadtripDayBoundariesRepoPerHandle.set(db, pending);
  return pending;
}

// ---------------------------------------------------------------------------
// Plan 3h Task 1 (collections part A) — `CollectionsRepository`/
// `CollectionMembersRepository`/`CollectionLabelsRepository` a hand-constructed
// `CollectionsService` needs. Same memoisation-per-handle pattern as every
// helper above.
// ---------------------------------------------------------------------------

const collectionsRepoPerHandle = new WeakMap<Database.Database, Promise<CollectionsRepository>>();
const collectionMembersRepoPerHandle = new WeakMap<Database.Database, Promise<CollectionMembersRepository>>();
const collectionLabelsRepoPerHandle = new WeakMap<Database.Database, Promise<CollectionLabelsRepository>>();

/** The `CollectionsRepository` a hand-constructed `CollectionsService` needs. */
export function createTestCollectionsRepo(db: Database.Database): Promise<CollectionsRepository> {
  const existing = collectionsRepoPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(Collections));
  collectionsRepoPerHandle.set(db, pending);
  return pending;
}

/** The `CollectionMembersRepository` a hand-constructed `CollectionsService` needs. */
export function createTestCollectionMembersRepo(db: Database.Database): Promise<CollectionMembersRepository> {
  const existing = collectionMembersRepoPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(CollectionMembers));
  collectionMembersRepoPerHandle.set(db, pending);
  return pending;
}

/** The `CollectionLabelsRepository` a hand-constructed `CollectionsService` needs. */
export function createTestCollectionLabelsRepo(db: Database.Database): Promise<CollectionLabelsRepository> {
  const existing = collectionLabelsRepoPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(CollectionLabels));
  collectionLabelsRepoPerHandle.set(db, pending);
  return pending;
}

// ---------------------------------------------------------------------------
// Plan 3h Task 2 (collections part B) — `CollectionPlacesRepository`/
// `CollectionPlaceRatingsRepository` a hand-constructed `CollectionsService`
// needs. Same memoisation-per-handle pattern as every helper above.
// ---------------------------------------------------------------------------

const collectionPlacesRepoPerHandle = new WeakMap<Database.Database, Promise<CollectionPlacesRepository>>();
const collectionPlaceRatingsRepoPerHandle = new WeakMap<Database.Database, Promise<CollectionPlaceRatingsRepository>>();

/** The `CollectionPlacesRepository` a hand-constructed `CollectionsService` needs. */
export function createTestCollectionPlacesRepo(db: Database.Database): Promise<CollectionPlacesRepository> {
  const existing = collectionPlacesRepoPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(CollectionPlaces));
  collectionPlacesRepoPerHandle.set(db, pending);
  return pending;
}

/** The `CollectionPlaceRatingsRepository` a hand-constructed `CollectionsService` needs. */
export function createTestCollectionPlaceRatingsRepo(db: Database.Database): Promise<CollectionPlaceRatingsRepository> {
  const existing = collectionPlaceRatingsRepoPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(CollectionPlaceRatings));
  collectionPlaceRatingsRepoPerHandle.set(db, pending);
  return pending;
}

// ---------------------------------------------------------------------------
// Plan 4 Task 1 — the orphaned raw-SQL conversions: `IdempotencyKeysRepository`
// (`idempotency.interceptor.ts`/`idempotency-cleanup.ts`), `TripInviteTokensRepository`
// (`trip-invite.service.ts`) and `PhotosRepository` (`platform.routes.ts`'s
// pre-init `servePhoto` handler) for hand-constructed services/tests. Same
// memoisation-per-handle pattern as every helper above.
// ---------------------------------------------------------------------------

const idempotencyKeysRepoPerHandle = new WeakMap<Database.Database, Promise<IdempotencyKeysRepository>>();
const tripInviteTokensRepoPerHandle = new WeakMap<Database.Database, Promise<TripInviteTokensRepository>>();
const photosRepoPerHandle = new WeakMap<Database.Database, Promise<PhotosRepository>>();

/** The `IdempotencyKeysRepository` a hand-constructed `IdempotencyInterceptor`/`IdempotencyCleanupJob` needs. */
export function createTestIdempotencyKeysRepo(db: Database.Database): Promise<IdempotencyKeysRepository> {
  const existing = idempotencyKeysRepoPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(IdempotencyKeys));
  idempotencyKeysRepoPerHandle.set(db, pending);
  return pending;
}

/** The `TripInviteTokensRepository` a hand-constructed `TripInviteService` needs. */
export function createTestTripInviteTokensRepo(db: Database.Database): Promise<TripInviteTokensRepository> {
  const existing = tripInviteTokensRepoPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(TripInviteTokens));
  tripInviteTokensRepoPerHandle.set(db, pending);
  return pending;
}

/** The `PhotosRepository` `platform.routes.ts`'s pre-init `servePhoto` handler needs. */
export function createTestPhotosRepo(db: Database.Database): Promise<PhotosRepository> {
  const existing = photosRepoPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(Photos));
  photosRepoPerHandle.set(db, pending);
  return pending;
}
