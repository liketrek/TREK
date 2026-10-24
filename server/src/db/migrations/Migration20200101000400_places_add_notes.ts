import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 4 (`db/migrations.ts`).
 */
export class Migration20200101000400_places_add_notes extends Migration {
  override name = 'Migration20200101000400_places_add_notes';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'places', 'notes', `notes TEXT`);
  }
}
