import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 154 (`db/migrations.ts`).
 *
 * Migration 154: optional trip binding on an admin invite link (#1402). A user
 * who REGISTERS via the link is auto-added to the trip. Nullable for backward
 * compatibility; ON DELETE SET NULL so removing the trip just unbinds the invite.
 */
export class Migration20200101023400_optional_trip_binding_on_an_admin_invite extends Migration {
  override name = 'Migration20200101023400_optional_trip_binding_on_an_admin_invite';

  override async up(): Promise<void> {
    await addColumnIfMissing(
      this,
      'invite_tokens',
      'trip_id',
      `trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL`,
    );
  }
}
