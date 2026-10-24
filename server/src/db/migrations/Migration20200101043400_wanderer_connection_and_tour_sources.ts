import { Migration } from '@mikro-orm/migrations';

/**
 * A personal wanderer connection, and where an imported tour came from.
 *
 * `wanderer_connections` holds one user's instance address and API token, the
 * token encrypted like every other integration credential. It is the user's
 * own and is never shared with a trip; what a trip gets is the snapshot.
 *
 * `tour_sources` records, for a tour copied in from an outside source, which
 * source it was (the provider, the instance, the trail's id there), when it was
 * copied and two fingerprints: the content as the source delivered it, to tell
 * on a later import whether the source changed, and the tour as it was saved
 * here, to tell whether it was changed since. It is not wanderer-specific, so
 * other sources can record their provenance the same way. It goes with its tour.
 */
export class Migration20200101043400_wanderer_connection_and_tour_sources extends Migration {
  override name = 'Migration20200101043400_wanderer_connection_and_tour_sources';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS wanderer_connections (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        token TEXT,
        allow_insecure_tls INTEGER NOT NULL DEFAULT 0,
        last_checked_at TEXT,
        last_check_ok INTEGER,
        last_check_error TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.addSql(`
      CREATE TABLE IF NOT EXISTS tour_sources (
        place_id INTEGER PRIMARY KEY REFERENCES tours(place_id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        instance TEXT NOT NULL,
        external_id TEXT NOT NULL,
        external_url TEXT,
        external_updated TEXT,
        content_hash TEXT NOT NULL,
        local_hash TEXT NOT NULL,
        imported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        imported_by INTEGER REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    this.addSql(
      'CREATE INDEX IF NOT EXISTS idx_tour_sources_external ON tour_sources(provider, instance, external_id)',
    );
    this.addSql('CREATE INDEX IF NOT EXISTS idx_tour_sources_imported_by ON tour_sources(imported_by)');
  }
}
