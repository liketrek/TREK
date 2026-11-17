import { Migration } from '@mikro-orm/migrations';

/**
 * The hourly job that tells every forwarding address holder once that the mail
 * import is paused keeps its "already told" mark and its lease in
 * `mail_ingest_cursor`, as the `notice` reader. The CHECK from
 * Migration20200101046410 only knew `imap`, `cloud` and `pipeline`, so taking
 * that lease failed on the insert (an `ON CONFLICT DO NOTHING` does not cover a
 * CHECK) and nobody was ever told.
 *
 * SQLite cannot change a CHECK in place, so the table is rebuilt with `notice`
 * added. No table points at `mail_ingest_cursor` and it has no index of its own
 * beyond the `UNIQUE(transport, mailbox)`, so it is copied, dropped and renamed
 * on its own. Every row keeps its id, position and lease.
 */
export class Migration20200101046430_a_paused_mail_import_can_tell_its_address_holders extends Migration {
  override name = 'Migration20200101046430_a_paused_mail_import_can_tell_its_address_holders';

  override up(): void {
    this.addSql(`
      CREATE TABLE mail_ingest_cursor_new (
        id INTEGER PRIMARY KEY,
        transport TEXT NOT NULL CHECK(transport IN ('imap', 'cloud', 'pipeline', 'notice')),
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
      INSERT INTO mail_ingest_cursor_new (
        id, transport, mailbox, uid_validity, last_uid, last_ok_at, last_error, lease_owner, lease_until
      )
      SELECT id, transport, mailbox, uid_validity, last_uid, last_ok_at, last_error, lease_owner, lease_until
      FROM mail_ingest_cursor
    `);
    this.addSql('DROP TABLE mail_ingest_cursor');
    this.addSql('ALTER TABLE mail_ingest_cursor_new RENAME TO mail_ingest_cursor');
  }
}
