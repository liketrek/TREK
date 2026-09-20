import { Collection, type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { Users } from './Users.entity';
import { VacayCompanyHolidays } from './VacayCompanyHolidays.entity';
import { VacayEntries } from './VacayEntries.entity';
import { VacayHolidayCalendars } from './VacayHolidayCalendars.entity';
import { VacayPlanMembers } from './VacayPlanMembers.entity';
import { VacayUserColors } from './VacayUserColors.entity';
import { VacayUserYears } from './VacayUserYears.entity';
import { VacayYears } from './VacayYears.entity';

export class VacayPlans {
  id?: number | null;
  owner!: Ref<Users>;
  blockWeekends?: number | null = 1;
  holidaysEnabled?: number | null = 0;
  holidaysRegion?: string | null = '';
  schoolHolidaysEnabled?: number | null = 0;
  companyHolidaysEnabled?: number | null = 1;
  carryOverEnabled?: number | null = 1;
  createdAt?: Date | null;
  weekendDays?: string | null = '0,6';
  weekStart: number & Opt = 1;
  vacayCompanyHolidaysCollection = new Collection<VacayCompanyHolidays>(this);
  vacayEntriesCollection = new Collection<VacayEntries>(this);
  vacayHolidayCalendarsCollection = new Collection<VacayHolidayCalendars>(this);
  vacayPlanMembersCollection = new Collection<VacayPlanMembers>(this);
  vacayUserColorsCollection = new Collection<VacayUserColors>(this);
  vacayUserYearsCollection = new Collection<VacayUserYears>(this);
  vacayYearsCollection = new Collection<VacayYears>(this);
}

export class VacayPlansRepository extends EntityRepository<VacayPlans> {}

export const VacayPlansSchema = defineEntity({
  class: VacayPlans,
  repository: () => VacayPlansRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    owner: () => p.manyToOne(Users).ref().deleteRule('cascade'),
    blockWeekends: p.integer().nullable(),
    holidaysEnabled: p.integer().nullable(),
    holidaysRegion: p.text().nullable(),
    schoolHolidaysEnabled: p.integer().nullable(),
    companyHolidaysEnabled: p.integer().nullable(),
    carryOverEnabled: p.integer().nullable(),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    weekendDays: p.text().nullable(),
    weekStart: p.integer(),
    vacayCompanyHolidaysCollection: () => p.oneToMany(VacayCompanyHolidays).mappedBy('plan'),
    vacayEntriesCollection: () => p.oneToMany(VacayEntries).mappedBy('plan'),
    vacayHolidayCalendarsCollection: () => p.oneToMany(VacayHolidayCalendars).mappedBy('plan'),
    vacayPlanMembersCollection: () => p.oneToMany(VacayPlanMembers).mappedBy('plan'),
    vacayUserColorsCollection: () => p.oneToMany(VacayUserColors).mappedBy('plan'),
    vacayUserYearsCollection: () => p.oneToMany(VacayUserYears).mappedBy('plan'),
    vacayYearsCollection: () => p.oneToMany(VacayYears).mappedBy('plan'),
  },
});
