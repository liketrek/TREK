import { BudgetItemMembers } from '../../../src/db/entities/BudgetItemMembers.entity';
import { BudgetItemPayers } from '../../../src/db/entities/BudgetItemPayers.entity';
import { BudgetItems } from '../../../src/db/entities/BudgetItems.entity';
import type { FactoryOrm } from './context';
import { createRow } from './rows';
import type { EntityData, EntityDTO } from '@mikro-orm/core';

export type BudgetItemRow = EntityDTO<BudgetItems>;

/** An expense on the trip: "Test Budget Item", Transport, 100 in the trip currency. */
export function makeBudgetItem(
  orm: FactoryOrm,
  tripId: number,
  overrides: EntityData<BudgetItems> = {},
): Promise<BudgetItemRow> {
  return createRow(orm, BudgetItems, {
    trip: tripId,
    name: 'Test Budget Item',
    category: 'Transport',
    total_price: 100,
    ...overrides,
  });
}

/** Adds the user to the expense's split, with an explicit share when `amount` is given. */
export function addBudgetItemMember(
  orm: FactoryOrm,
  budgetItemId: number,
  userId: number,
  overrides: EntityData<BudgetItemMembers> = {},
): Promise<EntityDTO<BudgetItemMembers>> {
  return createRow(orm, BudgetItemMembers, { budgetItem: budgetItemId, user: userId, ...overrides });
}

/** Records that the user paid `amount` of the expense. */
export function addBudgetItemPayer(
  orm: FactoryOrm,
  budgetItemId: number,
  userId: number,
  amount: number,
): Promise<EntityDTO<BudgetItemPayers>> {
  return createRow(orm, BudgetItemPayers, { budgetItem: budgetItemId, user: userId, amount });
}
