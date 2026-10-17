import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { buildTodoItem } from '../../../tests/helpers/factories';
import { useTaskForm } from './useTaskForm';

// FE-TODO-TASKFORM-001 to FE-TODO-TASKFORM-007

const VISA = buildTodoItem({
  id: 5,
  name: 'Visa',
  description: 'Fill the form',
  priority: 2,
  category: 'Docs',
  due_date: '2026-07-01',
  assigned_user_id: 3,
});

describe('useTaskForm', () => {
  it('FE-TODO-TASKFORM-001: starts on a saved task, the way the desktop detail pane opens', () => {
    const { result } = renderHook(() => useTaskForm(VISA));
    expect(result.current.name).toBe('Visa');
    expect(result.current.fields).toEqual({
      desc: 'Fill the form',
      priority: 2,
      category: 'Docs',
      dueDate: '2026-07-01',
      assignedUserId: 3,
    });
    expect(result.current.saving).toBe(false);
  });

  it('FE-TODO-TASKFORM-002: starts blank in the given list for a new task, or in none', () => {
    const inList = renderHook(() => useTaskForm(null, 'Docs')).result.current;
    expect(inList.name).toBe('');
    expect(inList.fields).toEqual({ desc: '', priority: 0, category: 'Docs', dueDate: '', assignedUserId: null });
    expect(renderHook(() => useTaskForm(null)).result.current.fields.category).toBe('');
  });

  it('FE-TODO-TASKFORM-003: patchFields changes only the fields it is given', () => {
    const { result } = renderHook(() => useTaskForm(VISA));
    act(() => result.current.patchFields({ priority: 1 }));
    act(() => result.current.patchFields({ category: 'Travel', assignedUserId: null }));
    expect(result.current.fields).toEqual({
      desc: 'Fill the form',
      priority: 1,
      category: 'Travel',
      dueDate: '2026-07-01',
      assignedUserId: null,
    });
    act(() => result.current.setName('Passport'));
    expect(result.current.name).toBe('Passport');
  });

  it('FE-TODO-TASKFORM-004: load puts the form on a task, or back on a blank one in a list', () => {
    const { result } = renderHook(() => useTaskForm(null));
    const loadBefore = result.current.load;
    act(() => result.current.load(VISA));
    expect(result.current.name).toBe('Visa');
    expect(result.current.fields.category).toBe('Docs');
    act(() => result.current.load(null, 'Home'));
    expect(result.current.name).toBe('');
    expect(result.current.fields).toEqual({
      desc: '',
      priority: 0,
      category: 'Home',
      dueDate: '',
      assignedUserId: null,
    });
    act(() => result.current.load(null));
    expect(result.current.fields.category).toBe('');
    // Stable, so an effect may list it without running again on every render.
    expect(result.current.load).toBe(loadBefore);
  });

  it('FE-TODO-TASKFORM-005: saveWith raises saving while the write is out and drops it after', async () => {
    const { result } = renderHook(() => useTaskForm(VISA));
    let finish = () => {};
    const write = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = () => resolve();
        })
    );
    const onError = vi.fn();
    let done: Promise<void> = Promise.resolve();
    act(() => {
      done = result.current.saveWith(write, onError);
    });
    expect(write).toHaveBeenCalledTimes(1);
    expect(result.current.saving).toBe(true);
    await act(async () => {
      finish();
      await done;
    });
    expect(result.current.saving).toBe(false);
    expect(onError).not.toHaveBeenCalled();
  });

  it('FE-TODO-TASKFORM-006: a failed write goes to onError with what it threw, and saving drops', async () => {
    const { result } = renderHook(() => useTaskForm(VISA));
    const boom = new Error('No permission');
    const onError = vi.fn();
    await act(async () => {
      await result.current.saveWith(() => Promise.reject(boom), onError);
    });
    expect(onError).toHaveBeenCalledWith(boom);
    expect(result.current.saving).toBe(false);
  });

  it('FE-TODO-TASKFORM-007: the form keeps what was typed when the task it started on changes', () => {
    const { result, rerender } = renderHook(({ item }) => useTaskForm(item), { initialProps: { item: VISA } });
    act(() => result.current.setName('Visa form'));
    rerender({ item: { ...VISA, name: 'Renamed elsewhere' } });
    expect(result.current.name).toBe('Visa form');
  });
});
