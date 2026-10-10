import type { PlaceDetailsCache } from '../entities/PlaceDetailsCache.entity';
import { TrekRepository } from './_shared/trek-repository';

export class PlaceDetailsCacheRepository extends TrekRepository<PlaceDetailsCache> {
  /**
   * `SELECT payload_json, fetched_at FROM place_details_cache WHERE place_id = ?
   *  AND lang = ? AND expanded = ?` (`place-enrichment.service.ts:810-815`,
   * PE2). The caller passes `lang ?? ''` (D4's defaults rule — the column is
   * `NOT NULL DEFAULT ''`, never NULL) and `expanded` bound to the
   * `CACHE_KIND` constant.
   */
  async findEntry(
    placeId: string,
    lang: string,
    kind: number,
  ): Promise<{ payload_json: string; fetched_at: number } | null> {
    const row = await this.findOne(
      { place_id: placeId, lang, expanded: kind },
      { fields: ['payload_json', 'fetched_at'] },
    );
    return row ? { payload_json: row.payload_json, fetched_at: row.fetched_at } : null;
  }

  /**
   * `INSERT OR REPLACE INTO place_details_cache (place_id, lang, expanded,
   *  payload_json, fetched_at) VALUES (?, ?, ?, ?, ?)`
   * (`place-enrichment.service.ts:847-854`, PE3). `em.upsert` with
   * `onConflictFields: ['place_id', 'lang', 'expanded']` — the table's real
   * composite PRIMARY KEY (`Migration20200101014700_…`,
   * `PRIMARY KEY (place_id, lang, expanded)`), not just `place_id`: naming
   * only the single column here would let `em.upsert` infer the wrong
   * conflict target and silently insert duplicate rows for two different
   * `lang`/`expanded` values on the same place. `fetched_at` is ms-epoch,
   * never `currentTimestamp`.
   */
  async upsertEntry(row: {
    place_id: string;
    lang: string;
    expanded: number;
    payload_json: string;
    fetched_at: number;
  }): Promise<void> {
    await this.upsert(row, { onConflictFields: ['place_id', 'lang', 'expanded'], onConflictAction: 'merge' });
  }
}
