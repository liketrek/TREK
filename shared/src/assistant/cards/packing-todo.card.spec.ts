import { packingListItemsRequestSchema } from '../../packing/packing.schema';
import { storedTrekCardSchema, trekCardSchema } from './index';
import { packingListCardSchema } from './packing-list.card';
import { todoListCardSchema } from './todo-list.card';

import { describe, expect, it } from 'vitest';

/**
 * PKCARD-001 to PKCARD-008: the packing and to-do cards of the assistant
 * chat. Both kinds join the card union; every field is bounded; a bag is
 * named by a key, a colour only as `#rrggbb`, a person never with an address,
 * a date only as `YYYY-MM-DD`; and the list read they come from takes its
 * filters in a closed shape.
 */

const ANA = { id: 2, name: 'Ana', avatarKey: 'ana.png' };

const item = (over: Record<string, unknown> = {}) => ({
  id: 7,
  name: 'Rain jacket',
  quantity: 1,
  packed: 0,
  checked: false,
  weightGrams: 480,
  bagKey: 'id:3',
  tier: 'common',
  sharedWith: [],
  change: 'none',
  changed: [],
  ...over,
});

const bag = (over: Record<string, unknown> = {}) => ({
  key: 'id:3',
  id: 3,
  name: 'Carry-on',
  color: '#6366f1',
  weightGrams: 6200,
  limitGrams: 8000,
  owner: ANA,
  members: [ANA],
  membersRemoved: [],
  change: 'none',
  changed: [],
  movesOut: 0,
  ...over,
});

const packing = (over: Record<string, unknown> = {}) => ({
  kind: 'packingList',
  source: { type: 'trip' },
  groupBy: 'category',
  progress: { packed: 1, total: 3 },
  bags: [bag()],
  groups: [
    {
      key: { by: 'category', name: 'Clothes', slot: 0 },
      assignees: [ANA],
      assigneesRemoved: [],
      items: [item()],
      count: 3,
      packed: 1,
    },
  ],
  moreGroups: 0,
  ...over,
});

/** The packing card with one row in its one group. */
const withRow = (row: unknown) => packing({ groups: [{ ...packing().groups[0], items: [row] }] });

const todo = (over: Record<string, unknown> = {}) => ({
  id: 9,
  name: 'Book the ferry',
  note: 'Check the early sailing first',
  checked: false,
  dueDate: '2026-06-12',
  dueDayId: 31,
  priority: 1,
  assignee: ANA,
  change: 'none',
  changed: [],
  ...over,
});

const todos = (items: unknown[] = [todo()]) => ({
  kind: 'todoList',
  progress: { open: 2, done: 1, overdue: 1 },
  groups: [{ category: 'Bookings', slot: 0, assignees: [], assigneesRemoved: [], items, count: 2, open: 2 }],
  moreGroups: 0,
});

describe('packing and to-do cards', () => {
  it('PKCARD-001: a packing list, a bag overview, a tour and a template source all read as cards of the union', () => {
    expect(trekCardSchema.parse(packing()).kind).toBe('packingList');
    const bags = packing({ groupBy: 'bag', progress: null, groups: [] });
    expect(packingListCardSchema.safeParse(bags).success).toBe(true);
    const tour = { type: 'tour', placeId: 11, name: 'Ridge', category: 'Hiking gear' };
    expect(packingListCardSchema.safeParse(packing({ source: tour })).success).toBe(true);
    const template = { type: 'template', templateId: 4, name: 'Beach week', itemCount: 24 };
    expect(packingListCardSchema.safeParse(packing({ source: template, groups: [] })).success).toBe(true);
    const pile = { key: { by: 'bag', bagKey: null }, assignees: [], assigneesRemoved: [], items: [], count: 2 };
    expect(packingListCardSchema.safeParse(packing({ groups: [{ ...pile, packed: 0 }] })).success).toBe(true);
  });

  it('PKCARD-002: bags are named by key, a waiting one as new:N; any other key is refused', () => {
    const waiting = bag({ key: 'new:0', id: null, color: null });
    expect(packingListCardSchema.safeParse(packing({ bags: [waiting] })).success).toBe(true);
    for (const key of ['3', 'id:', 'new:123', 'bag:3']) {
      expect(packingListCardSchema.safeParse(packing({ bags: [bag({ key })] })).success, key).toBe(false);
    }
  });

  it('PKCARD-003: a colour is only #rrggbb and a person never carries an address', () => {
    expect(packingListCardSchema.safeParse(packing({ bags: [bag({ color: '#abc' })] })).success).toBe(false);
    const url = { ...ANA, avatarKey: 'https://example.com/a.png' };
    expect(packingListCardSchema.safeParse(packing({ bags: [bag({ owner: url })] })).success).toBe(false);
    expect(todoListCardSchema.safeParse(todos([todo({ assignee: url })])).success).toBe(false);
  });

  it('PKCARD-004: counts stay in bounds: no more than 999 packed, no item without a name', () => {
    for (const row of [item({ packed: 1000 }), item({ name: '' }), item({ quantity: 0 })]) {
      expect(packingListCardSchema.safeParse(withRow(row)).success).toBe(false);
    }
    const many = packing({ groups: Array(13).fill(packing().groups[0]) });
    expect(packingListCardSchema.safeParse(many).success).toBe(false);
  });

  it('PKCARD-005: a change row says what it does and what each touched field held before', () => {
    const changed = item({ change: 'update', changed: [{ field: 'bag', before: 'Daypack' }] });
    expect(packingListCardSchema.safeParse(withRow(changed)).success).toBe(true);
    const odd = item({ change: 'update', changed: [{ field: 'colour', before: null }] });
    expect(packingListCardSchema.safeParse(withRow(odd)).success).toBe(false);
  });

  it('PKCARD-006: a to-do list reads as a card, a tick keeping whether it was done; a local date is refused', () => {
    expect(trekCardSchema.parse(todos()).kind).toBe('todoList');
    expect(todoListCardSchema.safeParse(todos([todo({ dueDate: '12.06.2026' })])).success).toBe(false);
    expect(todoListCardSchema.safeParse(todos([todo({ priority: 4 })])).success).toBe(false);
    const plain = todo({ dueDate: null, dueDayId: null, note: null });
    expect(todoListCardSchema.safeParse(todos([plain])).success).toBe(true);
    const ticked = todo({ change: 'check', checked: true, changed: [{ field: 'done', before: '0' }] });
    expect(todoListCardSchema.safeParse(todos([ticked])).success).toBe(true);
  });

  it('PKCARD-007: a broken stored card reads as null instead of breaking the message', () => {
    expect(storedTrekCardSchema.parse(packing({ groupBy: 'weight' }))).toBeNull();
    expect(storedTrekCardSchema.parse(todos([todo({ change: 'archive' })]))).toBeNull();
  });

  it('PKCARD-008: the list read takes a category, a bag or none, a packed state and a grouping, nothing else', () => {
    expect(packingListItemsRequestSchema.parse({ bag_id: null, status: 'open', group_by: 'bag' })).toEqual({
      bag_id: null,
      status: 'open',
      group_by: 'bag',
    });
    expect(packingListItemsRequestSchema.safeParse({ status: 'done' }).success).toBe(false);
    expect(packingListItemsRequestSchema.safeParse({ bag_id: 0 }).success).toBe(false);
    expect(packingListItemsRequestSchema.safeParse({ category: '' }).success).toBe(false);
  });
});
