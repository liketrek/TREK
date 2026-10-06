import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { VacayHolidayCalendarsRepository } from '../repositories/VacayHolidayCalendars.repository';
import { VacayPlans } from './VacayPlans.entity';

export class VacayHolidayCalendars {
  [EntityRepositoryType]?: VacayHolidayCalendarsRepository;
  id!: number & Opt;
  plan!: Ref<VacayPlans>;
  plan_id!: number;
  type: string & Opt = 'public_holiday';
  region!: string;
  label?: string | null;
  color: string & Opt = '#fecaca';
  sort_order: number & Opt = 0;
}

export const VacayHolidayCalendarsSchema = defineEntity({
  class: VacayHolidayCalendars,
  repository: () => VacayHolidayCalendarsRepository,
  properties: {
    id: p.integer().primary(),
    plan: () => p.manyToOne(VacayPlans).ref().deleteRule('cascade').hidden(),
    plan_id: p.integer().persist(false),
    type: p.text().default('public_holiday'),
    region: p.text(),
    label: p.text().nullable(),
    color: p.text().default('#fecaca'),
    sort_order: p.integer().default(0),
  },
});
