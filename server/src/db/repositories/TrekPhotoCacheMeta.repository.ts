import type { TrekPhotoCacheMeta } from '../entities/TrekPhotoCacheMeta.entity';
import { TrekRepository } from './_shared/trek-repository';

/** TC1's row — `content_type`/`fetched_at`, the two columns `getFresh` needs. */
export interface TrekPhotoCacheFreshness {
  content_type: string;
  fetched_at: number;
}

export class TrekPhotoCacheMetaRepository extends TrekRepository<TrekPhotoCacheMeta> {
  /** TC1 — `SELECT content_type, fetched_at FROM trek_photo_cache_meta WHERE cache_key = ?`. */
  async findFreshness(cache_key: string): Promise<TrekPhotoCacheFreshness | null> {
    const row = await this.findOne({ cache_key }, { fields: ['content_type', 'fetched_at'] });
    return row ? { content_type: row.content_type, fetched_at: row.fetched_at } : null;
  }

  /**
   * TC2/TC3/TC6 — `DELETE FROM trek_photo_cache_meta WHERE cache_key = ?`,
   * the same statement text at three call sites (the TTL-expired branch, the
   * object-missing branch, and `sweepExpired`'s stale pass) — one method (D4).
   */
  async deleteByCacheKey(cache_key: string): Promise<number> {
    return await this.nativeDelete({ cache_key });
  }

  /**
   * TC4 (`put`) — `INSERT OR REPLACE INTO trek_photo_cache_meta (cache_key,
   * content_type, fetched_at) VALUES (?, ?, ?)`. `cache_key` is the table's
   * only unique/primary column (`NOT NULL` since Plan 4 Task 8a's
   * cache_key-tightening migration — R5's Task 0 finding was that every
   * writer already bound a non-null value, so this was a schema tightening,
   * not a behaviour change), so it is the sole conflict target, same upsert
   * shape as `AppSettingsRepository.setValue`.
   */
  async upsertMeta(cache_key: string, content_type: string, fetched_at: number): Promise<void> {
    await this.upsert(
      { cache_key, content_type, fetched_at },
      { onConflictFields: ['cache_key'], onConflictAction: 'merge' },
    );
  }

  /** TC5 — `SELECT cache_key FROM trek_photo_cache_meta WHERE fetched_at < ?`, `sweepExpired`'s stale-row pass. */
  async listStale(cutoff: number): Promise<string[]> {
    const rows = await this.find({ fetched_at: { $lt: cutoff } }, { fields: ['cache_key'] });
    return rows.map((row) => row.cache_key).filter((key): key is string => key != null);
  }

  /** TC7 — `SELECT 1 FROM trek_photo_cache_meta WHERE cache_key = ?`, `sweepExpired`'s pass-2 row-less-object guard. */
  async existsByCacheKey(cache_key: string): Promise<boolean> {
    const row = await this.findOne({ cache_key }, { fields: ['cache_key'] });
    return !!row;
  }
}
