import { Migration } from '@mikro-orm/migrations';

/**
 * Tours: a facet on `places` for hikes and other single-day routes.
 *
 * `tours` is keyed on the owning place, so deleting the place drops the facet
 * and, through it, the ordered `tour_waypoints` the route editor saved.
 * `tour_types` is the controlled vocabulary the facet points at; the `hike`
 * row is reference data that FK needs, so it is written here rather than left
 * to a seeder.
 *
 * Every statement is guarded: a test instance that ran the pre-ORM Tours
 * branch already holds these tables and its rows must survive. That branch
 * also created `idx_tour_waypoints_place`, which duplicates the autoindex
 * behind `UNIQUE(place_id, sequence)`, so it is dropped to converge on the
 * fresh-install shape.
 */
export class Migration20200101042000_tours extends Migration {
  override name = 'Migration20200101042000_tours';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS tour_types (
        key TEXT PRIMARY KEY,
        label_key TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        routing_profile TEXT,
        is_sport INTEGER NOT NULL DEFAULT 1,
        enabled INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL DEFAULT 0
      )
    `);

    this.addSql(`
      INSERT OR IGNORE INTO tour_types (key, label_key, icon, color, routing_profile, is_sport, enabled, sort_order)
      VALUES ('hike', 'tourTypes.hike', 'Mountain', '#16a34a', 'pedestrian', 1, 1, 0)
    `);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS tours (
        place_id INTEGER PRIMARY KEY REFERENCES places(id) ON DELETE CASCADE,
        tour_type TEXT NOT NULL REFERENCES tour_types(key),
        distance REAL,
        elevation_gain REAL,
        elevation_loss REAL,
        duration REAL,
        difficulty TEXT,
        wanderer_ref TEXT,
        match_confidence REAL,
        tour_group_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        max_hiking_difficulty INTEGER NOT NULL DEFAULT 2 CHECK(max_hiking_difficulty BETWEEN 1 AND 6)
      )
    `);
    this.addSql('CREATE INDEX IF NOT EXISTS idx_tours_tour_type ON tours(tour_type)');

    this.addSql(`
      CREATE TABLE IF NOT EXISTS tour_waypoints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        place_id INTEGER NOT NULL REFERENCES tours(place_id) ON DELETE CASCADE,
        lat REAL NOT NULL CHECK(lat >= -90 AND lat <= 90),
        lng REAL NOT NULL CHECK(lng >= -180 AND lng <= 180),
        role TEXT NOT NULL CHECK(role IN ('start', 'via', 'end')),
        sequence INTEGER NOT NULL CHECK(sequence >= 0),
        UNIQUE(place_id, sequence)
      )
    `);
    this.addSql('DROP INDEX IF EXISTS idx_tour_waypoints_place');
  }
}
