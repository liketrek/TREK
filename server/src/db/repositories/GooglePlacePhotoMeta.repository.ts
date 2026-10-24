import type { GooglePlacePhotoMeta } from '../entities/GooglePlacePhotoMeta.entity';
import { TrekRepository } from './_shared/trek-repository';

export class GooglePlacePhotoMetaRepository extends TrekRepository<GooglePlacePhotoMeta> {
  /**
   * `SELECT attribution FROM google_place_photo_meta WHERE place_id = ? AND
   *  error_at IS NULL` (`place-photo-cache.service.ts:76-79`, PP1). `place_id`
   * is a TEXT key — pseudo-ids like `coords:lat:lng` are legal values, not
   * only real Google place ids.
   */
  async findLive(placeId: string): Promise<{ attribution: string | null } | null> {
    const row = await this.findOne({ place_id: placeId, error_at: null }, { fields: ['attribution'] });
    return row ? { attribution: row.attribution ?? null } : null;
  }

  /**
   * `DELETE FROM google_place_photo_meta WHERE place_id = ?` — ONE method for
   * the two call sites that share this exact statement: PP2
   * (`place-photo-cache.service.ts:87`, `get`'s self-healing delete after a
   * storage-object miss) and PP7 (`:219`, `deleteEntry`, after an explicit
   * storage delete).
   */
  async deleteByPlaceId(placeId: string): Promise<void> {
    await this.nativeDelete({ place_id: placeId });
  }

  /**
   * `SELECT error_at FROM google_place_photo_meta WHERE place_id = ? AND
   *  error_at IS NOT NULL` (`place-photo-cache.service.ts:103-106`, PP3). The
   * `Date.now() - row.error_at < MISSING_TTL` comparison stays the caller's
   * (D4's defaults rule).
   */
  async findErrored(placeId: string): Promise<{ error_at: number } | null> {
    const row = await this.findOne({ place_id: placeId, error_at: { $ne: null } }, { fields: ['error_at'] });
    return row && row.error_at != null ? { error_at: row.error_at } : null;
  }

  /**
   * `INSERT OR REPLACE INTO google_place_photo_meta (place_id, attribution,
   *  fetched_at, error_at) VALUES (?, NULL, ?, ?)` (`place-photo-cache.service.ts:131-134`,
   * PP4, `markError`'s `'no-photo'` branch) — `attribution` forced `NULL` on
   * every call, both timestamps ms-epoch INTEGERs (never `currentTimestamp`,
   * which renders SQL text). `em.upsert` with `onConflictFields: ['place_id']`
   * (the table's real PK, `Migration20200101014600_…`) and `onConflictAction:
   * 'merge'` — `INSERT OR REPLACE` semantics for this single-column key.
   */
  async upsertError(placeId: string, at: number): Promise<void> {
    await this.upsert(
      { place_id: placeId, attribution: null, fetched_at: at, error_at: at },
      { onConflictFields: ['place_id'], onConflictAction: 'merge' },
    );
  }

  /**
   * `INSERT OR REPLACE INTO google_place_photo_meta (place_id, attribution,
   *  fetched_at, error_at) VALUES (?, ?, ?, NULL)` (`place-photo-cache.service.ts:161-164`,
   * PP5, `put`) — `error_at` forced `NULL` on every call, PP4's mirror image
   * on the same PK. Same `em.upsert` shape as `upsertError` above.
   */
  async upsertPhoto(placeId: string, attribution: string | null, at: number): Promise<void> {
    await this.upsert(
      { place_id: placeId, attribution, fetched_at: at, error_at: null },
      { onConflictFields: ['place_id'], onConflictAction: 'merge' },
    );
  }

  /** `SELECT place_id FROM google_place_photo_meta` (`place-photo-cache.service.ts:239`, PP8) — the nightly/boot sweep's full-table scan. */
  async listPlaceIds(): Promise<string[]> {
    const rows = await this.find({}, { fields: ['place_id'] });
    return rows.map((r) => r.place_id).filter((id): id is string => id != null);
  }
}
