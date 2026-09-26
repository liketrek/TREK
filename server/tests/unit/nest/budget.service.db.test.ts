/**
 * DB-backed unit tests for BudgetService trip-scoping (BUDGET-SVC-DB-001+).
 * Uses a real in-memory SQLite DB so the SQL WHERE clauses are exercised.
 * BUDGET-SVC-DB-001 through 014 moved 1:1 from the legacy
 * tests/unit/services/budgetServiceDb.test.ts; 015–018 pinned the deleted
 * budget.bridge's delegation and now pin the same paths on the service;
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
    // The dollar's own quote, as Frankfurter prints it: rounded, so not the exact
    // inverse of the euro's 1.1429 (1 / 0.87497 = 1.142896...).
    USD: { USD: 1, EUR: 0.87497 },
  } as Record<string, Record<string, number>>,
}));
// Constructor-injected since the fold; the class is mocked at the module path
// so every separately-constructed instance sees the same deterministic rates
// as the SUT.
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
import { createUser, createTrip, addTripMember } from '../../helpers/factories';
import { BudgetService } from '../../../src/nest/budget/budget.service';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { ExchangeRatesService } from '../../../src/nest/budget/exchange-rates.service';
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
import { notificationsStub } from '../../helpers/notifications';

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
  new UserCleanupService(dbs(), budget),
  new PermissionsService(dbs()),
  new RealtimeService(),
  notificationsStub(),
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
    addTripMember(testDb, trip.id, bob.id);

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

describe('calculateSettlement squares up to the cent (#1382)', () => {
  it('BUDGET-SVC-DB-026: recording the offered flows clears the trip to exactly zero', () => {
    const { user: alice } = createUser(testDb, { username: 'alice' });
    const { user: bob } = createUser(testDb, { username: 'bob' });
    const { user: carol } = createUser(testDb, { username: 'carol' });
    const trip = createTrip(testDb, alice.id, { title: 'Trip' });
    addTripMember(testDb, trip.id, bob.id);
    addTripMember(testDb, trip.id, carol.id);
    const members = [{ user_id: alice.id }, { user_id: bob.id }, { user_id: carol.id }];

    // Totals that never divide by three, so every expense leaves a remainder cent
    // somewhere: 10.00, 100.01 and 0.01 (the smallest debt there is).
    budget.createBudgetItem(trip.id, { name: 'Coffee', payers: [{ user_id: alice.id, amount: 10 }], members });
    budget.createBudgetItem(trip.id, { name: 'Dinner', payers: [{ user_id: bob.id, amount: 100.01 }], members });
    budget.createBudgetItem(trip.id, { name: 'Stamp', payers: [{ user_id: carol.id, amount: 0.01 }], members });

    const before = budget.calculateSettlement(trip.id);
    expect(before.flows.length).toBeGreaterThan(0);
    for (const f of before.flows) {
      budget.insertSettlement(trip.id, { from_user_id: f.from.user_id, to_user_id: f.to.user_id, amount: f.amount }, f.from.user_id);
    }

    // Nothing left over, and nothing left to offer — the settle-up list and the
    // balances agree instead of the balances holding a cent nobody can pay.
    const after = budget.calculateSettlement(trip.id);
    expect(after.balances.map(b => b.balance)).toEqual([0, 0, 0]);
    expect(after.flows).toEqual([]);
  });

  it('BUDGET-SVC-DB-027: the balances hold still while the live rate moves under them', async () => {
    const { trip, me, danil, serega } = seedIssue1543Trip('RUB');

    // Nothing about the trip changes between the two reads; only the rate cache
    // turned over. That was enough to shuffle cents between people (#1382).
    const first = budget.calculateSettlement(trip.id, { base: 'RUB', tripCurrency: 'RUB', rates: RATES.RUB });
    const second = budget.calculateSettlement(trip.id, {
      base: 'RUB', tripCurrency: 'RUB',
      rates: { RUB: 1, USD: 0.013042 * 1.03, EUR: 0.011412 * 0.97 },
    });

    for (const uid of [me.id, danil.id, serega.id]) {
      expect(second.balances.find(b => b.user_id === uid)!.balance)
        .toBe(first.balances.find(b => b.user_id === uid)!.balance);
    }
  });
});

/** The exact trip from #1543: RUB base, three members, one expense booked in USD. */
function seedIssue1543Trip(tripCurrency: string) {
  const { user: me } = createUser(testDb, { username: 'me' });
  const { user: danil } = createUser(testDb, { username: 'danil' });
  const { user: serega } = createUser(testDb, { username: 'serega' });
  const trip = createTrip(testDb, me.id, { title: 'Trip' });
  addTripMember(testDb, trip.id, danil.id);
  addTripMember(testDb, trip.id, serega.id);
  testDb.prepare('UPDATE trips SET currency = ? WHERE id = ?').run(tripCurrency, trip.id);
  const members = [{ user_id: me.id }, { user_id: danil.id }, { user_id: serega.id }];

  // 9 000 ₽ nobody has paid yet (outstanding, settled by nobody, #2225), 9 000 ₽ paid
  // by me, and $100 paid by me. The USD row carries the rate frozen at entry time:
  // units of USD per 1 RUB.
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

    // What actually settles is 9 000 ₽ + $100 (≈7 668 ₽): the third expense is the
    // 9 000 ₽ nobody has paid, which is outstanding rather than owed (#2225). Each of
    // the three owes a third of that, and I am owed back everything I fronted beyond my
    // own share. The bug divided the RUB shares by the USD rate and reported +451 092 /
    // −230 080 / −230 012 instead. Tolerance is a rouble: the cent-rotation in
    // splitEqualShares moves the odd cent of the $100 between members, which the USD
    // rate magnifies ~77x.
    const settledSpend = 9000 + 100 / RATES.RUB.USD;
    const share = settledSpend / 3;
    expect(balanceOf(me.id)).toBeCloseTo(settledSpend - share, -1);
    expect(balanceOf(danil.id)).toBeCloseTo(-share, -1);
    expect(balanceOf(serega.id)).toBeCloseTo(-share, -1);
    // Nothing is left over: every rouble owed is a rouble somebody is owed.
    expect(result.balances.reduce((a, b) => a + Math.round(b.balance * 100), 0)).toBe(0);
  });

  it('BUDGET-SVC-DB-005: reports the same balances when the display currency differs from the trip currency', () => {
    const { trip, danil } = seedIssue1543Trip('RUB');

    // Same trip, viewed in EUR: every balance is the RUB one converted once, at the end.
    const inEur = budget.calculateSettlement(trip.id, { base: 'EUR', tripCurrency: 'RUB', rates: RATES.EUR });
    const danilEur = inEur.balances.find(b => b.user_id === danil.id)!.balance;

    const shareRub = (9000 + 100 / RATES.RUB.USD) / 3;
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
    addTripMember(testDb, trip.id, bob.id);
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

describe('composite service paths (ex budget.bridge delegation)', () => {
  // budget.bridge is deleted — UserCleanupService injects BudgetService now
  // that BudgetModule no longer imports AuthModule. 015-018 kept their IDs and
  // pin the same behavior directly on the service.
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

  it('BUDGET-SVC-DB-018b: an expense can be created against a place (#1298)', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const placeId = Number(testDb
      .prepare("INSERT INTO places (trip_id, name) VALUES (?, 'Louvre')")
      .run(trip.id).lastInsertRowid);

    const item = budget.createBudgetItem(trip.id, { name: 'Louvre tickets', total_price: 34, place_id: placeId });

    expect(item.place_id).toBe(placeId);
    expect(item.reservation_id).toBeNull();
    const row = testDb.prepare('SELECT place_id FROM budget_items WHERE id = ?').get(item.id) as { place_id: number | null };
    expect(row.place_id).toBe(placeId);
  });

  it('BUDGET-SVC-DB-018c: an expense without a link stores neither id', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const item = budget.createBudgetItem(trip.id, { name: 'Coffee', total_price: 3 });

    expect(item.place_id).toBeNull();
    expect(item.reservation_id).toBeNull();
  });
});

// A settlement names two parties and both columns are NOT NULL, so an id that is
// not on the trip cannot simply be dropped the way a split member can — the whole
// write is refused. Refusing also means the endpoint stops answering "does this
// user id exist", which it used to do by 500ing on the foreign key.
describe('settlement parties are confined to the trip', () => {
  it('BUDGET-SVC-DB-028: refuses a payer who is not on the trip', async () => {
    const { user: alice } = createUser(testDb, { username: 'alice' });
    const { user: outsider } = createUser(testDb, { username: 'outsider' });
    const trip = createTrip(testDb, alice.id);

    const created = await budget.createSettlement(trip.id, { from_user_id: outsider.id, to_user_id: alice.id, amount: 10 }, alice.id);

    expect(created).toBeNull();
    expect(budget.listSettlements(trip.id)).toEqual([]);
  });

  it('BUDGET-SVC-DB-029: answers a nonexistent user the same way, without throwing', async () => {
    const { user: alice } = createUser(testDb, { username: 'alice' });
    const trip = createTrip(testDb, alice.id);

    await expect(budget.createSettlement(trip.id, { from_user_id: 999999, to_user_id: alice.id, amount: 10 }, alice.id))
      .resolves.toBeNull();
  });

  it('BUDGET-SVC-DB-030: still records a settlement between the owner and a member', async () => {
    const { user: alice } = createUser(testDb, { username: 'alice' });
    const { user: bob } = createUser(testDb, { username: 'bob' });
    const trip = createTrip(testDb, alice.id);
    addTripMember(testDb, trip.id, bob.id);

    const created = await budget.createSettlement(trip.id, { from_user_id: bob.id, to_user_id: alice.id, amount: 10 }, alice.id);

    expect(created).toMatchObject({ from_user_id: bob.id, to_user_id: alice.id });
  });

  it('BUDGET-SVC-DB-031: drops an off-trip payer from an item instead of refusing it', () => {
    const { user: alice } = createUser(testDb, { username: 'alice' });
    const { user: outsider } = createUser(testDb, { username: 'outsider' });
    const trip = createTrip(testDb, alice.id);

    const item = budget.createBudgetItem(trip.id, {
      name: 'Dinner',
      payers: [{ user_id: alice.id, amount: 40 }, { user_id: outsider.id, amount: 60 }],
    }) as { payers: { user_id: number }[]; total_price: number };

    expect(item.payers.map(p => p.user_id)).toEqual([alice.id]);
    // total_price is the sum of the payers that actually landed.
    expect(item.total_price).toBe(40);
  });
});

// ── Refunds persist as negative expenses (#2176) ─────────────────────────────
// The write path used to filter payers on amount > 0 and re-derive total_price
// from the survivors, silently turning a negative entry into a 0 € one with no
// payer row.

describe('negative amounts persist end-to-end (#2176)', () => {
  it('BUDGET-SVC-DB-032: stores a negative payer row and the negative total', () => {
    const { user: alice } = createUser(testDb, { username: 'alice' });
    const trip = createTrip(testDb, alice.id);

    const item = budget.createBudgetItem(trip.id, {
      name: 'Hotel partial refund',
      total_price: -100,
      payers: [{ user_id: alice.id, amount: -100 }],
    }) as { id: number; payers: { user_id: number; amount: number }[]; total_price: number };

    expect(item.total_price).toBe(-100);
    expect(item.payers).toEqual([expect.objectContaining({ user_id: alice.id, amount: -100 })]);
    const row = testDb.prepare('SELECT total_price FROM budget_items WHERE id = ?').get(item.id) as { total_price: number };
    expect(row.total_price).toBe(-100);
  });

  it('BUDGET-SVC-DB-033: an update keeps a negative payer instead of nulling the entry', () => {
    const { user: alice } = createUser(testDb, { username: 'alice' });
    const { user: bob } = createUser(testDb, { username: 'bob' });
    const trip = createTrip(testDb, alice.id);
    addTripMember(testDb, trip.id, bob.id);
    const item = budget.createBudgetItem(trip.id, {
      name: 'Refund', total_price: -60, payers: [{ user_id: alice.id, amount: -60 }],
    }) as { id: number };

    const updated = budget.updateBudgetItem(item.id, trip.id, {
      payers: [{ user_id: alice.id, amount: -40 }, { user_id: bob.id, amount: -20 }],
    }) as { payers: { user_id: number; amount: number }[]; total_price: number };

    expect(updated.total_price).toBe(-60);
    expect(updated.payers).toHaveLength(2);
    expect(updated.payers.map(p => p.amount).sort((a, b) => a - b)).toEqual([-40, -20]);
  });

  it('BUDGET-SVC-DB-034: mixed-sign payers derive the netted total', () => {
    // Alice fronted 100 but bob pocketed a 30 refund on the same receipt.
    const { user: alice } = createUser(testDb, { username: 'alice' });
    const { user: bob } = createUser(testDb, { username: 'bob' });
    const trip = createTrip(testDb, alice.id);
    addTripMember(testDb, trip.id, bob.id);

    const item = budget.createBudgetItem(trip.id, {
      name: 'Tickets', payers: [{ user_id: alice.id, amount: 100 }, { user_id: bob.id, amount: -30 }],
    }) as { payers: { user_id: number }[]; total_price: number };

    expect(item.payers).toHaveLength(2);
    expect(item.total_price).toBe(70);
  });

  it('BUDGET-SVC-DB-035: a zero-amount payer is still dropped', () => {
    const { user: alice } = createUser(testDb, { username: 'alice' });
    const { user: bob } = createUser(testDb, { username: 'bob' });
    const trip = createTrip(testDb, alice.id);
    addTripMember(testDb, trip.id, bob.id);

    const item = budget.createBudgetItem(trip.id, {
      name: 'Dinner', payers: [{ user_id: alice.id, amount: 90 }, { user_id: bob.id, amount: 0 }],
    }) as { payers: { user_id: number }[]; total_price: number };

    expect(item.payers.map(p => p.user_id)).toEqual([alice.id]);
    expect(item.total_price).toBe(90);
  });

  it('BUDGET-SVC-DB-036: a negative expense settles against real rows — Σ balances = 0', () => {
    const { user: alice } = createUser(testDb, { username: 'alice' });
    const { user: bob } = createUser(testDb, { username: 'bob' });
    const trip = createTrip(testDb, alice.id);
    addTripMember(testDb, trip.id, bob.id);
    budget.createBudgetItem(trip.id, {
      name: 'Dinner', payers: [{ user_id: alice.id, amount: 90 }],
      member_ids: [alice.id, bob.id],
    });
    budget.createBudgetItem(trip.id, {
      name: 'Refund', payers: [{ user_id: alice.id, amount: -30 }],
      member_ids: [alice.id, bob.id],
    });

    const result = budget.calculateSettlement(trip.id);
    const balance = (uid: number) => result.balances.find(b => b.user_id === uid)!.balance;

    // 90 out, 30 back, both split evenly: bob nets 45 - 15 = 30 owed to alice.
    expect(balance(alice.id)).toBe(30);
    expect(balance(bob.id)).toBe(-30);
    expect(result.balances.reduce((a, b) => a + Math.round(b.balance * 100), 0)).toBe(0);
    expect(result.flows).toEqual([
      expect.objectContaining({ amount: 30, from: expect.objectContaining({ user_id: bob.id }), to: expect.objectContaining({ user_id: alice.id }) }),
    ]);
  });
});

describe('deleting an expense takes its price off the booking (#2233)', () => {
  it('BUDGET-SVC-DB-040: the mirrored price and currency are cleared, the rest of the metadata stays', () => {
    // The reservation update path keeps metadata.price across booking edits, so
    // the expense side has to remove it when the expense itself goes away.
    // Without this the card would show a price with nothing behind it, for good.
    const { user } = createUser(testDb, { username: 'owner' });
    const trip = createTrip(testDb, user.id, { title: 'Trip' });
    const res = testDb.prepare(
      "INSERT INTO reservations (trip_id, title, type, metadata) VALUES (?, 'Flight', 'flight', ?)",
    ).run(trip.id, JSON.stringify({ airline: 'CZ', seat: '12A', price: '2040', priceCurrency: 'CNY' }));
    const reservationId = Number(res.lastInsertRowid);

    const item = budget.createBudgetItem(trip.id, { name: 'Flight', total_price: 2040 });
    testDb.prepare('UPDATE budget_items SET reservation_id = ? WHERE id = ?').run(reservationId, item.id);

    expect(budget.deleteBudgetItem(item.id, trip.id)).toBe(true);

    const after = testDb.prepare('SELECT metadata FROM reservations WHERE id = ?').get(reservationId) as { metadata: string };
    expect(JSON.parse(after.metadata)).toEqual({ airline: 'CZ', seat: '12A' });
  });

  it('BUDGET-SVC-DB-041: an expense that was never linked to a booking deletes as before', () => {
    const { user } = createUser(testDb, { username: 'owner' });
    const trip = createTrip(testDb, user.id, { title: 'Trip' });
    const item = budget.createBudgetItem(trip.id, { name: 'Coffee', total_price: 4 });

    expect(budget.deleteBudgetItem(item.id, trip.id)).toBe(true);
    expect(testDb.prepare('SELECT id FROM budget_items WHERE id = ?').get(item.id)).toBeUndefined();
  });
});

describe('linking existing expenses to bookings and places (#2084)', () => {
  function tripWithBooking(metadata: Record<string, unknown> | null = null) {
    const { user } = createUser(testDb, { username: 'owner' });
    const trip = createTrip(testDb, user.id, { title: 'Trip' });
    const reservationId = insertReservation(trip.id, 'Flight', metadata);
    return { user, trip, reservationId };
  }

  function insertReservation(tripId: number, title: string, metadata: Record<string, unknown> | null = null): number {
    return Number(testDb
      .prepare("INSERT INTO reservations (trip_id, title, type, metadata) VALUES (?, ?, 'flight', ?)")
      .run(tripId, title, metadata ? JSON.stringify(metadata) : null).lastInsertRowid);
  }

  function insertPlace(tripId: number, name = 'Louvre'): number {
    return Number(testDb.prepare('INSERT INTO places (trip_id, name) VALUES (?, ?)').run(tripId, name).lastInsertRowid);
  }

  function metadataOf(reservationId: number): Record<string, unknown> | null {
    const row = testDb.prepare('SELECT metadata FROM reservations WHERE id = ?').get(reservationId) as { metadata: string | null };
    return row.metadata ? JSON.parse(row.metadata) : null;
  }

  function linksOf(itemId: number) {
    return testDb.prepare('SELECT reservation_id, place_id FROM budget_items WHERE id = ?').get(itemId) as {
      reservation_id: number | null; place_id: number | null;
    };
  }

  it('BUDGET-SVC-DB-044: an update links an existing expense, leaves the link alone when omitted, and null lets go of it', () => {
    const { trip, reservationId } = tripWithBooking();
    const placeId = insertPlace(trip.id);
    const item = budget.createBudgetItem(trip.id, { name: 'Tickets', total_price: 34 });

    const linked = budget.updateBudgetItem(item.id, trip.id, { reservation_id: reservationId, place_id: placeId });
    expect(linked).toMatchObject({ reservation_id: reservationId, place_id: placeId });
    expect(linksOf(item.id)).toEqual({ reservation_id: reservationId, place_id: placeId });

    // An edit that does not name the links keeps both.
    budget.updateBudgetItem(item.id, trip.id, { name: 'Museum tickets' });
    expect(linksOf(item.id)).toEqual({ reservation_id: reservationId, place_id: placeId });

    // null unlinks, one field at a time, and the expense itself stays.
    budget.updateBudgetItem(item.id, trip.id, { reservation_id: null });
    expect(linksOf(item.id)).toEqual({ reservation_id: null, place_id: placeId });
    budget.updateBudgetItem(item.id, trip.id, { place_id: null });
    expect(linksOf(item.id)).toEqual({ reservation_id: null, place_id: null });
    expect(testDb.prepare('SELECT name, total_price FROM budget_items WHERE id = ?').get(item.id)).toEqual({ name: 'Museum tickets', total_price: 34 });
  });

  it('BUDGET-SVC-DB-045: linkRefusal passes this trip\'s ids and names the foreign or missing one', () => {
    const { user, trip, reservationId } = tripWithBooking();
    const placeId = insertPlace(trip.id);
    const elsewhere = createTrip(testDb, user.id, { title: 'Elsewhere' });
    const foreignReservation = insertReservation(elsewhere.id, 'Other flight');
    const foreignPlace = insertPlace(elsewhere.id, 'Elsewhere');

    expect(budget.linkRefusal(trip.id, {})).toBeNull();
    expect(budget.linkRefusal(trip.id, { reservation_id: null, place_id: null })).toBeNull();
    expect(budget.linkRefusal(trip.id, { reservation_id: reservationId, place_id: placeId })).toBeNull();
    // The route param arrives as a string; the lookup still matches.
    expect(budget.linkRefusal(String(trip.id), { reservation_id: reservationId })).toBeNull();

    expect(budget.linkRefusal(trip.id, { reservation_id: foreignReservation })).toBe('reservation_id does not belong to this trip.');
    expect(budget.linkRefusal(trip.id, { place_id: foreignPlace })).toBe('place_id does not belong to this trip.');
    // An id that exists nowhere is refused the same way, never a foreign-key 500.
    expect(budget.linkRefusal(trip.id, { reservation_id: 999999 })).toBe('reservation_id does not belong to this trip.');
    expect(budget.linkRefusal(trip.id, { place_id: 999999 })).toBe('place_id does not belong to this trip.');
    // Both wrong: the booking is named first.
    expect(budget.linkRefusal(trip.id, { reservation_id: foreignReservation, place_id: foreignPlace }))
      .toBe('reservation_id does not belong to this trip.');
  });

  it('BUDGET-SVC-DB-046: the booking mirrors the sum of its expenses while they share one currency', () => {
    const { trip, reservationId } = tripWithBooking({ seat: '12A' });
    const first = budget.createBudgetItem(trip.id, { name: 'Fare', total_price: 10.1, currency: 'usd' });
    const second = budget.createBudgetItem(trip.id, { name: 'Luggage', total_price: 20.2, currency: 'usd' });
    // An expense on another booking of the same trip is not part of the sum.
    const other = insertReservation(trip.id, 'Return');
    const unrelated = budget.createBudgetItem(trip.id, { name: 'Return fare', total_price: 99, currency: 'usd' });
    testDb.prepare('UPDATE budget_items SET reservation_id = ? WHERE id IN (?, ?)').run(reservationId, first.id, second.id);
    testDb.prepare('UPDATE budget_items SET reservation_id = ? WHERE id = ?').run(other, unrelated.id);

    budget.resyncReservationPrice(trip.id, reservationId);

    // Cent-clean (10.1 + 20.2 is 30.299999... in floats), upper-cased currency,
    // and the rest of the metadata untouched.
    expect(metadataOf(reservationId)).toEqual({ seat: '12A', price: '30.3', priceCurrency: 'USD' });
  });

  it('BUDGET-SVC-DB-052: an expense without a currency and one in the trip currency by code add up', () => {
    // No currency means the trip's; the two rows are in the same money and the
    // booking shows their sum, not the first one alone.
    const { trip, reservationId } = tripWithBooking();
    testDb.prepare("UPDATE trips SET currency = 'EUR' WHERE id = ?").run(trip.id);
    const implicit = budget.createBudgetItem(trip.id, { name: 'Fare', total_price: 40 });
    const explicit = budget.createBudgetItem(trip.id, { name: 'Seat', total_price: 12, currency: 'eur' });
    testDb.prepare('UPDATE budget_items SET reservation_id = ? WHERE id IN (?, ?)').run(reservationId, implicit.id, explicit.id);

    budget.resyncReservationPrice(trip.id, reservationId);

    // Named by its code once one of them names it.
    expect(metadataOf(reservationId)).toEqual({ price: '52', priceCurrency: 'EUR' });
  });

  it('BUDGET-SVC-DB-053: a currency code is the same currency whatever its case', () => {
    const { trip, reservationId } = tripWithBooking();
    const lower = budget.createBudgetItem(trip.id, { name: 'Fare', total_price: 100, currency: 'usd' });
    const upper = budget.createBudgetItem(trip.id, { name: 'Seat', total_price: 25, currency: 'USD' });
    testDb.prepare('UPDATE budget_items SET reservation_id = ? WHERE id IN (?, ?)').run(reservationId, lower.id, upper.id);

    budget.resyncReservationPrice(trip.id, reservationId);

    expect(metadataOf(reservationId)).toEqual({ price: '125', priceCurrency: 'USD' });
  });

  it('BUDGET-SVC-DB-054: a first expense in the trip currency, beside a foreign one, is named by the trip code', () => {
    const { trip, reservationId } = tripWithBooking();
    testDb.prepare("UPDATE trips SET currency = 'eur' WHERE id = ?").run(trip.id);
    const implicit = budget.createBudgetItem(trip.id, { name: 'Fare', total_price: 100 });
    const foreign = budget.createBudgetItem(trip.id, { name: 'Seat', total_price: 20, currency: 'USD' });
    testDb.prepare('UPDATE budget_items SET reservation_id = ? WHERE id IN (?, ?)').run(reservationId, implicit.id, foreign.id);

    budget.resyncReservationPrice(trip.id, reservationId);
    // The currencies differ, so the first expense stands alone, and its implicit
    // currency is spelled out so the card does not read the figure as dollars.
    expect(metadataOf(reservationId)).toEqual({ price: '100', priceCurrency: 'EUR' });

    // A trip with no currency at all leaves nothing to spell out.
    testDb.prepare('UPDATE trips SET currency = NULL WHERE id = ?').run(trip.id);
    budget.resyncReservationPrice(trip.id, reservationId);
    expect(metadataOf(reservationId)).toEqual({ price: '100' });
  });

  it('BUDGET-SVC-DB-047: expenses in different currencies mirror the first one alone, in its currency', () => {
    const { trip, reservationId } = tripWithBooking();
    const first = budget.createBudgetItem(trip.id, { name: 'Fare', total_price: 120, currency: 'CHF' });
    const second = budget.createBudgetItem(trip.id, { name: 'Seat', total_price: 15, currency: 'EUR' });
    testDb.prepare('UPDATE budget_items SET reservation_id = ? WHERE id IN (?, ?)').run(reservationId, first.id, second.id);

    budget.resyncReservationPrice(trip.id, reservationId);

    expect(metadataOf(reservationId)).toEqual({ price: '120', priceCurrency: 'CHF' });
  });

  it('BUDGET-SVC-DB-048: expenses in the trip currency sum up and carry no currency of their own', () => {
    // An imported booking can carry a currency stamped by the importer; once the
    // mirror comes from expenses in the trip's own currency, that stamp goes.
    const { trip, reservationId } = tripWithBooking({ price: '5', priceCurrency: 'CNY' });
    const first = budget.createBudgetItem(trip.id, { name: 'Fare', total_price: 40 });
    const second = budget.createBudgetItem(trip.id, { name: 'Seat', total_price: 2.5 });
    testDb.prepare('UPDATE budget_items SET reservation_id = ? WHERE id IN (?, ?)').run(reservationId, first.id, second.id);

    budget.resyncReservationPrice(trip.id, reservationId);

    expect(metadataOf(reservationId)).toEqual({ price: '42.5' });
  });

  it('BUDGET-SVC-DB-049: a booking with nothing linked loses its price and currency, and nothing else', () => {
    const { trip, reservationId } = tripWithBooking({ seat: '12A', price: '30', priceCurrency: 'USD' });

    budget.resyncReservationPrice(trip.id, reservationId);
    expect(metadataOf(reservationId)).toEqual({ seat: '12A' });

    // A booking without a price, or without metadata at all, is not rewritten.
    const bare = insertReservation(trip.id, 'Bare');
    budget.resyncReservationPrice(trip.id, bare);
    expect(metadataOf(bare)).toBeNull();
  });

  it('BUDGET-SVC-DB-050: deleting one of two expenses leaves the booking with the other one\'s total', () => {
    const { trip, reservationId } = tripWithBooking({ price: '30' });
    const first = budget.createBudgetItem(trip.id, { name: 'Fare', total_price: 25 });
    const second = budget.createBudgetItem(trip.id, { name: 'Seat', total_price: 5 });
    testDb.prepare('UPDATE budget_items SET reservation_id = ? WHERE id IN (?, ?)').run(reservationId, first.id, second.id);

    expect(budget.deleteBudgetItem(first.id, trip.id)).toBe(true);
    // Before #2084 the price was dropped outright, though an expense still stood behind it.
    expect(metadataOf(reservationId)).toEqual({ price: '5' });

    expect(budget.deleteBudgetItem(second.id, trip.id)).toBe(true);
    expect(metadataOf(reservationId)).toEqual({});
  });

  it('BUDGET-SVC-DB-051: moving an expense to another booking moves its share of the price along', () => {
    const { trip, reservationId: from } = tripWithBooking();
    const to = insertReservation(trip.id, 'Return');
    const stays = budget.createBudgetItem(trip.id, { name: 'Fare', total_price: 100 });
    const moves = budget.createBudgetItem(trip.id, { name: 'Seat', total_price: 20 });
    testDb.prepare('UPDATE budget_items SET reservation_id = ? WHERE id IN (?, ?)').run(from, stays.id, moves.id);
    budget.resyncReservationPrice(trip.id, from);
    expect(metadataOf(from)).toEqual({ price: '120' });

    const before = budget.getBudgetItem(moves.id, trip.id)!;
    const data = { reservation_id: to };
    const updated = budget.updateBudgetItem(moves.id, trip.id, data)!;
    budget.resyncLinkedPrices(trip.id, before.reservation_id, updated, data);

    expect(metadataOf(from)).toEqual({ price: '100' });
    expect(metadataOf(to)).toEqual({ price: '20' });

    // And letting go of the link takes the price off the booking it left.
    const unlink = { reservation_id: null };
    const unlinked = budget.updateBudgetItem(moves.id, trip.id, unlink)!;
    budget.resyncLinkedPrices(trip.id, to, unlinked, unlink);
    expect(metadataOf(to)).toEqual({});
    expect(testDb.prepare('SELECT id FROM budget_items WHERE id = ?').get(moves.id)).toEqual({ id: moves.id });
  });

  it('BUDGET-SVC-DB-055: an edit that only changes the currency of a linked expense re-names the booking price', () => {
    const { trip, reservationId } = tripWithBooking();
    const item = budget.createBudgetItem(trip.id, { name: 'Fare', total_price: 80 });
    testDb.prepare('UPDATE budget_items SET reservation_id = ? WHERE id = ?').run(reservationId, item.id);
    budget.resyncReservationPrice(trip.id, reservationId);
    expect(metadataOf(reservationId)).toEqual({ price: '80' });

    // Shaped like the route body, which names neither the total nor the link here.
    type Body = { currency: string | null; total_price?: number; reservation_id?: number | null };
    const toChf: Body = { currency: 'chf' };
    budget.resyncLinkedPrices(trip.id, undefined, budget.updateBudgetItem(item.id, trip.id, toChf)!, toChf);
    expect(metadataOf(reservationId)).toEqual({ price: '80', priceCurrency: 'CHF' });

    const back: Body = { currency: null };
    budget.resyncLinkedPrices(trip.id, undefined, budget.updateBudgetItem(item.id, trip.id, back)!, back);
    expect(metadataOf(reservationId)).toEqual({ price: '80' });
  });
});

describe('an expense nobody paid stays out of the ledger (#2225)', () => {
  it('BUDGET-SVC-DB-037: an unpaid expense moves neither the balances nor the offered flows', () => {
    const { user: alice } = createUser(testDb, { username: 'alice' });
    const { user: bob } = createUser(testDb, { username: 'bob' });
    const { user: carol } = createUser(testDb, { username: 'carol' });
    const trip = createTrip(testDb, alice.id, { title: 'Trip' });
    addTripMember(testDb, trip.id, bob.id);
    addTripMember(testDb, trip.id, carol.id);

    budget.createBudgetItem(trip.id, {
      name: 'Dinner', payers: [{ user_id: alice.id, amount: 120 }],
      member_ids: [alice.id, bob.id, carol.id],
    });
    const before = budget.calculateSettlement(trip.id);

    // The row from the issue: a recorded total left on "No one paid yet", split
    // between the two people who were actually there.
    const unpaid = budget.createBudgetItem(trip.id, {
      name: 'Taxi', total_price: 161.57, payers: [], member_ids: [bob.id, carol.id],
    }) as { id: number; payers: unknown[]; total_price: number };
    expect(unpaid.payers).toEqual([]);
    expect(unpaid.total_price).toBe(161.57);

    // Re-saving it from the edit modal (payers cleared, total re-sent) must not
    // let writeItemPayers derive the total back down to 0.
    const resaved = budget.updateBudgetItem(unpaid.id, trip.id, {
      total_price: 161.57, payers: [], member_ids: [bob.id, carol.id],
    }) as { payers: unknown[]; total_price: number };
    expect(resaved.payers).toEqual([]);
    expect(resaved.total_price).toBe(161.57);
    const payerRows = testDb
      .prepare('SELECT count(*) AS cnt FROM budget_item_payers WHERE budget_item_id = ?')
      .get(unpaid.id) as { cnt: number };
    expect(payerRows.cnt).toBe(0);

    // 161.57 with no credit behind it used to push bob and carol 80.79/80.78 further
    // into the red and hand the whole of it to alice, who never fronted a rouble of it.
    const after = budget.calculateSettlement(trip.id);
    expect(after.balances).toEqual(before.balances);
    expect(after.flows).toEqual(before.flows);
    expect(after.balances.reduce((a, b) => a + Math.round(b.balance * 100), 0)).toBe(0);
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

  it('BUDGET-SVC-DB-042: a settle-up payment carries its own settled_at, independent of created_at', () => {
    const { user: alice } = createUser(testDb, { username: 'alice' });
    const { user: bob } = createUser(testDb, { username: 'bob' });
    const trip = createTrip(testDb, alice.id);

    const noDate = budget.insertSettlement(trip.id, { from_user_id: alice.id, to_user_id: bob.id, amount: 10 }, alice.id);
    expect(noDate!.settled_at).toBeNull();

    const dated = budget.insertSettlement(trip.id, { from_user_id: alice.id, to_user_id: bob.id, amount: 20, settled_at: '2026-01-05' }, alice.id);
    expect(dated!.settled_at).toBe('2026-01-05');
    expect(budget.getSettlement(dated!.id, trip.id)!.settled_at).toBe('2026-01-05');

    const moved = budget.applySettlementUpdate(dated!.id, trip.id, { from_user_id: alice.id, to_user_id: bob.id, amount: 20, settled_at: '2026-01-09' });
    expect(moved!.settled_at).toBe('2026-01-09');

    // An update that omits settled_at (undefined) leaves the stored day alone,
    // the same CASE WHEN pattern currency/exchange_rate already follow.
    const untouched = budget.applySettlementUpdate(dated!.id, trip.id, { from_user_id: alice.id, to_user_id: bob.id, amount: 25 });
    expect(untouched!.settled_at).toBe('2026-01-09');
  });

  it('BUDGET-SVC-DB-043: clearing settled_at stores NULL, whether it arrives as null or an empty string', () => {
    const { user: alice } = createUser(testDb, { username: 'alice' });
    const { user: bob } = createUser(testDb, { username: 'bob' });
    const trip = createTrip(testDb, alice.id);
    const parties = { from_user_id: alice.id, to_user_id: bob.id, amount: 20 };

    // The date picker's clear button sends '' and the contract allows null; both
    // mean "no day of its own", never a stored empty string.
    const blank = budget.insertSettlement(trip.id, { ...parties, settled_at: '' }, alice.id);
    expect(blank!.settled_at).toBeNull();

    const dated = budget.insertSettlement(trip.id, { ...parties, settled_at: '2026-01-05' }, alice.id);
    expect(budget.applySettlementUpdate(dated!.id, trip.id, { ...parties, settled_at: null })!.settled_at).toBeNull();

    budget.applySettlementUpdate(dated!.id, trip.id, { ...parties, settled_at: '2026-01-05' });
    expect(budget.applySettlementUpdate(dated!.id, trip.id, { ...parties, settled_at: '' })!.settled_at).toBeNull();
    const row = testDb.prepare('SELECT settled_at FROM budget_settlements WHERE id = ?').get(dated!.id) as { settled_at: string | null };
    expect(row.settled_at).toBeNull();
  });

  // ── Notes vs. itemized receipts (#1658) ────────────────────────────────────

  it('BUDGET-SVC-DB-021: a note and a receipt are stored in their own columns', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const item = budget.createBudgetItem(trip.id, {
      name: 'Groceries',
      total_price: 40,
      note: 'Lisa pays half of this back',
      ticket_json: '{"items":[{"name":"Bread","price":"3","parts":[1]}]}',
    });

    const row = testDb.prepare('SELECT note, ticket_json FROM budget_items WHERE id = ?').get(item!.id) as {
      note: string | null; ticket_json: string | null;
    };
    expect(row.note).toBe('Lisa pays half of this back');
    expect(JSON.parse(row.ticket_json!).items).toHaveLength(1);
  });

  it('BUDGET-SVC-DB-022: an update that omits note leaves the stored one alone', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = budget.createBudgetItem(trip.id, { name: 'Dinner', total_price: 20, note: 'split with Ben' });

    // What the mobile sheet sends: notes are written on desktop, so it never
    // speaks about the field.
    budget.updateBudgetItem(item!.id, trip.id, { total_price: 25 });

    const row = testDb.prepare('SELECT note FROM budget_items WHERE id = ?').get(item!.id) as { note: string | null };
    expect(row.note).toBe('split with Ben');
  });

  it('BUDGET-SVC-DB-023: an explicit null clears the note', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = budget.createBudgetItem(trip.id, { name: 'Taxi', total_price: 12, note: 'airport run' });

    budget.updateBudgetItem(item!.id, trip.id, { note: null });

    const row = testDb.prepare('SELECT note FROM budget_items WHERE id = ?').get(item!.id) as { note: string | null };
    expect(row.note).toBeNull();
  });

  it('BUDGET-SVC-DB-024: a pre-#1658 client sending the receipt as a note cannot erase the note', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = budget.createBudgetItem(trip.id, { name: 'Supermarket', total_price: 30, note: 'reimburse from the kitty' });

    // An old tab, still encoding the receipt into `note`.
    budget.updateBudgetItem(item!.id, trip.id, {
      note: 'TICKETJSON:{"items":[{"name":"Milk","price":"2","parts":[1]}]}',
    });

    const row = testDb.prepare('SELECT note, ticket_json FROM budget_items WHERE id = ?').get(item!.id) as {
      note: string | null; ticket_json: string | null;
    };
    expect(row.note).toBe('reimburse from the kitty');
    expect(JSON.parse(row.ticket_json!).items[0].name).toBe('Milk');
  });

  it('BUDGET-SVC-DB-025: the same legacy payload on create lands in the receipt column', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const item = budget.createBudgetItem(trip.id, {
      name: 'Market',
      total_price: 9,
      note: 'TICKETJSON:{"items":[{"name":"Cheese","price":"9","parts":[1]}]}',
    });

    const row = testDb.prepare('SELECT note, ticket_json FROM budget_items WHERE id = ?').get(item!.id) as {
      note: string | null; ticket_json: string | null;
    };
    expect(row.note).toBeNull();
    expect(JSON.parse(row.ticket_json!).items[0].name).toBe('Cheese');
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

/**
 * The total an uneven split writes back (#1964).
 *
 * The client splits in whole cents, which is right — 163.21 across two people
 * is 81.61 and 81.60. The server then discarded the total it was sent and
 * re-derived it by adding those two as doubles, which lands on
 * 163.20999999999998, and that is what went into the row.
 *
 * Everything that reaches Intl was fine, which is why it looked like a display
 * quirk in only some places. It was not: the stored number was wrong, and the
 * expense form showed it back the moment the item was reopened.
 */
describe('an expense whose split leaves a remainder', () => {
  const totalOf = (itemId: number) =>
    (testDb.prepare('SELECT total_price FROM budget_items WHERE id = ?').get(itemId) as { total_price: number }).total_price;

  it('stores the total the parts add up to, not the float they land on', () => {
    const { user: alice } = createUser(testDb);
    const { user: bob } = createUser(testDb);
    const trip = createTrip(testDb, alice.id);
    addTripMember(testDb, trip.id, bob.id);

    const item = budget.createBudgetItem(trip.id, {
      name: 'Flight',
      payers: [{ user_id: alice.id, amount: 81.61 }, { user_id: bob.id, amount: 81.60 }],
      members: [{ user_id: alice.id }, { user_id: bob.id }],
    });

    // The assertion that fails on the old code, with exactly the reported number.
    expect(totalOf(item.id)).toBe(163.21);
    expect(String(totalOf(item.id))).toBe('163.21');
  });

  it('does the same when the payers are replaced on an update', () => {
    const { user: alice } = createUser(testDb);
    const { user: bob } = createUser(testDb);
    const trip = createTrip(testDb, alice.id);
    addTripMember(testDb, trip.id, bob.id);

    const item = budget.createBudgetItem(trip.id, { name: 'Hotel', total_price: 10, members: [{ user_id: alice.id }] });
    budget.updateBudgetItem(item.id, trip.id, {
      payers: [{ user_id: alice.id, amount: 81.61 }, { user_id: bob.id, amount: 81.60 }],
    });

    expect(totalOf(item.id)).toBe(163.21);
  });

  /*
   * Three ways is the harder case: 100.00 becomes 33.34 + 33.33 + 33.33, and
   * two of those additions drift.
   */
  it('holds across a three-way split too', () => {
    const { user: alice } = createUser(testDb);
    const { user: bob } = createUser(testDb);
    const { user: carol } = createUser(testDb);
    const trip = createTrip(testDb, alice.id);
    addTripMember(testDb, trip.id, bob.id);
    addTripMember(testDb, trip.id, carol.id);

    const item = budget.createBudgetItem(trip.id, {
      name: 'Dinner',
      payers: [
        { user_id: alice.id, amount: 33.34 },
        { user_id: bob.id, amount: 33.33 },
        { user_id: carol.id, amount: 33.33 },
      ],
      members: [{ user_id: alice.id }, { user_id: bob.id }, { user_id: carol.id }],
    });

    expect(totalOf(item.id)).toBe(100);
  });

  it('leaves a total that needs no cleaning exactly as it was', () => {
    const { user: alice } = createUser(testDb);
    const { user: bob } = createUser(testDb);
    const trip = createTrip(testDb, alice.id);
    addTripMember(testDb, trip.id, bob.id);

    const item = budget.createBudgetItem(trip.id, {
      name: 'Taxi',
      payers: [{ user_id: alice.id, amount: 12.5 }, { user_id: bob.id, amount: 12.5 }],
      members: [{ user_id: alice.id }, { user_id: bob.id }],
    });

    expect(totalOf(item.id)).toBe(25);
  });

  it('attaches receipts created with receipt_file_ids and lists them', () => {
    const { user: alice } = createUser(testDb);
    const trip = createTrip(testDb, alice.id);

    // Insert a file for this trip
    const res = testDb.prepare('INSERT INTO trip_files (trip_id, filename, original_name, mime_type, file_size) VALUES (?, ?, ?, ?, ?)').run(
      trip.id, 'receipt-123.jpg', 'receipt.jpg', 'image/jpeg', 1024
    );
    const fileId = Number(res.lastInsertRowid);

    const item = budget.createBudgetItem(trip.id, {
      name: 'Restaurant with receipt',
      total_price: 45,
      receipt_file_ids: [fileId],
    });

    expect(item.receipts).toBeDefined();
    expect(item.receipts!.length).toBe(1);
    expect(item.receipts![0].id).toBe(fileId);
    expect(item.receipts![0].original_name).toBe('receipt.jpg');

    const listed = budget.listBudgetItems(trip.id);
    const found = listed.find(i => i.id === item.id);
    expect(found?.receipts?.length).toBe(1);
    expect(found?.receipts?.[0].id).toBe(fileId);
  });

  it('updates receipts on updateBudgetItem without deleting any file', () => {
    const { user: alice } = createUser(testDb);
    const trip = createTrip(testDb, alice.id);

    // File 1: will be removed and is orphan -> should be trashed
    const f1 = Number(testDb.prepare('INSERT INTO trip_files (trip_id, filename, original_name) VALUES (?, ?, ?)').run(trip.id, 'f1.jpg', 'f1.jpg').lastInsertRowid);
    // File 2: will be kept
    const f2 = Number(testDb.prepare('INSERT INTO trip_files (trip_id, filename, original_name) VALUES (?, ?, ?)').run(trip.id, 'f2.jpg', 'f2.jpg').lastInsertRowid);
    // File 3: will be added
    const f3 = Number(testDb.prepare('INSERT INTO trip_files (trip_id, filename, original_name) VALUES (?, ?, ?)').run(trip.id, 'f3.jpg', 'f3.jpg').lastInsertRowid);
    // File 4: will be removed but is shared with another budget item -> should NOT be trashed
    const f4 = Number(testDb.prepare('INSERT INTO trip_files (trip_id, filename, original_name) VALUES (?, ?, ?)').run(trip.id, 'f4.jpg', 'f4.jpg').lastInsertRowid);

    budget.createBudgetItem(trip.id, { name: 'Other', receipt_file_ids: [f4] });
    const item = budget.createBudgetItem(trip.id, { name: 'Dinner', receipt_file_ids: [f1, f2, f4] });

    // Update item: remove f1 and f4, keep f2, add f3
    const updated = budget.updateBudgetItem(item.id, trip.id, { receipt_file_ids: [f2, f3] });
    expect(updated?.receipts?.map(r => r.id).sort()).toEqual([f2, f3].sort());

    // Removing a receipt removes the link and nothing else. The file stays on
    // the trip: deleting it needs file_delete, which this path never checks.
    for (const fid of [f1, f2, f3, f4]) {
      const row = testDb.prepare('SELECT deleted_at FROM trip_files WHERE id = ?').get(fid) as { deleted_at: string | null };
      expect(row.deleted_at).toBeNull();
    }
    expect(testDb.prepare('SELECT COUNT(*) c FROM file_links WHERE budget_item_id = ?').get(item.id)).toEqual({ c: 2 });
    // f4 keeps the link it has to the other expense.
    expect(testDb.prepare('SELECT COUNT(*) c FROM file_links WHERE file_id = ?').get(f4)).toEqual({ c: 1 });
  });

  it('re-saving an expense whose receipt is also linked elsewhere twice does not 500', () => {
    // A file may carry one link row per place and one per booking, and the receipt
    // link is written onto a spare one of those. On the second save the row kept
    // from last time is skipped, so the next spare used to be adopted into a
    // second (file, item) pair — refused by the unique index, thrown inside the
    // transaction, and the whole expense edit rolled back. Every time, for good.
    const { user: alice } = createUser(testDb);
    const trip = createTrip(testDb, alice.id);
    const file = Number(testDb.prepare('INSERT INTO trip_files (trip_id, filename, original_name) VALUES (?, ?, ?)').run(trip.id, 'r.jpg', 'r.jpg').lastInsertRowid);
    const place = testDb.prepare('INSERT INTO places (trip_id, name) VALUES (?, ?)').run(trip.id, 'Osteria').lastInsertRowid;
    const reservation = testDb.prepare("INSERT INTO reservations (trip_id, title, type) VALUES (?, 'Table', 'restaurant')").run(trip.id).lastInsertRowid;
    testDb.prepare('INSERT INTO file_links (file_id, place_id) VALUES (?, ?)').run(file, place);
    testDb.prepare('INSERT INTO file_links (file_id, reservation_id) VALUES (?, ?)').run(file, reservation);

    const item = budget.createBudgetItem(trip.id, { name: 'Dinner', total_price: 40, receipt_file_ids: [file] });
    const again = budget.updateBudgetItem(item.id, trip.id, { total_price: 42, receipt_file_ids: [file] });

    expect(again?.total_price).toBe(42);
    expect(again?.receipts?.map(r => r.id)).toEqual([file]);
    expect(testDb.prepare('SELECT COUNT(*) c FROM file_links WHERE file_id = ? AND budget_item_id = ?').get(file, item.id)).toEqual({ c: 1 });
  });

  it('a receipt named twice in one save is linked once', () => {
    const { user: alice } = createUser(testDb);
    const trip = createTrip(testDb, alice.id);
    const file = Number(testDb.prepare('INSERT INTO trip_files (trip_id, filename, original_name) VALUES (?, ?, ?)').run(trip.id, 'dup.jpg', 'dup.jpg').lastInsertRowid);
    const item = budget.createBudgetItem(trip.id, { name: 'Taxi' });

    const updated = budget.updateBudgetItem(item.id, trip.id, { receipt_file_ids: [file, file] });

    expect(updated?.receipts?.map(r => r.id)).toEqual([file]);
  });

  it('unlinks receipts on deleteBudgetItem and leaves every file in place', () => {
    const { user: alice } = createUser(testDb);
    const trip = createTrip(testDb, alice.id);

    // File 1: orphan receipt
    const f1 = Number(testDb.prepare('INSERT INTO trip_files (trip_id, filename, original_name) VALUES (?, ?, ?)').run(trip.id, 'del1.jpg', 'del1.jpg').lastInsertRowid);
    // File 2: linked to a place directly
    const place = testDb.prepare('INSERT INTO places (trip_id, name) VALUES (?, ?)').run(trip.id, 'Hotel').lastInsertRowid;
    const f2 = Number(testDb.prepare('INSERT INTO trip_files (trip_id, filename, original_name, place_id) VALUES (?, ?, ?, ?)').run(trip.id, 'del2.jpg', 'del2.jpg', place).lastInsertRowid);

    const item = budget.createBudgetItem(trip.id, { name: 'Lunch', receipt_file_ids: [f1, f2] });
    const deleted = budget.deleteBudgetItem(item.id, trip.id);
    expect(deleted).toBe(true);

    // Neither file is touched; only the links to the deleted expense go.
    for (const fid of [f1, f2]) {
      const row = testDb.prepare('SELECT deleted_at FROM trip_files WHERE id = ?').get(fid) as { deleted_at: string | null };
      expect(row.deleted_at).toBeNull();
    }
    const linkRows = testDb.prepare('SELECT * FROM file_links WHERE budget_item_id = ?').all(item.id);
    expect(linkRows).toHaveLength(0);
  });

  it('unlinks receipts without ever trashing the file itself', () => {
    const { user: alice } = createUser(testDb);
    const trip = createTrip(testDb, alice.id);

    // budget_edit and file_delete are separate permissions and a receipt id is
    // any file on the trip, so the budget domain must never delete one.
    const plain = Number(testDb.prepare('INSERT INTO trip_files (trip_id, filename, original_name) VALUES (?, ?, ?)').run(trip.id, 'r.pdf', 'r.pdf').lastInsertRowid);
    const item = budget.createBudgetItem(trip.id, { name: 'Dinner', receipt_file_ids: [plain] });
    budget.deleteBudgetItem(item.id, trip.id);
    expect((testDb.prepare('SELECT deleted_at FROM trip_files WHERE id = ?').get(plain) as { deleted_at: string | null }).deleted_at).toBeNull();
    // The link is gone, because it was all the row carried.
    expect(testDb.prepare('SELECT COUNT(*) c FROM file_links WHERE file_id = ?').get(plain)).toEqual({ c: 0 });
  });

  it('keeps a place link on a row that also carried the receipt link', () => {
    const { user: alice } = createUser(testDb);
    const trip = createTrip(testDb, alice.id);
    const place = Number(testDb.prepare('INSERT INTO places (trip_id, name) VALUES (?, ?)').run(trip.id, 'Cafe').lastInsertRowid);
    const file = Number(testDb.prepare('INSERT INTO trip_files (trip_id, filename, original_name) VALUES (?, ?, ?)').run(trip.id, 'menu.pdf', 'menu.pdf').lastInsertRowid);
    testDb.prepare('INSERT INTO file_links (file_id, place_id) VALUES (?, ?)').run(file, place);

    const item = budget.createBudgetItem(trip.id, { name: 'Lunch', receipt_file_ids: [file] });
    budget.deleteBudgetItem(item.id, trip.id);

    const row = testDb.prepare('SELECT place_id, budget_item_id FROM file_links WHERE file_id = ?').get(file) as { place_id: number | null; budget_item_id: number | null };
    expect(row.place_id).toBe(place);
    expect(row.budget_item_id).toBeNull();
    expect((testDb.prepare('SELECT deleted_at FROM trip_files WHERE id = ?').get(file) as { deleted_at: string | null }).deleted_at).toBeNull();
  });

  it('leaves a receipt already in the trash linked, so restoring it comes back attached', () => {
    const { user: alice } = createUser(testDb);
    const trip = createTrip(testDb, alice.id);
    const file = Number(testDb.prepare('INSERT INTO trip_files (trip_id, filename, original_name) VALUES (?, ?, ?)').run(trip.id, 'old.pdf', 'old.pdf').lastInsertRowid);
    const item = budget.createBudgetItem(trip.id, { name: 'Taxi', receipt_file_ids: [file] });
    testDb.prepare('UPDATE trip_files SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?').run(file);

    // A save that no longer mentions the trashed receipt must not drop its link.
    budget.updateBudgetItem(item.id, trip.id, { receipt_file_ids: [] });
    expect(testDb.prepare('SELECT COUNT(*) c FROM file_links WHERE file_id = ? AND budget_item_id = ?').get(file, item.id)).toEqual({ c: 1 });
  });

  it('an edit that keeps a receipt does not churn its link row', () => {
    const { user: alice } = createUser(testDb);
    const trip = createTrip(testDb, alice.id);
    const file = Number(testDb.prepare('INSERT INTO trip_files (trip_id, filename, original_name) VALUES (?, ?, ?)').run(trip.id, 'keep.pdf', 'keep.pdf').lastInsertRowid);
    const item = budget.createBudgetItem(trip.id, { name: 'Hotel', receipt_file_ids: [file] });
    const before = testDb.prepare('SELECT id FROM file_links WHERE file_id = ? AND budget_item_id = ?').get(file, item.id) as { id: number };

    budget.updateBudgetItem(item.id, trip.id, { name: 'Hotel 2', receipt_file_ids: [file] });
    const after = testDb.prepare('SELECT id FROM file_links WHERE file_id = ? AND budget_item_id = ?').get(file, item.id) as { id: number };
    expect(after.id).toBe(before.id);
  });
});

// #2525: a bill entered in dollars on a euro trip was booked at the rate of the day. The
// totals the MCP summary, the budget prompt and the per-person resource hand out added its
// dollars to the euros as they stood and called the sum euros.
describe('trip totals read every row in the trip currency (#2525)', () => {
  function seedDollarBill() {
    const { user: me } = createUser(testDb);
    const { user: bob } = createUser(testDb);
    const trip = createTrip(testDb, me.id);
    addTripMember(testDb, trip.id, bob.id);
    const members = [{ user_id: me.id }, { user_id: bob.id }];
    const hotel = budget.createBudgetItem(trip.id, {
      name: 'Aparthotel Silver', category: 'accommodation', currency: 'USD', exchange_rate: 1.17,
      payers: [{ user_id: me.id, amount: 801.76 }], members,
    });
    budget.createBudgetItem(trip.id, {
      name: 'Dinner', category: 'food', currency: 'EUR',
      payers: [{ user_id: bob.id, amount: 100 }], members,
    });
    return { trip, me, bob, hotel };
  }

  it('BUDGET-SVC-DB-044: adds each row up at the rate it was booked at, in whole cents', async () => {
    const { trip } = seedDollarBill();
    // 801.76 USD at 1.17 is 685.26 EUR, the figure the settlement nets as well.
    expect(budget.tripTotals(trip.id, 'EUR')).toEqual({
      total: 785.26,
      byCategory: { accommodation: 685.26, food: 100 },
      unconverted: [],
    });
    // Both rows carry what they need, so nothing waits on today's rates.
    expect(await budget.ratesForTripTotals(trip.id, 'EUR')).toBeNull();
  });

  it('BUDGET-SVC-DB-045: fetches today\'s rate only for a row that never froze one', async () => {
    const { user: me } = createUser(testDb);
    const trip = createTrip(testDb, me.id);
    // Written before the freeze existed: the column default of 1 is not a booked rate.
    budget.createBudgetItem(trip.id, { name: 'Old taxi', category: 'transport', total_price: 114.29, currency: 'USD' });
    const rates = await budget.ratesForTripTotals(trip.id, 'EUR');
    expect(rates).toEqual(RATES.EUR);
    // 114.29 USD at 1.1429 per euro, the same way the settlement reads such a row.
    expect(budget.tripTotals(trip.id, 'EUR', rates).total).toBe(100);
  });

  it('BUDGET-SVC-DB-046: the per-person summary splits trip cents, not raw amounts', async () => {
    const { trip, me, bob, hotel } = seedDollarBill();
    budget.toggleMemberPaid(hotel.id, trip.id, bob.id, true);

    const summary = await budget.perPersonSummary(trip.id);
    const of = (id: number) => summary.find(s => s.user_id === id)!;
    // Half of 685.26 EUR plus half of 100 EUR each. The query this replaced put
    // 450.88 on both, half the dollars counted as euros, and never said which.
    expect(of(me.id)).toMatchObject({ total_assigned: 392.63, total_paid: 0, items_count: 2, currency: 'EUR' });
    expect(of(bob.id)).toMatchObject({ total_assigned: 392.63, total_paid: 342.63, items_count: 2, currency: 'EUR' });
  });

  it('BUDGET-SVC-DB-047: an equal split hands out the odd cent instead of a float tail', async () => {
    const { user: a } = createUser(testDb);
    const { user: b } = createUser(testDb);
    const { user: c } = createUser(testDb);
    const trip = createTrip(testDb, a.id);
    addTripMember(testDb, trip.id, b.id);
    addTripMember(testDb, trip.id, c.id);
    budget.createBudgetItem(trip.id, {
      name: 'Boat', currency: 'EUR', payers: [{ user_id: a.id, amount: 100 }],
      members: [{ user_id: a.id }, { user_id: b.id }, { user_id: c.id }],
    });

    const shares = (await budget.perPersonSummary(trip.id)).map(s => Math.round(s.total_assigned * 100));
    expect(shares.slice().sort((x, y) => x - y)).toEqual([3333, 3333, 3334]);
    expect(shares.reduce((x, y) => x + y, 0)).toBe(10000);
  });
});

// #2525: a euro trip read in dollars froze a dollar bill's rate from the euro's quote and
// converted the ledger back with the dollar's. The two quotes are not exact inverses, so a
// bill entered today read a few cents off and paying what settle-up offered left a balance.
describe('the settlement converts with the quote the entry rate was frozen from (#2525)', () => {
  function seedSameDayBill() {
    const { user: me } = createUser(testDb);
    const { user: bob } = createUser(testDb);
    const trip = createTrip(testDb, me.id);
    addTripMember(testDb, trip.id, bob.id);
    return { trip, me, bob };
  }

  it('BUDGET-SVC-DB-048: a same-day bill in the display currency reads as typed and settles to zero', async () => {
    const { trip, me, bob } = seedSameDayBill();
    // Frozen now, from the euro's quote: 1.1429.
    const bill = await budget.create(String(trip.id), {
      name: 'Villa', category: 'accommodation', currency: 'USD', total_price: 12345.67,
      payers: [{ user_id: me.id, amount: 12345.67 }], members: [{ user_id: me.id }, { user_id: bob.id }],
    }) as { id: number; exchange_rate: number };
    expect(bill.exchange_rate).toBe(1.1429);

    const before = await budget.settlement(trip.id, 'USD', 'EUR');
    const mine = before.finalBudgets.find(f => f.user_id === me.id)!;
    expect(mine.expenses).toBe(12345.67);
    expect(mine.sources.fronted).toEqual([{ item_id: bill.id, cents: 1234567 }]);
    expect(before.flows.map(f => f.amount)).toEqual([6172.84]);

    // Bob pays exactly what settle-up offers, in dollars, as the Costs screen records it.
    await budget.createSettlement(trip.id, { from_user_id: bob.id, to_user_id: me.id, amount: 6172.84, currency: 'USD' }, me.id);
    const after = await budget.settlement(trip.id, 'USD', 'EUR');
    expect(after.balances.map(b => b.balance)).toEqual([0, 0]);
    expect(after.flows).toEqual([]);
    expect((await budget.settlement(trip.id, 'EUR', 'EUR')).balances.map(b => b.balance)).toEqual([0, 0]);
  });

  it('BUDGET-SVC-DB-051: the final budget lists a bill at what was typed even where its trip cent rounds away', async () => {
    const { trip, me, bob } = seedSameDayBill();
    // 123.45 USD is 108.0147 EUR. As a whole trip cent, 108.01 EUR, it came back as 123.44.
    const bill = await budget.create(String(trip.id), {
      name: 'Taxi', currency: 'USD', total_price: 123.45,
      payers: [{ user_id: me.id, amount: 123.45 }], members: [{ user_id: me.id }, { user_id: bob.id }],
    }) as { id: number };
    const s = await budget.settlement(trip.id, 'USD', 'EUR');
    const mine = s.finalBudgets.find(f => f.user_id === me.id)!;
    const bobs = s.finalBudgets.find(f => f.user_id === bob.id)!;
    expect(mine.sources.fronted).toEqual([{ item_id: bill.id, cents: 12345 }]);
    expect(mine.expenses).toBe(123.45);
    // The two shares still add up to the bill, and the ledger in euros is untouched.
    expect(Math.round((mine.final + bobs.final) * 100)).toBe(12345);
    const inEur = await budget.settlement(trip.id, 'EUR', 'EUR');
    expect(inEur.finalBudgets.find(f => f.user_id === me.id)!.sources.fronted).toEqual([{ item_id: bill.id, cents: 10801 }]);
  });

  it('BUDGET-SVC-DB-049: a transfer saved without a currency reads back in the display currency as entered', async () => {
    const { trip, me, bob } = seedSameDayBill();
    await budget.createSettlement(trip.id, { from_user_id: bob.id, to_user_id: me.id, amount: 30 }, me.id);
    const s = await budget.settlement(trip.id, 'USD', 'EUR');
    const mine = s.finalBudgets.find(f => f.user_id === me.id)!;
    expect(mine.reimbursed).toBe(30);
    expect(s.balances.find(b => b.user_id === me.id)!.balance).toBe(-30);
  });

  it('BUDGET-SVC-DB-050: falls back to the display currency\'s quote when the trip\'s is unavailable', async () => {
    const { trip, me, bob } = seedSameDayBill();
    budget.createBudgetItem(trip.id, {
      name: 'Dinner', currency: 'EUR', payers: [{ user_id: me.id, amount: 100 }],
      members: [{ user_id: me.id }, { user_id: bob.id }],
    });
    const rates = (budget as unknown as { exchangeRates: ExchangeRatesService }).exchangeRates;
    const spy = vi.spyOn(rates, 'getRates').mockImplementation(async (base: string) => (base === 'EUR' ? null : RATES[base] ?? null));
    try {
      const s = await budget.settlement(trip.id, 'USD', 'EUR');
      expect(spy.mock.calls.map(c => c[0])).toEqual(['EUR', 'USD']);
      // 50 EUR at 1 / 0.87497 USD per euro.
      expect(s.balances.find(b => b.user_id === me.id)!.balance).toBe(57.14);
    } finally {
      spy.mockRestore();
    }
  });
});

// The VND/AUD report: the server reached no rates, so a VND bill was stored with the
// "not frozen" rate 1 and read as 8,920,000 AUD. RATES has no AUD quote, so every AUD
// trip below is that server; a rate can only come from what the caller lends.
describe('rows no rate can convert, and the rates that heal them', () => {
  const VND_FX = { base: 'AUD', rates: { VND: 18241.3 } };
  const rateOf = (table: 'budget_items' | 'budget_settlements', id: number) =>
    (testDb.prepare(`SELECT exchange_rate FROM ${table} WHERE id = ?`).get(id) as { exchange_rate: number }).exchange_rate;
  const exchangeRates = () => (budget as unknown as { exchangeRates: ExchangeRatesService }).exchangeRates;

  function seedAudTrip() {
    const { user: me } = createUser(testDb);
    const { user: bob } = createUser(testDb);
    const { user: carol } = createUser(testDb);
    const { user: dave } = createUser(testDb);
    const trip = createTrip(testDb, me.id);
    for (const u of [bob, carol, dave]) addTripMember(testDb, trip.id, u.id);
    testDb.prepare("UPDATE trips SET currency = 'AUD' WHERE id = ?").run(trip.id);
    const members = [me, bob, carol, dave].map(u => ({ user_id: u.id }));
    return { trip, me, bob, carol, members };
  }

  it('BUDGET-SVC-DB-056: freezes fallback_fx when getRates is null', async () => {
    const { trip, me, members } = seedAudTrip();
    const bill = await budget.create(String(trip.id), {
      name: 'Pho', currency: 'VND', payers: [{ user_id: me.id, amount: 8920000 }], members, fallback_fx: VND_FX,
    });
    expect(bill.exchange_rate).toBe(18241.3);
    const s = await budget.settlement(trip.id, 'AUD', 'AUD');
    expect(s.balances.find(b => b.user_id === me.id)!.balance).toBe(366.75);
  });

  it('BUDGET-SVC-DB-057: server quote wins', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const bill = await budget.create(String(trip.id), {
      name: 'Taxi', currency: 'USD', total_price: 20, fallback_fx: { base: 'EUR', rates: { USD: 2 } },
    });
    expect(bill.exchange_rate).toBe(RATES.EUR.USD);
  });

  it('BUDGET-SVC-DB-058: fallback_fx on another base is ignored', async () => {
    const { trip } = seedAudTrip();
    // Quoted against euros, the figure would freeze the bill against the wrong currency.
    const bill = await budget.create(String(trip.id), {
      name: 'Pho', currency: 'VND', total_price: 100000, fallback_fx: { base: 'EUR', rates: { VND: 27000 } },
    });
    expect(bill.exchange_rate).toBe(1);
  });

  it('BUDGET-SVC-DB-059: explicit exchange_rate wins, fallback_fx never reaches the row', async () => {
    const { trip } = seedAudTrip();
    const data = { name: 'Pho', currency: 'VND', total_price: 100000, exchange_rate: 18000, fallback_fx: VND_FX };
    const bill = await budget.create(String(trip.id), data);
    expect(bill.exchange_rate).toBe(18000);
    expect('fallback_fx' in data).toBe(false);
  });

  it('BUDGET-SVC-DB-060: currency change without any rate drops the old rate (items)', async () => {
    const { trip } = seedAudTrip();
    const item = budget.createBudgetItem(trip.id, { name: 'Taxi', currency: 'USD', exchange_rate: 0.65, total_price: 20 });
    // The update SQL keeps the stored rate when none is sent: a USD rate on a VND bill.
    expect(await budget.update(item.id, trip.id, { currency: 'VND' })).toMatchObject({ currency: 'VND', exchange_rate: 1 });
    // With a lent rate the new currency freezes instead.
    expect(await budget.update(item.id, trip.id, { currency: 'THB', fallback_fx: { base: 'AUD', rates: { THB: 23.5 } } }))
      .toMatchObject({ currency: 'THB', exchange_rate: 23.5 });
  });

  it('BUDGET-SVC-DB-061: same for settlements', async () => {
    const { trip, me, bob } = seedAudTrip();
    const transfer = await budget.createSettlement(trip.id, {
      from_user_id: bob.id, to_user_id: me.id, amount: 20, currency: 'USD', fallback_fx: { base: 'AUD', rates: { USD: 0.65 } },
    }, me.id);
    expect(transfer).toMatchObject({ currency: 'USD', exchange_rate: 0.65 });
    const moved = await budget.updateSettlement(transfer!.id, trip.id, { from_user_id: bob.id, to_user_id: me.id, amount: 20, currency: 'VND' });
    expect(moved).toMatchObject({ currency: 'VND', exchange_rate: 1 });
  });

  it('BUDGET-SVC-DB-062: unchanged currency never touches the rate', async () => {
    const { trip } = seedAudTrip();
    const frozen = budget.createBudgetItem(trip.id, { name: 'Pho', currency: 'VND', exchange_rate: 18241.3, total_price: 100000 });
    const open = budget.createBudgetItem(trip.id, { name: 'Bus', currency: 'VND', total_price: 50000 });
    const fx = { base: 'AUD', rates: { VND: 20000 } };
    expect(await budget.update(frozen.id, trip.id, { name: 'Pho bo', currency: 'vnd', fallback_fx: fx })).toMatchObject({ exchange_rate: 18241.3 });
    // Not even an unfrozen row: an edit is no place to heal, freeze-rates is.
    expect(await budget.update(open.id, trip.id, { name: 'Night bus', currency: 'VND', fallback_fx: fx })).toMatchObject({ exchange_rate: 1 });
  });

  it('BUDGET-SVC-DB-063: freezeMissingRates heals items and transfers from fallback_fx', async () => {
    const { trip, me, bob, carol, members } = seedAudTrip();
    const bill = budget.createBudgetItem(trip.id, { name: 'Pho', currency: 'VND', payers: [{ user_id: me.id, amount: 8920000 }], members });
    const transfer = budget.insertSettlement(trip.id, { from_user_id: bob.id, to_user_id: me.id, amount: 2229963, currency: 'VND' }, bob.id)!;
    // Carol pays in baht. The rows are healed currency by currency, THB before VND, so her
    // later transfer is written first and the answer still lists the rows by id.
    const bahtTransfer = budget.insertSettlement(trip.id, { from_user_id: carol.id, to_user_id: me.id, amount: 2872.88, currency: 'THB' }, carol.id)!;

    const before = await budget.settlement(trip.id, 'AUD', 'AUD');
    expect(before.unconverted).toEqual({ item_ids: [bill.id], settlement_ids: [bahtTransfer.id, transfer.id], currencies: ['THB', 'VND'] });
    expect(before.balances).toEqual([]);

    const healed = await budget.freezeMissingRates(trip.id, { base: 'AUD', rates: { VND: 18241.3, THB: 23.5 } });
    expect(healed!.items.map(i => [i.id, i.exchange_rate])).toEqual([[bill.id, 18241.3]]);
    expect(healed!.settlements.map(s => [s.id, s.exchange_rate])).toEqual([[transfer.id, 18241.3], [bahtTransfer.id, 23.5]]);
    expect(healed!.unresolved).toEqual([]);

    const after = await budget.settlement(trip.id, 'AUD', 'AUD');
    expect(after.unconverted).toEqual({ item_ids: [], settlement_ids: [], currencies: [] });
    // 489.00 AUD four ways. Bob's 2,229,963 VND and Carol's 2,872.88 THB (122.25 AUD
    // each) square their shares.
    expect(after.balances.find(b => b.user_id === me.id)!.balance).toBe(122.25);
    expect(after.balances.find(b => b.user_id === bob.id)!.balance).toBe(0);
    expect(after.balances.find(b => b.user_id === carol.id)!.balance).toBe(0);
    expect(after.balances.reduce((a, b) => a + Math.round(b.balance * 100), 0)).toBe(0);
  });

  it('BUDGET-SVC-DB-064: prefers the server quote, never touches frozen, trip-currency or NULL-currency rows', async () => {
    const { user: me } = createUser(testDb);
    const { user: bob } = createUser(testDb);
    const trip = createTrip(testDb, me.id);
    addTripMember(testDb, trip.id, bob.id);
    const row = (currency: string | null, exchange_rate?: number) =>
      budget.createBudgetItem(trip.id, { name: 'Row', currency, exchange_rate, total_price: 10 }).id;
    const usd = row('USD');
    const gbp = row('GBP');
    const xaf = row('XAF');
    const rub = row('RUB', 90);
    const eur = row('EUR');
    const implicit = row(null);
    const lower = row('usd');
    const usdTransfer = budget.insertSettlement(trip.id, { from_user_id: bob.id, to_user_id: me.id, amount: 5, currency: 'USD' }, bob.id)!;
    const plainTransfer = budget.insertSettlement(trip.id, { from_user_id: bob.id, to_user_id: me.id, amount: 5 }, bob.id)!;

    const healed = await budget.freezeMissingRates(trip.id, { base: 'EUR', rates: { USD: 2, GBP: 0.85 } });
    expect(healed!.items.map(i => i.id)).toEqual([usd, gbp, lower]);
    expect(healed!.settlements.map(s => s.id)).toEqual([usdTransfer.id]);
    expect(healed!.unresolved).toEqual(['XAF']);

    expect(rateOf('budget_items', usd)).toBe(RATES.EUR.USD);
    expect(rateOf('budget_items', lower)).toBe(RATES.EUR.USD);
    expect(rateOf('budget_items', gbp)).toBe(0.85);
    expect(rateOf('budget_items', xaf)).toBe(1);
    expect(rateOf('budget_items', rub)).toBe(90);
    expect(rateOf('budget_items', eur)).toBe(1);
    expect(rateOf('budget_items', implicit)).toBe(1);
    expect(rateOf('budget_settlements', usdTransfer.id)).toBe(RATES.EUR.USD);
    expect(rateOf('budget_settlements', plainTransfer.id)).toBe(1);
  });

  it('BUDGET-SVC-DB-065: second call heals nothing even with another quote', async () => {
    const { trip, me, members } = seedAudTrip();
    const bill = budget.createBudgetItem(trip.id, { name: 'Pho', currency: 'VND', payers: [{ user_id: me.id, amount: 8920000 }], members });
    await budget.freezeMissingRates(trip.id, VND_FX);
    expect(await budget.freezeMissingRates(trip.id, { base: 'AUD', rates: { VND: 25000 } }))
      .toEqual({ items: [], settlements: [], unresolved: [] });
    expect(rateOf('budget_items', bill.id)).toBe(18241.3);
  });

  it('BUDGET-SVC-DB-066: returns null and writes nothing when the trip currency changes during the fetch', async () => {
    const { trip, me, members } = seedAudTrip();
    const bill = budget.createBudgetItem(trip.id, { name: 'Pho', currency: 'VND', payers: [{ user_id: me.id, amount: 8920000 }], members });
    const spy = vi.spyOn(exchangeRates(), 'getRates').mockImplementation(async () => {
      // Someone switches the trip to euros while the rates are on their way.
      testDb.prepare("UPDATE trips SET currency = 'EUR' WHERE id = ?").run(trip.id);
      return null;
    });
    try {
      expect(await budget.freezeMissingRates(trip.id, VND_FX)).toBeNull();
      expect(rateOf('budget_items', bill.id)).toBe(1);
    } finally {
      spy.mockRestore();
    }
  });

  it('BUDGET-SVC-DB-067: returns without fetching when nothing is pending', async () => {
    const { trip, me, bob, members } = seedAudTrip();
    budget.createBudgetItem(trip.id, { name: 'Dinner', currency: 'AUD', payers: [{ user_id: me.id, amount: 80 }], members });
    budget.createBudgetItem(trip.id, { name: 'Implicit', total_price: 20, members });
    budget.createBudgetItem(trip.id, { name: 'Pho', currency: 'VND', exchange_rate: 18241.3, total_price: 100000, members });
    budget.insertSettlement(trip.id, { from_user_id: bob.id, to_user_id: me.id, amount: 5 }, bob.id);
    const spy = vi.spyOn(exchangeRates(), 'getRates');
    try {
      expect(await budget.freezeMissingRates(trip.id)).toEqual({ items: [], settlements: [], unresolved: [] });
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });

  it('BUDGET-SVC-DB-068: tripTotals and per-person leave the VND row out and tripTotals reports its id', async () => {
    const { trip, me, bob, members } = seedAudTrip();
    const bill = budget.createBudgetItem(trip.id, {
      name: 'Pho', category: 'food', currency: 'VND', payers: [{ user_id: me.id, amount: 8920000 }], members,
    });
    budget.createBudgetItem(trip.id, {
      name: 'Ferry', category: 'transport', currency: 'AUD', payers: [{ user_id: bob.id, amount: 40 }],
      members: [{ user_id: me.id }, { user_id: bob.id }],
    });
    const rates = await budget.ratesForTripTotals(trip.id, 'AUD');
    expect(rates).toBeNull();
    expect(budget.tripTotals(trip.id, 'AUD', rates)).toEqual({ total: 40, byCategory: { transport: 40 }, unconverted: [bill.id] });
    const summary = await budget.perPersonSummary(trip.id);
    expect(summary.map(s => [s.user_id, s.total_assigned, s.items_count])).toEqual([[me.id, 20, 1], [bob.id, 20, 1]]);
  });

  it('BUDGET-SVC-DB-069: settlement() passes baseRate only as display fallback (fetch order of 050 unchanged)', async () => {
    const { user: me } = createUser(testDb);
    const { user: bob } = createUser(testDb);
    const trip = createTrip(testDb, me.id);
    addTripMember(testDb, trip.id, bob.id);
    budget.createBudgetItem(trip.id, {
      name: 'Dinner', currency: 'EUR', payers: [{ user_id: me.id, amount: 100 }],
      members: [{ user_id: me.id }, { user_id: bob.id }],
    });
    const mine = (s: { balances: { user_id: number; balance: number }[] }) => s.balances.find(b => b.user_id === me.id)!.balance;

    // Neither quote: the caller's own figure labels the answer...
    let spy = vi.spyOn(exchangeRates(), 'getRates').mockResolvedValue(null);
    try {
      const s = await budget.settlement(trip.id, 'USD', 'EUR', 1.2);
      expect(spy.mock.calls.map(c => c[0])).toEqual(['EUR', 'USD']);
      expect(s.currency).toBe('USD');
      expect(mine(s)).toBe(60);
      // ...and without it the answer stays in euros and says so.
      const plain = await budget.settlement(trip.id, 'USD', 'EUR');
      expect(plain.currency).toBe('EUR');
      expect(mine(plain)).toBe(50);
    } finally {
      spy.mockRestore();
    }

    // With the display currency's quote (050's setup) it changes nothing.
    spy = vi.spyOn(exchangeRates(), 'getRates').mockImplementation(async (base: string) => (base === 'EUR' ? null : RATES[base] ?? null));
    try {
      const s = await budget.settlement(trip.id, 'USD', 'EUR', 2);
      expect(spy.mock.calls.map(c => c[0])).toEqual(['EUR', 'USD']);
      expect(s.currency).toBe('USD');
      expect(mine(s)).toBe(57.14);
    } finally {
      spy.mockRestore();
    }
  });
});
