import { addColumnIfMissing, execBestEffort } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 156 (`db/migrations.ts`).
 *
 * Migration 156: separate the admin's ON/OFF intent (`enabled`) from the
 * runtime health (`status`). A crash used to flip status to 'error', which
 * erased the "keep it on" intent, so the plugin never rebooted after a deploy.
 * Boot now retries every enabled plugin regardless of last status.
 */
export class Migration20200101023600_separate_the_admin_s_on_off_intent extends Migration {
  override name = 'Migration20200101023600_separate_the_admin_s_on_off_intent';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'plugins', 'enabled', `enabled INTEGER NOT NULL DEFAULT 0`);

    await execBestEffort(this, `UPDATE plugins SET enabled = 1 WHERE status != 'inactive'`);
  }
}
