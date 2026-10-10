import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 144 (`db/migrations.ts`).
 *
 * Optimistic-concurrency token for offline conflict detection (#1135).
 * packing_items had only created_at, so an offline edit could not be checked
 * against a concurrent server change. SQLite forbids a non-constant DEFAULT on
 * ALTER ADD COLUMN, so add it nullable and backfill from created_at; new rows
 * set it explicitly (packingService). Additive: a request without the
 * X-Base-Updated-At header keeps the old last-write-wins behaviour.
 */
export class Migration20200101022400_optimistic_concurrency_token_for_offline_conflict_detection extends Migration {
  override name = 'Migration20200101022400_optimistic_concurrency_token_for_offline_conflict_detection';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'packing_items', 'updated_at', `updated_at DATETIME`);

    await this.execute(
      `UPDATE packing_items SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP) WHERE updated_at IS NULL`,
    );
  }
}
