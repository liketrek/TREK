import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 122 (`db/migrations.ts`).
 *
 * Migration: clear legacy Google photo URLs missed by Migration 107.
 * Migration 107 matched /places/%/photos/% only; lh3.googleusercontent.com URLs use
 * /place-photos/ or /places/<opaque-id> paths and were skipped. NULL those stale URLs
 * so the normal fetch-and-cache flow repopulates image_url with a real proxy URL.
 */
export class Migration20200101020200_clear_legacy_google_photo_urls_missed_by extends Migration {
  override name = 'Migration20200101020200_clear_legacy_google_photo_urls_missed_by';

  override up(): void {
    this.addSql(`
      UPDATE places
      SET image_url   = NULL,
          updated_at  = CURRENT_TIMESTAMP
      WHERE image_url IS NOT NULL
        AND image_url != ''
        AND image_url NOT LIKE '/api/maps/place-photo/%'
        AND (
              image_url LIKE 'http://%googleusercontent.com/%'
           OR image_url LIKE 'https://%googleusercontent.com/%'
           OR image_url LIKE 'http://%places.googleapis.com/%'
           OR image_url LIKE 'https://%places.googleapis.com/%'
        )
    `);
  }
}
