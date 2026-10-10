import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 141 (`db/migrations.ts`).
 *
 * Remember the app version a notice was dismissed at, so per-version recurring
 * notices (e.g. the thank-you) re-appear on the next install/upgrade.
 */
export class Migration20200101022100_remember_the_app_version_a_notice_was extends Migration {
  override name = 'Migration20200101022100_remember_the_app_version_a_notice_was';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'user_notice_dismissals', 'dismissed_app_version', `dismissed_app_version TEXT`);
  }
}
