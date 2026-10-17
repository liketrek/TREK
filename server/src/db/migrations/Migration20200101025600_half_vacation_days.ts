import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 176 (`db/migrations.ts`).
 *
 * Half vacation days (#552): a vacay entry can now count as a full day (1) or
 * a half day (0.5) toward the entitlement. Existing entries default to a full
 * day, so the entitlement maths are unchanged for everyone already using vacay.
 * Guarded so re-running the migration tail (e.g. the crosswalk test) is a no-op.
 */
export class Migration20200101025600_half_vacation_days extends Migration {
  override name = 'Migration20200101025600_half_vacation_days';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'vacay_entries', 'fraction', `fraction REAL NOT NULL DEFAULT 1`);
  }
}
