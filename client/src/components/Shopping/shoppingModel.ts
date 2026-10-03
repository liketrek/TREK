import type { ShoppingItem } from '../../types';

export const SHOPPING_DEFAULT_CATEGORIES = [
  { id: 'Supermarket', key: 'shopping.cat.supermarket', color: '#10b981' },
  { id: 'Drinks', key: 'shopping.cat.drinks', color: '#3b82f6' },
  { id: 'Bakery', key: 'shopping.cat.bakery', color: '#f59e0b' },
  { id: 'Drugstore', key: 'shopping.cat.drugstore', color: '#ec4899' },
  { id: 'Other', key: 'shopping.cat.other', color: '#8b5cf6' },
];

export const CATEGORY_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6',
  '#06b6d4', '#f97316', '#6366f1', '#14b8a6', '#ef4444',
];

export function getCategoryColor(category: string | null | undefined): string {
  if (!category) return '#94a3b8';
  const found = SHOPPING_DEFAULT_CATEGORIES.find(c => c.id.toLowerCase() === category.toLowerCase());
  if (found) return found.color;
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = ((hash << 5) - hash + category.charCodeAt(i)) | 0;
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
}

export type ShoppingFilter = 'all' | 'open' | 'done' | string;

export function filterShoppingItems(items: ShoppingItem[], filter: ShoppingFilter): ShoppingItem[] {
  if (filter === 'all') return items;
  if (filter === 'open') return items.filter(i => !i.checked);
  if (filter === 'done') return items.filter(i => !!i.checked);
  return items.filter(i => (i.category || 'Other').toLowerCase() === filter.toLowerCase());
}

export interface ShoppingGroup {
  category: string;
  items: ShoppingItem[];
}

export function groupShoppingItems(items: ShoppingItem[]): ShoppingGroup[] {
  const groups = new Map<string, ShoppingItem[]>();
  for (const item of items) {
    const cat = item.category || 'Other';
    const list = groups.get(cat) || [];
    list.push(item);
    groups.set(cat, list);
  }

  return Array.from(groups.entries()).map(([category, groupItems]) => ({
    category,
    items: groupItems,
  }));
}
