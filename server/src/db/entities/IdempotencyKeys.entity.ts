import { type Opt, PrimaryKeyProp, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Users } from './Users.entity';

export class IdempotencyKeys {
  [PrimaryKeyProp]?: ['key', 'user', 'method', 'path'];
  key!: string;
  user!: Ref<Users>;
  method!: string;
  path!: string;
  statusCode!: number;
  responseBody!: string;
  createdAt: number & Opt = NaN;
}

export class IdempotencyKeysRepository extends EntityRepository<IdempotencyKeys> {}

export const IdempotencyKeysSchema = defineEntity({
  class: IdempotencyKeys,
  repository: () => IdempotencyKeysRepository,
  properties: {
    key: p.text().primary(),
    user: () => p.manyToOne(Users).primary().ref().deleteRule('cascade'),
    method: p.text().primary(),
    path: p.text().primary(),
    statusCode: p.integer(),
    responseBody: p.text(),
    createdAt: p.integer().defaultRaw(`(strftime('%s','now'))`).index('idx_idempotency_keys_created'),
  },
});
