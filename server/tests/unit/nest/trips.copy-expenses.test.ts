/**
 * TripsService.copy and the expenses of people the copy does not have (#2604).
 * TRIP-SVC-094, moved out of trips.service.test.ts.
 *
 * Real in-memory SQLite over the container: the service comes out of
 * TripsModule, and the rows are seeded and read through the ORM factories.
 */
import { AssignmentParticipants } from '../../../src/db/entities/AssignmentParticipants.entity';
import { BudgetItemMembers } from '../../../src/db/entities/BudgetItemMembers.entity';
import { BudgetItemPayers } from '../../../src/db/entities/BudgetItemPayers.entity';
import { BudgetItems } from '../../../src/db/entities/BudgetItems.entity';
import { DayAssignments } from '../../../src/db/entities/DayAssignments.entity';
import { BudgetService } from '../../../src/nest/budget/budget.service';
import { TripsModule } from '../../../src/nest/trips/trips.module';
import { TripsService } from '../../../src/nest/trips/trips.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makeDayAssignment } from '../../helpers/factories/itinerary';
import { makePlace } from '../../helpers/factories/places';
import { countRows, findRows, insertRow } from '../../helpers/factories/rows';
import { addTripMember, makeTrip, readTripDays } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM, type EntityClass, type FilterQuery } from '@mikro-orm/core';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let svc: TripsService;
let budget: BudgetService;
const orm = () => t.get(MikroORM);

beforeAll(async () => {
  t = await createTestModule({ db, imports: [TripsModule] });
  svc = t.get(TripsService);
  budget = t.get(BudgetService);
});

afterAll(async () => {
  await t.close();
  db.close();
});

/** Only `cols` of the stored rows matching `where`, the way a SELECT of those columns returns them. */
async function storedColumns<T extends object>(
  entity: EntityClass<T>,
  where: FilterQuery<T>,
  cols: string[],
): Promise<Array<Record<string, unknown>>> {
  const rows = (await findRows(orm(), entity, where)) as Array<Record<string, unknown>>;
  return rows.map((row) => Object.fromEntries(cols.map((col) => [col, row[col]])));
}

describe('copy: expenses shared with people who are not on the copy (#2604)', () => {
  /**
   * #2604: the copy has nobody on it but the copier, yet it used to take every
   * payer and split row along. Balances in the copy then named people who could
   * not see it, and the first save of such an expense dropped them and shrank
   * its total. An expense anyone else pays for or shares now comes across as a
   * planning entry with its total; one that is the copier's alone keeps it all.
   */
  it('TRIP-SVC-094: copy keeps nobody outside the copy on its expenses and keeps every total (#2604)', async () => {
    const { user: owner } = await makeUser(orm());
    const { user: friend } = await makeUser(orm());
    const trip = await makeTrip(orm(), owner.id, {
      title: 'Shared costs',
      start_date: '2025-07-01',
      end_date: '2025-07-01',
    });
    await addTripMember(orm(), trip.id, friend.id);
    const days = await readTripDays(orm(), trip.id);
    const place = await makePlace(orm(), trip.id, { name: 'Harbour' });
    const assignment = await makeDayAssignment(orm(), days[0].id, place.id);
    await insertRow(orm(), AssignmentParticipants, { assignment: assignment.id, user: owner.id });
    await insertRow(orm(), AssignmentParticipants, { assignment: assignment.id, user: friend.id });

    const solo = Number(
      await insertRow(orm(), BudgetItems, {
        trip: trip.id,
        category: 'Food',
        name: 'Solo lunch',
        total_price: 50,
        persons: 1,
        paidByUser: owner.id,
      }),
    );
    await insertRow(orm(), BudgetItemMembers, { budgetItem: solo, user: owner.id, paid: 1, amount: null });
    await insertRow(orm(), BudgetItemPayers, { budgetItem: solo, user: owner.id, amount: 50 });

    const shared = Number(
      await insertRow(orm(), BudgetItems, {
        trip: trip.id,
        category: 'Transport',
        name: 'Rental car',
        total_price: 180,
        persons: 2,
        paidByUser: friend.id,
        ticket_json: JSON.stringify({ items: [{ name: 'Car', price: '180', parts: [owner.id, friend.id] }] }),
      }),
    );
    await insertRow(orm(), BudgetItemMembers, { budgetItem: shared, user: owner.id, paid: 0, amount: null });
    await insertRow(orm(), BudgetItemMembers, { budgetItem: shared, user: friend.id, paid: 1, amount: null });
    await insertRow(orm(), BudgetItemPayers, { budgetItem: shared, user: owner.id, amount: 120 });
    await insertRow(orm(), BudgetItemPayers, { budgetItem: shared, user: friend.id, amount: 60 });

    // Paid by the friend alone, with a typed head count and no split rows.
    const theirs = Number(
      await insertRow(orm(), BudgetItems, {
        trip: trip.id,
        category: 'Food',
        name: 'Seafood dinner',
        total_price: 90,
        persons: 4,
      }),
    );
    await insertRow(orm(), BudgetItemPayers, { budgetItem: theirs, user: friend.id, amount: 90 });

    const newTripId = await svc.copy(trip.id, owner.id, 'Shared costs copy');

    const copied = await findRows(orm(), BudgetItems, { trip: newTripId }, { name: 'asc' });
    const byName = (name: string) => {
      const row = copied.find((c) => c.name === name);
      if (!row) throw new Error(`no copied expense named ${name}`);
      return row;
    };
    expect(copied.map((c) => [c.name, c.total_price])).toEqual([
      ['Rental car', 180],
      ['Seafood dinner', 90],
      ['Solo lunch', 50],
    ]);

    // The copier's own expense is copied whole.
    const soloCopy = byName('Solo lunch').id;
    expect(byName('Solo lunch')).toMatchObject({ persons: 1, paid_by_user_id: owner.id });
    expect(await storedColumns(BudgetItemMembers, { budgetItem: soloCopy }, ['user_id', 'paid'])).toEqual([
      { user_id: owner.id, paid: 1 },
    ]);
    expect(await storedColumns(BudgetItemPayers, { budgetItem: soloCopy }, ['user_id', 'amount'])).toEqual([
      { user_id: owner.id, amount: 50 },
    ]);

    // A shared one keeps its total as a planning entry: nobody pays, nobody owes.
    expect(byName('Rental car')).toMatchObject({ persons: null, paid_by_user_id: null, ticket_json: null });
    expect(await countRows(orm(), BudgetItemMembers, { budgetItem: byName('Rental car').id })).toBe(0);
    expect(await countRows(orm(), BudgetItemPayers, { budgetItem: byName('Rental car').id })).toBe(0);
    expect(byName('Seafood dinner')).toMatchObject({ persons: 4, paid_by_user_id: null });
    expect(await countRows(orm(), BudgetItemPayers, { budgetItem: byName('Seafood dinner').id })).toBe(0);

    // Nothing in the copy points at the friend, and its ledger squares.
    const [newDay] = await readTripDays(orm(), newTripId);
    const [newAssignment] = await findRows(orm(), DayAssignments, { day: newDay.id });
    expect(await storedColumns(AssignmentParticipants, { assignment: newAssignment.id }, ['user_id'])).toEqual([
      { user_id: owner.id },
    ]);
    const settlement = await budget.calculateSettlement(newTripId);
    expect(settlement.balances.map((b) => b.user_id)).not.toContain(friend.id);
    expect(Math.round(settlement.balances.reduce((a, b) => a + b.balance, 0) * 100)).toBe(0);

    // The source keeps every row.
    expect(await countRows(orm(), BudgetItemPayers, { budgetItem: shared })).toBe(2);
    expect(await countRows(orm(), BudgetItemMembers, { budgetItem: shared })).toBe(2);
    expect(await countRows(orm(), AssignmentParticipants, { assignment: assignment.id })).toBe(2);
  });
});
