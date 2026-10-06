import { EntityRepositoryType, type Opt, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { IdempotencyKeysRepository } from '../repositories/IdempotencyKeys.repository';
import { Users } from './Users.entity';

export class IdempotencyKeys {
  [EntityRepositoryType]?: IdempotencyKeysRepository;
  [PrimaryKeyProp]?: ['key', 'user', 'method', 'path'];
  key!: string;
  user!: Ref<Users>;
  user_id!: number;
  method!: string;
  path!: string;
  status_code!: number;
  response_body!: string;
  created_at!: number & Opt;
}

export const IdempotencyKeysSchema = defineEntity({
  class: IdempotencyKeys,
  repository: () => IdempotencyKeysRepository,
  uniques: [{ properties: ['key', 'user', 'method', 'path'] }],
  properties: {
    key: p.text().primary(),
    user: () => p.manyToOne(Users).primary().ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    method: p.text().primary(),
    path: p.text().primary(),
    status_code: p.integer(),
    response_body: p.text(),
    created_at: p.integer().defaultRaw(`(strftime('%s','now'))`).index('idx_idempotency_keys_created'),
  },
});
