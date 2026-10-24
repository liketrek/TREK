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

/** WAN-02: the background watch of one connection, as stored. */
interface WandererWatchRow {
  watch_enabled: number;
  watch_last_run_at: string | null;
  watch_failures: number;
  watch_paused_until: string | null;
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
   * `undefined` keeps the stored token, `null` drops it. A changed address or
   * a new token clears what the last check said, since it said it about
   * another server or another token (a refused token stops the watch, WAN-02).
   */
  async save(
    userId: number,
    data: { url: string; allowInsecureTls: boolean; token?: string | null; hostChanged: boolean },
  ): Promise<void> {
    const platform = this.platform();
    const tokenColumns = data.token !== undefined ? { token: data.token } : {};
    // What the last check said was said about another server, or about another token.
    const freshCredentials = data.hostChanged || (data.token !== undefined && data.token !== null);
    const checkColumns = freshCredentials ? { last_checked_at: null, last_check_ok: null, last_check_error: null } : {};
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

  /** WAN-02: the watch of the user's connection; undefined without a connection. */
  async findWatch(userId: number): Promise<WandererWatchRow | undefined> {
    return await this.db()
      .selectFrom('wanderer_connections')
      .select(['watch_enabled', 'watch_last_run_at', 'watch_failures', 'watch_paused_until'])
      .where('user_id', '=', userId)
      .executeTakeFirst();
  }

  /** Switches the watch on or off. Switching it on starts afresh, without the pause an earlier failure left. */
  async setWatch(userId: number, enabled: boolean): Promise<void> {
    await this.nativeUpdate(
      { user: userId },
      enabled ? { watch_enabled: 1, watch_failures: 0, watch_paused_until: null } : { watch_enabled: 0 },
    );
  }

  /**
   * The connections the watch may ask now: switched on, holding a token
   * wanderer has not refused, and not waiting out a pause. The ones that
   * waited longest come first, at most `limit` of them.
   */
  async listWatchable(now: string, limit: number): Promise<number[]> {
    const rows = await this.db()
      .selectFrom('wanderer_connections')
      .select('user_id')
      .where('watch_enabled', '=', 1)
      .where('token', 'is not', null)
      .where((eb) => eb.or([eb('last_check_error', 'is', null), eb('last_check_error', '!=', 'unauthorized')]))
      .where((eb) => eb.or([eb('watch_paused_until', 'is', null), eb('watch_paused_until', '<=', now)]))
      .orderBy((eb) => eb.fn.coalesce('watch_last_run_at', eb.val('')))
      .orderBy('user_id')
      .limit(limit)
      .execute();
    return rows.map((row) => row.user_id);
  }

  /** How a run of the watch went: when it ended, how many failed in a row and until when to wait. */
  async recordWatchRun(
    userId: number,
    run: { lastRunAt: string; failures: number; pausedUntil: string | null },
  ): Promise<void> {
    await this.nativeUpdate(
      { user: userId },
      { watch_last_run_at: run.lastRunAt, watch_failures: run.failures, watch_paused_until: run.pausedUntil },
    );
  }

  async remove(userId: number): Promise<void> {
    await this.nativeDelete({ user: userId });
  }
}
