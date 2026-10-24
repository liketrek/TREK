import { Migration } from '@mikro-orm/migrations';

/**
 * CW-01 to CW-04, CW-10: a tour can be a city walk. The `walk` key has been in
 * `tour_types`, disabled, since every contract type was seeded; it is switched
 * on here. Its points are stations: each keeps a key across saves, a name,
 * how long it is stayed at, how much it matters, whether a proposed change
 * must leave it, and the opening hours it was found with. Every column is
 * NULL (or off) on the points saved before, so no tour changes its meaning.
 *
 * How far a walk got on a day is kept per day assignment and station key, so
 * the same walk on another day, or a copy, starts with nothing visited, and a
 * visit goes with its assignment.
 */
export class Migration20200101045300_a_tour_can_be_a_city_walk extends Migration {
  override name = 'Migration20200101045300_a_tour_can_be_a_city_walk';

  override up(): void {
    this.addSql('ALTER TABLE tour_waypoints ADD COLUMN station_key TEXT');
    this.addSql('ALTER TABLE tour_waypoints ADD COLUMN name TEXT');
    this.addSql(
      'ALTER TABLE tour_waypoints ADD COLUMN stay_minutes INTEGER CHECK (stay_minutes IS NULL OR (stay_minutes >= 0 AND stay_minutes <= 1440))',
    );
    this.addSql(
      "ALTER TABLE tour_waypoints ADD COLUMN importance TEXT CHECK (importance IS NULL OR importance IN ('optional', 'must'))",
    );
    this.addSql(
      'ALTER TABLE tour_waypoints ADD COLUMN protected INTEGER NOT NULL DEFAULT 0 CHECK (protected IN (0, 1))',
    );
    this.addSql('ALTER TABLE tour_waypoints ADD COLUMN opening_hours TEXT');
    this.addSql(`
      CREATE TABLE tour_station_visits (
        assignment_id INTEGER NOT NULL REFERENCES day_assignments(id) ON DELETE CASCADE,
        station_key TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('visited', 'skipped')),
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (assignment_id, station_key)
      )
    `);
    this.addSql("UPDATE tour_types SET enabled = 1 WHERE key = 'walk'");
  }
}
