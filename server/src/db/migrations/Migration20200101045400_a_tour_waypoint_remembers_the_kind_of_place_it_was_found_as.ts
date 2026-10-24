import { Migration } from '@mikro-orm/migrations';

/**
 * PLN-03: a point taken in from the places found along a tour keeps the kind
 * of place it was found as (a restaurant, a museum), so the planner can mark
 * its row with that kind's icon as the map drew the place. Plain text, read
 * back only where the contract knows the kind, so a kind added later needs no
 * migration. NULL on every point saved before and on a point set by hand.
 */
export class Migration20200101045400_a_tour_waypoint_remembers_the_kind_of_place_it_was_found_as extends Migration {
  override name = 'Migration20200101045400_a_tour_waypoint_remembers_the_kind_of_place_it_was_found_as';

  override up(): void {
    this.addSql('ALTER TABLE tour_waypoints ADD COLUMN poi_category TEXT');
  }
}
