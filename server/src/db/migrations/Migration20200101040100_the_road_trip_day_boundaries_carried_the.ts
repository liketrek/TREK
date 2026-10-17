import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 241 (`db/migrations.ts`).
 *
 * The road-trip day boundaries carried the old trip limit as a CHECK on
 * day_number. The limit lives in the contract now (MAX_TRIP_DAYS), so the
 * table keeps only the floor. SQLite cannot alter a CHECK, hence the
 * rebuild; nothing references the table, so the rows are simply copied.
 */
export class Migration20200101040100_the_road_trip_day_boundaries_carried_the extends Migration {
  override name = 'Migration20200101040100_the_road_trip_day_boundaries_carried_the';

  override up(): void {
    this.addSql(`
      CREATE TABLE roadtrip_day_boundaries_new (
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        day_number INTEGER NOT NULL CHECK (day_number >= 1),
        from_assignment_id INTEGER NOT NULL REFERENCES day_assignments(id) ON DELETE CASCADE,
        to_assignment_id INTEGER REFERENCES day_assignments(id) ON DELETE CASCADE,
        fraction REAL NOT NULL CHECK (fraction BETWEEN 0 AND 1),
        PRIMARY KEY (trip_id, day_number)
      )
    `);

    this.addSql(`
      INSERT INTO roadtrip_day_boundaries_new
      SELECT trip_id, day_number, from_assignment_id, to_assignment_id, fraction FROM roadtrip_day_boundaries
    `);

    this.addSql(`DROP TABLE roadtrip_day_boundaries`);

    this.addSql(`ALTER TABLE roadtrip_day_boundaries_new RENAME TO roadtrip_day_boundaries`);
  }
}
