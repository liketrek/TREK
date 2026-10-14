import { Migration } from '@mikro-orm/migrations';

/**
 * `tours.max_hiking_difficulty` may be NULL. A tour drawn in the planner still
 * gets the default of 2, but a GPX import knows nothing about the route's
 * difficulty, and writing 2 there claimed a value nobody chose.
 *
 * SQLite cannot drop a NOT NULL in place, so the table is rebuilt. With
 * `foreign_keys = ON` a `DROP TABLE tours` runs an implicit `DELETE FROM
 * tours` first, and the `ON DELETE CASCADE` on `tour_waypoints` would empty
 * that table with it. So `tour_waypoints` is rebuilt as well, pointing at
 * `tours_new`, and the old waypoint table goes before the old tours table:
 * by then nothing references `tours`. Renaming `tours_new` to `tours`
 * rewrites the waypoints' foreign key to the new name. Waypoint ids are
 * copied, so AUTOINCREMENT carries on where it was.
 *
 * Existing rows keep their value: nothing tells an imported tour from a
 * drawn one, so only imports from now on are written without a difficulty.
 */
export class Migration20200101043100_an_imported_tour_has_no_hiking_difficulty extends Migration {
  override name = 'Migration20200101043100_an_imported_tour_has_no_hiking_difficulty';

  override up(): void {
    this.addSql(`
      CREATE TABLE tours_new (
        place_id INTEGER PRIMARY KEY REFERENCES places(id) ON DELETE CASCADE,
        tour_type TEXT NOT NULL REFERENCES tour_types(key),
        distance REAL,
        elevation_gain REAL,
        elevation_loss REAL,
        duration REAL,
        difficulty TEXT,
        wanderer_ref TEXT,
        match_confidence REAL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        max_hiking_difficulty INTEGER DEFAULT 2 CHECK(max_hiking_difficulty BETWEEN 1 AND 6),
        planned_duration_minutes INTEGER CHECK(planned_duration_minutes BETWEEN 0 AND 1440),
        break_additional_minutes INTEGER CHECK(break_additional_minutes BETWEEN 0 AND 1440)
      )
    `);
    this.addSql(`
      INSERT INTO tours_new (
        place_id, tour_type, distance, elevation_gain, elevation_loss, duration, difficulty, wanderer_ref,
        match_confidence, created_at, max_hiking_difficulty, planned_duration_minutes, break_additional_minutes
      )
      SELECT
        place_id, tour_type, distance, elevation_gain, elevation_loss, duration, difficulty, wanderer_ref,
        match_confidence, created_at, max_hiking_difficulty, planned_duration_minutes, break_additional_minutes
      FROM tours
    `);

    this.addSql(`
      CREATE TABLE tour_waypoints_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        place_id INTEGER NOT NULL REFERENCES tours_new(place_id) ON DELETE CASCADE,
        lat REAL NOT NULL CHECK(lat >= -90 AND lat <= 90),
        lng REAL NOT NULL CHECK(lng >= -180 AND lng <= 180),
        role TEXT NOT NULL CHECK(role IN ('start', 'via', 'end')),
        sequence INTEGER NOT NULL CHECK(sequence >= 0),
        UNIQUE(place_id, sequence)
      )
    `);
    this.addSql(`
      INSERT INTO tour_waypoints_new (id, place_id, lat, lng, role, sequence)
      SELECT id, place_id, lat, lng, role, sequence FROM tour_waypoints
    `);

    this.addSql('DROP TABLE tour_waypoints');
    this.addSql('DROP TABLE tours');
    this.addSql('ALTER TABLE tours_new RENAME TO tours');
    this.addSql('ALTER TABLE tour_waypoints_new RENAME TO tour_waypoints');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_tours_tour_type ON tours(tour_type)');
  }
}
