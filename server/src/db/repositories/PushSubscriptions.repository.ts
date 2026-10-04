import type { PushSubscriptions } from '../entities/PushSubscriptions.entity';
import { columnIncrementedBy, currentTimestamp, currentTimestampKysely } from '../dialect/sql-functions';
import type { AssertRowKeys } from './_shared/rows';
import { TrekRepository } from './_shared/trek-repository';

/** A `push_subscriptions` row exactly as `SELECT *` reads it (Web Push, #894). */
export interface PushSubscriptionRow {
  id: number;
  user_id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  vapid_public_key: string;
  user_agent: string | null;
  created_at: string;
  last_success_at: string | null;
  failure_count: number;
}

const _pushSubscriptionRowKeys: AssertRowKeys<PushSubscriptionRow, PushSubscriptions> = true;

interface PushSubscriptionsKyselyDB {
  push_subscriptions: PushSubscriptionRow;
}

/** The columns PS1's INSERT binds; the rest come from their defaults. */
interface PushSubscriptionsInsertKyselyDB {
  push_subscriptions: {
    user_id: number;
    endpoint: string;
    p256dh: string;
    auth: string;
    vapid_public_key: string;
    user_agent: string | null;
    created_at: string;
    failure_count: number;
  };
}

/** `push_subscriptions` — one row per browser a user switched Web Push on in. */
export class PushSubscriptionsRepository extends TrekRepository<PushSubscriptions> {
  private readDb() {
    return this.kysely<PushSubscriptionsKyselyDB>();
  }

  /**
   * PS1 (`PushSubscriptionsService.upsert`) —
   * ```sql
   * INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, vapid_public_key, user_agent)
   * VALUES (?, ?, ?, ?, ?, ?)
   * ON CONFLICT(endpoint) DO UPDATE SET
   *   user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth,
   *   vapid_public_key = excluded.vapid_public_key, user_agent = excluded.user_agent,
   *   created_at = CURRENT_TIMESTAMP, failure_count = 0
   * ```
   * `created_at`/`failure_count` are bound on the insert half too, with the
   * values their column defaults would give (`CURRENT_TIMESTAMP`, `0`), so the
   * fresh row reads exactly as the legacy one did.
   */
  async upsertSubscription(data: {
    user_id: number;
    endpoint: string;
    p256dh: string;
    auth: string;
    vapid_public_key: string;
    user_agent: string | null;
  }): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.kysely<PushSubscriptionsInsertKyselyDB>()
      .insertInto('push_subscriptions')
      .values({ ...data, created_at: currentTimestampKysely(platform), failure_count: 0 })
      .onConflict((oc) =>
        oc.column('endpoint').doUpdateSet({
          user_id: (eb) => eb.ref('excluded.user_id'),
          p256dh: (eb) => eb.ref('excluded.p256dh'),
          auth: (eb) => eb.ref('excluded.auth'),
          vapid_public_key: (eb) => eb.ref('excluded.vapid_public_key'),
          user_agent: (eb) => eb.ref('excluded.user_agent'),
          created_at: () => currentTimestampKysely(platform),
          failure_count: 0,
        }),
      )
      .execute();
  }

  /**
   * PS2 (`PushSubscriptionsService.upsert`, the device cap) —
   * ```sql
   * DELETE FROM push_subscriptions WHERE id IN (
   *   SELECT id FROM push_subscriptions WHERE user_id = ? AND endpoint <> ?
   *   ORDER BY created_at ASC, id ASC LIMIT ?)
   * ```
   */
  async deleteOldestForUser(userId: number, keepEndpoint: string, limit: number): Promise<void> {
    await this.readDb()
      .deleteFrom('push_subscriptions')
      .where('id', 'in', (eb) =>
        eb
          .selectFrom('push_subscriptions')
          .select('id')
          .where('user_id', '=', userId)
          .where('endpoint', '<>', keepEndpoint)
          .orderBy('created_at', 'asc')
          .orderBy('id', 'asc')
          .limit(limit),
      )
      .execute();
  }

  /** PS3 (`removeForUser`) — `DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?`; answers whether a row went. */
  async deleteForUserEndpoint(userId: number, endpoint: string): Promise<boolean> {
    return (await this.nativeDelete({ user: userId, endpoint })) > 0;
  }

  /** PS4 (`listForUser`) — `SELECT * FROM push_subscriptions WHERE user_id = ? ORDER BY id`. */
  async listForUser(userId: number): Promise<PushSubscriptionRow[]> {
    return await this.readDb()
      .selectFrom('push_subscriptions')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('id')
      .execute();
  }

  /** PS5 (`countForUser`) — `SELECT COUNT(*) AS n FROM push_subscriptions WHERE user_id = ?`. */
  async countForUser(userId: number): Promise<number> {
    return await this.count({ user: userId });
  }

  /** PS6 (`hasAny`) — `SELECT 1 FROM push_subscriptions WHERE user_id = ? LIMIT 1`. */
  async hasAnyForUser(userId: number): Promise<boolean> {
    const row = await this.readDb()
      .selectFrom('push_subscriptions')
      .select('id')
      .where('user_id', '=', userId)
      .limit(1)
      .executeTakeFirst();
    return row !== undefined;
  }

  /**
   * `DELETE FROM push_subscriptions WHERE user_id = ?` — a password change, a
   * reset or an admin setting a password drops every device with the other
   * credentials (AuthService, AdminService), since a device outlives every session.
   */
  async deleteAllForUser(userId: number): Promise<void> {
    await this.nativeDelete({ user: userId });
  }

  /** PS7 (`deleteById`) — `DELETE FROM push_subscriptions WHERE id = ?`. */
  async deleteSubscription(id: number): Promise<void> {
    await this.nativeDelete({ id });
  }

  /** PS8 (`recordSuccess`) — `UPDATE push_subscriptions SET last_success_at = CURRENT_TIMESTAMP, failure_count = 0 WHERE id = ?`. */
  async recordSuccess(id: number): Promise<void> {
    const platform = this.getEntityManager().getPlatform();
    await this.nativeUpdate({ id }, { last_success_at: currentTimestamp(platform), failure_count: 0 });
  }

  /**
   * PS9 (`recordFailure`) —
   * `UPDATE push_subscriptions SET failure_count = failure_count + 1 WHERE id = ? RETURNING failure_count`.
   * One statement, so two sends at once cannot both see the old count. 0 when
   * the row is gone already.
   */
  async incrementFailureCount(id: number): Promise<number> {
    const platform = this.getEntityManager().getPlatform();
    const result = await this.qb()
      .update({ failure_count: columnIncrementedBy(platform, 'failure_count', 1) })
      .where({ id })
      .returning('failure_count')
      .execute('run');
    const row = result.row as { failure_count?: number } | undefined;
    return row?.failure_count ?? 0;
  }
}
