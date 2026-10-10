import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 90 (`db/migrations.ts`).
 *
 * Migration 84: Journey addon — trip tracking & travel journal. Registered
 * disabled: the addon is opt-in.
 */
export class Migration20200101013000_journey_addon extends Migration {
  override name = 'Migration20200101013000_journey_addon';

  override up(): void {
    this.addSql(`
      INSERT OR IGNORE INTO addons (id, name, description, type, icon, enabled, config, sort_order)
      VALUES ('journey', 'Journey', 'Trip tracking & travel journal — check-ins, photos, daily stories', 'global', 'Compass', 0, '{}', 35)
    `);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS journeys (
        id TEXT PRIMARY KEY,
        trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        cover_image TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        started_at TEXT,
        ended_at TEXT,
        is_public INTEGER NOT NULL DEFAULT 0,
        public_token TEXT UNIQUE,
        settings TEXT DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
      )
    `);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS journey_checkins (
        id TEXT PRIMARY KEY,
        journey_id TEXT NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
        place_id INTEGER REFERENCES places(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        lat REAL,
        lng REAL,
        address TEXT,
        country_code TEXT,
        notes TEXT,
        checked_in_at TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'manual',
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
      )
    `);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS journey_entries (
        id TEXT PRIMARY KEY,
        journey_id TEXT NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
        checkin_id TEXT REFERENCES journey_checkins(id) ON DELETE SET NULL,
        entry_date TEXT NOT NULL,
        title TEXT,
        body TEXT,
        mood TEXT,
        weather TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
      )
    `);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS journey_photos (
        id TEXT PRIMARY KEY,
        journey_id TEXT NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
        checkin_id TEXT REFERENCES journey_checkins(id) ON DELETE SET NULL,
        entry_id TEXT REFERENCES journey_entries(id) ON DELETE SET NULL,
        storage_type TEXT NOT NULL DEFAULT 'local',
        asset_id TEXT,
        file_path TEXT,
        thumbnail_path TEXT,
        original_name TEXT,
        mime_type TEXT,
        size_bytes INTEGER,
        caption TEXT,
        taken_at TEXT,
        lat REAL,
        lng REAL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
      )
    `);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS journey_location_trail (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        journey_id TEXT NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        altitude REAL,
        accuracy REAL,
        recorded_at TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'dawarich'
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_journeys_user ON journeys(user_id)`);
    this.addSql(`CREATE INDEX IF NOT EXISTS idx_journeys_trip ON journeys(trip_id)`);
    this.addSql(`CREATE INDEX IF NOT EXISTS idx_journeys_public_token ON journeys(public_token)`);
    this.addSql(
      `CREATE INDEX IF NOT EXISTS idx_journey_checkins_journey ON journey_checkins(journey_id, checked_in_at)`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS idx_journey_entries_journey_date ON journey_entries(journey_id, entry_date)`,
    );
    this.addSql(`CREATE INDEX IF NOT EXISTS idx_journey_photos_journey ON journey_photos(journey_id)`);
    this.addSql(`CREATE INDEX IF NOT EXISTS idx_journey_photos_checkin ON journey_photos(checkin_id)`);
    this.addSql(`CREATE INDEX IF NOT EXISTS idx_journey_photos_entry ON journey_photos(entry_id)`);
    this.addSql(
      `CREATE INDEX IF NOT EXISTS idx_journey_trail_journey_time ON journey_location_trail(journey_id, recorded_at)`,
    );
  }
}
