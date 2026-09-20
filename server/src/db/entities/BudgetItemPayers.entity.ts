import { BudgetItems } from './BudgetItems.entity';
import { Users } from './Users.entity';
import { type Ref, defineEntity, p, Opt, EntityRepository } from '@mikro-orm/core';

export class BudgetItemPayers {
  id?: number | null;
  budgetItem!: Ref<BudgetItems>;
  user!: Ref<Users>;
  amount: number & Opt = 0;
}

export class BudgetItemPayersRepository extends EntityRepository<BudgetItemPayers> {}

export const BudgetItemPayersSchema = defineEntity({
  class: BudgetItemPayers,
  repository: () => BudgetItemPayersRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    budgetItem: () => p.manyToOne(BudgetItems).ref().deleteRule('cascade').index('idx_budget_item_payers_item'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade'),
    amount: p.double().default(0),
  },
});
