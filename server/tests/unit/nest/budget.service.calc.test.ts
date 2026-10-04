/**
 * Settlement-math and FX-freeze unit tests for BudgetService over a real
 * in-memory SQLite DB (Plan 4 Task 8b-3, off the prepare-stub bridge this
 * suite used to run on). Moved 1:1 from the legacy
 * tests/unit/services/budgetService.test.ts (same cases, incl. the
 * #1335/#1445/#1426 pins); the SUT is the folded BudgetService with a
 * constructor-injected ExchangeRatesService stub (the only remaining mock —
 * FX rates are an external call, not DB state) and repositories built by
 * `budgetRepoArgs` over the suite's own better-sqlite3 handle (the same
 * `createSnapshotTestDb()` + async `vi.mock` idiom as every other converted
 * `tests/unit/nest/*.test.ts`), and the raw settlement update is exercised
 * as applySettlementUpdate (the no-freeze write the REST updateSettlement
 * wraps).
 *
 * ~50 of these cases hard-code literal ids (alice=1, bob=2, carol=3,
 * dave=4; item/settlement ids 1-3) in their assertions, which a `createUser`/
 * `createTrip` factory autoincrement can't reproduce test-to-test (ids keep
 * growing across a file — `resetTestDb`'s own docstring). `setupDb` below
 * inserts every row with those literal ids directly instead, matching what
 * the old `mockDb.db.prepare` stub used to hand back — clearing its own
 * tables first so a test that reconfigures the fixture mid-test (one does)
 * stays safe to call twice.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});
vi.mock('../../../src/websocket', () => ({ broadcast: vi.fn() }));

import { db as testDb } from '../../../src/db/database';
import { resetTestDb } from '../../helpers/test-db';
import { BudgetService } from '../../../src/nest/budget/budget.service';
import type { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import type { ExchangeRatesService } from '../../../src/nest/budget/exchange-rates.service';
import type { BudgetItem, BudgetItemMember, BudgetItemPayer } from '../../../src/types';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { createTestUnitOfWork } from '../../helpers/test-uow';
import { budgetRepoArgs } from '../../helpers/budget-repos';

const mockRates = { getRates: vi.fn() };

const permissionsStub = { checkPermission: vi.fn(() => true) } as unknown as PermissionsService;

let budget: BudgetService;

beforeAll(async () => {
  budget = new BudgetService(
    permissionsStub,
    mockRates as unknown as ExchangeRatesService,
    new RealtimeService(),
    await createTestUnitOfWork(testDb),
    ...(await budgetRepoArgs(testDb)),
  );
});

afterAll(() => {
  testDb.close();
});

// ── Helpers ──────────────────────────────────────────────────────────────────
// Who actually paid is recorded as explicit payers (budget_item_payers); members
// are only the equal-split participants.

function makeItem(id: number, total_price: number, trip_id = 1): BudgetItem {
  return { id, trip_id, name: `Item ${id}`, total_price, category: 'other' } as BudgetItem;
}

function makeMember(budget_item_id: number, user_id: number, username: string): BudgetItemMember & { budget_item_id: number } {
  return { budget_item_id, user_id, paid: 0, username, avatar: null } as BudgetItemMember & { budget_item_id: number };
}

function makePayer(budget_item_id: number, user_id: number, amount: number, username: string): BudgetItemPayer & { budget_item_id: number } {
  return { budget_item_id, user_id, amount, username, avatar: null } as BudgetItemPayer & { budget_item_id: number };
}

// A raw budget_settlements row as listSettlements reads it (joined usernames/avatars).
function makeSettlementRow(
  id: number, from_user_id: number, to_user_id: number, amount: number,
  currency: string | null = null, exchange_rate = 1,
) {
  return {
    id, trip_id: 1, from_user_id, to_user_id, amount, currency, exchange_rate,
    created_at: '2026-01-01', created_by_user_id: from_user_id,
    from_username: `u${from_user_id}`, from_avatar: null,
    to_username: `u${to_user_id}`, to_avatar: null,
  };
}

/**
 * Add money the way the ledger does — in whole cents. Summing the returned
 * two-decimal figures with `+` reintroduces exactly the binary dust the fix is
 * about, so an "adds up to zero" assertion has to count cents to mean anything.
 */
const centSum = (values: number[]) => values.reduce((a, v) => a + Math.round(v * 100), 0);

/** Every trip in this suite is id 1, owned by a user no test ever names or asserts on. */
const GHOST_OWNER_ID = 999999;

function seedBaseline() {
  testDb.prepare(
    'INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
  ).run(GHOST_OWNER_ID, 'ghost_owner', 'ghost_owner@test.example.com', 'x', 'user');
  testDb.prepare(
    "INSERT INTO trips (id, user_id, title, currency) VALUES (1, ?, 'Trip', 'EUR')",
  ).run(GHOST_OWNER_ID);
}

function seedUser(id: number, username: string) {
  testDb.prepare(
    'INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
  ).run(id, username, `${username}.${id}@test.example.com`, 'x', 'user');
}

function setupDb(
  items: BudgetItem[],
  members: (BudgetItemMember & { budget_item_id: number })[],
  payers: (BudgetItemPayer & { budget_item_id: number })[] = [],
  settlements: ReturnType<typeof makeSettlementRow>[] = [],
) {
  // Idempotent: one test reconfigures the fixture mid-run (recomputes settlement
  // after booking its own offered flows), so a second call must not collide with
  // the first's rows. Children before parents; users last since settlements and
  // items/members/payers all reference them.
  testDb.exec('DELETE FROM budget_settlements');
  testDb.exec('DELETE FROM budget_item_payers');
  testDb.exec('DELETE FROM budget_item_members');
  testDb.exec('DELETE FROM budget_items');
  testDb.prepare('DELETE FROM users WHERE id != ?').run(GHOST_OWNER_ID);

  // Every user id these rows reference, with the username the fixture gave it —
  // members/payers carry one explicitly; a settlement-only party (no expense
  // behind the transfer) falls back to the settlement row's own username.
  const usernames = new Map<number, string>();
  for (const m of members) usernames.set(m.user_id, m.username);
  for (const p of payers) usernames.set(p.user_id, p.username);
  for (const s of settlements) {
    if (!usernames.has(s.from_user_id)) usernames.set(s.from_user_id, s.from_username);
    if (!usernames.has(s.to_user_id)) usernames.set(s.to_user_id, s.to_username);
  }
  for (const [id, username] of usernames) seedUser(id, username);

  for (const item of items) {
    testDb.prepare(
      'INSERT INTO budget_items (id, trip_id, name, total_price, currency, exchange_rate) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(item.id, item.trip_id, item.name, item.total_price, item.currency ?? null, item.exchange_rate ?? 1);
  }
  for (const m of members) {
    testDb.prepare(
      'INSERT INTO budget_item_members (budget_item_id, user_id, paid, amount) VALUES (?, ?, ?, ?)',
    ).run(m.budget_item_id, m.user_id, m.paid ?? 0, m.amount ?? null);
  }
  for (const p of payers) {
    testDb.prepare(
      'INSERT INTO budget_item_payers (budget_item_id, user_id, amount) VALUES (?, ?, ?)',
    ).run(p.budget_item_id, p.user_id, p.amount);
  }
  for (const s of settlements) {
    testDb.prepare(
      'INSERT INTO budget_settlements (id, trip_id, from_user_id, to_user_id, amount, currency, exchange_rate) VALUES (?, 1, ?, ?, ?, ?, ?)',
    ).run(s.id, s.from_user_id, s.to_user_id, s.amount, s.currency, s.exchange_rate);
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  resetTestDb(testDb);
  seedBaseline();
  setupDb([], [], []);
});

// ── calculateSettlement ──────────────────────────────────────────────────────

describe('calculateSettlement', () => {
  it('returns empty balances and flows when trip has no items', async () => {
    setupDb([], [], []);
    const result = await budget.calculateSettlement(1);
    expect(result.balances).toEqual([]);
    expect(result.flows).toEqual([]);
  });

  it('returns no flows when there are items but no members', async () => {
    setupDb([makeItem(1, 100)], [], [makePayer(1, 1, 100, 'alice')]);
    const result = await budget.calculateSettlement(1);
    expect(result.flows).toEqual([]);
  });

  it('returns no flows when no one has paid', async () => {
    setupDb(
      [makeItem(1, 100)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob')],
      [],
    );
    const result = await budget.calculateSettlement(1);
    expect(result.flows).toEqual([]);
    // "No flows" on its own said nothing about the balances behind them: they
    // were -50/-50 here until #2225, an offer of nothing next to money owed.
    expect(centSum(result.balances.map(b => b.balance))).toBe(0);
  });

  it('2 members, 1 payer: payer is owed half, non-payer owes half', async () => {
    // Item: $100. Alice paid all, [Alice, Bob] split. Each owes $50. Alice net: +$50. Bob: -$50.
    setupDb(
      [makeItem(1, 100)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob')],
      [makePayer(1, 1, 100, 'alice')],
    );
    const result = await budget.calculateSettlement(1);
    const alice = result.balances.find(b => b.user_id === 1)!;
    const bob = result.balances.find(b => b.user_id === 2)!;
    expect(alice.balance).toBe(50);
    expect(bob.balance).toBe(-50);
    expect(result.flows).toHaveLength(1);
    expect(result.flows[0].from.user_id).toBe(2); // Bob owes
    expect(result.flows[0].to.user_id).toBe(1);   // Alice is owed
    expect(result.flows[0].amount).toBe(50);
  });

  it('3 members, 1 payer: correct 3-way split', async () => {
    // Item: $90. Alice paid. Each of 3 owes $30. Alice net: +$60. Bob: -$30. Carol: -$30.
    setupDb(
      [makeItem(1, 90)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob'), makeMember(1, 3, 'carol')],
      [makePayer(1, 1, 90, 'alice')],
    );
    const result = await budget.calculateSettlement(1);
    const alice = result.balances.find(b => b.user_id === 1)!;
    const bob = result.balances.find(b => b.user_id === 2)!;
    const carol = result.balances.find(b => b.user_id === 3)!;
    expect(alice.balance).toBe(60);
    expect(bob.balance).toBe(-30);
    expect(carol.balance).toBe(-30);
    expect(result.flows).toHaveLength(2);
  });

  it('all paid equally: all balances are zero, no flows', async () => {
    // Item: $60. 3 members, each paid $20 and owes $20. Net: 0 for everyone.
    setupDb(
      [makeItem(1, 60)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob'), makeMember(1, 3, 'carol')],
      [makePayer(1, 1, 20, 'alice'), makePayer(1, 2, 20, 'bob'), makePayer(1, 3, 20, 'carol')],
    );
    const result = await budget.calculateSettlement(1);
    // Exactly zero, not "within a cent": a tolerance here is what let #1382's
    // stranded cents through unnoticed.
    for (const b of result.balances) {
      expect(b.balance).toBe(0);
    }
    expect(result.flows).toHaveLength(0);
  });

  it('flow direction: from is debtor (owes), to is creditor (is owed)', async () => {
    // Alice paid $100 for 2 people. Bob owes Alice $50.
    setupDb(
      [makeItem(1, 100)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob')],
      [makePayer(1, 1, 100, 'alice')],
    );
    const result = await budget.calculateSettlement(1);
    const flow = result.flows[0];
    expect(flow.from.username).toBe('bob');   // debtor
    expect(flow.to.username).toBe('alice');   // creditor
  });

  it('amounts are rounded to 2 decimal places', async () => {
    // Item: $10. 3 members, 1 payer. Share = 3.333... Each rounded to 3.33.
    setupDb(
      [makeItem(1, 10)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob'), makeMember(1, 3, 'carol')],
      [makePayer(1, 1, 10, 'alice')],
    );
    const result = await budget.calculateSettlement(1);
    for (const b of result.balances) {
      const str = b.balance.toString();
      const decimals = str.includes('.') ? str.split('.')[1].length : 0;
      expect(decimals).toBeLessThanOrEqual(2);
    }
    for (const flow of result.flows) {
      const str = flow.amount.toString();
      const decimals = str.includes('.') ? str.split('.')[1].length : 0;
      expect(decimals).toBeLessThanOrEqual(2);
    }
  });

  it('2 items with different payers: aggregates balances correctly', async () => {
    // Item 1: $100, Alice paid, [Alice, Bob] (Alice net: +50, Bob: -50)
    // Item 2: $60, Bob paid, [Alice, Bob] (Bob net: +30, Alice: -30)
    // Final: Alice: +50 - 30 = +20, Bob: -50 + 30 = -20
    setupDb(
      [makeItem(1, 100), makeItem(2, 60)],
      [
        makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob'),
        makeMember(2, 1, 'alice'), makeMember(2, 2, 'bob'),
      ],
      [makePayer(1, 1, 100, 'alice'), makePayer(2, 2, 60, 'bob')],
    );
    const result = await budget.calculateSettlement(1);
    const alice = result.balances.find(b => b.user_id === 1)!;
    const bob = result.balances.find(b => b.user_id === 2)!;
    expect(alice.balance).toBe(20);
    expect(bob.balance).toBe(-20);
    expect(result.flows).toHaveLength(1);
    expect(result.flows[0].amount).toBe(20);
  });

  it('counts a settlement with no matching expense as an amount still to square up', async () => {
    // bob paid alice 30 but every expense behind it was deleted: alice now owes bob.
    setupDb([], [], [], [makeSettlementRow(1, 2, 1, 30)]);
    const result = await budget.calculateSettlement(1);
    const alice = result.balances.find(b => b.user_id === 1)!;
    const bob = result.balances.find(b => b.user_id === 2)!;
    expect(bob.balance).toBe(30);
    expect(alice.balance).toBe(-30);
    expect(result.flows).toEqual([
      expect.objectContaining({ amount: 30, from: expect.objectContaining({ user_id: 1 }), to: expect.objectContaining({ user_id: 2 }) }),
    ]);
  });

  it('#1335 converts a foreign expense with the frozen exchange_rate, not live rates', async () => {
    // $110 booked at a frozen rate of 1.1 (USD per 1 EUR) = 100 EUR. Live rates have since
    // drifted to 1.2, but the converted amount must stay on the frozen rate so an already
    // settled position isn't re-opened with a residual.
    setupDb(
      [{ ...makeItem(1, 110), currency: 'USD', exchange_rate: 1.1 } as BudgetItem],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob')],
      [makePayer(1, 1, 110, 'alice')],
    );
    const result = await budget.calculateSettlement(1, { base: 'EUR', tripCurrency: 'EUR', rates: { EUR: 1, USD: 1.2 } });
    const bob = result.balances.find(b => b.user_id === 2)!;
    // 110 / 1.1 = 100 EUR; Bob owes half = 50 (frozen). With the live 1.2 it would be ~45.83.
    expect(bob.balance).toBeCloseTo(-50, 2);
  });

  it('#1335 a legacy row (exchange_rate = 1) still converts with live rates', async () => {
    setupDb(
      [{ ...makeItem(1, 120), currency: 'USD', exchange_rate: 1 } as BudgetItem],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob')],
      [makePayer(1, 1, 120, 'alice')],
    );
    const result = await budget.calculateSettlement(1, { base: 'EUR', tripCurrency: 'EUR', rates: { EUR: 1, USD: 1.2 } });
    const bob = result.balances.find(b => b.user_id === 2)!;
    // 120 / 1.2 (live) = 100 EUR; Bob owes 50 — unchanged behaviour for pre-#1335 rows.
    expect(bob.balance).toBeCloseTo(-50, 2);
  });

  it('#1445 a settle-up transfer with a frozen currency+rate keeps the position balanced when rates drift', async () => {
    // Trip currency EUR; Bob viewed in USD (display) and owes Alice 50 EUR = 62.50 USD
    // at the settle-time rate of 1.25 USD/EUR. He records that 62.50 USD transfer, which
    // freezes currency=USD, exchange_rate=1.25. Live rates have since drifted (now the
    // recompute passes EUR=0.5 per 1 USD), but the frozen transfer still nets to -50+50=0.
    setupDb(
      [makeItem(1, 100)], // trip-currency expense (currency NULL)
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob')],
      [makePayer(1, 1, 100, 'alice')],
      [makeSettlementRow(1, 2, 1, 62.5, 'USD', 1.25)],
    );
    const result = await budget.calculateSettlement(1, { base: 'USD', tripCurrency: 'EUR', rates: { USD: 1, EUR: 0.5 } });
    const bob = result.balances.find(b => b.user_id === 2)!;
    expect(bob.balance).toBeCloseTo(0, 2); // settled — no residual re-opens
  });

  it('#1445 a legacy settle-up transfer (currency NULL) still converts with live rates', async () => {
    // Same shape, but the transfer predates the fix (currency NULL). It is re-converted
    // to trip currency with live rates, so a drift re-opens the position — unchanged
    // legacy behaviour that normalises once the row is re-edited.
    setupDb(
      [makeItem(1, 100)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob')],
      [makePayer(1, 1, 100, 'alice')],
      [makeSettlementRow(1, 2, 1, 62.5, null, 1)],
    );
    const result = await budget.calculateSettlement(1, { base: 'USD', tripCurrency: 'EUR', rates: { USD: 1, EUR: 0.5 } });
    const bob = result.balances.find(b => b.user_id === 2)!;
    // settleToTrip(62.5) = 62.5 * 0.5 = 31.25 EUR; balance -50 + 31.25 = -18.75 EUR → reopens.
    expect(Math.abs(bob.balance)).toBeGreaterThan(1);
  });

  // ── Multi-payer (#1426 regression): several people front one bill ──────────
  // The UI could only send one payer between 3.2.0 and this fix, but the ledger
  // has credited each payer individually since 3.1.0. These pin that.

  it('2 payers, 3 members: each payer is credited what they actually paid', async () => {
    // $90 bill split 3 ways ($30 each). Alice and Bob each fronted $45.
    // Alice: +45 - 30 = +15. Bob: +45 - 30 = +15. Carol: -30.
    setupDb(
      [makeItem(1, 90)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob'), makeMember(1, 3, 'carol')],
      [makePayer(1, 1, 45, 'alice'), makePayer(1, 2, 45, 'bob')],
    );
    const result = await budget.calculateSettlement(1);
    const balance = (uid: number) => result.balances.find(b => b.user_id === uid)!.balance;

    expect(balance(1)).toBeCloseTo(15, 2);
    expect(balance(2)).toBeCloseTo(15, 2);
    expect(balance(3)).toBeCloseTo(-30, 2);
  });

  it('2 payers with unequal amounts: credits follow the actual amounts paid', async () => {
    // $100 bill split 2 ways ($50 each). Alice fronted $70, Bob fronted $30.
    // Alice: +70 - 50 = +20. Bob: +30 - 50 = -20. Bob owes Alice $20.
    setupDb(
      [makeItem(1, 100)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob')],
      [makePayer(1, 1, 70, 'alice'), makePayer(1, 2, 30, 'bob')],
    );
    const result = await budget.calculateSettlement(1);
    const balance = (uid: number) => result.balances.find(b => b.user_id === uid)!.balance;

    expect(balance(1)).toBeCloseTo(20, 2);
    expect(balance(2)).toBeCloseTo(-20, 2);
    expect(result.flows).toHaveLength(1);
    expect(result.flows[0].from.user_id).toBe(2);
    expect(result.flows[0].to.user_id).toBe(1);
    expect(result.flows[0].amount).toBeCloseTo(20, 2);
  });

  it('multi-payer balances sum to zero (no money invented or destroyed)', async () => {
    // The invariant that makes settle-up trustworthy: credits == debits.
    setupDb(
      [makeItem(1, 90), makeItem(2, 55)],
      [
        makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob'), makeMember(1, 3, 'carol'),
        makeMember(2, 1, 'alice'), makeMember(2, 3, 'carol'),
      ],
      [
        makePayer(1, 1, 45, 'alice'), makePayer(1, 2, 45, 'bob'),
        makePayer(2, 2, 25, 'bob'), makePayer(2, 3, 30, 'carol'),
      ],
    );
    const result = await budget.calculateSettlement(1);

    expect(centSum(result.balances.map(b => b.balance))).toBe(0);
  });

  it('3 payers on one bill: an odd total still splits to the cent', async () => {
    // $100.01 split 3 ways. splitEqualShares distributes the remainder cent,
    // so debits must still exactly cancel the $100.01 of credits.
    setupDb(
      [makeItem(1, 100.01)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob'), makeMember(1, 3, 'carol')],
      [makePayer(1, 1, 33.34, 'alice'), makePayer(1, 2, 33.34, 'bob'), makePayer(1, 3, 33.33, 'carol')],
    );
    const result = await budget.calculateSettlement(1);

    expect(centSum(result.balances.map(b => b.balance))).toBe(0);
  });
});

// ── Refunds: negative amounts are first-class expenses (#2176) ───────────────

describe('calculateSettlement — negative amounts (#2176)', () => {
  it('a refund credits the members and debits its recipient', async () => {
    // A 30 € refund lands with Alice; all three had shared the original cost.
    // Alice received 30 but only 10 of it was hers, so she owes 20.
    setupDb(
      [makeItem(1, -30)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob'), makeMember(1, 3, 'carol')],
      [makePayer(1, 1, -30, 'alice')],
    );
    const result = await budget.calculateSettlement(1);
    const balance = (uid: number) => result.balances.find(b => b.user_id === uid)!.balance;

    expect(balance(1)).toBe(-20);
    expect(balance(2)).toBe(10);
    expect(balance(3)).toBe(10);
    expect(centSum(result.balances.map(b => b.balance))).toBe(0);
  });

  it('a refund reduces the debt its expense created', async () => {
    // 90 € dinner fronted by Alice, then a 30 € partial reimbursement she keeps —
    // both split three ways. Bob's debt drops from 30 to 20.
    setupDb(
      [makeItem(1, 90), makeItem(2, -30)],
      [
        makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob'), makeMember(1, 3, 'carol'),
        makeMember(2, 1, 'alice'), makeMember(2, 2, 'bob'), makeMember(2, 3, 'carol'),
      ],
      [makePayer(1, 1, 90, 'alice'), makePayer(2, 1, -30, 'alice')],
    );
    const result = await budget.calculateSettlement(1);
    const balance = (uid: number) => result.balances.find(b => b.user_id === uid)!.balance;

    expect(balance(1)).toBe(40);
    expect(balance(2)).toBe(-20);
    expect(balance(3)).toBe(-20);
    expect(result.flows).toEqual(expect.arrayContaining([
      expect.objectContaining({ amount: 20, from: expect.objectContaining({ user_id: 2 }), to: expect.objectContaining({ user_id: 1 }) }),
    ]));
  });

  it('an odd negative total still nets to exactly zero', async () => {
    setupDb(
      [makeItem(1, -100.01)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob'), makeMember(1, 3, 'carol')],
      [makePayer(1, 1, -100.01, 'alice')],
    );
    const result = await budget.calculateSettlement(1);

    expect(centSum(result.balances.map(b => b.balance))).toBe(0);
  });

  it('a negative custom split settles by the custom amounts', async () => {
    // 100 € refund to Alice; by agreement Bob is owed 70 of it, Carol 30.
    setupDb(
      [makeItem(1, -100)],
      [
        { ...makeMember(1, 2, 'bob'), amount: -70 },
        { ...makeMember(1, 3, 'carol'), amount: -30 },
      ],
      [makePayer(1, 1, -100, 'alice')],
    );
    const result = await budget.calculateSettlement(1);
    const balance = (uid: number) => result.balances.find(b => b.user_id === uid)!.balance;

    expect(balance(1)).toBe(-100);
    expect(balance(2)).toBe(70);
    expect(balance(3)).toBe(30);
    expect(centSum(result.balances.map(b => b.balance))).toBe(0);
  });

  it('a payer-less refund owes nobody anything until its recipient is named (#2225)', async () => {
    // Nobody is recorded as having received the refund, so there is no credit to
    // hand back: the row is outstanding, not a debt the trip owes its members.
    // It used to credit all three 30 € out of thin air.
    setupDb(
      [makeItem(1, -90)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob'), makeMember(1, 3, 'carol')],
      [],
    );
    const result = await budget.calculateSettlement(1);

    expect(result.balances).toEqual([]);
    expect(result.flows).toEqual([]);
  });
});

// ── Client/server share parity (#2176) ───────────────────────────────────────
//
// splitEqualShares exists twice: here (netting the settlement in cents) and on
// the client (previewing the split in euros — CostsPanel.helpers.ts). This
// fixture is duplicated verbatim in
// client/src/components/Budget/CostsPanel.helpers.test.ts; if either
// implementation drifts — sign handling included — its copy of the table fails.
const SHARE_PARITY_FIXTURE: { totalCents: number; users: number[]; itemId: number; expected: Record<number, number> }[] = [
  { totalCents: 10000, users: [1, 2, 3], itemId: 0, expected: { 1: 3334, 2: 3333, 3: 3333 } },
  { totalCents: 10000, users: [1, 2, 3], itemId: 1, expected: { 1: 3333, 2: 3334, 3: 3333 } },
  { totalCents: -10000, users: [1, 2, 3], itemId: 0, expected: { 1: -3333, 2: -3333, 3: -3334 } },
  { totalCents: -10000, users: [1, 2, 3], itemId: 1, expected: { 1: -3334, 2: -3333, 3: -3333 } },
  { totalCents: -101, users: [1, 2], itemId: 0, expected: { 1: -50, 2: -51 } },
  { totalCents: -101, users: [1, 2], itemId: 1, expected: { 1: -51, 2: -50 } },
  { totalCents: -1, users: [1, 2, 3], itemId: 0, expected: { 1: 0, 2: 0, 3: -1 } },
];

// ── Final budget per participant ──────────────────────────────────────────

describe('calculateSettlement — finalBudgets', () => {
  /**
   * The whole point of the figure: gross outlay minus what came back minus what
   * still has to. It is the same ledger the balances come from, read from the
   * other end, so every case here also pins that the subtraction the UI prints
   * lands on the number beside it.
   */
  const checkIdentity = (rows: { expenses: number; reimbursed: number; pending: number; final: number }[]) => {
    for (const r of rows) {
      expect(Math.round(r.final * 100))
        .toBe(Math.round(r.expenses * 100) - Math.round(r.reimbursed * 100) - Math.round(r.pending * 100));
    }
  };

  it('charges each participant their share of what the payer fronted', async () => {
    // Alice fronts 100 for the two of them. Nothing has been paid back yet, so the
    // trip costs each of them 50: Alice is out 100 with 50 still coming, Bob is out
    // nothing with 50 still to pay.
    setupDb(
      [makeItem(1, 100)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob')],
      [makePayer(1, 1, 100, 'alice')],
    );
    const result = await budget.calculateSettlement(1);

    const alice = result.finalBudgets.find(f => f.user_id === 1)!;
    const bob = result.finalBudgets.find(f => f.user_id === 2)!;
    expect(alice).toMatchObject({ expenses: 100, reimbursed: 0, pending: 50, final: 50 });
    expect(bob).toMatchObject({ expenses: 0, reimbursed: 0, pending: -50, final: 50 });
    checkIdentity(result.finalBudgets);
  });

  it('a recorded transfer moves out of pending and into reimbursed, leaving the final alone', async () => {
    // Bob pays his 50 back. What the trip costs either of them cannot change — only
    // which of the two lines under it the 50 now sits on.
    setupDb(
      [makeItem(1, 100)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob')],
      [makePayer(1, 1, 100, 'alice')],
      [makeSettlementRow(1, 2, 1, 50)],
    );
    const result = await budget.calculateSettlement(1);

    const alice = result.finalBudgets.find(f => f.user_id === 1)!;
    const bob = result.finalBudgets.find(f => f.user_id === 2)!;
    expect(alice).toMatchObject({ expenses: 100, reimbursed: 50, pending: 0, final: 50 });
    expect(bob).toMatchObject({ expenses: 0, reimbursed: -50, pending: 0, final: 50 });
    checkIdentity(result.finalBudgets);
  });

  it('sums the finals to what the trip actually spent', async () => {
    // 90 + 60 across three people, fronted by two of them. However the debts are
    // arranged, the trip cost the group exactly what it spent.
    setupDb(
      [makeItem(1, 90), makeItem(2, 60)],
      [
        makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob'), makeMember(1, 3, 'carol'),
        makeMember(2, 2, 'bob'), makeMember(2, 3, 'carol'),
      ],
      [makePayer(1, 1, 90, 'alice'), makePayer(2, 2, 60, 'bob')],
    );
    const result = await budget.calculateSettlement(1);

    expect(centSum(result.finalBudgets.map(f => f.final))).toBe(15000);
    expect(result.finalBudgets.find(f => f.user_id === 1)!.final).toBe(30);
    expect(result.finalBudgets.find(f => f.user_id === 2)!.final).toBe(60);
    expect(result.finalBudgets.find(f => f.user_id === 3)!.final).toBe(60);
    checkIdentity(result.finalBudgets);
  });

  it('follows a custom split rather than an equal one', async () => {
    // Alice fronts 100 but only owes 20 of it — the split says so.
    setupDb(
      [makeItem(1, 100)],
      [
        { ...makeMember(1, 1, 'alice'), amount: 20 },
        { ...makeMember(1, 2, 'bob'), amount: 80 },
      ],
      [makePayer(1, 1, 100, 'alice')],
    );
    const result = await budget.calculateSettlement(1);

    expect(result.finalBudgets.find(f => f.user_id === 1)!.final).toBe(20);
    expect(result.finalBudgets.find(f => f.user_id === 2)!.final).toBe(80);
    checkIdentity(result.finalBudgets);
  });

  it('leaves an expense nobody paid out of the final budget (#2225)', async () => {
    // The unpaid row stays out of the ledger, so it cannot charge anybody either.
    setupDb(
      [makeItem(1, 90)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob'), makeMember(1, 3, 'carol')],
      [],
    );
    const result = await budget.calculateSettlement(1);

    expect(result.finalBudgets).toEqual([]);
  });

  it('gives a refund back to whoever was charged for it (#2176)', async () => {
    // A 30 refund Alice received, split between the two of them: each is 15 better
    // off, so the trip costs them -15 on this row alone.
    setupDb(
      [makeItem(1, -30)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob')],
      [makePayer(1, 1, -30, 'alice')],
    );
    const result = await budget.calculateSettlement(1);

    expect(result.finalBudgets.find(f => f.user_id === 1)!).toMatchObject({ expenses: -30, final: -15 });
    expect(result.finalBudgets.find(f => f.user_id === 2)!.final).toBe(-15);
    checkIdentity(result.finalBudgets);
  });

  it('keeps the breakdown adding up in a display currency of its own', async () => {
    // The three lines are converted as their own sets, like the balances are, and
    // the final is subtracted afterwards — so what the breakdown prints adds up in
    // whatever currency the viewer picked, at whatever the live rate happens to be.
    setupDb(
      [makeItem(1, 100)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob'), makeMember(1, 3, 'carol')],
      [makePayer(1, 1, 100, 'alice')],
      [makeSettlementRow(1, 2, 1, 33.33)],
    );
    for (const eurPerUsd of [0.855, 0.9312, 0.94]) {
      const result = await budget.calculateSettlement(1, { base: 'USD', tripCurrency: 'EUR', rates: { USD: 1, EUR: eurPerUsd } });

      checkIdentity(result.finalBudgets);
      // And the pending line is the balance itself, not a second opinion on it.
      for (const f of result.finalBudgets) {
        expect(f.pending).toBe(result.balances.find(b => b.user_id === f.user_id)!.balance);
      }
    }
  });

  it('costs nobody anything when a transfer has no expense behind it', async () => {
    // Bob handed Alice 40 with no expense on the trip to justify it. Alice has the
    // 40 but owes it straight back, so the trip has cost neither of them anything —
    // the transfer shows up as reimbursed on one line and outstanding on the next.
    setupDb([], [], [], [makeSettlementRow(1, 2, 1, 40)]);
    const result = await budget.calculateSettlement(1);

    expect(result.finalBudgets.find(f => f.user_id === 1)!).toMatchObject({ expenses: 0, reimbursed: 40, pending: -40, final: 0 });
    expect(result.finalBudgets.find(f => f.user_id === 2)!).toMatchObject({ expenses: 0, reimbursed: -40, pending: 40, final: 0 });
    checkIdentity(result.finalBudgets);
  });

  it('lists the rows each figure is made of, signed the way the figure is', async () => {
    // The first case read row by row, with 20 of Bob's 50 already sent: Alice
    // fronted the one expense, received the 20, and the open flow is the 30 coming
    // to her; on Bob's side the same transfer and flow are going out.
    setupDb(
      [makeItem(1, 100)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob')],
      [makePayer(1, 1, 100, 'alice')],
      [makeSettlementRow(1, 2, 1, 20)],
    );
    const result = await budget.calculateSettlement(1);

    expect(result.finalBudgets.find(f => f.user_id === 1)!.sources).toEqual({
      fronted: [{ item_id: 1, cents: 10000 }],
      moved: [{ settlement_id: 1, from_user_id: 2, to_user_id: 1, cents: 2000 }],
      outstanding: [{ from_user_id: 2, to_user_id: 1, cents: 3000 }],
    });
    expect(result.finalBudgets.find(f => f.user_id === 2)!.sources).toEqual({
      fronted: [],
      moved: [{ settlement_id: 1, from_user_id: 2, to_user_id: 1, cents: -2000 }],
      outstanding: [{ from_user_id: 2, to_user_id: 1, cents: -3000 }],
    });
  });

  it('keeps an expense with no split members out of the rows, as it is out of the ledger', async () => {
    // Item 1 has a payer but nobody to split it with: a planning-only entry that
    // charges nobody, so it cannot be listed as something Alice fronted either.
    setupDb(
      [makeItem(1, 100), makeItem(2, 40)],
      [makeMember(2, 1, 'alice'), makeMember(2, 2, 'bob')],
      [makePayer(1, 1, 100, 'alice'), makePayer(2, 1, 40, 'alice')],
    );
    const result = await budget.calculateSettlement(1);

    const alice = result.finalBudgets.find(f => f.user_id === 1)!;
    expect(alice.expenses).toBe(40);
    expect(alice.sources.fronted).toEqual([{ item_id: 2, cents: 4000 }]);
  });

  it('spreads a foreign-currency figure over its rows so they still add up in the display currency', async () => {
    // Two USD expenses booked at their own frozen rates and one in the trip's euros,
    // viewed in pounds: every row goes through the conversion its figure went
    // through, and the cents lost to rounding land on rows instead of between them.
    const sum = (rows: { cents: number }[]) => rows.reduce((a, r) => a + r.cents, 0);
    setupDb(
      [
        { ...makeItem(1, 100), currency: 'USD', exchange_rate: 1.08 },
        { ...makeItem(2, 33.33), currency: 'USD', exchange_rate: 1.1 },
        makeItem(3, 50),
      ],
      [
        makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob'), makeMember(1, 3, 'carol'),
        makeMember(2, 1, 'alice'), makeMember(2, 2, 'bob'), makeMember(2, 3, 'carol'),
        makeMember(3, 1, 'alice'), makeMember(3, 2, 'bob'), makeMember(3, 3, 'carol'),
      ],
      [makePayer(1, 1, 100, 'alice'), makePayer(2, 1, 33.33, 'alice'), makePayer(3, 2, 50, 'bob')],
      [makeSettlementRow(1, 3, 1, 20, 'GBP', 0.8547), makeSettlementRow(2, 3, 2, 7.77, 'GBP', 0.8547)],
    );
    for (const eurPerGbp of [1.17, 1.1523, 1.2]) {
      const result = await budget.calculateSettlement(1, { base: 'GBP', tripCurrency: 'EUR', rates: { GBP: 1, EUR: eurPerGbp } });

      checkIdentity(result.finalBudgets);
      for (const f of result.finalBudgets) {
        expect(sum(f.sources.fronted)).toBe(Math.round(f.expenses * 100));
        expect(sum(f.sources.moved)).toBe(Math.round(f.reimbursed * 100));
        expect(sum(f.sources.outstanding)).toBe(Math.round(f.pending * 100));
      }
      // Alice's two rows each stay within a cent of their own conversion: the
      // remainder is handed out, not rounded away one row at a time.
      const alice = result.finalBudgets.find(f => f.user_id === 1)!;
      expect(alice.sources.fronted.map(r => r.item_id)).toEqual([1, 2]);
      expect(Math.abs(alice.sources.fronted[0].cents - Math.round(100 / 1.08 * 100) / eurPerGbp)).toBeLessThan(1);
      expect(Math.abs(alice.sources.fronted[1].cents - Math.round(33.33 / 1.1 * 100) / eurPerGbp)).toBeLessThan(1);
    }
  });
});

describe('splitEqualShares — client parity (#2176)', () => {
  // Private on purpose (only the settlement calls it); the parity pin reaches
  // through so the fixture exercises the real implementation, not a re-model.
  // `budget` isn't built until `beforeAll` runs, so this resolves it lazily at
  // call time rather than binding it during collection (still undefined then).
  const split = (totalCents: number, members: { user_id: number }[], itemId: number): Record<number, number> =>
    (budget as unknown as {
      splitEqualShares(totalCents: number, members: { user_id: number }[], itemId: number): Record<number, number>;
    }).splitEqualShares(totalCents, members, itemId);

  it.each(SHARE_PARITY_FIXTURE)(
    'splits $totalCents cents across $users.length members (item $itemId) exactly like the client',
    ({ totalCents, users, itemId, expected }) => {
      const shares = split(totalCents, users.map(user_id => ({ user_id })), itemId);
      expect(shares).toEqual(expected);
      expect((Object.values(shares) as number[]).reduce((a, b) => a + b, 0)).toBe(totalCents);
    },
  );
});

// ── #1382: balances and flows have to tell the same story ────────────────────
// The ledger is netted in whole cents of the trip currency, so a balance is only
// ever a whole number of cents and every one of them can be settled. What used to
// be smoothed over with a 0.01 tolerance is now exact.

describe('calculateSettlement — cent-exact settle-up (#1382)', () => {
  it('#1382 offers the last cent as a flow instead of stranding it', async () => {
    // 30.00 fronted by Alice, split three ways. Bob transfers 9.99 instead of his
    // 10.00 and Carol pays exactly, so one cent is still open. The reporter's
    // symptom was that the balances showed that cent while "Settle up" offered
    // nothing to clear it: below 0.01 the old filter dropped the person entirely.
    setupDb(
      [makeItem(1, 30)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob'), makeMember(1, 3, 'carol')],
      [makePayer(1, 1, 30, 'alice')],
      [makeSettlementRow(1, 2, 1, 9.99), makeSettlementRow(2, 3, 1, 10)],
    );
    const result = await budget.calculateSettlement(1);
    const balance = (uid: number) => result.balances.find(b => b.user_id === uid)!.balance;

    expect(balance(1)).toBe(0.01);
    expect(balance(2)).toBe(-0.01);
    expect(balance(3)).toBe(0);
    expect(result.flows).toEqual([
      expect.objectContaining({ amount: 0.01, from: expect.objectContaining({ user_id: 2 }), to: expect.objectContaining({ user_id: 1 }) }),
    ]);
  });

  it('#1382 booking every offered flow leaves all balances at exactly zero', async () => {
    // 10.00 three ways is 3.34/3.33/3.33 — the case where the old greedy walked
    // away from the rounding remainder. Recording the flows it offers must square
    // the trip up completely, or the leftover cent is there forever.
    const items = [makeItem(1, 10)];
    const members = [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob'), makeMember(1, 3, 'carol')];
    const payers = [makePayer(1, 1, 10, 'alice')];
    setupDb(items, members, payers);

    const first = await budget.calculateSettlement(1);
    expect(first.flows.length).toBeGreaterThan(0);

    const booked = first.flows.map((f, i) => makeSettlementRow(i + 1, f.from.user_id, f.to.user_id, f.amount));
    setupDb(items, members, payers, booked);

    const after = await budget.calculateSettlement(1);
    expect(after.balances.map(b => b.balance)).toEqual([0, 0, 0]);
    expect(after.flows).toEqual([]);
  });

  it('#1382 a foreign-currency expense nets to exactly zero, not to a sub-cent residual', async () => {
    // 100 USD frozen at 1.1 is 90.909090… EUR: no split of it lands on whole cents.
    // The equal split divides the credited cents rather than the foreign total, so
    // the debits cancel the credits exactly instead of leaving dust behind.
    setupDb(
      [{ ...makeItem(1, 100), currency: 'USD', exchange_rate: 1.1 } as BudgetItem],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob'), makeMember(1, 3, 'carol')],
      [makePayer(1, 1, 100, 'alice')],
    );
    const result = await budget.calculateSettlement(1, { base: 'EUR', tripCurrency: 'EUR', rates: { EUR: 1, USD: 1.1 } });

    expect(centSum(result.balances.map(b => b.balance))).toBe(0);
    expect(centSum(result.flows.map(f => f.amount)))
      .toBe(Math.round(result.balances.find(b => b.user_id === 1)!.balance * 100));
  });

  it('#1382 a display currency of its own neither invents nor loses a cent', async () => {
    // Nothing here is foreign: an all-EUR trip, but the viewer's preferred currency
    // is USD. Rounding each balance into that currency on its own used to leave the
    // set adding up to a cent that no flow could ever clear, and the drift moved
    // with the live rate — money appearing without a single expense being touched.
    setupDb(
      [makeItem(1, 100)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob'), makeMember(1, 3, 'carol')],
      [makePayer(1, 1, 100, 'alice')],
    );
    for (const eurPerUsd of [0.855, 0.9312, 0.94]) {
      const result = await budget.calculateSettlement(1, { base: 'USD', tripCurrency: 'EUR', rates: { USD: 1, EUR: eurPerUsd } });

      expect(centSum(result.balances.map(b => b.balance))).toBe(0);
      for (const b of result.balances) {
        // What settle-up would move for this person has to be their balance exactly.
        const moved = centSum(result.flows.filter(f => f.to.user_id === b.user_id).map(f => f.amount))
          - centSum(result.flows.filter(f => f.from.user_id === b.user_id).map(f => f.amount));
        expect(moved).toBe(Math.round(b.balance * 100));
      }
    }
  });

  it('#2225 an unpaid bill owes nobody anything', async () => {
    // Nobody is down as a payer, so nobody is out of pocket and there is nothing
    // to pay back. It used to debit all three 30 € against no credit at all,
    // leaving Σ(balances) at -90 with no flow able to clear it.
    setupDb(
      [makeItem(1, 90)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob'), makeMember(1, 3, 'carol')],
      [],
    );
    const result = await budget.calculateSettlement(1);

    expect(result.balances).toEqual([]);
    expect(result.flows).toEqual([]);
  });
});

// ── Unpaid expenses stay out of the ledger (#2225) ────────────────────────

describe('calculateSettlement: unpaid expenses (#2225)', () => {
  it('an unpaid expense does not turn its members into debtors of an unrelated payer', async () => {
    // The shape from the issue: a 300 € bill Alice fronted for all four, plus a
    // 60 € row nobody has paid that only Bob and Carol are on. The 60 € used to
    // be debited with no credit behind it, and the simplifier (which knows
    // nothing about which expense made which debt) handed the extra 60 € to
    // Alice, who was never owed it.
    setupDb(
      [makeItem(1, 300), makeItem(2, 60)],
      [
        makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob'), makeMember(1, 3, 'carol'), makeMember(1, 4, 'dave'),
        makeMember(2, 2, 'bob'), makeMember(2, 3, 'carol'),
      ],
      [makePayer(1, 1, 300, 'alice')],
    );
    const result = await budget.calculateSettlement(1);
    const balance = (uid: number) => result.balances.find(b => b.user_id === uid)!.balance;

    expect(centSum(result.balances.map(b => b.balance))).toBe(0);
    // Being on the unpaid row costs Bob and Carol nothing over Dave, who is not.
    expect(balance(2)).toBe(balance(4));
    expect(balance(3)).toBe(balance(4));
    expect(balance(1)).toBe(225);
    expect(centSum(result.flows.map(f => f.amount))).toBe(Math.round(balance(1) * 100));
    for (const f of result.flows) expect(f.to.user_id).toBe(1);
  });

  it('an unpaid expense with a custom split is skipped too', async () => {
    // The custom branch had the same hole and no coverage: 100 € split 70/30 by
    // agreement, with nobody recorded as having paid it.
    setupDb(
      [makeItem(1, 90), makeItem(2, 100)],
      [
        makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob'), makeMember(1, 3, 'carol'),
        { ...makeMember(2, 2, 'bob'), amount: 70 },
        { ...makeMember(2, 3, 'carol'), amount: 30 },
      ],
      [makePayer(1, 1, 90, 'alice')],
    );
    const result = await budget.calculateSettlement(1);
    const balance = (uid: number) => result.balances.find(b => b.user_id === uid)!.balance;

    expect(balance(1)).toBe(60);
    expect(balance(2)).toBe(-30);
    expect(balance(3)).toBe(-30);
    expect(centSum(result.balances.map(b => b.balance))).toBe(0);
  });

  it('a zero-total item with no payer contributes nothing and no rows', async () => {
    // Payer-less is payer-less regardless of the total: it contributes 0 either
    // way, and both panels synthesise a missing member's 0.00 row from the trip
    // roster (CostsPanel.tsx:853, MCostsTab.tsx:273), so dropping the row costs
    // the UI nothing.
    setupDb(
      [makeItem(1, 0)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob')],
      [],
    );
    const result = await budget.calculateSettlement(1);

    expect(result.balances).toEqual([]);
    expect(result.flows).toEqual([]);
  });

  it('a custom split left with no payer and a zeroed total creates no debt', async () => {
    // PUT /budget/:id/payers with an empty array zeroes total_price via
    // writeItemPayers and, unlike updateBudgetItem, never re-applies it, so the
    // row survives as custom per-member amounts with no credit behind them. A
    // guard that also required a non-zero total would let exactly this shape
    // through and rebuild the #2225 phantom debt from a first-party endpoint.
    setupDb(
      [makeItem(1, 0)],
      [
        { ...makeMember(1, 2, 'bob'), amount: 40 },
        { ...makeMember(1, 3, 'cara'), amount: 60 },
      ],
      [],
    );
    const result = await budget.calculateSettlement(1);

    expect(result.balances).toEqual([]);
    expect(result.flows).toEqual([]);
  });
});

// ── Rows no rate can convert (the VND/AUD report) ───────────────────────────
// A foreign row with no frozen rate and no live one used to be read 1:1, as if it
// were already in the trip currency: 8,920,000 VND became 8,920,000 AUD of debt.

describe('calculateSettlement: unconverted rows', () => {
  const four = () => [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob'), makeMember(1, 3, 'carol'), makeMember(1, 4, 'dave')];
  const vndBill = (exchange_rate: number) => ({ ...makeItem(1, 8920000), currency: 'VND', exchange_rate } as BudgetItem);
  const none = { item_ids: [], settlement_ids: [], currencies: [] };

  it('VND/AUD regression: an unfrozen 8,920,000 VND bill on an AUD trip with no rates is left out whole, Σ balances 0, no VND-scale balance', async () => {
    setupDb(
      [vndBill(1), makeItem(2, 40)],
      [...four(), makeMember(2, 2, 'bob'), makeMember(2, 3, 'carol')],
      [makePayer(1, 1, 8920000, 'alice'), makePayer(2, 2, 40, 'bob')],
    );
    const result = await budget.calculateSettlement(1, { base: 'AUD', tripCurrency: 'AUD', rates: null });
    expect(result.unconverted).toEqual({ item_ids: [1], settlement_ids: [], currencies: ['VND'] });
    expect(result.currency).toBe('AUD');
    // Only the 40 AUD dinner settles; the bill moves nobody, its payer included.
    expect(result.balances.map(b => [b.user_id, b.balance])).toEqual([[2, 20], [3, -20]]);
    expect(centSum(result.balances.map(b => b.balance))).toBe(0);
    expect(result.balances.every(b => Math.abs(b.balance) < 1000)).toBe(true);
    expect(result.finalBudgets.flatMap(f => f.sources.fronted.map(r => r.item_id))).toEqual([2]);
  });

  it('VND/AUD regression: frozen at 18241.3 it books 489.00 AUD, split 4 ways +366.75 / -122.25 x3', async () => {
    setupDb([vndBill(18241.3)], four(), [makePayer(1, 1, 8920000, 'alice')]);
    const result = await budget.calculateSettlement(1, { base: 'AUD', tripCurrency: 'AUD', rates: null });
    expect(result.unconverted).toEqual(none);
    expect(result.balances.map(b => b.balance)).toEqual([366.75, -122.25, -122.25, -122.25]);
    expect(result.finalBudgets.find(f => f.user_id === 1)!.expenses).toBe(489);
  });

  it('a foreign row the rates do not quote is left out and listed while others convert live', async () => {
    setupDb(
      [vndBill(1), { ...makeItem(2, 65), currency: 'USD', exchange_rate: 1 } as BudgetItem],
      [...four(), makeMember(2, 1, 'alice'), makeMember(2, 2, 'bob')],
      [makePayer(1, 1, 8920000, 'alice'), makePayer(2, 1, 65, 'alice')],
    );
    const result = await budget.calculateSettlement(1, { base: 'AUD', tripCurrency: 'AUD', rates: { AUD: 1, USD: 0.65 } });
    expect(result.unconverted).toEqual({ item_ids: [1], settlement_ids: [], currencies: ['VND'] });
    // 65 USD at today's 0.65 per dollar is 100 AUD, half of it Bob's.
    expect(result.balances.map(b => [b.user_id, b.balance])).toEqual([[1, 50], [2, -50]]);
  });

  it('a frozen row converts without any rates (unchanged)', async () => {
    setupDb(
      [{ ...makeItem(1, 110), currency: 'USD', exchange_rate: 1.1 } as BudgetItem],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob')],
      [makePayer(1, 1, 110, 'alice')],
    );
    const result = await budget.calculateSettlement(1, { base: 'EUR', tripCurrency: 'EUR', rates: null });
    expect(result.unconverted).toEqual(none);
    expect(result.balances.find(b => b.user_id === 2)!.balance).toBe(-50);
  });

  it('trip-currency and NULL-currency rows with rate 1 count as they are', async () => {
    setupDb(
      [{ ...makeItem(1, 100), currency: 'aud', exchange_rate: 1 } as BudgetItem, { ...makeItem(2, 60), currency: null, exchange_rate: 1 } as BudgetItem],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob'), makeMember(2, 1, 'alice'), makeMember(2, 2, 'bob')],
      [makePayer(1, 1, 100, 'alice'), makePayer(2, 1, 60, 'alice')],
    );
    const result = await budget.calculateSettlement(1, { base: 'AUD', tripCurrency: 'AUD', rates: null });
    expect(result.unconverted).toEqual(none);
    expect(result.balances.find(b => b.user_id === 2)!.balance).toBe(-80);
  });

  it('planning-only and unpaid unconvertible rows are listed but never touch balances', async () => {
    setupDb(
      [
        { ...makeItem(1, 500000), currency: 'VND', exchange_rate: 1 } as BudgetItem, // planning-only
        { ...makeItem(2, 700000), currency: 'VND', exchange_rate: 1 } as BudgetItem, // nobody paid yet
        makeItem(3, 30),
      ],
      [makeMember(2, 1, 'alice'), makeMember(2, 2, 'bob'), makeMember(3, 1, 'alice'), makeMember(3, 2, 'bob')],
      [makePayer(3, 1, 30, 'alice')],
    );
    const result = await budget.calculateSettlement(1, { base: 'AUD', tripCurrency: 'AUD', rates: null });
    expect(result.unconverted).toEqual({ item_ids: [1, 2], settlement_ids: [], currencies: ['VND'] });
    expect(result.balances.map(b => [b.user_id, b.balance])).toEqual([[1, 15], [2, -15]]);
  });

  it('an unfrozen foreign transfer without a quote is left out and listed in settlement_ids', async () => {
    setupDb(
      [makeItem(1, 100)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob')],
      [makePayer(1, 1, 100, 'alice')],
      [makeSettlementRow(9, 2, 1, 1000000, 'VND', 1)],
    );
    const result = await budget.calculateSettlement(1, { base: 'AUD', tripCurrency: 'AUD', rates: null });
    expect(result.unconverted).toEqual({ item_ids: [], settlement_ids: [9], currencies: ['VND'] });
    // A million dong did not square a 50 dollar debt 20,000 times over.
    expect(result.balances.find(b => b.user_id === 2)!.balance).toBe(-50);
    expect(result.finalBudgets.every(f => f.sources.moved.length === 0)).toBe(true);
    // Still on the ledger list, so it can be edited or undone.
    expect(result.settlements.map(s => s.id)).toEqual([9]);
  });

  it('a NULL-currency transfer still reads in the display currency', async () => {
    setupDb(
      [makeItem(1, 100)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob')],
      [makePayer(1, 1, 100, 'alice')],
      [makeSettlementRow(9, 2, 1, 62.5, null, 1)],
    );
    const result = await budget.calculateSettlement(1, { base: 'USD', tripCurrency: 'EUR', rates: { EUR: 1, USD: 1.25 } });
    expect(result.currency).toBe('USD');
    expect(result.unconverted).toEqual(none);
    expect(result.balances.map(b => b.balance)).toEqual([0, 0]);
  });

  it('base EUR on an AUD trip without quote or baseRate answers in AUD with currency \'AUD\'', async () => {
    setupDb([makeItem(1, 100)], [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob')], [makePayer(1, 1, 100, 'alice')]);
    for (const rates of [null, { AUD: 1, USD: 0.65 }]) {
      const result = await budget.calculateSettlement(1, { base: 'EUR', tripCurrency: 'AUD', rates });
      // Trip cents, labelled as what they are rather than printed as euros.
      expect(result.currency).toBe('AUD');
      expect(result.balances.map(b => b.balance)).toEqual([50, -50]);
    }
  });

  it('baseRate stands in for the missing display quote and a transfer frozen at it cancels its flow to the cent (#2525)', async () => {
    const bill = () => [makeItem(1, 123.45)];
    const pair = () => [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob')];
    const paid = () => [makePayer(1, 1, 123.45, 'alice')];
    setupDb(bill(), pair(), paid());
    const before = await budget.calculateSettlement(1, { base: 'USD', tripCurrency: 'EUR', rates: null, baseRate: 1.1429 });
    expect(before.currency).toBe('USD');
    // Bob's 61.73 EUR at the browser's 1.1429 dollars per euro.
    expect(before.flows.map(f => f.amount)).toEqual([70.55]);

    // Bob pays what settle-up offers, frozen at the same browser quote (fallback_fx).
    setupDb(bill(), pair(), paid(), [makeSettlementRow(9, 2, 1, 70.55, 'USD', 1.1429)]);
    const after = await budget.calculateSettlement(1, { base: 'USD', tripCurrency: 'EUR', rates: null, baseRate: 1.1429 });
    expect(after.balances.map(b => b.balance)).toEqual([0, 0]);
    expect(after.flows).toEqual([]);
  });

  it('a server quote wins over baseRate', async () => {
    setupDb([makeItem(1, 123.45)], [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob')], [makePayer(1, 1, 123.45, 'alice')]);
    const result = await budget.calculateSettlement(1, { base: 'USD', tripCurrency: 'EUR', rates: { EUR: 1, USD: 1.1429 }, baseRate: 2 });
    expect(result.currency).toBe('USD');
    expect(result.flows.map(f => f.amount)).toEqual([70.55]);
  });

  it('baseRate never converts a row', async () => {
    setupDb(
      [{ ...makeItem(1, 100), currency: 'EUR', exchange_rate: 1 } as BudgetItem],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob')],
      [makePayer(1, 1, 100, 'alice')],
    );
    // 0.61 EUR per AUD would convert this bill arithmetically; it only relabels the result.
    const result = await budget.calculateSettlement(1, { base: 'EUR', tripCurrency: 'AUD', rates: null, baseRate: 0.61 });
    expect(result.currency).toBe('EUR');
    expect(result.unconverted).toEqual({ item_ids: [1], settlement_ids: [], currencies: ['EUR'] });
    expect(result.balances).toEqual([]);
  });
});

// ── freezeForeignRate (write-path FX freeze, #1445) ───────────────────────────
// The trip seeded by beforeEach/seedBaseline is EUR — every case here relies on
// that baseline instead of reconfiguring a `FROM trips` stub.

describe('freezeForeignRate', () => {
  it('freezes the live rate for a foreign currency into exchange_rate', async () => {
    mockRates.getRates.mockResolvedValue({ EUR: 1, USD: 1.25 });
    const data: { currency?: string | null; exchange_rate?: number } = { currency: 'usd' };
    await budget.freezeForeignRate(1, data);
    expect(mockRates.getRates).toHaveBeenCalledWith('EUR');
    expect(data.exchange_rate).toBe(1.25);
  });

  it('leaves the rate unset when the currency equals the trip currency', async () => {
    const data: { currency?: string | null; exchange_rate?: number } = { currency: 'EUR' };
    await budget.freezeForeignRate(1, data);
    expect(mockRates.getRates).not.toHaveBeenCalled();
    expect(data.exchange_rate).toBeUndefined();
  });

  it('respects an explicit exchange_rate from the caller', async () => {
    const data: { currency?: string | null; exchange_rate?: number } = { currency: 'USD', exchange_rate: 2 };
    await budget.freezeForeignRate(1, data);
    expect(mockRates.getRates).not.toHaveBeenCalled();
    expect(data.exchange_rate).toBe(2);
  });

  it('degrades to live rates (no freeze) when the rate fetch fails', async () => {
    mockRates.getRates.mockResolvedValue(null);
    const data: { currency?: string | null; exchange_rate?: number } = { currency: 'USD' };
    await budget.freezeForeignRate(1, data);
    expect(data.exchange_rate).toBeUndefined();
  });

  it('does not re-freeze on update when the currency is unchanged', async () => {
    testDb.prepare(
      'INSERT INTO budget_items (id, trip_id, name, total_price, currency) VALUES (9, 1, ?, ?, ?)',
    ).run('Existing', 1, 'USD');
    const data: { currency?: string | null; exchange_rate?: number } = { currency: 'USD' };
    await budget.freezeForeignRate(1, data, 9);
    expect(mockRates.getRates).not.toHaveBeenCalled();
    expect(data.exchange_rate).toBeUndefined();
  });

  it('does not re-freeze a settlement edit when its stored currency is unchanged (#1445)', async () => {
    const data: { currency?: string | null; exchange_rate?: number } = { currency: 'USD' };
    // the settlement already holds USD — pass it as existingCurrency → keep the frozen rate
    await budget.freezeForeignRate(1, data, undefined, 'USD');
    expect(mockRates.getRates).not.toHaveBeenCalled();
    expect(data.exchange_rate).toBeUndefined();
  });

  it('re-freezes a settlement edit when its currency actually changes', async () => {
    mockRates.getRates.mockResolvedValue({ EUR: 1, USD: 1.25 });
    const data: { currency?: string | null; exchange_rate?: number } = { currency: 'USD' };
    await budget.freezeForeignRate(1, data, undefined, 'GBP'); // was GBP → now USD → re-freeze
    expect(data.exchange_rate).toBe(1.25);
  });
});

// ── applySettlementUpdate (the raw no-freeze write behind updateSettlement) ──

describe('applySettlementUpdate', () => {
  it('returns null when the settlement is not in the trip', async () => {
    expect(await budget.applySettlementUpdate(7, 1, { from_user_id: 2, to_user_id: 1, amount: 10 })).toBeNull();
  });

  it('updates the row (rounded to cents) and returns the refreshed settlement', async () => {
    seedUser(1, 'alice');
    seedUser(2, 'bob');
    testDb.prepare(
      'INSERT INTO budget_settlements (id, trip_id, from_user_id, to_user_id, amount, currency, exchange_rate, settled_at) VALUES (7, 1, 1, 2, 5, NULL, 1, NULL)',
    ).run();

    const res = await budget.applySettlementUpdate(7, 1, { from_user_id: 2, to_user_id: 1, amount: 10.126 });
    // Quirk fix: currency/exchange_rate/settled_at/note are presence-gated CASE guards —
    // omitted from this update, so the row keeps what it already had (NULL/1/NULL/NULL,
    // the note since #2340) while from/to/amount (rounded) take the new values. Checked
    // against the persisted row rather than a mocked `run` call, now that there is a real one.
    const row = testDb.prepare(
      'SELECT from_user_id, to_user_id, amount, currency, exchange_rate, settled_at, note FROM budget_settlements WHERE id = ?',
    ).get(7);
    expect(row).toEqual({ from_user_id: 2, to_user_id: 1, amount: 10.13, currency: null, exchange_rate: 1, settled_at: null, note: null });
    expect(res).toMatchObject({ id: 7, from_user_id: 2, to_user_id: 1, amount: 10.13 });
  });
});
