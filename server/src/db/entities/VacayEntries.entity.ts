import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { VacayEntriesRepository } from '../repositories/VacayEntries.repository';
import { Users } from './Users.entity';
import { VacayPlans } from './VacayPlans.entity';

export class VacayEntries {
  [EntityRepositoryType]?: VacayEntriesRepository;
  id!: number & Opt;
  plan!: Ref<VacayPlans>;
  plan_id!: number;
  user!: Ref<Users>;
  user_id!: number;
  date!: string;
  note?: string | null = '';
  fraction!: number & Opt;
  kind: string & Opt = 'vacation';
}

export const VacayEntriesSchema = defineEntity({
  class: VacayEntries,
  repository: () => VacayEntriesRepository,
  uniques: [{ properties: ['user', 'plan', 'date'] }],
  properties: {
    id: p.integer().primary(),
    plan: () => p.manyToOne(VacayPlans).ref().deleteRule('cascade').hidden(),
    plan_id: p.integer().persist(false),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    date: p.text(),
    note: p.text().nullable(),
    fraction: p.double().defaultRaw(`1`),
    kind: p.text().default('vacation'),
  },
});
