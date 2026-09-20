import { type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { VacayPlans } from './VacayPlans.entity';

export class VacayYears {
  id?: number | null;
  plan!: Ref<VacayPlans>;
  year!: number;
}

export class VacayYearsRepository extends EntityRepository<VacayYears> {}

export const VacayYearsSchema = defineEntity({
  class: VacayYears,
  repository: () => VacayYearsRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    plan: () => p.manyToOne(VacayPlans).ref().deleteRule('cascade'),
    year: p.integer(),
  },
});
