import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 224 (`db/migrations.ts`).
 *
 * Bucket-list entries can now be ticked off (#2279). `visited_source` records
 * who decided — a hand-ticked wish and one confirmed from a recording read the
 * same on the map otherwise, and re-running a scan must not touch the first.
 */
export class Migration20200101034400_bucket_list_entries_can_now_be_ticked extends Migration {
  override name = 'Migration20200101034400_bucket_list_entries_can_now_be_ticked';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'bucket_list', 'visited_at', `visited_at TEXT`);
    await addColumnIfMissing(this, 'bucket_list', 'visited_source', `visited_source TEXT`);
  }
}
