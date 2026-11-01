import type { StorageReleaseQueue } from '../entities/StorageReleaseQueue.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

type QueueKyselyDB = Pick<DB, 'storage_release_queue'>;

/** One object a user's change left unnamed, and when it may go. */
export interface ReleaseQueueRow {
  category: string;
  key: string;
  due_at: string;
}

/**
 * `storage_release_queue`: the objects a delete or a replace left unnamed,
 * keyed by category and category-relative key, each with the time it may go.
 * Owners only add rows; the release job reads the due ones of each category
 * it may judge (a share of its tick each), asks every reference source again
 * and drops each row once it has decided, deleted or not. A key queued again waits from the later time.
 */
export class StorageReleaseQueueRepository extends TrekRepository<StorageReleaseQueue> {
  private db() {
    return this.kysely<QueueKyselyDB>();
  }

  /** Queues these keys, due at `dueAt`; a key queued already waits until the later time. */
  async enqueue(rows: Array<{ category: string; key: string }>, dueAt: string): Promise<void> {
    if (rows.length === 0) return;
    await this.db()
      .insertInto('storage_release_queue')
      .values(rows.map((row) => ({ category: row.category, key: row.key, due_at: dueAt })))
      .onConflict((oc) => oc.columns(['category', 'key']).doUpdateSet({ due_at: dueAt }))
      .execute();
  }

  /** How many rows wait, due or not. */
  async size(): Promise<number> {
    return await this.count();
  }

  /** The categories holding a row due at `now`. */
  async dueCategories(now: string): Promise<string[]> {
    const rows = await this.db()
      .selectFrom('storage_release_queue')
      .select('category')
      .distinct()
      .where('due_at', '<=', now)
      .execute();
    return rows.map((row) => row.category);
  }

  /** The rows of one category due at `now`, the longest waiting first, at most `limit`. */
  async dueIn(category: string, now: string, limit: number): Promise<ReleaseQueueRow[]> {
    if (limit <= 0) return [];
    return await this.db()
      .selectFrom('storage_release_queue')
      .select(['category', 'key', 'due_at'])
      .where('category', '=', category)
      .where('due_at', '<=', now)
      .orderBy('due_at')
      .orderBy('key')
      .limit(limit)
      .execute();
  }

  /** Drops the rows of these keys; answers how many went. */
  async deleteKeys(category: string, keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    const result = await this.db()
      .deleteFrom('storage_release_queue')
      .where('category', '=', category)
      .where('key', 'in', keys)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  }

  /** Drops the rows due before `cutoff`: what waited that long is the nightly pass's. */
  async deleteDueBefore(cutoff: string): Promise<number> {
    const result = await this.db().deleteFrom('storage_release_queue').where('due_at', '<', cutoff).executeTakeFirst();
    return Number(result.numDeletedRows);
  }

  /** Drops every row, for a database another installation's history came with. */
  async deleteAll(): Promise<number> {
    return await this.nativeDelete({});
  }
}
