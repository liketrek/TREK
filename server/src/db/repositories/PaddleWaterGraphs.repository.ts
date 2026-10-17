import type { PaddleWaterGraphs } from '../entities/PaddleWaterGraphs.entity';
import type { DB } from '../kysely/db';
import type { DbTimestamp } from '../types';
import { TrekRepository } from './_shared/trek-repository';

/** A region's water network as stored: where its file is, what it holds (`stats` still JSON text), the box it covers. */
export interface PaddleWaterGraphRow {
  region_id: string;
  file: string;
  rev: string;
  bytes: number;
  built_at: string;
  stats: string;
  min_lat: number;
  min_lng: number;
  max_lat: number;
  max_lng: number;
}

const COLUMNS = [
  'region_id',
  'file',
  'rev',
  'bytes',
  'built_at',
  'stats',
  'min_lat',
  'min_lng',
  'max_lat',
  'max_lng',
] as const;

/** `paddle_water_graphs`: the water network each paddle region built for routing (PAD-11). */
export class PaddleWaterGraphsRepository extends TrekRepository<PaddleWaterGraphs> {
  private db() {
    return this.kysely<Pick<DB, 'paddle_water_graphs'>>();
  }

  async list(): Promise<PaddleWaterGraphRow[]> {
    return await this.db().selectFrom('paddle_water_graphs').select(COLUMNS).orderBy('region_id', 'asc').execute();
  }

  async findByRegion(regionId: string): Promise<PaddleWaterGraphRow | undefined> {
    return await this.db()
      .selectFrom('paddle_water_graphs')
      .select(COLUMNS)
      .where('region_id', '=', regionId)
      .executeTakeFirst();
  }

  /** The networks whose box holds the point, smallest box first: the most local data plans the leg. */
  async coveringPoint(lat: number, lng: number): Promise<PaddleWaterGraphRow[]> {
    const rows = await this.db()
      .selectFrom('paddle_water_graphs')
      .select(COLUMNS)
      .where('min_lat', '<=', lat)
      .where('max_lat', '>=', lat)
      .where('min_lng', '<=', lng)
      .where('max_lng', '>=', lng)
      .orderBy('region_id', 'asc')
      .execute();
    const area = (row: PaddleWaterGraphRow) => (row.max_lat - row.min_lat) * (row.max_lng - row.min_lng);
    return rows.sort((a, b) => area(a) - area(b));
  }

  /** Records a region's new network, replacing the one it had. */
  async saveGraph(row: Omit<PaddleWaterGraphRow, 'built_at'> & { built_at: DbTimestamp }): Promise<void> {
    await this.db()
      .insertInto('paddle_water_graphs')
      .values(row)
      .onConflict((oc) =>
        oc.column('region_id').doUpdateSet({
          file: row.file,
          rev: row.rev,
          bytes: row.bytes,
          built_at: row.built_at,
          stats: row.stats,
          min_lat: row.min_lat,
          min_lng: row.min_lng,
          max_lat: row.max_lat,
          max_lng: row.max_lng,
        }),
      )
      .execute();
  }
}
