import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { BudgetItemPayersRepository } from '../repositories/BudgetItemPayers.repository';
import { BudgetItems } from './BudgetItems.entity';
import { Users } from './Users.entity';

export class BudgetItemPayers {
  [EntityRepositoryType]?: BudgetItemPayersRepository;
  id!: number & Opt;
  budgetItem!: Ref<BudgetItems>;
  budget_item_id!: number;
  user!: Ref<Users>;
  user_id!: number;
  amount!: number & Opt;
}

export const BudgetItemPayersSchema = defineEntity({
  class: BudgetItemPayers,
  repository: () => BudgetItemPayersRepository,
  uniques: [{ properties: ['budgetItem', 'user'] }],
  properties: {
    id: p.integer().primary(),
    budgetItem: () => p.manyToOne(BudgetItems).ref().deleteRule('cascade').hidden().index('idx_budget_item_payers_item'),
    budget_item_id: p.integer().persist(false).index('idx_budget_item_payers_item'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    amount: p.double().defaultRaw(`0`),
  },
});
