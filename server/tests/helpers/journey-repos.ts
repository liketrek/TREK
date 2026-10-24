import { JourneyContributors } from '../../src/db/entities/JourneyContributors.entity';
import { JourneyEntries } from '../../src/db/entities/JourneyEntries.entity';
import { JourneyEntryPhotos } from '../../src/db/entities/JourneyEntryPhotos.entity';
import { JourneyPhotos } from '../../src/db/entities/JourneyPhotos.entity';
import { JourneyTrips } from '../../src/db/entities/JourneyTrips.entity';
import { Journeys } from '../../src/db/entities/Journeys.entity';
import type { JourneyContributorsRepository } from '../../src/db/repositories/JourneyContributors.repository';
import type { JourneyEntriesRepository } from '../../src/db/repositories/JourneyEntries.repository';
import type { JourneyEntryPhotosRepository } from '../../src/db/repositories/JourneyEntryPhotos.repository';
import type { JourneyPhotosRepository } from '../../src/db/repositories/JourneyPhotos.repository';
import type { JourneyTripsRepository } from '../../src/db/repositories/JourneyTrips.repository';
import type { JourneysRepository } from '../../src/db/repositories/Journeys.repository';
import { sharedTestOrm } from './test-uow';

import type Database from 'better-sqlite3';

/**
 * Plan 3g Task 1 (`JourneyDomainService` Part A) test-only repository
 * factories, bound to a suite's own better-sqlite3 handle via the SAME
 * memoised `sharedTestOrm` (`test-uow.ts`) `atlas-repos.ts`/`vacay-repos.ts`/
 * `school-holidays-repos.ts` precedent — required so a repository built here
 * and a `UnitOfWork` built from `createTestUnitOfWork` (that file) resolve
 * the IDENTICAL context-resolving `EntityManager`.
 *
 * `TripsRepository` (also needed by a hand-constructed `JourneyDomainService`,
 * for AP1's `findAccessible`/`getTitle`) already has its own factory in
 * `test-uow.ts` (`createTestTripsRepo`) — this file only adds the four
 * journey-owned tables' factories, not a second copy of that one.
 *
 * A NEW file rather than an addition to `test-uow.ts`, same reasoning every
 * other domain-owned factory file gives for itself: avoids colliding with a
 * concurrently in-flight task's edits to that shared file (the Plan 3f fix
 * wave is in the tree on a disjoint set at the time this task runs).
 */
export function createTestJourneysRepo(db: Database.Database): Promise<JourneysRepository> {
  return sharedTestOrm(db).then((t) => t.repo(Journeys));
}

export function createTestJourneyContributorsRepo(db: Database.Database): Promise<JourneyContributorsRepository> {
  return sharedTestOrm(db).then((t) => t.repo(JourneyContributors));
}

export function createTestJourneyTripsRepo(db: Database.Database): Promise<JourneyTripsRepository> {
  return sharedTestOrm(db).then((t) => t.repo(JourneyTrips));
}

export function createTestJourneyEntriesRepo(db: Database.Database): Promise<JourneyEntriesRepository> {
  return sharedTestOrm(db).then((t) => t.repo(JourneyEntries));
}

/**
 * Plan 3g Task 2 (`JourneyDomainService` Part B) additions — the two
 * repositories Task 1 left as empty stubs for this task to populate
 * (`JourneyPhotos.repository.ts`/`JourneyEntryPhotos.repository.ts`), same
 * `sharedTestOrm` binding as the four factories above.
 */
export function createTestJourneyPhotosRepo(db: Database.Database): Promise<JourneyPhotosRepository> {
  return sharedTestOrm(db).then((t) => t.repo(JourneyPhotos));
}

export function createTestJourneyEntryPhotosRepo(db: Database.Database): Promise<JourneyEntryPhotosRepository> {
  return sharedTestOrm(db).then((t) => t.repo(JourneyEntryPhotos));
}
