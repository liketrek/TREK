import { PackingBags } from '../../src/db/entities/PackingBags.entity';
import { PackingCategoryAssignees } from '../../src/db/entities/PackingCategoryAssignees.entity';
import { PackingItemContributors } from '../../src/db/entities/PackingItemContributors.entity';
import { PackingItems } from '../../src/db/entities/PackingItems.entity';
import { PackingTemplateCategories } from '../../src/db/entities/PackingTemplateCategories.entity';
import { PackingTemplateItems } from '../../src/db/entities/PackingTemplateItems.entity';
import { PackingTemplates } from '../../src/db/entities/PackingTemplates.entity';
import type { PackingBagsRepository } from '../../src/db/repositories/PackingBags.repository';
import type { PackingCategoryAssigneesRepository } from '../../src/db/repositories/PackingCategoryAssignees.repository';
import type { PackingItemContributorsRepository } from '../../src/db/repositories/PackingItemContributors.repository';
import type { PackingItemsRepository } from '../../src/db/repositories/PackingItems.repository';
import type { PackingTemplateCategoriesRepository } from '../../src/db/repositories/PackingTemplateCategories.repository';
import type { PackingTemplateItemsRepository } from '../../src/db/repositories/PackingTemplateItems.repository';
import type { PackingTemplatesRepository } from '../../src/db/repositories/PackingTemplates.repository';
import { sharedTestOrm } from './test-uow';

import type Database from 'better-sqlite3';

/**
 * Plan 3e Task 3 (`PackingService`) test-only repository factories, bound to
 * a suite's own better-sqlite3 handle via the SAME memoised `sharedTestOrm`
 * `test-uow.ts` exports — required so a repository built here and a
 * `UnitOfWork` built from `createTestUnitOfWork` (that file) resolve the
 * IDENTICAL context-resolving `EntityManager` (the `files-repos.ts`/
 * `collab-repos.ts` precedent this file otherwise copies verbatim: a
 * repository from a SECOND, independent ORM instance would write outside the
 * open transaction).
 *
 * A NEW file rather than an addition to `test-uow.ts`, same reasoning
 * `files-repos.ts`/`collab-repos.ts`'s own docstrings give for themselves.
 * `TripsRepository` already has its own `createTestTripsRepo` in
 * `test-uow.ts` (Plan 3c Task 0b) and is reused directly from there — only
 * the seven packing-owned repositories are new here.
 */
export function createTestPackingItemsRepo(db: Database.Database): Promise<PackingItemsRepository> {
  return sharedTestOrm(db).then((t) => t.repo(PackingItems));
}

export function createTestPackingItemContributorsRepo(
  db: Database.Database,
): Promise<PackingItemContributorsRepository> {
  return sharedTestOrm(db).then((t) => t.repo(PackingItemContributors));
}

export function createTestPackingBagsRepo(db: Database.Database): Promise<PackingBagsRepository> {
  return sharedTestOrm(db).then((t) => t.repo(PackingBags));
}

export function createTestPackingCategoryAssigneesRepo(
  db: Database.Database,
): Promise<PackingCategoryAssigneesRepository> {
  return sharedTestOrm(db).then((t) => t.repo(PackingCategoryAssignees));
}

export function createTestPackingTemplatesRepo(db: Database.Database): Promise<PackingTemplatesRepository> {
  return sharedTestOrm(db).then((t) => t.repo(PackingTemplates));
}

export function createTestPackingTemplateCategoriesRepo(
  db: Database.Database,
): Promise<PackingTemplateCategoriesRepository> {
  return sharedTestOrm(db).then((t) => t.repo(PackingTemplateCategories));
}

export function createTestPackingTemplateItemsRepo(db: Database.Database): Promise<PackingTemplateItemsRepository> {
  return sharedTestOrm(db).then((t) => t.repo(PackingTemplateItems));
}
