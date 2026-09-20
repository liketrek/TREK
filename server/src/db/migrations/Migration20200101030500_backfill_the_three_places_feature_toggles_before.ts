import { Migration } from '@mikro-orm/migrations';

const PLACES_TOGGLES = ['places_photos_enabled', 'places_autocomplete_enabled', 'places_details_enabled'];

/**
 * Legacy migration step 185 (`db/migrations.ts`).
 *
 * Backfill the three places feature toggles before their read flips from
 * fail-open (`value !== 'false'`) to fail-closed (`value === 'true'`), so
 * existing installs that never touched the admin switches keep the features they
 * have today. A row that already says 'false' is left alone.
 */
export class Migration20200101030500_backfill_the_three_places_feature_toggles_before extends Migration {
  override name = 'Migration20200101030500_backfill_the_three_places_feature_toggles_before';

  override up(): void {
    for (const key of PLACES_TOGGLES) {
      this.addSql(`INSERT OR IGNORE INTO app_settings (key, value) VALUES ('${key}', 'true')`);
    }
  }
}
