import { Migration } from '@mikro-orm/migrations';

/**
 * A person forwards a booking mail to an address of their own, and TREK adds
 * the booking to the matching trip, or keeps it in an inbox with a reason.
 *
 * `mail_ingest_addresses` holds one row per forwarding address: the person's
 * own (`trip_id` null) or one for a single trip, which belongs to the member
 * who made it (`user_id`). The token is stored twice: its sha256 for the
 * lookup, and encrypted so its owner can see the address again. A renewed or
 * revoked address keeps its row with `revoked_at` set, so a mail to it is
 * recognised and refused.
 *
 * `mail_ingest_prefs` holds a person's switches (import, AI reading, adding
 * on its own or asking first); without a row every switch is on.
 *
 * `mail_ingest_cursor` is the position and the lease of a reader: an IMAP box
 * by (uid_validity, last_uid), and the processing pipeline itself, so two
 * processes on one database never read the same mail at once.
 *
 * `mail_ingest_messages` holds each mail as it arrived, encrypted
 * (`raw_eml_enc`) until the retention job purges it, with what the
 * pipeline made of it. `dedupe_hash` keeps a mail delivered twice from
 * being read twice.
 *
 * `mail_ingest_candidates` holds each booking read from a mail, the server's
 * checks on it, the trip it went to or was suggested for, and what became of
 * it: the ids it created (for the undo, open until `undo_until`), or why it
 * waits in the inbox.
 *
 * Every row goes with its person; a trip that goes clears its references, so
 * the inbox entry stays and can be filed elsewhere. Every foreign key leads
 * an index.
 */
export class Migration20200101046410_a_forwarded_booking_mail_lands_in_its_trip extends Migration {
  override name = 'Migration20200101046410_a_forwarded_booking_mail_lands_in_its_trip';

  override up(): void {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS mail_ingest_addresses (
        id INTEGER PRIMARY KEY,
        token_hash TEXT NOT NULL,
        token_enc TEXT NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        revoked_at DATETIME,
        last_used_at DATETIME,
        UNIQUE(token_hash)
      )
    `);
    this.addSql('CREATE INDEX IF NOT EXISTS idx_mail_ingest_addresses_user ON mail_ingest_addresses(user_id, trip_id)');
    this.addSql('CREATE INDEX IF NOT EXISTS idx_mail_ingest_addresses_trip ON mail_ingest_addresses(trip_id)');

    this.addSql(`
      CREATE TABLE IF NOT EXISTS mail_ingest_prefs (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        enabled INTEGER NOT NULL DEFAULT 1,
        ai_enabled INTEGER NOT NULL DEFAULT 1,
        auto_add INTEGER NOT NULL DEFAULT 1,
        UNIQUE(user_id)
      )
    `);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS mail_ingest_cursor (
        id INTEGER PRIMARY KEY,
        transport TEXT NOT NULL CHECK(transport IN ('imap', 'cloud', 'pipeline')),
        mailbox TEXT NOT NULL,
        uid_validity INTEGER,
        last_uid INTEGER,
        last_ok_at DATETIME,
        last_error TEXT,
        lease_owner TEXT,
        lease_until DATETIME,
        UNIQUE(transport, mailbox)
      )
    `);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS mail_ingest_messages (
        id INTEGER PRIMARY KEY,
        transport TEXT NOT NULL CHECK(transport IN ('imap', 'webhook', 'cloud', 'upload')),
        message_id_hdr TEXT,
        dedupe_hash TEXT NOT NULL,
        address_id INTEGER REFERENCES mail_ingest_addresses(id) ON DELETE SET NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
        from_addr TEXT,
        from_verified INTEGER NOT NULL DEFAULT 0,
        auth_results TEXT,
        subject TEXT,
        received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        size INTEGER NOT NULL,
        raw_eml_enc TEXT,
        raw_purged_at DATETIME,
        status TEXT NOT NULL DEFAULT 'queued'
          CHECK(status IN ('queued', 'processing', 'processed', 'discarded', 'failed')),
        reason TEXT,
        hints TEXT,
        attachments TEXT,
        forwarding_code TEXT,
        attempts INTEGER NOT NULL DEFAULT 0,
        next_attempt_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        lease_until DATETIME,
        ai_used INTEGER NOT NULL DEFAULT 0,
        processed_at DATETIME,
        UNIQUE(dedupe_hash)
      )
    `);
    this.addSql(
      'CREATE INDEX IF NOT EXISTS idx_mail_ingest_messages_due ON mail_ingest_messages(status, next_attempt_at)',
    );
    this.addSql(
      'CREATE INDEX IF NOT EXISTS idx_mail_ingest_messages_user ON mail_ingest_messages(user_id, received_at)',
    );
    this.addSql(
      'CREATE INDEX IF NOT EXISTS idx_mail_ingest_messages_address ON mail_ingest_messages(address_id, received_at)',
    );
    this.addSql('CREATE INDEX IF NOT EXISTS idx_mail_ingest_messages_trip ON mail_ingest_messages(trip_id)');

    this.addSql(`
      CREATE TABLE IF NOT EXISTS mail_ingest_candidates (
        id INTEGER PRIMARY KEY,
        message_id INTEGER NOT NULL REFERENCES mail_ingest_messages(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        position INTEGER NOT NULL DEFAULT 0,
        item_json TEXT,
        source TEXT CHECK(source IN ('ai', 'kitinerary', 'json_ld', 'ics', 'pkpass', 'text')),
        checks_json TEXT,
        uncertain_fields TEXT,
        match_json TEXT,
        suggested_trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
        dedupe_key TEXT,
        content_hash TEXT,
        resolution TEXT NOT NULL DEFAULT 'pending'
          CHECK(resolution IN ('pending', 'auto_applied', 'applied', 'filed', 'discarded', 'duplicate', 'conflict',
            'undone')),
        reason TEXT,
        resolved_trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
        created_ids_json TEXT,
        attach_error TEXT,
        resolved_by INTEGER,
        resolved_at DATETIME,
        undo_until DATETIME,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.addSql(
      'CREATE INDEX IF NOT EXISTS idx_mail_ingest_candidates_message ON mail_ingest_candidates(message_id, position)',
    );
    this.addSql(
      'CREATE INDEX IF NOT EXISTS idx_mail_ingest_candidates_user ON mail_ingest_candidates(user_id, resolution)',
    );
    this.addSql(
      'CREATE INDEX IF NOT EXISTS idx_mail_ingest_candidates_suggested ON mail_ingest_candidates(suggested_trip_id)',
    );
    this.addSql(
      'CREATE INDEX IF NOT EXISTS idx_mail_ingest_candidates_resolved ON mail_ingest_candidates(resolved_trip_id, content_hash)',
    );
  }
}
