import { Migration } from '@mikro-orm/migrations';

/**
 * The Tours planner's unsaved draft lives on the account instead of in one
 * browser, so a draft started on one device opens on the next.
 *
 * One row per user and trip (`UNIQUE(trip_id, user_id)`): the planner keeps
 * one draft at a time, and the latest write replaces it. `payload` is the
 * planner's own draft as the client wrote it (JSON text the server stores and
 * hands back whole, never reads), capped by its contract. Deleting the trip or
 * the account takes the row with it.
 */
export class Migration20200101046200_a_tour_draft_lives_on_the_account extends Migration {
  override name = 'Migration20200101046200_a_tour_draft_lives_on_the_account';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS tour_drafts (
        id INTEGER PRIMARY KEY,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        payload TEXT NOT NULL,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(trip_id, user_id)
      )
    `);
    this.addSql('CREATE INDEX IF NOT EXISTS idx_tour_drafts_user ON tour_drafts(user_id)');
  }
}
