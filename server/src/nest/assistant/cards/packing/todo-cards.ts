import type { AnswerInput, PreviewContext, ToolArgs, ToolCards } from '../card-types';
import { argId, clipped, recordOf } from '../card-values';
import { formatDate, memberNames, Rows, text } from '../preview-format';
import { byId, same, STABLE_FIELDS } from '../undo-snapshot';
import { argText, idsOf, peopleOf, positiveId, rowsOf } from './packing-rows';
import {
  dateOf,
  listTodosOf,
  priorityOf,
  todoCard,
  todoGroups,
  todoRow,
  todoSlot,
  tripTodo,
  tripTodos,
  type ListTodo,
} from './todo-rows';
import type { AssistantChangePreview, TodoCardItem, TodoListCard } from '@trek/shared';

/**
 * The to-dos in the assistant chat: the list a read shows, grouped as the
 * to-do panel groups it, and the card each change to a to-do or to a list's
 * people shows inside its change card. A change names the to-do from the
 * trip as the turn read it; one it cannot find shows no card.
 */

/** `list_todos`: the trip's to-dos by list, with what is open, done and overdue. */
function listTodosAnswer({ value, card, today }: AnswerInput): TodoListCard | null {
  const todos = listTodosOf(recordOf(value).items);
  if (todos.length === 0) return null;
  const { groups, moreGroups } = todoGroups(card, todos);
  const open = todos.filter((todo) => !todo.checked);
  const progress = {
    open: open.length,
    done: todos.length - open.length,
    overdue: open.filter((todo) => todo.dueDate !== null && todo.dueDate < today).length,
  };
  return todoCard(groups, { moreGroups, progress });
}

/**
 * One to-do in its list: what a change to a single to-do shows. The list's
 * name is masked when it comes from the trip, kept as written from arguments.
 */
function oneTodoCard(ctx: PreviewContext, row: TodoCardItem, category: string | null, mask = true): TodoListCard {
  const name = mask ? clipped(category, 100) : argText(category, 100);
  return todoCard([
    {
      category: name,
      slot: todoSlot(ctx.card, category),
      assignees: [],
      assigneesRemoved: [],
      items: [row],
      count: 1,
      open: row.checked ? 0 : 1,
    },
  ]);
}

function has(args: ToolArgs, key: string): boolean {
  return args[key] !== undefined;
}

function descriptionOf(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

/** A to-do with the fields a write names merged in; `null` clears a field that may be empty. */
function mergedTodo(before: ListTodo, args: ToolArgs): ListTodo {
  // A name sent again as it is stays the one shown, masked as the trip read it.
  const named = has(args, 'name') ? argText(args.name, 300) : null;
  return {
    ...before,
    name: named === null || named === argText(before.rawName, 300) ? before.name : named,
    rawName: named ?? before.rawName,
    category: has(args, 'category') ? argText(args.category, 100) : before.category,
    dueDate: has(args, 'due_date') ? dateOf(args.due_date) : before.dueDate,
    description: has(args, 'description') ? descriptionOf(args.description) : before.description,
    assigneeId: has(args, 'assigned_user_id') ? positiveId(args.assigned_user_id) : before.assigneeId,
    priority: has(args, 'priority') ? priorityOf(args.priority) : before.priority,
  };
}

/**
 * The fields a write changes, each with what it held before. The notes are
 * the rows' own (the old one masked), the list names the old one masked.
 */
function todoChanges(
  ctx: PreviewContext,
  before: ListTodo,
  after: ListTodo,
  notes: [string | null, string | null],
): TodoCardItem['changed'] {
  const name = (id: number | null) => (id === null ? null : (ctx.card.members.get(id)?.name ?? null));
  // Each field with its old value as shown, and whether the write changes it.
  const fields: Array<[TodoCardItem['changed'][number]['field'], string | null, boolean]> = [
    ['name', before.name, before.name !== after.name],
    ['note', notes[0], notes[0] !== notes[1]],
    ['category', clipped(before.category, 100), before.category !== after.category],
    ['dueDate', before.dueDate, before.dueDate !== after.dueDate],
    ['priority', String(before.priority), before.priority !== after.priority],
    ['assignee', name(before.assigneeId), before.assigneeId !== after.assigneeId],
  ];
  return fields
    .filter(([, , changes]) => changes)
    .map(([field, old]) => ({ field, before: old === null ? null : old.slice(0, 120) }));
}

function createTodoCard(ctx: PreviewContext, args: ToolArgs): TodoListCard | null {
  const name = argText(args.name, 300);
  if (name === null) return null;
  const category = argText(args.category, 100);
  const todo: ListTodo = {
    id: 0,
    name,
    rawName: name,
    category,
    checked: false,
    dueDate: dateOf(args.due_date),
    priority: priorityOf(args.priority),
    assigneeId: positiveId(args.assigned_user_id),
    description: descriptionOf(args.description),
  };
  return oneTodoCard(ctx, todoRow(ctx.card, todo, { mask: false, change: 'add' }), category, false);
}

function updateTodoCard(ctx: PreviewContext, args: ToolArgs): TodoListCard | null {
  const before = tripTodo(ctx.card, argId(args, 'itemId'));
  if (!before) return null;
  const after = mergedTodo(before, args);
  // The note comes from the arguments only when the write sets it.
  const row = todoRow(ctx.card, after, { mask: !has(args, 'description'), change: 'update' });
  const oldNote = todoRow(ctx.card, before, { mask: true }).note;
  const changed = todoChanges(ctx, before, after, [oldNote, row.note]);
  return oneTodoCard(ctx, { ...row, changed }, after.category, !has(args, 'category'));
}

/** A tick, keeping whether the to-do was done before, so the tick is only taken back when it changed that. */
function toggleTodoCard(ctx: PreviewContext, args: ToolArgs): TodoListCard | null {
  const before = tripTodo(ctx.card, argId(args, 'itemId'));
  if (!before) return null;
  const checked = args.checked === true;
  const changed: TodoCardItem['changed'] = [{ field: 'done', before: before.checked ? '1' : '0' }];
  const change = checked ? 'check' : 'uncheck';
  const row = todoRow(ctx.card, { ...before, checked }, { mask: true, change, changed });
  return oneTodoCard(ctx, row, before.category);
}

function deleteTodoCard(ctx: PreviewContext, args: ToolArgs): TodoListCard | null {
  const before = tripTodo(ctx.card, argId(args, 'itemId'));
  return before ? oneTodoCard(ctx, todoRow(ctx.card, before, { mask: true, change: 'remove' }), before.category) : null;
}

/** The default assignees a list has now, by list name (`get_todo_category_assignees`). */
type TodoAssignees = Record<string, unknown>;

async function loadTodoAssignees(_args: ToolArgs, read: (tool: string) => Promise<unknown>): Promise<TodoAssignees> {
  return recordOf(recordOf(await read('get_todo_category_assignees')).assignees);
}

/** `set_todo_category_assignees`: the list's head with the people it will have and the ones it drops. */
function todoAssigneesCard(ctx: PreviewContext, args: ToolArgs, loaded: TodoAssignees): TodoListCard | null {
  const category = argText(args.categoryName, 100);
  if (category === null || typeof args.categoryName !== 'string') return null;
  const chosen = idsOf(args.userIds);
  const before = rowsOf(loaded[args.categoryName]).flatMap((row) => positiveId(row.user_id) ?? []);
  const inList = tripTodos(ctx.card).filter((todo) => todo.category === args.categoryName);
  return todoCard([
    {
      category,
      slot: todoSlot(ctx.card, args.categoryName),
      assignees: peopleOf(ctx.card, chosen, 6),
      assigneesRemoved: peopleOf(
        ctx.card,
        before.filter((id) => !chosen.includes(id)),
        6,
      ),
      items: [],
      count: inList.length,
      open: inList.filter((todo) => !todo.checked).length,
    },
  ]);
}

/** The name of the to-do a call works on, from the trip as the turn read it. */
function todoName(ctx: PreviewContext, args: ToolArgs): string {
  const itemId = argId(args, 'itemId');
  return tripTodo(ctx.card, itemId)?.name ?? (itemId === null ? '' : `#${itemId}`);
}

function updateTodoRows(ctx: PreviewContext, args: ToolArgs): Rows {
  const before = tripTodo(ctx.card, argId(args, 'itemId'));
  const rows = new Rows();
  const date = (value: unknown) => (typeof value === 'string' ? formatDate(ctx, value) : '');
  const priority = (value: unknown) => (typeof value === 'number' && value > 0 ? `P${value}` : '');
  const member = (id: unknown) => memberNames(ctx, id === null || id === undefined ? null : [id]);
  if (has(args, 'name')) rows.change('name', before?.name ?? null, text(args.name));
  // The old values are the trip's, so they are masked like an answer; the new ones are the call's own.
  if (has(args, 'description')) {
    rows.change('description', before ? clipped(before.description, 160) : null, text(args.description));
  }
  if (has(args, 'category')) {
    rows.change('category', before ? clipped(before.category, 100) : null, text(args.category));
  }
  if (has(args, 'due_date')) rows.change('dueDate', before ? date(before.dueDate) : null, date(args.due_date));
  if (has(args, 'priority')) {
    rows.change('priority', before ? priority(before.priority) : null, priority(args.priority));
  }
  if (has(args, 'assigned_user_id')) {
    rows.change('assignee', before ? member(before.assigneeId) : null, member(args.assigned_user_id));
  }
  return rows;
}

/** Whether the to-do was done before its tick, as the tick's change card kept it. */
function doneBefore(preview: AssistantChangePreview | null): string | null {
  const card = preview?.card;
  const row = card?.kind === 'todoList' ? card.groups[0]?.items[0] : undefined;
  return row?.changed.find((entry) => entry.field === 'done')?.before ?? null;
}

/**
 * A toggled to-do taken back with the opposite toggle, while it is still as
 * the toggle left it, and only when the toggle changed it: ticking one that
 * was already done has no way back.
 */
const UNTOGGLE_TODO: NonNullable<ToolCards['undo']> = {
  tool: 'toggle_todo',
  args: (args, result, preview) => {
    const itemId = positiveId(recordOf(recordOf(result).item).id) ?? argId(args, 'itemId');
    if (itemId === null || typeof args.checked !== 'boolean') return null;
    if (doneBefore(preview) !== (args.checked ? '0' : '1')) return null;
    return { itemId, checked: !args.checked };
  },
  unchanged: (result, snapshot) => {
    const item = recordOf(recordOf(result).item);
    return same(item, byId(rowsOf(recordOf(snapshot.summary).todos), item.id), STABLE_FIELDS.todo);
  },
};

const UPDATE = { verbKey: 'genericUpdate', entity: 'todo' } as const;

export const TODO_TOOLS: Readonly<Record<string, ToolCards>> = {
  list_todos: { answer: listTodosAnswer },
  create_todo: {
    change: createTodoCard,
    applied: ({ result, preview }) => {
      const id = positiveId(recordOf(recordOf(result).item).id);
      const card = preview?.card;
      if (id === null || card?.kind !== 'todoList') return null;
      return { ...card, groups: card.groups.map((g) => ({ ...g, items: g.items.map((row) => ({ ...row, id })) })) };
    },
  },
  update_todo: {
    write: UPDATE,
    describe: (ctx, args) => ({
      subject: todoName(ctx, args),
      rows: updateTodoRows(ctx, args),
      dayId: null,
      placeIds: [],
      tool: 'update_todo',
    }),
    change: updateTodoCard,
  },
  toggle_todo: {
    write: UPDATE,
    describe: (ctx, args) => ({
      subject: todoName(ctx, args),
      rows: new Rows(),
      dayId: null,
      placeIds: [],
      tool: 'toggle_todo',
    }),
    change: toggleTodoCard,
    undo: UNTOGGLE_TODO,
  },
  delete_todo: {
    write: { verbKey: 'genericRemove', entity: 'todo' },
    describe: (ctx, args) => ({
      subject: todoName(ctx, args),
      rows: new Rows(),
      dayId: null,
      placeIds: [],
      tool: 'delete_todo',
    }),
    change: deleteTodoCard,
  },
  reorder_todos: {
    write: UPDATE,
    describe: (ctx, args) => {
      const names = idsOf(args.orderedIds).map((id) => tripTodo(ctx.card, id)?.name ?? `#${id}`);
      return { subject: text(names.join(', ')), rows: new Rows(), dayId: null, placeIds: [], tool: 'reorder_todos' };
    },
  },
  set_todo_category_assignees: {
    write: UPDATE,
    load: loadTodoAssignees,
    describe: (ctx, args) => ({
      subject: text(args.categoryName),
      rows: new Rows().add('members', memberNames(ctx, args.userIds)),
      dayId: null,
      placeIds: [],
      tool: 'set_todo_category_assignees',
    }),
    change: (ctx, args, loaded) => todoAssigneesCard(ctx, args, recordOf(loaded)),
  },
};
