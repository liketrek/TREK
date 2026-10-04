/**
 * VacayCompanyHolidaysRepository.listForPlan — Plan 4 Task 8b-2 item 3 (3f
 * L6 carry): "the company-holidays list" (VC29/VC67) had no
 * repository-level `toEqual(<legacy raw>)` parity test.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';
import { createUser } from '../../../helpers/factories';
import { VacayCompanyHolidays } from '../../../../src/db/entities/VacayCompanyHolidays.entity';
import type { VacayCompanyHolidaysRepository } from '../../../../src/db/repositories/VacayCompanyHolidays.repository';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: VacayCompanyHolidaysRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(VacayCompanyHolidays);
});
beforeEach(() => { resetTestDb(testDb); t.clear(); });
afterAll(async () => { await t.close(); testDb.close(); });

function insertPlan(ownerId: number): number {
  return Number(testDb.prepare('INSERT INTO vacay_plans (owner_id) VALUES (?)').run(ownerId).lastInsertRowid);
}

describe('VacayCompanyHolidaysRepository.listForPlan (VC29/67)', () => {
  it('VACAYCOHOLREPO-001: matches SELECT date, note, fraction FROM vacay_company_holidays WHERE plan_id = ? run raw, note both NULL and SET', async () => {
    const { user } = createUser(testDb);
    const planId = insertPlan(user.id);
    const other = insertPlan(createUser(testDb).user.id);
    testDb.prepare('INSERT INTO vacay_company_holidays (plan_id, date, note) VALUES (?, ?, ?)').run(planId, '2026-12-25', 'Christmas');
    testDb.prepare('INSERT INTO vacay_company_holidays (plan_id, date, note) VALUES (?, ?, ?)').run(planId, '2026-01-01', null);
    testDb.prepare('INSERT INTO vacay_company_holidays (plan_id, date, note) VALUES (?, ?, ?)').run(other, '2026-07-04', 'Not mine');

    const legacy = testDb.prepare('SELECT date, note, fraction FROM vacay_company_holidays WHERE plan_id = ?').all(planId);
    const rows = await repo.listForPlan(planId);

    expect(rows).toEqual(legacy);
    expect(rows.map((r) => r.date).sort()).toEqual(['2026-01-01', '2026-12-25']);
  });

  it('VACAYCOHOLREPO-002: empty array for a plan with none', async () => {
    const { user } = createUser(testDb);
    const planId = insertPlan(user.id);
    expect(await repo.listForPlan(planId)).toEqual([]);
  });
});
