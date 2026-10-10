import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 175 (`db/migrations.ts`).
 *
 * Tombstones for Atlas regions the user has explicitly removed — the region-level
 * counterpart to hidden_countries above (#1490). A visited region is normally derived
 * fresh from place_regions/visited_regions on every request, so "removing" it has
 * nothing to delete; recording it here lets getVisitedRegions suppress a derived region
 * the same way getStats already suppresses a derived country. Unlike the country-level
 * tombstone (originally only reachable for a manually-marked or zero-count country),
 * this also covers a region derived from real place data — e.g. one that ended up on
 * the wrong side of a border-simplification gap and the user just wants gone.
 */
export class Migration20200101025500_tombstones_for_atlas_regions_the_user_has extends Migration {
  override name = 'Migration20200101025500_tombstones_for_atlas_regions_the_user_has';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS hidden_regions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        region_code TEXT NOT NULL,
        country_code TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, region_code)
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_hidden_regions_user ON hidden_regions (user_id)`);
  }
}
