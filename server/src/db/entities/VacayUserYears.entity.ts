import { type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Users } from './Users.entity';
import { VacayPlans } from './VacayPlans.entity';

export class VacayUserYears {
  id?: number | null;
  user!: Ref<Users>;
  plan!: Ref<VacayPlans>;
  year!: number;
  vacationDays?: number | null = 30;
  carriedOver?: number | null = 0;
}

export class VacayUserYearsRepository extends EntityRepository<VacayUserYears> {}

export const VacayUserYearsSchema = defineEntity({
  class: VacayUserYears,
  repository: () => VacayUserYearsRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade'),
    plan: () => p.manyToOne(VacayPlans).ref().deleteRule('cascade'),
    year: p.integer(),
    vacationDays: p.integer().nullable(),
    carriedOver: p.integer().nullable(),
  },
});
