import { DawarichConnections } from '../../src/db/entities/DawarichConnections.entity';
import { DawarichVisitSuggestions } from '../../src/db/entities/DawarichVisitSuggestions.entity';
import type { DawarichConnectionsRepository } from '../../src/db/repositories/DawarichConnections.repository';
import type { DawarichVisitSuggestionsRepository } from '../../src/db/repositories/DawarichVisitSuggestions.repository';
import { sharedTestOrm } from './test-uow';

import type Database from 'better-sqlite3';

/**
 * Plan 3h Task 3 (dawarich connection/credentials, sync/reconcile, review
 * flow) — the two repositories this domain's own tables need, for a
 * hand-constructed `DawarichService`/`DawarichSuggestionsService`/
 * `DawarichSyncService`. Same memoisation-per-handle pattern every helper in
 * `test-uow.ts` uses: one ORM per test file's better-sqlite3 handle, shared
 * with whatever `UnitOfWork`/other repository that same file also builds —
 * `sharedTestOrm` (not a second `createTestOrm` call) is what keeps a
 * repository built here and a `UnitOfWork` built via `createTestUnitOfWork`
 * resolving the SAME context-forking `EntityManager`, so a write inside
 * `uow.transactional(...)` through either one is actually inside the open
 * transaction.
 */
const connectionsPerHandle = new WeakMap<Database.Database, Promise<DawarichConnectionsRepository>>();
const suggestionsPerHandle = new WeakMap<Database.Database, Promise<DawarichVisitSuggestionsRepository>>();

/** The `DawarichConnectionsRepository` a hand-constructed `DawarichService`/`DawarichSyncService` needs. */
export function createTestDawarichConnectionsRepo(db: Database.Database): Promise<DawarichConnectionsRepository> {
  const existing = connectionsPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(DawarichConnections));
  connectionsPerHandle.set(db, pending);
  return pending;
}

/** The `DawarichVisitSuggestionsRepository` a hand-constructed `DawarichSuggestionsService`/`DawarichSyncService` needs. */
export function createTestDawarichVisitSuggestionsRepo(
  db: Database.Database,
): Promise<DawarichVisitSuggestionsRepository> {
  const existing = suggestionsPerHandle.get(db);
  if (existing !== undefined) return existing;
  const pending = sharedTestOrm(db).then((t) => t.repo(DawarichVisitSuggestions));
  suggestionsPerHandle.set(db, pending);
  return pending;
}
