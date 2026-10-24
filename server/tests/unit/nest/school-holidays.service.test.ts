/**
 * Unit tests for the repository-backed SchoolHolidaysService (Plan 3f Task
 * 2). The service is constructed directly (`new SchoolHolidaysService(...)`)
 * over repositories resolved from the suite's own ORM
 * (`tests/helpers/school-holidays-repos.ts`/`sharedTestOrm`), same pattern
 * as `categories.service.test.ts` — no Nest container needed. A real
 * in-memory SQLite DB so SQL logic (the `COLLATE NOCASE` duplicate-name
 * guard, the optimistic-concurrency revision check, the cross-domain
 * `vacay_holiday_calendars` guard) is exercised faithfully, and so the
 * parity assertions below can run the SAME legacy raw statement this
 * service replaced, on the same seeded rows, and compare full-key.
 */
import { SchoolHolidayPeriods } from '../../../src/db/entities/SchoolHolidayPeriods.entity';
import { VacayHolidayCalendars } from '../../../src/db/entities/VacayHolidayCalendars.entity';
import { SchoolHolidaysService } from '../../../src/nest/school-holidays/school-holidays.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createUser } from '../../helpers/factories';
import { deleteRows, findRows, insertRow } from '../../helpers/factories/rows';
import { makeVacayPlan } from '../../helpers/factories/vacay';
import {
  createTestSchoolHolidayCountriesRepo,
  createTestSchoolHolidayRegionsRepo,
  createTestSchoolHolidayPeriodsRepo,
  createTestVacayHolidayCalendarsRepo,
} from '../../helpers/school-holidays-repos';
import { resetTestDb } from '../../helpers/test-db';
import type { TestOrm } from '../../helpers/test-orm';
import { sharedTestOrm, createTestUnitOfWork } from '../../helpers/test-uow';
import { ConflictException } from '@nestjs/common';

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';

const testDb = createSnapshotTestDb();

let t: TestOrm;
let svc: SchoolHolidaysService;

beforeAll(async () => {
  t = await sharedTestOrm(testDb);
  svc = new SchoolHolidaysService(
    await createTestSchoolHolidayCountriesRepo(testDb),
    await createTestSchoolHolidayRegionsRepo(testDb),
    await createTestSchoolHolidayPeriodsRepo(testDb),
    await createTestVacayHolidayCalendarsRepo(testDb),
    await createTestUnitOfWork(testDb),
  );
});

beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});

afterAll(async () => {
  await t.close();
  testDb.close();
});

const winter = { name: 'Winter break', startDate: '2026-12-20', endDate: '2027-01-06' };
// Overlaps `winter` (2026-12-24..2026-12-31 sits entirely inside
// 2026-12-20..2027-01-06) — the "overlapping holiday periods" fixture the
// brief's parity test asks for; both rows must survive the read unmerged and
// in the legacy `ORDER BY start_date, end_date, name` order.
const overlapping = { name: 'Regional break', startDate: '2026-12-24', endDate: '2026-12-31' };

async function seedRegion() {
  await svc.createCountry({ code: 'US', name: 'USA' });
  return svc.createRegion('US', { name: 'Seattle schools', revision: 0, holidays: [winter, overlapping] });
}

// ── catalog / region — full-key parity against the legacy statements ──────────

describe('catalog / region parity', () => {
  it('SH-SVC-001: catalog() is full-key identical to the legacy SELECTs on fully seeded, overlapping-period rows', async () => {
    await seedRegion();
    await svc.createCountry({ code: 'DE', name: 'Germany' });

    // test-sql-allow: the legacy statement is the oracle the service read is held to.
    const legacyCountries = testDb.prepare('SELECT code, name FROM school_holiday_countries ORDER BY name, code').all();
    // test-sql-allow: the legacy statement is the oracle the service read is held to.
    const legacyRegions = testDb
      .prepare("SELECT *, country || '-MANUAL-' || id AS code FROM school_holiday_regions ORDER BY name, id")
      .all();

    expect(await svc.catalog()).toEqual({ countries: legacyCountries, regions: legacyRegions });
  });

  it('SH-SVC-002: region() is full-key identical to the legacy region + periods SELECTs, including the synthesized code column', async () => {
    const region = await seedRegion();

    // test-sql-allow: the legacy statement is the oracle the service read is held to.
    const legacyRegion = testDb
      .prepare("SELECT *, country || '-MANUAL-' || id AS code FROM school_holiday_regions WHERE id = ?")
      .get(region.id);
    const legacyHolidays = testDb
      // test-sql-allow: the legacy statement is the oracle the service read is held to.
      .prepare(
        'SELECT name, start_date AS startDate, end_date AS endDate FROM school_holiday_periods WHERE region_id = ? ORDER BY start_date, end_date, name',
      )
      .all(region.id);

    expect(await svc.region(region.id)).toEqual({ ...(legacyRegion as object), holidays: legacyHolidays });
    // Both overlapping periods are present, unmerged, in the legacy sort order
    // (`ORDER BY start_date, ...` — `winter` starts 2026-12-20, `overlapping` starts 2026-12-24).
    expect(legacyHolidays).toEqual([winter, overlapping]);
  });

  it('SH-SVC-003: holidays() filters the same region+year-window periods as the legacy in-memory filter', async () => {
    const region = await seedRegion();
    expect(await svc.holidays(region.id, '2026')).toEqual([winter, overlapping]);
    expect(await svc.holidays(region.id, '2025')).toEqual([]);
  });
});

// ── checkName (SH9) — the collateNoCase duplicate-name guard ──────────────────

describe('checkName (collateNoCase)', () => {
  it('SH-SVC-004: a same-country, case-different name is rejected as a duplicate (COLLATE NOCASE, not lower())', async () => {
    await seedRegion();
    await expect(svc.createRegion('US', { name: 'SEATTLE SCHOOLS', revision: 0, holidays: [] })).rejects.toThrow(
      ConflictException,
    );
    await expect(svc.createRegion('US', { name: 'seattle schools', revision: 0, holidays: [] })).rejects.toThrow(
      'already exists',
    );
  });

  it('SH-SVC-005: a different country with the same name is not a duplicate', async () => {
    await seedRegion();
    await svc.createCountry({ code: 'CA', name: 'Canada' });
    await expect(svc.createRegion('CA', { name: 'Seattle schools', revision: 0, holidays: [] })).resolves.toBeDefined();
  });

  it('SH-SVC-006: renaming a region to its OWN current name is not a self-collision (id != ? excludes it)', async () => {
    const region = await seedRegion();
    await expect(svc.updateRegion(region.id, { name: region.name, revision: 1, holidays: [] })).resolves.toBeDefined();
  });
});

// ── updateRegion (SH13) — optimistic-concurrency ("lost update") guard ────────

describe('updateRegion optimistic concurrency', () => {
  it('SH-SVC-007: a stale revision is rejected with ConflictException, and the row is unchanged', async () => {
    const region = await seedRegion();
    await svc.updateRegion(region.id, { name: 'Renamed once', revision: 1, holidays: [] });
    await expect(svc.updateRegion(region.id, { name: 'Stale write', revision: 1, holidays: [winter] })).rejects.toThrow(
      ConflictException,
    );
    const current = await svc.region(region.id);
    expect(current.name).toBe('Renamed once');
    expect(current.revision).toBe(2);
  });

  it('SH-SVC-008: two updates racing on the same region and revision — exactly one wins, the other sees ConflictException (lost-update proof)', async () => {
    const region = await seedRegion();
    const results = await Promise.allSettled([
      svc.updateRegion(region.id, { name: 'Writer A', revision: 1, holidays: [] }),
      svc.updateRegion(region.id, { name: 'Writer B', revision: 1, holidays: [] }),
    ]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(ConflictException);
    // The row landed at revision 2 exactly once — no double-increment, no silent overwrite.
    expect((await svc.region(region.id)).revision).toBe(2);
  });
});

// ── deleteRegion (SH14) — the vacay_holiday_calendars cross-domain guard ──────

describe('deleteRegion cross-domain integrity guard (existsForSchoolRegion)', () => {
  it('SH-SVC-009: refused while a vacay_holiday_calendars row of type school_holiday still references the region', async () => {
    const region = await seedRegion();
    const { user } = createUser(testDb);
    const plan = await makeVacayPlan(t, user.id);
    await insertRow(t, VacayHolidayCalendars, { plan: plan.id, type: 'school_holiday', region: region.code });

    await expect(svc.deleteRegion(region.id, region.revision)).rejects.toThrow(ConflictException);
    // Untouched — the region and its periods are still there.
    expect(await svc.region(region.id)).toMatchObject({ id: region.id, revision: region.revision });
  });

  it('SH-SVC-010: a calendar of a DIFFERENT type referencing the same code string does not block deletion (type is part of the guard)', async () => {
    const region = await seedRegion();
    const { user } = createUser(testDb);
    const plan = await makeVacayPlan(t, user.id);
    await insertRow(t, VacayHolidayCalendars, { plan: plan.id, type: 'public_holiday', region: region.code });

    await expect(svc.deleteRegion(region.id, region.revision)).resolves.toEqual({ success: true });
  });

  it('SH-SVC-011: succeeds once no referencing calendar remains, and removes the region and its periods', async () => {
    const region = await seedRegion();
    const { user } = createUser(testDb);
    const plan = await makeVacayPlan(t, user.id);
    await insertRow(t, VacayHolidayCalendars, { plan: plan.id, type: 'school_holiday', region: region.code });
    await deleteRows(t, VacayHolidayCalendars);

    await expect(svc.deleteRegion(region.id, region.revision)).resolves.toEqual({ success: true });
    expect(await findRows(t, SchoolHolidayPeriods, { region: region.id })).toEqual([]);
    await expect(svc.region(region.id)).rejects.toThrow('not found');
  });
});

// ── writePeriods (SH10/SH11) — replace-all stays atomic in the transaction ────

describe('writePeriods replace-all', () => {
  it('SH-SVC-012: updateRegion replaces the complete period set, not a merge', async () => {
    const region = await seedRegion();
    const replaced = { name: 'Spring break', startDate: '2027-03-20', endDate: '2027-03-28' };
    await svc.updateRegion(region.id, { name: region.name, revision: 1, holidays: [replaced] });
    expect((await svc.region(region.id)).holidays).toEqual([replaced]);
  });
});
