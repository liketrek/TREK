import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TodoCategoryAssigneesRepository } from '../repositories/TodoCategoryAssignees.repository';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class TodoCategoryAssignees {
  [EntityRepositoryType]?: TodoCategoryAssigneesRepository;
  id!: number & Opt;
  trip!: Ref<Trips>;
  trip_id!: number;
  category_name!: string;
  user!: Ref<Users>;
  user_id!: number;
}

export const TodoCategoryAssigneesSchema = defineEntity({
  class: TodoCategoryAssignees,
  repository: () => TodoCategoryAssigneesRepository,
  uniques: [{ properties: ['trip', 'category_name', 'user'] }],
  properties: {
    id: p.integer().primary(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').hidden(),
    trip_id: p.integer().persist(false),
    category_name: p.text(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
  },
});
