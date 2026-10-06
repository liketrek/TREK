import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { VacayYearsRepository } from '../repositories/VacayYears.repository';
import { VacayPlans } from './VacayPlans.entity';

export class VacayYears {
  [EntityRepositoryType]?: VacayYearsRepository;
  id!: number & Opt;
  plan!: Ref<VacayPlans>;
  plan_id!: number;
  year!: number;
}

export const VacayYearsSchema = defineEntity({
  class: VacayYears,
  repository: () => VacayYearsRepository,
  uniques: [{ properties: ['plan', 'year'] }],
  properties: {
    id: p.integer().primary(),
    plan: () => p.manyToOne(VacayPlans).ref().deleteRule('cascade').hidden(),
    plan_id: p.integer().persist(false),
    year: p.integer(),
  },
});
