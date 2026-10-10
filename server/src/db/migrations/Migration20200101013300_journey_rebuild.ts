import { bestEffort, tableExists } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/** A row from whichever shape of the old journey tables this database had. */
type LegacyRow = Record<string, string | number | null>;

const NEW_TABLES = [
  `CREATE TABLE journeys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    cover_gradient TEXT,
    status TEXT DEFAULT 'draft',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
  `CREATE TABLE journey_trips (
    journey_id INTEGER NOT NULL,
    trip_id INTEGER NOT NULL,
    added_at INTEGER NOT NULL,
    PRIMARY KEY (journey_id, trip_id),
    FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE journey_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journey_id INTEGER NOT NULL,
    source_trip_id INTEGER,
    source_place_id INTEGER,
    author_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT,
    story TEXT,
    entry_date TEXT NOT NULL,
    entry_time TEXT,
    location_name TEXT,
    location_lat REAL,
    location_lng REAL,
    mood TEXT,
    weather TEXT,
    tags TEXT,
    visibility TEXT DEFAULT 'private',
    sort_order INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
    FOREIGN KEY (source_trip_id) REFERENCES trips(id) ON DELETE SET NULL,
    FOREIGN KEY (source_place_id) REFERENCES places(id) ON DELETE SET NULL,
    FOREIGN KEY (author_id) REFERENCES users(id)
  )`,
  `CREATE TABLE journey_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    thumbnail_path TEXT,
    caption TEXT,
    sort_order INTEGER DEFAULT 0,
    width INTEGER,
    height INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (entry_id) REFERENCES journey_entries(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE journey_contributors (
    journey_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    added_at INTEGER NOT NULL,
    PRIMARY KEY (journey_id, user_id),
    FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`,
];

const NEW_INDEXES = [
  `CREATE INDEX idx_journeys_user ON journeys(user_id)`,
  `CREATE INDEX idx_journey_entries_journey ON journey_entries(journey_id, entry_date)`,
  `CREATE INDEX idx_journey_entries_source ON journey_entries(source_place_id)`,
  `CREATE INDEX idx_journey_photos_entry ON journey_photos(entry_id)`,
  `CREATE INDEX idx_journey_trips_journey ON journey_trips(journey_id)`,
  `CREATE INDEX idx_journey_contributors_user ON journey_contributors(user_id)`,
];

/**
 * Legacy migration step 93 (`db/migrations.ts`).
 *
 * Migration 87: Journey rebuild — new schema with trip sync.
 *
 * Step 90's journeys were TEXT-keyed and single-trip; this replaces them with
 * integer keys, a journey↔trip join table and contributors. The old rows are
 * read into memory, the tables dropped, and the rows re-inserted against the new
 * shape — so the old TEXT ids have to be mapped to the new autoincrement ones.
 */
export class Migration20200101013300_journey_rebuild extends Migration {
  override name = 'Migration20200101013300_journey_rebuild';

  /** SQLite's `lastInsertRowid`, which `execute()` does not surface for raw SQL. */
  private async lastInsertId(): Promise<number> {
    const rows = (await this.execute(`SELECT last_insert_rowid() AS id`)) as { id: number }[];
    return Number(rows[0].id);
  }

  override async up(): Promise<void> {
    let oldJourneys: LegacyRow[] = [];
    let oldEntries: LegacyRow[] = [];
    let oldPhotos: LegacyRow[] = [];

    if (await tableExists(this, 'journeys')) {
      await bestEffort(async () => {
        oldJourneys = (await this.execute(`SELECT * FROM journeys`)) as LegacyRow[];
      });
      await bestEffort(async () => {
        oldEntries = (await this.execute(`SELECT * FROM journey_entries`)) as LegacyRow[];
      });
      await bestEffort(async () => {
        oldPhotos = (await this.execute(`SELECT * FROM journey_photos`)) as LegacyRow[];
      });

      for (const table of [
        'journey_location_trail',
        'journey_photos',
        'journey_entries',
        'journey_checkins',
        'journey_members',
        'journey_trips',
        'journeys',
      ]) {
        await this.execute(`DROP TABLE IF EXISTS ${table}`);
      }
    }

    for (const ddl of NEW_TABLES) await this.execute(ddl);
    for (const ddl of NEW_INDEXES) await this.execute(ddl);

    if (oldJourneys.length === 0) return;

    const now = Date.now();
    const toMillis = (value: string | number | null | undefined): number => (value ? new Date(value).getTime() : now);

    const journeyIdMap = new Map<string | number, number>();
    for (const j of oldJourneys) {
      await this.execute(
        `INSERT INTO journeys (user_id, title, subtitle, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          j.user_id,
          j.title || 'Untitled Journey',
          j.description || null,
          j.status || 'draft',
          toMillis(j.created_at),
          toMillis(j.updated_at),
        ],
      );
      const newJourneyId = await this.lastInsertId();
      journeyIdMap.set(j.id!, newJourneyId);

      await this.execute(
        `INSERT OR IGNORE INTO journey_contributors (journey_id, user_id, role, added_at) VALUES (?, ?, 'owner', ?)`,
        [newJourneyId, j.user_id, now],
      );

      if (j.trip_id) {
        await bestEffort(async () => {
          await this.execute(`INSERT OR IGNORE INTO journey_trips (journey_id, trip_id, added_at) VALUES (?, ?, ?)`, [
            newJourneyId,
            j.trip_id,
            now,
          ]);
        });
      }
    }

    const entryIdMap = new Map<string | number, number>();
    for (const e of oldEntries) {
      const newJourneyId = journeyIdMap.get(e.journey_id!);
      if (!newJourneyId) continue;

      const authorId = e.user_id || oldJourneys.find((j) => j.id === e.journey_id)?.user_id || 1;
      await this.execute(
        `INSERT INTO journey_entries (journey_id, author_id, type, title, story, entry_date, entry_time, location_name, location_lat, location_lng, mood, weather, visibility, sort_order, created_at, updated_at)
         VALUES (?, ?, 'entry', ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newJourneyId,
          authorId,
          e.title || null,
          e.body || null,
          e.entry_date || new Date().toISOString().split('T')[0],
          e.place_name || null,
          e.lat || null,
          e.lng || null,
          e.mood || null,
          e.weather || null,
          e.visibility || 'private',
          e.sort_order || 0,
          toMillis(e.created_at),
          toMillis(e.updated_at),
        ],
      );
      entryIdMap.set(e.id!, await this.lastInsertId());
    }

    for (const p of oldPhotos) {
      const newEntryId = p.entry_id ? entryIdMap.get(p.entry_id) : null;
      if (!newEntryId || !p.file_path) continue;

      await this.execute(
        `INSERT INTO journey_photos (entry_id, file_path, thumbnail_path, caption, sort_order, width, height, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newEntryId,
          p.file_path,
          p.thumbnail_path || null,
          p.caption || null,
          p.sort_order || 0,
          p.width || null,
          p.height || null,
          toMillis(p.created_at),
        ],
      );
    }

    console.log(
      `[DB] Journey migration: imported ${journeyIdMap.size} journeys, ${entryIdMap.size} entries, photos migrated`,
    );
  }
}
