import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 92 (`db/migrations.ts`).
 *
 * Migration 86: Journey multi-trip support + sharing/collaboration
 */
export class Migration20200101013200_journey_multi_trip_support_sharing_collaboration extends Migration {
  override name = 'Migration20200101013200_journey_multi_trip_support_sharing_collaboration';

  override async up(): Promise<void> {
    await this.execute(`
      CREATE TABLE IF NOT EXISTS journey_trips (
        journey_id TEXT NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        added_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
        PRIMARY KEY (journey_id, trip_id)
      )
    `);

    await this.execute(`CREATE INDEX IF NOT EXISTS idx_journey_trips_journey ON journey_trips(journey_id)`);

    await this.execute(`
      CREATE TABLE IF NOT EXISTS journey_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        journey_id TEXT NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'viewer',
        invited_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
        UNIQUE(journey_id, user_id)
      )
    `);

    await this.execute(`CREATE INDEX IF NOT EXISTS idx_journey_members_user ON journey_members(user_id)`);

    await addColumnIfMissing(
      this,
      'journey_entries',
      'user_id',
      `user_id INTEGER REFERENCES users(id) ON DELETE SET NULL`,
    );

    await addColumnIfMissing(
      this,
      'journey_checkins',
      'user_id',
      `user_id INTEGER REFERENCES users(id) ON DELETE SET NULL`,
    );
  }
}
