import { engineDdl } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * A session started through SSO remembers the identity provider's session it
 * came from, so the provider can end it again (OpenID Connect Back-Channel
 * Logout 1.0).
 *
 * `user_sessions.oidc_sid` holds the `sid` claim of the verified id_token the
 * login was made with. A logout token naming that `sid` ends only the TREK
 * sessions carrying it; one naming only the subject ends every session of the
 * account. The column is empty for every other way in (password, passkey,
 * demo, a renewal from a token issued before sessions were tracked) and for a
 * provider that sends no `sid`, and every existing row starts empty, so nothing
 * changes for a session that is already there.
 *
 * The index serves the logout token that names a `sid` without a subject: it is
 * looked up across every account of the provider.
 */
export class Migration20200101046510_a_session_knows_its_provider_session extends Migration {
  override name = 'Migration20200101046510_a_session_knows_its_provider_session';

  override up(): void {
    engineDdl(this, {
      sqlite: [
        'ALTER TABLE user_sessions ADD COLUMN oidc_sid TEXT',
        'CREATE INDEX idx_user_sessions_oidc_sid ON user_sessions(oidc_sid)',
      ],
      postgres: [
        'alter table "user_sessions" add column "oidc_sid" text null',
        'create index "idx_user_sessions_oidc_sid" on "user_sessions" ("oidc_sid")',
      ],
    });
  }
}
