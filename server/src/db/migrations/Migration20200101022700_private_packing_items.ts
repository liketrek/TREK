import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 147 (`db/migrations.ts`).
 *
 * Private packing items (#858): an item can be hidden from other trip members.
 * `is_private` toggles the visibility; `owner_id` records who it belongs to so
 * the listing can show it only to them. `owner_id` is NULL on legacy rows
 * (shared).
 */
export class Migration20200101022700_private_packing_items extends Migration {
  override name = 'Migration20200101022700_private_packing_items';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'packing_items', 'is_private', `is_private INTEGER NOT NULL DEFAULT 0`);
    await addColumnIfMissing(
      this,
      'packing_items',
      'owner_id',
      `owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL`,
    );
  }
}
