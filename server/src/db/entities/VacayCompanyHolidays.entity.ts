import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { VacayCompanyHolidaysRepository } from '../repositories/VacayCompanyHolidays.repository';
import { VacayPlans } from './VacayPlans.entity';

export class VacayCompanyHolidays {
  [EntityRepositoryType]?: VacayCompanyHolidaysRepository;
  id!: number & Opt;
  plan!: Ref<VacayPlans>;
  plan_id!: number;
  date!: string;
  note?: string | null = '';
  fraction!: number & Opt;
}

export const VacayCompanyHolidaysSchema = defineEntity({
  class: VacayCompanyHolidays,
  repository: () => VacayCompanyHolidaysRepository,
  uniques: [{ properties: ['plan', 'date'] }],
  properties: {
    id: p.integer().primary(),
    plan: () => p.manyToOne(VacayPlans).ref().deleteRule('cascade').hidden(),
    plan_id: p.integer().persist(false),
    date: p.text(),
    note: p.text().nullable(),
    fraction: p.double().defaultRaw(`1`),
  },
});
