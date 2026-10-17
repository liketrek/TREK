import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 221 (`db/migrations.ts`).
 *
 * Amap (高德) as a keyed places provider.
 *
 * `users.amap_api_key` has the same shape and role as maps_api_key: encrypted
 * with apiKeyCrypto, and the last step of the resolver after the operator env
 * var and the instance-wide app_settings row. Nullable with no default, because
 * "this install does not use Amap" is the correct state for almost everybody.
 * Nothing is backfilled: a Google key is not an Amap key, and the two are chosen
 * by the places_provider setting, not by which column happens to be populated.
 *
 * `places.amap_poi_id` is the provider id a place was found by, beside
 * google_place_id and osm_id. Amap ids are bare strings shaped like Google ones,
 * so the column holds them with the `amap:` prefix the maps domain uses
 * everywhere, and a place keeps opening against Amap after the admin switches
 * provider.
 */
export class Migration20200101034100_amap extends Migration {
  override name = 'Migration20200101034100_amap';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'users', 'amap_api_key', `amap_api_key TEXT`);
    await addColumnIfMissing(this, 'places', 'amap_poi_id', `amap_poi_id TEXT`);
  }
}
