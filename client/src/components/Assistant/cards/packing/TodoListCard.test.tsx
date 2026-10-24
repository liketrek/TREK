/**
 * FE-AI-TODO-001 to FE-AI-TODO-007
 *
 * The to-dos in the chat: what is open and overdue, lists with their colour
 * and open count, tasks with their note, priority in the panel's tones, a due
 * date that turns red once passed by the reader's own day and shows its day
 * in the plan, who a task is for; a change's facts on its line, a list's
 * people under it, and a run of task changes as one checklist.
 */
import type { TodoCardItem, TodoListCard } from '@trek/shared';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../../../tests/helpers/render';
import type { ChangeItem } from '../../assistantParts';
import { type AssistantView, AssistantViewContext } from '../../assistantViewContext';
import { TodoChangeBody, TodoChangeLine, TodoChangeRun, TodoListBlock } from './TodoListCard';

vi.mock('../../../Planner/today', () => ({ localToday: () => '2026-06-11' }));

const ANA = { id: 2, name: 'Ana', avatarKey: null };

const task = (id: number | null, name: string, over: Partial<TodoCardItem> = {}): TodoCardItem => ({
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
  ...over,
});

const ANSWER: TodoListCard = {
  kind: 'todoList',
  progress: { open: 2, done: 1, overdue: 1 },
  groups: [
    {
      category: 'Bookings',
      slot: 0,
      assignees: [],
      assigneesRemoved: [],
      items: [
        task(21, 'Book the ferry', {
          note: 'Check the early sailing first',
          dueDate: '2026-06-10',
          dueDayId: 31,
          priority: 1,
          assignee: ANA,
        }),
        task(24, 'Car seat', { dueDate: '2026-06-14', priority: 2 }),
      ],
      count: 4,
      open: 2,
    },
    {
      category: null,
      slot: null,
      assignees: [],
      assigneesRemoved: [],
      items: [task(23, 'Passport copies', { checked: true })],
      count: 1,
      open: 0,
    },
  ],
  moreGroups: 1,
};

function inView(ui: ReactNode, view: Partial<AssistantView> = {}) {
  const value: AssistantView = { tripId: 4, variant: 'window', ...view };
  return render(<AssistantViewContext.Provider value={value}>{ui}</AssistantViewContext.Provider>);
}

const one = (item: TodoCardItem, category: string | null = 'Bookings'): TodoListCard => ({
  kind: 'todoList',
  progress: null,
  groups: [{ category, slot: 0, assignees: [], assigneesRemoved: [], items: [item], count: 1, open: 1 }],
  moreGroups: 0,
});

const pending = (id: string, card: TodoListCard): ChangeItem => ({
  toolCallId: id,
  preview: null,
  applied: null,
  state: 'pending',
  card,
});

describe('TodoListCard', () => {
  it('FE-AI-TODO-001: an answer counts what is open and overdue and shows its lists with their tasks', () => {
    inView(<TodoListBlock cards={[{ toolCallId: 'call_1', card: ANSWER }]} />);
    expect(screen.getByRole('region', { name: 'To-dos' })).toBeInTheDocument();
    expect(screen.getByText('2 open')).toBeInTheDocument();
    expect(screen.getByText('1 overdue')).toBeInTheDocument();
    expect(screen.getByText('Bookings')).toBeInTheDocument();
    expect(screen.getByText('No list')).toBeInTheDocument();
    expect(screen.getByText('Check the early sailing first')).toHaveAttribute('title', 'Check the early sailing first');
    expect(screen.getByText('Passport copies')).toHaveClass('line-through');
    expect(screen.getByText('2 more tasks')).toBeInTheDocument();
  });

  it("FE-AI-TODO-002: priorities take the panel tones; a passed due date turns red by the reader's own day", () => {
    inView(<TodoListBlock cards={[{ toolCallId: 'call_1', card: ANSWER }]} />, { onOpen: vi.fn() });
    expect(screen.getByText('P1').closest('span')).toHaveClass('text-danger');
    expect(screen.getByText('P2').closest('span')).toHaveClass('text-warning');
    const due = screen.getAllByRole('button', { name: /Show this day in the plan/ });
    expect(due).toHaveLength(1);
    expect(due[0]?.firstElementChild).toHaveClass('text-danger');
    expect(screen.getByRole('img', { name: 'Ana' })).toBeInTheDocument();
  });

  it('FE-AI-TODO-003: a due date shows its day in the plan; the foot leads into the to-do list', () => {
    const onOpen = vi.fn();
    inView(<TodoListBlock cards={[{ toolCallId: 'call_1', card: ANSWER }]} />, { onOpen });
    fireEvent.click(screen.getByRole('button', { name: /Show this day in the plan/ }));
    expect(onOpen).toHaveBeenCalledWith({ kind: 'map', placeId: null, dayId: 31 });
    fireEvent.click(screen.getByRole('button', { name: '1 more list' }));
    fireEvent.click(screen.getByRole('button', { name: /Open the to-do list/ }));
    expect(onOpen).toHaveBeenLastCalledWith({ kind: 'tab', tab: 'listen', sub: 'todo' });
  });

  it('FE-AI-TODO-004: a change of one task states its facts, old values struck through', () => {
    const update = one(
      task(21, 'Book the ferry', {
        change: 'update',
        priority: 2,
        changed: [
          { field: 'priority', before: '1' },
          { field: 'assignee', before: 'Ana' },
        ],
      })
    );
    inView(<TodoChangeLine card={update} item={pending('c1', update)} />);
    expect(screen.getByText('P1')).toHaveClass('line-through');
    expect(screen.getAllByText('P2').length).toBeGreaterThan(0);
    expect(screen.getByText('Ana')).toHaveClass('line-through');
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('FE-AI-TODO-007: an update that moves the due date or the priority states it once, old to new', () => {
    const moved = one(
      task(24, 'Car seat', {
        change: 'update',
        dueDate: '2026-06-14',
        dueDayId: 32,
        priority: 2,
        changed: [
          { field: 'dueDate', before: '2026-06-12' },
          { field: 'priority', before: '1' },
        ],
      })
    );
    inView(<TodoChangeLine card={moved} item={pending('c1', moved)} />, { onOpen: vi.fn() });
    expect(screen.queryByRole('button', { name: /Show this day in the plan/ })).not.toBeInTheDocument();
    expect(screen.getAllByText('P2')).toHaveLength(1);
    expect(screen.getByText('P1')).toHaveClass('line-through');
  });

  it("FE-AI-TODO-005: a list's people show under the change, the ones it drops named", () => {
    const people: TodoListCard = {
      kind: 'todoList',
      progress: null,
      groups: [
        {
          category: 'Bookings',
          slot: 0,
          assignees: [ANA],
          assigneesRemoved: [{ ...ANA, id: 3, name: 'Ben' }],
          items: [],
          count: 2,
          open: 2,
        },
      ],
      moreGroups: 0,
    };
    inView(<TodoChangeBody card={people} item={pending('c1', people)} />);
    expect(screen.getByRole('img', { name: 'Ana' })).toBeInTheDocument();
    expect(screen.getByText('No longer: Ben')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Ben' })).toBeInTheDocument();
  });

  it('FE-AI-TODO-006: a run of task changes reads as one checklist under its list', () => {
    const onToggle = vi.fn();
    const items = [
      pending('c1', one(task(null, 'Book the train', { change: 'add' }))),
      pending('c2', one(task(22, 'Travel insurance', { change: 'check', checked: true }))),
    ];
    inView(<TodoChangeRun items={items} excluded={new Set()} disabled={false} onToggle={onToggle} />);
    expect(screen.getAllByText('Bookings')).toHaveLength(1);
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Include this change' })[0] as HTMLElement);
    expect(onToggle).toHaveBeenCalledWith('c1');
  });
});
