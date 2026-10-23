import type { AssistantThreads } from '../entities/AssistantThreads.entity';
import type { DB } from '../kysely/db';
import type { AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** One `assistant_threads` row as stored: about a trip or about a journey, never both. */
export interface AssistantThreadRow {
  id: number;
  user_id: number;
  trip_id: number | null;
  journey_id: number | null;
  title: string;
  created_at: string;
  last_message_at: string;
}

const _assistantThreadRowKeys: AssertRowKeys<AssistantThreadRow, AssistantThreads> = true;

type ThreadsKyselyDB = Pick<DB, 'assistant_threads'>;

/** What the retention sweep reads to tell who still reaches a thread's trip or journey. */
type RetentionKyselyDB = Pick<
  DB,
  | 'assistant_threads'
  | 'trips'
  | 'trip_members'
  | 'journeys'
  | 'journey_contributors'
  | 'trip_journal_links'
  | 'trip_journal_link_members'
>;

/** The column a thread names what it is about with. */
type OwnerColumn = 'trip_id' | 'journey_id';

const COLUMNS = ['id', 'user_id', 'trip_id', 'journey_id', 'title', 'created_at', 'last_message_at'] as const;

/**
 * `assistant_threads`: a user's conversations about one trip, or (the Studio's)
 * about one journey. Every read and delete a request makes names the user and
 * the trip or journey next to the id, so a thread is only ever reached by its
 * owner on its own trip or journey.
 */
export class AssistantThreadsRepository extends TrekRepository<AssistantThreads> {
  private db() {
    return this.kysely<ThreadsKyselyDB>();
  }

  /** A new thread about a trip; answers its id. `at` is both its creation and its last message (`dbNow()`). */
  async createThread(userId: number, tripId: number, title: string, at: string): Promise<number> {
    const row = await this.db()
      .insertInto('assistant_threads')
      .values({ user_id: userId, trip_id: tripId, title, created_at: at, last_message_at: at })
      .returning('id')
      .executeTakeFirstOrThrow();
    return row.id;
  }

  /** A new thread about a journey; answers its id, as `createThread` does. */
  async createJourneyThread(userId: number, journeyId: number, title: string, at: string): Promise<number> {
    const row = await this.db()
      .insertInto('assistant_threads')
      .values({ user_id: userId, journey_id: journeyId, title, created_at: at, last_message_at: at })
      .returning('id')
      .executeTakeFirstOrThrow();
    return row.id;
  }

  async findOwned(id: number, userId: number, tripId: number): Promise<AssistantThreadRow | null> {
    return this.findOwnedBy(id, userId, 'trip_id', tripId);
  }

  async findOwnedOnJourney(id: number, userId: number, journeyId: number): Promise<AssistantThreadRow | null> {
    return this.findOwnedBy(id, userId, 'journey_id', journeyId);
  }

  /** The user's threads on a trip, the most recently used first. */
  async listRecent(userId: number, tripId: number, limit: number): Promise<AssistantThreadRow[]> {
    return this.listRecentBy(userId, 'trip_id', tripId, limit);
  }

  /** The user's threads on a journey, the most recently used first. */
  async listRecentOnJourney(userId: number, journeyId: number, limit: number): Promise<AssistantThreadRow[]> {
    return this.listRecentBy(userId, 'journey_id', journeyId, limit);
  }

  async touch(id: number, at: string): Promise<void> {
    await this.nativeUpdate({ id }, { last_message_at: at });
  }

  /** True when the thread was the user's on that trip and is gone now. */
  async deleteOwned(id: number, userId: number, tripId: number): Promise<boolean> {
    return this.deleteOwnedBy(id, userId, 'trip_id', tripId);
  }

  /** True when the thread was the user's on that journey and is gone now. */
  async deleteOwnedOnJourney(id: number, userId: number, journeyId: number): Promise<boolean> {
    return this.deleteOwnedBy(id, userId, 'journey_id', journeyId);
  }

  /** Retention: drops the threads nobody wrote in since `cutoff`; answers how many went. */
  async deleteIdleBefore(cutoff: string): Promise<number> {
    const result = await this.db()
      .deleteFrom('assistant_threads')
      .where('last_message_at', '<', cutoff)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  }

  /**
   * Drops the threads of users who no longer own or belong to the trip they
   * are about: removed members keep no conversation about a trip they left.
   * A journey thread goes once its user neither owns the journey nor is on its
   * contributor list nor is named by one of its trip links. A link member who
   * left the linking trip keeps the thread until the link drops them; every
   * request checks the access itself, so such a thread is never reached.
   */
  async deleteWithoutAccess(): Promise<number> {
    const result = await this.kysely<RetentionKyselyDB>()
      .deleteFrom('assistant_threads')
      .where((eb) =>
        eb.or([
          eb.and([
            eb('assistant_threads.trip_id', 'is not', null),
            eb.not(
              eb.exists(
                eb
                  .selectFrom('trips')
                  .select('trips.id')
                  .whereRef('trips.id', '=', 'assistant_threads.trip_id')
                  .whereRef('trips.user_id', '=', 'assistant_threads.user_id'),
              ),
            ),
            eb.not(
              eb.exists(
                eb
                  .selectFrom('trip_members')
                  .select('trip_members.id')
                  .whereRef('trip_members.trip_id', '=', 'assistant_threads.trip_id')
                  .whereRef('trip_members.user_id', '=', 'assistant_threads.user_id'),
              ),
            ),
          ]),
          eb.and([
            eb('assistant_threads.journey_id', 'is not', null),
            eb.not(
              eb.exists(
                eb
                  .selectFrom('journeys')
                  .select('journeys.id')
                  .whereRef('journeys.id', '=', 'assistant_threads.journey_id')
                  .whereRef('journeys.user_id', '=', 'assistant_threads.user_id'),
              ),
            ),
            eb.not(
              eb.exists(
                eb
                  .selectFrom('journey_contributors')
                  .select('journey_contributors.journey_id')
                  .whereRef('journey_contributors.journey_id', '=', 'assistant_threads.journey_id')
                  .whereRef('journey_contributors.user_id', '=', 'assistant_threads.user_id'),
              ),
            ),
            eb.not(
              eb.exists(
                eb
                  .selectFrom('trip_journal_links')
                  .innerJoin('trip_journal_link_members', 'trip_journal_link_members.link_id', 'trip_journal_links.id')
                  .select('trip_journal_links.id')
                  .whereRef('trip_journal_links.journey_id', '=', 'assistant_threads.journey_id')
                  .whereRef('trip_journal_link_members.user_id', '=', 'assistant_threads.user_id'),
              ),
            ),
          ]),
        ]),
      )
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  }

  private async findOwnedBy(
    id: number,
    userId: number,
    column: OwnerColumn,
    ownerId: number,
  ): Promise<AssistantThreadRow | null> {
    const row = await this.db()
      .selectFrom('assistant_threads')
      .select(COLUMNS)
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .where(column, '=', ownerId)
      .executeTakeFirst();
    return row ?? null;
  }

  private async listRecentBy(
    userId: number,
    column: OwnerColumn,
    ownerId: number,
    limit: number,
  ): Promise<AssistantThreadRow[]> {
    return this.db()
      .selectFrom('assistant_threads')
      .select(COLUMNS)
      .where('user_id', '=', userId)
      .where(column, '=', ownerId)
      .orderBy('last_message_at', 'desc')
      .orderBy('id', 'desc')
      .limit(limit)
      .execute();
  }

  private async deleteOwnedBy(id: number, userId: number, column: OwnerColumn, ownerId: number): Promise<boolean> {
    const result = await this.db()
      .deleteFrom('assistant_threads')
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .where(column, '=', ownerId)
      .executeTakeFirst();
    return Number(result.numDeletedRows) > 0;
  }
}
