import type { CardExpense, CardPayment, CardPerson, ExpensesCard, PaymentsCard } from '@trek/shared';

import type { ChangeItem } from '../../src/components/Assistant/assistantParts';

/**
 * The costs' cards as the server builds them, for the tests of their views
 * and model: Ana (the signed-in user in most tests), Ben and Cleo on a euro
 * trip, a dinner Ana paid and the three share evenly.
 */

export const ANA: CardPerson = { id: 7, name: 'Ana', avatarKey: 'ana.png' };
export const BEN: CardPerson = { id: 8, name: 'Ben', avatarKey: null };
export const CLEO: CardPerson = { id: 9, name: 'Cleo', avatarKey: null };

export function expense(overrides: Partial<CardExpense> = {}): CardExpense {
  return {
    id: 31,
    name: 'Dinner at Lokanta',
    category: 'food',
    amount: { amount: 84, currency: 'EUR' },
    tripAmount: null,
    date: '2026-06-03',
    place: null,
    payers: [{ person: ANA, amount: 84 }],
    split: 'equal',
    shares: [
      { person: ANA, amount: 28, paid: true },
      { person: BEN, amount: 28, paid: false },
      { person: CLEO, amount: 28, paid: false },
    ],
    moreShares: 0,
    note: null,
    receipts: 0,
    before: null,
    highlight: [],
    change: 'none',
    ...overrides,
  };
}

export function expenses(rows: CardExpense[], overrides: Partial<ExpensesCard> = {}): ExpensesCard {
  return { kind: 'expenses', rows, offset: 0, more: 0, total: null, unconverted: 0, ...overrides };
}

export function payment(overrides: Partial<CardPayment> = {}): CardPayment {
  return {
    id: 5,
    from: BEN,
    to: ANA,
    amount: { amount: 42.5, currency: 'EUR' },
    date: '2026-06-07',
    note: null,
    before: null,
    change: 'none',
    ...overrides,
  };
}

export function payments(rows: CardPayment[], more = 0): PaymentsCard {
  return { kind: 'payments', rows, more };
}

/** A change row holding `card`, waiting unless said otherwise. */
export function changeItem(
  toolCallId: string,
  card: ChangeItem['card'],
  state: ChangeItem['state'] = 'pending'
): ChangeItem {
  return { toolCallId, preview: null, applied: null, state, card };
}
