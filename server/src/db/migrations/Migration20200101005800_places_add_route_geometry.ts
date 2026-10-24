import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 58 (`db/migrations.ts`).
 */
export class Migration20200101005800_places_add_route_geometry extends Migration {
  override name = 'Migration20200101005800_places_add_route_geometry';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'places', 'route_geometry', `route_geometry TEXT`);
  }
}
