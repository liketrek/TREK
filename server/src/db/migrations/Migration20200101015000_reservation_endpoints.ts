import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 110 (`db/migrations.ts`).
 *
 * Migration 109: Reservation endpoints (from/to points for flights, trains, ferries, car rentals) — #384 + #587
 */
export class Migration20200101015000_reservation_endpoints extends Migration {
  override name = 'Migration20200101015000_reservation_endpoints';

  override async up(): Promise<void> {
    await this.execute(`
      CREATE TABLE IF NOT EXISTS reservation_endpoints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        sequence INTEGER NOT NULL DEFAULT 0,
        name TEXT NOT NULL,
        code TEXT,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        timezone TEXT,
        local_time TEXT,
        local_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.execute(
      `CREATE INDEX IF NOT EXISTS idx_reservation_endpoints_reservation_id ON reservation_endpoints(reservation_id)`,
    );

    await addColumnIfMissing(this, 'reservations', 'needs_review', `needs_review INTEGER NOT NULL DEFAULT 0`);
  }
}
