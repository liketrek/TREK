import { Migration } from '@mikro-orm/migrations';

/**
 * Somebody another member took off a trip cannot come back on their own
 * through the trip's invite link (GHSA-wr4c-964p-39jg). Removing a member
 * deletes their `trip_members` row, and the invite link checked nothing but
 * its own token, so the old link let them straight back in.
 *
 * `trip_member_removals` keeps one row per trip and person who was removed by
 * someone else. The invite link refuses them while the row exists; a member
 * manager adding them back by name clears it. Leaving a trip yourself leaves
 * no row, so whoever left can still rejoin through the link. The rows go with
 * the trip and with the account.
 */
export class Migration20200101046290_a_removed_member_cannot_rejoin_by_invite_link extends Migration {
  override name = 'Migration20200101046290_a_removed_member_cannot_rejoin_by_invite_link';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS trip_member_removals (
        id INTEGER PRIMARY KEY,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        removed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(trip_id, user_id)
      )
    `);
    this.addSql('CREATE INDEX IF NOT EXISTS idx_trip_member_removals_user ON trip_member_removals(user_id)');
  }
}
