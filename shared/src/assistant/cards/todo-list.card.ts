import { idSchema } from '../../common/primitives.schema';
import { cardDateSchema, cardPersonSchema, cardText } from './card-parts';
import { checklistBeforeSchema, checklistColorSlotSchema } from './packing-list.card';

import { z } from 'zod';

/**
 * The trip's to-dos in the assistant chat, grouped by their list (category)
 * the way the to-do panel shows them. On a change card the rows carry what
 * the change does to them and the old value of every field it touches; on an
 * answer `change` is `none`.
 */

const todoCountSchema = z.number().int().min(0).max(5_000);

export const TODO_ROW_CHANGES = ['none', 'add', 'update', 'check', 'uncheck', 'remove'] as const;
/** `done` is kept by a tick only (`'1'` or `'0'`), for the way back; it is never drawn as a fact. */
export const TODO_FIELDS = ['name', 'note', 'category', 'dueDate', 'priority', 'assignee', 'done'] as const;

export const todoCardItemSchema = z.object({
  /** Null while a create waits. */
  id: idSchema.nullable(),
  name: cardText(300),
  /** The first line of the description. */
  note: cardText(160).nullable(),
  checked: z.boolean(),
  dueDate: cardDateSchema.nullable(),
  /** The trip day on the due date, so the date can show that day in the plan. */
  dueDayId: idSchema.nullable(),
  /** 0 for none, 1 the highest. */
  priority: z.number().int().min(0).max(3),
  assignee: cardPersonSchema.nullable(),
  change: z.enum(TODO_ROW_CHANGES),
  changed: z.array(z.object({ field: z.enum(TODO_FIELDS), before: checklistBeforeSchema })).max(7),
});
export type TodoCardItem = z.infer<typeof todoCardItemSchema>;

export const todoCardGroupSchema = z.object({
  /** Null: the to-dos on no list. */
  category: cardText(100).nullable(),
  slot: checklistColorSlotSchema.nullable(),
  /** Who a list's new to-dos go to by default. */
  assignees: z.array(cardPersonSchema).max(6),
  assigneesRemoved: z.array(cardPersonSchema).max(6),
  items: z.array(todoCardItemSchema).max(40),
  /** The group's to-dos, shown or not. */
  count: todoCountSchema,
  open: todoCountSchema,
});
export type TodoCardGroup = z.infer<typeof todoCardGroupSchema>;

export const todoListCardSchema = z.object({
  kind: z.literal('todoList'),
  /** Overdue against the day of the read; answers only. */
  progress: z.object({ open: todoCountSchema, done: todoCountSchema, overdue: todoCountSchema }).nullable(),
  groups: z.array(todoCardGroupSchema).max(12),
  moreGroups: todoCountSchema,
});
export type TodoListCard = z.infer<typeof todoListCardSchema>;
