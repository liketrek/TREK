/**
 * ASTTODO-001 to ASTTODO-012: the to-do cards of the assistant chat. The
 * list a read shows (by list in the panel's order, open ones first, overdue
 * against the day of the read), the card each to-do change shows, the words
 * of the to-do writes, the way back from a tick and the receipt of a new
 * to-do. Every card goes through the registry's guard.
 */
import { unchangedSinceApplied } from '../../../../../../src/nest/assistant/assistant-undo.helpers';
import {
  answerCardOf,
  appliedCardOf,
  ASSISTANT_UNDO_MAP,
  ASSISTANT_WRITE_TOOLS,
  changeCardOf,
} from '../../../../../../src/nest/assistant/cards/registry';
import { describeToolCall } from '../../../../../../src/nest/assistant/tool-call-preview.helpers';
import { ANA, answerInput, BEN, ctx, ctxWith, MAYA, TODOS } from './packing-fixture';
import type { TodoListCard, TrekCard } from '@trek/shared';

import { describe, expect, it } from 'vitest';

function todos(card: TrekCard | null): TodoListCard {
  if (card?.kind !== 'todoList') throw new Error(`expected a to-do card, got ${JSON.stringify(card)}`);
  return card;
}

const answer = (value: unknown) => answerCardOf('list_todos', answerInput({}, value));
const change = (tool: string, args: Record<string, unknown>, loaded: unknown = null) =>
  changeCardOf(tool, ctx, args, loaded);

describe('the to-do answer', () => {
  it('ASTTODO-001: groups by list in name order with the ones on no list last, and counts open, done and overdue', () => {
    const card = todos(answer({ items: TODOS }));
    expect(card.groups.map((group) => [group.category, group.slot, group.count, group.open])).toEqual([
      ['Bookings', 0, 2, 2],
      ['Documents', 1, 1, 1],
      [null, null, 1, 0],
    ]);
    expect(card.progress).toEqual({ open: 3, done: 1, overdue: 1 });
    expect(card.groups[0]?.items.map((item) => item.name)).toEqual(['Book the ferry', 'Car seat']);
    expect(card.groups[0]?.items[0]).toMatchObject({
      id: 21,
      dueDate: '2026-06-12',
      dueDayId: 31,
      priority: 1,
      assignee: ANA,
      note: null,
      change: 'none',
    });
    expect(card.groups[1]?.items[0]).toMatchObject({ dueDate: '2026-06-10', dueDayId: null });
  });

  it('ASTTODO-002: a note is the first line with text, masked; an empty list shows no card', () => {
    const card = todos(answer({ items: TODOS }));
    expect(card.groups[2]?.items[0]).toMatchObject({ name: 'Passport copies', checked: true, note: 'Scan both pages' });
    const mail = todos(answer({ items: [{ id: 30, name: 'Ask', description: 'Mail me@example.com first' }] }));
    expect(JSON.stringify(mail)).not.toContain('me@example.com');
    expect(answer({ items: [] })).toBeNull();
  });

  it('ASTTODO-003: open ones come first by due date; done ones only fill a list up to five; 20 rows in all', () => {
    const items = [
      { id: 1, name: 'Undated', category: 'Trip' },
      ...Array.from({ length: 6 }, (_, i) => ({ id: 10 + i, name: `Done ${i}`, category: 'Trip', checked: 1 })),
      { id: 2, name: 'Soon', category: 'Trip', due_date: '2026-06-01' },
    ];
    const card = todos(answer({ items }));
    expect(card.groups[0]?.items.map((item) => item.name)).toEqual(['Soon', 'Undated', 'Done 0', 'Done 1', 'Done 2']);
    expect(card.groups[0]).toMatchObject({ count: 8, open: 2 });
    const many = Array.from({ length: 25 }, (_, i) => ({ id: 100 + i, name: `Task ${i}`, category: 'A' }));
    const capped = todos(answer({ items: [...many, { id: 200, name: 'Later', category: 'B' }] }));
    expect(capped.groups.map((group) => [group.items.length, group.count])).toEqual([
      [20, 25],
      [0, 1],
    ]);
  });
});

describe('the to-do change cards', () => {
  it('ASTTODO-004: a new to-do shows in its list with its day, priority and person; its note is kept as written', () => {
    const args = {
      name: 'Book the train',
      category: 'Bookings',
      due_date: '2026-06-13',
      priority: 2,
      assigned_user_id: 3,
      description: 'Mail me@example.com',
    };
    const card = todos(change('create_todo', args));
    expect(card.groups[0]).toMatchObject({ category: 'Bookings', slot: 0, count: 1, open: 1 });
    expect(card.groups[0]?.items[0]).toMatchObject({
      id: null,
      note: 'Mail me@example.com',
      dueDayId: 32,
      priority: 2,
      assignee: BEN,
      change: 'add',
    });
    const odd = todos(change('create_todo', { name: 'Pack', due_date: '13.06.2026', priority: 7 }));
    expect(odd.groups[0]).toMatchObject({ category: null, slot: null, items: [{ dueDate: null, priority: 0 }] });
    expect(change('create_todo', {})).toBeNull();
  });

  it('ASTTODO-005: an update merges its fields, null clearing them, and lists what it changes with the old values', () => {
    const args = { itemId: 21, category: 'Transport', due_date: null, priority: null, assigned_user_id: null };
    const card = todos(change('update_todo', args));
    expect(card.groups[0]).toMatchObject({ category: 'Transport', slot: null });
    expect(card.groups[0]?.items[0]).toMatchObject({ dueDate: null, dueDayId: null, priority: 0, assignee: null });
    expect(card.groups[0]?.items[0]?.changed).toEqual([
      { field: 'category', before: 'Bookings' },
      { field: 'dueDate', before: '2026-06-12' },
      { field: 'priority', before: '1' },
      { field: 'assignee', before: 'Ana' },
    ]);
    const noted = todos(change('update_todo', { itemId: 21, description: 'Call me@example.com' }));
    expect(noted.groups[0]?.items[0]).toMatchObject({ note: 'Call me@example.com', changed: [{ field: 'note' }] });
    expect(change('update_todo', { itemId: 99, name: 'x' })).toBeNull();
  });

  it('ASTTODO-006: a tick and a removal show the to-do in its list; one the trip does not hold shows none', () => {
    const ticked = todos(change('toggle_todo', { itemId: 22, checked: true }));
    expect(ticked.groups[0]).toMatchObject({ category: 'Documents', slot: 1, open: 0 });
    expect(ticked.groups[0]?.items[0]).toMatchObject({ checked: true, change: 'check' });
    const reopened = todos(change('toggle_todo', { itemId: 23, checked: false }));
    expect(reopened.groups[0]?.items[0]).toMatchObject({ checked: false, change: 'uncheck' });
    expect(todos(change('delete_todo', { itemId: 24 })).groups[0]?.items[0]?.change).toBe('remove');
    expect(change('toggle_todo', { itemId: 99, checked: true })).toBeNull();
    expect(change('delete_todo', { itemId: 99 })).toBeNull();
  });

  it("ASTTODO-007: a list's default people show the ones it will have and the ones it drops", () => {
    // What the loader hands on: the read's assignees by list name, unwrapped.
    const loaded = { Bookings: [{ user_id: 2 }] };
    const card = todos(change('set_todo_category_assignees', { categoryName: 'Bookings', userIds: [1] }, loaded));
    expect(card.groups).toEqual([
      {
        category: 'Bookings',
        slot: 0,
        assignees: [MAYA],
        assigneesRemoved: [ANA],
        items: [],
        count: 2,
        open: 2,
      },
    ]);
  });
});

/** The way back from a to-do tick, with the change card the tick showed. */
function todoBack(args: { itemId: number; checked: boolean }) {
  const preview = describeToolCall('toggle_todo', 'call_t', args, ctx);
  return ASSISTANT_UNDO_MAP.toggle_todo?.args(args, { item: { id: args.itemId } }, preview);
}

describe('the to-do writes, undo and receipts', () => {
  it('ASTTODO-008: the to-do writes name the to-do from the trip, their own action and a card', () => {
    expect(ASSISTANT_WRITE_TOOLS.delete_todo).toEqual({ verbKey: 'genericRemove', entity: 'todo' });
    expect(ASSISTANT_WRITE_TOOLS.set_todo_category_assignees).toEqual({ verbKey: 'genericUpdate', entity: 'todo' });
    const update = describeToolCall('update_todo', 'call_1', { itemId: 21, name: 'Ferry', due_date: null }, ctx);
    expect(update).toMatchObject({ subject: 'Book the ferry', tool: 'update_todo', verbKey: 'genericUpdate' });
    expect(update.rows.map((row) => [row.labelKey, row.before, row.after])).toEqual([
      ['name', 'Book the ferry', 'Ferry'],
      ['dueDate', expect.any(String), ''],
    ]);
    expect(update.card?.kind).toBe('todoList');
    const toggle = describeToolCall('toggle_todo', 'call_2', { itemId: 22, checked: true }, ctx);
    expect(toggle).toMatchObject({ subject: 'Travel insurance', tool: 'toggle_todo', undoable: true });
    const order = describeToolCall('reorder_todos', 'call_3', { orderedIds: [24, 21] }, ctx);
    expect(order.subject).toBe('Car seat, Book the ferry');
  });

  it('ASTTODO-009: a tick is taken back with the opposite tick while the to-do is as the tick left it', () => {
    expect(todoBack({ itemId: 22, checked: true })).toEqual({ itemId: 22, checked: false });
    expect(todoBack({ itemId: 23, checked: false })).toEqual({ itemId: 23, checked: true });
    const row = { id: 22, name: 'Travel insurance', checked: 1, due_date: '2026-06-10' };
    const snapshot = (rows: unknown[]) => ({ summary: { todos: rows }, places: { places: [] } });
    expect(unchangedSinceApplied('toggle_todo', { item: row }, snapshot([row]))).toBe(true);
    expect(unchangedSinceApplied('toggle_todo', { item: row }, snapshot([{ ...row, name: 'Insurance' }]))).toBe(false);
  });

  it('ASTTODO-011: a tick that changed nothing has no way back, nor one without its change card', () => {
    // Passport copies were done already, Travel insurance was still open.
    expect(todoBack({ itemId: 23, checked: true })).toBeNull();
    expect(todoBack({ itemId: 22, checked: false })).toBeNull();
    const ticked = todos(change('toggle_todo', { itemId: 22, checked: true }));
    expect(ticked.groups[0]?.items[0]?.changed).toEqual([{ field: 'done', before: '0' }]);
    const bare = ASSISTANT_UNDO_MAP.toggle_todo?.args({ itemId: 22, checked: true }, { item: { id: 22 } }, null);
    expect(bare).toBeNull();
  });

  it('ASTTODO-012: the old note and list on an update are masked; a name sent again shows no rename', () => {
    const mail = ctxWith(
      [],
      [{ id: 51, name: 'Mail me@example.com', category: 'Ask you@example.com', description: 'Write me@example.com' }],
    );
    const fields = { itemId: 51, description: 'Call', category: 'Calls' };
    const update = describeToolCall('update_todo', 'call_m', fields, mail);
    expect(JSON.stringify(update.rows)).not.toMatch(/me@example\.com|you@example\.com/);
    const args = { ...fields, name: 'Mail me@example.com' };
    const card = todos(changeCardOf('update_todo', mail, args, null));
    expect(card.groups[0]?.items[0]?.changed.map((entry) => entry.field)).toEqual(['note', 'category']);
    expect(JSON.stringify(card)).not.toContain('me@example.com');
  });

  it('ASTTODO-010: a new to-do gets the id the server gave it once applied', () => {
    const preview = describeToolCall('create_todo', 'call_4', { name: 'Pack' }, ctx);
    const input = { args: { name: 'Pack' }, result: { item: { id: 77 } }, preview };
    const applied = todos(appliedCardOf('create_todo', input));
    expect(applied.groups[0]?.items[0]?.id).toBe(77);
    expect(appliedCardOf('create_todo', { args: {}, result: 'To-do item not found.', preview })).toBeNull();
  });
});
