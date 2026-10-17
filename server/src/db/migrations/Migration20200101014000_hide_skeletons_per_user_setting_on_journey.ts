import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 100 (`db/migrations.ts`).
 *
 * Migration 99: hide_skeletons per-user setting on journey_contributors
 */
export class Migration20200101014000_hide_skeletons_per_user_setting_on_journey extends Migration {
  override name = 'Migration20200101014000_hide_skeletons_per_user_setting_on_journey';

  override async up(): Promise<void> {
    await addColumnIfMissing(
      this,
      'journey_contributors',
      'hide_skeletons',
      `hide_skeletons INTEGER NOT NULL DEFAULT 0`,
    );
  }
}
