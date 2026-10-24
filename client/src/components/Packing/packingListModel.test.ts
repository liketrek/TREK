import { describe, expect, it } from 'vitest';

import { buildPackingItem } from '../../../tests/helpers/factories';
import {
  formatWeight,
  groupPackingItems,
  isLastCustomItemInCategory,
  isPackingPlaceholder,
  itemOrderWithCategoryMoved,
  packingCategoryOrder,
  packingItemWeight,
  packingProgress,
  packingStatusFiltered,
  packingViewItems,
} from './packingListModel';
import { PACKING_PLACEHOLDER_NAME } from './packingListPanel.constants';

// FE-PACK-MODEL-001 to FE-PACK-MODEL-009

const shared = buildPackingItem({ id: 1, name: 'Tent', category: 'Camp', checked: 1 });
const mine = buildPackingItem({ id: 2, name: 'Socks', category: 'Clothes', is_private: 1 });
const stove = buildPackingItem({ id: 3, name: 'Stove', category: 'Camp' });
const loose = buildPackingItem({ id: 4, name: 'Map', category: null });

describe('packingListModel', () => {
  it('FE-PACK-MODEL-001: the common view holds the group pool, the personal one the private items', () => {
    const items = [shared, mine, stove, loose];
    expect(packingViewItems(items, 'common').map((i) => i.id)).toEqual([1, 3, 4]);
    expect(packingViewItems(items, 'personal').map((i) => i.id)).toEqual([2]);
  });

  it('FE-PACK-MODEL-002: categories come in first-appearance order, the uncategorised under the default name', () => {
    expect(packingCategoryOrder([shared, loose, stove], 'Other')).toEqual(['Camp', 'Other']);
    expect(packingCategoryOrder([], 'Other')).toEqual([]);
  });

  it('FE-PACK-MODEL-003: the status filter keeps open or done items, and all of them otherwise', () => {
    const items = [shared, stove];
    expect(packingStatusFiltered(items, 'open').map((i) => i.id)).toEqual([3]);
    expect(packingStatusFiltered(items, 'done').map((i) => i.id)).toEqual([1]);
    expect(packingStatusFiltered(items, 'all')).toBe(items);
  });

  it('FE-PACK-MODEL-004: groups follow the first item of each category, after the status filter', () => {
    const groups = groupPackingItems([loose, shared, stove], 'all', 'Other');
    expect(groups.map((g) => [g.category, g.items.map((i) => i.id)])).toEqual([
      ['Other', [4]],
      ['Camp', [1, 3]],
    ]);
    expect(groupPackingItems([loose, shared, stove], 'done', 'Other').map((g) => g.category)).toEqual(['Camp']);
  });

  it('FE-PACK-MODEL-005: progress counts checked items and rounds the share', () => {
    expect(packingProgress([shared, stove, loose])).toEqual({ checked: 1, total: 3, pct: 33 });
    expect(packingProgress([])).toEqual({ checked: 0, total: 0, pct: 0 });
  });

  it('FE-PACK-MODEL-006: weights read in grams below a kilo and in kilos from there', () => {
    expect(formatWeight(232.4)).toBe('232 g');
    expect(formatWeight(1000)).toBe('1.0 kg');
    expect(formatWeight(1250)).toBe('1.3 kg');
    expect(packingItemWeight({ weight_grams: 200, quantity: 3 })).toBe(600);
    expect(packingItemWeight({ weight_grams: null, quantity: 2 })).toBe(0);
    expect(packingItemWeight({ weight_grams: 150, quantity: 0 })).toBe(150);
  });

  it('FE-PACK-MODEL-007: only the last real item of a named category is reset instead of deleted', () => {
    const only = buildPackingItem({ id: 5, name: 'Rope', category: 'Ropes' });
    expect(isLastCustomItemInCategory(only, [only, shared])).toBe(true);
    expect(isLastCustomItemInCategory(stove, [shared, stove])).toBe(false);
    expect(isLastCustomItemInCategory(loose, [loose])).toBe(false);
    const placeholder = buildPackingItem({ id: 6, name: PACKING_PLACEHOLDER_NAME, category: 'Empty' });
    expect(isLastCustomItemInCategory(placeholder, [placeholder])).toBe(false);
  });

  it('FE-PACK-MODEL-008: the placeholder row is recognised by its name', () => {
    expect(isPackingPlaceholder({ name: PACKING_PLACEHOLDER_NAME })).toBe(true);
    expect(isPackingPlaceholder({ name: 'Tent' })).toBe(false);
  });
  it('FE-PACK-MODEL-009: moving a category moves its items as a block, the other view stays as it was', () => {
    const day1 = buildPackingItem({ id: 11, name: 'Shirt', category: 'Day 1' });
    const day2a = buildPackingItem({ id: 12, name: 'Shorts', category: 'Day 2' });
    const own = buildPackingItem({ id: 13, name: 'Pills', category: 'Day 2', is_private: 1 });
    const day3 = buildPackingItem({ id: 14, name: 'Jacket', category: 'Day 3' });
    const day2b = buildPackingItem({ id: 15, name: 'Hat', category: 'Day 2' });
    const items = [day1, day2a, own, day3, day2b];
    const common = packingViewItems(items, 'common');

    const order = itemOrderWithCategoryMoved(items, common, 'Day 3', 'Day 1', 'Other');
    expect(order).toEqual([14, 11, 12, 15, 13]);
    const moved = (order ?? []).flatMap((id) => items.filter((i) => i.id === id));
    expect(packingCategoryOrder(packingViewItems(moved, 'common'), 'Other')).toEqual(['Day 3', 'Day 1', 'Day 2']);
    expect(packingCategoryOrder(packingViewItems(moved, 'personal'), 'Other')).toEqual(['Day 2']);

    expect(itemOrderWithCategoryMoved(items, common, 'Day 1', 'Day 3', 'Other')).toEqual([12, 15, 14, 11, 13]);
  });

  it('FE-PACK-MODEL-009b: nothing moves for the same category or one the view does not show', () => {
    const items = [shared, stove, loose];
    expect(itemOrderWithCategoryMoved(items, items, 'Camp', 'Camp', 'Other')).toBeNull();
    expect(itemOrderWithCategoryMoved(items, items, 'Clothes', 'Camp', 'Other')).toBeNull();
    expect(itemOrderWithCategoryMoved(items, items, 'Other', 'Camp', 'Other')).toEqual([4, 1, 3]);
  });
});
