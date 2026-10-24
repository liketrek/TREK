import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 237 (`db/migrations.ts`).
 *
 * Document providers, part 2 of 3: the connection, and the trip binding.
 * The connection carries a `trip_id`, and that is the one place this design
 * departs from every integration already in the repo. Immich, Synology
 * Photos, AirTrail and Dawarich all hang off a user, and even
 * `trip_album_links` carries a `user_id`; photos become visible to the rest
 * of a trip only through an opt-in `shared` flag. None of that can satisfy
 * "everyone on the trip sees the same documents": it would make a
 * document's visibility depend on whose credentials fetched it. So the trip
 * admin binds the trip once, the server talks to the provider under that
 * single identity, and TREK's own membership decides who sees what.
 * `owner_user_id` stays separate from `trip_id` so the credential holder is
 * always explicit: when that person leaves the trip the binding goes to
 * `orphaned` rather than silently continuing to use an ex-member's token.
 * Secrets live in one encrypted JSON blob instead of per-provider columns:
 * a sixth provider then needs no migration, and the key rotation in
 * scripts/migrate-encryption.ts stays one line instead of a field list that
 * someone will forget, and a forgotten column does not survive a rotation.
 */
export class Migration20200101035700_document_providers_part_2_of_3_the extends Migration {
  override name = 'Migration20200101035700_document_providers_part_2_of_3_the';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS document_connections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        provider_id TEXT NOT NULL REFERENCES document_providers(id) ON DELETE CASCADE,
        owner_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        base_url TEXT NOT NULL,
        secrets TEXT,
        settings TEXT NOT NULL DEFAULT '{}',
        allow_insecure_tls INTEGER NOT NULL DEFAULT 0,
        capabilities TEXT,
        last_probe_at TEXT,
        last_probe_state TEXT NOT NULL DEFAULT 'never',
        last_probe_error TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(trip_id, provider_id)
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_document_connections_trip ON document_connections(trip_id)`);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_document_connections_owner ON document_connections(owner_user_id)`);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS trip_document_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        connection_id INTEGER NOT NULL REFERENCES document_connections(id) ON DELETE CASCADE,
        provider_id TEXT NOT NULL,
        remote_scope_key TEXT NOT NULL,
        remote_root_id TEXT,
        remote_root_path TEXT,
        remote_label TEXT NOT NULL DEFAULT '',
        direction TEXT NOT NULL DEFAULT 'both',
        delete_policy TEXT NOT NULL DEFAULT 'unlink',
        conflict_policy TEXT NOT NULL DEFAULT 'manual',
        sync_enabled INTEGER NOT NULL DEFAULT 1,
        webhook_token TEXT,
        webhook_secret TEXT,
        webhook_subscription_id TEXT,
        remote_cursor TEXT,
        last_sync_at TEXT,
        last_sync_state TEXT NOT NULL DEFAULT 'never',
        last_sync_error TEXT,
        failure_count INTEGER NOT NULL DEFAULT 0,
        next_attempt_at TEXT,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(trip_id, connection_id, remote_scope_key)
      )
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_trip_document_links_trip ON trip_document_links(trip_id)`);

    this.addSql(
      `CREATE INDEX IF NOT EXISTS idx_trip_document_links_due ON trip_document_links(sync_enabled, next_attempt_at)`,
    );

    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_trip_document_links_token
      ON trip_document_links(webhook_token) WHERE webhook_token IS NOT NULL
    `);
  }
}
