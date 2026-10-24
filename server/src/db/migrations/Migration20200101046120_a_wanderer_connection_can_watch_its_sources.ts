import { Migration } from '@mikro-orm/migrations';

/**
 * WAN-02: a user may let TREK look now and then whether the wanderer trails
 * they imported moved on since.
 *
 * `wanderer_connections` gets the switch, off for every existing connection,
 * and what the background look needs to stay polite: when it last ran, how
 * many runs in a row failed and until when it waits before it asks the
 * instance again.
 *
 * `tour_source_hints` holds what a look found about one snapshot's source, for
 * the user who imported it: the state (NULL while there is nothing to say,
 * which is never a claim that nothing changed), the parts the trail's record
 * proves changed, the reason a source could not be judged, the change time
 * the trail said at the look, and what the user last saw of the trail in a
 * manual check, which later looks compare against instead of the import. A
 * hint never touches the tour; it goes with its snapshot and with its user.
 */
export class Migration20200101046120_a_wanderer_connection_can_watch_its_sources extends Migration {
  override name = 'Migration20200101046120_a_wanderer_connection_can_watch_its_sources';

  override up(): void {
    this.addSql('ALTER TABLE wanderer_connections ADD COLUMN watch_enabled INTEGER NOT NULL DEFAULT 0');
    this.addSql('ALTER TABLE wanderer_connections ADD COLUMN watch_last_run_at TEXT');
    this.addSql('ALTER TABLE wanderer_connections ADD COLUMN watch_failures INTEGER NOT NULL DEFAULT 0');
    this.addSql('ALTER TABLE wanderer_connections ADD COLUMN watch_paused_until TEXT');
    this.addSql(`
      CREATE TABLE IF NOT EXISTS tour_source_hints (
        place_id INTEGER PRIMARY KEY REFERENCES tour_sources(place_id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        state TEXT CHECK (state IS NULL OR state IN ('possible_change', 'changed', 'unverifiable')),
        changes TEXT,
        reason TEXT CHECK (reason IS NULL OR reason IN ('unavailable', 'no_change_time')),
        external_updated TEXT,
        seen_hash TEXT,
        seen_updated TEXT,
        checked_at TEXT
      )
    `);
    this.addSql('CREATE INDEX IF NOT EXISTS idx_tour_source_hints_user_id ON tour_source_hints(user_id)');
  }
}
