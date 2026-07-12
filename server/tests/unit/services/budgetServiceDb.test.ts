/**
 * DB-backed unit tests for budgetService trip-scoping (BUDGET-SVC-DB-001+).
 * Uses a real in-memory SQLite DB so the SQL WHERE clauses are exercised.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: () => null,
    isOwner: () => false,
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip } from '../../helpers/factories';
import { createBudgetItem, updateMembers, toggleMemberPaid, calculateSettlement } from '../../../src/services/budgetService';

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
});

afterAll(() => {
  testDb.close();
});

function paidFlag(itemId: number, memberId: number): number | undefined {
  const row = testDb
    .prepare('SELECT paid FROM budget_item_members WHERE budget_item_id = ? AND user_id = ?')
    .get(itemId, memberId) as { paid: number } | undefined;
  return row?.paid;
}

describe('toggleMemberPaid trip-scoping', () => {
  it('BUDGET-SVC-DB-001: toggles paid for an item that belongs to the given trip', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Trip A' });
    const item = createBudgetItem(trip.id, { name: 'Hotel', total_price: 100 });
    updateMembers(item.id, trip.id, [user.id]);

    const member = toggleMemberPaid(item.id, trip.id, user.id, true);

    expect(member).not.toBeNull();
    expect(paidFlag(item.id, user.id)).toBe(1);
  });

  it('BUDGET-SVC-DB-002: refuses to toggle an item from a different trip (cross-trip IDOR)', () => {
    const { user } = createUser(testDb);
    const tripA = createTrip(testDb, user.id, { title: 'Trip A' });
    const tripB = createTrip(testDb, user.id, { title: 'Trip B' });
    const itemB = createBudgetItem(tripB.id, { name: 'Foreign expense', total_price: 50 });
    updateMembers(itemB.id, tripB.id, [user.id]);

    // Caller passes a trip they can access (A) but the item lives in trip B.
    const member = toggleMemberPaid(itemB.id, tripA.id, user.id, true);

    expect(member).toBeNull();
    expect(paidFlag(itemB.id, user.id)).toBe(0); // unchanged
  });
});

describe('calculateSettlement custom splits', () => {
  it('BUDGET-SVC-DB-003: settles by the custom per-member amounts, not the equal split (#1458)', () => {
    const { user: alice } = createUser(testDb, { username: 'alice' });
    const { user: bob } = createUser(testDb, { username: 'bob' });
    const trip = createTrip(testDb, alice.id, { title: 'Trip' });

    // 100 total, custom split: Alice owes 90, Bob owes 10. Alice paid the whole bill.
    createBudgetItem(trip.id, {
      name: 'Dinner',
      payers: [{ user_id: alice.id, amount: 100 }],
      members: [
        { user_id: alice.id, amount: 90 },
        { user_id: bob.id, amount: 10 },
      ],
    });

    const result = calculateSettlement(trip.id);

    // Alice paid 100 but owes 90 → net +10 (creditor); Bob owes 10 → net -10 (debtor).
    // With the equal-split bug both owe 50, so the flow would be 50 instead of 10.
    expect(result.flows).toEqual([
      expect.objectContaining({
        from: expect.objectContaining({ user_id: bob.id }),
        to: expect.objectContaining({ user_id: alice.id }),
        amount: 10,
      }),
    ]);
  });
});
