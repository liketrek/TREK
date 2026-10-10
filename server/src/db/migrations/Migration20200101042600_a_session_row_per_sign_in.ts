import { Migration } from '@mikro-orm/migrations';

/**
 * One row per sign-in, so a session can end before its token expires.
 *
 * A session token used to be a signed JWT and nothing else: logging out only
 * cleared the cookie, a 30-day "remember me" token stayed valid wherever a
 * copy of it had ended up, and nobody could sign out one device without
 * changing the password. Every token issued from now on carries an id (the JWT
 * `jti`) naming a row here, and the auth check refuses a token whose row is
 * gone, revoked or expired.
 *
 * `id` is that `jti`, a random uuid. `expires_at` follows the token's own
 * expiry (sliding renewal moves both). `user_agent` is what the browser sent at
 * sign-in, cut to 256 characters like a Web Push device's, so a list of
 * sessions can tell them apart; no address is kept. Tokens issued before this
 * migration have no `jti` and keep working until they expire. Rows go with
 * their user, and a nightly job removes the expired and revoked ones.
 */
export class Migration20200101042600_a_session_row_per_sign_in extends Migration {
  override name = 'Migration20200101042600_a_session_row_per_sign_in';

  override async up(): Promise<void> {
    await this.execute(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id TEXT PRIMARY KEY NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        revoked_at DATETIME,
        user_agent TEXT
      )
    `);
    await this.execute('CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id)');
    await this.execute('CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at)');
  }
}
