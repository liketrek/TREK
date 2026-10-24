import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 213 (`db/migrations.ts`).
 *
 * Links somebody shared with the trip.
 * Its own table rather than a note with a URL in it: a link is pinned,
 * ordered and opened, and none of that is what a note does. `user_id` is who
 * shared it, so the list can say so and so a member leaving takes their rows
 * with them.
 * Appended LAST: the array is index-addressed against schema_version.
 */
export class Migration20200101033300_links_somebody_shared_with_the_trip extends Migration {
  override name = 'Migration20200101033300_links_somebody_shared_with_the_trip';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS collab_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        pinned INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_collab_links_trip ON collab_links(trip_id)`);
  }
}
