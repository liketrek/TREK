/**
 * Vacay repositories — M3 branch ratchet (task-7-review.md). Plan 3f Task 5
 * added `?? null`/`?? default` folds and not-found ternaries across these
 * repositories with no test exercising the fallback arm. One seeded world
 * per repository (shared `testDb`, reset between tests), raw SQL where a
 * NULL needs to land on a column the ORM itself would never write (the
 * entity's own default keeps every normal write non-null).
 */
import { VacayCompanyHolidays } from '../../../../src/db/entities/VacayCompanyHolidays.entity';
import { VacayHolidayCalendars } from '../../../../src/db/entities/VacayHolidayCalendars.entity';
import { VacayPlanMembers } from '../../../../src/db/entities/VacayPlanMembers.entity';
import { VacayPlans } from '../../../../src/db/entities/VacayPlans.entity';
import { VacayUserColors } from '../../../../src/db/entities/VacayUserColors.entity';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { insertRow, updateRows } from '../../../helpers/factories/rows';
import { addVacayPlanMember, makeVacayPlan } from '../../../helpers/factories/vacay';
import { createTestVacayHolidayCalendarsRepo } from '../../../helpers/school-holidays-repos';
import { resetTestDb } from '../../../helpers/test-db';
import { sharedTestOrm } from '../../../helpers/test-uow';
import {
  createTestVacayPlansRepo,
  createTestVacayPlanMembersRepo,
  createTestVacayUserColorsRepo,
  createTestVacayCompanyHolidaysRepo,
  createTestVacaySharesRepo,
} from '../../../helpers/vacay-repos';

import { afterAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
const orm = () => sharedTestOrm(testDb);

async function makePlan(ownerId: number): Promise<number> {
  return (await makeVacayPlan(await orm(), ownerId)).id;
}

beforeEach(() => resetTestDb(testDb));
afterAll(() => testDb.close());

describe('VacayCompanyHolidaysRepository — note ?? null (VC29/VC67/VC112)', () => {
  it('listForPlan/listForRange return note: null for a row whose note column is genuinely NULL', async () => {
    const repo = await createTestVacayCompanyHolidaysRepo(testDb);
    const { user } = createUser(testDb);
    const planId = await makePlan(user.id);
    await insertRow(await orm(), VacayCompanyHolidays, { plan: planId, date: '2026-12-25', note: null });

    expect(await repo.listForPlan(planId)).toEqual([{ date: '2026-12-25', note: null, fraction: 1 }]);
    expect(await repo.listForRange(planId, '2026-12-01', '2027-01-01')).toMatchObject([
      { date: '2026-12-25', note: null },
    ]);
  });
});

describe('VacayUserColorsRepository — color ?? null (VC79/VC57.../VC59)', () => {
  it('listForPlan/findColor/listOtherColors return color: null for a row whose color column is genuinely NULL', async () => {
    const repo = await createTestVacayUserColorsRepo(testDb);
    const { user: u1 } = createUser(testDb);
    const { user: u2 } = createUser(testDb);
    const planId = await makePlan(u1.id);
    await insertRow(await orm(), VacayUserColors, { user: u1.id, plan: planId, color: null });
    await insertRow(await orm(), VacayUserColors, { user: u2.id, plan: planId, color: '#111111' });

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
    const planId = await makePlan(user.id);
    const otherPlanId = await makePlan(createUser(testDb).user.id);
    const id = await insertRow(await orm(), VacayHolidayCalendars, {
      plan: planId,
      type: 'public_holiday',
      region: 'US',
      color: '#fecaca',
      sort_order: 0,
    });
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
    const planId = await makePlan(owner.id);

    expect(await repo.findMembership(planId, target.id)).toBeNull();

    await addVacayPlanMember(await orm(), planId, target.id, 'pending');
    const pending = await repo.findMembership(planId, target.id);
    expect(pending).toMatchObject({ status: 'pending' });

    await updateRows(await orm(), VacayPlanMembers, { plan: planId, user: target.id }, { status: null });
    expect(await repo.findMembership(planId, target.id)).toEqual({ id: pending!.id, status: null });
  });

  it('findAcceptedForUser returns null for nobody fused, and the row once accepted', async () => {
    const repo = await createTestVacayPlanMembersRepo(testDb);
    const { user: owner } = createUser(testDb);
    const { user: target } = createUser(testDb);
    const planId = await makePlan(owner.id);

    expect(await repo.findAcceptedForUser(target.id)).toBeNull();

    const { id } = await addVacayPlanMember(await orm(), planId, target.id, 'accepted');
    expect(await repo.findAcceptedForUser(target.id)).toEqual({ id });
  });
});

describe('VacayPlansRepository — findOwnerId/getHolidaysEnabled/findVacayUser (VC18/VC103/VC21/VC16)', () => {
  it('findOwnerId returns null for a plan id that does not exist, the owner id for one that does', async () => {
    const repo = await createTestVacayPlansRepo(testDb);
    const { user } = createUser(testDb);
    const planId = await makePlan(user.id);
    expect(await repo.findOwnerId(999999)).toBeNull();
    expect(await repo.findOwnerId(planId)).toEqual({ owner_id: user.id });
  });

  it('getHolidaysEnabled returns null for a missing plan, null for a genuinely NULL column, and the value when set', async () => {
    const repo = await createTestVacayPlansRepo(testDb);
    const { user } = createUser(testDb);
    const planId = await makePlan(user.id);
    expect(await repo.getHolidaysEnabled(999999)).toBeNull();

    await updateRows(await orm(), VacayPlans, { id: planId }, { holidays_enabled: null });
    expect(await repo.getHolidaysEnabled(planId)).toBeNull();

    await updateRows(await orm(), VacayPlans, { id: planId }, { holidays_enabled: 1 });
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
