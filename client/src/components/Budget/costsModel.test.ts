import { describe, expect, it } from 'vitest';

import { buildBudgetItem } from '../../../tests/helpers/factories';
import type { BudgetItem } from '../../types';
import {
  buildCostsCsv,
  computeTotals,
  currencyOptions,
  filterBudgetItems,
  myShareOf,
  paymentAmount,
  paymentLineOf,
  settledShareOf,
  type CostsCtx,
  type CostsFilterState,
  type CostsSettlement,
} from './costsModel';

// FE-BUDGET-COSTSMODEL-001 to FE-BUDGET-COSTSMODEL-010
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
    expect(paymentAmount(payment({ amount: 10, currency: null }), inUsd)).toBe(5);
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
});
