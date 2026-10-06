import type { CollabPolls } from '../entities/CollabPolls.entity';
import { type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** A bare `collab_polls` row — every scalar column of the entity, incl. the two `persist(false)` relation mirrors (`trip_id`, `user_id`). */
export interface CollabPollRow {
  id: number;
  trip_id: number;
  user_id: number;
  question: string;
  options: string;
  multiple: number | null;
  closed: number | null;
  deadline: string | null;
  created_at: string | null;
}

const _collabPollRowKeys: AssertRowKeys<CollabPollRow, CollabPolls> = true;

/** CB23's joined projection — `p.*, u.username, u.avatar`. */
export interface CollabPollJoinRow extends CollabPollRow {
  username: string;
  avatar: string | null;
}

interface CollabPollsKyselyDB {
  collab_polls: CollabPollRow;
  users: { id: number; username: string; avatar: string | null };
}

/**
 * `collab_polls` — decision polls. Kysely throughout: `trip_id`/`user_id`
 * are `persist(false)` mirrors (the `TripFilesRepository` class docstring's
 * trap), so a bare QueryBuilder `.select([...])` silently drops them.
 */
export class CollabPollsRepository extends TrekRepository<CollabPolls> {
  /** CB23 (`getPollWithVotes`'s poll half) — `SELECT p.*, u.username, u.avatar FROM collab_polls p JOIN users u ON p.user_id = u.id WHERE p.id = ?`. `id: number`: the service resolves the route's `string | number` id via `toRowId` before calling (rule 15). */
  async findWithUser(id: number): Promise<CollabPollJoinRow | undefined> {
    return await this.kysely<CollabPollsKyselyDB>()
      .selectFrom('collab_polls as p')
      .innerJoin('users as u', 'u.id', 'p.user_id')
      .selectAll('p')
      .select(['u.username', 'u.avatar'])
      .where('p.id', '=', id)
      .executeTakeFirst();
  }

  /** CB25 (`listPolls`) — `SELECT id FROM collab_polls WHERE trip_id = ? ORDER BY created_at DESC`. */
  async listIdsForTrip(trip_id: number): Promise<number[]> {
    const rows = await this.kysely<CollabPollsKyselyDB>()
      .selectFrom('collab_polls')
      .select(['id'])
      .where('trip_id', '=', trip_id)
      .orderBy('created_at', 'desc')
      .execute();
    return rows.map((r) => r.id);
  }

  /**
   * CB27/CB32/CB34 (`votePoll`/`closePoll`/`deletePoll`'s shared trip-scoping
   * guard) — `SELECT * FROM collab_polls WHERE id = ? AND trip_id = ?`, same
   * text at all three call sites.
   */
  async findInTrip(id: number, trip_id: number): Promise<CollabPollRow | undefined> {
    return await this.kysely<CollabPollsKyselyDB>()
      .selectFrom('collab_polls')
      .selectAll()
      .where('id', '=', id)
      .where('trip_id', '=', trip_id)
      .executeTakeFirst();
  }

  /** CB26 (`createPoll`) — `INSERT INTO collab_polls (trip_id, user_id, question, options, multiple, deadline) VALUES (?×6)`. Returns the new row's id. */
  async insertPoll(row: {
    trip_id: number | string;
    user_id: number;
    question: string;
    options: string;
    multiple: number;
    deadline: string | null;
  }): Promise<number> {
    return await this.insert({
      trip: row.trip_id,
      user: row.user_id,
      question: row.question,
      options: row.options,
      multiple: row.multiple,
      deadline: row.deadline,
    });
  }

  /** CB33 (`closePoll`) — `UPDATE collab_polls SET closed = 1 WHERE id = ?`. */
  async close(id: number): Promise<void> {
    await this.nativeUpdate({ id }, { closed: 1 });
  }

  /** CB35 (`deletePoll`) — `DELETE FROM collab_polls WHERE id = ?`. */
  async delete(id: number): Promise<void> {
    await this.nativeDelete({ id });
  }
}
