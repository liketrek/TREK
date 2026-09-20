import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 138 (`db/migrations.ts`).
 */
export class Migration20200101021800_reservations_add_external_source extends Migration {
  override name = 'Migration20200101021800_reservations_add_external_source';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'reservations', 'external_source', `external_source TEXT`);

    await addColumnIfMissing(this, 'reservations', 'external_id', `external_id TEXT`);

    await addColumnIfMissing(this, 'reservations', 'external_owner_user_id', `external_owner_user_id INTEGER`);

    await addColumnIfMissing(this, 'reservations', 'external_synced_at', `external_synced_at TEXT`);

    await addColumnIfMissing(this, 'reservations', 'sync_enabled', `sync_enabled INTEGER DEFAULT 1`);

    await addColumnIfMissing(this, 'reservations', 'external_hash', `external_hash TEXT`);

    await this.execute(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_external ON reservations(external_source, external_id, trip_id)`,
    );
  }
}
