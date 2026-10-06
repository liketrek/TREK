import { TodoCategoryAssignees } from '../../src/db/entities/TodoCategoryAssignees.entity';
import { TodoItems } from '../../src/db/entities/TodoItems.entity';
import type { TodoCategoryAssigneesRepository } from '../../src/db/repositories/TodoCategoryAssignees.repository';
import type { TodoItemsRepository } from '../../src/db/repositories/TodoItems.repository';
import { sharedTestOrm } from './test-uow';

import type Database from 'better-sqlite3';

/**
 * Plan 3e Task 4 (`TodoService`) test-only repository factories, bound to a
 * suite's own better-sqlite3 handle via the SAME memoised `sharedTestOrm`
 * `test-uow.ts` exports — required so a repository built here and a
 * `UnitOfWork` built from `createTestUnitOfWork` (that file) resolve the
 * IDENTICAL context-resolving `EntityManager` (the `files-repos.ts`/
 * `collab-repos.ts` precedent this file otherwise copies verbatim: a
 * repository from a SECOND, independent ORM instance would write outside the
 * open transaction).
 *
 * A NEW file rather than an addition to `test-uow.ts`, same reasoning those
 * two files give for themselves: avoids colliding with a concurrently
 * in-flight task's edits to that shared file.
 */
export function createTestTodoItemsRepo(db: Database.Database): Promise<TodoItemsRepository> {
  return sharedTestOrm(db).then((t) => t.repo(TodoItems));
}

export function createTestTodoCategoryAssigneesRepo(db: Database.Database): Promise<TodoCategoryAssigneesRepository> {
  return sharedTestOrm(db).then((t) => t.repo(TodoCategoryAssignees));
}
