import { JourneyBooks } from '../../src/db/entities/JourneyBooks.entity';
import { JourneyShareTokens } from '../../src/db/entities/JourneyShareTokens.entity';
import type { JourneyBooksRepository } from '../../src/db/repositories/JourneyBooks.repository';
import type { JourneyShareTokensRepository } from '../../src/db/repositories/JourneyShareTokens.repository';
import { sharedTestOrm } from './test-uow';

import type Database from 'better-sqlite3';

/**
 * Plan 3g Task 3 (`JourneyShareService`/`JourneyBookService`) test-only
 * repository factories, bound to a suite's own better-sqlite3 handle via the
 * SAME memoised `sharedTestOrm` (`test-uow.ts`) — same precedent
 * `journey-repos.ts` (Task 1) documents for itself.
 *
 * A NEW file rather than an addition to `journey-repos.ts`: that file is
 * Task 1/2's own (`JourneysRepository`/`JourneyContributorsRepository`/
 * `JourneyTripsRepository`/`JourneyEntriesRepository`/`JourneyPhotosRepository`/
 * `JourneyEntryPhotosRepository`), concurrently in flight when this task ran
 * — this file only adds the two share/book-owned tables' factories.
 */
export function createTestJourneyShareTokensRepo(db: Database.Database): Promise<JourneyShareTokensRepository> {
  return sharedTestOrm(db).then((t) => t.repo(JourneyShareTokens));
}

export function createTestJourneyBooksRepo(db: Database.Database): Promise<JourneyBooksRepository> {
  return sharedTestOrm(db).then((t) => t.repo(JourneyBooks));
}
