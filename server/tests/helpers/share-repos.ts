import { PluginUserErasureQueue } from '../../src/db/entities/PluginUserErasureQueue.entity';
import { Plugins } from '../../src/db/entities/Plugins.entity';
import { ShareTokens } from '../../src/db/entities/ShareTokens.entity';
import type { BudgetItemsRepository } from '../../src/db/repositories/BudgetItems.repository';
import type { CategoriesRepository } from '../../src/db/repositories/Categories.repository';
import type { CollabMessagesRepository } from '../../src/db/repositories/CollabMessages.repository';
import type { DayAssignmentsRepository } from '../../src/db/repositories/DayAssignments.repository';
import type { DayNotesRepository } from '../../src/db/repositories/DayNotes.repository';
import type { DaysRepository } from '../../src/db/repositories/Days.repository';
import type { PackingItemsRepository } from '../../src/db/repositories/PackingItems.repository';
import type { PlacesRepository } from '../../src/db/repositories/Places.repository';
import type { PluginUserErasureQueueRepository } from '../../src/db/repositories/PluginUserErasureQueue.repository';
import type { PluginsRepository } from '../../src/db/repositories/Plugins.repository';
import type { ReservationsRepository } from '../../src/db/repositories/Reservations.repository';
import type { ShareTokensRepository } from '../../src/db/repositories/ShareTokens.repository';
import type { TripsRepository } from '../../src/db/repositories/Trips.repository';
import { createTestCollabMessagesRepo } from './collab-repos';
import { createTestBudgetItemsRepo } from './files-repos';
import { createTestPackingItemsRepo } from './packing-repos';
import {
  sharedTestOrm,
  createTestReservationsRepo,
  createTestTripsRepo,
  createTestDaysRepo,
  createTestDayAssignmentsRepo,
  createTestDayNotesRepo,
  createTestPlacesRepo,
  createTestCategoriesRepo,
} from './test-uow';

import type Database from 'better-sqlite3';

/**
 * Plan 3h Task 6 (`ShareService`/`UserCleanupService`'s UC6) test-only
 * repository factories, bound to a suite's own better-sqlite3 handle via the
 * SAME memoised `sharedTestOrm` `test-uow.ts` exports — required so a
 * repository built here and a `UnitOfWork` built from `createTestUnitOfWork`
 * (that file) resolve the IDENTICAL context-resolving `EntityManager` (the
 * `budget-repos.ts`/`collab-repos.ts` precedent this file copies verbatim).
 *
 * `ShareTokensRepository` is the only genuinely NEW factory here — every
 * other repository `ShareService`'s constructor now needs already has one
 * (`test-uow.ts`, `files-repos.ts`, `packing-repos.ts`, `collab-repos.ts`),
 * reused directly, never re-derived.
 */
export function createTestShareTokensRepo(db: Database.Database): Promise<ShareTokensRepository> {
  return sharedTestOrm(db).then((t) => t.repo(ShareTokens));
}

/**
 * Plan 4 Task 8a — `UserCleanupService.erasePluginUserData`'s UC2/UC3
 * erasure-enqueue half, converted off `DatabaseService` onto these two
 * repositories (shared with `PluginRuntimeService.enqueueUserErasure` via
 * `enqueueHookUserDataErasures`). Same `sharedTestOrm` factory shape as
 * `createTestShareTokensRepo` above.
 */
export function createTestPluginsRepo(db: Database.Database): Promise<PluginsRepository> {
  return sharedTestOrm(db).then((t) => t.repo(Plugins));
}

export function createTestPluginUserErasureQueueRepo(db: Database.Database): Promise<PluginUserErasureQueueRepository> {
  return sharedTestOrm(db).then((t) => t.repo(PluginUserErasureQueue));
}

/**
 * The 10 repository arguments `ShareService`'s constructor appends after
 * `uow` (`reservationsRepo`, `shareTokens`, `trips`, `days`, `dayAssignments`,
 * `dayNotes`, `places`, `packingItems`, `budgetItems`, `categories`,
 * `collabMessages` — 11 total, `reservationsRepo` already had its own 3d
 * factory), built over the SAME connection in one call — every hand-built
 * `new ShareService(...)` test call site spreads this
 * (`...(await shareServiceRepoArgs(conn))`) instead of repeating all 11
 * factories, the `budgetRepoArgs` precedent.
 */
export async function shareServiceRepoArgs(
  db: Database.Database,
): Promise<
  [
    ReservationsRepository,
    ShareTokensRepository,
    TripsRepository,
    DaysRepository,
    DayAssignmentsRepository,
    DayNotesRepository,
    PlacesRepository,
    PackingItemsRepository,
    BudgetItemsRepository,
    CategoriesRepository,
    CollabMessagesRepository,
  ]
> {
  return [
    await createTestReservationsRepo(db),
    await createTestShareTokensRepo(db),
    await createTestTripsRepo(db),
    await createTestDaysRepo(db),
    await createTestDayAssignmentsRepo(db),
    await createTestDayNotesRepo(db),
    await createTestPlacesRepo(db),
    await createTestPackingItemsRepo(db),
    await createTestBudgetItemsRepo(db),
    await createTestCategoriesRepo(db),
    await createTestCollabMessagesRepo(db),
  ];
}
