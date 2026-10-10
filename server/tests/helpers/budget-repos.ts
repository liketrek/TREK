import { BudgetCategoryOrder } from '../../src/db/entities/BudgetCategoryOrder.entity';
import { BudgetItemMembers } from '../../src/db/entities/BudgetItemMembers.entity';
import { BudgetItemPayers } from '../../src/db/entities/BudgetItemPayers.entity';
import { BudgetSettlements } from '../../src/db/entities/BudgetSettlements.entity';
import type { BudgetCategoryOrderRepository } from '../../src/db/repositories/BudgetCategoryOrder.repository';
import type { BudgetItemMembersRepository } from '../../src/db/repositories/BudgetItemMembers.repository';
import type { BudgetItemPayersRepository } from '../../src/db/repositories/BudgetItemPayers.repository';
import type { BudgetItemsRepository } from '../../src/db/repositories/BudgetItems.repository';
import type { BudgetSettlementsRepository } from '../../src/db/repositories/BudgetSettlements.repository';
import type { PlacesRepository } from '../../src/db/repositories/Places.repository';
import type { ReservationsRepository } from '../../src/db/repositories/Reservations.repository';
import type { TripMembersRepository } from '../../src/db/repositories/TripMembers.repository';
import type { TripsRepository } from '../../src/db/repositories/Trips.repository';
import { createTestBudgetItemsRepo } from './files-repos';
import {
  sharedTestOrm,
  createTestReservationsRepo,
  createTestPlacesRepo,
  createTestTripsRepo,
  createTestTripMembersRepo,
} from './test-uow';

import type Database from 'better-sqlite3';

/**
 * Plan 3e Task 2 (budget) test-only repository factories, bound to a suite's
 * own better-sqlite3 handle via the SAME memoised `sharedTestOrm` `test-
 * uow.ts`'s helpers use (required so a repository built here and a
 * `UnitOfWork` built from `createTestUnitOfWork` resolve the IDENTICAL
 * context-resolving `EntityManager` — `test-uow.ts`'s own docstring).
 *
 * A NEW file, per the brief: `test-uow.ts` and `tests/helpers/files-repos.ts`
 * are other tasks' windows in this tree. `BudgetItemsRepository` already has
 * a factory in `files-repos.ts` (`createTestBudgetItemsRepo`, added by Task
 * 1 for its own `findTripId` need) — reused directly from there, not
 * duplicated here. Only the four repositories this task adds are new.
 */
export function createTestBudgetItemMembersRepo(db: Database.Database): Promise<BudgetItemMembersRepository> {
  return sharedTestOrm(db).then((t) => t.repo(BudgetItemMembers));
}

export function createTestBudgetItemPayersRepo(db: Database.Database): Promise<BudgetItemPayersRepository> {
  return sharedTestOrm(db).then((t) => t.repo(BudgetItemPayers));
}

export function createTestBudgetSettlementsRepo(db: Database.Database): Promise<BudgetSettlementsRepository> {
  return sharedTestOrm(db).then((t) => t.repo(BudgetSettlements));
}

export function createTestBudgetCategoryOrderRepo(db: Database.Database): Promise<BudgetCategoryOrderRepository> {
  return sharedTestOrm(db).then((t) => t.repo(BudgetCategoryOrder));
}

/**
 * The 9 repository arguments `BudgetService`'s constructor appends after
 * `uow` (`budgetItemsRepo`, `budgetItemMembersRepo`, `budgetItemPayersRepo`,
 * `budgetSettlementsRepo`, `budgetCategoryOrderRepo`, `reservationsRepo`,
 * `placesRepo`, `tripsRepo`, `tripMembersRepo` — Plan 4 Task 3's own,
 * appended last when `rosterUserIds` inlined off `DatabaseService`), built
 * over the SAME connection in one call — every hand-built
 * `new BudgetService(...)` test call site spreads this
 * (`...(await budgetRepoArgs(conn))`) instead of repeating all 9 factories.
 */
export async function budgetRepoArgs(
  db: Database.Database,
): Promise<
  [
    BudgetItemsRepository,
    BudgetItemMembersRepository,
    BudgetItemPayersRepository,
    BudgetSettlementsRepository,
    BudgetCategoryOrderRepository,
    ReservationsRepository,
    PlacesRepository,
    TripsRepository,
    TripMembersRepository,
  ]
> {
  return [
    await createTestBudgetItemsRepo(db),
    await createTestBudgetItemMembersRepo(db),
    await createTestBudgetItemPayersRepo(db),
    await createTestBudgetSettlementsRepo(db),
    await createTestBudgetCategoryOrderRepo(db),
    await createTestReservationsRepo(db),
    await createTestPlacesRepo(db),
    await createTestTripsRepo(db),
    await createTestTripMembersRepo(db),
  ];
}
