import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 76 (`db/migrations.ts`).
 *
 * Migration 69: Place region cache for sub-national Atlas regions
 */
export class Migration20200101011600_place_region_cache_for_sub_national_atlas extends Migration {
  override name = 'Migration20200101011600_place_region_cache_for_sub_national_atlas';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS place_regions (
        place_id INTEGER PRIMARY KEY REFERENCES places(id) ON DELETE CASCADE,
        country_code TEXT NOT NULL,
        region_code TEXT NOT NULL,
        region_name TEXT NOT NULL
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_place_regions_country ON place_regions(country_code)`);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_place_regions_region ON place_regions(region_code)`);
  }
}
