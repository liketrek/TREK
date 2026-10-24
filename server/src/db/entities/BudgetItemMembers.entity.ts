import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { BudgetItemMembersRepository } from '../repositories/BudgetItemMembers.repository';
import { BudgetItems } from './BudgetItems.entity';
import { Users } from './Users.entity';

export class BudgetItemMembers {
  [EntityRepositoryType]?: BudgetItemMembersRepository;
  id!: number & Opt;
  budgetItem!: Ref<BudgetItems>;
  budget_item_id!: number;
  user!: Ref<Users>;
  user_id!: number;
  paid: number & Opt = 0;
  amount?: number | null;
}

export const BudgetItemMembersSchema = defineEntity({
  class: BudgetItemMembers,
  repository: () => BudgetItemMembersRepository,
  uniques: [{ properties: ['budgetItem', 'user'] }],
  properties: {
    id: p.integer().primary(),
    budgetItem: () => p.manyToOne(BudgetItems).ref().deleteRule('cascade').hidden().index('idx_budget_item_members_item'),
    budget_item_id: p.integer().persist(false).index('idx_budget_item_members_item'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden().index('idx_budget_item_members_user'),
    user_id: p.integer().persist(false).index('idx_budget_item_members_user'),
    paid: p.integer().default(0),
    amount: p.double().nullable(),
  },
});
