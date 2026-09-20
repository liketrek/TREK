import { type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Users } from './Users.entity';

export class VacayShares {
  id?: number | null;
  owner!: Ref<Users>;
  user!: Ref<Users>;
  hidden: number & Opt = 0;
  createdAt?: Date | null;
}

export class VacaySharesRepository extends EntityRepository<VacayShares> {}

export const VacaySharesSchema = defineEntity({
  class: VacayShares,
  repository: () => VacaySharesRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    owner: () => p.manyToOne(Users).ref().deleteRule('cascade'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').index('idx_vacay_shares_user'),
    hidden: p.integer(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
  },
});
