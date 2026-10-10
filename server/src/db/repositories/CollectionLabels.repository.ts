import { lower, lowerParam } from '../dialect/sql-functions';
import type { CollectionLabels } from '../entities/CollectionLabels.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

/** `collection_labels` — `loadLabelsByCollection`'s (CL7) shape. */
export interface CollectionLabelRow {
  id: number;
  collection_id: number;
  name: string;
  color: string | null;
  sort_order: number | null;
}

type CollectionLabelsKyselyDB = Pick<DB, 'collection_labels'>;

/** CL20's insert table: it binds `INSERT INTO collection_labels (collection_id, name, color, sort_order)` exactly, and `id`/`created_at` are `InsertOptional` in the generated type. */
type CollectionLabelsInsertKyselyDB = Pick<DB, 'collection_labels'>;

/**
 * `collection_labels` — Plan 3h Task 1's first cut. Owns Part A's own
 * label reads/insert (CL7, `labelIdsForFile`'s CL18/CL19, `insertImportedLabel`'s
 * CL20). Task 2 extends this repository with `createLabel`/`updateLabel`/
 * `deleteLabel`/`collectionIdOfLabel`/`getLabelById` (CL71-77, beyond this
 * task's CL1-36 range).
 */
export class CollectionLabelsRepository extends TrekRepository<CollectionLabels> {
  private db_() {
    return this.kysely<CollectionLabelsKyselyDB>();
  }

  /** CL7 (`loadLabelsByCollection`) — `SELECT id, collection_id, name, color, sort_order FROM collection_labels WHERE collection_id=? ORDER BY sort_order, id`. */
  async listByCollection(collectionId: number): Promise<CollectionLabelRow[]> {
    return await this.db_()
      .selectFrom('collection_labels')
      .select(['id', 'collection_id', 'name', 'color', 'sort_order'])
      .where('collection_id', '=', collectionId)
      .orderBy('sort_order')
      .orderBy('id')
      .execute();
  }

  /** CL18 (`labelIdsForFile`) — `SELECT id, name FROM collection_labels WHERE collection_id=?`. */
  async idNameByCollection(collectionId: number): Promise<{ id: number; name: string }[]> {
    return await this.db_()
      .selectFrom('collection_labels')
      .select(['id', 'name'])
      .where('collection_id', '=', collectionId)
      .execute();
  }

  /** CL19 (`labelIdsForFile`) — `SELECT COALESCE(MAX(sort_order),-1) AS m FROM collection_labels WHERE collection_id=?`. Dup text also `createLabel` (Task 2's own call site, CL73's neighbor). */
  async maxSortOrder(collectionId: number): Promise<number> {
    const row = await this.db_()
      .selectFrom('collection_labels')
      .select((eb) => eb.fn.coalesce(eb.fn.max('sort_order'), eb.val(-1)).as('m'))
      .where('collection_id', '=', collectionId)
      .executeTakeFirstOrThrow();
    return Number(row.m);
  }

  /** CL20 (`insertImportedLabel`) — `INSERT INTO collection_labels (collection_id, name, color, sort_order) VALUES (?,?,?,?)`. Returns the new row's id. Dup text also `createLabel` (Task 2's own call site). */
  async insertLabel(row: { collection_id: number; name: string; color: string; sort_order: number }): Promise<number> {
    const inserted = await this.kysely<CollectionLabelsInsertKyselyDB>()
      .insertInto('collection_labels')
      .values(row)
      .returning('id')
      .executeTakeFirstOrThrow();
    return inserted.id;
  }

  // -------------------------------------------------------------------------
  // Plan 3h Task 2 (part B) — CL71-77, additive.
  // -------------------------------------------------------------------------

  /**
   * CL71 (`collectionIdOfLabel`) — `SELECT collection_id FROM
   * collection_labels WHERE id=?`. Kysely, not `findOne({fields:
   * ['collection_id']})` — `collection_id` is a `persist(false)` relation
   * mirror, and the program-wide "a bare `persist(false)` mirror column
   * selected via `fields:` is silently dropped" trap (3d/3e ledgers)
   * applies here exactly as it does to a bare `.select([...])`.
   */
  async collectionIdOf(labelId: number): Promise<number | undefined> {
    const row = await this.db_()
      .selectFrom('collection_labels')
      .select('collection_id')
      .where('id', '=', labelId)
      .executeTakeFirst();
    return row?.collection_id;
  }

  /** CL72 (`getLabelById`) — `SELECT id, collection_id, name, color, sort_order FROM collection_labels WHERE id=?`. Kysely, same `collection_id` mirror-column reason as {@link collectionIdOf}. */
  async findById(labelId: number): Promise<CollectionLabelRow | undefined> {
    return await this.db_()
      .selectFrom('collection_labels')
      .select(['id', 'collection_id', 'name', 'color', 'sort_order'])
      .where('id', '=', labelId)
      .executeTakeFirst();
  }

  /** CL73 (`createLabel`) — `SELECT COUNT(*) AS n FROM collection_labels WHERE collection_id=?`. */
  async countByCollection(collectionId: number): Promise<number> {
    return await this.count({ collection: collectionId });
  }

  /**
   * CL74 (`createLabel`) — `SELECT 1 FROM collection_labels WHERE
   * collection_id=? AND lower(name)=lower(?)`. Both sides folded by SQLite
   * (`lower`/`lowerParam`'s pair, program rule 18) — the legacy statement
   * lowers the bound value in SQL too, never in JS.
   */
  async nameExists(collectionId: number, name: string): Promise<boolean> {
    const platform = this.getEntityManager().getPlatform();
    const row = await this.findOne(
      { collection: collectionId, [lower(platform, 'name')]: lowerParam(platform, name) },
      { fields: ['id'] },
    );
    return !!row;
  }

  /** CL75 (`updateLabel`) — same as {@link nameExists}, plus `AND id != ?` (excludes the label being renamed). */
  async nameExistsExcluding(collectionId: number, name: string, excludeId: number): Promise<boolean> {
    const platform = this.getEntityManager().getPlatform();
    const row = await this.findOne(
      { collection: collectionId, [lower(platform, 'name')]: lowerParam(platform, name), id: { $ne: excludeId } },
      { fields: ['id'] },
    );
    return !!row;
  }

  /** CL76 (`updateLabel`) — the allow-listed dynamic `UPDATE collection_labels SET ... WHERE id=?`. No `updated_at` stamp — the table has no such column, and the legacy statement never wrote one. */
  async updateFields(
    labelId: number,
    write: Partial<{ name: string; color: string; sort_order: number }>,
  ): Promise<void> {
    if (Object.keys(write).length === 0) return;
    await this.nativeUpdate({ id: labelId }, write);
  }

  /** CL77 (`deleteLabel`) — `DELETE FROM collection_labels WHERE id=?` (CASCADE clears place assignments). */
  async deleteById(labelId: number): Promise<void> {
    await this.nativeDelete({ id: labelId });
  }
}
