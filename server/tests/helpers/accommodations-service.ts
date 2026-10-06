import { TrekPhotos } from '../../src/db/entities/TrekPhotos.entity';
import { TripPhotos } from '../../src/db/entities/TripPhotos.entity';
import { AccommodationsService } from '../../src/nest/accommodations/accommodations.service';
import { AssignmentsService } from '../../src/nest/assignments/assignments.service';
import { JourneyDomainService } from '../../src/nest/journey/journey-domain.service';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { TrekPhotoRegistrationService } from '../../src/nest/photos/trek-photo-registration.service';
import { QueryHelpersService } from '../../src/nest/query-helpers/query-helpers.service';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { createTestBudgetItemsRepo } from './files-repos';
import {
  createTestJourneysRepo,
  createTestJourneyContributorsRepo,
  createTestJourneyTripsRepo,
  createTestJourneyEntriesRepo,
  createTestJourneyPhotosRepo,
  createTestJourneyEntryPhotosRepo,
} from './journey-repos';
import {
  createTestUnitOfWork,
  createTestAppSettingsRepo,
  createTestTagsRepo,
  createTestPlaceRatingsRepo,
  createTestAssignmentParticipantsRepo,
  createTestDayAssignmentsRepo,
  createTestDaysRepo,
  createTestPlacesRepo,
  createTestTripMembersRepo,
  createTestRoadtripViasRepo,
  createTestDayAccommodationsRepo,
  createTestReservationsRepo,
  sharedTestOrm,
  createTestTripsRepo,
} from './test-uow';

import type { Database } from 'better-sqlite3';

/**
 * AccommodationsService over a test connection.
 *
 * Booking a night also writes the day stop that puts it on the route, through a
 * real AssignmentsService rather than a stub: the stop is a row these cases read
 * back, and it has to come out of the same connection. Five collaborators deep is
 * why this is a helper and not five copies across the suites.
 *
 * Plan 4 Task 4: `DatabaseService` is gone — both this function and
 * `accommodationsOver` below take the raw better-sqlite3 handle directly now
 * (it was always the only thing either read off a `DatabaseService`
 * instance). Kept as two functions for caller-shape continuity, though they
 * are now identical.
 */
export async function makeAccommodationsService(conn: Database): Promise<AccommodationsService> {
  return accommodationsOver(conn);
}

/**
 * The same, for a suite that already holds the raw connection.
 *
 * ReservationsService takes one now, because a hotel booking owes the day plan
 * the same stop a night entered under Days does, and every suite that builds
 * that service by hand needs one to hand it.
 */
export async function accommodationsOver(conn: Database): Promise<AccommodationsService> {
  const permissions = new PermissionsService(await createTestAppSettingsRepo(conn), await createTestUnitOfWork(conn));
  const realtime = new RealtimeService();
  const t = await sharedTestOrm(conn);
  const assignments = new AssignmentsService(
    await createTestTripsRepo(conn),
    permissions,
    realtime,
    new QueryHelpersService(
      await createTestTagsRepo(conn),
      await createTestPlaceRatingsRepo(conn),
      await createTestAssignmentParticipantsRepo(conn),
    ),
    new JourneyDomainService(
      realtime,
      new TrekPhotoRegistrationService(t.repo(TrekPhotos), t.repo(TripPhotos), await createTestJourneyPhotosRepo(conn)),
      await createTestUnitOfWork(conn),
      await createTestJourneysRepo(conn),
      await createTestJourneyContributorsRepo(conn),
      await createTestJourneyTripsRepo(conn),
      await createTestJourneyEntriesRepo(conn),
      await createTestTripsRepo(conn),
      // Plan 3g Task 2 constructor-ripple: JourneyPhotosRepository/JourneyEntryPhotosRepository/PlacesRepository.
      await createTestJourneyPhotosRepo(conn),
      await createTestJourneyEntryPhotosRepo(conn),
      await createTestPlacesRepo(conn),
    ),
    await createTestUnitOfWork(conn),
    await createTestDayAssignmentsRepo(conn),
    await createTestAssignmentParticipantsRepo(conn),
    await createTestDaysRepo(conn),
    await createTestPlacesRepo(conn),
    await createTestTripMembersRepo(conn),
    await createTestRoadtripViasRepo(conn),
  );
  return new AccommodationsService(
    permissions,
    realtime,
    assignments,
    await createTestUnitOfWork(conn),
    // Plan 4 Task 2 — AccommodationsService's own canAccessTrip delegate is now
    // TripsRepository.findAccessible. Plan 4 Task 3 — stampLodging's
    // getPlaceWithTags is PlacesRepository.findWithTagsAndRatings directly
    // (`placesRepo` below, already injected).
    await createTestTripsRepo(conn),
    await createTestDayAccommodationsRepo(conn),
    await createTestDayAssignmentsRepo(conn),
    await createTestPlacesRepo(conn),
    await createTestDaysRepo(conn),
    await createTestRoadtripViasRepo(conn),
    await createTestReservationsRepo(conn),
    await createTestBudgetItemsRepo(conn),
  );
}
