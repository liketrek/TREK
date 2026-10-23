import type { TripCard } from '../../assistant-context';
import { clipped, finite, personOf, recordOf } from '../card-values';
import { argText, categoryOf, positiveId, rowsOf } from './packing-rows';
import type { TodoCardGroup, TodoCardItem, TodoListCard } from '@trek/shared';

/**
 * The pieces every to-do card is built from: a to-do as the to-do tools
 * answer it, its row, its group (its list) and the list's colour slot. Text
 * from a tool's answer is masked like a provider answer, text from a call's
 * arguments only cut.
 */

const MAX_TODO_ROWS = 20;
/** Rows a group shows at least, done ones filling up after the open ones. */
const TODO_FILL = 5;
const MAX_TODO_GROUPS = 12;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** A to-do as `get_trip_summary`, `list_todos` and the writes answer it. */
export interface ListTodo {
  id: number;
  /** As shown: masked when it comes from a tool's answer. */
  name: string;
  /** As stored, to tell whether a write really renames it; never shown. */
  rawName: string;
  category: string | null;
  checked: boolean;
  dueDate: string | null;
  priority: number;
  assigneeId: number | null;
  description: string | null;
}

export function dateOf(value: unknown): string | null {
  return typeof value === 'string' && ISO_DATE.test(value) ? value : null;
}

export function priorityOf(value: unknown): number {
  const n = finite(value);
  return n !== null && Number.isInteger(n) && n >= 1 && n <= 3 ? n : 0;
}

/** One to-do from a tool's answer; null for a row without an id or a name. */
function listTodoOf(raw: unknown): ListTodo | null {
  const row = recordOf(raw);
  const id = positiveId(row.id);
  const rawName = typeof row.name === 'string' ? row.name : null;
  const name = clipped(rawName, 300);
  if (id === null || rawName === null || name === null) return null;
  return {
    id,
    name,
    rawName,
    category: categoryOf(row.category),
    checked: !!row.checked,
    dueDate: dateOf(row.due_date),
    priority: priorityOf(row.priority),
    assigneeId: positiveId(row.assigned_user_id),
    description: typeof row.description === 'string' ? row.description : null,
  };
}

export function listTodosOf(value: unknown): ListTodo[] {
  return rowsOf(value).flatMap((row) => listTodoOf(row) ?? []);
}

const TRIP_TODOS = new WeakMap<TripCard, ListTodo[]>();

/** The trip's to-dos as the turn read them; read once per card. */
export function tripTodos(card: TripCard): ListTodo[] {
  let todos = TRIP_TODOS.get(card);
  if (!todos) {
    todos = listTodosOf(recordOf(card.sources.summary).todos);
    TRIP_TODOS.set(card, todos);
  }
  return todos;
}

export function tripTodo(card: TripCard, id: number | null): ListTodo | null {
  return id === null ? null : (tripTodos(card).find((todo) => todo.id === id) ?? null);
}

/** The trip day on a date, for the date to show it in the plan. */
function dayOn(card: TripCard, date: string | null): number | null {
  return date === null ? null : (card.days.find((day) => day.date === date)?.id ?? null);
}

/** The first line of a description with text on it: masked from an answer, only cut from arguments. */
function noteOf(description: string | null, mask: boolean): string | null {
  const line = description?.split(/\r?\n/).find((part) => part.trim() !== '') ?? null;
  return mask ? clipped(line, 160) : argText(line, 160);
}

/**
 * The lists in the order the to-do panel sorts them (`todoCategories`): by
 * name in the reader's language, the same `localeCompare` the panel calls.
 */
function todoCategories(todos: readonly ListTodo[]): string[] {
  const names = new Set<string>();
  for (const todo of todos) if (todo.category) names.add(todo.category);
  return [...names].sort((a, b) => a.localeCompare(b));
}

/** A list's colour slot among the trip's lists; null for a list the trip does not hold yet. */
export function todoSlot(card: TripCard, category: string | null): number | null {
  if (category === null) return null;
  const index = todoCategories(tripTodos(card)).indexOf(category);
  return index < 0 ? null : index;
}

/** A to-do's row on a card; the note is masked unless it comes from the call's own arguments. */
export function todoRow(
  card: TripCard,
  todo: ListTodo,
  options: { mask: boolean; change?: TodoCardItem['change']; changed?: TodoCardItem['changed'] },
): TodoCardItem {
  return {
    id: todo.id > 0 ? todo.id : null,
    name: todo.name,
    note: noteOf(todo.description, options.mask),
    checked: todo.checked,
    dueDate: todo.dueDate,
    dueDayId: dayOn(card, todo.dueDate),
    priority: todo.priority,
    assignee: todo.assigneeId === null ? null : personOf(card, todo.assigneeId),
    change: options.change ?? 'none',
    changed: options.changed ?? [],
  };
}

/** Nearest due date first, undated ones after every dated one; ties keep their order (`compareTodoDue`). */
function compareDue(a: ListTodo, b: ListTodo): number {
  if (!a.dueDate) return b.dueDate ? 1 : 0;
  if (!b.dueDate) return -1;
  return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0;
}

/** A to-do list card. */
export function todoCard(
  groups: TodoCardGroup[],
  extra: { moreGroups?: number; progress?: TodoListCard['progress'] } = {},
): TodoListCard {
  return { kind: 'todoList', progress: extra.progress ?? null, groups, moreGroups: extra.moreGroups ?? 0 };
}

/**
 * The to-dos of an answer by list, in the panel's order with the ones on no
 * list last. A list shows its open to-dos first, overdue and soonest due on
 * top, and done ones only to fill up to five rows; 20 rows in all. Every
 * group counts all of its to-dos.
 */
export function todoGroups(
  card: TripCard,
  todos: readonly ListTodo[],
): { groups: TodoCardGroup[]; moreGroups: number } {
  const lists: Array<string | null> = todoCategories(todos);
  if (todos.some((todo) => todo.category === null)) lists.push(null);
  let left = MAX_TODO_ROWS;
  const groups = lists.slice(0, MAX_TODO_GROUPS).map((category, slot): TodoCardGroup => {
    const all = todos.filter((todo) => todo.category === category);
    const open = all.filter((todo) => !todo.checked).sort(compareDue);
    const shown = open.slice(0, left);
    for (const done of all.filter((todo) => todo.checked)) {
      if (shown.length >= Math.min(TODO_FILL, left)) break;
      shown.push(done);
    }
    left -= shown.length;
    return {
      category: category === null ? null : clipped(category, 100),
      slot: category === null ? null : slot,
      assignees: [],
      assigneesRemoved: [],
      items: shown.map((todo) => todoRow(card, todo, { mask: true })),
      count: all.length,
      open: open.length,
    };
  });
  return { groups, moreGroups: Math.max(0, lists.length - MAX_TODO_GROUPS) };
}
