import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 108 (`db/migrations.ts`).
 *
 * Migration 107: Backfill expired signed Google photo URLs to stable proxy URLs.
 *
 * The legacy step was declared `raw` (run outside a transaction); it is a single
 * UPDATE with no pragma requirement, so it runs transactionally here.
 */
export class Migration20200101014800_backfill_expired_signed_google_photo_urls_to extends Migration {
  override name = 'Migration20200101014800_backfill_expired_signed_google_photo_urls_to';

  override up(): void {
    this.addSql(`
      UPDATE places
      SET image_url = '/api/maps/place-photo/' || google_place_id || '/bytes',
          updated_at = CURRENT_TIMESTAMP
      WHERE google_place_id IS NOT NULL
        AND image_url IS NOT NULL
        AND image_url != ''
        AND (
          (image_url LIKE '%googleusercontent.com%' AND image_url LIKE '%/places/%/photos/%')
          OR (image_url LIKE '%places.googleapis.com%' AND image_url LIKE '%/places/%/photos/%')
        )
    `);
  }
}
