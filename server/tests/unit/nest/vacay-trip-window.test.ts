/**
 * VacayService.shiftOwnerEntriesForTripWindow: a trip's new start carries its
 * owner's leave days along (#983). Moved out of vacay.service.test.ts with the
 * #2604 cases (a block moves whole, blocked and taken targets drop the day,
 * fused plans, no lazy plan).
 */
import { VacayCompanyHolidays } from '../../../src/db/entities/VacayCompanyHolidays.entity';
import { VacayEntries } from '../../../src/db/entities/VacayEntries.entity';
import { VacayPlanMembers } from '../../../src/db/entities/VacayPlanMembers.entity';
import { VacayPlans } from '../../../src/db/entities/VacayPlans.entity';
import { VacayModule } from '../../../src/nest/vacay/vacay.module';
import { VacayService } from '../../../src/nest/vacay/vacay.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { countRows, deleteRows, findRows, insertRow, insertRows, updateRows } from '../../helpers/factories/rows';
import { makeUser } from '../../helpers/factories/users';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let svc: VacayService;
const orm = () => t.get(MikroORM);

beforeAll(async () => {
  t = await createTestModule({ db, imports: [VacayModule] });
  svc = t.get(VacayService);
});

afterAll(async () => {
  await t.close();
  db.close();
});

/** A user with their own plan, weekends blocked as a new plan has them. */
async function setupUserWithPlan() {
  const { user } = await makeUser(orm());
  const plan = await svc.getOwnPlan(user.id);
  return { user, plan };
}

/** The user's entry dates in the plan, in date order. */
async function datesOf(planId: number, userId: number): Promise<string[]> {
  return (await findRows(orm(), VacayEntries, { plan: planId, user: userId }, { date: 'asc' })).map((r) => r.date);
}

/** Replace the plan's entries with one per date for the user, inserted in the order given. */
async function seedEntries(planId: number, userId: number, dates: string[]): Promise<void> {
  await deleteRows(orm(), VacayEntries, { plan: planId });
  await insertRows(
    orm(),
    VacayEntries,
    dates.map((date) => ({ plan: planId, user: userId, date, note: '' })),
  );
}

describe('shiftOwnerEntriesForTripWindow', () => {
  it('VACAY-SVC-030b (VC4 parity): shifts an entry by the exact calendar-day offset between the old and new trip start, across several date-pair shapes incl. a leap-year boundary', async () => {
    // R9's verified restructured shape (task-0-report.md): plain JS date-diff
    // arithmetic in place of the legacy CAST(julianday(?) - julianday(?) AS
    // INTEGER), verified there against the SQL on 5 date pairs incl. a
    // leap-year boundary and a negative offset. Every target is a weekday.
    const { user, plan } = await setupUserWithPlan();
    const shiftOne = async (oldStart: string, oldEnd: string, newStart: string, entryDate: string) => {
      await seedEntries(plan.id, user.id, [entryDate]);
      await svc.shiftOwnerEntriesForTripWindow(user.id, oldStart, oldEnd, newStart);
      return datesOf(plan.id, user.id);
    };

    expect(await shiftOne('2026-03-01', '2026-03-10', '2026-03-06', '2026-03-05')).toEqual(['2026-03-10']); // +5 days
    expect(await shiftOne('2024-02-25', '2024-03-05', '2024-02-28', '2024-03-01')).toEqual(['2024-03-04']); // leap year, +3
    expect(await shiftOne('2026-06-10', '2026-06-20', '2026-06-03', '2026-06-15')).toEqual(['2026-06-08']); // -7 days
  });

  it('VACAY-SVC-030c: a zero offset is a no-op (no write at all)', async () => {
    const { user, plan } = await setupUserWithPlan();
    await seedEntries(plan.id, user.id, ['2026-05-05']);

    await svc.shiftOwnerEntriesForTripWindow(user.id, '2026-05-01', '2026-05-10', '2026-05-01');

    expect(await datesOf(plan.id, user.id)).toEqual(['2026-05-05']);
  });

  it("VACAY-SVC-030d (M2 parity): an unparseable start (garbage) resolves as a no-op, same as legacy's NULL-julianday offset of 0, instead of writing a NaN date", async () => {
    const { user, plan } = await setupUserWithPlan();
    await seedEntries(plan.id, user.id, ['2026-05-05']);

    await expect(
      svc.shiftOwnerEntriesForTripWindow(user.id, '2026-05-01', '2026-05-10', 'soon'),
    ).resolves.toBeUndefined();

    expect(await datesOf(plan.id, user.id)).toEqual(['2026-05-05']);
  });

  it("VACAY-SVC-030e (M2 parity): a datetime start with no zone suffix is parsed as UTC and truncated, matching base's CAST(julianday(...) AS INTEGER) rather than a local-time round", async () => {
    // base: CAST(julianday('2025-06-12T23:30') - julianday('2025-06-10') AS INTEGER) = 2
    // (2 days 23.5 hours, truncated toward zero); a local-time Date.parse +
    // Math.round of the same pair computed 3 instead (task-7-review.md M2).
    const { user, plan } = await setupUserWithPlan();
    await seedEntries(plan.id, user.id, ['2025-06-15']);

    await svc.shiftOwnerEntriesForTripWindow(user.id, '2025-06-10', '2025-06-20', '2025-06-12T23:30');

    expect(await datesOf(plan.id, user.id)).toEqual(['2025-06-17']);
  });

  it('VACAY-SVC-030f (#2604): a block of consecutive days moves whole, in both directions and whatever order the rows were inserted in', async () => {
    // The old per-row `UPDATE OR IGNORE` checked each target against rows that
    // were about to move themselves, so a block shifted by less than its own
    // length left its first days behind. 2026-07-14 is a Tuesday.
    const { user, plan } = await setupUserWithPlan();
    const shiftBlock = async (dates: string[], newStart: string) => {
      await seedEntries(plan.id, user.id, dates);
      await svc.shiftOwnerEntriesForTripWindow(user.id, '2026-07-01', '2026-07-20', newStart);
      return datesOf(plan.id, user.id);
    };
    const ascending = ['2026-07-14', '2026-07-15', '2026-07-16'];
    const descending = [...ascending].reverse();

    expect(await shiftBlock(descending, '2026-07-02')).toEqual(['2026-07-15', '2026-07-16', '2026-07-17']);
    expect(await shiftBlock(ascending, '2026-07-02')).toEqual(['2026-07-15', '2026-07-16', '2026-07-17']);
    expect(await shiftBlock(descending, '2026-06-30')).toEqual(['2026-07-13', '2026-07-14', '2026-07-15']);
    expect(await shiftBlock(ascending, '2026-06-30')).toEqual(['2026-07-13', '2026-07-14', '2026-07-15']);
  });

  it('VACAY-SVC-030g (#2604): a Monday to Friday block moved by two days keeps its length without weekend blocking and drops the days that land on a blocked weekend', async () => {
    // 2030-11-25 is a Monday.
    const { user, plan } = await setupUserWithPlan();
    const week = ['2030-11-25', '2030-11-26', '2030-11-27', '2030-11-28', '2030-11-29'];
    const shiftWeek = async (newStart: string) => {
      await seedEntries(plan.id, user.id, week);
      await svc.shiftOwnerEntriesForTripWindow(user.id, '2030-11-25', '2030-11-30', newStart);
      return datesOf(plan.id, user.id);
    };

    expect(await shiftWeek('2030-11-27')).toEqual(['2030-11-27', '2030-11-28', '2030-11-29']);
    expect(await shiftWeek('2030-11-23')).toEqual(['2030-11-25', '2030-11-26', '2030-11-27']);

    await updateRows(orm(), VacayPlans, { id: plan.id }, { block_weekends: 0 });
    expect(await shiftWeek('2030-11-27')).toEqual([
      '2030-11-27',
      '2030-11-28',
      '2030-11-29',
      '2030-11-30',
      '2030-12-01',
    ]);
    expect(await shiftWeek('2030-11-23')).toEqual([
      '2030-11-23',
      '2030-11-24',
      '2030-11-25',
      '2030-11-26',
      '2030-11-27',
    ]);
  });

  it('VACAY-SVC-030h (#2604): a day whose target already holds leave that is not moving is dropped, the standing entry stays as it was', async () => {
    const { user, plan } = await setupUserWithPlan();
    await insertRows(orm(), VacayEntries, [
      { plan: plan.id, user: user.id, date: '2026-07-14', note: '' },
      { plan: plan.id, user: user.id, date: '2026-07-15', note: '' },
      { plan: plan.id, user: user.id, date: '2026-07-17', note: 'standing', fraction: 0.5, kind: 'comp' },
    ]);

    await svc.shiftOwnerEntriesForTripWindow(user.id, '2026-07-14', '2026-07-16', '2026-07-16');

    const rows = await findRows(orm(), VacayEntries, { plan: plan.id, user: user.id }, { date: 'asc' });
    expect(rows.map(({ date, note, fraction, kind }) => ({ date, note, fraction, kind }))).toEqual([
      { date: '2026-07-16', note: '', fraction: 1, kind: 'vacation' },
      { date: '2026-07-17', note: 'standing', fraction: 0.5, kind: 'comp' },
    ]);
  });

  it('VACAY-SVC-030i (#2604): a target on a whole company holiday drops the day, one on a half company holiday keeps half of it', async () => {
    const { user, plan } = await setupUserWithPlan();
    await updateRows(orm(), VacayPlans, { id: plan.id }, { company_holidays_enabled: 1 });
    await insertRows(orm(), VacayCompanyHolidays, [
      { plan: plan.id, date: '2026-07-15', note: '', fraction: 1 },
      { plan: plan.id, date: '2026-07-16', note: '', fraction: 0.5 },
    ]);
    await seedEntries(plan.id, user.id, ['2026-07-13', '2026-07-14']);

    await svc.shiftOwnerEntriesForTripWindow(user.id, '2026-07-13', '2026-07-14', '2026-07-15');

    const rows = await findRows(orm(), VacayEntries, { plan: plan.id, user: user.id }, { date: 'asc' });
    expect(rows.map(({ date, fraction }) => ({ date, fraction }))).toEqual([{ date: '2026-07-16', fraction: 0.5 }]);
  });

  it("VACAY-SVC-030j (#2604): a member of a fused plan has their own days moved in the shared plan, nobody else's, and gets no plan of their own", async () => {
    const { user: owner, plan } = await setupUserWithPlan();
    const { user: member } = await makeUser(orm());
    await insertRow(orm(), VacayPlanMembers, { plan: plan.id, user: member.id, status: 'accepted' });
    await insertRows(
      orm(),
      VacayEntries,
      [member.id, owner.id].flatMap((userId) => [
        { plan: plan.id, user: userId, date: '2026-07-14', note: '' },
        { plan: plan.id, user: userId, date: '2026-07-15', note: '' },
      ]),
    );

    const changed = await svc.shiftOwnerEntriesForTripWindow(member.id, '2026-07-14', '2026-07-15', '2026-07-21');

    expect(changed).toBe(plan.id);
    expect(await datesOf(plan.id, member.id)).toEqual(['2026-07-21', '2026-07-22']);
    expect(await datesOf(plan.id, owner.id)).toEqual(['2026-07-14', '2026-07-15']);
    expect(await countRows(orm(), VacayPlans, { owner: member.id })).toBe(0);
  });

  it('VACAY-SVC-030k (#2604): a trip owner without a vacay plan gets none from moving the trip', async () => {
    const { user } = await makeUser(orm());

    await expect(
      svc.shiftOwnerEntriesForTripWindow(user.id, '2026-07-14', '2026-07-15', '2026-07-21'),
    ).resolves.toBeUndefined();

    expect(await countRows(orm(), VacayPlans, { owner: user.id })).toBe(0);
  });
});
