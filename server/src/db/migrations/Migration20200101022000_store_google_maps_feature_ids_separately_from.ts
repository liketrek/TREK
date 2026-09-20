import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 140 (`db/migrations.ts`).
 *
 * Store Google Maps feature IDs separately from real Google Places API IDs.
 */
export class Migration20200101022000_store_google_maps_feature_ids_separately_from extends Migration {
  override name = 'Migration20200101022000_store_google_maps_feature_ids_separately_from';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'places', 'google_ftid', `google_ftid TEXT`);
  }
}
