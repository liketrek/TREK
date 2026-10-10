import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 21 (`db/migrations.ts`).
 */
export class Migration20200101002100_places_add_end_time extends Migration {
  override name = 'Migration20200101002100_places_add_end_time';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'places', 'end_time', `end_time TEXT`);
  }
}
