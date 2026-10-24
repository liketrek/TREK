import { Migration } from '@mikro-orm/migrations';

/**
 * PAD-03 and PAD-07: a paddle tour's portages, locks and carrying speed.
 *
 * A planned tour marks a portage on the leg itself (`fixed_leg` kind
 * `portage`, no column needed) and a lock on the control point it sits at:
 * `tour_waypoints.lock` is the JSON of the times the paddler expects there.
 * A recorded track has no control points to mark, and is never redrawn, so
 * `tours.track_marks` holds its portages and locks as distances along it.
 * `tours.portage_speed_kmh` is the carrying speed the paddler chose; NULL
 * means the starting value applies. Every existing row reads NULL: nothing
 * carried, no lock, nothing changes its meaning.
 */
export class Migration20200101044000_a_paddle_tour_plans_its_portages_and_locks extends Migration {
  override name = 'Migration20200101044000_a_paddle_tour_plans_its_portages_and_locks';

  override up(): void {
    this.addSql('ALTER TABLE tour_waypoints ADD COLUMN lock TEXT');
    this.addSql('ALTER TABLE tours ADD COLUMN portage_speed_kmh REAL');
    this.addSql('ALTER TABLE tours ADD COLUMN track_marks TEXT');
  }
}
