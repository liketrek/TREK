/**
 * FE-AI-CARD-BUD-001 to FE-AI-CARD-BUD-006
 *
 * The pure side of the costs' cards: pages of the expense list read as one
 * list where they meet, the latest settle up wins, an even split of many reads as a
 * stack, what a run of new expenses adds up to, how far a balance reaches,
 * and what each card and receipt opens.
 */
import type { AssistantApplied, CostPerPersonCard, SettlementCard, TrekCard } from '@trek/shared';
import { describe, expect, it } from 'vitest';

import { ANA, changeItem, expense, expenses, payment, payments } from '../../../../../tests/helpers/assistantBudget';
import { CARD_RULES, ENTITY_LOOK } from '../cardLooks';
import {
  balanceShare,
  chipLimit,
  costsTarget,
  latestOf,
  mergeExpenses,
  mergePayments,
  sharesAsChips,
  stackLimit,
  togetherOf,
} from './budgetModel';

const entry = (toolCallId: string, card: TrekCard) => ({ toolCallId, card });

const settlement = (recorded: number): SettlementCard => ({
  kind: 'settlement',
  currency: 'EUR',
  flows: [],
  moreFlows: 0,
  balances: [],
  moreBalances: 0,
  recorded,
  unconverted: { entries: 0, currencies: [] },
});

describe('budgetModel', () => {
  it('FE-AI-CARD-BUD-001: pages of the expense list read as one list where they meet, each expense once', () => {
    const total = { amount: 90, currency: 'EUR' };
    const first = expenses([expense({ id: 1 }), expense({ id: 2 })], { more: 2, total });
    const second = expenses([expense({ id: 2 }), expense({ id: 3 })], { more: 2 });
    const merged = mergeExpenses([entry('a', first), entry('b', second), entry('c', settlement(0))]);
    expect(merged?.rows.map((row) => row.id)).toEqual([1, 2, 3]);
    // Four in all: the pages show three of them.
    expect(merged?.more).toBe(1);
    expect(merged?.total).toEqual(total);
    expect(mergeExpenses([entry('c', settlement(0))])).toBeNull();
    // A page read first that comes later in the list still follows the one before it.
    const later = expenses([expense({ id: 3 })], { offset: 2, more: 3 });
    const start = expenses([expense({ id: 1 }), expense({ id: 2 })], { more: 2 });
    expect(mergeExpenses([entry('a', later), entry('b', start)])?.rows.map((row) => row.id)).toEqual([1, 2, 3]);
    // A page past a gap is counted with the rest instead of read as if it came next.
    const head = expenses([expense({ id: 1 }), expense({ id: 2 })], { more: 19 });
    const past = expenses([expense({ id: 21 })], { offset: 20, more: 20 });
    const gapped = mergeExpenses([entry('a', head), entry('b', past)]);
    expect(gapped?.rows.map((row) => row.id)).toEqual([1, 2]);
    expect(gapped?.more).toBe(19);
    const twice = mergePayments([entry('a', payments([payment()], 3)), entry('b', payments([payment()], 3))]);
    expect(twice?.rows).toHaveLength(1);
    expect(twice?.more).toBe(3);
  });

  it('FE-AI-CARD-BUD-002: settle up and the shares answer once, with the latest card', () => {
    const shares: CostPerPersonCard = {
      kind: 'costPerPerson',
      currency: 'EUR',
      rows: [{ person: ANA, share: 1, paid: 0, count: 1 }],
      more: 0,
    };
    expect(latestOf([entry('a', settlement(1)), entry('b', settlement(4))], 'settlement')?.recorded).toBe(4);
    expect(latestOf([entry('a', shares)], 'costPerPerson')).toBe(shares);
    expect(latestOf([entry('a', shares)], 'settlement')).toBeNull();
  });

  it('FE-AI-CARD-BUD-003: an uneven split is a badge per person, an even one of many a stack', () => {
    const many = { split: 'equal' as const, shares: expense().shares, moreShares: 3, highlight: [] };
    expect(sharesAsChips(many, chipLimit('compact'))).toBe(false);
    expect(sharesAsChips({ ...many, moreShares: 0 }, chipLimit('compact'))).toBe(true);
    expect(sharesAsChips({ ...many, split: 'custom' }, chipLimit('compact'))).toBe(true);
    expect(sharesAsChips(many, chipLimit('roomy'))).toBe(true);
    expect([chipLimit(undefined), stackLimit(undefined), stackLimit('roomy')]).toEqual([4, 3, 5]);
    // The person a change is about must stand out, so their split is never a stack.
    expect(sharesAsChips({ ...many, highlight: [ANA.id] }, chipLimit('compact'))).toBe(true);
  });

  it('FE-AI-CARD-BUD-004: new expenses add up while two or more are included, in one currency', () => {
    const fresh = (overrides: Parameters<typeof expense>[0] = {}) => expense({ id: null, change: 'new', ...overrides });
    const dinner = changeItem('a', expenses([fresh()]));
    const taxi = changeItem('b', expenses([fresh({ amount: { amount: 12.1, currency: 'EUR' } })]));
    expect(togetherOf([dinner, taxi], new Set())).toEqual({ amount: 96.1, currency: 'EUR' });
    expect(togetherOf([dinner, taxi], new Set(['b']))).toBeNull();
    const dollars = changeItem('c', expenses([fresh({ amount: { amount: 5, currency: 'USD' } })]));
    expect(togetherOf([dinner, dollars], new Set())).toBeNull();
    const gone = changeItem('d', expenses([expense({ change: 'willDelete' })]));
    expect(togetherOf([dinner, gone], new Set())).toBeNull();
    const applied = changeItem('e', expenses([fresh()]), 'applied');
    expect(togetherOf([dinner, applied], new Set())).toBeNull();
    // A paid tick or an update to an expense already there adds no money.
    const ticks = [
      changeItem('f', expenses([expense({ change: 'changed' })])),
      changeItem('g', expenses([expense({ id: 32, change: 'changed' })])),
    ];
    expect(togetherOf(ticks, new Set())).toBeNull();
    expect(togetherOf([dinner, taxi, ...ticks], new Set())).toEqual({ amount: 96.1, currency: 'EUR' });
  });

  it('FE-AI-CARD-BUD-005: a balance reaches half the bar at most, against the largest one', () => {
    expect(balanceShare(42.5, 42.5)).toBe(50);
    expect(balanceShare(-21.25, 42.5)).toBe(25);
    expect(balanceShare(0, 0)).toBe(0);
  });

  it('FE-AI-CARD-BUD-006: a receipt opens the Costs tab on its expense, a payment the tab, and a lookup gives way', () => {
    const applied = (entity: AssistantApplied['entity'], ids: number[]): AssistantApplied => ({
      toolCallId: 't',
      entity,
      ids,
      dayId: null,
      undoUntil: null,
    });
    expect(ENTITY_LOOK.budget.open?.(applied('budget', [31]), null)).toEqual(costsTarget(31));
    expect(costsTarget(31)).toEqual({ kind: 'tab', tab: 'finanzplan', params: { expense: '31' } });
    expect(ENTITY_LOOK.budget.open?.(applied('budget', []), null)).toEqual({ kind: 'tab', tab: 'finanzplan' });
    // A removed expense is no longer there to open: its receipt opens the tab.
    const removed = expenses([expense({ change: 'willDelete' })]);
    expect(ENTITY_LOOK.budget.open?.(applied('budget', [31]), removed)).toEqual(costsTarget());
    expect(ENTITY_LOOK.settlement.open?.(applied('settlement', [5]), null)).toEqual(costsTarget());
    expect(ENTITY_LOOK.budget.onMap).toBeUndefined();
    const list = expenses([expense()]);
    expect(CARD_RULES.yieldsToChange(list, expenses([expense({ id: null })]))).toBe(true);
    expect(CARD_RULES.yieldsToChange(list, payments([payment()]))).toBe(true);
    expect(CARD_RULES.yieldsToChange(payments([payment()]), list)).toBe(false);
    expect(CARD_RULES.yieldsToChange(list, settlement(0))).toBe(false);
  });
});
