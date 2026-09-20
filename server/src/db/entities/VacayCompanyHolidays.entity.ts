import { type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { VacayPlans } from './VacayPlans.entity';

export class VacayCompanyHolidays {
  id?: number | null;
  plan!: Ref<VacayPlans>;
  date!: string;
  note?: string | null = '';
}

export class VacayCompanyHolidaysRepository extends EntityRepository<VacayCompanyHolidays> {}

export const VacayCompanyHolidaysSchema = defineEntity({
  class: VacayCompanyHolidays,
  repository: () => VacayCompanyHolidaysRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    plan: () => p.manyToOne(VacayPlans).ref().deleteRule('cascade'),
    date: p.text(),
    note: p.text().nullable(),
  },
});
