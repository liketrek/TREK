import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { VacayPlansRepository } from '../repositories/VacayPlans.repository';
import { DbTimestampType } from '../types';
import { Users } from './Users.entity';
import { VacayCompanyHolidays } from './VacayCompanyHolidays.entity';
import { VacayEntries } from './VacayEntries.entity';
import { VacayHolidayCalendars } from './VacayHolidayCalendars.entity';
import { VacayPlanMembers } from './VacayPlanMembers.entity';
import { VacayUserColors } from './VacayUserColors.entity';
import { VacayUserYears } from './VacayUserYears.entity';
import { VacayYears } from './VacayYears.entity';

export class VacayPlans {
  [EntityRepositoryType]?: VacayPlansRepository;
  id!: number & Opt;
  owner!: Ref<Users>;
  owner_id!: number;
  block_weekends?: number | null = 1;
  holidays_enabled?: number | null = 0;
  holidays_region?: string | null = '';
  school_holidays_enabled?: number | null = 0;
  company_holidays_enabled?: number | null = 1;
  carry_over_enabled?: number | null = 1;
  created_at?: string | null;
  weekend_days?: string | null = '0,6';
  week_start: number & Opt = 1;
  vacay_company_holidays_collection = new Collection<VacayCompanyHolidays>(this);
  vacay_entries_collection = new Collection<VacayEntries>(this);
  vacay_holiday_calendars_collection = new Collection<VacayHolidayCalendars>(this);
  vacay_plan_members_collection = new Collection<VacayPlanMembers>(this);
  vacay_user_colors_collection = new Collection<VacayUserColors>(this);
  vacay_user_years_collection = new Collection<VacayUserYears>(this);
  vacay_years_collection = new Collection<VacayYears>(this);
}

export const VacayPlansSchema = defineEntity({
  class: VacayPlans,
  repository: () => VacayPlansRepository,
  uniques: [{ properties: ['owner'] }],
  properties: {
    id: p.integer().primary(),
    owner: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    owner_id: p.integer().persist(false),
    block_weekends: p.integer().nullable(),
    holidays_enabled: p.integer().nullable(),
    holidays_region: p.text().nullable(),
    school_holidays_enabled: p.integer().nullable(),
    company_holidays_enabled: p.integer().nullable(),
    carry_over_enabled: p.integer().nullable(),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    weekend_days: p.text().nullable(),
    week_start: p.integer().default(1),
    vacay_company_holidays_collection: () => p.oneToMany(VacayCompanyHolidays).mappedBy('plan').hidden(),
    vacay_entries_collection: () => p.oneToMany(VacayEntries).mappedBy('plan').hidden(),
    vacay_holiday_calendars_collection: () => p.oneToMany(VacayHolidayCalendars).mappedBy('plan').hidden(),
    vacay_plan_members_collection: () => p.oneToMany(VacayPlanMembers).mappedBy('plan').hidden(),
    vacay_user_colors_collection: () => p.oneToMany(VacayUserColors).mappedBy('plan').hidden(),
    vacay_user_years_collection: () => p.oneToMany(VacayUserYears).mappedBy('plan').hidden(),
    vacay_years_collection: () => p.oneToMany(VacayYears).mappedBy('plan').hidden(),
  },
});
