import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 223 (`db/migrations.ts`).
 *
 * Reviewed visit suggestions (#2279). One row per (user, Dawarich visit id) —
 * the UNIQUE is what makes a repeated sync idempotent instead of duplicating
 * everything it already imported.
 * `source_hash` exists because a Dawarich visit carries no `updated_at`: a
 * rename or a re-detection is only visible as a different hash of the fields
 * TREK shows. `source_missing_at` exists because deleting a visit removes it
 * from the API rather than tombstoning it, so absence from a full re-read of
 * the same window is the only signal — and it is recorded, not acted on,
 * because an entry the user already accepted and edited is theirs now.
 */
export class Migration20200101034300_reviewed_visit_suggestions extends Migration {
  override name = 'Migration20200101034300_reviewed_visit_suggestions';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS dawarich_visit_suggestions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        source_visit_id TEXT NOT NULL,
        trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        lat REAL,
        lng REAL,
        started_at TEXT NOT NULL,
        ended_at TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL DEFAULT 0,
        local_date TEXT NOT NULL,
        source_status TEXT NOT NULL DEFAULT 'suggested',
        confidence REAL,
        confidence_band TEXT,
        country_code TEXT,
        state TEXT NOT NULL DEFAULT 'new',
        target TEXT,
        accepted_place_id INTEGER REFERENCES places(id) ON DELETE SET NULL,
        accepted_journal_entry_id INTEGER,
        accepted_bucket_list_item_id INTEGER REFERENCES bucket_list(id) ON DELETE SET NULL,
        matched_bucket_list_item_id INTEGER REFERENCES bucket_list(id) ON DELETE SET NULL,
        source_hash TEXT NOT NULL,
        accepted_hash TEXT,
        source_missing_at TEXT,
        first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, source_visit_id)
      )
    `);

    this.addSql(
      `CREATE INDEX IF NOT EXISTS idx_dawarich_suggestions_user_state ON dawarich_visit_suggestions(user_id, state)`,
    );

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_dawarich_suggestions_trip ON dawarich_visit_suggestions(trip_id)`);
  }
}
