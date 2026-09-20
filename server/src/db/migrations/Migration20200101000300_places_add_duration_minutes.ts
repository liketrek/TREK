import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 3 (`db/migrations.ts`).
 */
export class Migration20200101000300_places_add_duration_minutes extends Migration {
  override name = 'Migration20200101000300_places_add_duration_minutes';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'places', 'duration_minutes', `duration_minutes INTEGER DEFAULT 60`);
  }
}
