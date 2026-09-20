import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 152 (`db/migrations.ts`).
 *
 * Migration 152: per-member permission role on a shared list. Existing
 * accepted members default to 'editor' so nothing regresses.
 */
export class Migration20200101023200_per_member_permission_role_on_a_shared extends Migration {
  override name = 'Migration20200101023200_per_member_permission_role_on_a_shared';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'collection_members', 'role', `role TEXT NOT NULL DEFAULT 'editor'`);
  }
}
