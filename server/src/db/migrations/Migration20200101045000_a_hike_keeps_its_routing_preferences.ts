import { Migration } from '@mikro-orm/migrations';

/**
 * MF-08: what a hike asks the router for besides its difficulty limit (steps,
 * ferries, footpaths, the shorter way), as JSON. NULL for none, which every
 * tour saved before keeps, so no existing route changes by itself.
 */
export class Migration20200101045000_a_hike_keeps_its_routing_preferences extends Migration {
  override name = 'Migration20200101045000_a_hike_keeps_its_routing_preferences';

  override up(): void {
    this.addSql('ALTER TABLE tours ADD COLUMN hiking_preferences TEXT');
  }
}
