import { type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { VacayPlans } from './VacayPlans.entity';

export class VacayHolidayCalendars {
  id?: number | null;
  plan!: Ref<VacayPlans>;
  type: string & Opt = 'public_holiday';
  region!: string;
  label?: string | null;
  color: string & Opt = '#fecaca';
  sortOrder: number & Opt = 0;
}

export class VacayHolidayCalendarsRepository extends EntityRepository<VacayHolidayCalendars> {}

export const VacayHolidayCalendarsSchema = defineEntity({
  class: VacayHolidayCalendars,
  repository: () => VacayHolidayCalendarsRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    plan: () => p.manyToOne(VacayPlans).ref().deleteRule('cascade'),
    type: p.text(),
    region: p.text(),
    label: p.text().nullable(),
    color: p.text(),
    sortOrder: p.integer(),
  },
});
