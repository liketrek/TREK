import { Migration } from '@mikro-orm/migrations';

/**
 * P2A-03: a waypoint can be a shaping point, there only to steer the route:
 * no stop, no place to get in or out, nothing a day plan shows. 0 or 1;
 * every waypoint saved before is a stop, as it was.
 */
export class Migration20200101044400_a_tour_waypoint_can_shape_the_route extends Migration {
  override name = 'Migration20200101044400_a_tour_waypoint_can_shape_the_route';

  override up(): void {
    this.addSql(`ALTER TABLE tour_waypoints ADD COLUMN shaping INTEGER NOT NULL DEFAULT 0 CHECK (shaping IN (0, 1))`);
  }
}
