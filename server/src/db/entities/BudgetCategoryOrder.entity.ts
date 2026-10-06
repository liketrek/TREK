import { EntityRepositoryType, type Opt, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { BudgetCategoryOrderRepository } from '../repositories/BudgetCategoryOrder.repository';
import { Trips } from './Trips.entity';

export class BudgetCategoryOrder {
  [EntityRepositoryType]?: BudgetCategoryOrderRepository;
  [PrimaryKeyProp]?: ['trip', 'category'];
  trip!: Ref<Trips>;
  trip_id!: number;
  category!: string;
  sort_order: number & Opt = 0;
}

export const BudgetCategoryOrderSchema = defineEntity({
  class: BudgetCategoryOrder,
  repository: () => BudgetCategoryOrderRepository,
  uniques: [{ properties: ['trip', 'category'] }],
  properties: {
    trip: () => p.manyToOne(Trips).primary().ref().deleteRule('cascade').hidden(),
    trip_id: p.integer().persist(false),
    category: p.text().primary(),
    sort_order: p.integer().default(0),
  },
});
