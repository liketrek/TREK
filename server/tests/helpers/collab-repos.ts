import { CollabLinks } from '../../src/db/entities/CollabLinks.entity';
import { CollabMessageReactions } from '../../src/db/entities/CollabMessageReactions.entity';
import { CollabMessages } from '../../src/db/entities/CollabMessages.entity';
import { CollabNotes } from '../../src/db/entities/CollabNotes.entity';
import { CollabPollVotes } from '../../src/db/entities/CollabPollVotes.entity';
import { CollabPolls } from '../../src/db/entities/CollabPolls.entity';
import type { CollabLinksRepository } from '../../src/db/repositories/CollabLinks.repository';
import type { CollabMessageReactionsRepository } from '../../src/db/repositories/CollabMessageReactions.repository';
import type { CollabMessagesRepository } from '../../src/db/repositories/CollabMessages.repository';
import type { CollabNotesRepository } from '../../src/db/repositories/CollabNotes.repository';
import type { CollabPollVotesRepository } from '../../src/db/repositories/CollabPollVotes.repository';
import type { CollabPollsRepository } from '../../src/db/repositories/CollabPolls.repository';
import { sharedTestOrm } from './test-uow';

import type Database from 'better-sqlite3';

/**
 * Plan 3e Task 5 (`CollabService`) test-only repository factories, bound to a
 * suite's own better-sqlite3 handle via the SAME memoised `sharedTestOrm`
 * `test-uow.ts` exports — required so a repository built here and a
 * `UnitOfWork` built from `createTestUnitOfWork` (that file) resolve the
 * IDENTICAL context-resolving `EntityManager` (the `files-repos.ts` precedent
 * this file otherwise copies verbatim: a repository from a SECOND, independent
 * ORM instance would write outside the open transaction).
 *
 * A NEW file rather than an addition to `test-uow.ts`, same reasoning
 * `files-repos.ts`'s own docstring gives for itself: at the time this task
 * ran, `test-uow.ts` had just been Task 6's named file in the prior window,
 * and appending here avoids any risk of colliding with a concurrently
 * in-flight task's edits to that file. `TripsRepository` already has its own
 * `createTestTripsRepo` in `test-uow.ts` (Plan 3c Task 0b) and is reused
 * directly from there — only the six collab-owned repositories are new here.
 */
export function createTestCollabNotesRepo(db: Database.Database): Promise<CollabNotesRepository> {
  return sharedTestOrm(db).then((t) => t.repo(CollabNotes));
}

export function createTestCollabMessageReactionsRepo(db: Database.Database): Promise<CollabMessageReactionsRepository> {
  return sharedTestOrm(db).then((t) => t.repo(CollabMessageReactions));
}

export function createTestCollabPollsRepo(db: Database.Database): Promise<CollabPollsRepository> {
  return sharedTestOrm(db).then((t) => t.repo(CollabPolls));
}

export function createTestCollabPollVotesRepo(db: Database.Database): Promise<CollabPollVotesRepository> {
  return sharedTestOrm(db).then((t) => t.repo(CollabPollVotes));
}

export function createTestCollabLinksRepo(db: Database.Database): Promise<CollabLinksRepository> {
  return sharedTestOrm(db).then((t) => t.repo(CollabLinks));
}

export function createTestCollabMessagesRepo(db: Database.Database): Promise<CollabMessagesRepository> {
  return sharedTestOrm(db).then((t) => t.repo(CollabMessages));
}
