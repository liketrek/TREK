import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { PasswordResetTokensRepository } from '../repositories/PasswordResetTokens.repository';
import { DbTimestampType } from '../types';
import { Users } from './Users.entity';

export class PasswordResetTokens {
  [EntityRepositoryType]?: PasswordResetTokensRepository;
  id!: number & Opt;
  user!: Ref<Users>;
  user_id!: number;
  token_hash!: string;
  expires_at!: string;
  consumed_at?: string | null;
  created_at?: string | null;
  created_ip?: string | null;
}

export const PasswordResetTokensSchema = defineEntity({
  class: PasswordResetTokens,
  repository: () => PasswordResetTokensRepository,
  uniques: [{ properties: ['token_hash'] }],
  properties: {
    id: p.integer().primary(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden().index('idx_prt_user'),
    user_id: p.integer().persist(false).index('idx_prt_user'),
    token_hash: p.text().index('idx_prt_hash'),
    expires_at: p.type(DbTimestampType),
    consumed_at: p.type(DbTimestampType).nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    created_ip: p.text().nullable(),
  },
});
