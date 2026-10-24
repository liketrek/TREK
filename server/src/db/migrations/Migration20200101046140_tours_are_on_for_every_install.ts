import { Migration } from '@mikro-orm/migrations';

/**
 * Tours is on for every install from v5 on. A fresh install gets it from the
 * addon seeder, which now writes it enabled; an install that already has the
 * row is switched on here, once. The migration never runs again, so an admin
 * who turns Tours off afterwards keeps it off.
 */
export class Migration20200101046140_tours_are_on_for_every_install extends Migration {
  override name = 'Migration20200101046140_tours_are_on_for_every_install';

  override async up(): Promise<void> {
    this.addSql("UPDATE addons SET enabled = 1 WHERE id = 'tours'");
  }
}
