// FE-W4TDM-001 to FE-W4TDM-013
import { describe, expect, it } from 'vitest';
import { buildTodoItem } from '../../../tests/helpers/factories';
import {
  KAT_COLORS,
  PRIO_CONFIG,
  TODO_SMART_FILTERS,
  blankTaskFields,
  compareTodoDue,
  compareTodoPriority,
  filterTodoItems,
  filterTodoItemsByCategory,
  isTodoSmartFilter,
  katColor,
  taskFieldsOf,
  taskUpdatePayload,
} from './todoListModel';

describe('katColor', () => {
  it('FE-W4TDM-001: gives a known category the palette colour at its index', () => {
    const cats = ['Docs', 'Gear', 'Food'];

    expect(katColor('Docs', cats)).toBe(KAT_COLORS[0]);
    expect(katColor('Gear', cats)).toBe(KAT_COLORS[1]);
    expect(katColor('Food', cats)).toBe(KAT_COLORS[2]);
  });

  it('FE-W4TDM-002: wraps around when there are more categories than colours', () => {
    const cats = Array.from({ length: 12 }, (_, i) => `c${i}`);

    expect(katColor('c10', cats)).toBe(KAT_COLORS[0]);
    expect(katColor('c11', cats)).toBe(KAT_COLORS[1]);
  });

  it('FE-W4TDM-003: hashes an unlisted category into the palette', () => {
    const color = katColor('Ad-hoc', []);

    expect(KAT_COLORS).toContain(color);
    expect(katColor('Ad-hoc', [])).toBe(color);
  });

  it('FE-W4TDM-004: gives different unlisted categories different colours', () => {
    const seen = new Set(['Alpha', 'Bravo', 'Charlie', 'Delta'].map((c) => katColor(c, [])));
    expect(seen.size).toBeGreaterThan(1);
  });

  it('FE-W4TDM-005: handles an empty category name without going out of range', () => {
    expect(KAT_COLORS).toContain(katColor('', []));
  });
});

describe('PRIO_CONFIG', () => {
  it('FE-W4TDM-006: maps the three priorities to labels and colours', () => {
    expect(PRIO_CONFIG[1]).toEqual({ label: 'P1', color: '#ef4444' });
    expect(PRIO_CONFIG[2].label).toBe('P2');
    expect(PRIO_CONFIG[3].label).toBe('P3');
    expect(PRIO_CONFIG[4]).toBeUndefined();
    expect(KAT_COLORS).toHaveLength(10);
  });
});

describe('todo order shared by both lists', () => {
  it('FE-W4TDM-007: compareTodoPriority puts P1 first and tasks without a priority last', () => {
    const p2 = buildTodoItem({ id: 1, priority: 2 });
    const none = buildTodoItem({ id: 2, priority: 0 });
    const p1 = buildTodoItem({ id: 3, priority: 1 });
    expect([p2, none, p1].sort(compareTodoPriority).map((i) => i.id)).toEqual([3, 1, 2]);
    expect(compareTodoPriority(p2, buildTodoItem({ priority: 2 }))).toBe(0);
  });

  it('FE-W4TDM-008: compareTodoDue puts the nearest date first and undated tasks last, ties untouched', () => {
    const later = buildTodoItem({ id: 1, due_date: '2026-07-20' });
    const undated = buildTodoItem({ id: 2 });
    const sooner = buildTodoItem({ id: 3, due_date: '2026-07-16' });
    const sameDay = buildTodoItem({ id: 4, due_date: '2026-07-20' });
    const undated2 = buildTodoItem({ id: 5 });
    expect([later, undated, sooner, sameDay, undated2].sort(compareTodoDue).map((i) => i.id)).toEqual([3, 1, 4, 2, 5]);
    expect(compareTodoDue(undated, undated2)).toBe(0);
    expect(compareTodoDue(undated, sooner)).toBe(1);
    expect(compareTodoDue(sooner, undated)).toBe(-1);
  });

  it('FE-W4TDM-009: filterTodoItems reads a name it does not know as a category, as the desktop sidebar does', () => {
    const items = [buildTodoItem({ id: 1, category: 'my' }), buildTodoItem({ id: 2, category: 'Gear' })];
    expect(filterTodoItems(items, 'Gear', 7, '2026-07-15').map((i) => i.id)).toEqual([2]);
    expect(filterTodoItemsByCategory(items, 'my').map((i) => i.id)).toEqual([1]);
  });
});

describe('task form fields', () => {
  it('FE-W4TDM-010: taskFieldsOf reads a saved task with empty strings for what it lacks', () => {
    expect(
      taskFieldsOf(
        buildTodoItem({ description: null, priority: 0, category: null, due_date: null, assigned_user_id: null })
      )
    ).toEqual({
      desc: '',
      priority: 0,
      category: '',
      dueDate: '',
      assignedUserId: null,
    });
    expect(
      taskFieldsOf(
        buildTodoItem({
          description: 'Ask',
          priority: 2,
          category: 'Docs',
          due_date: '2026-07-01',
          assigned_user_id: 4,
        })
      )
    ).toEqual({
      desc: 'Ask',
      priority: 2,
      category: 'Docs',
      dueDate: '2026-07-01',
      assignedUserId: 4,
    });
  });

  it('FE-W4TDM-011: blankTaskFields files a new task in the given list, or in none', () => {
    expect(blankTaskFields('Docs')).toEqual({
      desc: '',
      priority: 0,
      category: 'Docs',
      dueDate: '',
      assignedUserId: null,
    });
    expect(blankTaskFields(null).category).toBe('');
    expect(blankTaskFields().category).toBe('');
  });

  it('FE-W4TDM-012: taskUpdatePayload trims the name and sends every emptied field as null', () => {
    expect(
      taskUpdatePayload('  Visa  ', { desc: '', priority: 0, category: '', dueDate: '', assignedUserId: null })
    ).toEqual({
      name: 'Visa',
      description: null,
      due_date: null,
      category: null,
      assigned_user_id: null,
      priority: 0,
    });
    expect(
      taskUpdatePayload('Visa', {
        desc: 'Form',
        priority: 1,
        category: 'Docs',
        dueDate: '2026-07-01',
        assignedUserId: 3,
      })
    ).toEqual({
      name: 'Visa',
      description: 'Form',
      due_date: '2026-07-01',
      category: 'Docs',
      assigned_user_id: 3,
      priority: 1,
    });
  });
});

describe('built-in filters', () => {
  it('FE-W4TDM-013: lists the four built-ins and tells them apart from category names', () => {
    expect(TODO_SMART_FILTERS).toEqual(['all', 'my', 'overdue', 'done']);
    for (const f of TODO_SMART_FILTERS) expect(isTodoSmartFilter(f)).toBe(true);
    expect(isTodoSmartFilter('Docs')).toBe(false);
    expect(isTodoSmartFilter('All')).toBe(false);
    expect(isTodoSmartFilter('')).toBe(false);
  });
});
