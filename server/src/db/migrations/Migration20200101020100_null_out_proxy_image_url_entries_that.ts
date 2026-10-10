import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 121 (`db/migrations.ts`).
 *
 * Migration: null out proxy image_url entries that have no backing disk cache.
 * Migrations 107 and the migration below wrote /api/maps/place-photo/<id>/bytes
 * into places.image_url without actually fetching/caching the photo bytes. The
 * photoService short-circuits on that prefix and hits /bytes directly → 404.
 * Rows with a confirmed disk cache entry in google_place_photo_meta are left alone;
 * only stale proxy URLs (never actually fetched) are cleared so the normal
 * fetch-and-cache flow can repopulate them.
 */
export class Migration20200101020100_null_out_proxy_image_url_entries_that extends Migration {
  override name = 'Migration20200101020100_null_out_proxy_image_url_entries_that';

  override up(): void {
    this.addSql(`
      UPDATE places
      SET image_url = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE image_url LIKE '/api/maps/place-photo/%/bytes'
        AND google_place_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM google_place_photo_meta
          WHERE place_id = places.google_place_id
            AND error_at IS NULL
        )
    `);
  }
}
