import { Migration } from '@mikro-orm/migrations';

/**
 * An admin can run one plugin outside the TREK versions its author declared,
 * instead of switching the check off for every plugin through
 * TREK_PLUGINS_IGNORE_TREK_RANGE. The consent belongs to what the admin was
 * shown: `trek_range_accepted_version` is the plugin version they accepted and
 * `trek_range_accepted_host` the TREK version it ran on then. An update of the
 * plugin or a new TREK major asks again.
 */
export class Migration20200101046310_an_admin_can_run_a_plugin_outside_its_trek_range extends Migration {
  override name = 'Migration20200101046310_an_admin_can_run_a_plugin_outside_its_trek_range';

  override up(): void {
    this.addSql('ALTER TABLE plugins ADD COLUMN trek_range_accepted_version TEXT');
    this.addSql('ALTER TABLE plugins ADD COLUMN trek_range_accepted_host TEXT');
  }
}
