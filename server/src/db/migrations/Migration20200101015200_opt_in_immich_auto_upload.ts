import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 112 (`db/migrations.ts`).
 *
 * Migration 111: opt-in Immich auto-upload — users column only (#730)
 * Default is off — uploading to Immich must be an explicit choice, not a
 * side effect of having a writable API key.
 */
export class Migration20200101015200_opt_in_immich_auto_upload extends Migration {
  override name = 'Migration20200101015200_opt_in_immich_auto_upload';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'users', 'immich_auto_upload', `immich_auto_upload INTEGER NOT NULL DEFAULT 0`);
  }
}
