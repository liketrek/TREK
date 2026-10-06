import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TodoItemsRepository } from '../repositories/TodoItems.repository';
import { DbTimestampType } from '../types';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class TodoItems {
  [EntityRepositoryType]?: TodoItemsRepository;
  id!: number & Opt;
  trip!: Ref<Trips>;
  trip_id!: number;
  name!: string;
  checked?: number | null = 0;
  category?: string | null;
  sort_order?: number | null = 0;
  due_date?: string | null;
  description?: string | null;
  assignedUser?: Ref<Users> | null;
  assigned_user_id?: number | null;
  priority?: number | null = 0;
  created_at?: string | null;
  reminded_at?: string | null;
}

export const TodoItemsSchema = defineEntity({
  class: TodoItems,
  repository: () => TodoItemsRepository,
  properties: {
    id: p.integer().primary(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').hidden().index('idx_todo_items_trip_id'),
    trip_id: p.integer().persist(false).index('idx_todo_items_trip_id'),
    name: p.text(),
    checked: p.integer().nullable(),
    category: p.text().nullable(),
    sort_order: p.integer().nullable(),
    due_date: p.text().nullable(),
    description: p.text().nullable(),
    assignedUser: () => p.manyToOne(Users).ref().nullable().hidden(),
    assigned_user_id: p.integer().nullable().persist(false),
    priority: p.integer().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    reminded_at: p.type(DbTimestampType).nullable(),
  },
});
