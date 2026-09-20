import { type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { BudgetItems } from './BudgetItems.entity';
import { Users } from './Users.entity';

export class BudgetItemMembers {
  id?: number | null;
  budgetItem!: Ref<BudgetItems>;
  user!: Ref<Users>;
  paid: number & Opt = 0;
  amount?: unknown | null;
}

export class BudgetItemMembersRepository extends EntityRepository<BudgetItemMembers> {}

export const BudgetItemMembersSchema = defineEntity({
  class: BudgetItemMembers,
  repository: () => BudgetItemMembersRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    budgetItem: () => p.manyToOne(BudgetItems).ref().deleteRule('cascade').index('idx_budget_item_members_item'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').index('idx_budget_item_members_user'),
    paid: p.integer(),
    amount: p.double().nullable(),
  },
});
