import { addColumnIfMissing } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * JRN-03: a journey can have its recorded days prepared while the trip runs.
 *
 * `journeys.auto_prepare_recordings` is the owner's switch, off by default, so
 * no journey starts fetching anything because of this step. With it on, the
 * Dawarich background sync also reads the stays of the journey's linked trip
 * periods for the owner and every editor with a connection of their own.
 *
 * `journey_recording_prep` is how far that got, one row per journey and
 * person: when it was last tried, when it last went through and why the last
 * try failed, kept apart so a failure never hides the data that is still
 * there. The row goes with its journey and with its person.
 */
export class Migration20200101046180_journeys_can_prepare_recorded_days extends Migration {
  override name = 'Migration20200101046180_journeys_can_prepare_recorded_days';

  override async up(): Promise<void> {
    await addColumnIfMissing(
      this,
      'journeys',
      'auto_prepare_recordings',
      `auto_prepare_recordings INTEGER NOT NULL DEFAULT 0`,
    );
    this.addSql(`
      CREATE TABLE IF NOT EXISTS journey_recording_prep (
        id INTEGER PRIMARY KEY,
        journey_id INTEGER NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        last_attempt_at TEXT,
        last_success_at TEXT,
        last_error TEXT
      )
    `);
    this.addSql(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_journey_recording_prep_person ON journey_recording_prep(journey_id, user_id)',
    );
    this.addSql('CREATE INDEX IF NOT EXISTS idx_journey_recording_prep_user ON journey_recording_prep(user_id)');
  }
}
