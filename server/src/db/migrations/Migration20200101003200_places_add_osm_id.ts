import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 32 (`db/migrations.ts`).
 */
export class Migration20200101003200_places_add_osm_id extends Migration {
  override name = 'Migration20200101003200_places_add_osm_id';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'places', 'osm_id', `osm_id TEXT`);
  }
}
