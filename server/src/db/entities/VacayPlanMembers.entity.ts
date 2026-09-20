import { type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Users } from './Users.entity';
import { VacayPlans } from './VacayPlans.entity';

export class VacayPlanMembers {
  id?: number | null;
  plan!: Ref<VacayPlans>;
  user!: Ref<Users>;
  status?: string | null = 'pending';
  createdAt?: Date | null;
}

export class VacayPlanMembersRepository extends EntityRepository<VacayPlanMembers> {}

export const VacayPlanMembersSchema = defineEntity({
  class: VacayPlanMembers,
  repository: () => VacayPlanMembersRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    plan: () => p.manyToOne(VacayPlans).ref().deleteRule('cascade'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade'),
    status: p.text().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
  },
});
