/**
 * FE-AI-CHECK-001 to FE-AI-CHECK-007
 *
 * The pure side of the packing and to-do cards: a group's colour by its slot
 * or the list's own fallback, which change cards join a run, consecutive
 * answers of one list folded into one, and how the look names and groups
 * the kinds.
 */
import type { PackingCardItem, PackingListCard, TodoCardItem, TodoListCard } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import { KAT_COLORS } from '../../../Packing/packingListPanel.constants';
import { katColor } from '../../../Packing/packingListPanel.helpers';
import { katColor as todoKatColor } from '../../../Todo/todoListModel';
import {
  isRunnable,
  mergePackingCards,
  mergeTodoCards,
  packingColorOf,
  ROW_GLYPH,
  todoColorOf,
} from './checklistModel';
import { PACKING_LOOK } from './packingLook';

const row = (id: number | null, name: string, over: Partial<PackingCardItem> = {}): PackingCardItem => ({
  id,
  name,
  quantity: 1,
  packed: 0,
  checked: false,
  weightGrams: null,
  bagKey: null,
  tier: 'common',
  sharedWith: [],
  change: 'none',
  changed: [],
  ...over,
});

const packing = (groups: Array<[string, PackingCardItem[]]>, over: Partial<PackingListCard> = {}): PackingListCard => ({
  kind: 'packingList',
  source: { type: 'trip' },
  groupBy: 'category',
  progress: null,
  bags: [],
  groups: groups.map(([name, items]) => ({
    key: { by: 'category', name, slot: 0 },
    assignees: [],
    assigneesRemoved: [],
    items,
    count: items.length,
    packed: 0,
  })),
  moreGroups: 0,
  ...over,
});

const task = (id: number, name: string): TodoCardItem => ({
  id,
  name,
  note: null,
  checked: false,
  dueDate: null,
  dueDayId: null,
  priority: 0,
  assignee: null,
  change: 'none',
  changed: [],
});

const todos = (groups: Array<[string | null, TodoCardItem[]]>, open = 1): TodoListCard => ({
  kind: 'todoList',
  progress: { open, done: 0, overdue: 0 },
  groups: groups.map(([category, items]) => ({
    category,
    slot: null,
    assignees: [],
    assigneesRemoved: [],
    items,
    count: items.length,
    open: items.length,
  })),
  moreGroups: 0,
});

describe('checklistModel', () => {
  it("FE-AI-CHECK-001: a group's colour is the list's colour at its slot, or the list's own fallback by name", () => {
    expect(packingColorOf(1, 'Clothes')).toBe(KAT_COLORS[1]);
    expect(packingColorOf(KAT_COLORS.length + 2, 'Clothes')).toBe(KAT_COLORS[2]);
    expect(packingColorOf(null, 'Clothes')).toBe(katColor('Clothes'));
    expect(todoColorOf(null, 'Bookings')).toBe(todoKatColor('Bookings', []));
    expect(todoColorOf(0, 'Bookings')).toBe(KAT_COLORS[0]);
  });

  it('FE-AI-CHECK-002: only a change of one row of the trip list joins a run', () => {
    expect(isRunnable(packing([['Clothes', [row(null, 'Hat')]]]))).toBe(true);
    expect(isRunnable(packing([['Clothes', [row(null, 'Hat'), row(null, 'Cap')]]]))).toBe(false);
    expect(isRunnable(packing([['Clothes', []]]))).toBe(false);
    const template = packing([], { source: { type: 'template', templateId: 4, name: 'Beach', itemCount: 3 } });
    expect(isRunnable(template)).toBe(false);
    expect(isRunnable(todos([['Bookings', [task(1, 'Ferry')]]]))).toBe(true);
    expect(isRunnable(todos([['Bookings', []]]))).toBe(false);
  });

  it('FE-AI-CHECK-003: answers of one list fold into one, rows deduped by id with the later one kept', () => {
    const first = packing([['Clothes', [row(1, 'Hat'), row(2, 'Socks')]]]);
    const second = packing(
      [
        ['Clothes', [row(2, 'Socks', { checked: true })]],
        ['Tech', [row(3, 'Charger')]],
      ],
      { progress: { packed: 1, total: 3 } }
    );
    const [merged, ...rest] = mergePackingCards([first, second]);
    expect(rest).toEqual([]);
    expect(merged?.groups.map((group) => group.items.map((item) => [item.id, item.checked]))).toEqual([
      [
        [1, false],
        [2, true],
      ],
      [[3, false]],
    ]);
    expect(merged?.progress).toEqual({ packed: 1, total: 3 });
  });

  it('FE-AI-CHECK-007: complete reads joined are counted again; partial reads that disagree stay apart', () => {
    const open = packing([['Clothes', [row(1, 'Hat')]]], { progress: { packed: 0, total: 1 } });
    const done = packing([['Clothes', [row(2, 'Socks', { checked: true, packed: 1 })]]], {
      progress: { packed: 1, total: 1 },
    });
    const [merged, ...rest] = mergePackingCards([open, done]);
    expect(rest).toEqual([]);
    expect(merged?.progress).toEqual({ packed: 1, total: 2 });
    expect(merged?.groups[0]).toMatchObject({ count: 2, packed: 1 });
    const partly = (card: PackingListCard): PackingListCard => ({
      ...card,
      groups: card.groups.map((group) => ({ ...group, count: 9 })),
    });
    expect(mergePackingCards([partly(open), partly(done)])).toHaveLength(2);
    expect(mergePackingCards([partly(done), partly(done)])).toHaveLength(1);
  });

  it('FE-AI-CHECK-004: a card of another source or grouping stays a card of its own', () => {
    const trip = packing([['Clothes', [row(1, 'Hat')]]]);
    const byBag = packing([], { groupBy: 'bag' });
    const tour = packing([['Clothes', [row(1, 'Hat')]]], {
      source: { type: 'tour', placeId: 70, name: 'Ridge', category: null },
    });
    expect(mergePackingCards([trip, byBag, tour])).toHaveLength(3);
    expect(mergePackingCards([])).toEqual([]);
  });

  it('FE-AI-CHECK-005: to-do answers read as one list, a list joined by its name', () => {
    const first = todos([['Bookings', [task(1, 'Ferry')]]]);
    const second = todos(
      [
        ['Bookings', [task(2, 'Car')]],
        [null, []],
      ],
      2
    );
    const merged = mergeTodoCards([first, second]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.groups.map((group) => [group.category, group.items.length])).toEqual([
      ['Bookings', 2],
      [null, 0],
    ]);
    expect(merged[0]?.progress?.open).toBe(2);
    expect(mergeTodoCards([])).toEqual([]);
  });

  it('FE-AI-CHECK-006: the look opens the Lists tab, names bag overviews apart and groups by source', () => {
    const applied = { toolCallId: 'c', ids: [], dayId: null, undoUntil: null };
    const target = PACKING_LOOK.entities.packing.open?.({ ...applied, entity: 'packing' }, null);
    expect(target).toEqual({ kind: 'tab', tab: 'listen', sub: 'packing' });
    const todoTarget = PACKING_LOOK.entities.todo.open?.({ ...applied, entity: 'todo' }, null);
    expect(todoTarget).toEqual({ kind: 'tab', tab: 'listen', sub: 'todo' });
    const look = PACKING_LOOK.cards.packingList;
    expect(look.entity(packing([['Clothes', [row(1, 'Hat')]]]))).toBe('packing');
    expect(look.entity(packing([], { groupBy: 'bag' }))).toBe('packing_bag');
    expect(look.group(packing([]))).toBe('packingList:trip:category');
    const tour = packing([], { source: { type: 'tour', placeId: 70, name: 'Ridge', category: null } });
    expect(look.group(tour)).toBe('packingList:tour');
    expect(ROW_GLYPH.remove.tone).toBe('danger');
    expect(ROW_GLYPH.add.tone).toBe('success');
  });
});
