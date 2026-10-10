import { BudgetItems } from '../../src/db/entities/BudgetItems.entity';
import { FileLinks } from '../../src/db/entities/FileLinks.entity';
import { TripFiles } from '../../src/db/entities/TripFiles.entity';
import type { BudgetItemsRepository } from '../../src/db/repositories/BudgetItems.repository';
import type { FileLinksRepository } from '../../src/db/repositories/FileLinks.repository';
import type { TripFilesRepository } from '../../src/db/repositories/TripFiles.repository';
import { sharedTestOrm } from './test-uow';

import type Database from 'better-sqlite3';

/**
 * Plan 3e Task 1 (`FilesService`) test-only repository factories, bound to a
 * suite's own better-sqlite3 handle via the SAME memoised `sharedTestOrm`
 * `test-uow.ts`'s helpers use — required so a repository built here and a
 * `UnitOfWork` built from `createTestUnitOfWork` (that file) resolve the
 * IDENTICAL context-resolving `EntityManager` (a repository from a second,
 * independent ORM instance would write outside the open transaction and
 * deadlock on Kysely's connection mutex — `test-uow.ts`'s own docstring).
 *
 * A NEW file rather than an addition to `test-uow.ts`: that file is Plan 3e
 * Task 6's named file set in this window (`tests/helpers/{mcp-test-
 * controllers,plugin-host,test-uow}.ts`), and `sharedTestOrm`/`t.repo(...)`
 * are exported precisely so a later task's tests don't need to edit it to
 * get a repository this way. `ReservationsRepository`/`PlacesRepository`/
 * `DayAssignmentsRepository`/`UsersRepository`/`AppSettingsRepository`
 * already have their own factories in `test-uow.ts` (`createTestReservationsRepo`
 * etc.) and are reused directly from there — only `TripFilesRepository`,
 * `FileLinksRepository` and `BudgetItemsRepository` are new here.
 */
export function createTestTripFilesRepo(db: Database.Database): Promise<TripFilesRepository> {
  return sharedTestOrm(db).then((t) => t.repo(TripFiles));
}

export function createTestFileLinksRepo(db: Database.Database): Promise<FileLinksRepository> {
  return sharedTestOrm(db).then((t) => t.repo(FileLinks));
}

/** `BudgetItemsRepository` — Task 2 (budget) owns every method appended to the production file; this task only needs `findTripId` (R12). */
export function createTestBudgetItemsRepo(db: Database.Database): Promise<BudgetItemsRepository> {
  return sharedTestOrm(db).then((t) => t.repo(BudgetItems));
}
