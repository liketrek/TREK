import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { VacayUserYearsRepository } from '../repositories/VacayUserYears.repository';
import { Users } from './Users.entity';
import { VacayPlans } from './VacayPlans.entity';

export class VacayUserYears {
  [EntityRepositoryType]?: VacayUserYearsRepository;
  id!: number & Opt;
  user!: Ref<Users>;
  user_id!: number;
  plan!: Ref<VacayPlans>;
  plan_id!: number;
  year!: number;
  vacation_days?: number | null = 30;
  carried_over?: number | null = 0;
}

export const VacayUserYearsSchema = defineEntity({
  class: VacayUserYears,
  repository: () => VacayUserYearsRepository,
  uniques: [{ properties: ['user', 'plan', 'year'] }],
  properties: {
    id: p.integer().primary(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    plan: () => p.manyToOne(VacayPlans).ref().deleteRule('cascade').hidden(),
    plan_id: p.integer().persist(false),
    year: p.integer(),
    vacation_days: p.integer().nullable(),
    carried_over: p.integer().nullable(),
  },
});
