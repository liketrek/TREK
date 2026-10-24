import { Migration } from '@mikro-orm/migrations';

/**
 * Timestamps the app wrote in JavaScript's ISO spelling are stored in the
 * spelling of every other DATETIME column.
 *
 * Every DATETIME column holds `YYYY-MM-DD HH:MM:SS` in UTC, the text SQLite's
 * `CURRENT_TIMESTAMP` writes. Four columns were also written with
 * `toISOString()` (`2026-01-02T03:04:05.678Z`): a collection's `updated_at`
 * after an edit or a new cover, a password reset link's expiry, and the two
 * expiries of an OAuth token. The two spellings do not compare as text, so a
 * SQL `refresh_token_expires_at > CURRENT_TIMESTAMP` kept a token listed as
 * live until the end of the day it expired. The writers now use the canonical
 * spelling, and this turns the rows they left behind into it: the date, a
 * space, the time to the second.
 *
 * Only values in the full ISO shape with a trailing `Z` are touched, so the
 * statement can run again without changing anything.
 */
export class Migration20200101042700_timestamps_stored_in_one_spelling extends Migration {
  override name = 'Migration20200101042700_timestamps_stored_in_one_spelling';

  override async up(): Promise<void> {
    const columns: Array<[table: string, column: string]> = [
      ['collections', 'updated_at'],
      ['password_reset_tokens', 'expires_at'],
      ['oauth_tokens', 'access_token_expires_at'],
      ['oauth_tokens', 'refresh_token_expires_at'],
    ];
    for (const [table, column] of columns) {
      await this.execute(
        `UPDATE ${table} SET ${column} = replace(substr(${column}, 1, 19), 'T', ' ') ` +
          `WHERE ${column} LIKE '____-__-__T__:__:__%Z'`,
      );
    }
  }
}
