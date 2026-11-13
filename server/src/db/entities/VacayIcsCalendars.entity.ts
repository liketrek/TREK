import { VacayIcsCalendarsRepository } from '../repositories/VacayIcsCalendars.repository';
import { DbTimestampType } from '../types';
import { VacayPlans } from './VacayPlans.entity';
import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';

export class VacayIcsCalendars {
  [EntityRepositoryType]?: VacayIcsCalendarsRepository;
  id!: number;
  plan!: Ref<VacayPlans>;
  plan_id!: number & Opt;
  url!: string;
  label!: string;
  color: string & Opt = '#a5f3fc';
  events: string & Opt = '[]';
  last_fetched_at?: string | null;
  last_error?: string | null;
}

export const VacayIcsCalendarsSchema = defineEntity({
  class: VacayIcsCalendars,
  repository: () => VacayIcsCalendarsRepository,
  properties: {
    id: p.integer().primary(),
    plan: () =>
      p
        .manyToOne(VacayPlans)
        .ref()
        .updateRule('cascade')
        .deleteRule('cascade')
        .hidden()
        .index('idx_vacay_ics_calendars_plan_id'),
    plan_id: p.integer().persist(false).index('idx_vacay_ics_calendars_plan_id'),
    url: p.text(),
    label: p.text(),
    color: p.text().default('#a5f3fc'),
    events: p.text().default('[]'),
    last_fetched_at: p.type(DbTimestampType).nullable(),
    last_error: p.text().nullable(),
  },
});
