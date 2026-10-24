import { Migration } from '@mikro-orm/migrations';

/**
 * JRN-02: an entry taken over from a recorded day remembers the stays it was
 * made of.
 *
 * One row per stay, with its own name, place and times as they were taken
 * over, so a day report keeps every place it covers although the entry has
 * one map position. The rows are also the ledger that taking a day over again
 * reads: `(journey_id, source, user_id, source_visit_id)` is unique, so
 * the same stay of the same person lands in a journey once. `user_id` is
 * whose recording it is; the stays go with their entry.
 */
export class Migration20200101046170_a_journey_entry_remembers_the_stays_it_came_from extends Migration {
  override name = 'Migration20200101046170_a_journey_entry_remembers_the_stays_it_came_from';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS journey_entry_stays (
        id INTEGER PRIMARY KEY,
        journey_id INTEGER NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
        entry_id INTEGER NOT NULL REFERENCES journey_entries(id) ON DELETE CASCADE,
        source TEXT NOT NULL DEFAULT 'dawarich',
        source_visit_id TEXT NOT NULL,
        name TEXT NOT NULL,
        lat REAL,
        lng REAL,
        started_at TEXT NOT NULL,
        ended_at TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.addSql(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_journey_entry_stays_stay ON journey_entry_stays(journey_id, source, user_id, source_visit_id)',
    );
    this.addSql('CREATE INDEX IF NOT EXISTS idx_journey_entry_stays_entry ON journey_entry_stays(entry_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_journey_entry_stays_user ON journey_entry_stays(user_id)');
  }
}
