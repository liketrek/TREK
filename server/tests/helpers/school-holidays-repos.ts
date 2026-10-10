import { SchoolHolidayCountries } from '../../src/db/entities/SchoolHolidayCountries.entity';
import { SchoolHolidayPeriods } from '../../src/db/entities/SchoolHolidayPeriods.entity';
import { SchoolHolidayRegions } from '../../src/db/entities/SchoolHolidayRegions.entity';
import { VacayHolidayCalendars } from '../../src/db/entities/VacayHolidayCalendars.entity';
import type { SchoolHolidayCountriesRepository } from '../../src/db/repositories/SchoolHolidayCountries.repository';
import type { SchoolHolidayPeriodsRepository } from '../../src/db/repositories/SchoolHolidayPeriods.repository';
import type { SchoolHolidayRegionsRepository } from '../../src/db/repositories/SchoolHolidayRegions.repository';
import type { VacayHolidayCalendarsRepository } from '../../src/db/repositories/VacayHolidayCalendars.repository';
import { sharedTestOrm } from './test-uow';

import type Database from 'better-sqlite3';

/**
 * Plan 3f Task 2 (`SchoolHolidaysService`) test-only repository factories,
 * bound to a suite's own better-sqlite3 handle via the SAME memoised
 * `sharedTestOrm` `test-uow.ts` exports — required so a repository built
 * here and a `UnitOfWork` built from `createTestUnitOfWork` (that file)
 * resolve the IDENTICAL context-resolving `EntityManager` (the
 * `todo-repos.ts`/`files-repos.ts`/`collab-repos.ts` precedent this file
 * otherwise copies verbatim: a repository from a SECOND, independent ORM
 * instance would write outside the open transaction).
 *
 * A NEW file rather than an addition to `test-uow.ts`, same reasoning those
 * files give for themselves: avoids colliding with a concurrently in-flight
 * task's edits to that shared file.
 *
 * `createTestVacayHolidayCalendarsRepo` is here (not a vacay-owned helper
 * file, which does not exist yet — Plan 3f Task 5 has not landed) because
 * this task's own tests need to seed/read `vacay_holiday_calendars` rows to
 * exercise SH14's cross-domain guard (`existsForSchoolRegion`); Task 5 may
 * add its own, separate factory later without colliding with this one.
 */
export function createTestSchoolHolidayCountriesRepo(db: Database.Database): Promise<SchoolHolidayCountriesRepository> {
  return sharedTestOrm(db).then((t) => t.repo(SchoolHolidayCountries));
}

export function createTestSchoolHolidayRegionsRepo(db: Database.Database): Promise<SchoolHolidayRegionsRepository> {
  return sharedTestOrm(db).then((t) => t.repo(SchoolHolidayRegions));
}

export function createTestSchoolHolidayPeriodsRepo(db: Database.Database): Promise<SchoolHolidayPeriodsRepository> {
  return sharedTestOrm(db).then((t) => t.repo(SchoolHolidayPeriods));
}

export function createTestVacayHolidayCalendarsRepo(db: Database.Database): Promise<VacayHolidayCalendarsRepository> {
  return sharedTestOrm(db).then((t) => t.repo(VacayHolidayCalendars));
}
