import { Migration } from '@mikro-orm/migrations';

/**
 * JRN-01: a journey keeps the route recorded on one of its days, taken over
 * from Dawarich on purpose, so the day stays drawn once the connection is
 * gone.
 *
 * One row per journey, local day and source. `segments` holds the recording
 * as it was taken (JSON: the thinned pieces with their mode and times, a gap
 * between two pieces kept as a gap), `utc_offset_minutes` the zone the day was
 * cut in, `window_from`/`window_to` the instants that day ran from and to,
 * `fetched_at` when the source answered and `content_hash` what it answered,
 * so taking the same day over again replaces nothing that did not change.
 * `imported_by` names whose recording it is; the row outlives that account.
 */
export class Migration20200101046160_a_journey_keeps_its_recorded_days extends Migration {
  override name = 'Migration20200101046160_a_journey_keeps_its_recorded_days';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS journey_recorded_days (
        id INTEGER PRIMARY KEY,
        journey_id INTEGER NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
        local_date TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'dawarich',
        source_kind TEXT NOT NULL,
        utc_offset_minutes INTEGER NOT NULL,
        window_from TEXT NOT NULL,
        window_to TEXT NOT NULL,
        segments TEXT NOT NULL,
        point_count INTEGER NOT NULL,
        distance_m REAL,
        content_hash TEXT NOT NULL,
        truncated INTEGER NOT NULL DEFAULT 0,
        fetched_at TEXT NOT NULL,
        imported_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.addSql(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_journey_recorded_days_day ON journey_recorded_days(journey_id, local_date, source)',
    );
    this.addSql(
      'CREATE INDEX IF NOT EXISTS idx_journey_recorded_days_imported_by ON journey_recorded_days(imported_by)',
    );
  }
}
