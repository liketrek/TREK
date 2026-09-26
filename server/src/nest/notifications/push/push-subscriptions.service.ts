import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import type { CheckedPushSubscription } from './push-subscription.helpers';

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

/**
 * How many browsers one account can receive push on. Generous for phones,
 * tablets and a few desktop profiles; the cap only exists so a client that
 * subscribes in a loop cannot grow the table or the fan-out without bound.
 */
export const MAX_PUSH_DEVICES_PER_USER = 20;

/** Only there to tell one user's devices apart in the table, never parsed, so a cut-off one does no harm. */
const USER_AGENT_MAX_LENGTH = 256;

/**
 * The push_subscriptions table: one row per browser a user switched push on
 * in. Only rows the checks in push-subscription.helpers.ts accepted get here.
 */
@Injectable()
export class PushSubscriptionsService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Register a browser, or refresh it when it subscribes again. The endpoint
   * is unique, so a browser shared by two accounts moves to whoever subscribed
   * on it last instead of notifying both. A refresh renews created_at, which
   * makes the cap drop the device that registered longest ago rather than one
   * that is in daily use. Answers how many devices the user now has.
   */
  upsert(
    userId: number,
    subscription: CheckedPushSubscription,
    vapidPublicKey: string,
    userAgent?: string | null,
  ): number {
    const agent = userAgent ? userAgent.slice(0, USER_AGENT_MAX_LENGTH) : null;
    return this.db.transaction(() => {
      this.db.run(
        `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, vapid_public_key, user_agent)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(endpoint) DO UPDATE SET
           user_id = excluded.user_id,
           p256dh = excluded.p256dh,
           auth = excluded.auth,
           vapid_public_key = excluded.vapid_public_key,
           user_agent = excluded.user_agent,
           created_at = CURRENT_TIMESTAMP,
           failure_count = 0`,
        userId,
        subscription.endpoint,
        subscription.p256dh,
        subscription.auth,
        vapidPublicKey,
        agent,
      );
      const overflow = this.countForUser(userId) - MAX_PUSH_DEVICES_PER_USER;
      if (overflow > 0) {
        this.db.run(
          `DELETE FROM push_subscriptions WHERE id IN (
             SELECT id FROM push_subscriptions
             WHERE user_id = ? AND endpoint <> ?
             ORDER BY created_at ASC, id ASC
             LIMIT ?
           )`,
          userId,
          subscription.endpoint,
          overflow,
        );
      }
      return this.countForUser(userId);
    });
  }

  /** Forget one of the caller's own browsers. Someone else's endpoint is never touched. */
  removeForUser(userId: number, endpoint: string): boolean {
    return (
      this.db.run('DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?', userId, endpoint).changes > 0
    );
  }

  listForUser(userId: number): PushSubscriptionRow[] {
    return this.db.all<PushSubscriptionRow>('SELECT * FROM push_subscriptions WHERE user_id = ? ORDER BY id', userId);
  }

  countForUser(userId: number): number {
    return this.db.get<{ n: number }>('SELECT COUNT(*) AS n FROM push_subscriptions WHERE user_id = ?', userId)?.n ?? 0;
  }

  hasAny(userId: number): boolean {
    return !!this.db.get('SELECT 1 FROM push_subscriptions WHERE user_id = ? LIMIT 1', userId);
  }

  /** The sender's clean-up: the push service said the browser is gone, or the row can no longer be sent to. */
  deleteById(id: number): void {
    this.db.run('DELETE FROM push_subscriptions WHERE id = ?', id);
  }

  recordSuccess(id: number): void {
    this.db.run(
      'UPDATE push_subscriptions SET last_success_at = CURRENT_TIMESTAMP, failure_count = 0 WHERE id = ?',
      id,
    );
  }

  /**
   * Counts one more failed send since the last success and answers the new
   * count, read in the same statement so two sends at once cannot both see
   * the old value. 0 when the row is gone already.
   */
  recordFailure(id: number): number {
    return (
      this.db.get<{ failure_count: number }>(
        'UPDATE push_subscriptions SET failure_count = failure_count + 1 WHERE id = ? RETURNING failure_count',
        id,
      )?.failure_count ?? 0
    );
  }
}
