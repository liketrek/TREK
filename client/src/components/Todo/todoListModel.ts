import type { TodoUpdateItemRequest } from '@trek/shared';
import type { CSSProperties } from 'react';
import type { TodoItem } from '../../types';

// Pure constants + helpers + types for the todo list, shared by the desktop
// panel and the phone tab. No React, no side effects.

export const KAT_COLORS = [
  '#3b82f6',
  '#a855f7',
  '#ec4899',
  '#22c55e',
  '#f97316',
  '#06b6d4',
  '#ef4444',
  '#eab308',
  '#8b5cf6',
  '#14b8a6',
];

export const PRIO_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: 'P1', color: '#ef4444' },
  2: { label: 'P2', color: '#f59e0b' },
  3: { label: 'P3', color: '#3b82f6' },
};

export function katColor(kat: string, allCategories: string[]) {
  const idx = allCategories.indexOf(kat);
  if (idx >= 0) return KAT_COLORS[idx % KAT_COLORS.length];
  // A 32 bit accumulator: each store wraps the hash the way it always has.
  const h = new Int32Array(1);
  for (let i = 0; i < kat.length; i++) h[0] = (h[0] << 5) - h[0] + kat.codePointAt(i);
  return KAT_COLORS[Math.abs(h[0]) % KAT_COLORS.length];
}

export type FilterType = 'all' | 'my' | 'overdue' | 'done' | string;

/** The four built-in buckets; any other filter value is a category name. */
export type TodoSmartFilter = 'all' | 'my' | 'overdue' | 'done';

/** The built-in buckets in the order both views list them. */
export const TODO_SMART_FILTERS: readonly TodoSmartFilter[] = ['all', 'my', 'overdue', 'done'];

/** Whether a filter value names a built-in bucket rather than a category. */
export function isTodoSmartFilter(f: string): f is TodoSmartFilter {
  return (TODO_SMART_FILTERS as readonly string[]).includes(f);
}

export interface Member {
  id: number;
  username: string;
  avatar: string | null;
  is_guest?: boolean;
}

/** A task's editable fields as its form holds them: empty strings where the task has nothing. */
export interface TaskFieldValues {
  desc: string;
  priority: number;
  category: string;
  dueDate: string;
  assignedUserId: number | null;
}

/** The label and field look of the task form, shared by the detail pane and the new-task dialog. */
export const taskLabelClass = 'mb-1.5 block text-caption font-semibold text-content-muted';
export const taskInputStyle: CSSProperties = {
  width: '100%',
  fontSize: 'calc(13px * var(--fs-scale-body, 1))',
  padding: '9px 11px',
  border: '1px solid var(--border-primary)',
  borderRadius: 10,
  background: 'var(--bg-input)',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
  outline: 'none',
};

// ── Filters, counts and order ───────────────────────────────────────────────

export function isTodoOverdue(item: TodoItem, today: string): boolean {
  return !!item.due_date && !item.checked && item.due_date < today;
}

/** The four smart filters, and any other value as a category bucket. */
export function filterTodoItems(
  items: TodoItem[],
  filter: FilterType,
  currentUserId: number | null,
  today: string
): TodoItem[] {
  if (filter === 'all') return items.filter((i) => !i.checked);
  if (filter === 'done') return items.filter((i) => !!i.checked);
  // No resolved user means nothing is "mine", matching the "my" count.
  if (filter === 'my')
    return currentUserId ? items.filter((i) => !i.checked && i.assigned_user_id === currentUserId) : [];
  if (filter === 'overdue') return items.filter((i) => isTodoOverdue(i, today));
  return items.filter((i) => i.category === filter);
}

/**
 * Category bucket, addressed by name instead of through `filterTodoItems`, so a
 * category literally called 'all'/'my'/'overdue'/'done' keeps its own rows
 * rather than collapsing into the smart filter of the same id.
 */
export function filterTodoItemsByCategory(items: TodoItem[], category: string): TodoItem[] {
  return items.filter((i) => i.category === category);
}

/** Ascending priority, with tasks that have none after every prioritised one. */
export function compareTodoPriority(a: TodoItem, b: TodoItem): number {
  return (a.priority || 99) - (b.priority || 99);
}

/** Nearest due date first, undated tasks after all dated ones; ties keep their order (#2205). */
export function compareTodoDue(a: TodoItem, b: TodoItem): number {
  if (!a.due_date) return b.due_date ? 1 : 0;
  if (!b.due_date) return -1;
  return a.due_date < b.due_date ? -1 : a.due_date > b.due_date ? 1 : 0;
}

/**
 * The phone's row order: done sinks to the end, open-overdue floats to the top.
 * Ties break by the active sort toggle, priority or due date; with no toggle the
 * manual order stands.
 */
export function sortTodoRows(items: TodoItem[], sortBy: 'priority' | 'due' | null, today: string): TodoItem[] {
  const rank = (i: TodoItem) => (i.checked ? 2 : isTodoOverdue(i, today) ? 0 : 1);
  return [...items].sort((a, b) => {
    const byRank = rank(a) - rank(b);
    if (byRank !== 0) return byRank;
    if (sortBy === 'priority') return compareTodoPriority(a, b);
    if (sortBy === 'due') return compareTodoDue(a, b);
    return 0;
  });
}

export function todoCategories(items: TodoItem[]): string[] {
  const cats = new Set<string>();
  items.forEach((i) => {
    if (i.category) cats.add(i.category);
  });
  // Category names are free text the user types, and TREK ships 23 locales: a
  // bare .sort() is byte order, which files every accented name behind the whole
  // ASCII range ("Übernachtung" after "Zelt").
  return Array.from(cats).sort((a, b) => a.localeCompare(b));
}

/** Open (non-done) item count for a given category, the sidebar badge. */
export function todoCategoryOpenCount(items: TodoItem[], category: string): number {
  return items.filter((i) => i.category === category && !i.checked).length;
}

export interface TodoCounts {
  total: number;
  open: number;
  done: number;
  overdue: number;
  my: number;
}

export function todoCounts(items: TodoItem[], currentUserId: number | null, today: string): TodoCounts {
  return {
    total: items.length,
    open: items.filter((i) => !i.checked).length,
    done: items.filter((i) => !!i.checked).length,
    overdue: items.filter((i) => isTodoOverdue(i, today)).length,
    my: currentUserId ? items.filter((i) => !i.checked && i.assigned_user_id === currentUserId).length : 0,
  };
}

// ── The task form ───────────────────────────────────────────────────────────

/** A saved task's fields as the form holds them. */
export function taskFieldsOf(item: TodoItem): TaskFieldValues {
  return {
    desc: item.description || '',
    priority: item.priority || 0,
    category: item.category || '',
    dueDate: item.due_date || '',
    assignedUserId: item.assigned_user_id,
  };
}

/** A new task's fields, filed in `category` when one is given. */
export function blankTaskFields(category?: string | null): TaskFieldValues {
  return { desc: '', priority: 0, category: category || '', dueDate: '', assignedUserId: null };
}

/** What saving an edited task sends: the name trimmed, every emptied field as null. */
export function taskUpdatePayload(name: string, fields: TaskFieldValues): TodoUpdateItemRequest {
  return {
    name: name.trim(),
    description: fields.desc || null,
    due_date: fields.dueDate || null,
    category: fields.category || null,
    assigned_user_id: fields.assignedUserId,
    priority: fields.priority,
  };
}
