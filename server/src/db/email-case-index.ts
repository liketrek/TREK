import type { Connection } from '@mikro-orm/core';

/**
 * The case-insensitive unique index on users.email, when its migration had to
 * leave it out.
 *
 * `Migration20200101042400_one_account_per_email_whatever_its_case` creates
 * `idx_users_email_lower` unless two accounts already share an address in
 * different case; then it records `email_case_index_pending` and the install
 * boots without it. A migration runs once, so this runs on every boot while
 * that flag is set: once the accounts were told apart it creates the index and
 * clears the flag, until then it repeats the warning.
 */

const PENDING_KEY = 'email_case_index_pending';

export async function ensureEmailCaseIndex(connection: Connection): Promise<void> {
  const pending: unknown[] = await connection.execute(`SELECT value FROM app_settings WHERE key = ?`, [PENDING_KEY]);
  if (pending.length === 0) return;

  const duplicates: Array<{ ids: string }> = await connection.execute(
    `SELECT group_concat(id, ', ') AS ids FROM (SELECT id, email FROM users ORDER BY id) GROUP BY lower(email) HAVING COUNT(*) > 1`,
  );
  if (duplicates.length > 0) {
    console.warn(
      `[DB] ${duplicates.length} email address(es) still belong to more than one account when case is ignored ` +
        `(user ids ${duplicates.map((row) => row.ids).join('; ')}), so users.email has no case-insensitive unique ` +
        'index yet. Give each of those accounts its own address under Admin > Users; the next start creates it.',
    );
    return;
  }

  await connection.transactional(async (trx) => {
    await connection.execute(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (lower(email))',
      [],
      'run',
      trx,
    );
    await connection.execute('DELETE FROM app_settings WHERE key = ?', [PENDING_KEY], 'run', trx);
  });
  console.log(
    '[DB] Every account has its own email address now; created the case-insensitive unique index on users.email',
  );
}
