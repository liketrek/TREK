import { ASSISTANT_CHANGE_VERB_KEYS, assistantAppliedSchema, assistantChangePreviewSchema } from '../assistant.schema';
import { BUDGET_APPLIED_ENTITIES, BUDGET_CARD_SCHEMAS, BUDGET_VERB_KEYS } from './budget.contract';
import { costPerPersonCardSchema, type CostPerPersonCard } from './cost-per-person.card';
import { EXPENSE_PEOPLE_MAX, expensesCardSchema, type CardExpense, type ExpensesCard } from './expenses.card';
import { storedTrekCardSchema, trekCardSchema } from './index';
import { paymentsCardSchema, type PaymentsCard } from './payments.card';
import { settlementCardSchema, type SettlementCard } from './settlement.card';

import { describe, expect, it } from 'vitest';

const ana = { id: 7, name: 'Ana', avatarKey: 'ana.png' };
const ben = { id: 8, name: 'Ben', avatarKey: null };

const dinner: CardExpense = {
  id: 31,
  name: 'Dinner at Lokanta',
  category: 'food',
  amount: { amount: 84, currency: 'EUR' },
  tripAmount: null,
  date: '2026-06-03',
  place: { id: 12, name: 'Lokanta' },
  payers: [{ person: ana, amount: 84 }],
  split: 'equal',
  shares: [
    { person: ana, amount: 42, paid: true },
    { person: ben, amount: 42, paid: false },
  ],
  moreShares: 0,
  note: null,
  receipts: 2,
  before: null,
  highlight: [],
  change: 'none',
};

const expenses: ExpensesCard = {
  kind: 'expenses',
  rows: [dinner],
  offset: 0,
  more: 13,
  total: { amount: 1204.5, currency: 'EUR' },
  unconverted: 1,
};

const payments: PaymentsCard = {
  kind: 'payments',
  rows: [
    {
      id: null,
      from: ben,
      to: ana,
      amount: { amount: 42.5, currency: 'EUR' },
      date: '2026-06-07',
      note: 'Bank transfer',
      before: { from: ana, to: null, amount: { amount: 40, currency: 'EUR' } },
      change: 'changed',
    },
  ],
  more: 0,
};

const settlement: SettlementCard = {
  kind: 'settlement',
  currency: 'EUR',
  flows: [{ from: ben, to: ana, amount: 42.5 }],
  moreFlows: 0,
  balances: [
    { person: ana, balance: 42.5 },
    { person: ben, balance: -42.5 },
  ],
  moreBalances: 0,
  recorded: 3,
  unconverted: { entries: 2, currencies: ['USD'] },
};

const perPerson: CostPerPersonCard = {
  kind: 'costPerPerson',
  currency: 'EUR',
  rows: [{ person: ana, share: 69, paid: 45, count: 2 }],
  more: 0,
};

describe('budget cards', () => {
  it('CARDS-BUD-001: the four kinds join the card union and read back as built', () => {
    expect(BUDGET_CARD_SCHEMAS).toEqual([
      expensesCardSchema,
      paymentsCardSchema,
      settlementCardSchema,
      costPerPersonCardSchema,
    ]);
    for (const card of [expenses, payments, settlement, perPerson]) {
      expect(trekCardSchema.parse(card)).toEqual(card);
      expect(storedTrekCardSchema.parse(card)).toEqual(card);
    }
  });

  it('CARDS-BUD-002: a waiting change states what it replaces and whom it is about', () => {
    const update: CardExpense = {
      ...dinner,
      amount: { amount: 96, currency: 'EUR' },
      before: { name: null, amount: { amount: 84, currency: 'EUR' }, category: null, date: null, split: 'custom' },
      highlight: [8],
      change: 'changed',
    };
    expect(expensesCardSchema.parse({ ...expenses, rows: [update], total: null }).rows[0]).toEqual(update);
    expect(expensesCardSchema.safeParse({ ...expenses, rows: [{ ...update, change: 'moved' }] }).success).toBe(false);
    // A refund is a negative amount; nothing past a billion is.
    const refund = { ...dinner, amount: { amount: -20, currency: 'EUR' } };
    expect(expensesCardSchema.safeParse({ ...expenses, rows: [refund] }).success).toBe(true);
    expect(expensesCardSchema.safeParse({ ...expenses, total: { amount: 2e9, currency: 'EUR' } }).success).toBe(false);
  });

  it('CARDS-BUD-003: lists and splits are bounded, and a card past a bound reads as no card', () => {
    const many = Array.from({ length: EXPENSE_PEOPLE_MAX + 1 }, (_, i) => ({
      person: { ...ben, id: 100 + i },
      amount: 1,
      paid: false,
    }));
    expect(storedTrekCardSchema.parse({ ...expenses, rows: [{ ...dinner, shares: many }] })).toBeNull();
    expect(storedTrekCardSchema.parse({ ...expenses, rows: Array.from({ length: 13 }, () => dinner) })).toBeNull();
    expect(storedTrekCardSchema.parse({ ...expenses, rows: [] })).toBeNull();
    expect(storedTrekCardSchema.parse({ ...expenses, offset: -1 })).toBeNull();
    const free = { ...payments.rows[0], amount: { amount: 0, currency: 'EUR' } };
    expect(storedTrekCardSchema.parse({ ...payments, rows: [free] })).toBeNull();
    expect(storedTrekCardSchema.parse({ ...settlement, currency: 'euro' })).toBeNull();
    expect(storedTrekCardSchema.parse({ ...perPerson, rows: [] })).toBeNull();
  });

  it('CARDS-BUD-004: people carry a stored file name only, never an address', () => {
    const linked = { ...ana, avatarKey: 'https://sso.example/ana.png' };
    expect(storedTrekCardSchema.parse({ ...perPerson, rows: [{ ...perPerson.rows[0], person: linked }] })).toBeNull();
    const upward = { from: ana, to: { ...ben, avatarKey: '../x' }, amount: 1 };
    expect(storedTrekCardSchema.parse({ ...settlement, flows: [upward] })).toBeNull();
  });

  it('CARDS-BUD-005: a payment change reads its verb, and a payment receipt its own entity', () => {
    expect(BUDGET_VERB_KEYS).toEqual(['addPayment', 'updatePayment']);
    for (const verb of BUDGET_VERB_KEYS) expect(ASSISTANT_CHANGE_VERB_KEYS).toContain(verb);
    const preview = {
      toolCallId: 'c1',
      verbKey: 'addPayment',
      subject: 'Ben → Ana',
      rows: [],
      dayId: null,
      placeIds: [],
      undoable: true,
      card: payments,
    };
    expect(assistantChangePreviewSchema.parse(preview)).toMatchObject({ verbKey: 'addPayment', card: payments });
    expect(BUDGET_APPLIED_ENTITIES).toEqual(['settlement']);
    const receipt = { toolCallId: 'c1', entity: 'settlement', ids: [5], dayId: null, undoUntil: null };
    expect(assistantAppliedSchema.parse(receipt).entity).toBe('settlement');
  });
});
