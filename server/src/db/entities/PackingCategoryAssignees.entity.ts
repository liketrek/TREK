import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { PackingCategoryAssigneesRepository } from '../repositories/PackingCategoryAssignees.repository';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class PackingCategoryAssignees {
  [EntityRepositoryType]?: PackingCategoryAssigneesRepository;
  id!: number & Opt;
  trip!: Ref<Trips>;
  trip_id!: number;
  category_name!: string;
  user!: Ref<Users>;
  user_id!: number;
}

export const PackingCategoryAssigneesSchema = defineEntity({
  class: PackingCategoryAssignees,
  repository: () => PackingCategoryAssigneesRepository,
  uniques: [{ properties: ['trip', 'category_name', 'user'] }],
  properties: {
    id: p.integer().primary(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade').hidden(),
    trip_id: p.integer().persist(false),
    category_name: p.text(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden().index('idx_packing_category_assignees_user_id'),
    user_id: p.integer().persist(false).index('idx_packing_category_assignees_user_id'),
  },
});
