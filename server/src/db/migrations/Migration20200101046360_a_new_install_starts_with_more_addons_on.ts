import { Migration } from '@mikro-orm/migrations';

/**
 * A new install starts with Journey and Collections switched on; an existing
 * install keeps every addon exactly as its admin left it.
 *
 * Both rows are written off by older migrations (journey_addon, collections_addon)
 * that every install runs, and the addon seeder never overwrites a row that is
 * already there, so the seeder alone cannot change their start value. A database
 * whose `users` table is still empty here is being set up for the first time:
 * migrations run before the seeders, and the admin seeder writes the first
 * account only afterwards.
 */
export class Migration20200101046360_a_new_install_starts_with_more_addons_on extends Migration {
  override name = 'Migration20200101046360_a_new_install_starts_with_more_addons_on';

  override up(): void {
    this.addSql(
      "UPDATE addons SET enabled = 1 WHERE id IN ('journey', 'collections') AND NOT EXISTS (SELECT 1 FROM users)",
    );
  }
}
