/**
 * VacayUserYearsRepository.findForYear — Plan 4 Task 8b-2 item 3 (3f L6
 * carry): "getStats rows, including a NULL vacation_days row" (VC34/98/109/
 * 123) had no repository-level `toEqual(<legacy raw>)` parity test.
 */
import { VacayUserYears } from '../../../../src/db/entities/VacayUserYears.entity';
import type { VacayUserYearsRepository } from '../../../../src/db/repositories/VacayUserYears.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: VacayUserYearsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(VacayUserYears);
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

describe('VacayUserYearsRepository.findForYear (VC34/98/109/123, getStats)', () => {
  it('VACAYUYEARREPO-001: matches the legacy row with vacation_days SET (30)', async () => {
    const { user } = createUser(testDb);
    const planId = insertPlan(user.id);
    testDb
      .prepare(
        'INSERT INTO vacay_user_years (user_id, plan_id, year, vacation_days, carried_over) VALUES (?, ?, ?, ?, ?)',
      )
      .run(user.id, planId, 2026, 25, 3);

    const legacy = testDb
      .prepare('SELECT * FROM vacay_user_years WHERE user_id = ? AND plan_id = ? AND year = ?')
      .get(user.id, planId, 2026);
    expect(await repo.findForYear(user.id, planId, 2026)).toEqual(legacy);
  });

  it("VACAYUYEARREPO-002: matches the legacy row with vacation_days explicitly NULL — the review's named gap", async () => {
    const { user } = createUser(testDb);
    const planId = insertPlan(user.id);
    testDb
      .prepare(
        'INSERT INTO vacay_user_years (user_id, plan_id, year, vacation_days, carried_over) VALUES (?, ?, ?, ?, ?)',
      )
      .run(user.id, planId, 2027, null, null);

    const legacy = testDb
      .prepare('SELECT * FROM vacay_user_years WHERE user_id = ? AND plan_id = ? AND year = ?')
      .get(user.id, planId, 2027);
    const row = await repo.findForYear(user.id, planId, 2027);
    expect(row).toEqual(legacy);
    expect(row!.vacation_days).toBeNull();
    expect(row!.carried_over).toBeNull();
  });

  it('VACAYUYEARREPO-003: null for a year with no row', async () => {
    const { user } = createUser(testDb);
    const planId = insertPlan(user.id);
    expect(await repo.findForYear(user.id, planId, 2099)).toBeNull();
  });
});
