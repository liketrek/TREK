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
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { resetTestDb } from '../../../helpers/test-db';
import { createBudgetItem, createPlace, createReservation, createTrip, createUser } from '../../../helpers/factories';
import { createTestBudgetItemsRepo } from '../../../helpers/files-repos';
import type { BudgetItemsRepository } from '../../../../src/db/repositories/BudgetItems.repository';

const testDb = createSnapshotTestDb();
let budgetItemsRepo: BudgetItemsRepository;

beforeAll(async () => {
  budgetItemsRepo = await createTestBudgetItemsRepo(testDb);
});
beforeEach(() => resetTestDb(testDb));
afterAll(() => testDb.close());

function legacyPublicForShare(tripId: number): unknown {
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
    testDb.prepare(`
      UPDATE budget_items SET persons = 2, days = 3, note = 'non-refundable', sort_order = 4,
        paid_by_user_id = ?, expense_date = '2026-09-02', reservation_id = ?, currency = 'EUR',
        exchange_rate = 0.92, ticket_json = '{"seat":"12A"}', place_id = ?
      WHERE id = ?`).run(user.id, reservation.id, place.id, withDetails.id);

    // Every nullable column left null — sorts first by category.
    const bare = createBudgetItem(testDb, trip.id, { name: 'Snacks', category: 'Food', total_price: 12.5 });
    testDb.prepare(`
      UPDATE budget_items SET persons = NULL, days = NULL, note = NULL, paid_by_user_id = NULL,
        expense_date = NULL, reservation_id = NULL, currency = NULL, place_id = NULL
      WHERE id = ?`).run(bare.id);

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
    expect((testDb.prepare('SELECT id FROM budget_items WHERE trip_id = ?').all(trip.id) as { id: number }[]).map((r) => r.id))
      .toEqual([kept.id]);
  });

  it('deleteByIds — an empty list deletes nothing', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const kept = createBudgetItem(testDb, trip.id);
    await budgetItemsRepo.deleteByIds([]);
    expect(testDb.prepare('SELECT id FROM budget_items WHERE id = ?').get(kept.id)).toEqual({ id: kept.id });
  });
});
