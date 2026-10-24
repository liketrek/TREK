import { PACKING_PLACEHOLDER_NAME } from '../packing/packing-placeholder';
import type { TourPackingLink } from './tour-packing-link.schema';

/** What a packing item has to say for a tour's link to show it. */
export interface LinkablePackingItem {
  name: string;
  category?: string | null;
  checked?: number | boolean | null;
}

/**
 * How a tour's packing link reads against the items its viewer can see:
 * `ready` shows at least one item; `empty` points at something that is there
 * but holds no item yet (an empty packing list, a category just made);
 * `missing` names a category without one item the viewer can see, because it
 * was renamed or cleared, or its items are kept to other travellers.
 */
export type TourPackingLinkState = 'ready' | 'empty' | 'missing';

export interface LinkedPackingItems<T> {
  state: TourPackingLinkState;
  /** The items of the list or category, in the order Packing lists them. */
  items: T[];
  /** How many of them are ticked off. */
  packed: number;
}

/**
 * The items a link shows, read from the packing items the viewer can see, so
 * what one traveller keeps to themselves never shows through a tour. Nothing
 * here writes: the list, its categories and its items stay Packing's.
 */
export function linkedPackingItems<T extends LinkablePackingItem>(
  link: Pick<TourPackingLink, 'category'>,
  visible: readonly T[],
): LinkedPackingItems<T> {
  const inScope = link.category === null ? visible : visible.filter((item) => item.category === link.category);
  const items = inScope.filter((item) => item.name !== PACKING_PLACEHOLDER_NAME);
  let state: TourPackingLinkState = 'ready';
  if (items.length === 0) state = link.category === null || inScope.length > 0 ? 'empty' : 'missing';
  return { state, items, packed: items.filter((item) => Boolean(item.checked)).length };
}

/** A category a tour can point at: its name and how many items it holds. */
export interface PackingCategoryChoice {
  name: string;
  count: number;
}

/**
 * The named categories of a packing list in the order the list first shows
 * them, each with its items counted (an empty category's placeholder is no
 * item). Items without a category sit in no category a tour can point at;
 * the whole list takes them in.
 */
export function packingCategoriesOf(visible: readonly LinkablePackingItem[]): PackingCategoryChoice[] {
  const counts = new Map<string, number>();
  for (const item of visible) {
    if (!item.category) continue;
    const counted = item.name === PACKING_PLACEHOLDER_NAME ? 0 : 1;
    counts.set(item.category, (counts.get(item.category) ?? 0) + counted);
  }
  return [...counts].map(([name, count]) => ({ name, count }));
}
