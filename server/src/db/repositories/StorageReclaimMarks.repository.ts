import type { StorageReclaimMarks } from '../entities/StorageReclaimMarks.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

type MarksKyselyDB = Pick<DB, 'storage_reclaim_marks'>;

/** Since when an object has been unreferenced, as the reclaim pass first saw it. */
export interface ReclaimMarkRow {
  key: string;
  first_seen_at: string;
  size: number;
}

/**
 * `storage_reclaim_marks`: one row per stored object the reclaim pass found
 * no row naming, keyed by category and category-relative key. The pass reads a
 * category's marks once, inserts the new ones and drops the ones whose object
 * is referenced again or gone; a mark is never moved forward, so its age is how
 * long the object has been unreferenced without a break.
 */
export class StorageReclaimMarksRepository extends TrekRepository<StorageReclaimMarks> {
  private db() {
    return this.kysely<MarksKyselyDB>();
  }

  async marksOf(category: string): Promise<ReclaimMarkRow[]> {
    return this.db()
      .selectFrom('storage_reclaim_marks')
      .select(['key', 'first_seen_at', 'size'])
      .where('category', '=', category)
      .execute();
  }

  /** Marks these keys first seen at `firstSeenAt`; a key marked already keeps its first sighting. */
  async insertMissing(
    category: string,
    rows: Array<{ key: string; size: number }>,
    firstSeenAt: string,
  ): Promise<void> {
    if (rows.length === 0) return;
    await this.db()
      .insertInto('storage_reclaim_marks')
      .values(rows.map((row) => ({ category, key: row.key, size: row.size, first_seen_at: firstSeenAt })))
      .onConflict((oc) => oc.columns(['category', 'key']).doNothing())
      .execute();
  }

  /** Drops the marks of these keys; answers how many went. */
  async deleteKeys(category: string, keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    const result = await this.db()
      .deleteFrom('storage_reclaim_marks')
      .where('category', '=', category)
      .where('key', 'in', keys)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  }

  /** Drops every mark, for a database a restore brought back: its marks are another history's. */
  async deleteAll(): Promise<number> {
    return await this.nativeDelete({});
  }
}
