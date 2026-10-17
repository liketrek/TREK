import type { PaddleFeatures } from '../entities/PaddleFeatures.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

/** One stored paddle object, its geometry and tags still JSON text. */
export interface PaddleFeatureRow {
  region_id: string;
  osm_ref: string;
  kind: string;
  group_key: string | null;
  name: string | null;
  geometry: string;
  tags: string;
  tag_hash: string;
  min_lat: number;
  min_lng: number;
  max_lat: number;
  max_lng: number;
}

/** The columns a stored object is read with. */
const FEATURE_COLUMNS = [
  'region_id',
  'osm_ref',
  'kind',
  'group_key',
  'name',
  'geometry',
  'tags',
  'tag_hash',
  'min_lat',
  'min_lng',
  'max_lat',
  'max_lng',
] as const;

/** A box in degrees, south to north and west to east. */
export interface Box {
  south: number;
  west: number;
  north: number;
  east: number;
}

/** Rows written per statement, kept well under SQLite's bound-parameter limit. */
const INSERT_CHUNK = 200;

/**
 * `paddle_features`: the paddle objects TREK read out of a region's extract
 * (PAD-05A). A region's rows are only ever replaced whole, inside the
 * transaction the import holds, so a reader never sees half a region.
 */
export class PaddleFeaturesRepository extends TrekRepository<PaddleFeatures> {
  private db() {
    return this.kysely<Pick<DB, 'paddle_features'>>();
  }

  /** The objects whose box reaches into `box`, at most `limit` of them, in a stable order. */
  async findInBox(box: Box, limit: number): Promise<PaddleFeatureRow[]> {
    return await this.db()
      .selectFrom('paddle_features')
      .select(FEATURE_COLUMNS)
      .where('min_lat', '<=', box.north)
      .where('max_lat', '>=', box.south)
      .where('min_lng', '<=', box.east)
      .where('max_lng', '>=', box.west)
      .orderBy('id', 'asc')
      .limit(limit)
      .execute();
  }

  /** The parts of the given locks whose box reaches into `box`, at most `limit` of them, in a stable order. */
  async findGroupParts(keys: readonly string[], box: Box, limit: number): Promise<PaddleFeatureRow[]> {
    return await this.db()
      .selectFrom('paddle_features')
      .select(FEATURE_COLUMNS)
      .where('group_key', 'in', [...keys])
      .where('min_lat', '<=', box.north)
      .where('max_lat', '>=', box.south)
      .where('min_lng', '<=', box.east)
      .where('max_lng', '>=', box.west)
      .orderBy('id', 'asc')
      .limit(limit)
      .execute();
  }

  /** How many objects TREK holds and the newest row's id: together they change whenever a read lands. */
  async stats(): Promise<{ count: number; max_id: number | null }> {
    const row = await this.db()
      .selectFrom('paddle_features')
      .select((eb) => [eb.fn.countAll<number>().as('count'), eb.fn.max('id').as('max_id')])
      .executeTakeFirst();
    return {
      count: Number(row?.count ?? 0),
      max_id: row?.max_id === null || row?.max_id === undefined ? null : Number(row.max_id),
    };
  }

  /** Drops a region's objects and writes the new read in their place; the caller holds the transaction. */
  async replaceRegion(regionId: string, rows: readonly PaddleFeatureRow[]): Promise<void> {
    await this.db().deleteFrom('paddle_features').where('region_id', '=', regionId).execute();
    await this.insertFrom(regionId, rows, 0);
  }

  /** The rows from `start` on, a chunk per statement, one after another on the transaction's connection. */
  private async insertFrom(regionId: string, rows: readonly PaddleFeatureRow[], start: number): Promise<void> {
    if (start >= rows.length) return;
    await this.db()
      .insertInto('paddle_features')
      .values(rows.slice(start, start + INSERT_CHUNK).map((row) => ({ ...row, region_id: regionId })))
      .onConflict((oc) => oc.columns(['region_id', 'osm_ref']).doNothing())
      .execute();
    await this.insertFrom(regionId, rows, start + INSERT_CHUNK);
  }
}
