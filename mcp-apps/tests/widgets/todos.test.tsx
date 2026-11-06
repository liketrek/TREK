import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { translator } from '../../src/lib/i18n';
import type { TrekAppState } from '../../src/lib/useTrekApp';
import { App } from '../../src/widgets/todos/App';
import { Todos } from '../../src/widgets/todos/Todos';

const t = translator('en');
const todo = (id: number, extra: Record<string, unknown> = {}) => ({
  id,
  trip_id: 4,
  name: `Todo ${id}`,
  checked: 0,
  sort_order: id,
  due_date: null,
  category: null,
  description: null,
  assigned_user_id: null,
  priority: null,
  created_at: null,
  reminded_at: null,
  ...extra,
});

let state: TrekAppState;
vi.mock('../../src/lib/useTrekApp', () => ({ useTrekApp: () => state }));
afterEach(cleanup);

describe('Todos', () => {
  it('APPS-TODOS-001: lists the open ones first with their due date and counts the done ones', () => {
    render(
      <Todos
        data={{ items: [todo(1, { checked: 1 }), todo(2, { due_date: '2027-05-12' })] }}
        locale="en-GB"
        t={t}
        onToggle={vi.fn(async () => true)}
      />
    );
    expect(screen.getByText('Done: 1 / 2')).toBeTruthy();
    const boxes = screen.getAllByRole('checkbox');
    expect(boxes[0].textContent).toContain('Todo 2');
    expect(screen.getByText(/Due: .*12.*May.*2027/)).toBeTruthy();
  });

  it('APPS-TODOS-002: ticks at once and puts the tick back when TREK refuses', async () => {
    const onToggle = vi.fn(async () => false);
    render(<Todos data={{ items: [todo(1)] }} locale="en" t={t} onToggle={onToggle} />);
    const box = screen.getByRole('checkbox', { name: 'Todo 1' });
    await act(async () => fireEvent.click(box));
    expect(onToggle).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), true);
    await waitFor(() => expect(box.getAttribute('aria-checked')).toBe('false'));
    expect(screen.getByRole('alert').textContent).toBe('Could not update the to-do. Try again.');
  });

  it('APPS-TODOS-003: says so when there is nothing to do, and when the result is not a to-do list', () => {
    const { unmount } = render(<Todos data={{ items: [] }} locale="en" t={t} onToggle={vi.fn()} />);
    expect(screen.getByText('Nothing to do here')).toBeTruthy();
    unmount();
    render(<Todos data={{ items: 'no' }} locale="en" t={t} onToggle={vi.fn()} />);
    expect(screen.getByText('Something went wrong. Try again.')).toBeTruthy();
  });
});

describe('todos App', () => {
  const withResult = (callServerTool: ReturnType<typeof vi.fn>) => {
    state = {
      app: { callServerTool } as unknown as TrekAppState['app'],
      result: { structuredContent: { items: [todo(1)] }, appUrl: null },
      input: null,
      error: null,
      locale: 'en-GB',
      t,
    };
  };

  it('APPS-TODOS-004: ticks through toggle_todo on the host’s session', async () => {
    const callServerTool = vi.fn(async () => ({ content: [] }));
    withResult(callServerTool);
    render(<App />);
    await act(async () => fireEvent.click(screen.getByRole('checkbox', { name: 'Todo 1' })));
    expect(callServerTool).toHaveBeenCalledWith({
      name: 'toggle_todo',
      arguments: { tripId: 4, itemId: 1, checked: true },
    });
    expect(screen.getByRole('checkbox', { name: 'Todo 1' }).getAttribute('aria-checked')).toBe('true');
  });

  it('APPS-TODOS-005: counts an error answer or a failed call as refused', async () => {
    const callServerTool = vi
      .fn()
      .mockResolvedValueOnce({ content: [], isError: true })
      .mockRejectedValueOnce(new Error('gone'));
    withResult(callServerTool);
    render(<App />);
    const box = screen.getByRole('checkbox', { name: 'Todo 1' });
    await act(async () => fireEvent.click(box));
    await waitFor(() => expect(box.getAttribute('aria-checked')).toBe('false'));
    await act(async () => fireEvent.click(box));
    await waitFor(() => expect(callServerTool).toHaveBeenCalledTimes(2));
    expect(box.getAttribute('aria-checked')).toBe('false');
  });
});
