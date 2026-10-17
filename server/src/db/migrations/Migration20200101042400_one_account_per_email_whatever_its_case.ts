import { Migration } from '@mikro-orm/migrations';

/** One email address, lowered, that more than one account holds: the ids of those accounts. */
interface DuplicateRow {
  ids: string;
}

/**
 * One account per email address, whatever its case.
 *
 * Login, password reset and the sign-up checks all match emails
 * case-insensitively, but the only constraint is the column's own UNIQUE,
 * which SQLite compares case-sensitively. Two accounts whose emails differ
 * only in case (a legacy row, two sign-ups at once) left a login to resolve to
 * whichever row came first. An index on lower(email) closes that in the
 * database, and gives the case-insensitive lookups an index to use.
 *
 * An install that already holds such a pair must still boot, so the index is
 * then left out, the pair is named in the log, and `app_settings` remembers
 * that it is owed: `db/email-case-index.ts` creates it on the first boot after
 * the accounts were told apart. The app-level checks keep guarding meanwhile.
 */
export class Migration20200101042400_one_account_per_email_whatever_its_case extends Migration {
  override name = 'Migration20200101042400_one_account_per_email_whatever_its_case';

  override async up(): Promise<void> {
    const duplicates = (await this.execute(
      `SELECT group_concat(id, ', ') AS ids FROM (SELECT id, email FROM users ORDER BY id) ` +
        'GROUP BY lower(email) HAVING COUNT(*) > 1',
    )) as DuplicateRow[];

    if (duplicates.length > 0) {
      console.warn(
        `[migration] ${duplicates.length} email address(es) belong to more than one account when case is ignored ` +
          `(user ids ${duplicates.map((row) => row.ids).join('; ')}). The case-insensitive unique ` +
          'index on users.email is not created yet. Give each of those accounts its own address under ' +
          'Admin > Users (or delete the one nobody uses); the next start creates the index.',
      );
      this.addSql(`INSERT OR REPLACE INTO app_settings (key, value) VALUES ('email_case_index_pending', 'true')`);
      return;
    }

    this.addSql('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (lower(email))');
  }
}
