import { execUnlessTableMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/** [minLng, minLat, maxLng, maxLat] per territory. */
const ENCLAVE_BOXES: [number, number, number, number][] = [
  [113.83, 22.15, 114.43, 22.56], // HK
  [113.53, 22.1, 113.6, 22.21], // MO
  [12.4, 43.89, 12.52, 43.99], // SM
  [12.44, 41.9, 12.46, 41.91], // VA
  [7.4, 43.72, 7.44, 43.75], // MC
  [9.47, 47.05, 9.64, 47.27], // LI
  [-5.36, 36.11, -5.33, 36.16], // GI
  [-67.3, 17.88, -65.22, 18.53], // PR
];

/**
 * Legacy migration step 131 (`db/migrations.ts`).
 *
 * Drop stale atlas cache rows for territories that used to resolve to their
 * surrounding country (Hong Kong/Macau as China, San Marino/Vatican as Italy,
 * etc.) before their own bounding boxes existed. The next atlas stats request
 * re-resolves any place inside these boxes with the corrected country code.
 */
export class Migration20200101021100_drop_stale_atlas_cache_rows_for_territories extends Migration {
  override name = 'Migration20200101021100_drop_stale_atlas_cache_rows_for_territories';

  override async up(): Promise<void> {
    for (const [minLng, minLat, maxLng, maxLat] of ENCLAVE_BOXES) {
      await execUnlessTableMissing(
        this,
        `DELETE FROM place_regions WHERE place_id IN (
           SELECT id FROM places WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?
         )`,
        [minLat, maxLat, minLng, maxLng],
      );
    }
  }
}
