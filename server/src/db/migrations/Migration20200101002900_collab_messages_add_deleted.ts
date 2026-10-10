import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 29 (`db/migrations.ts`).
 */
export class Migration20200101002900_collab_messages_add_deleted extends Migration {
  override name = 'Migration20200101002900_collab_messages_add_deleted';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'collab_messages', 'deleted', `deleted INTEGER DEFAULT 0`);
  }
}
