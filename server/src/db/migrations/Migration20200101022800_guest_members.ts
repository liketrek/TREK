import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 148 (`db/migrations.ts`).
 *
 * Guest members (#1362): people added to a trip without an account. A guest is a
 * users row flagged is_guest=1 (no usable credentials) joined into trip_members,
 * so it's assignable everywhere a member is — but must never authenticate or show
 * up in the global user directory. The flag is the discriminator for those guards.
 */
export class Migration20200101022800_guest_members extends Migration {
  override name = 'Migration20200101022800_guest_members';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'users', 'is_guest', `is_guest INTEGER NOT NULL DEFAULT 0`);
  }
}
