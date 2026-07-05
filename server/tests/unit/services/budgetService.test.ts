import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── DB mock setup ────────────────────────────────────────────────────────────

const mockDb = vi.hoisted(() => {
  return {
    db: {
      prepare: vi.fn(() => ({
        all: vi.fn(() => []),
        get: vi.fn(() => undefined),
        run: vi.fn(),
      })),
    },
    canAccessTrip: vi.fn(() => true),
  };
});

vi.mock('../../../src/db/database', () => mockDb);

const mockRates = vi.hoisted(() => ({ getRates: vi.fn() }));
vi.mock('../../../src/services/exchangeRateService', () => mockRates);

import { calculateSettlement, updateSettlement, freezeForeignRate } from '../../../src/services/budgetService';
import type { BudgetItem, BudgetItemMember, BudgetItemPayer } from '../../../src/types';

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

function setupDb(
  items: BudgetItem[],
  members: (BudgetItemMember & { budget_item_id: number })[],
  payers: (BudgetItemPayer & { budget_item_id: number })[] = [],
  settlements: ReturnType<typeof makeSettlementRow>[] = [],
) {
  mockDb.db.prepare.mockImplementation((sql: string) => {
    if (sql.includes('SELECT * FROM budget_items')) {
      return { all: vi.fn(() => items), get: vi.fn(), run: vi.fn() };
    }
    if (sql.includes('budget_item_members')) {
      return { all: vi.fn(() => members), get: vi.fn(), run: vi.fn() };
    }
    if (sql.includes('budget_item_payers')) {
      return { all: vi.fn(() => payers), get: vi.fn(), run: vi.fn() };
    }
    if (sql.includes('budget_settlements')) {
      return { all: vi.fn(() => settlements), get: vi.fn(), run: vi.fn() };
    }
    return { all: vi.fn(() => []), get: vi.fn(), run: vi.fn() };
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  setupDb([], [], []);
});

// ── calculateSettlement ──────────────────────────────────────────────────────

describe('calculateSettlement', () => {
  it('returns empty balances and flows when trip has no items', () => {
    setupDb([], [], []);
    const result = calculateSettlement(1);
    expect(result.balances).toEqual([]);
    expect(result.flows).toEqual([]);
  });

  it('returns no flows when there are items but no members', () => {
    setupDb([makeItem(1, 100)], [], [makePayer(1, 1, 100, 'alice')]);
    const result = calculateSettlement(1);
    expect(result.flows).toEqual([]);
  });

  it('returns no flows when no one has paid', () => {
    setupDb(
      [makeItem(1, 100)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob')],
      [],
    );
    const result = calculateSettlement(1);
    expect(result.flows).toEqual([]);
  });

  it('2 members, 1 payer: payer is owed half, non-payer owes half', () => {
    // Item: $100. Alice paid all, [Alice, Bob] split. Each owes $50. Alice net: +$50. Bob: -$50.
    setupDb(
      [makeItem(1, 100)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob')],
      [makePayer(1, 1, 100, 'alice')],
    );
    const result = calculateSettlement(1);
    const alice = result.balances.find(b => b.user_id === 1)!;
    const bob = result.balances.find(b => b.user_id === 2)!;
    expect(alice.balance).toBe(50);
    expect(bob.balance).toBe(-50);
    expect(result.flows).toHaveLength(1);
    expect(result.flows[0].from.user_id).toBe(2); // Bob owes
    expect(result.flows[0].to.user_id).toBe(1);   // Alice is owed
    expect(result.flows[0].amount).toBe(50);
  });

  it('3 members, 1 payer: correct 3-way split', () => {
    // Item: $90. Alice paid. Each of 3 owes $30. Alice net: +$60. Bob: -$30. Carol: -$30.
    setupDb(
      [makeItem(1, 90)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob'), makeMember(1, 3, 'carol')],
      [makePayer(1, 1, 90, 'alice')],
    );
    const result = calculateSettlement(1);
    const alice = result.balances.find(b => b.user_id === 1)!;
    const bob = result.balances.find(b => b.user_id === 2)!;
    const carol = result.balances.find(b => b.user_id === 3)!;
    expect(alice.balance).toBe(60);
    expect(bob.balance).toBe(-30);
    expect(carol.balance).toBe(-30);
    expect(result.flows).toHaveLength(2);
  });

  it('all paid equally: all balances are zero, no flows', () => {
    // Item: $60. 3 members, each paid $20 and owes $20. Net: 0 for everyone.
    setupDb(
      [makeItem(1, 60)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob'), makeMember(1, 3, 'carol')],
      [makePayer(1, 1, 20, 'alice'), makePayer(1, 2, 20, 'bob'), makePayer(1, 3, 20, 'carol')],
    );
    const result = calculateSettlement(1);
    for (const b of result.balances) {
      expect(Math.abs(b.balance)).toBeLessThanOrEqual(0.01);
    }
    expect(result.flows).toHaveLength(0);
  });

  it('flow direction: from is debtor (owes), to is creditor (is owed)', () => {
    // Alice paid $100 for 2 people. Bob owes Alice $50.
    setupDb(
      [makeItem(1, 100)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob')],
      [makePayer(1, 1, 100, 'alice')],
    );
    const result = calculateSettlement(1);
    const flow = result.flows[0];
    expect(flow.from.username).toBe('bob');   // debtor
    expect(flow.to.username).toBe('alice');   // creditor
  });

  it('amounts are rounded to 2 decimal places', () => {
    // Item: $10. 3 members, 1 payer. Share = 3.333... Each rounded to 3.33.
    setupDb(
      [makeItem(1, 10)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob'), makeMember(1, 3, 'carol')],
      [makePayer(1, 1, 10, 'alice')],
    );
    const result = calculateSettlement(1);
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

  it('2 items with different payers: aggregates balances correctly', () => {
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
    const result = calculateSettlement(1);
    const alice = result.balances.find(b => b.user_id === 1)!;
    const bob = result.balances.find(b => b.user_id === 2)!;
    expect(alice.balance).toBe(20);
    expect(bob.balance).toBe(-20);
    expect(result.flows).toHaveLength(1);
    expect(result.flows[0].amount).toBe(20);
  });

  it('counts a settlement with no matching expense as an amount still to square up', () => {
    // bob paid alice 30 but every expense behind it was deleted: alice now owes bob.
    mockDb.db.prepare.mockImplementation((sql: string) => {
      if (sql.includes('FROM budget_settlements')) {
        return { all: vi.fn(() => [
          { id: 1, trip_id: 1, from_user_id: 2, to_user_id: 1, amount: 30, from_username: 'bob', to_username: 'alice', from_avatar: null, to_avatar: null },
        ]), get: vi.fn(), run: vi.fn() };
      }
      return { all: vi.fn(() => []), get: vi.fn(), run: vi.fn() };
    });
    const result = calculateSettlement(1);
    const alice = result.balances.find(b => b.user_id === 1)!;
    const bob = result.balances.find(b => b.user_id === 2)!;
    expect(bob.balance).toBe(30);
    expect(alice.balance).toBe(-30);
    expect(result.flows).toEqual([
      expect.objectContaining({ amount: 30, from: expect.objectContaining({ user_id: 1 }), to: expect.objectContaining({ user_id: 2 }) }),
    ]);
  });

  it('#1335 converts a foreign expense with the frozen exchange_rate, not live rates', () => {
    // $110 booked at a frozen rate of 1.1 (USD per 1 EUR) = 100 EUR. Live rates have since
    // drifted to 1.2, but the converted amount must stay on the frozen rate so an already
    // settled position isn't re-opened with a residual.
    setupDb(
      [{ ...makeItem(1, 110), currency: 'USD', exchange_rate: 1.1 } as BudgetItem],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob')],
      [makePayer(1, 1, 110, 'alice')],
    );
    const result = calculateSettlement(1, { base: 'EUR', tripCurrency: 'EUR', rates: { EUR: 1, USD: 1.2 } });
    const bob = result.balances.find(b => b.user_id === 2)!;
    // 110 / 1.1 = 100 EUR; Bob owes half = 50 (frozen). With the live 1.2 it would be ~45.83.
    expect(bob.balance).toBeCloseTo(-50, 2);
  });

  it('#1335 a legacy row (exchange_rate = 1) still converts with live rates', () => {
    setupDb(
      [{ ...makeItem(1, 120), currency: 'USD', exchange_rate: 1 } as BudgetItem],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob')],
      [makePayer(1, 1, 120, 'alice')],
    );
    const result = calculateSettlement(1, { base: 'EUR', tripCurrency: 'EUR', rates: { EUR: 1, USD: 1.2 } });
    const bob = result.balances.find(b => b.user_id === 2)!;
    // 120 / 1.2 (live) = 100 EUR; Bob owes 50 — unchanged behaviour for pre-#1335 rows.
    expect(bob.balance).toBeCloseTo(-50, 2);
  });

  it('#1445 a settle-up transfer with a frozen currency+rate keeps the position balanced when rates drift', () => {
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
    const result = calculateSettlement(1, { base: 'USD', tripCurrency: 'EUR', rates: { USD: 1, EUR: 0.5 } });
    const bob = result.balances.find(b => b.user_id === 2)!;
    expect(bob.balance).toBeCloseTo(0, 2); // settled — no residual re-opens
  });

  it('#1445 a legacy settle-up transfer (currency NULL) still converts with live rates', () => {
    // Same shape, but the transfer predates the fix (currency NULL). It is re-converted
    // to trip currency with live rates, so a drift re-opens the position — unchanged
    // legacy behaviour that normalises once the row is re-edited.
    setupDb(
      [makeItem(1, 100)],
      [makeMember(1, 1, 'alice'), makeMember(1, 2, 'bob')],
      [makePayer(1, 1, 100, 'alice')],
      [makeSettlementRow(1, 2, 1, 62.5, null, 1)],
    );
    const result = calculateSettlement(1, { base: 'USD', tripCurrency: 'EUR', rates: { USD: 1, EUR: 0.5 } });
    const bob = result.balances.find(b => b.user_id === 2)!;
    // settleToTrip(62.5) = 62.5 * 0.5 = 31.25 EUR; balance -50 + 31.25 = -18.75 EUR → reopens.
    expect(Math.abs(bob.balance)).toBeGreaterThan(1);
  });
});

// ── freezeForeignRate (write-path FX freeze, #1445) ───────────────────────────

describe('freezeForeignRate', () => {
  const tripRow = (currency: string) => ({
    get: vi.fn(() => ({ currency })), all: vi.fn(), run: vi.fn(),
  });

  it('freezes the live rate for a foreign currency into exchange_rate', async () => {
    mockDb.db.prepare.mockImplementation((sql: string) => {
      if (sql.includes('FROM trips')) return tripRow('EUR');
      return { get: vi.fn(), all: vi.fn(() => []), run: vi.fn() };
    });
    mockRates.getRates.mockResolvedValue({ EUR: 1, USD: 1.25 });
    const data: { currency?: string | null; exchange_rate?: number } = { currency: 'usd' };
    await freezeForeignRate(1, data);
    expect(mockRates.getRates).toHaveBeenCalledWith('EUR');
    expect(data.exchange_rate).toBe(1.25);
  });

  it('leaves the rate unset when the currency equals the trip currency', async () => {
    mockDb.db.prepare.mockImplementation((sql: string) =>
      sql.includes('FROM trips') ? tripRow('EUR') : { get: vi.fn(), all: vi.fn(() => []), run: vi.fn() });
    const data: { currency?: string | null; exchange_rate?: number } = { currency: 'EUR' };
    await freezeForeignRate(1, data);
    expect(mockRates.getRates).not.toHaveBeenCalled();
    expect(data.exchange_rate).toBeUndefined();
  });

  it('respects an explicit exchange_rate from the caller', async () => {
    const data: { currency?: string | null; exchange_rate?: number } = { currency: 'USD', exchange_rate: 2 };
    await freezeForeignRate(1, data);
    expect(mockRates.getRates).not.toHaveBeenCalled();
    expect(data.exchange_rate).toBe(2);
  });

  it('degrades to live rates (no freeze) when the rate fetch fails', async () => {
    mockDb.db.prepare.mockImplementation((sql: string) =>
      sql.includes('FROM trips') ? tripRow('EUR') : { get: vi.fn(), all: vi.fn(() => []), run: vi.fn() });
    mockRates.getRates.mockResolvedValue(null);
    const data: { currency?: string | null; exchange_rate?: number } = { currency: 'USD' };
    await freezeForeignRate(1, data);
    expect(data.exchange_rate).toBeUndefined();
  });

  it('does not re-freeze on update when the currency is unchanged', async () => {
    mockDb.db.prepare.mockImplementation((sql: string) => {
      if (sql.includes('FROM budget_items')) return { get: vi.fn(() => ({ currency: 'USD' })), all: vi.fn(), run: vi.fn() };
      if (sql.includes('FROM trips')) return tripRow('EUR');
      return { get: vi.fn(), all: vi.fn(() => []), run: vi.fn() };
    });
    const data: { currency?: string | null; exchange_rate?: number } = { currency: 'USD' };
    await freezeForeignRate(1, data, 9);
    expect(mockRates.getRates).not.toHaveBeenCalled();
    expect(data.exchange_rate).toBeUndefined();
  });

  it('does not re-freeze a settlement edit when its stored currency is unchanged (#1445)', async () => {
    mockDb.db.prepare.mockImplementation((sql: string) =>
      sql.includes('FROM trips') ? tripRow('EUR') : { get: vi.fn(), all: vi.fn(() => []), run: vi.fn() });
    const data: { currency?: string | null; exchange_rate?: number } = { currency: 'USD' };
    // the settlement already holds USD — pass it as existingCurrency → keep the frozen rate
    await freezeForeignRate(1, data, undefined, 'USD');
    expect(mockRates.getRates).not.toHaveBeenCalled();
    expect(data.exchange_rate).toBeUndefined();
  });

  it('re-freezes a settlement edit when its currency actually changes', async () => {
    mockDb.db.prepare.mockImplementation((sql: string) =>
      sql.includes('FROM trips') ? tripRow('EUR') : { get: vi.fn(), all: vi.fn(() => []), run: vi.fn() });
    mockRates.getRates.mockResolvedValue({ EUR: 1, USD: 1.25 });
    const data: { currency?: string | null; exchange_rate?: number } = { currency: 'USD' };
    await freezeForeignRate(1, data, undefined, 'GBP'); // was GBP → now USD → re-freeze
    expect(data.exchange_rate).toBe(1.25);
  });
});

// ── updateSettlement ──────────────────────────────────────────────────────────

describe('updateSettlement', () => {
  it('returns null when the settlement is not in the trip', () => {
    mockDb.db.prepare.mockImplementation((sql: string) => {
      if (sql.includes('SELECT id FROM budget_settlements')) {
        return { get: vi.fn(() => undefined), all: vi.fn(), run: vi.fn() };
      }
      return { get: vi.fn(), all: vi.fn(() => []), run: vi.fn() };
    });
    expect(updateSettlement(7, 1, { from_user_id: 2, to_user_id: 1, amount: 10 })).toBeNull();
  });

  it('updates the row (rounded to cents) and returns the refreshed settlement', () => {
    const run = vi.fn();
    mockDb.db.prepare.mockImplementation((sql: string) => {
      if (sql.includes('SELECT id FROM budget_settlements')) {
        return { get: vi.fn(() => ({ id: 7 })), all: vi.fn(), run: vi.fn() };
      }
      if (sql.includes('UPDATE budget_settlements')) {
        return { get: vi.fn(), all: vi.fn(), run };
      }
      if (sql.includes('FROM budget_settlements')) {
        return { get: vi.fn(), all: vi.fn(() => [
          { id: 7, trip_id: 1, from_user_id: 2, to_user_id: 1, amount: 10.13, from_username: 'bob', to_username: 'alice', from_avatar: null, to_avatar: null },
        ]), run: vi.fn() };
      }
      return { get: vi.fn(), all: vi.fn(() => []), run: vi.fn() };
    });

    const res = updateSettlement(7, 1, { from_user_id: 2, to_user_id: 1, amount: 10.126 });
    // from, to, rounded amount, currency-flag(0)/value(null), rate-flag(null)/value(1), id.
    // No currency/exchange_rate passed → both CASE guards keep the existing columns.
    expect(run).toHaveBeenCalledWith(2, 1, 10.13, 0, null, null, 1, 7);
    expect(res).toMatchObject({ id: 7, from_user_id: 2, to_user_id: 1, amount: 10.13 });
  });
});
