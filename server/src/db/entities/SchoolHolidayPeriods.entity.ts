import { type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { SchoolHolidayRegions } from './SchoolHolidayRegions.entity';

export class SchoolHolidayPeriods {
  id?: number | null;
  region!: Ref<SchoolHolidayRegions>;
  name!: string;
  startDate!: string;
  endDate!: string;
}

export class SchoolHolidayPeriodsRepository extends EntityRepository<SchoolHolidayPeriods> {}

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
    id: p.integer().primary().autoincrement(),
    region: () => p.manyToOne(SchoolHolidayRegions).ref().deleteRule('cascade').index('idx_school_holiday_periods_region'),
    name: p.text(),
    startDate: p.text(),
    endDate: p.text(),
  },
});
