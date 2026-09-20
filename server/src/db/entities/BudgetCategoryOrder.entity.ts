import { type Opt, PrimaryKeyProp, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Trips } from './Trips.entity';

export class BudgetCategoryOrder {
  [PrimaryKeyProp]?: ['trip', 'category'];
  trip!: Ref<Trips>;
  category!: string;
  sortOrder: number & Opt = 0;
}

export class BudgetCategoryOrderRepository extends EntityRepository<BudgetCategoryOrder> {}

export const BudgetCategoryOrderSchema = defineEntity({
  class: BudgetCategoryOrder,
  repository: () => BudgetCategoryOrderRepository,
  properties: {
    trip: () => p.manyToOne(Trips).primary().ref().deleteRule('cascade'),
    category: p.text().primary(),
    sortOrder: p.integer(),
  },
});
