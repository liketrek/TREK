import { VacayCompanyHolidays } from '../../src/db/entities/VacayCompanyHolidays.entity';
import { VacayEntries } from '../../src/db/entities/VacayEntries.entity';
import { VacayPlanMembers } from '../../src/db/entities/VacayPlanMembers.entity';
import { VacayPlans } from '../../src/db/entities/VacayPlans.entity';
import { VacayShares } from '../../src/db/entities/VacayShares.entity';
import { VacayUserColors } from '../../src/db/entities/VacayUserColors.entity';
import { VacayUserSettings } from '../../src/db/entities/VacayUserSettings.entity';
import { VacayUserYears } from '../../src/db/entities/VacayUserYears.entity';
import { VacayYears } from '../../src/db/entities/VacayYears.entity';
import type { VacayCompanyHolidaysRepository } from '../../src/db/repositories/VacayCompanyHolidays.repository';
import type { VacayEntriesRepository } from '../../src/db/repositories/VacayEntries.repository';
import type { VacayPlanMembersRepository } from '../../src/db/repositories/VacayPlanMembers.repository';
import type { VacayPlansRepository } from '../../src/db/repositories/VacayPlans.repository';
import type { VacaySharesRepository } from '../../src/db/repositories/VacayShares.repository';
import type { VacayUserColorsRepository } from '../../src/db/repositories/VacayUserColors.repository';
import type { VacayUserSettingsRepository } from '../../src/db/repositories/VacayUserSettings.repository';
import type { VacayUserYearsRepository } from '../../src/db/repositories/VacayUserYears.repository';
import type { VacayYearsRepository } from '../../src/db/repositories/VacayYears.repository';
import { sharedTestOrm } from './test-uow';

import type Database from 'better-sqlite3';

/**
 * Plan 3f Task 5 (`VacayService`) test-only repository factories, bound to a
 * suite's own better-sqlite3 handle via the SAME memoised `sharedTestOrm`
 * `test-uow.ts` exports — the `school-holidays-repos.ts`/`todo-repos.ts`
 * precedent this file copies verbatim: a repository built here and a
 * `UnitOfWork` built from `createTestUnitOfWork` (that file) resolve the
 * IDENTICAL context-resolving `EntityManager`, required so a repository from
 * a SECOND, independent ORM instance never writes outside the open
 * transaction.
 *
 * `VacayHolidayCalendarsRepository`'s own factory
 * (`createTestVacayHolidayCalendarsRepo`) already exists in
 * `school-holidays-repos.ts` (built by Task 2, before this task landed) and
 * `SchoolHolidayRegionsRepository`'s (`createTestSchoolHolidayRegionsRepo`)
 * likewise — both reused from there, not duplicated here.
 */
export function createTestVacayPlansRepo(db: Database.Database): Promise<VacayPlansRepository> {
  return sharedTestOrm(db).then((t) => t.repo(VacayPlans));
}

export function createTestVacayPlanMembersRepo(db: Database.Database): Promise<VacayPlanMembersRepository> {
  return sharedTestOrm(db).then((t) => t.repo(VacayPlanMembers));
}

export function createTestVacayYearsRepo(db: Database.Database): Promise<VacayYearsRepository> {
  return sharedTestOrm(db).then((t) => t.repo(VacayYears));
}

export function createTestVacayUserYearsRepo(db: Database.Database): Promise<VacayUserYearsRepository> {
  return sharedTestOrm(db).then((t) => t.repo(VacayUserYears));
}

export function createTestVacayUserColorsRepo(db: Database.Database): Promise<VacayUserColorsRepository> {
  return sharedTestOrm(db).then((t) => t.repo(VacayUserColors));
}

export function createTestVacayEntriesRepo(db: Database.Database): Promise<VacayEntriesRepository> {
  return sharedTestOrm(db).then((t) => t.repo(VacayEntries));
}

export function createTestVacayCompanyHolidaysRepo(db: Database.Database): Promise<VacayCompanyHolidaysRepository> {
  return sharedTestOrm(db).then((t) => t.repo(VacayCompanyHolidays));
}

export function createTestVacaySharesRepo(db: Database.Database): Promise<VacaySharesRepository> {
  return sharedTestOrm(db).then((t) => t.repo(VacayShares));
}

export function createTestVacayUserSettingsRepo(db: Database.Database): Promise<VacayUserSettingsRepository> {
  return sharedTestOrm(db).then((t) => t.repo(VacayUserSettings));
}
