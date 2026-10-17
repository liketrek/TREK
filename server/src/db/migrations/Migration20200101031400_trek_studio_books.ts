import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 194 (`db/migrations.ts`).
 *
 * TREK Studio books (#1973).
 * One row per book, the document itself stored as JSON. A book is a
 * document rather than a graph of records: the editor loads it whole, the
 * renderer prints it whole, and nothing ever queries "which books contain a
 * heart-shaped frame". Normalising spreads and elements into tables would
 * buy queries nobody makes and cost a join on every open plus a schema
 * migration for every new element kind.
 * `updated_at` and `version` are what make concurrent editing possible:
 * the version increments on every write, and a client that saves against a
 * version it did not read gets told rather than silently overwriting.
 */
export class Migration20200101031400_trek_studio_books extends Migration {
  override name = 'Migration20200101031400_trek_studio_books';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS journey_books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        journey_id INTEGER NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
        title TEXT NOT NULL DEFAULT '',
        document TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_journey_books_journey ON journey_books(journey_id)`);
  }
}
