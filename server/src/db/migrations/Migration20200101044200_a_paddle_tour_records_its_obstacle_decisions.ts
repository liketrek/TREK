import { Migration } from '@mikro-orm/migrations';

/**
 * PAD-06: what the paddler decided about an obstacle on a tour, and against
 * what. `obstacle_key` names the obstacle (its OSM reference, or the shared
 * key of a lock's objects); `decision` is pass, portage, reroute or
 * not_affected. A decision holds only for the line and the obstacle it was
 * made on: `route_fingerprint` is the tour's line near the obstacle and
 * `source_fingerprint` the obstacle's data, both as they were then. When
 * either differs now the decision is shown again as one to review, never
 * silently carried over or dropped. `obstacle_snapshot` keeps the obstacle's
 * name and kind at the time, so a decision about an object the data no
 * longer holds still says what it was about. `decided_by` names who decided,
 * kept as a plain id: a decision outlives its author, who then reads as
 * unknown. It goes with its tour.
 */
export class Migration20200101044200_a_paddle_tour_records_its_obstacle_decisions extends Migration {
  override name = 'Migration20200101044200_a_paddle_tour_records_its_obstacle_decisions';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS tour_obstacle_reviews (
        place_id INTEGER NOT NULL REFERENCES tours(place_id) ON DELETE CASCADE,
        obstacle_key TEXT NOT NULL,
        decision TEXT NOT NULL CHECK (decision IN ('pass', 'portage', 'reroute', 'not_affected')),
        note TEXT,
        route_fingerprint TEXT NOT NULL,
        source_fingerprint TEXT NOT NULL,
        obstacle_snapshot TEXT NOT NULL,
        decided_at DATETIME NOT NULL,
        decided_by INTEGER,
        PRIMARY KEY (place_id, obstacle_key)
      )
    `);
  }
}
