/**
 * VacayHolidayCalendarsRepository — Plan 4 Task 8b-2 item 3 (3f L6 carry):
 * "holiday-calendar listForPlan / findById" (VC37/131, VC39/42) had no
 * repository-level `toEqual(<legacy raw>)` parity test. Appends after the
 * pre-existing `existsForSchoolRegion` per this file's own ownership rule
 * (SH14, untouched).
 */
import { VacayHolidayCalendars } from '../../../../src/db/entities/VacayHolidayCalendars.entity';
import type { VacayHolidayCalendarsRepository } from '../../../../src/db/repositories/VacayHolidayCalendars.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: VacayHolidayCalendarsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(VacayHolidayCalendars);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

function insertPlan(ownerId: number): number {
  return Number(testDb.prepare('INSERT INTO vacay_plans (owner_id) VALUES (?)').run(ownerId).lastInsertRowid);
}

function insertCalendar(
  planId: number,
  overrides: Partial<{ type: string; region: string; label: string | null; color: string; sort_order: number }> = {},
): number {
  const result = testDb
    .prepare(
      'INSERT INTO vacay_holiday_calendars (plan_id, type, region, label, color, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
    )
    .run(
      planId,
      overrides.type ?? 'public_holiday',
      overrides.region ?? 'DE',
      overrides.label === undefined ? null : overrides.label,
      overrides.color ?? '#fecaca',
      overrides.sort_order ?? 0,
    );
  return Number(result.lastInsertRowid);
}

describe('VacayHolidayCalendarsRepository.listForPlan (VC37/131, getPlanData)', () => {
  it('VACAYHOLCALREPO-001: matches SELECT * FROM vacay_holiday_calendars WHERE plan_id = ? ORDER BY sort_order, id run raw, label both NULL and SET', async () => {
    const { user } = createUser(testDb);
    const planId = insertPlan(user.id);
    const other = insertPlan(createUser(testDb).user.id);
    const second = insertCalendar(planId, { region: 'DE', sort_order: 1, label: 'Bavaria' });
    const first = insertCalendar(planId, { region: 'FR', sort_order: 0, label: null });
    insertCalendar(other, { region: 'US' });

    const legacy = testDb
      .prepare('SELECT * FROM vacay_holiday_calendars WHERE plan_id = ? ORDER BY sort_order ASC, id ASC')
      .all(planId);
    const rows = await repo.listForPlan(planId);

    expect(rows).toEqual(legacy);
    expect(rows.map((r) => r.id)).toEqual([first, second]);
  });

  it('VACAYHOLCALREPO-002: empty array for a plan with none', async () => {
    const { user } = createUser(testDb);
    const planId = insertPlan(user.id);
    expect(await repo.listForPlan(planId)).toEqual([]);
  });
});

describe('VacayHolidayCalendarsRepository.findById (VC39/42)', () => {
  it('VACAYHOLCALREPO-003: matches SELECT * FROM vacay_holiday_calendars WHERE id = ? run raw', async () => {
    const { user } = createUser(testDb);
    const planId = insertPlan(user.id);
    const id = insertCalendar(planId, { type: 'school_holiday', region: 'DE-BY', label: 'Summer' });

    const legacy = testDb.prepare('SELECT * FROM vacay_holiday_calendars WHERE id = ?').get(id);
    expect(await repo.findById(id)).toEqual(legacy);
  });

  it('VACAYHOLCALREPO-004: null for a missing id', async () => {
    expect(await repo.findById(999999)).toBeNull();
  });
});
