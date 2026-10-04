import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { PushSubscriptions } from '../../../db/entities/PushSubscriptions.entity';
import type {
  PushSubscriptionRow,
  PushSubscriptionsRepository,
} from '../../../db/repositories/PushSubscriptions.repository';
import { UnitOfWork } from '../../database/unit-of-work';
import type { CheckedPushSubscription } from './push-subscription.helpers';

export type { PushSubscriptionRow } from '../../../db/repositories/PushSubscriptions.repository';

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
  constructor(
    @InjectRepository(PushSubscriptions) private readonly repo: PushSubscriptionsRepository,
    private readonly uow: UnitOfWork,
  ) {}

  /**
   * Register a browser, or refresh it when it subscribes again. The endpoint
   * is unique, so a browser shared by two accounts moves to whoever subscribed
   * on it last instead of notifying both. A refresh renews created_at, which
   * makes the cap drop the device that registered longest ago rather than one
   * that is in daily use. Answers how many devices the user now has.
   */
  async upsert(
    userId: number,
    subscription: CheckedPushSubscription,
    vapidPublicKey: string,
    userAgent?: string | null,
  ): Promise<number> {
    const agent = userAgent ? userAgent.slice(0, USER_AGENT_MAX_LENGTH) : null;
    return await this.uow.transactional(async () => {
      await this.repo.upsertSubscription({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
        vapid_public_key: vapidPublicKey,
        user_agent: agent,
      }); // PS1
      const overflow = (await this.countForUser(userId)) - MAX_PUSH_DEVICES_PER_USER;
      if (overflow > 0) {
        await this.repo.deleteOldestForUser(userId, subscription.endpoint, overflow); // PS2
      }
      return await this.countForUser(userId);
    });
  }

  /** Forget one of the caller's own browsers. Someone else's endpoint is never touched. */
  async removeForUser(userId: number, endpoint: string): Promise<boolean> {
    return await this.repo.deleteForUserEndpoint(userId, endpoint); // PS3
  }

  async listForUser(userId: number): Promise<PushSubscriptionRow[]> {
    return await this.repo.listForUser(userId); // PS4
  }

  async countForUser(userId: number): Promise<number> {
    return await this.repo.countForUser(userId); // PS5
  }

  async hasAny(userId: number): Promise<boolean> {
    return await this.repo.hasAnyForUser(userId); // PS6
  }

  /** The sender's clean-up: the push service said the browser is gone, or the row can no longer be sent to. */
  async deleteById(id: number): Promise<void> {
    await this.repo.deleteSubscription(id); // PS7
  }

  async recordSuccess(id: number): Promise<void> {
    await this.repo.recordSuccess(id); // PS8
  }

  /**
   * Counts one more failed send since the last success and answers the new
   * count, read in the same statement so two sends at once cannot both see
   * the old value. 0 when the row is gone already.
   */
  async recordFailure(id: number): Promise<number> {
    return await this.repo.incrementFailureCount(id); // PS9
  }
}
