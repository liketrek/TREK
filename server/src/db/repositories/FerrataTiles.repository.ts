import type { FerrataTiles } from '../entities/FerrataTiles.entity';
import { TrekRepository } from './_shared/trek-repository';

export interface FerrataTileRow {
  tile_key: string;
  payload: string;
  /** When Overpass answered for the cell, as an epoch in seconds. */
  fetched_at: number;
}

export class FerrataTilesRepository extends TrekRepository<FerrataTiles> {
  /** The stored cells among `keys`, in no particular order; a key never stored is simply absent. */
  async findByKeys(keys: readonly string[]): Promise<FerrataTileRow[]> {
    if (keys.length === 0) return [];
    const rows = await this.find({ tile_key: { $in: [...keys] } }, { fields: ['tile_key', 'payload', 'fetched_at'] });
    return rows.map((row) => ({ tile_key: row.tile_key, payload: row.payload, fetched_at: row.fetched_at }));
  }

  /**
   * Writes every cell, replacing the payload and fetch time of one already
   * stored. The caller wraps it in a transaction, so a batch lands whole.
   */
  async upsertTiles(rows: readonly FerrataTileRow[]): Promise<void> {
    if (rows.length === 0) return;
    await this.upsertMany(
      rows.map((row) => ({ ...row })),
      { onConflictFields: ['tile_key'], onConflictAction: 'merge' },
    );
  }
}
