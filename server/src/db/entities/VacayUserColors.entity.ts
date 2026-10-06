import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { VacayUserColorsRepository } from '../repositories/VacayUserColors.repository';
import { Users } from './Users.entity';
import { VacayPlans } from './VacayPlans.entity';

export class VacayUserColors {
  [EntityRepositoryType]?: VacayUserColorsRepository;
  id!: number & Opt;
  user!: Ref<Users>;
  user_id!: number;
  plan!: Ref<VacayPlans>;
  plan_id!: number;
  color?: string | null = '#6366f1';
}

export const VacayUserColorsSchema = defineEntity({
  class: VacayUserColors,
  repository: () => VacayUserColorsRepository,
  uniques: [{ properties: ['user', 'plan'] }],
  properties: {
    id: p.integer().primary(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    plan: () => p.manyToOne(VacayPlans).ref().deleteRule('cascade').hidden(),
    plan_id: p.integer().persist(false),
    color: p.text().nullable(),
  },
});
