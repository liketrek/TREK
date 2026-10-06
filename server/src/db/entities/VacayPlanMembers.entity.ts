import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { VacayPlanMembersRepository } from '../repositories/VacayPlanMembers.repository';
import { DbTimestampType } from '../types';
import { Users } from './Users.entity';
import { VacayPlans } from './VacayPlans.entity';

export class VacayPlanMembers {
  [EntityRepositoryType]?: VacayPlanMembersRepository;
  id!: number & Opt;
  plan!: Ref<VacayPlans>;
  plan_id!: number;
  user!: Ref<Users>;
  user_id!: number;
  status?: string | null = 'pending';
  created_at?: string | null;
}

export const VacayPlanMembersSchema = defineEntity({
  class: VacayPlanMembers,
  repository: () => VacayPlanMembersRepository,
  uniques: [{ properties: ['plan', 'user'] }],
  properties: {
    id: p.integer().primary(),
    plan: () => p.manyToOne(VacayPlans).ref().deleteRule('cascade').hidden(),
    plan_id: p.integer().persist(false),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    status: p.text().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
  },
});
