/**
 * VacayCompanyHolidaysRepository.listForPlan — Plan 4 Task 8b-2 item 3 (3f
 * L6 carry): "the company-holidays list" (VC29/VC67) had no
 * repository-level `toEqual(<legacy raw>)` parity test.
 */
import { VacayCompanyHolidays } from '../../../../src/db/entities/VacayCompanyHolidays.entity';
import type { VacayCompanyHolidaysRepository } from '../../../../src/db/repositories/VacayCompanyHolidays.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { insertRows } from '../../../helpers/factories/rows';
import { makeVacayPlan } from '../../../helpers/factories/vacay';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: VacayCompanyHolidaysRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(VacayCompanyHolidays);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

async function insertPlan(ownerId: number): Promise<number> {
  return (await makeVacayPlan(t, ownerId)).id;
}

describe('VacayCompanyHolidaysRepository.listForPlan (VC29/67)', () => {
  it('VACAYCOHOLREPO-001: matches SELECT date, note, fraction FROM vacay_company_holidays WHERE plan_id = ? run raw, note both NULL and SET', async () => {
    const { user } = createUser(testDb);
    const planId = await insertPlan(user.id);
    const other = await insertPlan(createUser(testDb).user.id);
    await insertRows(t, VacayCompanyHolidays, [
      { plan: planId, date: '2026-12-25', note: 'Christmas' },
      { plan: planId, date: '2026-01-01', note: null },
      { plan: other, date: '2026-07-04', note: 'Not mine' },
    ]);

    // test-sql-allow: the raw SELECT is the legacy oracle this parity test holds the repository to.
    const legacy = testDb
      .prepare('SELECT date, note, fraction FROM vacay_company_holidays WHERE plan_id = ?')
      .all(planId);
    const rows = await repo.listForPlan(planId);

    expect(rows).toEqual(legacy);
    expect(rows.map((r) => r.date).sort()).toEqual(['2026-01-01', '2026-12-25']);
  });

  it('VACAYCOHOLREPO-002: empty array for a plan with none', async () => {
    const { user } = createUser(testDb);
    const planId = await insertPlan(user.id);
    expect(await repo.listForPlan(planId)).toEqual([]);
  });
});
