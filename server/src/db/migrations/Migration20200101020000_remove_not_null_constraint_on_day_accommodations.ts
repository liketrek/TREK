import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 120 (`db/migrations.ts`).
 *
 * Remove NOT NULL constraint on day_accommodations.place_id so hotel
 * reservations created from the Bookings tab without a linked place can
 * still persist their date range. Change ON DELETE CASCADE → SET NULL so
 * deleting a place orphans the accommodation row instead of cascading.
 */
export class Migration20200101020000_remove_not_null_constraint_on_day_accommodations extends Migration {
  override name = 'Migration20200101020000_remove_not_null_constraint_on_day_accommodations';

  override up(): void {
    this.addSql(`
      CREATE TABLE day_accommodations_new (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id      INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        place_id     INTEGER REFERENCES places(id) ON DELETE SET NULL,
        start_day_id INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
        end_day_id   INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
        check_in     TEXT,
        check_in_end TEXT,
        check_out    TEXT,
        confirmation TEXT,
        notes        TEXT,
        created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.addSql(`
      INSERT INTO day_accommodations_new
      SELECT id, trip_id, place_id, start_day_id, end_day_id,
             check_in, check_in_end, check_out, confirmation, notes, created_at
      FROM day_accommodations
    `);

    this.addSql(`DROP TABLE day_accommodations`);

    this.addSql(`ALTER TABLE day_accommodations_new RENAME TO day_accommodations`);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_day_accommodations_trip_id ON day_accommodations(trip_id)`);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_day_accommodations_start_day_id ON day_accommodations(start_day_id)`);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_day_accommodations_end_day_id ON day_accommodations(end_day_id)`);
  }
}
