import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { buildTodoItem } from '../../../tests/helpers/factories';
import apiClient from '../../api/client';
import { useTodoList, useTodoView } from './useTodoList';

// FE-TODO-VIEW-001 to FE-TODO-VIEW-010

vi.mock('../../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/client')>()),
  default: { get: vi.fn() },
}));

const TODAY = '2026-07-10';

// In manual order: an open undated P3, a done task, an open overdue P2, an open
// task due later with P1 and mine, and an open task filed in a category named "all".
const PLAIN = buildTodoItem({ id: 1, name: 'Plain', priority: 3 });
const DONE = buildTodoItem({ id: 2, name: 'Done', checked: 1, category: 'Docs' });
const LATE = buildTodoItem({ id: 3, name: 'Late', priority: 2, due_date: '2026-07-01', category: 'Docs' });
const SOON = buildTodoItem({ id: 4, name: 'Soon', priority: 1, due_date: '2026-07-20', assigned_user_id: 7 });
const NAMED_ALL = buildTodoItem({ id: 5, name: 'Named all', category: 'all' });
const ITEMS = [PLAIN, DONE, LATE, SOON, NAMED_ALL];

const ids = (rows: { id: number }[]) => rows.map((r) => r.id);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 6, 10, 12, 0, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useTodoView', () => {
  it('FE-TODO-VIEW-001: starts on the open tasks in manual order, with no sort and the counts of the list', () => {
    const { result } = renderHook(() => useTodoView(ITEMS, 7));

    expect(result.current.active).toEqual({ kind: 'smart', id: 'all' });
    expect(result.current.filter).toBe('all');
    expect(result.current.sortBy).toBeNull();
    expect(result.current.today).toBe(TODAY);
    expect(ids(result.current.rows)).toEqual([1, 3, 4, 5]);
    expect(result.current.counts).toEqual({ total: 5, open: 4, done: 1, overdue: 1, my: 1 });
    expect(result.current.categories).toEqual(['all', 'Docs']);
    expect(result.current.catCount('Docs')).toBe(1);
  });

  it('FE-TODO-VIEW-002: the desktop string filter sends a built-in id to the built-in and any other name to its category', () => {
    const { result } = renderHook(() => useTodoView(ITEMS, 7));

    act(() => result.current.setFilter('Docs'));
    expect(result.current.active).toEqual({ kind: 'category', name: 'Docs' });
    expect(result.current.filter).toBe('Docs');
    expect(ids(result.current.rows)).toEqual([2, 3]);

    act(() => result.current.setFilter('my'));
    expect(result.current.active).toEqual({ kind: 'smart', id: 'my' });
    expect(ids(result.current.rows)).toEqual([4]);

    // A category called "all" picked through the string lands on the built-in.
    act(() => result.current.setFilter('all'));
    expect(result.current.active).toEqual({ kind: 'smart', id: 'all' });
    expect(ids(result.current.rows)).toEqual([1, 3, 4, 5]);
  });

  it('FE-TODO-VIEW-003: the phone addresses a category by name, so one called "all" keeps its own rows', () => {
    const { result } = renderHook(() => useTodoView(ITEMS, 7, { rankByStatus: true }));

    act(() => result.current.setActive({ kind: 'category', name: 'all' }));
    expect(result.current.filter).toBe('all');
    expect(ids(result.current.rows)).toEqual([5]);
  });

  it('FE-TODO-VIEW-004: toggleSort switches between priority and due date, and a second press goes back to manual', () => {
    const { result } = renderHook(() => useTodoView(ITEMS, 7));

    act(() => result.current.toggleSort('priority'));
    expect(result.current.sortBy).toBe('priority');
    act(() => result.current.toggleSort('due'));
    expect(result.current.sortBy).toBe('due');
    act(() => result.current.toggleSort('due'));
    expect(result.current.sortBy).toBeNull();
  });

  it('FE-TODO-VIEW-005: the desktop order sorts the filtered rows by the toggle alone', () => {
    const { result } = renderHook(() => useTodoView(ITEMS, 7));
    act(() => result.current.setFilter('Docs'));
    // Manual order keeps the done task first.
    expect(ids(result.current.rows)).toEqual([2, 3]);

    act(() => result.current.setFilter('all'));
    act(() => result.current.toggleSort('priority'));
    expect(ids(result.current.rows)).toEqual([4, 3, 1, 5]);

    act(() => result.current.toggleSort('due'));
    expect(ids(result.current.rows)).toEqual([3, 4, 1, 5]);
  });

  it('FE-TODO-VIEW-006: the phone order sinks done tasks, floats overdue ones and lets the toggle break ties', () => {
    const { result } = renderHook(() => useTodoView(ITEMS, 7, { rankByStatus: true }));
    act(() => result.current.setActive({ kind: 'category', name: 'Docs' }));
    expect(ids(result.current.rows)).toEqual([3, 2]);

    act(() => result.current.setActive({ kind: 'smart', id: 'all' }));
    expect(ids(result.current.rows)).toEqual([3, 1, 4, 5]);

    act(() => result.current.toggleSort('priority'));
    expect(ids(result.current.rows)).toEqual([3, 4, 1, 5]);
  });

  it('FE-TODO-VIEW-007: the desktop reads today on every render, so a task turns overdue after midnight', () => {
    const due = buildTodoItem({ id: 9, due_date: TODAY });
    const { result, rerender } = renderHook(() => useTodoView([due], null));
    expect(result.current.counts.overdue).toBe(0);

    vi.setSystemTime(new Date(2026, 6, 11, 0, 5, 0));
    rerender();
    expect(result.current.today).toBe('2026-07-11');
    expect(result.current.counts.overdue).toBe(1);
  });

  it('FE-TODO-VIEW-008: the phone pins today when the tab mounts', () => {
    const due = buildTodoItem({ id: 9, due_date: TODAY });
    const { result, rerender } = renderHook(() => useTodoView([due], null, { pinToday: true }));

    vi.setSystemTime(new Date(2026, 6, 11, 0, 5, 0));
    rerender();
    expect(result.current.today).toBe(TODAY);
    expect(result.current.counts.overdue).toBe(0);
  });

  it('FE-TODO-VIEW-009: with no user nothing counts or shows as mine', () => {
    const { result } = renderHook(() => useTodoView(ITEMS, null));
    act(() => result.current.setFilter('my'));
    expect(result.current.rows).toEqual([]);
    expect(result.current.counts.my).toBe(0);
  });
});

describe('useTodoList', () => {
  it('FE-TODO-VIEW-010: runs the desktop view state on the user the member load names', async () => {
    (apiClient.get as Mock).mockResolvedValue({
      data: { owner: { id: 1, username: 'owner', avatar: null }, members: [], current_user_id: 7 },
    });
    const { result } = renderHook(() => useTodoList(1, ITEMS, 0));

    await waitFor(() => expect(result.current.myCount).toBe(1));
    expect(apiClient.get).toHaveBeenCalledWith('/trips/1/members');
    expect(ids(result.current.filtered)).toEqual([1, 3, 4, 5]);
    expect(result.current.totalCount).toBe(5);
    expect(result.current.doneCount).toBe(1);
    expect(result.current.overdueCount).toBe(1);

    act(() => result.current.toggleSort('priority'));
    expect(result.current.sortByPrio).toBe(true);
    expect(result.current.sortByDue).toBe(false);
    expect(ids(result.current.filtered)).toEqual([4, 3, 1, 5]);

    act(() => result.current.toggleSort('due'));
    expect(result.current.sortByPrio).toBe(false);
    expect(result.current.sortByDue).toBe(true);

    act(() => result.current.setFilter('my'));
    expect(result.current.filter).toBe('my');
    expect(ids(result.current.filtered)).toEqual([4]);
  });
});
