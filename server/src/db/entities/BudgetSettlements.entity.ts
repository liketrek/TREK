import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { BudgetSettlementsRepository } from '../repositories/BudgetSettlements.repository';
import { DbTimestampType } from '../types';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class BudgetSettlements {
  [EntityRepositoryType]?: BudgetSettlementsRepository;
  id!: number & Opt;
  trip!: Ref<Trips>;
  trip_id!: number;
  fromUser!: Ref<Users>;
  from_user_id!: number;
  toUser!: Ref<Users>;
  to_user_id!: number;
  amount!: number & Opt;
  created_at?: string | null;
  createdByUser?: Ref<Users> | null;
  created_by_user_id?: number | null;
  currency?: string | null;
  exchange_rate!: number & Opt;
  settled_at?: string | null;
  note?: string | null;
}

export const BudgetSettlementsSchema = defineEntity({
  class: BudgetSettlements,
  repository: () => BudgetSettlementsRepository,
  properties: {
    id: p.integer().primary(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').hidden().index('idx_budget_settlements_trip'),
    trip_id: p.integer().persist(false).index('idx_budget_settlements_trip'),
    fromUser: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden().index('idx_budget_settlements_from_user_id'),
    from_user_id: p.integer().persist(false).index('idx_budget_settlements_from_user_id'),
    toUser: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden().index('idx_budget_settlements_to_user_id'),
    to_user_id: p.integer().persist(false).index('idx_budget_settlements_to_user_id'),
    amount: p.double().defaultRaw(`0`),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    createdByUser: () => p.manyToOne(Users).ref().deleteRule('no action').nullable().hidden().index('idx_budget_settlements_created_by_user_id'),
    created_by_user_id: p.integer().nullable().persist(false).index('idx_budget_settlements_created_by_user_id'),
    currency: p.text().nullable(),
    exchange_rate: p.double().defaultRaw(`1`),
    settled_at: p.text().nullable(),
    note: p.text().nullable(),
  },
});
