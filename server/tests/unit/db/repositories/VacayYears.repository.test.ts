/**
 * VacayYearsRepository.listForPlan — Plan 4 Task 8b-2 item 3 (3f L6 carry):
 * VC33/VC94 (`VacayService.listYears`) had no repository-level
 * `toEqual(<legacy raw>)` parity test.
 */
import { VacayYears } from '../../../../src/db/entities/VacayYears.entity';
import type { VacayYearsRepository } from '../../../../src/db/repositories/VacayYears.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { insertRow } from '../../../helpers/factories/rows';
import { makeVacayPlan } from '../../../helpers/factories/vacay';
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

async function insertPlan(ownerId: number): Promise<number> {
  return (await makeVacayPlan(t, ownerId)).id;
}

describe('VacayYearsRepository.listForPlan (VC33/94, VacayService.listYears)', () => {
  it('VACAYYEARREPO-001: matches SELECT year FROM vacay_years WHERE plan_id = ? ORDER BY year run raw, scoped to the plan', async () => {
    const { user } = createUser(testDb);
    const planId = await insertPlan(user.id);
    const other = await insertPlan(createUser(testDb).user.id);
    await insertRow(t, VacayYears, { plan: planId, year: 2027 });
    await insertRow(t, VacayYears, { plan: planId, year: 2026 });
    await insertRow(t, VacayYears, { plan: other, year: 2099 });

    // test-sql-allow: the legacy statement is the oracle the repository read is held to.
    const legacy = testDb.prepare('SELECT year FROM vacay_years WHERE plan_id = ? ORDER BY year').all(planId);
    const years = await repo.listForPlan(planId);

    expect(years).toEqual(legacy.map((r) => (r as { year: number }).year));
    expect(years).toEqual([2026, 2027]);
  });

  it('VACAYYEARREPO-002: empty array for a plan with no years', async () => {
    const { user } = createUser(testDb);
    const planId = await insertPlan(user.id);
    expect(await repo.listForPlan(planId)).toEqual([]);
  });
});
