import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 104 (`db/migrations.ts`).
 *
 * Migration 103: System notices — user tracking columns + dismissals table
 */
export class Migration20200101014400_system_notices extends Migration {
  override name = 'Migration20200101014400_system_notices';

  override async up(): Promise<void> {
    await addColumnIfMissing(this, 'users', 'first_seen_version', `first_seen_version TEXT NOT NULL DEFAULT '0.0.0'`);

    await addColumnIfMissing(this, 'users', 'login_count', `login_count INTEGER NOT NULL DEFAULT 0`);

    await this.execute(`
      CREATE TABLE IF NOT EXISTS user_notice_dismissals (
        user_id      INTEGER NOT NULL,
        notice_id    TEXT    NOT NULL,
        dismissed_at INTEGER NOT NULL,
        PRIMARY KEY (user_id, notice_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  }
}
