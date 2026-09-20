import { type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Users } from './Users.entity';
import { VacayPlans } from './VacayPlans.entity';

export class VacayUserColors {
  id?: number | null;
  user!: Ref<Users>;
  plan!: Ref<VacayPlans>;
  color?: string | null = '#6366f1';
}

export class VacayUserColorsRepository extends EntityRepository<VacayUserColors> {}

export const VacayUserColorsSchema = defineEntity({
  class: VacayUserColors,
  repository: () => VacayUserColorsRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade'),
    plan: () => p.manyToOne(VacayPlans).ref().deleteRule('cascade'),
    color: p.text().nullable(),
  },
});
