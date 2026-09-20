import { type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Users } from './Users.entity';

export class PasswordResetTokens {
  id?: number | null;
  user!: Ref<Users>;
  tokenHash!: string;
  expiresAt!: Date;
  consumedAt?: Date | null;
  createdAt?: Date | null;
  createdIp?: string | null;
}

export class PasswordResetTokensRepository extends EntityRepository<PasswordResetTokens> {}

export const PasswordResetTokensSchema = defineEntity({
  class: PasswordResetTokens,
  repository: () => PasswordResetTokensRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').index('idx_prt_user'),
    tokenHash: p.text().index('idx_prt_hash'),
    expiresAt: p.datetime(),
    consumedAt: p.datetime().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    createdIp: p.text().nullable(),
  },
});
