import { describe, it, expect } from 'vitest';
import {
  baseTotal,
  buildCostsCsv,
  categoryBreakdown,
  categoryFilterKeys,
  computeTotals,
  currencyOf,
  dayFilterKeys,
  filterBudgetItems,
  filterSettlements,
  groupByDay,
  groupLedgerByDay,
  isUnfinished,
  memberShareOf,
  myPaidOf,
  myShareOf,
  tint,
  type CostsCtx,
  type CostsFilterState,
  type CostsSettlement,
  type CostsSettlementFlow,
} from '../../../../src/mobile/screens/trip/tabs/costsModel';
import { buildBudgetItem } from '../../../helpers/factories';
import type { BudgetItem } from '../../../../src/types';

// FE-MOB-CMOD-001 to FE-MOB-CMOD-027

const RATES: Record<string, number> = { EUR: 1, USD: 0.5, JPY: 0.01 };

const ctx: CostsCtx = {
  me: 1,
  // lower case on purpose — currencyOf has to normalise it
  tripCurrency: 'eur',
  convert: (amount, currency) => amount * (RATES[(currency || 'EUR').toUpperCase()] ?? 1),
};

type Member = NonNullable<BudgetItem['members']>[number];
type Payer = NonNullable<BudgetItem['payers']>[number];

function member(user_id: number, amount?: number | null): Member {
  return { user_id, paid: 0, username: `u${user_id}`, ...(amount === undefined ? {} : { amount }) };
}

function payer(user_id: number, amount: number): Payer {
  return { user_id, amount, username: `u${user_id}` };
}

function settlement(overrides: Partial<CostsSettlement> = {}): CostsSettlement {
  return { id: 1, from_user_id: 1, to_user_id: 2, amount: 10, currency: null, created_at: '2026-07-01T10:00:00Z', ...overrides };
}

function expense(overrides: Partial<BudgetItem> = {}): BudgetItem {
  return buildBudgetItem({ category: 'other', ...overrides });
}

function filters(overrides: Partial<CostsFilterState> = {}): CostsFilterState {
  return { search: '', segment: 'all', categoryKey: '', dayKey: '', ...overrides };
}

describe('costsModel — money maths', () => {
  it('FE-MOB-CMOD-001: uppercases the expense currency and falls back to the trip currency', () => {
    expect(currencyOf(expense({ currency: 'usd' }), ctx)).toBe('USD');
    expect(currencyOf(expense({ currency: null }), ctx)).toBe('EUR');
    expect(currencyOf(expense({ currency: '' }), ctx)).toBe('EUR');
  });

  it('FE-MOB-CMOD-002: converts the expense total into the base currency', () => {
    expect(baseTotal(expense({ total_price: 100, currency: 'USD' }), ctx)).toBe(50);
    expect(baseTotal(expense({ total_price: 100, currency: null }), ctx)).toBe(100);
    expect(baseTotal(expense({ total_price: 0 }), ctx)).toBe(0);
  });

  it('FE-MOB-CMOD-003: myPaidOf only sums my own payer rows, converted', () => {
    const e = expense({ total_price: 100, currency: 'USD', payers: [payer(1, 60), payer(2, 40)] });
    expect(myPaidOf(e, ctx)).toBe(30);
    expect(myPaidOf(expense({ payers: [payer(2, 40)] }), ctx)).toBe(0);
    expect(myPaidOf(expense({ payers: undefined }), ctx)).toBe(0);
  });

  it('FE-MOB-CMOD-004: memberShareOf prefers an explicit custom amount', () => {
    const e = expense({
      total_price: 100,
      currency: 'USD',
      members: [member(1, 70), member(2, 30)],
    });
    expect(memberShareOf(e, 1, ctx)).toBe(35);
    expect(memberShareOf(e, 2, ctx)).toBe(15);
  });

  it('FE-MOB-CMOD-005: an explicit zero share is honoured instead of falling back to the equal split', () => {
    const e = expense({ id: 3, total_price: 100, members: [member(1, 0), member(2, 100)] });
    expect(memberShareOf(e, 1, ctx)).toBe(0);
  });

  it('FE-MOB-CMOD-006: memberShareOf falls back to the rotating equal split', () => {
    // id 3 % 3 members = rotation index 0, so user 1 carries the leftover cent
    const e = expense({ id: 3, total_price: 100, members: [member(1), member(2), member(3)] });
    expect(memberShareOf(e, 1, ctx)).toBe(33.34);
    expect(memberShareOf(e, 2, ctx)).toBe(33.33);
    expect(memberShareOf(e, 3, ctx)).toBe(33.33);
  });

  it('FE-MOB-CMOD-025: a zero-total expense splits into zero shares', () => {
    const e = expense({ id: 2, total_price: 0, members: [member(1), member(2)] });
    expect(memberShareOf(e, 1, ctx)).toBe(0);
  });

  it('FE-MOB-CMOD-007: a non-participant has no share', () => {
    const e = expense({ total_price: 100, members: [member(2), member(3)] });
    expect(memberShareOf(e, 1, ctx)).toBe(0);
    expect(memberShareOf(expense({ members: undefined }), 1, ctx)).toBe(0);
  });

  it('FE-MOB-CMOD-008: myShareOf resolves the share of ctx.me', () => {
    const e = expense({ id: 4, total_price: 80, currency: 'USD', members: [member(1), member(2)] });
    expect(myShareOf(e, ctx)).toBe(20);
    expect(myShareOf(e, ctx)).toBe(memberShareOf(e, 1, ctx));
  });

  it('FE-MOB-CMOD-009: isUnfinished flags totals nobody has actually paid', () => {
    expect(isUnfinished(expense({ total_price: 100, payers: [] }), ctx)).toBe(true);
    expect(isUnfinished(expense({ total_price: 100, payers: [payer(1, 0)] }), ctx)).toBe(true);
    expect(isUnfinished(expense({ total_price: 100, payers: undefined }), ctx)).toBe(true);
    expect(isUnfinished(expense({ total_price: 100, payers: [payer(1, 100)] }), ctx)).toBe(false);
    expect(isUnfinished(expense({ total_price: 0, payers: [] }), ctx)).toBe(false);
  });

  it('FE-MOB-CMOD-030: isUnfinished flags a payer-less refund the same way (#2176)', () => {
    expect(isUnfinished(expense({ total_price: -100, payers: [] }), ctx)).toBe(true);
    // A negative payer is the refund's recipient — the entry is settled.
    expect(isUnfinished(expense({ total_price: -100, payers: [payer(1, -100)] }), ctx)).toBe(false);
  });
});

describe('costsModel — computeTotals', () => {
  it('FE-MOB-CMOD-010: aggregates spend, my paid/share, settlement direction and outstanding', () => {
    const paid = expense({
      id: 10,
      total_price: 100,
      payers: [payer(1, 100)],
      members: [member(1), member(2)],
    });
    const unpaid = expense({
      id: 11,
      total_price: 50,
      currency: 'USD',
      payers: [],
      members: [member(2, 50)],
    });
    const flows: CostsSettlementFlow[] = [
      { from: { user_id: 1, username: 'me' }, to: { user_id: 2, username: 'ada' }, amount: 20 },
      { from: { user_id: 3, username: 'bo' }, to: { user_id: 1, username: 'me' }, amount: 5 },
      { from: { user_id: 2, username: 'ada' }, to: { user_id: 3, username: 'bo' }, amount: 7 },
    ];

    expect(computeTotals([paid, unpaid], flows, ctx)).toEqual({
      totalSpend: 125,
      myPaid: 100,
      myShare: 50,
      owe: 20,
      owed: 5,
      outstanding: 25,
      outstandingCount: 1,
    });
  });

  it('FE-MOB-CMOD-011: returns zeroes for an empty trip', () => {
    expect(computeTotals([], [], ctx)).toEqual({
      totalSpend: 0,
      myPaid: 0,
      myShare: 0,
      owe: 0,
      owed: 0,
      outstanding: 0,
      outstandingCount: 0,
    });
  });
});

describe('costsModel — list filters and grouping', () => {
  // e1: I fronted it and am net owed. e2: someone else paid. e3: I paid exactly my own share.
  const e1 = expense({
    id: 20,
    name: 'Hotel Berlin',
    category: 'accommodation',
    expense_date: '2026-07-01',
    total_price: 100,
    payers: [payer(1, 100)],
    members: [member(1), member(2)],
  });
  const e2 = expense({
    id: 21,
    name: 'Sushi',
    category: 'food',
    expense_date: '2026-07-02',
    total_price: 60,
    payers: [payer(2, 60)],
    members: [member(1), member(2)],
  });
  const e3 = expense({
    id: 22,
    name: 'Museum ticket',
    category: 'activities',
    expense_date: null,
    total_price: 30,
    payers: [payer(1, 30)],
    members: [member(1)],
  });
  const all = [e1, e2, e3];

  it('FE-MOB-CMOD-012: "all" keeps every expense and does not mutate the input', () => {
    const result = filterBudgetItems(all, filters(), ctx);
    expect(result).toEqual(all);
    expect(result).not.toBe(all);
  });

  it('FE-MOB-CMOD-013: "mine" keeps expenses I fronted money on', () => {
    expect(filterBudgetItems(all, filters({ segment: 'mine' }), ctx).map(e => e.id)).toEqual([20, 22]);
  });

  it('FE-MOB-CMOD-014: "owed" keeps expenses where I am net owed', () => {
    expect(filterBudgetItems(all, filters({ segment: 'owed' }), ctx).map(e => e.id)).toEqual([20]);
  });

  it('FE-MOB-CMOD-015: category, day and search narrow the list and combine', () => {
    expect(filterBudgetItems(all, filters({ categoryKey: 'food' }), ctx).map(e => e.id)).toEqual([21]);
    expect(filterBudgetItems(all, filters({ dayKey: '2026-07-02' }), ctx).map(e => e.id)).toEqual([21]);
    // search is trimmed and case-insensitive
    expect(filterBudgetItems(all, filters({ search: '  HOTEL ' }), ctx).map(e => e.id)).toEqual([20]);
    expect(filterBudgetItems(all, filters({ search: 'nothing' }), ctx)).toEqual([]);
    expect(
      filterBudgetItems(all, filters({ segment: 'mine', categoryKey: 'accommodation' }), ctx).map(e => e.id),
    ).toEqual([20]);
  });

  it('FE-MOB-CMOD-016: groupByDay sorts newest first and sinks the no-date bucket', () => {
    const a = expense({ id: 30, expense_date: '2026-07-01' });
    const b = expense({ id: 31, expense_date: '2026-07-03' });
    const c = expense({ id: 32, expense_date: null });
    const d = expense({ id: 33, expense_date: '2026-07-01' });

    expect(groupByDay([a, b, c, d])).toEqual([
      { dateKey: '2026-07-03', items: [b] },
      { dateKey: '2026-07-01', items: [a, d] },
      { dateKey: '', items: [c] },
    ]);
    expect(groupByDay([])).toEqual([]);
  });

  it('FE-MOB-CMOD-026: groupByDay sinks the no-date bucket even when it comes first', () => {
    const undated = expense({ id: 34, expense_date: null });
    const mid = expense({ id: 35, expense_date: '2026-07-02' });
    const late = expense({ id: 36, expense_date: '2026-07-04' });

    expect(groupByDay([undated, mid, late]).map(g => g.dateKey)).toEqual(['2026-07-04', '2026-07-02', '']);
  });

  it('FE-MOB-CMOD-017: categoryFilterKeys lists only used categories, in canonical order', () => {
    const items = [
      expense({ category: 'food' }),
      expense({ category: 'accommodation' }),
      // legacy free-text value that catMeta folds into "flights"
      expense({ category: 'Flight' }),
      expense({ category: 'food' }),
    ];
    expect(categoryFilterKeys(items)).toEqual(['accommodation', 'food', 'flights']);
    expect(categoryFilterKeys([])).toEqual([]);
  });

  it('FE-MOB-CMOD-018: dayFilterKeys returns distinct dates ascending, ignoring undated rows', () => {
    const items = [
      expense({ expense_date: '2026-07-03' }),
      expense({ expense_date: null }),
      expense({ expense_date: '2026-07-01' }),
      expense({ expense_date: '2026-07-01' }),
    ];
    expect(dayFilterKeys(items)).toEqual(['2026-07-01', '2026-07-03']);
  });

  it('FE-MOB-CMOD-029: filterSettlements hides settlements when a search or category filter is active — they have neither', () => {
    const list = [settlement()];
    expect(filterSettlements(list, filters({ search: 'x' }), 1)).toEqual([]);
    expect(filterSettlements(list, filters({ categoryKey: 'food' }), 1)).toEqual([]);
  });

  it('FE-MOB-CMOD-030: filterSettlements excludes them under "owed" and keeps only mine under "mine"', () => {
    const mine = settlement({ id: 1, from_user_id: 1, to_user_id: 2 });
    const others = settlement({ id: 2, from_user_id: 2, to_user_id: 3 });
    const list = [mine, others];
    expect(filterSettlements(list, filters({ segment: 'owed' }), 1)).toEqual([]);
    expect(filterSettlements(list, filters({ segment: 'mine' }), 1).map(s => s.id)).toEqual([1]);
    expect(filterSettlements(list, filters({ segment: 'all' }), 1).map(s => s.id)).toEqual([1, 2]);
  });

  it('FE-MOB-CMOD-031: filterSettlements narrows by the recorded day', () => {
    const a = settlement({ id: 1, created_at: '2026-07-01T09:00:00Z' });
    const b = settlement({ id: 2, created_at: '2026-07-02T09:00:00Z' });
    expect(filterSettlements([a, b], filters({ dayKey: '2026-07-02' }), 1).map(s => s.id)).toEqual([2]);
  });
});

describe('costsModel — ledger grouping (expenses + settlement payments)', () => {
  it('FE-MOB-CMOD-032: merges expenses and payments into shared day groups, newest first, no-date last', () => {
    const e = expense({ id: 50, expense_date: '2026-07-02' });
    const undatedExpense = expense({ id: 51, expense_date: null });
    const s = settlement({ id: 1, created_at: '2026-07-03T12:00:00Z' });

    const groups = groupLedgerByDay([e, undatedExpense], [s]);

    expect(groups.map(g => g.dateKey)).toEqual(['2026-07-03', '2026-07-02', '']);
    expect(groups[0].entries).toEqual([{ kind: 'payment', date: '2026-07-03', settlement: s }]);
    expect(groups[1].entries).toEqual([{ kind: 'expense', date: '2026-07-02', item: e }]);
    expect(groups[2].entries).toEqual([{ kind: 'expense', date: '', item: undatedExpense }]);
  });

  it('FE-MOB-CMOD-033: a payment recorded the same day as an expense lands in that same group', () => {
    const e = expense({ id: 52, expense_date: '2026-07-05' });
    const s = settlement({ id: 2, created_at: '2026-07-05T08:00:00Z' });

    expect(groupLedgerByDay([e], [s])).toEqual([{
      dateKey: '2026-07-05',
      entries: [
        { kind: 'expense', date: '2026-07-05', item: e },
        { kind: 'payment', date: '2026-07-05', settlement: s },
      ],
    }]);
  });

  it('FE-MOB-CMOD-034: a payment on a day with no expense still creates its own day group', () => {
    const s = settlement({ id: 3, created_at: '2026-07-09T08:00:00Z' });
    expect(groupLedgerByDay([], [s])).toEqual([{ dateKey: '2026-07-09', entries: [{ kind: 'payment', date: '2026-07-09', settlement: s }] }]);
  });

  it('FE-MOB-CMOD-035: empty inputs produce no groups', () => {
    expect(groupLedgerByDay([], [])).toEqual([]);
  });
});

describe('costsModel — breakdown and presentation', () => {
  it('FE-MOB-CMOD-019: categoryBreakdown sorts by amount and scales the bars against the largest', () => {
    const items = [
      expense({ category: 'accommodation', total_price: 300 }),
      expense({ category: 'food', total_price: 100 }),
      expense({ category: 'food', total_price: 200, currency: 'USD' }),
      expense({ category: 'transport', total_price: 0 }),
    ];
    const bars = categoryBreakdown(items, ctx);

    expect(bars.map(b => b.key)).toEqual(['accommodation', 'food']);
    expect(bars[0]).toEqual({ key: 'accommodation', amount: 300, widthPct: 100 });
    expect(bars[1].amount).toBe(200);
    expect(bars[1].widthPct).toBeCloseTo(66.667, 3);
  });

  it('FE-MOB-CMOD-020: categoryBreakdown drops categories without spend', () => {
    expect(categoryBreakdown([], ctx)).toEqual([]);
    expect(categoryBreakdown([expense({ category: 'food', total_price: 0 })], ctx)).toEqual([]);
  });

  it('FE-MOB-CMOD-031: categoryBreakdown nets refunds and keeps a net-negative category bar-less (#2176)', () => {
    const items = [
      expense({ category: 'food', total_price: 90 }),
      expense({ category: 'food', total_price: -30 }),
      expense({ category: 'activities', total_price: -20 }),
    ];
    const bars = categoryBreakdown(items, ctx);

    // Food nets 90 − 30 = 60 and carries the (full) bar; the fully refunded
    // category keeps its own row at the bottom, without a bar — a negative CSS
    // width would be dropped and paint a full one.
    expect(bars).toEqual([
      { key: 'food', amount: 60, widthPct: 100 },
      { key: 'activities', amount: -20, widthPct: 0 },
    ]);
  });

  it('FE-MOB-CMOD-032: an all-negative breakdown renders rows but no bars (#2176)', () => {
    const bars = categoryBreakdown([expense({ category: 'food', total_price: -20 })], ctx);
    expect(bars).toEqual([{ key: 'food', amount: -20, widthPct: 0 }]);
  });

  it('FE-MOB-CMOD-021: tint turns a hex colour into rgba, with or without the leading hash', () => {
    expect(tint('#8B5CF6', 0.3)).toBe('rgba(139, 92, 246, 0.3)');
    expect(tint('000000', 1)).toBe('rgba(0, 0, 0, 1)');
  });
});

describe('costsModel — CSV export', () => {
  const t = (key: string) => key;

  it('FE-MOB-CMOD-022: builds a semicolon CSV sorted by date with per-currency decimals', () => {
    const items = [
      expense({
        id: 40,
        name: 'Ryokan',
        category: 'accommodation',
        expense_date: '2026-07-16',
        total_price: 1500,
        currency: 'JPY',
        note: 'paid cash',
      }),
      expense({
        id: 41,
        name: 'Coffee',
        category: 'food',
        expense_date: '2026-07-15',
        total_price: 4.5,
        currency: null,
        note: null,
      }),
    ];

    const { filename, content } = buildCostsCsv(items, {
      base: 'EUR',
      ctx,
      locale: 'en-US',
      tripTitle: 'Trip: Tokyo/2026!',
      t,
    });

    const rows = content.split('\r\n');
    expect(rows[0]).toBe('Date;Name;Category;Amount;Currency;Amount (EUR);Note');
    expect(rows[1]).toBe('07/15/2026;Coffee;costs.cat.food;4.50;EUR;4.50;');
    // JPY is a zero-decimal currency, the base column stays at 2
    expect(rows[2]).toBe('07/16/2026;Ryokan;costs.cat.accommodation;1500;JPY;15.00;paid cash');
    expect(filename).toBe('costs-Trip Tokyo2026.csv');
  });

  it('FE-MOB-CMOD-023: escapes separators, quotes and newlines, and drops ticket JSON notes', () => {
    const items = [
      expense({
        id: 42,
        name: 'Dinner; drinks',
        category: 'food',
        expense_date: '',
        total_price: 20,
        note: 'say "hi"\nlater',
      }),
      expense({
        id: 43,
        name: 'Tickets',
        category: 'activities',
        expense_date: null,
        total_price: 10,
        note: 'TICKETJSON:{"items":[]}',
      }),
    ];

    const { content, filename } = buildCostsCsv(items, {
      base: 'EUR',
      ctx,
      locale: 'en-US',
      tripTitle: null,
      t,
    });

    const rows = content.split('\r\n');
    expect(rows[1]).toContain('"Dinner; drinks"');
    expect(rows[1]).toContain('"say ""hi""\nlater"');
    // undated rows keep an empty date cell
    expect(rows[1].startsWith(';')).toBe(true);
    expect(rows[2].endsWith(';')).toBe(true);
    expect(filename).toBe('costs-trip.csv');
  });

  it('FE-MOB-CMOD-028: prefixes formula-leading names and notes so spreadsheets keep them as text', () => {
    const items = [
      expense({
        id: 46,
        name: '=HYPERLINK("http://evil","click")',
        category: 'food',
        expense_date: null,
        total_price: 5,
        note: '@SUM(A1:A9)',
      }),
      expense({ id: 47, name: '-12 refund', category: 'other', expense_date: null, total_price: 5 }),
    ];

    const { content } = buildCostsCsv(items, { base: 'EUR', ctx, locale: 'en-US', tripTitle: null, t });

    const rows = content.split('\r\n');
    // The quote inside the name still forces the field to be quoted around the apostrophe.
    expect(rows[1]).toContain(`"'=HYPERLINK(""http://evil"",""click"")"`);
    expect(rows[1]).toContain("'@SUM(A1:A9)");
    expect(rows[2]).toContain("'-12 refund");
    // Numbers never go through the escaper, so the amount columns stay parseable.
    expect(rows[2]).toContain(';5.00;EUR;5.00;');
  });

  it('FE-MOB-CMOD-024: falls back to the raw ISO date when the locale is unusable', () => {
    const { content } = buildCostsCsv(
      [expense({ id: 44, name: 'Bus', category: 'transport', expense_date: '2026-07-16', total_price: 3 })],
      { base: 'EUR', ctx, locale: '!!', t },
    );
    expect(content.split('\r\n')[1].startsWith('2026-07-16;Bus;')).toBe(true);
  });

  it('FE-MOB-CMOD-027: an expense without a recorded total exports as zero', () => {
    const bare = expense({ id: 45, name: 'Placeholder', category: 'other', expense_date: null });
    const { content } = buildCostsCsv([{ ...bare, total_price: undefined } as unknown as BudgetItem], {
      base: 'EUR',
      ctx,
      locale: 'en-US',
      t,
    });
    expect(content.split('\r\n')[1]).toBe(';Placeholder;costs.cat.other;0.00;EUR;0.00;');
  });
});
