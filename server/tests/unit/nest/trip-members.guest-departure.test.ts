/**
 * Deleting a guest leaves the trip's money adding up (#2604). GUEST-DEP-001+.
 *
 * Real in-memory SQLite over the container, so the ON DELETE cascades that used
 * to take a guest's payer rows and recorded payments with them are the ones
 * production runs. A guest who moved money is refused; one who only shared in
 * expenses has their share handed to the others, by amount and by receipt line.
 */
import { BudgetItemMembers } from '../../../src/db/entities/BudgetItemMembers.entity';
import { BudgetItemPayers } from '../../../src/db/entities/BudgetItemPayers.entity';
import { BudgetItems } from '../../../src/db/entities/BudgetItems.entity';
import { BudgetSettlements } from '../../../src/db/entities/BudgetSettlements.entity';
import { Users } from '../../../src/db/entities/Users.entity';
import { UserCleanupService } from '../../../src/nest/auth/user-cleanup.service';
import { BudgetService } from '../../../src/nest/budget/budget.service';
import { TripMembersModule } from '../../../src/nest/trip-members/trip-members.module';
import { TripMembersService } from '../../../src/nest/trip-members/trip-members.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { countRows, findRow, findRows, updateRows } from '../../helpers/factories/rows';
import { addTripMember, makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let members: TripMembersService;
let budget: BudgetService;
const orm = () => t.get(MikroORM);

beforeAll(async () => {
  t = await createTestModule({ db, imports: [TripMembersModule] });
  members = t.get(TripMembersService);
  budget = t.get(BudgetService);
});

afterAll(async () => {
  await t.close();
  db.close();
});

/** A trip with its owner, one more member and a guest. */
async function tripWithGuest() {
  const { user: owner } = await makeUser(orm());
  const { user: other } = await makeUser(orm());
  const trip = await makeTrip(orm(), owner.id);
  await addTripMember(orm(), trip.id, other.id);
  const guest = (await members.createGuest(trip.id, 'FIX1012 G', owner.id)).member;
  return { owner, other, trip, guest };
}

async function amountsOf(itemId: number): Promise<Record<number, number | null>> {
  const rows = await findRows(orm(), BudgetItemMembers, { budgetItem: itemId });
  return Object.fromEntries(rows.map((r) => [r.user_id, r.amount ?? null]));
}

async function itemRow(id: number) {
  const row = await findRow(orm(), BudgetItems, { id });
  if (!row) throw new Error(`no budget item ${id}`);
  return row;
}

/** The trip's balances added up, in cents: zero whenever every share has a payer behind it. */
async function balanceCents(tripId: number): Promise<number> {
  const { balances } = await budget.calculateSettlement(tripId);
  return Math.round(balances.reduce((sum, b) => sum + b.balance * 100, 0));
}

describe('a guest who moved money stays (#2604)', () => {
  it('GUEST-DEP-001: refuses a guest who paid an expense with a 409, and changes nothing', async () => {
    const { owner, trip, guest } = await tripWithGuest();
    const item = await budget.createBudgetItem(trip.id, {
      name: 'Museum',
      payers: [{ user_id: guest.id, amount: 60 }],
      member_ids: [owner.id, guest.id],
    });

    await expect(members.deleteGuest(trip.id, guest.id)).rejects.toMatchObject({
      status: 409,
      code: 'guest_has_payments',
      publicMessage: expect.stringContaining('Change the payer or delete the payment first'),
    });

    expect(await findRow(orm(), Users, { id: guest.id })).toBeTruthy();
    expect((await findRows(orm(), BudgetItemPayers, { budgetItem: item.id })).map((p) => p.user_id)).toEqual([
      guest.id,
    ]);
    expect(
      Object.keys(await amountsOf(item.id))
        .map(Number)
        .sort(),
    ).toEqual([owner.id, guest.id].sort());
  });

  it('GUEST-DEP-002: refuses a guest whose only payer row is a refund (a negative amount, #2176)', async () => {
    const { owner, trip, guest } = await tripWithGuest();
    await budget.createBudgetItem(trip.id, {
      name: 'Refund',
      payers: [
        { user_id: owner.id, amount: 50 },
        { user_id: guest.id, amount: -10 },
      ],
      member_ids: [owner.id],
    });

    await expect(members.deleteGuest(trip.id, guest.id)).rejects.toMatchObject({ status: 409 });
  });

  it.each(['from', 'to'] as const)(
    'GUEST-DEP-003: refuses a guest on the %s side of a recorded payment',
    async (side) => {
      const { owner, trip, guest } = await tripWithGuest();
      const [from, to] = side === 'from' ? [guest.id, owner.id] : [owner.id, guest.id];
      await budget.insertSettlement(trip.id, { from_user_id: from, to_user_id: to, amount: 20 }, owner.id);

      await expect(members.deleteGuest(trip.id, guest.id)).rejects.toMatchObject({ status: 409 });
      expect(await countRows(orm(), BudgetSettlements, { trip: trip.id })).toBe(1);
    },
  );
});

describe('a deleted guest hands their share on (#2604)', () => {
  it('GUEST-DEP-004: splits a custom amount across the others, the leftover cent included', async () => {
    const { owner, other, trip, guest } = await tripWithGuest();
    const item = await budget.createBudgetItem(trip.id, {
      name: 'Snacks',
      payers: [{ user_id: owner.id, amount: 90.01 }],
      members: [
        { user_id: owner.id, amount: 30 },
        { user_id: other.id, amount: 20 },
        { user_id: guest.id, amount: 40.01 },
      ],
    });

    expect(await members.deleteGuest(trip.id, guest.id)).toBe(true);

    const amounts = await amountsOf(item.id);
    expect(Object.keys(amounts).map(Number).sort()).toEqual([owner.id, other.id].sort());
    const added = [(amounts[owner.id] ?? 0) - 30, (amounts[other.id] ?? 0) - 20].map((v) => Math.round(v * 100)).sort();
    expect(added).toEqual([2000, 2001]);
    expect(await balanceCents(trip.id)).toBe(0);
  });

  it('GUEST-DEP-005: gives members without an amount one, so the expense stays split by amount', async () => {
    const { owner, other, trip, guest } = await tripWithGuest();
    const item = await budget.createBudgetItem(trip.id, {
      name: 'Mixed',
      payers: [{ user_id: owner.id, amount: 40 }],
      members: [
        { user_id: owner.id, amount: null },
        { user_id: other.id, amount: null },
        { user_id: guest.id, amount: 40 },
      ],
    });

    await members.deleteGuest(trip.id, guest.id);

    expect(await amountsOf(item.id)).toEqual({ [owner.id]: 20, [other.id]: 20 });
    expect(await balanceCents(trip.id)).toBe(0);
  });

  it('GUEST-DEP-006: hands on whole won in a currency without decimals', async () => {
    const { owner, other, trip, guest } = await tripWithGuest();
    const item = await budget.createBudgetItem(trip.id, {
      name: 'Tteokbokki',
      currency: 'KRW',
      payers: [{ user_id: owner.id, amount: 30001 }],
      members: [
        { user_id: owner.id, amount: 10000 },
        { user_id: other.id, amount: 10000 },
        { user_id: guest.id, amount: 10001 },
      ],
    });

    await members.deleteGuest(trip.id, guest.id);

    const amounts = await amountsOf(item.id);
    expect([amounts[owner.id], amounts[other.id]].sort()).toEqual([15000, 15001]);
  });

  it('GUEST-DEP-007: takes the guest off the receipt and splits its lines again', async () => {
    const { owner, other, trip, guest } = await tripWithGuest();
    const ticket = JSON.stringify({
      items: [
        { name: 'Pizza', price: '30', parts: [owner.id, guest.id] },
        { name: 'Wine', price: '10', parts: [guest.id] },
        { name: 'Salad', price: '20', parts: [other.id] },
      ],
    });
    const item = await budget.createBudgetItem(trip.id, {
      name: 'Dinner',
      payers: [{ user_id: owner.id, amount: 60 }],
      ticket_json: ticket,
      members: [
        { user_id: owner.id, amount: 15 },
        { user_id: other.id, amount: 20 },
        { user_id: guest.id, amount: 25 },
      ],
    });

    await members.deleteGuest(trip.id, guest.id);

    // The pizza is the owner's alone now, and the wine nobody is ticked for any more
    // is carried by everyone left on the receipt, as the cost editor splits it.
    expect(await amountsOf(item.id)).toEqual({ [owner.id]: 35, [other.id]: 25 });
    const stored = JSON.parse((await itemRow(item.id)).ticket_json ?? '{}') as {
      items: { name: string; parts: number[] }[];
    };
    expect(stored.items.map((l) => l.parts)).toEqual([[owner.id], [], [other.id]]);
    expect(stored.items.map((l) => l.name)).toEqual(['Pizza', 'Wine', 'Salad']);
    expect(await balanceCents(trip.id)).toBe(0);
  });

  it('GUEST-DEP-008: hands the amount on as for a custom split when nobody else is on the receipt', async () => {
    const { owner, other, trip, guest } = await tripWithGuest();
    const item = await budget.createBudgetItem(trip.id, {
      name: 'Taxi',
      payers: [{ user_id: owner.id, amount: 30 }],
      ticket_json: JSON.stringify({ items: [{ name: 'Ride', price: '30', parts: [guest.id] }] }),
      members: [
        { user_id: owner.id, amount: 0 },
        { user_id: other.id, amount: 0 },
        { user_id: guest.id, amount: 30 },
      ],
    });

    await members.deleteGuest(trip.id, guest.id);

    expect(await amountsOf(item.id)).toEqual({ [owner.id]: 15, [other.id]: 15 });
    expect(await balanceCents(trip.id)).toBe(0);
  });

  it('GUEST-DEP-009: re-splits an equal share as before, without writing amounts', async () => {
    const { owner, other, trip, guest } = await tripWithGuest();
    const item = await budget.createBudgetItem(trip.id, {
      name: 'Bus',
      payers: [{ user_id: owner.id, amount: 120 }],
      member_ids: [owner.id, other.id, guest.id],
    });

    await members.deleteGuest(trip.id, guest.id);

    expect(await amountsOf(item.id)).toEqual({ [owner.id]: null, [other.id]: null });
    expect((await itemRow(item.id)).persons).toBe(2);
    expect(await balanceCents(trip.id)).toBe(0);
  });

  it('GUEST-DEP-010: clears a legacy paid_by_user_id instead of failing on its foreign key', async () => {
    const { owner, trip, guest } = await tripWithGuest();
    const item = await budget.createBudgetItem(trip.id, { name: 'Old', total_price: 10, member_ids: [owner.id] });
    await updateRows(orm(), BudgetItems, { id: item.id }, { paidByUser: guest.id });

    expect(await members.deleteGuest(trip.id, guest.id)).toBe(true);
    expect((await itemRow(item.id)).paid_by_user_id ?? null).toBeNull();
  });
});

describe('a deleted account hands its share on the same way', () => {
  it('GUEST-DEP-011: deleting a user keeps a custom split adding up', async () => {
    const { owner, other, trip } = await tripWithGuest();
    const item = await budget.createBudgetItem(trip.id, {
      name: 'Boat',
      payers: [{ user_id: owner.id, amount: 100 }],
      members: [
        { user_id: owner.id, amount: 70 },
        { user_id: other.id, amount: 30 },
      ],
    });

    await t.get(UserCleanupService).deleteUserCompletely(other.id);

    expect(await amountsOf(item.id)).toEqual({ [owner.id]: 100 });
    expect(await balanceCents(trip.id)).toBe(0);
  });
});
