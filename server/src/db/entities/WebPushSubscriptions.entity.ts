import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { WebPushSubscriptionsRepository } from '../repositories/WebPushSubscriptions.repository';
import { DbTimestampType } from '../types';
import { Users } from './Users.entity';

export class WebPushSubscriptions {
  [EntityRepositoryType]?: WebPushSubscriptionsRepository;
  id!: number & Opt;
  user!: Ref<Users>;
  user_id!: number;
  installation_id!: string;
  endpoint_hash!: string;
  subscription_encrypted!: string;
  origin!: string;
  vapid_key_fingerprint!: string;
  label!: string;
  status: string & Opt = 'active';
  created_at!: string & Opt;
  updated_at!: string & Opt;
  last_seen_at!: string & Opt;
  last_success_at?: string | null;
  last_error_at?: string | null;
  revoked_at?: string | null;
}

export const WebPushSubscriptionsSchema = defineEntity({
  class: WebPushSubscriptions,
  repository: () => WebPushSubscriptionsRepository,
  indexes: [
    {
      name: 'idx_web_push_delivery',
      properties: ['user_id', 'status', 'origin', 'vapid_key_fingerprint'],
    },
    {
      name: 'idx_web_push_user_status',
      properties: ['user_id', 'status', 'updated_at'],
    },
  ],
  uniques: [
    { properties: ['user', 'installation_id'] },
    { properties: ['endpoint_hash'] },
  ],
  properties: {
    id: p.integer().primary(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    installation_id: p.text(),
    endpoint_hash: p.text(),
    subscription_encrypted: p.text(),
    origin: p.text(),
    vapid_key_fingerprint: p.text(),
    label: p.text(),
    status: p.text().default('active'),
    created_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
    updated_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
    last_seen_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
    last_success_at: p.type(DbTimestampType).nullable(),
    last_error_at: p.type(DbTimestampType).nullable(),
    revoked_at: p.type(DbTimestampType).nullable(),
  },
});
