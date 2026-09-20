import { type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class TodoCategoryAssignees {
  id?: number | null;
  trip!: Ref<Trips>;
  categoryName!: string;
  user!: Ref<Users>;
}

export class TodoCategoryAssigneesRepository extends EntityRepository<TodoCategoryAssignees> {}

export const TodoCategoryAssigneesSchema = defineEntity({
  class: TodoCategoryAssignees,
  repository: () => TodoCategoryAssigneesRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade'),
    categoryName: p.text(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade'),
  },
});
