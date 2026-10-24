import { Migration } from '@mikro-orm/migrations';

/**
 * A TREK Studio book keeps the last few versions a whole-book change replaced,
 * so the assistant's `apply_book_design` can be taken back in one step
 * (`restore_book_revision`). The row holds the document as it was (`document`,
 * the same JSON `journey_books.document` holds) and the version it stood at
 * (`version`); the apply writes it in the same transaction as the new book,
 * and keeps the newest five per journey. A revision goes with its journey.
 */
export class Migration20200101046260_a_book_keeps_its_last_revisions extends Migration {
  override name = 'Migration20200101046260_a_book_keeps_its_last_revisions';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS journey_book_revisions (
        id INTEGER PRIMARY KEY,
        journey_id INTEGER NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
        version INTEGER NOT NULL,
        document TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.addSql('CREATE INDEX IF NOT EXISTS idx_journey_book_revisions_journey ON journey_book_revisions(journey_id)');
  }
}
