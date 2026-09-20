import { type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class TodoItems {
  id?: number | null;
  trip!: Ref<Trips>;
  name!: string;
  checked?: number | null = 0;
  category?: string | null;
  sortOrder?: number | null = 0;
  dueDate?: string | null;
  description?: string | null;
  assignedUser?: Ref<Users> | null;
  priority?: number | null = 0;
  createdAt?: Date | null;
  remindedAt?: Date | null;
}

export class TodoItemsRepository extends EntityRepository<TodoItems> {}

export const TodoItemsSchema = defineEntity({
  class: TodoItems,
  repository: () => TodoItemsRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').index('idx_todo_items_trip_id'),
    name: p.text(),
    checked: p.integer().nullable(),
    category: p.text().nullable(),
    sortOrder: p.integer().nullable(),
    dueDate: p.text().nullable(),
    description: p.text().nullable(),
    assignedUser: () => p.manyToOne(Users).ref().nullable(),
    priority: p.integer().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    remindedAt: p.datetime().nullable(),
  },
});
