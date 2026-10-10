/**
 * VacayPlansRepository — Plan 4 Task 8b-2 item 3 (3f L6 carry): the
 * `getPlanData`/`getStats` composite's own plan read (VC7/VC14, "the
 * hottest statement in this file") had no repository-level
 * `toEqual(<legacy raw>)` parity test.
 */
import { VacayPlans } from '../../../../src/db/entities/VacayPlans.entity';
import type { VacayPlansRepository } from '../../../../src/db/repositories/VacayPlans.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { makeVacayPlan } from '../../../helpers/factories/vacay';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: VacayPlansRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(VacayPlans);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

async function insertPlan(
  ownerId: number,
  overrides: Partial<{
    block_weekends: number;
    holidays_enabled: number;
    holidays_region: string;
    school_holidays_enabled: number;
    company_holidays_enabled: number;
    carry_over_enabled: number;
    weekend_days: string;
    week_start: number;
  }> = {},
): Promise<number> {
  return (await makeVacayPlan(t, ownerId, overrides)).id;
}

describe('VacayPlansRepository.findByOwner (VC7/9/78)', () => {
  it('VACAYPLANREPO-001: matches SELECT * FROM vacay_plans WHERE owner_id = ? run raw, every nullable column set', async () => {
    const { user } = createUser(testDb);
    const id = await insertPlan(user.id, { holidays_region: 'DE', weekend_days: '["sat","sun"]', week_start: 1 });

    // test-sql-allow: the legacy statement is the oracle the repository read is held to.
    const legacy = testDb.prepare('SELECT * FROM vacay_plans WHERE owner_id = ?').get(user.id);
    expect(await repo.findByOwner(user.id)).toEqual(legacy);
    expect((await repo.findByOwner(user.id))!.id).toBe(id);
  });

  it('VACAYPLANREPO-002: null when the user has no plan', async () => {
    const { user } = createUser(testDb);
    expect(await repo.findByOwner(user.id)).toBeNull();
  });
});

describe('VacayPlansRepository.findById (VC14, the hottest statement in this file)', () => {
  it('VACAYPLANREPO-003: matches SELECT * FROM vacay_plans WHERE id = ? run raw, defaulted columns included', async () => {
    const { user } = createUser(testDb);
    const id = await insertPlan(user.id);

    // test-sql-allow: the legacy statement is the oracle the repository read is held to.
    const legacy = testDb.prepare('SELECT * FROM vacay_plans WHERE id = ?').get(id);
    expect(await repo.findById(id)).toEqual(legacy);
  });

  it('VACAYPLANREPO-004: null for a missing id', async () => {
    expect(await repo.findById(999999)).toBeNull();
  });
});
