import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 107 (`db/migrations.ts`).
 *
 * Migration 106: Persistent Place Details row cache
 */
export class Migration20200101014700_persistent_place_details_row_cache extends Migration {
  override name = 'Migration20200101014700_persistent_place_details_row_cache';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS place_details_cache (
        place_id   TEXT    NOT NULL,
        lang       TEXT    NOT NULL DEFAULT '',
        expanded   INTEGER NOT NULL DEFAULT 0,
        payload_json TEXT  NOT NULL,
        fetched_at INTEGER NOT NULL,
        PRIMARY KEY (place_id, lang, expanded)
      )
    `);
  }
}
