import { type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Trips } from './Trips.entity';
import { Users } from './Users.entity';

export class PackingCategoryAssignees {
  id?: number | null;
  trip!: Ref<Trips>;
  categoryName!: string;
  user!: Ref<Users>;
}

export class PackingCategoryAssigneesRepository extends EntityRepository<PackingCategoryAssignees> {}

export const PackingCategoryAssigneesSchema = defineEntity({
  class: PackingCategoryAssignees,
  repository: () => PackingCategoryAssigneesRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    trip: () => p.manyToOne(Trips).ref().deleteRule('cascade'),
    categoryName: p.text(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade'),
  },
});
