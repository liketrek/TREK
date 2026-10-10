/**
 * Plan 4 Task 8b-4a (3h L4) — full-key `toEqual(<legacy raw>)` parity for
 * `BudgetItemsRepository.listPublicForShare` (`share.service.ts:391` SH14),
 * flagged by the 3h ledger as having no repository-level parity test. The
 * legacy statement (`BudgetItems.repository.ts`'s own docstring): `SELECT *
 * FROM budget_items WHERE trip_id = ? ORDER BY category ASC` — unlike BG72's
 * `listAllForTrip`, unfiltered by visibility (there is no per-item privacy
 * model on budget items the way packing has) but WITH an `ORDER BY` that
 * `listAllForTrip` lacks.
 */
import { BudgetItems } from '../../../../src/db/entities/BudgetItems.entity';
import type { BudgetItemsRepository } from '../../../../src/db/repositories/BudgetItems.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createBudgetItem, createPlace, createReservation, createTrip, createUser } from '../../../helpers/factories';
import { findRow, findRows, updateRows } from '../../../helpers/factories/rows';
import { createTestBudgetItemsRepo } from '../../../helpers/files-repos';
import { resetTestDb } from '../../../helpers/test-db';
import type { TestOrm } from '../../../helpers/test-orm';
import { sharedTestOrm } from '../../../helpers/test-uow';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let budgetItemsRepo: BudgetItemsRepository;
let orm: TestOrm;

beforeAll(async () => {
  budgetItemsRepo = await createTestBudgetItemsRepo(testDb);
  orm = await sharedTestOrm(testDb);
});
beforeEach(() => resetTestDb(testDb));
afterAll(() => testDb.close());

function legacyPublicForShare(tripId: number): unknown {
  // test-sql-allow: the raw SELECT is the legacy oracle this parity test holds the repository to.
  return testDb.prepare('SELECT * FROM budget_items WHERE trip_id = ? ORDER BY category ASC').all(tripId);
}

describe('BudgetItemsRepository — share.service.ts SH14 read', () => {
  it('listPublicForShare — matches the legacy statement, ordered by category, every nullable column both null and set', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    const reservation = createReservation(testDb, trip.id);

    // Every nullable column set — sorts second by category.
    const withDetails = createBudgetItem(testDb, trip.id, { name: 'Hotel', category: 'Lodging', total_price: 250 });
    await updateRows(
      orm,
      BudgetItems,
      { id: withDetails.id },
      {
        persons: 2,
        days: 3,
        note: 'non-refundable',
        sort_order: 4,
        paidByUser: user.id,
        expense_date: '2026-09-02',
        reservation: reservation.id,
        currency: 'EUR',
        exchange_rate: 0.92,
        ticket_json: '{"seat":"12A"}',
        place: place.id,
      },
    );

    // Every nullable column left null — sorts first by category.
    const bare = createBudgetItem(testDb, trip.id, { name: 'Snacks', category: 'Food', total_price: 12.5 });
    await updateRows(
      orm,
      BudgetItems,
      { id: bare.id },
      {
        persons: null,
        days: null,
        note: null,
        paidByUser: null,
        expense_date: null,
        reservation: null,
        currency: null,
        place: null,
      },
    );

    // A budget item on a different trip must never leak in.
    createBudgetItem(testDb, other.id, { category: 'Other' });

    const legacy = legacyPublicForShare(trip.id);
    const typed = await budgetItemsRepo.listPublicForShare(trip.id);
    expect(typed).toEqual(legacy);
    expect(typed.map((r) => r.id)).toEqual([bare.id, withDetails.id]);
  });

  it('listPublicForShare — [] for a trip with no budget items', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await budgetItemsRepo.listPublicForShare(trip.id)).toEqual([]);
  });
});

describe('BudgetItemsRepository — reservations.service.ts RS49 delete', () => {
  it('deleteByIds — removes exactly the listed rows, as legacy `DELETE ... WHERE id IN (...)` does', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const first = createBudgetItem(testDb, trip.id, { name: 'Flight' });
    const second = createBudgetItem(testDb, trip.id, { name: 'Seat' });
    const kept = createBudgetItem(testDb, trip.id, { name: 'Hotel' });

    await budgetItemsRepo.deleteByIds([first.id, second.id]);
    expect((await findRows(orm, BudgetItems, { trip: trip.id })).map((r) => r.id)).toEqual([kept.id]);
  });

  it('deleteByIds — an empty list deletes nothing', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const kept = createBudgetItem(testDb, trip.id);
    await budgetItemsRepo.deleteByIds([]);
    expect(await findRow(orm, BudgetItems, { id: kept.id })).toMatchObject({ id: kept.id });
  });
});
