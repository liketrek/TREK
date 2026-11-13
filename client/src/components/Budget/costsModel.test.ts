import { describe, expect, it } from 'vitest';

import { buildBudgetItem } from '../../../tests/helpers/factories';
import type { BudgetItem } from '../../types';
import {
  buildCostsCsv,
  computeTotals,
  currencyOptions,
  filterBudgetItems,
  isPlainSplit,
  myShareOf,
  paymentAmount,
  paymentLineOf,
  settledShareOf,
  showsSplitting,
  type CostsCtx,
  type CostsFilterState,
  type CostsSettlement,
} from './costsModel';

// FE-BUDGET-COSTSMODEL-001 to FE-BUDGET-COSTSMODEL-013
// The pieces both ledgers share since the desktop panel runs on this model too;
// the rest of the model is pinned in tests/unit/mobile/trip/costsModel.test.ts.

const RATES: Record<string, number> = { EUR: 1, USD: 0.5 };

const ctx: CostsCtx = {
  me: 1,
  tripCurrency: 'EUR',
  displayCurrency: 'EUR',
  convert: (amount, currency) => amount * (RATES[(currency || 'EUR').toUpperCase()] ?? 1),
};

type Member = NonNullable<BudgetItem['members']>[number];
type Payer = NonNullable<BudgetItem['payers']>[number];

const member = (user_id: number): Member => ({ user_id, paid: 0, username: `u${user_id}` });
const payer = (user_id: number, amount: number): Payer => ({ user_id, amount, username: `u${user_id}` });
const expense = (overrides: Partial<BudgetItem> = {}) => buildBudgetItem({ category: 'other', ...overrides });
const filters = (overrides: Partial<CostsFilterState> = {}): CostsFilterState => ({
  search: '',
  segment: 'all',
  categoryKey: '',
  dayKey: '',
  ...overrides,
});
const payment = (overrides: Partial<CostsSettlement> = {}): CostsSettlement => ({
  id: 1,
  from_user_id: 1,
  to_user_id: 2,
  amount: 10,
  currency: null,
  ...overrides,
});

// Nobody paid this one yet, and I am in its split.
const unfinished = () => expense({ id: 4, total_price: 80, members: [member(1), member(2)], payers: [] });
// Bob paid this one in full, and I am in its split.
const paidByBob = () => expense({ id: 6, total_price: 40, members: [member(1), member(2)], payers: [payer(2, 40)] });

describe('costsModel: the share of an unfinished expense', () => {
  it('FE-BUDGET-COSTSMODEL-001: settledShareOf leaves an expense nobody paid out, myShareOf counts it (#2225)', () => {
    expect(myShareOf(unfinished(), ctx)).toBe(40);
    expect(settledShareOf(unfinished(), ctx)).toBe(0);
    expect(settledShareOf(paidByBob(), ctx)).toBe(20);
  });

  it('FE-BUDGET-COSTSMODEL-002: computeTotals counts my share with the share rule it is given', () => {
    const items = [unfinished(), paidByBob()];
    expect(computeTotals(items, [], ctx).myShare).toBe(60);
    expect(computeTotals(items, [], ctx, settledShareOf).myShare).toBe(20);
    expect(computeTotals(items, [], ctx, settledShareOf).outstanding).toBe(80);
  });

  it('FE-BUDGET-COSTSMODEL-003: the "owed" filter nets what I paid against the share rule it is given', () => {
    // A refund nobody has been named the recipient of yet: my share of it is negative.
    const refund = expense({ id: 5, total_price: -80, members: [member(1), member(2)], payers: [] });
    const iPaid = expense({ id: 8, total_price: 30, members: [member(1), member(2)], payers: [payer(1, 30)] });
    const items = [refund, iPaid];
    expect(filterBudgetItems(items, filters({ segment: 'owed' }), ctx).map((e) => e.id)).toEqual([5, 8]);
    expect(filterBudgetItems(items, filters({ segment: 'owed' }), ctx, settledShareOf).map((e) => e.id)).toEqual([8]);
  });
});

describe('costsModel: recorded payments', () => {
  it('FE-BUDGET-COSTSMODEL-004: a payment converts at the rate frozen when it was settled (#1445)', () => {
    expect(paymentAmount(payment({ amount: 10, currency: 'USD', exchange_rate: 2 }), ctx)).toBe(5);
    // No frozen rate: today's rate.
    expect(paymentAmount(payment({ amount: 10, currency: 'usd' }), ctx)).toBe(5);
  });

  it('FE-BUDGET-COSTSMODEL-005: a legacy payment without a currency was entered in the display currency', () => {
    const inUsd: CostsCtx = { ...ctx, displayCurrency: 'USD' };
    // Entered in the display currency, it reads as entered (#2965).
    expect(paymentAmount(payment({ amount: 10, currency: null }), inUsd)).toBe(10);
    expect(paymentAmount(payment({ amount: 10, currency: null }), ctx)).toBe(10);
  });

  it('FE-BUDGET-COSTSMODEL-006: the line under a payment explains it the way an expense is explained (#2525)', () => {
    expect(paymentLineOf(payment({ amount: 10, currency: 'EUR' }), ctx, 10)).toBeNull();
    expect(paymentLineOf(payment({ amount: 10, currency: 'usd' }), ctx, 5)).toEqual({
      entered: { amount: 10, currency: 'USD' },
      into: { amount: 5, currency: 'EUR' },
    });
  });
});

describe('costsModel: the CSV currency column', () => {
  const t = (key: string) => key;
  const rows = (currencyOf?: (e: BudgetItem) => string) =>
    buildCostsCsv([expense({ name: 'Taxi', total_price: 12, currency: 'usd', expense_date: '2026-07-01' })], {
      base: 'EUR',
      ctx,
      locale: 'en-US',
      t,
      currencyOf,
    }).content.split('\r\n');

  it('FE-BUDGET-COSTSMODEL-007: by default the currency is normalised to upper case', () => {
    expect(rows()[1].split(';')[4]).toBe('USD');
  });

  it('FE-BUDGET-COSTSMODEL-008: a caller can write each expense currency as stored', () => {
    expect(rows((e) => e.currency || ctx.tripCurrency)[1].split(';')[4]).toBe('usd');
  });
});

describe('costsModel: the currency picker options', () => {
  it('FE-BUDGET-COSTSMODEL-009: labels a supported currency with its code and symbol', () => {
    const eur = currencyOptions('EUR').find((o) => o.value === 'EUR');
    expect(eur).toEqual({ value: 'EUR', label: 'EUR  €' });
    expect(currencyOptions('EUR').filter((o) => o.value === 'EUR')).toHaveLength(1);
  });

  it('FE-BUDGET-COSTSMODEL-010: keeps a retired currency selectable, labelled by its code alone', () => {
    const opts = currencyOptions('bgn');
    expect(opts[opts.length - 1]).toEqual({ value: 'BGN', label: 'BGN' });
    expect(currencyOptions(null).some((o) => o.value === 'BGN')).toBe(false);
  });

  it('FE-BUDGET-COSTSMODEL-011: pinned currencies lead in the order given, each listed once (#2807)', () => {
    const values = currencyOptions('EUR', ['jpy', 'EUR', 'JPY']).map((o) => o.value);
    expect(values.slice(0, 2)).toEqual(['JPY', 'EUR']);
    expect(values.filter((v) => v === 'JPY')).toHaveLength(1);
    expect(values).toHaveLength(currencyOptions('EUR').length);
    // A pin the picker cannot offer is left out rather than invented.
    expect(currencyOptions(null, ['ZZZ']).some((o) => o.value === 'ZZZ')).toBe(false);
  });
});

describe('costsModel: when Costs shows who paid and the shares (#2689)', () => {
  const settled = { flows: [], balances: [] };

  it('FE-BUDGET-COSTSMODEL-012: a trip of one has nothing to split, unless the ledger still names someone else', () => {
    const mine = expense({ payers: [payer(1, 20)], members: [member(1)] });
    expect(showsSplitting(2, [], null, 1)).toBe(true);
    expect(showsSplitting(1, [mine], settled, 1)).toBe(false);
    expect(showsSplitting(0, [], null, 1)).toBe(false);
    // Someone who left: named on an expense, owed money, or still in a transfer.
    expect(showsSplitting(1, [expense({ members: [member(1), member(9)] })], settled, 1)).toBe(true);
    const owed = { flows: [], balances: [{ user_id: 9, username: 'u9', avatar_url: null, balance: 5 }] };
    expect(showsSplitting(1, [mine], owed, 1)).toBe(true);
    const flow = { from: { user_id: 9, username: 'u9' }, to: { user_id: 1, username: 'u1' }, amount: 5 };
    expect(showsSplitting(1, [mine], { flows: [flow], balances: [] }, 1)).toBe(true);
  });

  it('FE-BUDGET-COSTSMODEL-013: a split is plain with one payer, equal shares, no receipt lines and only current members', () => {
    expect(isPlainSplit(null, [1])).toBe(true);
    expect(isPlainSplit(expense({ payers: [payer(1, 20)], members: [member(1)] }), [1])).toBe(true);
    expect(isPlainSplit(expense({ payers: [payer(1, 10), payer(2, 10)], members: [] }), [1, 2])).toBe(false);
    expect(isPlainSplit(expense({ members: [{ ...member(1), amount: 15 }] }), [1])).toBe(false);
    expect(isPlainSplit(expense({ ticket_json: '{"items":[]}', members: [member(1)] }), [1])).toBe(false);
    expect(isPlainSplit(expense({ payers: [payer(9, 20)], members: [] }), [1])).toBe(false);
  });
});
