/**
 * VacayYearsRepository.listForPlan — Plan 4 Task 8b-2 item 3 (3f L6 carry):
 * VC33/VC94 (`VacayService.listYears`) had no repository-level
 * `toEqual(<legacy raw>)` parity test.
 */
import { VacayYears } from '../../../../src/db/entities/VacayYears.entity';
import type { VacayYearsRepository } from '../../../../src/db/repositories/VacayYears.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: VacayYearsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(VacayYears);
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

describe('VacayYearsRepository.listForPlan (VC33/94, VacayService.listYears)', () => {
  it('VACAYYEARREPO-001: matches SELECT year FROM vacay_years WHERE plan_id = ? ORDER BY year run raw, scoped to the plan', async () => {
    const { user } = createUser(testDb);
    const planId = insertPlan(user.id);
    const other = insertPlan(createUser(testDb).user.id);
    testDb.prepare('INSERT INTO vacay_years (plan_id, year) VALUES (?, ?)').run(planId, 2027);
    testDb.prepare('INSERT INTO vacay_years (plan_id, year) VALUES (?, ?)').run(planId, 2026);
    testDb.prepare('INSERT INTO vacay_years (plan_id, year) VALUES (?, ?)').run(other, 2099);

    const legacy = testDb.prepare('SELECT year FROM vacay_years WHERE plan_id = ? ORDER BY year').all(planId);
    const years = await repo.listForPlan(planId);

    expect(years).toEqual(legacy.map((r) => (r as { year: number }).year));
    expect(years).toEqual([2026, 2027]);
  });

  it('VACAYYEARREPO-002: empty array for a plan with no years', async () => {
    const { user } = createUser(testDb);
    const planId = insertPlan(user.id);
    expect(await repo.listForPlan(planId)).toEqual([]);
  });
});
