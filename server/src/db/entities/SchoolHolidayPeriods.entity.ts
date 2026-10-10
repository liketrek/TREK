import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { SchoolHolidayPeriodsRepository } from '../repositories/SchoolHolidayPeriods.repository';
import { SchoolHolidayRegions } from './SchoolHolidayRegions.entity';

export class SchoolHolidayPeriods {
  [EntityRepositoryType]?: SchoolHolidayPeriodsRepository;
  id!: number & Opt;
  region!: Ref<SchoolHolidayRegions>;
  region_id!: number;
  name!: string;
  start_date!: string;
  end_date!: string;
}

export const SchoolHolidayPeriodsSchema = defineEntity({
  class: SchoolHolidayPeriods,
  repository: () => SchoolHolidayPeriodsRepository,
  checks: [
    {
      name: 'school_holiday_periods_end_date_check',
      expression: 'end_date >= start_date',
    },
  ],
  properties: {
    id: p.integer().primary(),
    region: () => p.manyToOne(SchoolHolidayRegions).ref().deleteRule('cascade').hidden().index('idx_school_holiday_periods_region'),
    region_id: p.integer().persist(false).index('idx_school_holiday_periods_region'),
    name: p.text(),
    start_date: p.text(),
    end_date: p.text(),
  },
});
