import type { TrekPhoto } from '../../types';
import type { TrekPhotos } from '../entities/TrekPhotos.entity';
import { coalesceParam } from '../dialect/sql-functions';
import { toRow, type AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/**
 * `SELECT * FROM trek_photos WHERE id = ?`'s row (PH6/MA4 — the same
 * statement text, one method serving both `TrekPhotoRegistrationService
 * .resolve` and `MemoriesAccessService.canAccessTrekPhoto`'s entry read).
 * Reuses the pre-existing `TrekPhoto` type from `../../types` (the row shape
 * every consumer already imports) rather than a second, parallel row
 * interface — its key set matches the entity's scalar columns exactly
 * (`owner` is the hidden relation, `owner_id` its persist(false) twin).
 */
const _trekPhotoRowKeys: AssertRowKeys<TrekPhoto, TrekPhotos> = true;

export class TrekPhotosRepository extends TrekRepository<TrekPhotos> {
  /** PH1's SELECT half — `getOrCreate`'s existing-row lookup. */
  async findByProviderAsset(provider: string, asset_id: string, owner_id: number): Promise<{ id: number } | null> {
    const row = await this.findOne({ provider, asset_id, owner: owner_id }, { fields: ['id'] });
    return row ? { id: row.id } : null;
  }

  /** PH2 — conditional passphrase re-encrypt on an already-registered remote photo. */
  async setPassphrase(id: number, passphrase: string): Promise<void> {
    await this.nativeUpdate({ id }, { passphrase });
  }

  /** PH3 — `INSERT INTO trek_photos (provider, asset_id, owner_id, passphrase, media_type)`. */
  async insertRemote(data: {
    provider: string;
    asset_id: string;
    owner_id: number;
    passphrase: string | null;
    media_type: string;
  }): Promise<number> {
    return await this.insert({
      provider: data.provider,
      asset_id: data.asset_id,
      owner: data.owner_id,
      passphrase: data.passphrase,
      media_type: data.media_type,
    });
  }

  /** PH4's SELECT half — `getOrCreateLocal`'s existing-row lookup. */
  async findLocalByPath(file_path: string): Promise<{ id: number } | null> {
    const row = await this.findOne({ provider: 'local', file_path }, { fields: ['id'] });
    return row ? { id: row.id } : null;
  }

  /** PH5 — `INSERT INTO trek_photos (provider, file_path, thumbnail_path, width, height, media_type, duration_ms)`, always `provider = 'local'`. */
  async insertLocal(data: {
    file_path: string;
    thumbnail_path: string | null;
    width: number | null;
    height: number | null;
    media_type: string;
    duration_ms: number | null;
  }): Promise<number> {
    return await this.insert({
      provider: 'local',
      file_path: data.file_path,
      thumbnail_path: data.thumbnail_path,
      width: data.width,
      height: data.height,
      media_type: data.media_type,
      duration_ms: data.duration_ms,
    });
  }

  /**
   * PH6 (`TrekPhotoRegistrationService.resolve`) / MA4 (`MemoriesAccessService
   * .canAccessTrekPhoto`'s entry read) — byte-identical `SELECT * FROM
   * trek_photos WHERE id = ?`, one method for both call sites (D4).
   */
  async findById(id: number): Promise<TrekPhoto | null> {
    const row = await this.findOne({ id });
    return row ? (toRow(row) as TrekPhoto) : null;
  }

  /** PH7 — retarget a local photo onto a provider once it has been uploaded there. */
  async retarget(id: number, provider: string, asset_id: string, owner_id: number): Promise<void> {
    await this.nativeUpdate({ id }, { provider, asset_id, owner: owner_id });
  }

  /**
   * PH8 — stamp a generated local thumbnail. `COALESCE(width, ?)`/
   * `COALESCE(height, ?)` keep dimensions a re-generated thumbnail already
   * knew (the caller-side guard for "don't blank what's known" stays on the
   * service, same as legacy).
   */
  async patchThumbnail(id: number, thumbnail_path: string, width: number, height: number): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate({ id }, {
      thumbnail_path,
      width: coalesceParam(platform, 'width', width),
      height: coalesceParam(platform, 'height', height),
    });
  }

  /**
   * PH9 — `COALESCE`d capture metadata write. The service computes the final
   * `taken_at`/`lat`/`lng` (the all-empty early return, the pair-or-neither
   * coordinate guard) before calling this.
   *
   * Legacy SQL (#1587):
   * `UPDATE trek_photos SET taken_at = COALESCE(taken_at, ?), lat = COALESCE(lat, ?), lng = COALESCE(lng, ?)
   *   WHERE id = ? AND ((taken_at IS NULL AND ? IS NOT NULL) OR (lat IS NULL AND ? IS NOT NULL) OR (lng IS NULL AND ? IS NOT NULL))`.
   *
   * Answers whether the row learned anything. The guard is what makes that
   * answer mean something: SQLite counts a matched row as changed even when
   * every COALESCE kept the old value, and the caller broadcasts a journey
   * refresh on it. The `? IS NOT NULL` halves are known here, so the guard is
   * built as an `$or` over just the columns that bring a value; with none of
   * them there is nothing to learn and no statement is issued.
   */
  async patchCaptureMetadata(id: number, taken_at: string | null, lat: number | null, lng: number | null): Promise<boolean> {
    const learns: Array<{ taken_at: null } | { lat: null } | { lng: null }> = [];
    if (taken_at != null) learns.push({ taken_at: null });
    if (lat != null) learns.push({ lat: null });
    if (lng != null) learns.push({ lng: null });
    if (learns.length === 0) return false;
    const platform = this.getEntityManager().getPlatform();
    const changed = await this.nativeUpdate({ id, $or: learns }, {
      taken_at: coalesceParam(platform, 'taken_at', taken_at),
      lat: coalesceParam(platform, 'lat', lat),
      lng: coalesceParam(platform, 'lng', lng),
    });
    return changed > 0;
  }

  /** PH11 — `DELETE FROM trek_photos WHERE id = ? AND provider != 'local'`; local photos are never auto-reclaimed here. */
  async deleteNonLocal(id: number): Promise<number> {
    return await this.nativeDelete({ id, provider: { $ne: 'local' } });
  }

  /**
   * TH1 — `SELECT file_path FROM trek_photos WHERE file_path LIKE 'journey/%'`.
   * The caller (`ThumbnailService.sweepOrphanThumbs`) always passes the
   * literal `'journey/'` prefix; `$like` binds the wildcard-appended value as
   * a genuine parameter (no dialect helper needed — a plain `LIKE` with a
   * hardcoded prefix, no injection surface). Rows with a NULL `file_path`
   * never match `LIKE`, so every returned value is a real string.
   */
  async listByFilePathPrefix(prefix: string): Promise<string[]> {
    const rows = await this.find({ file_path: { $like: `${prefix}%` } }, { fields: ['file_path'] });
    return rows.map((row) => row.file_path).filter((path): path is string => path != null);
  }

  /** TH2 — `SELECT thumbnail_path FROM trek_photos WHERE thumbnail_path LIKE 'journey/thumbs/%'`, same shape as TH1 on the sibling column. */
  async listByThumbnailPathPrefix(prefix: string): Promise<string[]> {
    const rows = await this.find({ thumbnail_path: { $like: `${prefix}%` } }, { fields: ['thumbnail_path'] });
    return rows.map((row) => row.thumbnail_path).filter((path): path is string => path != null);
  }
}
