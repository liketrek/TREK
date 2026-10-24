import { PACKING_PLACEHOLDER_NAME } from '../packing/packing-placeholder';
import { linkedPackingItems, packingCategoriesOf } from './tour-packing-link';
import {
  tourPackingLinkRequestSchema,
  tourPackingLinkResponseSchema,
  tourPackingLinkSchema,
} from './tour-packing-link.schema';
import { tourCreateResponseSchema } from './tours.schema';

import { describe, expect, it } from 'vitest';

const items = [
  { id: 1, name: 'Boots', category: 'Hiking gear', checked: 1 },
  { id: 2, name: 'Rain jacket', category: 'Hiking gear', checked: 0 },
  { id: 3, name: 'Passport', category: 'Documents', checked: 0 },
  { id: 4, name: PACKING_PLACEHOLDER_NAME, category: 'Snacks', checked: 0 },
  { id: 5, name: 'Old charger', category: null, checked: true },
];

describe('tour packing link contract (P2D-XD-01)', () => {
  it('TPL-SCHEMA-001: points at the whole list with null and at a category by its exact name', () => {
    expect(tourPackingLinkRequestSchema.parse({ category: null })).toEqual({ category: null });
    expect(tourPackingLinkRequestSchema.parse({ category: ' Hiking gear ' })).toEqual({ category: ' Hiking gear ' });
    expect(tourPackingLinkRequestSchema.safeParse({ category: '' }).success).toBe(false);
    expect(tourPackingLinkRequestSchema.safeParse({ category: 'x'.repeat(201) }).success).toBe(false);
    expect(tourPackingLinkRequestSchema.safeParse({}).success).toBe(false);
  });

  it('TPL-SCHEMA-002: a link write answers the tour with its link, null without one; other answers carry none', () => {
    const link = { category: 'Hiking gear', linked_at: '2026-10-20 09:00:00' };
    expect(tourPackingLinkSchema.parse(link)).toEqual(link);
    expect(tourPackingLinkSchema.safeParse({ category: null }).success).toBe(false);
    const field = tourCreateResponseSchema.shape.packing_link;
    expect(field.parse(link)).toEqual(link);
    expect(field.parse(null)).toBeNull();
    expect(field.parse(undefined)).toBeUndefined();
    expect(tourPackingLinkResponseSchema.parse({ packing_link: null })).toEqual({ packing_link: null });
    expect(tourPackingLinkResponseSchema.safeParse({}).success).toBe(false);
  });
});

describe('linkedPackingItems (P2D-XD-01)', () => {
  it('TPL-ITEMS-001: the whole list shows every item but an empty category placeholder', () => {
    const linked = linkedPackingItems({ category: null }, items);
    expect(linked.state).toBe('ready');
    expect(linked.items.map((item) => item.id)).toEqual([1, 2, 3, 5]);
    expect(linked.packed).toBe(2);
  });

  it('TPL-ITEMS-002: a category shows its own items in their order and counts the ticked ones', () => {
    const linked = linkedPackingItems({ category: 'Hiking gear' }, items);
    expect(linked).toEqual({ state: 'ready', items: [items[0], items[1]], packed: 1 });
  });

  it('TPL-ITEMS-003: an empty list and a category that holds only its placeholder read as empty', () => {
    expect(linkedPackingItems({ category: null }, []).state).toBe('empty');
    expect(linkedPackingItems({ category: 'Snacks' }, items)).toEqual({ state: 'empty', items: [], packed: 0 });
  });

  it('TPL-ITEMS-004: a category without an item the viewer can see reads as missing, never as empty', () => {
    expect(linkedPackingItems({ category: 'Climbing' }, items)).toEqual({ state: 'missing', items: [], packed: 0 });
    // The name is compared as it is stored: another spelling is another category.
    expect(linkedPackingItems({ category: 'hiking gear' }, items).state).toBe('missing');
  });
});

describe('packingCategoriesOf (P2D-XD-01)', () => {
  it('TPL-CATS-001: names each category once, in the order the list first shows it, with its items counted', () => {
    expect(packingCategoriesOf(items)).toEqual([
      { name: 'Hiking gear', count: 2 },
      { name: 'Documents', count: 1 },
      { name: 'Snacks', count: 0 },
    ]);
    expect(packingCategoriesOf([])).toEqual([]);
  });
});
