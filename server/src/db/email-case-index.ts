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

  // Grouped here rather than with group_concat, which Postgres spells string_agg.
  const rows: Array<{ id: number; email_key: string }> = await connection.execute(
    `SELECT id, lower(email) AS email_key FROM users WHERE lower(email) IN ` +
      `(SELECT lower(email) FROM users GROUP BY lower(email) HAVING COUNT(*) > 1) ORDER BY id`,
  );
  const duplicates = new Map<string, number[]>();
  for (const row of rows) {
    const group = duplicates.get(row.email_key);
    if (group) group.push(row.id);
    else duplicates.set(row.email_key, [row.id]);
  }
  if (duplicates.size > 0) {
    const ids = [...duplicates.values()].map((group) => group.join(', '));
    console.warn(
      `[DB] ${duplicates.size} email address(es) still belong to more than one account when case is ignored ` +
        `(user ids ${ids.join('; ')}), so users.email has no case-insensitive unique ` +
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
