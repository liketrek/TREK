import { describe, it, expect } from 'vitest';
import {
  PRIORITY_COLOR,
  PRIORITY_LABEL,
  PRIORITY_LEVELS,
  filterTodoItems,
  formatWeight,
  groupPackingItems,
  isLastCustomItemInCategory,
  isPackingPlaceholder,
  isTodoOverdue,
  packingCategoryOrder,
  packingItemWeight,
  packingProgress,
  packingStatusFiltered,
  packingViewItems,
  sortTodoRows,
  todoCategories,
  todoCategoryOpenCount,
  todoCounts,
} from '../../../../src/mobile/screens/trip/tabs/listsModel';
import { STATUS_COLOR } from '../../../../src/mobile/screens/trip/tabs/tabModel';
import { PACKING_PLACEHOLDER_NAME } from '../../../../src/components/Packing/packingListPanel.constants';
import { buildPackingItem, buildTodoItem } from '../../../helpers/factories';

// FE-MOB-LSTM-001 to FE-MOB-LSTM-020

const TODAY = '2026-07-15';

describe('listsModel — packing', () => {
  it('FE-MOB-LSTM-001: packingViewItems splits the common pool from private items', () => {
    const common = buildPackingItem({ id: 1, is_private: 0 });
    const noFlag = buildPackingItem({ id: 2 });
    const personal = buildPackingItem({ id: 3, is_private: 1 });

    expect(packingViewItems([common, noFlag, personal], 'common').map(i => i.id)).toEqual([1, 2]);
    expect(packingViewItems([common, noFlag, personal], 'personal').map(i => i.id)).toEqual([3]);
  });

  it('FE-MOB-LSTM-002: packingCategoryOrder keeps first-appearance order and names the default bucket', () => {
    const items = [
      buildPackingItem({ id: 1, category: 'Clothes' }),
      buildPackingItem({ id: 2, category: null }),
      buildPackingItem({ id: 3, category: 'Tech' }),
      buildPackingItem({ id: 4, category: 'Clothes' }),
    ];
    expect(packingCategoryOrder(items, 'General')).toEqual(['Clothes', 'General', 'Tech']);
    expect(packingCategoryOrder([], 'General')).toEqual([]);
  });

  it('FE-MOB-LSTM-003: packingStatusFiltered honours all/open/done', () => {
    const open = buildPackingItem({ id: 1, checked: 0 });
    const done = buildPackingItem({ id: 2, checked: 1 });

    expect(packingStatusFiltered([open, done], 'all').map(i => i.id)).toEqual([1, 2]);
    expect(packingStatusFiltered([open, done], 'open').map(i => i.id)).toEqual([1]);
    expect(packingStatusFiltered([open, done], 'done').map(i => i.id)).toEqual([2]);
  });

  it('FE-MOB-LSTM-004: groupPackingItems buckets by category in first-encounter order', () => {
    const items = [
      buildPackingItem({ id: 1, category: 'Clothes', checked: 0 }),
      buildPackingItem({ id: 2, category: null, checked: 1 }),
      buildPackingItem({ id: 3, category: 'Clothes', checked: 1 }),
      buildPackingItem({ id: 4, category: 'Tech', checked: 0 }),
    ];

    expect(groupPackingItems(items, 'all', 'General').map(g => [g.category, g.items.map(i => i.id)])).toEqual([
      ['Clothes', [1, 3]],
      ['General', [2]],
      ['Tech', [4]],
    ]);
  });

  it('FE-MOB-LSTM-005: groupPackingItems drops categories emptied by the status filter', () => {
    const items = [
      buildPackingItem({ id: 1, category: 'Clothes', checked: 1 }),
      buildPackingItem({ id: 2, category: 'Tech', checked: 0 }),
    ];

    expect(groupPackingItems(items, 'open', 'General').map(g => g.category)).toEqual(['Tech']);
    expect(groupPackingItems(items, 'done', 'General').map(g => g.category)).toEqual(['Clothes']);
    expect(groupPackingItems([], 'all', 'General')).toEqual([]);
  });

  it('FE-MOB-LSTM-006: packingProgress reports checked/total and a rounded percentage', () => {
    const items = [
      buildPackingItem({ id: 1, checked: 1 }),
      buildPackingItem({ id: 2, checked: 0 }),
      buildPackingItem({ id: 3, checked: 0 }),
    ];
    expect(packingProgress(items)).toEqual({ checked: 1, total: 3, pct: 33 });
    expect(packingProgress([])).toEqual({ checked: 0, total: 0, pct: 0 });
  });

  it('FE-MOB-LSTM-007: formatWeight switches to kilograms at 1000 g', () => {
    expect(formatWeight(232)).toBe('232 g');
    expect(formatWeight(232.4)).toBe('232 g');
    expect(formatWeight(999)).toBe('999 g');
    expect(formatWeight(1000)).toBe('1.0 kg');
    expect(formatWeight(1234)).toBe('1.2 kg');
    expect(formatWeight(0)).toBe('0 g');
  });

  it('FE-MOB-LSTM-008: packingItemWeight multiplies unit weight by quantity', () => {
    expect(packingItemWeight({ weight_grams: 250, quantity: 3 })).toBe(750);
    // a missing quantity counts as one, a missing weight as zero
    expect(packingItemWeight({ weight_grams: 250, quantity: undefined })).toBe(250);
    expect(packingItemWeight({ weight_grams: null, quantity: 4 })).toBe(0);
  });

  it('FE-MOB-LSTM-009: isLastCustomItemInCategory guards the category placeholder reset', () => {
    const only = buildPackingItem({ id: 1, category: 'Tech', name: 'Charger' });
    const sibling = buildPackingItem({ id: 2, category: 'Tech', name: 'Cable' });
    const uncategorised = buildPackingItem({ id: 3, category: null, name: 'Socks' });
    const placeholder = buildPackingItem({ id: 4, category: 'Tech', name: PACKING_PLACEHOLDER_NAME });

    expect(isLastCustomItemInCategory(only, [only])).toBe(true);
    expect(isLastCustomItemInCategory(only, [only, sibling])).toBe(false);
    expect(isLastCustomItemInCategory(uncategorised, [uncategorised])).toBe(false);
    expect(isLastCustomItemInCategory(placeholder, [placeholder])).toBe(false);
  });

  it('FE-MOB-LSTM-010: isPackingPlaceholder recognises the "..." row', () => {
    expect(isPackingPlaceholder({ name: PACKING_PLACEHOLDER_NAME })).toBe(true);
    expect(isPackingPlaceholder({ name: 'Charger' })).toBe(false);
  });
});

describe('listsModel — to-do', () => {
  it('FE-MOB-LSTM-011: isTodoOverdue needs an unchecked item with a past due date', () => {
    expect(isTodoOverdue(buildTodoItem({ due_date: '2026-07-14' }), TODAY)).toBe(true);
    expect(isTodoOverdue(buildTodoItem({ due_date: TODAY }), TODAY)).toBe(false);
    expect(isTodoOverdue(buildTodoItem({ due_date: '2026-07-16' }), TODAY)).toBe(false);
    expect(isTodoOverdue(buildTodoItem({ due_date: '2026-07-14', checked: 1 }), TODAY)).toBe(false);
    expect(isTodoOverdue(buildTodoItem({ due_date: null }), TODAY)).toBe(false);
  });

  const open = buildTodoItem({ id: 1, name: 'Book train', category: 'Travel' });
  const mine = buildTodoItem({ id: 2, name: 'Pack', assigned_user_id: 7, category: 'Home' });
  const overdue = buildTodoItem({ id: 3, name: 'Visa', due_date: '2026-07-01', category: 'Travel' });
  const done = buildTodoItem({ id: 4, name: 'Passport', checked: 1, category: 'Travel' });
  const items = [open, mine, overdue, done];

  it('FE-MOB-LSTM-012: filterTodoItems applies the four smart filters', () => {
    expect(filterTodoItems(items, 'all', 7, TODAY).map(i => i.id)).toEqual([1, 2, 3]);
    expect(filterTodoItems(items, 'done', 7, TODAY).map(i => i.id)).toEqual([4]);
    expect(filterTodoItems(items, 'my', 7, TODAY).map(i => i.id)).toEqual([2]);
    expect(filterTodoItems(items, 'overdue', 7, TODAY).map(i => i.id)).toEqual([3]);
  });

  it('FE-MOB-LSTM-013: an unknown filter is treated as a category name', () => {
    expect(filterTodoItems(items, 'Travel', 7, TODAY).map(i => i.id)).toEqual([1, 3, 4]);
    expect(filterTodoItems(items, 'Nope', 7, TODAY)).toEqual([]);
  });

  it('FE-MOB-LSTM-020: without a current user "my" is empty, like the badge', () => {
    expect(filterTodoItems(items, 'my', null, TODAY)).toEqual([]);
    expect(filterTodoItems(items, 'my', null, TODAY)).toHaveLength(todoCounts(items, null, TODAY).my);
  });

  it('FE-MOB-LSTM-014: sortTodoRows floats overdue rows up and sinks done rows', () => {
    const sorted = sortTodoRows(items, false, TODAY);
    expect(sorted.map(i => i.id)).toEqual([3, 1, 2, 4]);
    // the input array stays untouched
    expect(items.map(i => i.id)).toEqual([1, 2, 3, 4]);
  });

  it('FE-MOB-LSTM-015: sortTodoRows only breaks ties by priority while the toggle is on', () => {
    const p3 = buildTodoItem({ id: 10, priority: 3 });
    const p1 = buildTodoItem({ id: 11, priority: 1 });
    const none = buildTodoItem({ id: 12, priority: 0 });
    const list = [p3, none, p1];

    expect(sortTodoRows(list, false, TODAY).map(i => i.id)).toEqual([10, 12, 11]);
    expect(sortTodoRows(list, true, TODAY).map(i => i.id)).toEqual([11, 10, 12]);
  });

  it('FE-MOB-LSTM-016: todoCategories returns distinct categories alphabetically', () => {
    expect(todoCategories(items)).toEqual(['Home', 'Travel']);
    expect(todoCategories([buildTodoItem({ category: null })])).toEqual([]);
  });

  it('FE-MOB-LSTM-017: todoCategoryOpenCount counts only unchecked rows of that category', () => {
    expect(todoCategoryOpenCount(items, 'Travel')).toBe(2);
    expect(todoCategoryOpenCount(items, 'Home')).toBe(1);
    expect(todoCategoryOpenCount(items, 'Nope')).toBe(0);
  });

  it('FE-MOB-LSTM-018: todoCounts fills the badge row and zeroes "my" without a user', () => {
    expect(todoCounts(items, 7, TODAY)).toEqual({ total: 4, open: 3, done: 1, overdue: 1, my: 1 });
    expect(todoCounts(items, null, TODAY).my).toBe(0);
    expect(todoCounts([], 7, TODAY)).toEqual({ total: 0, open: 0, done: 0, overdue: 0, my: 0 });
  });

  it('FE-MOB-LSTM-019: priority tokens reuse the shared status palette', () => {
    expect(PRIORITY_COLOR[1]).toBe(STATUS_COLOR.danger);
    expect(PRIORITY_COLOR[2]).toBe(STATUS_COLOR.pending);
    expect(PRIORITY_COLOR[3]).toBe(STATUS_COLOR.info);
    expect(PRIORITY_LABEL).toEqual({ 1: 'P1', 2: 'P2', 3: 'P3' });
    expect(PRIORITY_LEVELS).toEqual([0, 1, 2, 3]);
  });
});
