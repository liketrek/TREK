import type { PackingVisibility } from '@trek/shared';

import type { PackingItem } from '../../types';
import { PACKING_PLACEHOLDER_NAME } from './packingListPanel.constants';

/**
 * Pure view-model helpers for the packing list, shared by the desktop panel and
 * the phone tab. No React, no side effects: grouping, filtering and counting
 * only, so switching a filter on either surface produces the same buckets.
 */

export type PackingView = 'common' | 'personal';
export type PackingStatusFilter = 'all' | 'open' | 'done';

/** Three-tier sharing split (#858): Common = group pool, Personal = mine + shared-to-me. */
export function packingViewItems(items: PackingItem[], view: PackingView): PackingItem[] {
  return items.filter((i) => (view === 'common' ? !i.is_private : !!i.is_private));
}

/** Category display order = first-appearance order within the active view (stable colours). */
export function packingCategoryOrder(viewItems: PackingItem[], defaultCategory: string): string[] {
  const seen: string[] = [];
  for (const item of viewItems) {
    const cat = item.category || defaultCategory;
    if (!seen.includes(cat)) seen.push(cat);
  }
  return seen;
}

/**
 * The whole list's item order with category `from` moved to where `to` stands.
 *
 * A category has no position of its own: it shows where its first item is. So a
 * category is moved by moving its items, as one block, through the item reorder
 * the list already has; nothing new is stored, and the order reaches every device
 * the way a dragged item does. The view's items come first, grouped in the new
 * order with each group in its own order; the other view's items follow in theirs,
 * which leaves that view's categories as they were. Null when nothing would move.
 */
export function itemOrderWithCategoryMoved(
  items: PackingItem[],
  viewItems: PackingItem[],
  from: string,
  to: string,
  defaultCategory: string
): number[] | null {
  const order = packingCategoryOrder(viewItems, defaultCategory);
  const fromIndex = order.indexOf(from);
  const toIndex = order.indexOf(to);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return null;
  order.splice(fromIndex, 1);
  order.splice(toIndex, 0, from);
  const inView = new Set(viewItems.map((i) => i.id));
  const grouped = order.flatMap((cat) => viewItems.filter((i) => (i.category || defaultCategory) === cat));
  return [...grouped, ...items.filter((i) => !inView.has(i.id))].map((i) => i.id);
}

export function packingStatusFiltered(items: PackingItem[], status: PackingStatusFilter): PackingItem[] {
  if (status === 'open') return items.filter((i) => !i.checked);
  if (status === 'done') return items.filter((i) => !!i.checked);
  return items;
}

export interface PackingCategoryGroup {
  category: string;
  items: PackingItem[];
}

/** Groups the view+status filtered items by category, in first-encounter order. */
export function groupPackingItems(
  viewItems: PackingItem[],
  status: PackingStatusFilter,
  defaultCategory: string
): PackingCategoryGroup[] {
  const filtered = packingStatusFiltered(viewItems, status);
  const order: string[] = [];
  const byCategory = new Map<string, PackingItem[]>();
  for (const item of filtered) {
    const cat = item.category || defaultCategory;
    let bucket = byCategory.get(cat);
    if (!bucket) {
      bucket = [];
      byCategory.set(cat, bucket);
      order.push(cat);
    }
    bucket.push(item);
  }
  return order.map((category) => ({ category, items: byCategory.get(category) as PackingItem[] }));
}

export interface PackingProgress {
  checked: number;
  total: number;
  pct: number;
}

export function packingProgress(items: PackingItem[]): PackingProgress {
  const checked = items.filter((i) => i.checked).length;
  const total = items.length;
  return { checked, total, pct: total > 0 ? Math.round((checked / total) * 100) : 0 };
}

/** "232 g" under 1000g, "1.2 kg" at/above, the phone's and the printout's weight label. */
export function formatWeight(grams: number): string {
  return grams >= 1000 ? `${(grams / 1000).toFixed(1)} kg` : `${Math.round(grams)} g`;
}

/** Weight an item contributes to a bag/total: unit weight times quantity. */
export function packingItemWeight(item: Pick<PackingItem, 'weight_grams' | 'quantity'>): number {
  return (item.weight_grams || 0) * (item.quantity || 1);
}

/**
 * True when deleting `item` would empty its (custom) category: the row is then
 * reset to the `...` placeholder instead of removed, so the category keeps its
 * position and colour (#1289).
 */
export function isLastCustomItemInCategory(item: PackingItem, allItems: PackingItem[]): boolean {
  return (
    !!item.category &&
    item.name !== PACKING_PLACEHOLDER_NAME &&
    !allItems.some((i) => i.id !== item.id && i.category === item.category)
  );
}

export function isPackingPlaceholder(item: Pick<PackingItem, 'name'>): boolean {
  return item.name === PACKING_PLACEHOLDER_NAME;
}

/** An item's sharing tier and, for the Shared-with tier, who it is shared with (#858). */
export interface PackingSharing {
  visibility: PackingVisibility;
  recipientIds: number[];
}

/** The tier an item stands at, read the way the per-item sharing controls read it. */
export function packingItemSharing(item: PackingItem): PackingSharing {
  const recipientIds = (item.recipients || []).map((r) => r.user_id).sort((a, b) => a - b);
  if (!item.is_private) return { visibility: 'common', recipientIds: [] };
  return { visibility: recipientIds.length > 0 ? 'shared' : 'personal', recipientIds };
}

function sameSharing(a: PackingSharing, b: PackingSharing): boolean {
  return a.visibility === b.visibility && a.recipientIds.join(',') === b.recipientIds.join(',');
}

/**
 * A list's items split for moving the whole list to one tier (#2961). Only an
 * item's owner may change its sharing, and an item nobody owns yet is claimed by
 * whoever changes it, as with a single item; the rest stay as they are and are
 * counted so the user can be told. The placeholder of an empty list is one of
 * its items, so the list moves along with it.
 */
export function categorySharingSplit(
  categoryItems: PackingItem[],
  userId: number | null | undefined
): { own: PackingItem[]; othersCount: number } {
  const own = categoryItems.filter((i) => i.owner_id == null || i.owner_id === userId);
  return { own, othersCount: categoryItems.length - own.length };
}

/** The tier all of these items already agree on, or null when they differ or there are none. */
export function agreedSharing(items: PackingItem[]): PackingSharing | null {
  if (items.length === 0) return null;
  const first = packingItemSharing(items[0]);
  return items.every((i) => sameSharing(packingItemSharing(i), first)) ? first : null;
}

/** The items that a move to `target` would actually change; those already there need no write. */
export function itemsToReshare(items: PackingItem[], target: PackingSharing): PackingItem[] {
  const wanted = { ...target, recipientIds: [...target.recipientIds].sort((a, b) => a - b) };
  return items.filter((i) => !sameSharing(packingItemSharing(i), wanted));
}
