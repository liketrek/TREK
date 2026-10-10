import { describe, expect, it } from 'vitest';
import type { BudgetItem } from '../../types';
import { orderBudgetByCategories } from './budgetOrder';

const item = (id: number, category: string | null): BudgetItem =>
  ({ id, category, name: `item ${id}`, sort_order: id }) as unknown as BudgetItem;

describe('orderBudgetByCategories', () => {
  it('groups the items in the order the categories are given, keeping their order inside each', () => {
    const items = [item(1, 'Food'), item(2, 'Hotel'), item(3, 'Food'), item(4, 'Hotel')];
    expect(orderBudgetByCategories(items, ['Hotel', 'Food']).map((i) => i.id)).toEqual([2, 4, 1, 3]);
  });

  it('counts an item without a category as Other', () => {
    const items = [item(1, null), item(2, 'Food'), item(3, '')];
    expect(orderBudgetByCategories(items, ['Other', 'Food']).map((i) => i.id)).toEqual([1, 3, 2]);
  });

  it('puts the categories the list does not name last, in the order they were first seen', () => {
    const items = [item(1, 'Fuel'), item(2, 'Food'), item(3, 'Tickets'), item(4, 'Fuel')];
    expect(orderBudgetByCategories(items, ['Food']).map((i) => i.id)).toEqual([2, 1, 4, 3]);
  });

  it('ignores a named category no item has and leaves the items untouched', () => {
    const items = [item(1, 'Food')];
    const out = orderBudgetByCategories(items, ['Ghost', 'Food']);
    expect(out).toEqual(items);
    expect(out[0]).toBe(items[0]);
  });
});
