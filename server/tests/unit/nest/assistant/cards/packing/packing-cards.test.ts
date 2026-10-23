/**
 * ASTPACK-001 to ASTPACK-023: the packing cards of the assistant chat. The
 * lists a read shows (by category in the list's order or by bag, the bag
 * heads, a tour's part of the list), the card each packing change shows,
 * the words of the writes the core had no card for, the ways back from a
 * tick and a new bag, and the receipts. Every card goes through the
 * registry's guard, so a card that would not fit its kind comes back null.
 */
import { unchangedSinceApplied } from '../../../../../../src/nest/assistant/assistant-undo.helpers';
import { readKey } from '../../../../../../src/nest/assistant/cards/card-values';
import {
  answerCardOf,
  appliedCardOf,
  ASSISTANT_UNDO_MAP,
  ASSISTANT_WRITE_TOOLS,
  CARD_PROMPT_LINES,
  changeCardOf,
  undoReadsOf,
} from '../../../../../../src/nest/assistant/cards/registry';
import { appliedChange, describeToolCall } from '../../../../../../src/nest/assistant/tool-call-preview.helpers';
import { ANA, answerInput, BAGS, BEN, ctx, ctxWith, MAYA, PACKING_ITEMS } from './packing-fixture';
import type { PackingListCard, TrekCard } from '@trek/shared';

import { describe, expect, it } from 'vitest';

const BAG_VALUE = { bags: BAGS };

function packing(card: TrekCard | null): PackingListCard {
  if (card?.kind !== 'packingList') throw new Error(`expected a packing card, got ${JSON.stringify(card)}`);
  return card;
}

const answer = (tool: string, args: Record<string, unknown>, value: unknown) =>
  answerCardOf(tool, answerInput(args, value));
const change = (tool: string, args: Record<string, unknown>, loaded: unknown = null) =>
  changeCardOf(tool, ctx, args, loaded);
const rowNames = (card: PackingListCard) => card.groups.map((group) => group.items.map((item) => item.name));
/** The bag keys a card's rows name that are not among its bags: always none. */
const strayBags = (card: PackingListCard) => {
  const keys = new Set(card.bags.map((bag) => bag.key));
  return card.groups.flatMap((group) => group.items.flatMap((item) => item.bagKey ?? [])).filter((k) => !keys.has(k));
};

describe('the packing answers', () => {
  const listValue = { items: PACKING_ITEMS, bags: BAGS, category_assignees: { Clothes: [{ user_id: 2 }] } };

  it('ASTPACK-001: a list read groups by category in first-appearance order, the empty stand-in left out', () => {
    const card = packing(answer('list_packing_items', {}, listValue));
    expect(card.source).toEqual({ type: 'trip' });
    expect(card.groupBy).toBe('category');
    expect(card.groups.map((group) => group.key)).toEqual([
      { by: 'category', name: 'Clothes', slot: 0 },
      { by: 'category', name: 'Toiletries', slot: 0 },
      { by: 'category', name: 'Personal', slot: 2 },
    ]);
    expect(rowNames(card)).toEqual([['Rain jacket', 'Hiking socks', 'Sun hat'], ['Sunscreen'], ['Diary']]);
    expect(card.groups[0]).toMatchObject({ count: 3, packed: 1, assignees: [ANA] });
    expect(card.progress).toEqual({ packed: 1, total: 5 });
  });

  it('ASTPACK-002: a row carries its packed count, its weight times quantity, its bag and its tier', () => {
    const card = packing(answer('list_packing_items', {}, listValue));
    const [jacket, socks, hat] = card.groups[0]?.items ?? [];
    expect(jacket).toMatchObject({ id: 11, packed: 1, checked: true, weightGrams: 480, bagKey: 'id:5' });
    expect(socks).toMatchObject({ quantity: 3, packed: 1, checked: false, weightGrams: 210, bagKey: 'id:6' });
    expect(hat).toMatchObject({ tier: 'personal', weightGrams: null, bagKey: null, sharedWith: [], change: 'none' });
    expect(card.groups[1]?.items[0]).toMatchObject({ tier: 'shared', sharedWith: [ANA] });
    expect(card.bags.map((bag) => bag.key)).toEqual(['id:5', 'id:6']);
    expect(card.bags[0]).toMatchObject({
      name: 'Carry-on',
      color: '#6366f1',
      weightGrams: 6200,
      limitGrams: 8000,
      owner: MAYA,
      members: [MAYA, ANA],
    });
    expect(card.bags[1]).toMatchObject({ owner: null, members: [], limitGrams: null });
  });

  it('ASTPACK-003: grouped by bag, the bags follow the list and the pile in no bag comes last', () => {
    const card = packing(answer('list_packing_items', { group_by: 'bag' }, listValue));
    expect(card.groupBy).toBe('bag');
    expect(card.groups.map((group) => group.key)).toEqual([
      { by: 'bag', bagKey: 'id:5' },
      { by: 'bag', bagKey: 'id:6' },
      { by: 'bag', bagKey: null },
    ]);
    expect(card.groups[2]?.count).toBe(3);
  });

  it('ASTPACK-004: at most 24 rows, eight a group, twelve groups; every group still counts all of its items', () => {
    const items = ['A', 'B', 'C', 'D'].flatMap((category, c) =>
      Array.from({ length: 10 }, (_, i) => ({ id: 100 + c * 10 + i, name: `${category}${i}`, category })),
    );
    for (let i = 0; i < 11; i++) items.push({ id: 200 + i, name: `E${i}`, category: `E${i}` });
    const card = packing(answer('list_packing_items', {}, { items, bags: [] }));
    expect(card.groups).toHaveLength(12);
    expect(card.moreGroups).toBe(3);
    expect(card.groups.map((group) => group.items.length).slice(0, 5)).toEqual([8, 8, 8, 0, 0]);
    expect(card.groups[3]).toMatchObject({ count: 10, key: { by: 'category', name: 'D', slot: null } });
    expect(card.groups.reduce((sum, group) => sum + group.items.length, 0)).toBe(24);
  });

  it('ASTPACK-005: an empty list and a trip without bags show no card', () => {
    expect(answer('list_packing_items', {}, { items: [PACKING_ITEMS[2]], bags: [] })).toBeNull();
    expect(answer('list_packing_bags', {}, { bags: [] })).toBeNull();
  });

  it('ASTPACK-006: a bag read shows one head per bag with its items counted, and the pile in no bag', () => {
    const card = packing(answer('list_packing_bags', {}, BAG_VALUE));
    expect(card.groupBy).toBe('bag');
    expect(card.progress).toBeNull();
    expect(card.groups.map((group) => [group.key, group.count, group.packed, group.items.length])).toEqual([
      [{ by: 'bag', bagKey: 'id:5' }, 1, 1, 0],
      [{ by: 'bag', bagKey: 'id:6' }, 1, 0, 0],
      [{ by: 'bag', bagKey: null }, 3, 0, 0],
    ]);
  });

  it("ASTPACK-007: a tour's part of the list shows as the tour shows it, filled in from the trip's list", () => {
    const value = {
      packing_link: { category: 'Clothes', linked_at: '2026-06-01 10:00:00' },
      state: 'ready',
      items: [
        { id: 11, name: 'Rain jacket', category: 'Clothes', quantity: 1, packed: true },
        { id: 13, name: '...', category: 'Clothes', quantity: 1, packed: false },
        { id: 12, name: 'Hiking socks', category: 'Clothes', quantity: 3, packed: false },
      ],
      packed: 1,
      total: 2,
      tour: { name: 'Ridge walk' },
    };
    const card = packing(answer('get_tour_packing', { placeId: 70 }, value));
    expect(card.source).toEqual({ type: 'tour', placeId: 70, name: 'Ridge walk', category: 'Clothes' });
    expect(card.progress).toEqual({ packed: 1, total: 2 });
    // The stand-in is no row, and a bag the card read nothing of is not named.
    expect(card.groups[0]?.items.map((item) => [item.name, item.packed, item.weightGrams, item.bagKey])).toEqual([
      ['Rain jacket', 1, 480, null],
      ['Hiking socks', 1, 210, null],
    ]);
    expect(card.bags).toEqual([]);
    expect(answer('get_tour_packing', { placeId: 70 }, { ...value, state: 'missing' })).toBeNull();
    expect(answer('get_tour_packing', { placeId: 70 }, { ...value, packing_link: null })).toBeNull();
  });
});

describe('the packing change cards', () => {
  it('ASTPACK-008: a new item goes under General, its quantity held to 999, shared with members only, in its bag', () => {
    const args = {
      name: 'Toothbrush',
      quantity: 1500,
      visibility: 'shared',
      recipient_ids: [2, 1, 99],
      bag_id: 6,
      weight_grams: 20,
    };
    const card = packing(change('create_packing_item', args, BAG_VALUE));
    expect(card.groups[0]?.key).toEqual({ by: 'category', name: 'General', slot: null });
    expect(card.groups[0]?.items[0]).toMatchObject({
      id: null,
      quantity: 999,
      packed: 0,
      weightGrams: 19_980,
      bagKey: 'id:6',
      tier: 'shared',
      sharedWith: [ANA],
      change: 'add',
    });
    expect(card.bags.map((bag) => bag.key)).toEqual(['id:6']);
    const unknownBag = packing(change('create_packing_item', { name: 'Hat', bag_id: 77 }, BAG_VALUE));
    expect(unknownBag.groups[0]?.items[0]).toMatchObject({ bagKey: null, tier: 'common', quantity: 1 });
    expect(unknownBag.bags).toEqual([]);
    expect(change('create_packing_item', {})).toBeNull();
  });

  it('ASTPACK-009: an import files under Other, matches a bag by its exact name and makes a new one otherwise', () => {
    const args = {
      items: [
        { name: 'Towel' },
        { name: 'Charger', category: 'Tech', bag: 'Carry-on' },
        { name: 'Snorkel', bag: 'carry-on', quantity: 2, weight_grams: 300 },
        { name: 'Fins', bag: 'carry-on' },
        { name: '   ' },
      ],
    };
    const card = packing(change('bulk_import_packing', args, BAG_VALUE));
    expect(rowNames(card)).toEqual([['Towel', 'Snorkel', 'Fins'], ['Charger']]);
    expect(card.groups[0]?.key).toMatchObject({ name: 'Other' });
    expect(card.groups[0]?.items.map((item) => item.bagKey)).toEqual([null, 'new:0', 'new:0']);
    expect(card.groups[0]?.items[1]).toMatchObject({ quantity: 2, weightGrams: 600, change: 'add' });
    expect(card.groups[1]?.items[0]?.bagKey).toBe('id:5');
    expect(card.bags.map((bag) => [bag.key, bag.name, bag.change, bag.color])).toEqual([
      ['id:5', 'Carry-on', 'none', '#6366f1'],
      ['new:0', 'carry-on', 'add', null],
    ]);
    expect(change('bulk_import_packing', { items: [{ name: ' ' }] })).toBeNull();
  });

  it('ASTPACK-010: a tick and an untick show the row with its packed count; a removal the row as it is', () => {
    const ticked = packing(change('toggle_packing_item', { itemId: 12, checked: true }));
    expect(ticked.groups[0]?.key).toEqual({ by: 'category', name: 'Clothes', slot: 0 });
    expect(ticked.groups[0]?.items[0]).toMatchObject({ id: 12, checked: true, packed: 3, change: 'check' });
    // The tick keeps how many were packed before, for the way back.
    expect(ticked.groups[0]?.items[0]?.changed).toEqual([{ field: 'packed', before: '1' }]);
    const unticked = packing(change('toggle_packing_item', { itemId: 11, checked: false }));
    expect(unticked.groups[0]?.items[0]).toMatchObject({ checked: false, packed: 0, change: 'uncheck' });
    // Rain jacket is in Carry-on, but a tick reads no bags: the row names none rather than "Unassigned".
    expect(unticked.groups[0]?.items[0]?.bagKey).toBeNull();
    const removed = packing(change('delete_packing_item', { itemId: 14 }));
    expect(removed.groups[0]).toMatchObject({ key: { name: 'Toiletries', slot: 0 }, items: [{ change: 'remove' }] });
    for (const itemId of [99, 13]) {
      expect(change('toggle_packing_item', { itemId, checked: true }), String(itemId)).toBeNull();
      expect(change('delete_packing_item', { itemId }), String(itemId)).toBeNull();
    }
    const shared = packing(change('set_packing_item_sharing', { itemId: 12, visibility: 'common' }));
    for (const one of [ticked, unticked, removed, shared]) expect(strayBags(one)).toEqual([]);
  });

  it('ASTPACK-011: an update lists only the fields it changes with their old values, under the new category', () => {
    const args = { itemId: 12, name: 'Hiking socks', category: 'Hiking', packed_quantity: 3, bag_id: null };
    const card = packing(change('update_packing_item', args, BAG_VALUE));
    expect(card.groups[0]?.key).toEqual({ by: 'category', name: 'Hiking', slot: null });
    expect(card.groups[0]?.items[0]).toMatchObject({ checked: true, packed: 3, bagKey: null, change: 'update' });
    expect(card.groups[0]?.items[0]?.changed).toEqual([
      { field: 'category', before: 'Clothes' },
      { field: 'packed', before: '1' },
      { field: 'bag', before: 'Daypack' },
    ]);
    const cleared = packing(change('update_packing_item', { itemId: 11, weight_grams: null }));
    const weight = [{ field: 'weight', before: '480' }];
    expect(cleared.groups[0]?.items[0]).toMatchObject({ weightGrams: null, changed: weight });
    const counted = packing(change('update_packing_item', { itemId: 12, packed_quantity: 0 }));
    expect(counted.groups[0]?.items[0]).toMatchObject({ checked: false, packed: 0 });
    expect(change('update_packing_item', { itemId: 99, name: 'x' })).toBeNull();
    // A weight compares as the row shows it: three socks at 70 g weighed 210 g, at 100 g they weigh 300 g.
    const heavier = packing(change('update_packing_item', { itemId: 12, weight_grams: 100 }));
    const weighed = [{ field: 'weight', before: '210' }];
    expect(heavier.groups[0]?.items[0]).toMatchObject({ weightGrams: 300, changed: weighed });
    // A quantity alone moves no weight fact.
    const more = packing(change('update_packing_item', { itemId: 12, quantity: 4 }));
    expect(more.groups[0]?.items[0]?.changed).toEqual([{ field: 'quantity', before: '3' }]);
  });

  it('ASTPACK-012: a sharing change shows the tier after, with trip members only, and the tier before', () => {
    const args = { itemId: 15, visibility: 'shared', recipient_ids: [3, 2, 1, 99] };
    const shared = packing(change('set_packing_item_sharing', args));
    expect(shared.groups[0]?.key).toEqual({ by: 'category', name: 'Clothes', slot: 1 });
    expect(shared.groups[0]?.items[0]).toMatchObject({
      tier: 'shared',
      sharedWith: [BEN, ANA],
      change: 'share',
      changed: [{ field: 'tier', before: 'personal' }],
    });
    const common = packing(change('set_packing_item_sharing', { itemId: 14, visibility: 'common' }));
    const before = [{ before: 'shared' }];
    expect(common.groups[0]?.items[0]).toMatchObject({ tier: 'common', sharedWith: [], changed: before });
  });

  it("ASTPACK-013: a category's people show the ones it will have and the ones it drops, its items counted", () => {
    const loaded = { assignees: { Clothes: [{ user_id: 2 }, { user_id: 3 }] } };
    const card = packing(change('set_packing_category_assignees', { categoryName: 'Clothes', userIds: [3] }, loaded));
    expect(card.groups).toEqual([
      {
        key: { by: 'category', name: 'Clothes', slot: 0 },
        assignees: [BEN],
        assigneesRemoved: [ANA],
        items: [],
        count: 3,
        packed: 1,
      },
    ]);
  });

  it('ASTPACK-014: bag changes show the head: a new one indigo, a change with its old values, people, a removal', () => {
    const created = packing(change('create_packing_bag', { name: 'Beach bag', weight_limit_grams: 5000 }));
    expect(created.bags[0]).toMatchObject({ key: 'new:0', id: null, color: '#6366f1', limitGrams: 5000 });
    expect(created.groups[0]).toMatchObject({ key: { by: 'bag', bagKey: 'new:0' }, count: 0 });
    const updates = { bagId: 5, name: 'Cabin', color: '#10b981', weight_limit_grams: null, user_id: 3 };
    const updated = packing(change('update_packing_bag', updates, BAG_VALUE));
    expect(updated.bags[0]).toMatchObject({ name: 'Cabin', color: '#10b981', limitGrams: null, owner: BEN });
    expect(updated.bags[0]?.changed).toEqual([
      { field: 'name', before: 'Carry-on' },
      { field: 'color', before: '#6366f1' },
      { field: 'limit', before: '8000' },
      { field: 'owner', before: 'Maya' },
    ]);
    const members = packing(change('set_bag_members', { bagId: 5, userIds: [2, 3] }, BAG_VALUE));
    expect(members.bags[0]).toMatchObject({ members: [ANA, BEN], membersRemoved: [MAYA], change: 'members' });
    const removed = packing(change('delete_packing_bag', { bagId: 5 }, BAG_VALUE));
    expect(removed.bags[0]).toMatchObject({ change: 'remove', movesOut: 1 });
    expect(change('delete_packing_bag', { bagId: 9 }, BAG_VALUE)).toBeNull();
    expect(change('create_packing_bag', {})).toBeNull();
  });

  it('ASTPACK-015: a template shows its name and how many items it adds, and once applied the items it added', () => {
    const loaded = { templates: [{ id: 4, name: 'Beach week', item_count: 24 }] };
    const card = packing(change('apply_packing_template', { templateId: 4 }, loaded));
    expect(card.source).toEqual({ type: 'template', templateId: 4, name: 'Beach week', itemCount: 24 });
    expect(card.groups).toEqual([]);
    expect(change('apply_packing_template', { templateId: 5 }, loaded)).toBeNull();
    const preview = describeToolCall('apply_packing_template', 'call_t', { templateId: 4 }, ctx, loaded);
    const result = {
      items: [
        { id: 81, name: 'Towel', category: 'Beach', quantity: 1, checked: 0, bag_id: 5 },
        { id: 82, name: 'Flip-flops', category: 'Beach', quantity: 1, checked: 0 },
      ],
      count: 2,
    };
    const applied = packing(appliedCardOf('apply_packing_template', { args: { templateId: 4 }, result, preview }));
    expect(applied.source).toEqual(card.source);
    expect(applied.groups[0]?.items.map((item) => [item.id, item.bagKey, item.change])).toEqual([
      [81, null, 'add'],
      [82, null, 'add'],
    ]);
  });

  it('ASTPACK-016: linking a tour shows the part of the list it will point at; a new item gets its id once applied', () => {
    const linked = packing(change('link_tour_packing', { placeId: 70, category: 'Clothes' }));
    expect(linked.source).toEqual({ type: 'tour', placeId: 70, name: 'Ridge walk', category: 'Clothes' });
    expect(rowNames(linked)).toEqual([['Rain jacket', 'Hiking socks', 'Sun hat']]);
    expect(change('link_tour_packing', { placeId: 71 })).toBeNull();
    const preview = describeToolCall('create_packing_item', 'call_c', { name: 'Hat' }, ctx);
    const applied = packing(
      appliedCardOf('create_packing_item', { args: { name: 'Hat' }, result: { item: { id: 90 } }, preview }),
    );
    expect(applied.groups[0]?.items[0]?.id).toBe(90);
  });
});

/** The way back from a tick, with the change card the tick showed. */
function tickBack(args: { itemId: number; checked: boolean }) {
  const preview = describeToolCall('toggle_packing_item', 'call_t', args, ctx);
  return ASSISTANT_UNDO_MAP.toggle_packing_item?.args(args, { item: { id: args.itemId } }, preview);
}

describe('the packing writes, receipts and undo', () => {
  it('ASTPACK-017: the writes without a core card name their own action, the bag or list they touch, and a card', () => {
    expect(ASSISTANT_WRITE_TOOLS.create_packing_bag).toEqual({ verbKey: 'genericCreate', entity: 'packing_bag' });
    expect(ASSISTANT_WRITE_TOOLS.toggle_packing_item).toEqual({ verbKey: 'genericUpdate', entity: 'packing' });
    expect(ASSISTANT_WRITE_TOOLS.delete_packing_template).toEqual({ verbKey: 'genericRemove', entity: 'other' });
    expect(ASSISTANT_WRITE_TOOLS.save_packing_template).toEqual({ verbKey: 'genericCreate', entity: 'other' });
    const toggle = describeToolCall('toggle_packing_item', 'call_1', { itemId: 12, checked: true }, ctx);
    expect(toggle).toMatchObject({ subject: 'Hiking socks', tool: 'toggle_packing_item', undoable: true });
    expect(toggle.rows).toEqual([{ op: 'change', labelKey: 'packed', before: '✗', after: '✓' }]);
    expect(toggle.card?.kind).toBe('packingList');
    const bag = describeToolCall('update_packing_bag', 'call_2', { bagId: 5, name: 'Cabin' }, ctx, BAG_VALUE);
    expect(bag).toMatchObject({ subject: 'Carry-on', verbKey: 'genericUpdate', tool: 'update_packing_bag' });
    const template = { templates: [{ id: 4, name: 'Beach week', item_count: 24 }] };
    const dropped = describeToolCall('delete_packing_template', 'call_3', { templateId: 4 }, ctx, template);
    expect(dropped.subject).toBe('Beach week');
    const order = describeToolCall('reorder_packing_items', 'call_4', { orderedIds: [12, 11, 99] }, ctx);
    expect(order.subject).toBe('Hiking socks, Rain jacket, #99');
    const two = { items: [{ name: 'A' }, { name: 'B' }] };
    const imported = describeToolCall('bulk_import_packing', 'call_5', two, ctx);
    expect(imported).toMatchObject({ subject: 'A, B', verbKey: 'genericCreate' });
  });

  it('ASTPACK-018: a receipt names the bag, the bag a change works on and the items an import made', () => {
    expect(appliedChange('create_packing_bag', 'c1', {}, { bag: { id: 9 } }, null, null)).toMatchObject({
      entity: 'packing_bag',
      ids: [9],
    });
    expect(appliedChange('set_bag_members', 'c2', { bagId: 5 }, { members: [] }, null, null).ids).toEqual([5]);
    const items = { items: [{ id: 81 }, { id: 82 }], count: 2 };
    expect(appliedChange('bulk_import_packing', 'c3', {}, items, null, null)).toMatchObject({
      entity: 'packing',
      ids: [81, 82],
    });
  });

  it('ASTPACK-019: a tick is taken back with the opposite tick, a new bag while nobody has used it', () => {
    const untick = ASSISTANT_UNDO_MAP.toggle_packing_item;
    expect(tickBack({ itemId: 15, checked: true })).toEqual({ itemId: 15, checked: false });
    expect(tickBack({ itemId: 11, checked: false })).toEqual({ itemId: 11, checked: true });
    expect(untick?.args({ itemId: 12 }, {}, null)).toBeNull();
    const row = { id: 12, name: 'Hiking socks', checked: 1, updated_at: 'b' };
    const summary = (items: unknown[]) => ({ summary: { packing: { items } }, places: { places: [] } });
    expect(unchangedSinceApplied('toggle_packing_item', { item: row }, summary([row]))).toBe(true);
    expect(unchangedSinceApplied('toggle_packing_item', { item: row }, summary([{ ...row, checked: 0 }]))).toBe(false);

    expect(ASSISTANT_UNDO_MAP.create_packing_bag?.args({}, { bag: { id: 9 } }, null)).toEqual({ bagId: 9 });
    expect(undoReadsOf('create_packing_bag', {}, {})).toEqual([{ tool: 'list_packing_bags', args: {} }]);
    const bag = { id: 9, name: 'Beach bag', color: '#6366f1', weight_limit_grams: null, user_id: null };
    const reads = (bags: unknown[]) => new Map([[readKey('list_packing_bags', {}), { bags }]]);
    const snapshot = (bags: unknown[], items: unknown[] = []) => ({ ...summary(items), reads: reads(bags) });
    expect(unchangedSinceApplied('create_packing_bag', { bag }, snapshot([{ ...bag, members: [] }]))).toBe(true);
    const packed = snapshot([{ ...bag, members: [{ user_id: 2 }] }]);
    expect(unchangedSinceApplied('create_packing_bag', { bag }, packed)).toBe(false);
    expect(unchangedSinceApplied('create_packing_bag', { bag }, snapshot([bag], [{ id: 1, bag_id: 9 }]))).toBe(false);
    expect(unchangedSinceApplied('create_packing_bag', { bag }, snapshot([{ ...bag, name: 'Other' }]))).toBe(false);
    // Another member's hidden item still weighs in the bag's total.
    const weighed = snapshot([{ ...bag, members: [], total_weight_grams: 300 }]);
    expect(unchangedSinceApplied('create_packing_bag', { bag }, weighed)).toBe(false);
  });
});

describe('what the packing cards let out', () => {
  it('ASTPACK-020: text from an answer is masked, from the arguments kept; no card carries an address', () => {
    const value = { items: [{ id: 11, name: 'Ask me@example.com', category: 'Clothes' }], bags: BAGS };
    const masked = packing(answer('list_packing_items', {}, value));
    expect(JSON.stringify(masked)).not.toContain('me@example.com');
    const kept = packing(change('create_packing_item', { name: 'Ask me@example.com' }));
    expect(kept.groups[0]?.items[0]?.name).toBe('Ask me@example.com');
    const cards = [
      masked,
      answer('list_packing_items', {}, { items: PACKING_ITEMS, bags: BAGS }),
      answer('list_packing_bags', {}, BAG_VALUE),
    ];
    for (const card of cards) {
      expect(JSON.stringify(card)).not.toMatch(/http|\/uploads/);
    }
    // A name sent again as it is shows no rename, and stays masked as the trip read it.
    const mail = ctxWith([{ id: 41, name: 'Ask me@example.com', category: 'Docs', quantity: 1 }]);
    const args = { itemId: 41, name: 'Ask me@example.com' };
    const again = packing(changeCardOf('update_packing_item', mail, args, null));
    expect(again.groups[0]?.items[0]?.changed).toEqual([]);
    expect(JSON.stringify(again)).not.toContain('me@example.com');
  });

  it('ASTPACK-022: a tick that changed nothing, or wiped a partial count, has no way back', () => {
    // Rain jacket was ticked already, Sun hat was not ticked: undoing would change what the user had.
    expect(tickBack({ itemId: 11, checked: true })).toBeNull();
    expect(tickBack({ itemId: 15, checked: false })).toBeNull();
    // One of three socks was packed: unticking after the tick would lose that count.
    expect(tickBack({ itemId: 12, checked: true })).toBeNull();
    // Without the change card it kept, there is nothing to tell where it was.
    const untick = ASSISTANT_UNDO_MAP.toggle_packing_item;
    expect(untick?.args({ itemId: 15, checked: true }, { item: { id: 15 } }, null)).toBeNull();
  });

  it('ASTPACK-023: an import into one category shows up to 24 rows, weights cut to whole grams as stored', () => {
    const items = (n: number) => Array.from({ length: n }, (_, i) => ({ name: `Item ${i}`, weight_grams: 12.7 }));
    const twenty = packing(change('bulk_import_packing', { items: items(20) }));
    expect(twenty.groups[0]).toMatchObject({ count: 20 });
    expect(twenty.groups[0]?.items).toHaveLength(20);
    expect(twenty.groups[0]?.items[0]?.weightGrams).toBe(12);
    const thirty = packing(change('bulk_import_packing', { items: items(30) }));
    expect(thirty.groups[0]).toMatchObject({ count: 30 });
    expect(thirty.groups[0]?.items).toHaveLength(24);
  });

  it('ASTPACK-021: the package tells the model once that its lists are cards and that an import is one call', () => {
    expect(CARD_PROMPT_LINES.some((line) => line.includes('do not list their items again'))).toBe(true);
    expect(CARD_PROMPT_LINES.some((line) => line.includes('bulk_import_packing'))).toBe(true);
  });
});
