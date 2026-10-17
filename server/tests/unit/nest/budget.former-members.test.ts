/**
 * People who left the trip keep their part of an expense (#2604).
 * BUDGET-SVC-DB-087 through 094, moved out of budget.service.db.test.ts.
 *
 * Real in-memory SQLite over the container: BudgetService and TripMembersService
 * come out of TripMembersModule, so a member is removed from the trip the way the
 * app removes one, and the expense saves afterwards run the real roster filter.
 */
import { BudgetItemMembers } from '../../../src/db/entities/BudgetItemMembers.entity';
import { BudgetService } from '../../../src/nest/budget/budget.service';
import { TripMembersModule } from '../../../src/nest/trip-members/trip-members.module';
import { TripMembersService } from '../../../src/nest/trip-members/trip-members.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { findRow } from '../../helpers/factories/rows';
import { addTripMember, makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let budget: BudgetService;
let membersSvc: TripMembersService;
const orm = () => t.get(MikroORM);

beforeAll(async () => {
  t = await createTestModule({ db, imports: [TripMembersModule] });
  budget = t.get(BudgetService);
  membersSvc = t.get(TripMembersService);
});

afterAll(async () => {
  await t.close();
  db.close();
});

async function paidFlag(itemId: number, memberId: number): Promise<number | undefined> {
  const row = await findRow(orm(), BudgetItemMembers, { budgetItem: itemId, user: memberId });
  return row?.paid;
}

// ── People who left the trip keep their part of an expense (#2604) ───────────
// Removing someone from the trip leaves their payer and split rows in place.
// Saving the expense used to run every id back through the roster filter, so an
// unchanged save dropped them, total_price shrank to what the rest had paid and
// a custom split stopped adding up. Ids already on the expense stay allowed; a
// stranger who never was on it is still dropped (#1952).

describe('someone who left the trip keeps their part of an expense (#2604)', () => {
  async function tripWithFormerMember() {
    const { user: alice } = await makeUser(orm());
    const { user: bob } = await makeUser(orm());
    const { user: carol } = await makeUser(orm());
    const trip = await makeTrip(orm(), alice.id);
    await addTripMember(orm(), trip.id, bob.id);
    await addTripMember(orm(), trip.id, carol.id);
    return { alice, bob, carol, trip };
  }
  const balanceSum = (balances: { balance: number }[]) => Math.round(balances.reduce((a, b) => a + b.balance, 0) * 100);

  it('BUDGET-SVC-DB-087: an unchanged save keeps a former member as payer and split member', async () => {
    const { alice, bob, carol, trip } = await tripWithFormerMember();
    const item = await budget.createBudgetItem(trip.id, {
      name: 'Rental car',
      payers: [
        { user_id: alice.id, amount: 120 },
        { user_id: bob.id, amount: 60 },
      ],
      member_ids: [alice.id, bob.id, carol.id],
    });
    await membersSvc.removeMember(trip.id, bob.id);

    // What the expense form sends back: the ids it was seeded with.
    const saved = await budget.updateBudgetItem(item.id, trip.id, {
      note: 'keys at the desk',
      payers: [
        { user_id: alice.id, amount: 120 },
        { user_id: bob.id, amount: 60 },
      ],
      member_ids: [alice.id, bob.id, carol.id],
    });

    expect(saved?.total_price).toBe(180);
    expect(saved?.payers.map((p) => p.user_id).sort()).toEqual([alice.id, bob.id].sort());
    expect(saved?.members.map((m) => m.user_id).sort()).toEqual([alice.id, bob.id, carol.id].sort());
    expect(saved?.persons).toBe(3);
    const settlement = await budget.calculateSettlement(trip.id);
    expect(balanceSum(settlement.balances)).toBe(0);
  });

  it('BUDGET-SVC-DB-088: a custom split with a former member still adds up after a save', async () => {
    const { alice, bob, carol, trip } = await tripWithFormerMember();
    const item = await budget.createBudgetItem(trip.id, {
      name: 'Dinner',
      payers: [{ user_id: bob.id, amount: 90 }],
      members: [
        { user_id: alice.id, amount: 30 },
        { user_id: bob.id, amount: 30 },
        { user_id: carol.id, amount: 30 },
      ],
    });
    await membersSvc.removeMember(trip.id, bob.id);

    const saved = await budget.updateBudgetItem(item.id, trip.id, {
      payers: [{ user_id: bob.id, amount: 90 }],
      members: [
        { user_id: alice.id, amount: 30 },
        { user_id: bob.id, amount: 30 },
        { user_id: carol.id, amount: 30 },
      ],
    });

    expect(saved?.total_price).toBe(90);
    expect(saved?.members.reduce((a, m) => a + (m.amount ?? 0), 0)).toBe(90);
    const settlement = await budget.calculateSettlement(trip.id);
    expect(balanceSum(settlement.balances)).toBe(0);
    expect(settlement.balances.find((b) => b.user_id === bob.id)?.balance).toBe(60);
  });

  it('BUDGET-SVC-DB-089: a stranger who never was on the expense is still dropped', async () => {
    const { alice, bob, trip } = await tripWithFormerMember();
    const { user: outsider } = await makeUser(orm());
    const item = await budget.createBudgetItem(trip.id, {
      name: 'Taxi',
      payers: [{ user_id: alice.id, amount: 40 }],
      member_ids: [alice.id, bob.id],
    });

    const saved = await budget.updateBudgetItem(item.id, trip.id, {
      payers: [
        { user_id: alice.id, amount: 40 },
        { user_id: outsider.id, amount: 10 },
      ],
      member_ids: [alice.id, bob.id, outsider.id],
    });

    expect(saved?.payers.map((p) => p.user_id)).toEqual([alice.id]);
    expect(saved?.members.map((m) => m.user_id)).not.toContain(outsider.id);
    expect(saved?.total_price).toBe(40);
    const viaMembers = await budget.updateMembers(item.id, trip.id, [alice.id, outsider.id]);
    expect(viaMembers?.members.map((m) => m.user_id)).toEqual([alice.id]);
  });

  it('BUDGET-SVC-DB-090: leaving a former member out of the save removes them', async () => {
    const { alice, bob, carol, trip } = await tripWithFormerMember();
    const item = await budget.createBudgetItem(trip.id, {
      name: 'Museum',
      payers: [{ user_id: alice.id, amount: 30 }],
      member_ids: [alice.id, bob.id, carol.id],
    });
    await membersSvc.removeMember(trip.id, bob.id);

    const saved = await budget.updateBudgetItem(item.id, trip.id, {
      payers: [{ user_id: alice.id, amount: 30 }],
      member_ids: [alice.id, carol.id],
    });

    expect(saved?.members.map((m) => m.user_id).sort()).toEqual([alice.id, carol.id].sort());
    // Once gone from the expense, they cannot be put back while off the trip.
    const again = await budget.updateBudgetItem(item.id, trip.id, { member_ids: [alice.id, bob.id, carol.id] });
    expect(again?.members.map((m) => m.user_id)).not.toContain(bob.id);
  });

  it('BUDGET-SVC-DB-091: a former member who was only in the split can be recorded as the payer', async () => {
    const { alice, bob, trip } = await tripWithFormerMember();
    const item = await budget.createBudgetItem(trip.id, {
      name: 'Tickets',
      payers: [{ user_id: alice.id, amount: 50 }],
      member_ids: [alice.id, bob.id],
    });
    await membersSvc.removeMember(trip.id, bob.id);

    const saved = await budget.updateBudgetItem(item.id, trip.id, {
      payers: [{ user_id: bob.id, amount: 50 }],
      member_ids: [alice.id, bob.id],
    });

    expect(saved?.payers.map((p) => p.user_id)).toEqual([bob.id]);
    expect(saved?.total_price).toBe(50);
  });

  it('BUDGET-SVC-DB-092: the paid ticks survive a form save', async () => {
    const { alice, bob, carol, trip } = await tripWithFormerMember();
    const item = await budget.createBudgetItem(trip.id, {
      name: 'Hotel',
      payers: [{ user_id: alice.id, amount: 300 }],
      member_ids: [alice.id, bob.id, carol.id],
    });
    await budget.toggleMemberPaid(item.id, trip.id, carol.id, true);
    await budget.toggleMemberPaid(item.id, trip.id, bob.id, true);
    await membersSvc.removeMember(trip.id, bob.id);

    await budget.updateBudgetItem(item.id, trip.id, {
      name: 'Hotel Central',
      payers: [{ user_id: alice.id, amount: 300 }],
      member_ids: [alice.id, bob.id, carol.id],
    });

    expect(await paidFlag(item.id, carol.id)).toBe(1);
    expect(await paidFlag(item.id, bob.id)).toBe(1);
    expect(await paidFlag(item.id, alice.id)).toBe(0);
  });

  it('BUDGET-SVC-DB-093: the payer and member routes keep a former member too', async () => {
    const { alice, bob, trip } = await tripWithFormerMember();
    const item = await budget.createBudgetItem(trip.id, {
      name: 'Ferry',
      payers: [
        { user_id: alice.id, amount: 20 },
        { user_id: bob.id, amount: 20 },
      ],
      member_ids: [alice.id, bob.id],
    });
    await membersSvc.removeMember(trip.id, bob.id);

    const payers = await budget.setItemPayers(item.id, trip.id, [
      { user_id: alice.id, amount: 20 },
      { user_id: bob.id, amount: 20 },
    ]);
    expect(payers?.total_price).toBe(40);
    expect(payers?.payers.map((p) => p.user_id).sort()).toEqual([alice.id, bob.id].sort());

    const members = await budget.updateMembers(item.id, trip.id, [alice.id, bob.id]);
    expect(members?.members.map((m) => m.user_id).sort()).toEqual([alice.id, bob.id].sort());
  });

  it('BUDGET-SVC-DB-094: a new expense still takes only people on the trip', async () => {
    const { alice, bob, trip } = await tripWithFormerMember();
    await membersSvc.removeMember(trip.id, bob.id);

    const item = (await budget.createBudgetItem(trip.id, {
      name: 'Lunch',
      payers: [
        { user_id: alice.id, amount: 20 },
        { user_id: bob.id, amount: 20 },
      ],
      member_ids: [alice.id, bob.id],
    })) as { payers: { user_id: number }[]; members: { user_id: number }[]; total_price: number };

    expect(item.payers.map((p) => p.user_id)).toEqual([alice.id]);
    expect(item.members.map((m) => m.user_id)).toEqual([alice.id]);
    expect(item.total_price).toBe(20);
  });
});
