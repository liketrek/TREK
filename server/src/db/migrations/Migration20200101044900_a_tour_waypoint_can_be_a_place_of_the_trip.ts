import { Migration } from '@mikro-orm/migrations';

/**
 * PR1-10: a waypoint of a tour can stand for a place of its trip, chosen on
 * purpose. The waypoint keeps its own coordinates; the place stays a place of
 * its own. Deleting the place only drops the link, never the waypoint, and the
 * partial index serves that delete.
 */
export class Migration20200101044900_a_tour_waypoint_can_be_a_place_of_the_trip extends Migration {
  override name = 'Migration20200101044900_a_tour_waypoint_can_be_a_place_of_the_trip';

  override up(): void {
    this.addSql(
      'ALTER TABLE tour_waypoints ADD COLUMN linked_place_id INTEGER REFERENCES places(id) ON DELETE SET NULL',
    );
    this.addSql(
      'CREATE INDEX idx_tour_waypoints_linked_place ON tour_waypoints (linked_place_id) WHERE linked_place_id IS NOT NULL',
    );
  }
}
