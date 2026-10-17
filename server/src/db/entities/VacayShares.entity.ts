import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { VacaySharesRepository } from '../repositories/VacayShares.repository';
import { DbTimestampType } from '../types';
import { Users } from './Users.entity';

export class VacayShares {
  [EntityRepositoryType]?: VacaySharesRepository;
  id!: number & Opt;
  owner!: Ref<Users>;
  owner_id!: number;
  user!: Ref<Users>;
  user_id!: number;
  hidden: number & Opt = 0;
  created_at?: string | null;
}

export const VacaySharesSchema = defineEntity({
  class: VacayShares,
  repository: () => VacaySharesRepository,
  uniques: [{ properties: ['owner', 'user'] }],
  properties: {
    id: p.integer().primary(),
    owner: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    owner_id: p.integer().persist(false),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden().index('idx_vacay_shares_user'),
    user_id: p.integer().persist(false).index('idx_vacay_shares_user'),
    hidden: p.integer().default(0),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
