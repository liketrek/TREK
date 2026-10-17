import { currentTimestampKysely } from '../dialect/kysely-functions';
import { currentTimestamp } from '../dialect/sql-functions';
import type { WandererConnections } from '../entities/WandererConnections.entity';
import type { DB } from '../kysely/db';
import { TrekRepository } from './_shared/trek-repository';

/**
 * One user's wanderer connection as stored. `token` is the still-encrypted
 * value; the service decrypts it for a call and never hands it on.
 */
export interface WandererConnectionRow {
  user_id: number;
  url: string;
  token: string | null;
  allow_insecure_tls: number;
  last_checked_at: string | null;
  last_check_ok: number | null;
  last_check_error: string | null;
}

/**
 * `wanderer_connections`: one row per user who connected an instance, the
 * user id its primary key. Only the owner's own requests read or write it.
 */
export class WandererConnectionsRepository extends TrekRepository<WandererConnections> {
  private db() {
    return this.kysely<Pick<DB, 'wanderer_connections'>>();
  }

  private platform() {
    return this.getEntityManager().getPlatform();
  }

  async findRow(userId: number): Promise<WandererConnectionRow | null> {
    const row = await this.db()
      .selectFrom('wanderer_connections')
      .select(['user_id', 'url', 'token', 'allow_insecure_tls', 'last_checked_at', 'last_check_ok', 'last_check_error'])
      .where('user_id', '=', userId)
      .executeTakeFirst();
    return row ?? null;
  }

  /**
   * Write the address and the TLS choice, and the token when one is given:
   * `undefined` keeps the stored token, `null` drops it. A changed address
   * clears what the last check said, since it said it about another server.
   */
  async save(
    userId: number,
    data: { url: string; allowInsecureTls: boolean; token?: string | null; hostChanged: boolean },
  ): Promise<void> {
    const platform = this.platform();
    const tokenColumns = data.token !== undefined ? { token: data.token } : {};
    const checkColumns = data.hostChanged ? { last_checked_at: null, last_check_ok: null, last_check_error: null } : {};
    await this.db()
      .insertInto('wanderer_connections')
      .values({
        user_id: userId,
        url: data.url,
        allow_insecure_tls: data.allowInsecureTls ? 1 : 0,
        ...tokenColumns,
        updated_at: currentTimestampKysely(platform),
      })
      .onConflict((oc) =>
        oc.column('user_id').doUpdateSet({
          url: data.url,
          allow_insecure_tls: data.allowInsecureTls ? 1 : 0,
          ...tokenColumns,
          ...checkColumns,
          updated_at: () => currentTimestampKysely(platform),
        }),
      )
      .execute();
  }

  /** What the last test or call against the instance said, for the settings card. */
  async recordCheck(userId: number, ok: boolean, error: string | null): Promise<void> {
    await this.nativeUpdate(
      { user: userId },
      { last_checked_at: currentTimestamp(this.platform()), last_check_ok: ok ? 1 : 0, last_check_error: error },
    );
  }

  async remove(userId: number): Promise<void> {
    await this.nativeDelete({ user: userId });
  }
}
