import { type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Users } from './Users.entity';
import { VacayPlans } from './VacayPlans.entity';

export class VacayEntries {
  id?: number | null;
  plan!: Ref<VacayPlans>;
  user!: Ref<Users>;
  date!: string;
  note?: string | null = '';
  fraction!: number & Opt;
  kind: string & Opt = 'vacation';
}

export class VacayEntriesRepository extends EntityRepository<VacayEntries> {}

export const VacayEntriesSchema = defineEntity({
  class: VacayEntries,
  repository: () => VacayEntriesRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    plan: () => p.manyToOne(VacayPlans).ref().deleteRule('cascade'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade'),
    date: p.text(),
    note: p.text().nullable(),
    fraction: p.double().default(1),
    kind: p.text(),
  },
});
