import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 178 (`db/migrations.ts`).
 *
 * Collaborative place ratings (#1435): every trip member can rate a trip
 * place 1-5, every collection member a saved place; the displayed value is
 * the average. One row per user and place, mirroring collab_poll_votes.
 */
export class Migration20200101025800_collaborative_place_ratings extends Migration {
  override name = 'Migration20200101025800_collaborative_place_ratings';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS place_ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(place_id, user_id)
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_place_ratings_place ON place_ratings (place_id)`);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS collection_place_ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        collection_place_id INTEGER NOT NULL REFERENCES collection_places(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(collection_place_id, user_id)
      )
    `);

    this.addSql(
      `CREATE INDEX IF NOT EXISTS idx_collection_place_ratings_place ON collection_place_ratings (collection_place_id)`,
    );
  }
}
