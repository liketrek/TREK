import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 218 (`db/migrations.ts`).
 */
export class Migration20200101033800_create_roadtrip_day_boundaries extends Migration {
  override name = 'Migration20200101033800_create_roadtrip_day_boundaries';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS roadtrip_day_boundaries (
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 366),
        from_assignment_id INTEGER NOT NULL REFERENCES day_assignments(id) ON DELETE CASCADE,
        to_assignment_id INTEGER REFERENCES day_assignments(id) ON DELETE CASCADE,
        fraction REAL NOT NULL CHECK (fraction BETWEEN 0 AND 1),
        PRIMARY KEY (trip_id, day_number)
      )
    `);
  }
}
