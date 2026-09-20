import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 169 (`db/migrations.ts`).
 *
 * Tombstones for Atlas countries the user has explicitly removed (#1490).
 * Atlas derives visited countries from trip places and transport endpoints on every
 * request, so those countries have no row to delete — "Remove" deleted from
 * visited_countries (which never had the row), the client hid it optimistically, and
 * the next getStats re-derived it. Recording the removal here lets getStats suppress
 * a derived country. Re-marking a country deletes its tombstone.
 */
export class Migration20200101024900_tombstones_for_atlas_countries_the_user_has extends Migration {
  override name = 'Migration20200101024900_tombstones_for_atlas_countries_the_user_has';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS hidden_countries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        country_code TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, country_code)
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_hidden_countries_user ON hidden_countries (user_id)`);
  }
}
