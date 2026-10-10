import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 11 (`db/migrations.ts`).
 */
export class Migration20200101001100_trips_add_cover_image extends Migration {
  override name = 'Migration20200101001100_trips_add_cover_image';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'trips', 'cover_image', `cover_image TEXT`);
  }
}
