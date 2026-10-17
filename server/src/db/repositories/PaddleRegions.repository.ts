import {
  type PaddleRegions,
  PaddleRegionsOrigin,
  PaddleRegionsStatus,
  type TPaddleRegionsOrigin,
  type TPaddleRegionsStatus,
} from '../entities/PaddleRegions.entity';
import type { DB } from '../kysely/db';
import type { Box } from './PaddleFeatures.repository';
import { TrekRepository } from './_shared/trek-repository';

/** One region an admin chose, as stored; the boundary is still GeoJSON text. */
export interface PaddleRegionRow {
  id: string;
  name: string;
  boundary: string | null;
  min_lat: number | null;
  min_lng: number | null;
  max_lat: number | null;
  max_lng: number | null;
  status: TPaddleRegionsStatus;
  source_timestamp: string | null;
  imported_at: string | null;
  feature_count: number;
  error: string | null;
  origin: TPaddleRegionsOrigin;
}

/** `status` and `origin` narrowed to the values the columns' CHECK constraints allow. */
type RegionsDB = {
  paddle_regions: Omit<DB['paddle_regions'], 'status' | 'origin'> & {
    status: TPaddleRegionsStatus;
    origin: TPaddleRegionsOrigin;
  };
};

const COLUMNS = [
  'id',
  'name',
  'boundary',
  'min_lat',
  'min_lng',
  'max_lat',
  'max_lng',
  'status',
  'source_timestamp',
  'imported_at',
  'feature_count',
  'error',
  'origin',
] as const;

/** `paddle_regions`: the regional extracts an admin chose for paddle data (PAD-05A). */
export class PaddleRegionsRepository extends TrekRepository<PaddleRegions> {
  private db() {
    return this.kysely<RegionsDB>();
  }

  async list(): Promise<PaddleRegionRow[]> {
    return await this.db().selectFrom('paddle_regions').select(COLUMNS).orderBy('name', 'asc').execute();
  }

  /** When each region was last read, by id: what the obstacle data's version is made of, without the boundaries. */
  async readTimes(): Promise<Array<{ id: string; imported_at: string | null }>> {
    return await this.db().selectFrom('paddle_regions').select(['id', 'imported_at']).orderBy('id', 'asc').execute();
  }

  async findById(id: string): Promise<PaddleRegionRow | undefined> {
    return await this.db().selectFrom('paddle_regions').select(COLUMNS).where('id', '=', id).executeTakeFirst();
  }

  /**
   * The regions holding data whose box reaches into `box`, by name. A region
   * read again, or whose last read failed, still holds the data of the read
   * before, so it counts until it is removed.
   */
  async withDataInBox(box: Box): Promise<PaddleRegionRow[]> {
    return await this.db()
      .selectFrom('paddle_regions')
      .select(COLUMNS)
      .where('imported_at', 'is not', null)
      .where('min_lat', '<=', box.north)
      .where('max_lat', '>=', box.south)
      .where('min_lng', '<=', box.east)
      .where('max_lng', '>=', box.west)
      .orderBy('name', 'asc')
      .execute();
  }

  /** Every region whose box holds the point, whatever its state; the caller checks the boundary. */
  async aroundPoint(lat: number, lng: number): Promise<PaddleRegionRow[]> {
    return await this.db()
      .selectFrom('paddle_regions')
      .select(COLUMNS)
      .where('min_lat', '<=', lat)
      .where('max_lat', '>=', lat)
      .where('min_lng', '<=', lng)
      .where('max_lng', '>=', lng)
      .orderBy('id', 'asc')
      .execute();
  }

  /** The regions waiting for their read, oldest first: the order they are read in. */
  async queued(): Promise<Array<Pick<PaddleRegionRow, 'id'>>> {
    return await this.db()
      .selectFrom('paddle_regions')
      .select('id')
      .where('status', '=', PaddleRegionsStatus.QUEUED)
      .orderBy('created_at', 'asc')
      .execute();
  }

  /** How many regions TREK added by itself since `since` (a canonical UTC timestamp). */
  async countAddedAutomaticallySince(since: string): Promise<number> {
    const row = await this.db()
      .selectFrom('paddle_regions')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('origin', '=', PaddleRegionsOrigin.AUTO)
      .where('created_at', '>=', since)
      .executeTakeFirst();
    return Number(row?.count ?? 0);
  }

  /** The first region waiting for its read, oldest first. */
  async nextQueued(): Promise<PaddleRegionRow | undefined> {
    return await this.db()
      .selectFrom('paddle_regions')
      .select(COLUMNS)
      .where('status', '=', PaddleRegionsStatus.QUEUED)
      .orderBy('created_at', 'asc')
      .executeTakeFirst();
  }

  async insertRegion(
    row: Pick<PaddleRegionRow, 'id' | 'name' | 'boundary' | 'min_lat' | 'min_lng' | 'max_lat' | 'max_lng'>,
    origin: TPaddleRegionsOrigin = PaddleRegionsOrigin.ADMIN,
  ): Promise<void> {
    await this.db()
      .insertInto('paddle_regions')
      .values({ ...row, status: PaddleRegionsStatus.QUEUED, feature_count: 0, origin })
      .onConflict((oc) => oc.column('id').doNothing())
      .execute();
  }

  async updateRegion(
    id: string,
    patch: Partial<
      Pick<
        PaddleRegionRow,
        | 'status'
        | 'source_timestamp'
        | 'imported_at'
        | 'feature_count'
        | 'error'
        | 'min_lat'
        | 'min_lng'
        | 'max_lat'
        | 'max_lng'
      >
    >,
  ): Promise<void> {
    await this.db().updateTable('paddle_regions').set(patch).where('id', '=', id).execute();
  }

  /** Queues every region that has data or a failed read again, for the monthly refresh; returns how many. */
  async queueReady(): Promise<number> {
    const result = await this.db()
      .updateTable('paddle_regions')
      .set({ status: PaddleRegionsStatus.QUEUED, error: null })
      .where('status', 'in', [PaddleRegionsStatus.READY, PaddleRegionsStatus.FAILED])
      .executeTakeFirst();
    return Number(result.numUpdatedRows ?? 0);
  }

  /** A region left half read by a restart goes back to the queue. */
  async requeueInterrupted(): Promise<void> {
    await this.db()
      .updateTable('paddle_regions')
      .set({ status: PaddleRegionsStatus.QUEUED })
      .where('status', '=', PaddleRegionsStatus.IMPORTING)
      .execute();
  }

  async deleteRegion(id: string): Promise<boolean> {
    const result = await this.db().deleteFrom('paddle_regions').where('id', '=', id).executeTakeFirst();
    return Number(result.numDeletedRows ?? 0) > 0;
  }
}
