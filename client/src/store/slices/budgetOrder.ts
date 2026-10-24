import type { BudgetItem } from '../../types';

/**
 * The budget items regrouped by category, in the order the categories are given.
 *
 * Items keep their order inside a category, an item without one counts as
 * 'Other', and a category the list does not name follows the named ones in the
 * order it was first seen. Shared by the local reorder and the reorder another
 * member's client broadcasts, so both land on the same list.
 */
export function orderBudgetByCategories(items: BudgetItem[], orderedCategories: string[]): BudgetItem[] {
  const grouped = new Map<string, BudgetItem[]>();
  for (const item of items) {
    const cat = item.category || 'Other';
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(item);
  }
  const reordered: BudgetItem[] = [];
  for (const cat of orderedCategories) {
    const inCategory = grouped.get(cat);
    if (inCategory) reordered.push(...inCategory);
  }
  for (const [cat, inCategory] of grouped) {
    if (!orderedCategories.includes(cat)) reordered.push(...inCategory);
  }
  return reordered;
}
