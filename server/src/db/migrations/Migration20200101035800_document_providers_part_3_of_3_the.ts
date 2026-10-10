import { Migration } from '@mikro-orm/migrations';

/**
 * Legacy migration step 238 (`db/migrations.ts`).
 *
 * Document providers, part 3 of 3: the pairing and its sync state.
 * `content_sha256` and `pushed_sha256` are two columns on purpose. The
 * first is the bytes both sides last agreed on, the second is what TREK
 * itself last uploaded. Collapsing them into one is precisely the mistake
 * that builds an echo loop: a webhook fires for TREK's own write, the core
 * cannot tell it from a stranger's edit, and the file bounces.
 * `remote_missing_at` records that something vanished upstream instead of
 * acting on it, the rule Dawarich already follows with `source_missing_at`.
 * An unmounted share answers with an empty listing, and reading that as
 * "everything was deleted" would empty a trip.
 * `file_id ON DELETE SET NULL` keeps a tombstone behind after a document is
 * permanently deleted in TREK, so the next run does not cheerfully download
 * it again.
 */
export class Migration20200101035800_document_providers_part_3_of_3_the extends Migration {
  override name = 'Migration20200101035800_document_providers_part_3_of_3_the';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS document_sync_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        link_id INTEGER NOT NULL REFERENCES trip_document_links(id) ON DELETE CASCADE,
        trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        file_id INTEGER REFERENCES trip_files(id) ON DELETE SET NULL,
        trek_doc_uid TEXT NOT NULL,
        remote_id TEXT,
        remote_name TEXT,
        remote_version TEXT,
        remote_size INTEGER,
        remote_modified_at TEXT,
        content_sha256 TEXT,
        pushed_sha256 TEXT,
        state TEXT NOT NULL DEFAULT 'pending',
        error_code TEXT,
        attempts INTEGER NOT NULL DEFAULT 0,
        next_attempt_at TEXT,
        remote_missing_at TEXT,
        first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        synced_at TEXT
      )
    `);

    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_document_sync_items_remote
      ON document_sync_items(link_id, remote_id) WHERE remote_id IS NOT NULL
    `);

    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_document_sync_items_file
      ON document_sync_items(link_id, file_id) WHERE file_id IS NOT NULL
    `);

    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_document_sync_items_uid
      ON document_sync_items(link_id, trek_doc_uid)
    `);

    this.addSql(`CREATE INDEX IF NOT EXISTS idx_document_sync_items_trip_state ON document_sync_items(trip_id, state)`);

    this.addSql(
      `CREATE INDEX IF NOT EXISTS idx_document_sync_items_hash ON document_sync_items(link_id, content_sha256)`,
    );

    this.addSql(
      `CREATE INDEX IF NOT EXISTS idx_document_sync_items_due ON document_sync_items(link_id, next_attempt_at)`,
    );
  }
}
