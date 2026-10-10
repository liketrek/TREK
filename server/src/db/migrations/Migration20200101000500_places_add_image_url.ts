import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 5 (`db/migrations.ts`).
 */
export class Migration20200101000500_places_add_image_url extends Migration {
  override name = 'Migration20200101000500_places_add_image_url';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'places', 'image_url', `image_url TEXT`);
  }
}
