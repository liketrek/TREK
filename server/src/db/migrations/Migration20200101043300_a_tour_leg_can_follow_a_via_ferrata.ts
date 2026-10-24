import { Migration } from '@mikro-orm/migrations';

/**
 * `tour_waypoints.fixed_leg` holds the leg from a waypoint to the next one
 * when the tour takes it as a fixed line rather than as a routed one: a via
 * ferrata put onto the tour from the map, whose own line from OpenStreetMap
 * the tour follows, since a router walks around a ferrata wherever it can.
 *
 * The column is JSON text (kind, the OSM reference, the name and the line) and
 * NULL for every routed leg, so every existing waypoint keeps its meaning.
 */
export class Migration20200101043300_a_tour_leg_can_follow_a_via_ferrata extends Migration {
  override name = 'Migration20200101043300_a_tour_leg_can_follow_a_via_ferrata';

  override up(): void {
    this.addSql('ALTER TABLE tour_waypoints ADD COLUMN fixed_leg TEXT');
  }
}
