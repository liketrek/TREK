/**
 * Vacay repositories — M3 branch ratchet (task-7-review.md). Plan 3f Task 5
 * added `?? null`/`?? default` folds and not-found ternaries across these
 * repositories with no test exercising the fallback arm. One seeded world
 * per repository (shared `testDb`, reset between tests), raw SQL where a
 * NULL needs to land on a column the ORM itself would never write (the
 * entity's own default keeps every normal write non-null).
 */
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { resetTestDb } from '../../../helpers/test-db';
import { createUser } from '../../../helpers/factories';
import { createTestVacayHolidayCalendarsRepo } from '../../../helpers/school-holidays-repos';
import {
  createTestVacayPlansRepo,
  createTestVacayPlanMembersRepo,
  createTestVacayUserColorsRepo,
  createTestVacayCompanyHolidaysRepo,
  createTestVacaySharesRepo,
} from '../../../helpers/vacay-repos';

const testDb = createSnapshotTestDb();

function makePlan(ownerId: number): number {
  return Number(testDb.prepare('INSERT INTO vacay_plans (owner_id) VALUES (?)').run(ownerId).lastInsertRowid);
}

beforeEach(() => resetTestDb(testDb));
afterAll(() => testDb.close());

describe('VacayCompanyHolidaysRepository — note ?? null (VC29/VC67/VC112)', () => {
  it('listForPlan/listForRange return note: null for a row whose note column is genuinely NULL', async () => {
    const repo = await createTestVacayCompanyHolidaysRepo(testDb);
    const { user } = createUser(testDb);
    const planId = makePlan(user.id);
    testDb.prepare('INSERT INTO vacay_company_holidays (plan_id, date, note) VALUES (?, ?, NULL)').run(planId, '2026-12-25');

    expect(await repo.listForPlan(planId)).toEqual([{ date: '2026-12-25', note: null, fraction: 1 }]);
    expect(await repo.listForRange(planId, '2026-12-01', '2027-01-01')).toMatchObject([{ date: '2026-12-25', note: null }]);
  });
});

describe('VacayUserColorsRepository — color ?? null (VC79/VC57.../VC59)', () => {
  it('listForPlan/findColor/listOtherColors return color: null for a row whose color column is genuinely NULL', async () => {
    const repo = await createTestVacayUserColorsRepo(testDb);
    const { user: u1 } = createUser(testDb);
    const { user: u2 } = createUser(testDb);
    const planId = makePlan(u1.id);
    testDb.prepare('INSERT INTO vacay_user_colors (user_id, plan_id, color) VALUES (?, ?, NULL)').run(u1.id, planId);
    testDb.prepare('INSERT INTO vacay_user_colors (user_id, plan_id, color) VALUES (?, ?, ?)').run(u2.id, planId, '#111111');

    expect(await repo.listForPlan(planId)).toEqual(expect.arrayContaining([{ color: null }, { color: '#111111' }]));
    expect(await repo.findColor(u1.id, planId)).toEqual({ color: null });
    expect(await repo.listOtherColors(planId, u2.id)).toEqual([{ color: null }]);
  });
});

describe('VacayHolidayCalendarsRepository — findById/findScopedForPlan not-found (VC39/VC42/VC40/VC43)', () => {
  it('both return null for an id that does not exist', async () => {
    const repo = await createTestVacayHolidayCalendarsRepo(testDb);
    expect(await repo.findById(999999)).toBeNull();
    expect(await repo.findScopedForPlan(999999, 1)).toBeNull();
  });

  it('findScopedForPlan returns the row for the correct plan, null under a DIFFERENT plan', async () => {
    const repo = await createTestVacayHolidayCalendarsRepo(testDb);
    const { user } = createUser(testDb);
    const planId = makePlan(user.id);
    const otherPlanId = makePlan(createUser(testDb).user.id);
    const id = Number(
      testDb
        .prepare("INSERT INTO vacay_holiday_calendars (plan_id, type, region, color, sort_order) VALUES (?, 'public_holiday', 'US', '#fecaca', 0)")
        .run(planId).lastInsertRowid,
    );
    expect((await repo.findScopedForPlan(id, planId))?.id).toBe(id);
    expect(await repo.findScopedForPlan(id, otherPlanId)).toBeNull();
    expect((await repo.findById(id))?.id).toBe(id);
  });
});

describe('VacayPlanMembersRepository — findMembership/findAcceptedForUser (VC48/VC49)', () => {
  it('findMembership returns null for no row, the row for a pending/accepted one, and status: null for a genuinely NULL status column', async () => {
    const repo = await createTestVacayPlanMembersRepo(testDb);
    const { user: owner } = createUser(testDb);
    const { user: target } = createUser(testDb);
    const planId = makePlan(owner.id);

    expect(await repo.findMembership(planId, target.id)).toBeNull();

    testDb.prepare("INSERT INTO vacay_plan_members (plan_id, user_id, status) VALUES (?, ?, 'pending')").run(planId, target.id);
    const pending = await repo.findMembership(planId, target.id);
    expect(pending).toMatchObject({ status: 'pending' });

    testDb.prepare('UPDATE vacay_plan_members SET status = NULL WHERE plan_id = ? AND user_id = ?').run(planId, target.id);
    expect(await repo.findMembership(planId, target.id)).toEqual({ id: pending!.id, status: null });
  });

  it('findAcceptedForUser returns null for nobody fused, and the row once accepted', async () => {
    const repo = await createTestVacayPlanMembersRepo(testDb);
    const { user: owner } = createUser(testDb);
    const { user: target } = createUser(testDb);
    const planId = makePlan(owner.id);

    expect(await repo.findAcceptedForUser(target.id)).toBeNull();

    const id = Number(
      testDb.prepare("INSERT INTO vacay_plan_members (plan_id, user_id, status) VALUES (?, ?, 'accepted')").run(planId, target.id).lastInsertRowid,
    );
    expect(await repo.findAcceptedForUser(target.id)).toEqual({ id });
  });
});

describe('VacayPlansRepository — findOwnerId/getHolidaysEnabled/findVacayUser (VC18/VC103/VC21/VC16)', () => {
  it('findOwnerId returns null for a plan id that does not exist, the owner id for one that does', async () => {
    const repo = await createTestVacayPlansRepo(testDb);
    const { user } = createUser(testDb);
    const planId = makePlan(user.id);
    expect(await repo.findOwnerId(999999)).toBeNull();
    expect(await repo.findOwnerId(planId)).toEqual({ owner_id: user.id });
  });

  it('getHolidaysEnabled returns null for a missing plan, null for a genuinely NULL column, and the value when set', async () => {
    const repo = await createTestVacayPlansRepo(testDb);
    const { user } = createUser(testDb);
    const planId = makePlan(user.id);
    expect(await repo.getHolidaysEnabled(999999)).toBeNull();

    testDb.prepare('UPDATE vacay_plans SET holidays_enabled = NULL WHERE id = ?').run(planId);
    expect(await repo.getHolidaysEnabled(planId)).toBeNull();

    testDb.prepare('UPDATE vacay_plans SET holidays_enabled = 1 WHERE id = ?').run(planId);
    expect(await repo.getHolidaysEnabled(planId)).toBe(1);
  });

  it('findVacayUser returns null for a user id that does not exist', async () => {
    const repo = await createTestVacayPlansRepo(testDb);
    expect(await repo.findVacayUser(999999)).toBeNull();
    const { user } = createUser(testDb);
    expect(await repo.findVacayUser(user.id)).toMatchObject({ id: user.id, username: user.username });
  });
});

describe('VacaySharesRepository.listDistinctViewerIdsForOwners — empty-array short-circuit (VC20)', () => {
  it('returns [] for an empty ownerIds list, without querying', async () => {
    const repo = await createTestVacaySharesRepo(testDb);
    expect(await repo.listDistinctViewerIdsForOwners([])).toEqual([]);
  });
});
