import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 6 (`db/migrations.ts`).
 */
export class Migration20200101000600_places_add_transport_mode extends Migration {
  override name = 'Migration20200101000600_places_add_transport_mode';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'places', 'transport_mode', `transport_mode TEXT DEFAULT 'walking'`);
  }
}
