import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 12 (`db/migrations.ts`).
 */
export class Migration20200101001200_day_notes_add_icon extends Migration {
  override name = 'Migration20200101001200_day_notes_add_icon';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'day_notes', 'icon', `icon TEXT DEFAULT '📝'`);
  }
}
