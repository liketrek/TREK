import { Migration } from '@mikro-orm/migrations';

/**
 * HOR-01: a tour can be a ride on horseback. `horse` is a key of its own in
 * `tour_types`, enabled, with no routing profile: a ride is never routed, it
 * is made of sections of signposted horse routes and stretches the rider
 * draws by hand. Those live in `tour_waypoints.fixed_leg` like every other
 * fixed leg, so no column is added and no existing tour changes its meaning.
 * An instance that already defined the key keeps its own row.
 */
export class Migration20200101045600_a_tour_can_be_ridden_on_horseback extends Migration {
  override name = 'Migration20200101045600_a_tour_can_be_ridden_on_horseback';

  override up(): void {
    this.addSql(`
      INSERT INTO tour_types (key, label_key, icon, color, routing_profile, is_sport, enabled, sort_order)
      VALUES ('horse', 'tourTypes.horse', 'Horseshoe', '#a16207', NULL, 1, 1, 7)
      ON CONFLICT (key) DO NOTHING
    `);
  }
}
