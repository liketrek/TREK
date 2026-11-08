import type { ListPackingItemsOutput } from '@trek/shared/mcp-apps';

export type PackingItem = ListPackingItemsOutput['items'][number];
export type PackingBag = ListPackingItemsOutput['bags'][number];

/** The bag filter: every item, the items in no bag, or one bag by id. */
export type BagFilter = 'all' | 'none' | number;

/** How many items the card shows before "Show all". */
export const INLINE_ITEM_LIMIT = 12;

/** The items a filter keeps, in their list order. */
export function itemsInBag(items: PackingItem[], filter: BagFilter): PackingItem[] {
  if (filter === 'all') return items;
  if (filter === 'none') return items.filter((item) => item.bag_id == null);
  return items.filter((item) => item.bag_id === filter);
}
