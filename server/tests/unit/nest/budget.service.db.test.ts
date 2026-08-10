/**
 * DB-backed unit tests for BudgetService trip-scoping (BUDGET-SVC-DB-001+).
 * Uses a real in-memory SQLite DB so the SQL WHERE clauses are exercised.
 * BUDGET-SVC-DB-001 through 014 moved 1:1 from the legacy
 * tests/unit/services/budgetServiceDb.test.ts; 015–018 pin the budget.bridge
 * delegation (the bridge instance runs over the same mocked db Proxy);
 * 019–020 pin the post-fold quirk fixes (COALESCE(display_name) on
 * settlements, transactional multi-statement writes).
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
vi.mock('../../../src/websocket', () => ({ broadcast: vi.fn() }));

// Frozen snapshot of the rates in play in #1543 (rates[X] = units of X per 1 base).
const { RATES } = vi.hoisted(() => ({
  RATES: {
    RUB: { RUB: 1, USD: 0.013042, EUR: 0.011412 },
    EUR: { EUR: 1, USD: 1.1429, RUB: 87.63 },
  } as Record<string, Record<string, number>>,
}));
// Constructor-injected since the fold; the class is mocked at the module path so
// the budget.bridge instance (which news up its own ExchangeRatesService) sees
// the same deterministic rates as the SUT.
vi.mock('../../../src/nest/budget/exchange-rates.service', () => ({
  ExchangeRatesService: class {
    async getRates(base: string) {
      return RATES[base.toUpperCase()] ?? null;
    }
  },
}));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip } from '../../helpers/factories';
import { BudgetService } from '../../../src/nest/budget/budget.service';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { ExchangeRatesService } from '../../../src/nest/budget/exchange-rates.service';
import * as bridge from '../../../src/nest/budget/budget.bridge';
import { UserCleanupService } from '../../../src/nest/auth/user-cleanup.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { TripMembersService } from '../../../src/nest/trip-members/trip-members.service';
import { TodoService } from '../../../src/nest/todo/todo.service';
import { PackingService } from '../../../src/nest/packing/packing.service';
import { FilesService } from '../../../src/nest/files/files.service';
import { ReservationsService } from '../../../src/nest/reservations/reservations.service';
import { DaysService } from '../../../src/nest/days/days.service';
import { CollabService } from '../../../src/nest/collab/collab.service';
import { VacayService } from '../../../src/nest/vacay/vacay.service';
import { QueryHelpersService } from '../../../src/nest/query-helpers/query-helpers.service';

const budget = new BudgetService(
  new DatabaseService(testDb),
  new PermissionsService(new DatabaseService(testDb)),
  new ExchangeRatesService(),
  new RealtimeService(),
);

// Guest fixtures come from TripMembersService since the trip split (they were on
// TripsService before, and on the deleted services/tripService before that);
// deleteGuest routes through the SAME BudgetService domain SQL
// (removeUserFromBudgetItems) under test.
const dbs = () => new DatabaseService(testDb);
const membersSvc = new TripMembersService(
  dbs(),
  budget,
  new UserCleanupService(dbs()),
  new PermissionsService(dbs()),
  new RealtimeService(),
);
const createGuest = membersSvc.createGuest.bind(membersSvc);
const deleteGuest = membersSvc.deleteGuest.bind(membersSvc);

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

describe('deleting a member re-splits their expenses (#1553)', () => {
  function personsOf(itemId: number): number | null {
    return (testDb.prepare('SELECT persons FROM budget_items WHERE id = ?').get(itemId) as { persons: number | null }).persons;
  }
  function memberCount(itemId: number): number {
    return (testDb.prepare('SELECT COUNT(*) AS count FROM budget_item_members WHERE budget_item_id = ?')
      .get(itemId) as { count: number }).count;
  }

  it('BUDGET-SVC-DB-010: re-derives the persons divisor when a guest in the split is deleted', () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const guests = ['G1', 'G2', 'G3'].map(n => createGuest(trip.id, n, owner.id).member);
    const item = budget.createBudgetItem(trip.id, {
      name: 'Dinner', total_price: 400,
      member_ids: [owner.id, ...guests.map(g => g.id)],
    });
    expect(personsOf(item.id)).toBe(4);

    deleteGuest(trip.id, guests[0].id);
    deleteGuest(trip.id, guests[1].id);

    // The member rows cascade with the users row; `persons` is denormalized and has to
    // be re-derived, or the per-person column keeps dividing by the departed.
    expect(memberCount(item.id)).toBe(2);
    expect(personsOf(item.id)).toBe(2);
  });

  it('BUDGET-SVC-DB-011: leaves a manually entered persons count alone', () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const guest = createGuest(trip.id, 'G1', owner.id).member;
    // No member rows — `persons` is just a number someone typed.
    const item = budget.createBudgetItem(trip.id, { name: 'Rental', total_price: 300, persons: 6 });

    deleteGuest(trip.id, guest.id);

    expect(personsOf(item.id)).toBe(6);
  });

  it('BUDGET-SVC-DB-012: drops the last member to a null divisor rather than zero', () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const guest = createGuest(trip.id, 'G1', owner.id).member;
    const item = budget.createBudgetItem(trip.id, { name: 'Taxi', total_price: 50, member_ids: [guest.id] });

    deleteGuest(trip.id, guest.id);

    expect(memberCount(item.id)).toBe(0);
    expect(personsOf(item.id)).toBeNull();
  });

  it('BUDGET-SVC-DB-013: saves a split from a stale client instead of failing on the users FK', () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const guest = createGuest(trip.id, 'G1', owner.id).member;
    const item = budget.createBudgetItem(trip.id, { name: 'Dinner', total_price: 200, member_ids: [owner.id, guest.id] });

    deleteGuest(trip.id, guest.id);

    // A client that loaded before the deletion still sends the guest back (#1553).
    const updated = budget.updateBudgetItem(item.id, trip.id, { member_ids: [owner.id, guest.id] });

    expect(updated!.members.map(m => m.user_id)).toEqual([owner.id]);
    expect(personsOf(item.id)).toBe(1);
  });

  it('BUDGET-SVC-DB-014: ignores a deleted member arriving through updateMembers', () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const guest = createGuest(trip.id, 'G1', owner.id).member;
    const item = budget.createBudgetItem(trip.id, { name: 'Drinks', total_price: 60, member_ids: [owner.id, guest.id] });

    deleteGuest(trip.id, guest.id);
    const result = budget.updateMembers(item.id, trip.id, [owner.id, guest.id]);

    expect(result!.members.map(m => m.user_id)).toEqual([owner.id]);
    expect(personsOf(item.id)).toBe(1);
  });
});

describe('toggleMemberPaid trip-scoping', () => {
  it('BUDGET-SVC-DB-001: toggles paid for an item that belongs to the given trip', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Trip A' });
    const item = budget.createBudgetItem(trip.id, { name: 'Hotel', total_price: 100 });
    budget.updateMembers(item.id, trip.id, [user.id]);

    const member = budget.toggleMemberPaid(item.id, trip.id, user.id, true);

    expect(member).not.toBeNull();
    expect(paidFlag(item.id, user.id)).toBe(1);
  });

  it('BUDGET-SVC-DB-002: refuses to toggle an item from a different trip (cross-trip IDOR)', () => {
    const { user } = createUser(testDb);
    const tripA = createTrip(testDb, user.id, { title: 'Trip A' });
    const tripB = createTrip(testDb, user.id, { title: 'Trip B' });
    const itemB = budget.createBudgetItem(tripB.id, { name: 'Foreign expense', total_price: 50 });
    budget.updateMembers(itemB.id, tripB.id, [user.id]);

    // Caller passes a trip they can access (A) but the item lives in trip B.
    const member = budget.toggleMemberPaid(itemB.id, tripA.id, user.id, true);

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
    budget.createBudgetItem(trip.id, {
      name: 'Dinner',
      payers: [{ user_id: alice.id, amount: 100 }],
      members: [
        { user_id: alice.id, amount: 90 },
        { user_id: bob.id, amount: 10 },
      ],
    });

    const result = budget.calculateSettlement(trip.id);

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

/** The exact trip from #1543: RUB base, three members, one expense booked in USD. */
function seedIssue1543Trip(tripCurrency: string) {
  const { user: me } = createUser(testDb, { username: 'me' });
  const { user: danil } = createUser(testDb, { username: 'danil' });
  const { user: serega } = createUser(testDb, { username: 'serega' });
  const trip = createTrip(testDb, me.id, { title: 'Trip' });
  testDb.prepare('UPDATE trips SET currency = ? WHERE id = ?').run(tripCurrency, trip.id);
  const members = [{ user_id: me.id }, { user_id: danil.id }, { user_id: serega.id }];

  // 9 000 ₽ nobody has paid yet, 9 000 ₽ paid by me, and $100 paid by me. The USD row
  // carries the rate frozen at entry time: units of USD per 1 RUB.
  budget.createBudgetItem(trip.id, { name: 'Проезд обратно', total_price: 9000, currency: 'RUB', members });
  budget.createBudgetItem(trip.id, { name: 'Проезд туда', currency: 'RUB', payers: [{ user_id: me.id, amount: 9000 }], members });
  budget.createBudgetItem(trip.id, {
    name: 'test', currency: 'USD', exchange_rate: 0.013042,
    payers: [{ user_id: me.id, amount: 100 }], members,
  });
  return { trip, me, danil, serega };
}

describe('calculateSettlement with a foreign-currency expense (#1543)', () => {
  it('BUDGET-SVC-DB-004: nets in the trip currency instead of inflating the foreign share ~27x', () => {
    const { trip, me, danil, serega } = seedIssue1543Trip('RUB');

    const result = budget.calculateSettlement(trip.id, { base: 'RUB', tripCurrency: 'RUB', rates: RATES.RUB });
    const balanceOf = (id: number) => result.balances.find(b => b.user_id === id)!.balance;

    // Total spend is 9 000 + 9 000 + $100 (≈7 668 ₽), so each of the three owes a third
    // of it and I am owed back everything I fronted beyond my own share. The bug divided
    // the RUB shares by the USD rate and reported +451 092 / −230 080 / −230 012 instead.
    // Tolerance is a rouble: the cent-rotation in splitEqualShares moves the odd cent of
    // the $100 between members, which the USD rate magnifies ~77x.
    const totalSpend = 18000 + 100 / RATES.RUB.USD;
    const share = totalSpend / 3;
    expect(balanceOf(me.id)).toBeCloseTo(9000 + 100 / RATES.RUB.USD - share, -1);
    expect(balanceOf(danil.id)).toBeCloseTo(-share, -1);
    expect(balanceOf(serega.id)).toBeCloseTo(-share, -1);
    // The 9 000 ₽ expense nobody paid is the only imbalance in the trip.
    expect(result.balances.reduce((a, b) => a + b.balance, 0)).toBeCloseTo(-9000, 1);
  });

  it('BUDGET-SVC-DB-005: reports the same balances when the display currency differs from the trip currency', () => {
    const { trip, danil } = seedIssue1543Trip('RUB');

    // Same trip, viewed in EUR: every balance is the RUB one converted once, at the end.
    const inEur = budget.calculateSettlement(trip.id, { base: 'EUR', tripCurrency: 'RUB', rates: RATES.EUR });
    const danilEur = inEur.balances.find(b => b.user_id === danil.id)!.balance;

    const shareRub = (18000 + 100 / RATES.RUB.USD) / 3;
    expect(danilEur).toBeCloseTo(-shareRub / RATES.EUR.RUB, 0);
  });
});

describe('rebaseTripCurrency', () => {
  const itemRow = (id: number) =>
    testDb.prepare('SELECT currency, exchange_rate FROM budget_items WHERE id = ?')
      .get(id) as { currency: string | null; exchange_rate: number };

  it('BUDGET-SVC-DB-006: pins currency-less expenses to the outgoing currency and re-freezes the rest', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Trip' });
    testDb.prepare("UPDATE trips SET currency = 'EUR' WHERE id = ?").run(trip.id);
    const members = [{ user_id: user.id }];

    // An expense that inherits the trip's base (currency NULL), one booked in USD, and
    // one already in the incoming currency.
    const implicit = budget.createBudgetItem(trip.id, { name: 'Implicit', total_price: 100, members }) as { id: number };
    const usd = budget.createBudgetItem(trip.id, { name: 'USD', total_price: 100, currency: 'USD', exchange_rate: 1.1429, members }) as { id: number };
    const rub = budget.createBudgetItem(trip.id, { name: 'RUB', total_price: 9000, currency: 'RUB', exchange_rate: 87.63, members }) as { id: number };

    await budget.rebaseTripCurrency(trip.id, 'RUB');

    // The implicit row really held euros, so it is stamped EUR rather than silently
    // becoming 100 ₽, and every rate is re-anchored to the new base.
    expect(itemRow(implicit.id)).toEqual({ currency: 'EUR', exchange_rate: RATES.RUB.EUR });
    expect(itemRow(usd.id)).toEqual({ currency: 'USD', exchange_rate: RATES.RUB.USD });
    // Already in the trip's new currency → no conversion left to freeze.
    expect(itemRow(rub.id)).toEqual({ currency: 'RUB', exchange_rate: 1 });
  });

  it('BUDGET-SVC-DB-007: keeps every balance at the same real-world value across the switch', async () => {
    const { user: alice } = createUser(testDb, { username: 'alice' });
    const { user: bob } = createUser(testDb, { username: 'bob' });
    const trip = createTrip(testDb, alice.id, { title: 'Trip' });
    testDb.prepare("UPDATE trips SET currency = 'EUR' WHERE id = ?").run(trip.id);
    const members = [{ user_id: alice.id }, { user_id: bob.id }];

    budget.createBudgetItem(trip.id, { name: 'Hotel', payers: [{ user_id: alice.id, amount: 100 }], members });
    budget.createBudgetItem(trip.id, { name: 'Dinner', currency: 'USD', exchange_rate: 1.1429, payers: [{ user_id: bob.id, amount: 60 }], members });

    const before = budget.calculateSettlement(trip.id, { base: 'EUR', tripCurrency: 'EUR', rates: RATES.EUR });

    await budget.rebaseTripCurrency(trip.id, 'RUB');
    testDb.prepare("UPDATE trips SET currency = 'RUB' WHERE id = ?").run(trip.id);

    const after = budget.calculateSettlement(trip.id, { base: 'RUB', tripCurrency: 'RUB', rates: RATES.RUB });

    for (const b of before.balances) {
      const rub = after.balances.find(x => x.user_id === b.user_id)!.balance;
      expect(rub).toBeCloseTo(b.balance * 87.63, 0); // same money, different unit
    }
  });

  it('BUDGET-SVC-DB-009: pins currency-less place prices to the outgoing currency', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Trip' });
    testDb.prepare("UPDATE trips SET currency = 'EUR' WHERE id = ?").run(trip.id);

    const priced = (price: number | null, currency: string | null) => {
      const r = testDb.prepare('INSERT INTO places (trip_id, name, price, currency) VALUES (?, ?, ?, ?)')
        .run(trip.id, 'Place', price, currency);
      return Number(r.lastInsertRowid);
    };
    // A place that inherits the trip's base (currency NULL), one priced in its own
    // currency, and one with no price at all.
    const implicit = priced(15, null);
    const jpy = priced(1500, 'JPY');
    const free = priced(null, null);

    await budget.rebaseTripCurrency(trip.id, 'JPY');

    const placeRow = (id: number) =>
      testDb.prepare('SELECT price, currency FROM places WHERE id = ?')
        .get(id) as { price: number | null; currency: string | null };

    // The implicit place really held euros, so it is stamped EUR rather than silently
    // becoming ¥15 — the amount the user typed is never rewritten.
    expect(placeRow(implicit)).toEqual({ price: 15, currency: 'EUR' });
    expect(placeRow(jpy)).toEqual({ price: 1500, currency: 'JPY' });
    // Nothing to denominate without a price: leave it inheriting the trip's currency.
    expect(placeRow(free)).toEqual({ price: null, currency: null });
  });

  it('BUDGET-SVC-DB-008: is a no-op when the currency is unchanged', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Trip' });
    testDb.prepare("UPDATE trips SET currency = 'EUR' WHERE id = ?").run(trip.id);
    const item = budget.createBudgetItem(trip.id, { name: 'Implicit', total_price: 100, members: [{ user_id: user.id }] }) as { id: number };

    await budget.rebaseTripCurrency(trip.id, 'EUR');

    expect(itemRow(item.id)).toEqual({ currency: null, exchange_rate: 1 });
  });
});

describe('budget.bridge delegation', () => {
  // Every bridge export except removeUserFromBudgetItems has been pruned as its
  // last outside-container consumer migrated (legacy tripService, the trips MCP
  // registrar, services/userCleanupService, and the create_transport registrar,
  // which moved into reservations.mcp.ts). 015-018 pin the same behavior on the
  // service.
  it('BUDGET-SVC-DB-015: listBudgetItems returns the hydrated list', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = budget.createBudgetItem(trip.id, { name: 'Hotel', total_price: 100, member_ids: [user.id] });

    const items = budget.listBudgetItems(trip.id);

    expect(items.map(i => i.id)).toEqual([item.id]);
    expect(items[0].members.map(m => m.user_id)).toEqual([user.id]);
  });

  it('BUDGET-SVC-DB-016: removeUserFromBudgetItems re-derives persons', () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb, { username: 'other' });
    const trip = createTrip(testDb, owner.id);
    const item = budget.createBudgetItem(trip.id, { name: 'Dinner', total_price: 80, member_ids: [owner.id, other.id] });

    budget.removeUserFromBudgetItems(other.id);

    const row = testDb.prepare('SELECT persons FROM budget_items WHERE id = ?').get(item.id) as { persons: number | null };
    expect(row.persons).toBe(1);
  });

  it('BUDGET-SVC-DB-017: rebaseTripCurrency pins the implicit currency', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    testDb.prepare("UPDATE trips SET currency = 'EUR' WHERE id = ?").run(trip.id);
    const item = budget.createBudgetItem(trip.id, { name: 'Implicit', total_price: 100, members: [{ user_id: user.id }] });

    await budget.rebaseTripCurrency(trip.id, 'RUB');

    const row = testDb.prepare('SELECT currency, exchange_rate FROM budget_items WHERE id = ?').get(item.id) as { currency: string | null; exchange_rate: number };
    expect(row).toEqual({ currency: 'EUR', exchange_rate: RATES.RUB.EUR });
  });

  it('BUDGET-SVC-DB-018: linkBudgetItemToReservation stamps the reservation id', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const reservationId = Number(testDb
      .prepare("INSERT INTO reservations (trip_id, title, type) VALUES (?, 'Flight', 'flight')")
      .run(trip.id).lastInsertRowid);

    const item = budget.linkBudgetItemToReservation(trip.id, reservationId, { name: 'Flight', total_price: 200 });

    expect(item.reservation_id).toBe(reservationId);
    const row = testDb.prepare('SELECT reservation_id FROM budget_items WHERE id = ?').get(item.id) as { reservation_id: number | null };
    expect(row.reservation_id).toBe(reservationId);
  });
});

describe('post-fold quirk fixes', () => {
  it('BUDGET-SVC-DB-019: settlements prefer display_name over username (quirk fix)', () => {
    const { user: alice } = createUser(testDb, { username: 'alice' });
    const { user: bob } = createUser(testDb, { username: 'bob' });
    testDb.prepare('UPDATE users SET display_name = ? WHERE id = ?').run('Alice Displayed', alice.id);
    const trip = createTrip(testDb, alice.id);

    const created = budget.insertSettlement(trip.id, { from_user_id: alice.id, to_user_id: bob.id, amount: 10 }, alice.id);

    expect(created!.from_username).toBe('Alice Displayed');
    expect(created!.to_username).toBe('bob');
    expect(budget.listSettlements(trip.id)[0].from_username).toBe('Alice Displayed');
  });

  it('BUDGET-SVC-DB-020: a failing item insert rolls back the category-order side write (quirk fix)', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    // NOT NULL violation on name fires after the category-order upsert — the
    // legacy non-transactional create leaked the budget_category_order row.
    expect(() => budget.createBudgetItem(trip.id, { name: null as unknown as string, category: 'atomic-test' })).toThrow();

    const cat = testDb.prepare("SELECT 1 FROM budget_category_order WHERE trip_id = ? AND category = 'atomic-test'").get(trip.id);
    expect(cat).toBeUndefined();
  });
});
