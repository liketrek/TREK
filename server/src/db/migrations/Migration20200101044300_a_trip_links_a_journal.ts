import { Migration } from '@mikro-orm/migrations';

/**
 * A trip can show one journal from the Journey addon as its own. The link
 * belongs to the trip, not to the journal's own trips (`journey_trips`): any
 * journal its owner chooses, and one journal may hang off several trips.
 * `linked_by` names who linked it, kept when that account goes as unknown.
 *
 * `trip_journal_link_members` lists the trip members the link lets into the
 * journal, as viewer or editor, apart from `journey_contributors` so that
 * unlinking, deselecting someone or their leaving the trip takes away exactly
 * the access the link gave and nothing the journal's owner granted directly.
 * `hide_skeletons` is that member's own journal preference, which for a direct
 * contributor sits on the contributor row. A member's rows go with the link,
 * with the trip and with the account.
 *
 * One link per trip is `trip_id UNIQUE` beside its own id rather than the trip
 * id as key, as `trip_invite_tokens` holds one per trip: a key that is also a
 * foreign key maps to a one-to-one on both entities, and a second one of those
 * next to `tours` made the ORM's entity types recurse past what tsc expands.
 */
export class Migration20200101044300_a_trip_links_a_journal extends Migration {
  override name = 'Migration20200101044300_a_trip_links_a_journal';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS trip_journal_links (
        id INTEGER PRIMARY KEY,
        trip_id INTEGER NOT NULL UNIQUE REFERENCES trips(id) ON DELETE CASCADE,
        journey_id INTEGER NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
        linked_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at INTEGER NOT NULL
      )
    `);
    this.addSql('CREATE INDEX IF NOT EXISTS idx_trip_journal_links_journey ON trip_journal_links(journey_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_trip_journal_links_linked_by ON trip_journal_links(linked_by)');
    this.addSql(`
      CREATE TABLE IF NOT EXISTS trip_journal_link_members (
        link_id INTEGER NOT NULL REFERENCES trip_journal_links(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor')),
        hide_skeletons INTEGER NOT NULL DEFAULT 0,
        added_at INTEGER NOT NULL,
        PRIMARY KEY (link_id, user_id)
      )
    `);
    this.addSql('CREATE INDEX IF NOT EXISTS idx_trip_journal_link_members_user ON trip_journal_link_members(user_id)');
  }
}
