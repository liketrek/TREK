import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { PushSubscriptionsRepository } from '../repositories/PushSubscriptions.repository';
import { Users } from './Users.entity';

export class PushSubscriptions {
  [EntityRepositoryType]?: PushSubscriptionsRepository;
  id!: number & Opt;
  user!: Ref<Users>;
  user_id!: number;
  endpoint!: string;
  p256dh!: string;
  auth!: string;
  vapid_public_key!: string;
  user_agent?: string | null;
  created_at!: string & Opt;
  last_success_at?: string | null;
  failure_count: number & Opt = 0;
}

export const PushSubscriptionsSchema = defineEntity({
  class: PushSubscriptions,
  repository: () => PushSubscriptionsRepository,
  uniques: [{ properties: ['endpoint'] }],
  properties: {
    id: p.integer().primary(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden().index('idx_push_subscriptions_user'),
    user_id: p.integer().persist(false).index('idx_push_subscriptions_user'),
    endpoint: p.text(),
    p256dh: p.text(),
    auth: p.text(),
    vapid_public_key: p.text(),
    user_agent: p.text().nullable(),
    created_at: p.text().defaultRaw(`CURRENT_TIMESTAMP`),
    last_success_at: p.text().nullable(),
    failure_count: p.integer().default(0),
  },
});
