import { BucketList } from '../../src/db/entities/BucketList.entity';
import { HiddenCountries } from '../../src/db/entities/HiddenCountries.entity';
import { HiddenRegions } from '../../src/db/entities/HiddenRegions.entity';
import { PlaceRegions } from '../../src/db/entities/PlaceRegions.entity';
import { VisitedCountries } from '../../src/db/entities/VisitedCountries.entity';
import { VisitedRegions } from '../../src/db/entities/VisitedRegions.entity';
import type { BucketListRepository } from '../../src/db/repositories/BucketList.repository';
import type { HiddenCountriesRepository } from '../../src/db/repositories/HiddenCountries.repository';
import type { HiddenRegionsRepository } from '../../src/db/repositories/HiddenRegions.repository';
import type { PlaceRegionsRepository } from '../../src/db/repositories/PlaceRegions.repository';
import type { VisitedCountriesRepository } from '../../src/db/repositories/VisitedCountries.repository';
import type { VisitedRegionsRepository } from '../../src/db/repositories/VisitedRegions.repository';
import { sharedTestOrm } from './test-uow';

import type Database from 'better-sqlite3';

/**
 * Plan 3f Task 1 (`AtlasService`) test-only repository factories, bound to a
 * suite's own better-sqlite3 handle via the SAME memoised `sharedTestOrm`
 * (`test-uow.ts`) `school-holidays-repos.ts`/`todo-repos.ts`/`files-repos.ts`/
 * `collab-repos.ts` precedent — required so a repository built here and a
 * `UnitOfWork` built from `createTestUnitOfWork` (that file) resolve the
 * IDENTICAL context-resolving `EntityManager`.
 *
 * `TripsRepository`/`PlacesRepository`/`ReservationEndpointsRepository` (the
 * three repositories atlas's additive methods live on) already have their
 * own factories in `test-uow.ts` (`createTestTripsRepo`/
 * `createTestPlacesRepo`/`createTestReservationEndpointsRepo`) — this file
 * only adds the six atlas-owned tables' factories, not a second copy of
 * those three.
 *
 * A NEW file rather than an addition to `test-uow.ts`, same reasoning those
 * other domain-owned factory files give for themselves: avoids colliding
 * with a concurrently in-flight task's edits to that shared file.
 */
export function createTestBucketListRepo(db: Database.Database): Promise<BucketListRepository> {
  return sharedTestOrm(db).then((t) => t.repo(BucketList));
}

export function createTestHiddenCountriesRepo(db: Database.Database): Promise<HiddenCountriesRepository> {
  return sharedTestOrm(db).then((t) => t.repo(HiddenCountries));
}

export function createTestHiddenRegionsRepo(db: Database.Database): Promise<HiddenRegionsRepository> {
  return sharedTestOrm(db).then((t) => t.repo(HiddenRegions));
}

export function createTestVisitedCountriesRepo(db: Database.Database): Promise<VisitedCountriesRepository> {
  return sharedTestOrm(db).then((t) => t.repo(VisitedCountries));
}

export function createTestVisitedRegionsRepo(db: Database.Database): Promise<VisitedRegionsRepository> {
  return sharedTestOrm(db).then((t) => t.repo(VisitedRegions));
}

export function createTestPlaceRegionsRepo(db: Database.Database): Promise<PlaceRegionsRepository> {
  return sharedTestOrm(db).then((t) => t.repo(PlaceRegions));
}
