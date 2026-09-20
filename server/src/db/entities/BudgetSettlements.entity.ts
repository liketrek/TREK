import { type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class BudgetSettlements {
  id?: number | null;
  trip!: Ref<Trips>;
  fromUser!: Ref<Users>;
  toUser!: Ref<Users>;
  amount!: number;
  createdAt?: Date | null;
  createdByUser?: Ref<Users> | null;
  currency?: string | null;
  exchangeRate!: number;
  settledAt?: string | null;
}

export class BudgetSettlementsRepository extends EntityRepository<BudgetSettlements> {}

export const BudgetSettlementsSchema = defineEntity({
  class: BudgetSettlements,
  repository: () => BudgetSettlementsRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').index('idx_budget_settlements_trip'),
    fromUser: () => p.manyToOne(Users).ref().deleteRule('cascade'),
    toUser: () => p.manyToOne(Users).ref().deleteRule('cascade'),
    amount: p.double().default(0),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    createdByUser: () => p.manyToOne(Users).ref().nullable(),
    currency: p.text().nullable(),
    exchangeRate: p.double().default(1),
    settledAt: p.text().nullable(),
  },
});
