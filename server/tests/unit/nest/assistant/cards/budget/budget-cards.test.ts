/**
 * ASTCARD-BUD-001 to ASTCARD-BUD-027
 *
 * The costs in the assistant chat: the cards the budget's reads show beside
 * their answer (the expense list, settle up, the payments recorded, the share
 * per traveller), the cards its held writes show inside the change card, the
 * words of the writes that had none, the receipts and the way back. Every
 * card goes through the registry's guarded calls, so each one asserted here
 * also fits the shared card union and the size cap.
 */
import { buildTripCard } from '../../../../../../src/nest/assistant/assistant-context';
import { unchangedSinceApplied, undoTargetsOf } from '../../../../../../src/nest/assistant/assistant-undo.helpers';
import { loadFor } from '../../../../../../src/nest/assistant/cards/card-context';
import type { AnswerInput, PreviewContext } from '../../../../../../src/nest/assistant/cards/card-types';
import { readKey } from '../../../../../../src/nest/assistant/cards/card-values';
import {
  answerCardOf,
  appliedCardOf,
  ASSISTANT_UNDO_MAP,
  ASSISTANT_WRITE_TOOLS,
  CARD_PROMPT_LINES,
  nameArgOf,
} from '../../../../../../src/nest/assistant/cards/registry';
import { appliedChange, describeToolCall } from '../../../../../../src/nest/assistant/tool-call-preview.helpers';
import {
  assistantChangePreviewSchema,
  MAX_CARD_CHARS,
  type CostPerPersonCard,
  type ExpensesCard,
  type PaymentsCard,
  type SettlementCard,
  type TrekCard,
} from '@trek/shared';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const logMock = vi.hoisted(() => ({ logInfo: vi.fn(), logError: vi.fn(), logWarn: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../../../../src/nest/audit/audit-log.logger', () => logMock);

beforeEach(() => vi.clearAllMocks());

/** Mia (an uploaded picture), Jon (a picture from a sign-in provider) and Ada (none) on a euro trip in Lisbon. */
const SUMMARY = {
  trip: { title: 'Lisbon', currency: 'EUR' },
  members: {
    owner: { id: 7, username: 'mia', avatar_url: '/uploads/avatars/mia.png' },
    collaborators: [
      { id: 8, username: 'jon', avatar_url: 'https://sso.example/jon.png' },
      { id: 9, username: 'ada', avatar_url: null },
    ],
  },
  days: [],
  budget: {
    items: [
      {
        id: 31,
        name: 'Dinner',
        category: 'food',
        total_price: 90,
        currency: null,
        expense_date: '2026-06-03',
        place_id: 12,
        members: [
          { user_id: 7, paid: 1, username: 'mia', avatar_url: '/uploads/avatars/mia.png', amount: null },
          { user_id: 8, paid: 0, username: 'jon', avatar_url: null, amount: null },
        ],
        payers: [{ user_id: 7, amount: 90, username: 'mia' }],
        receipts: [{ id: 1 }],
      },
      {
        id: 32,
        name: 'Museum',
        category: 'activities',
        total_price: 50,
        currency: 'USD',
        members: [
          { user_id: 7, paid: 0, username: 'mia', amount: 30 },
          { user_id: 8, paid: 1, username: 'jon', amount: 20 },
        ],
        payers: [{ user_id: 8, amount: 50, username: 'jon' }],
        receipts: [],
      },
    ],
  },
};
const card = buildTripCard(1, 7, SUMMARY, { places: [{ id: 12, name: 'Time Out Market' }] }, null);
const ctx: PreviewContext = { card, categories: new Map(), locale: 'en-GB', today: '2026-06-01', airport: () => null };

const MIA = { id: 7, name: 'mia', avatarKey: 'mia.png' };
const JON = { id: 8, name: 'jon', avatarKey: null };
const ADA = { id: 9, name: 'ada', avatarKey: null };

function answer<C extends TrekCard>(tool: string, value: unknown): C | null {
  const input: AnswerInput = { toolCallId: 'r1', args: {}, value, card, today: '2026-06-01' };
  return answerCardOf(tool, input) as C | null;
}

const describe_ = (tool: string, args: Record<string, unknown>, loaded: unknown = null) =>
  describeToolCall(tool, 'tc-1', args, ctx, loaded);

function expensesOf(tool: string, args: Record<string, unknown>): ExpensesCard['rows'][number] | undefined {
  const preview = describe_(tool, args);
  return preview.card?.kind === 'expenses' ? preview.card.rows[0] : undefined;
}

function paymentOf(tool: string, args: Record<string, unknown>, loaded: unknown = null) {
  const preview = describe_(tool, args, loaded);
  return preview.card?.kind === 'payments' ? preview.card.rows[0] : undefined;
}

/** A page of `list_budget_items` as the tool answers it. */
const LIST = {
  currency: 'EUR',
  total: 140,
  unconverted_item_ids: [34],
  item_count: 3,
  items: [
    {
      id: 31,
      name: 'Dinner',
      category: 'food',
      total_price: 100,
      currency: 'EUR',
      trip_amount: null,
      expense_date: '2026-06-03',
      note: 'tip',
      place_id: 12,
      reservation_id: null,
      payers: [{ user_id: 7, amount: 100 }],
      members: [
        { user_id: 7, amount: null, paid: true },
        { user_id: 8, amount: null, paid: false },
        { user_id: 9, amount: null, paid: false },
      ],
      receipt_count: 2,
    },
    {
      id: 32,
      name: 'Museum',
      category: 'activities',
      total_price: 50,
      currency: 'USD',
      trip_amount: 40,
      expense_date: null,
      place_id: null,
      payers: [{ user_id: 44, amount: 50 }],
      members: [
        { user_id: 7, amount: 30, paid: false },
        { user_id: 44, amount: 20, paid: true },
      ],
      receipt_count: 0,
    },
  ],
  people: [
    { user_id: 7, username: 'mia' },
    { user_id: 44, username: 'gone@example.com' },
  ],
};

describe('answer cards', () => {
  it('ASTCARD-BUD-001: the expense list shows each expense with its amounts, day, place, payers and split', () => {
    const list = answer<ExpensesCard>('list_budget_items', LIST);
    expect(list).toMatchObject({
      kind: 'expenses',
      offset: 0,
      more: 1,
      total: { amount: 140, currency: 'EUR' },
      unconverted: 1,
    });
    const [dinner, museum] = list?.rows ?? [];
    expect(dinner).toMatchObject({
      id: 31,
      name: 'Dinner',
      category: 'food',
      amount: { amount: 100, currency: 'EUR' },
      tripAmount: null,
      date: '2026-06-03',
      place: { id: 12, name: 'Time Out Market' },
      payers: [{ person: MIA, amount: 100 }],
      split: 'equal',
      receipts: 2,
      note: null,
      before: null,
      highlight: [],
      change: 'none',
    });
    // An even split hands the left-over cent out from the expense's id on, as the server does.
    expect(dinner?.shares).toEqual([
      { person: MIA, amount: 33.33, paid: true },
      { person: JON, amount: 33.34, paid: false },
      { person: ADA, amount: 33.33, paid: false },
    ]);
    // A foreign expense says what it comes to in the trip currency; an uneven split keeps its own amounts.
    expect(museum).toMatchObject({
      amount: { amount: 50, currency: 'USD' },
      tripAmount: { amount: 40, currency: 'EUR' },
    });
    expect(museum?.split).toBe('custom');
    expect(museum?.shares.map((share) => share.amount)).toEqual([30, 20]);
  });

  it('ASTCARD-BUD-002: someone who left the trip keeps the name the list gives them, masked like any answer', () => {
    const museum = answer<ExpensesCard>('list_budget_items', LIST)?.rows[1];
    const gone = museum?.payers[0]?.person;
    expect(gone).toMatchObject({ id: 44, avatarKey: null });
    expect(gone?.name).not.toContain('@');
    expect(museum?.shares[1]?.person.id).toBe(44);
  });

  it('ASTCARD-BUD-003: the list names twelve expenses and six people of a split, and counts the rest', () => {
    const members = [7, 8, 9, 10, 11, 12, 13].map((id) => ({ user_id: id, amount: null, paid: false }));
    const items = Array.from({ length: 14 }, (_, i) => ({ id: 100 + i, name: `Taxi ${i}`, total_price: 7, members }));
    const list = answer<ExpensesCard>('list_budget_items', { currency: 'EUR', total: 98, item_count: 14, items });
    expect(list?.rows).toHaveLength(12);
    expect(list?.more).toBe(2);
    expect(list?.rows[0]?.shares).toHaveLength(6);
    expect(list?.rows[0]?.moreShares).toBe(1);
    // Every share of the seven, named or not, adds up to the total.
    expect(list?.total).toEqual({ amount: 98, currency: 'EUR' });
  });

  it('ASTCARD-BUD-004: an empty list, a broken answer and rows without a name or an amount show no card', () => {
    expect(answer('list_budget_items', { currency: 'EUR', total: 0, items: [] })).toBeNull();
    expect(answer('list_budget_items', 'not a list')).toBeNull();
    expect(
      answer('list_budget_items', {
        items: [
          { id: 1, total_price: 5 },
          { id: 2, name: 'Tip' },
        ],
      }),
    ).toBeNull();
    expect(answer('get_settlement_summary', { error: 'nope' })).toBeNull();
    expect(answer('get_budget_per_person', { summary: [] })).toBeNull();
    expect(answer('list_settlements', { settlements: [] })).toBeNull();
  });

  it('ASTCARD-BUD-005: settle up names who pays whom, the balances of everyone not square and what no rate converts', () => {
    const settle = answer<SettlementCard>('get_settlement_summary', {
      summary: {
        currency: 'EUR',
        flows: [{ from: { user_id: 8, username: 'jon' }, to: { user_id: 7, username: 'mia' }, amount: 42.5 }],
        balances: [
          { user_id: 8, balance: -42.5 },
          { user_id: 9, balance: 0 },
          { user_id: 7, balance: 42.5 },
        ],
        settlements: [{ id: 1 }, { id: 2 }],
        unconverted: { item_ids: [3, 4], settlement_ids: [5], currencies: ['USD', 'bad', 'VND'] },
      },
    });
    expect(settle).toEqual({
      kind: 'settlement',
      currency: 'EUR',
      flows: [{ from: JON, to: MIA, amount: 42.5 }],
      moreFlows: 0,
      balances: [
        { person: MIA, balance: 42.5 },
        { person: JON, balance: -42.5 },
      ],
      moreBalances: 0,
      recorded: 2,
      unconverted: { entries: 3, currencies: ['USD', 'VND'] },
    });
  });

  it('ASTCARD-BUD-006: a trip everyone is square on keeps its balances and names no payment; long lists are counted', () => {
    const square = answer<SettlementCard>('get_settlement_summary', {
      summary: { currency: 'eur', flows: [], balances: [{ user_id: 7, balance: 0 }], settlements: [] },
    });
    expect(square).toMatchObject({ currency: 'EUR', flows: [], balances: [{ person: MIA, balance: 0 }], recorded: 0 });
    const flows = Array.from({ length: 13 }, () => ({ from: { user_id: 8 }, to: { user_id: 7 }, amount: 1 }));
    const long = answer<SettlementCard>('get_settlement_summary', { summary: { currency: 'EUR', flows } });
    expect(long?.flows).toHaveLength(12);
    expect(long?.moreFlows).toBe(1);
  });

  it('ASTCARD-BUD-007: the share per traveller lists the largest share first, with what of it is marked paid', () => {
    const shares = answer<CostPerPersonCard>('get_budget_per_person', {
      summary: [
        { user_id: 8, username: 'jon', total_assigned: 61, total_paid: 61, items_count: 2, currency: 'EUR' },
        { user_id: 7, username: 'mia', total_assigned: 69, total_paid: 45, items_count: 2, currency: 'EUR' },
      ],
    });
    expect(shares).toEqual({
      kind: 'costPerPerson',
      currency: 'EUR',
      rows: [
        { person: MIA, share: 69, paid: 45, count: 2 },
        { person: JON, share: 61, paid: 61, count: 2 },
      ],
      more: 0,
    });
  });

  it('ASTCARD-BUD-008: the payments read newest first, each on the day it was paid or else recorded', () => {
    const payments = answer<PaymentsCard>('list_settlements', {
      settlements: [
        { id: 1, from_user_id: 8, to_user_id: 7, amount: 20, currency: null, created_at: '2026-06-01 10:00:00' },
        {
          id: 2,
          from_user_id: 9,
          to_user_id: 7,
          amount: 5,
          currency: 'usd',
          created_at: '2026-06-02 10:00:00',
          settled_at: '2026-06-05',
          note: 'Cash to mia@example.com',
        },
        { id: 3, from_user_id: 9, to_user_id: 8, amount: 7, created_at: '2026-06-05 08:00:00', settled_at: null },
      ],
    });
    expect(payments?.rows.map((row) => row.id)).toEqual([3, 2, 1]);
    expect(payments?.rows[1]).toMatchObject({
      from: ADA,
      to: MIA,
      amount: { amount: 5, currency: 'USD' },
      date: '2026-06-05',
      change: 'none',
    });
    expect(payments?.rows[1]?.note).toContain('Cash to');
    expect(payments?.rows[1]?.note).not.toContain('@');
    expect(payments?.rows[2]).toMatchObject({ amount: { amount: 20, currency: 'EUR' }, date: '2026-06-01' });
  });

  it('ASTCARD-BUD-009: a list of long names and pictures stays under the size cap by counting the expenses it leaves out', () => {
    const roster = Array.from({ length: 20 }, (_, i) => ({
      id: 200 + i,
      username: `${'Traveller with a very long name '.repeat(3)}${i}`.slice(0, 80),
      avatar_url: `/uploads/avatars/${'a'.repeat(180)}${i}.png`,
    }));
    const team = { owner: roster[0], collaborators: roster.slice(1) };
    const crowded = buildTripCard(2, 200, { members: team }, null, null);
    const members = roster.map((person) => ({ user_id: person.id, amount: null, paid: false }));
    const payers = roster.slice(0, 3).map((person) => ({ user_id: person.id, amount: 1 }));
    const items = Array.from({ length: 12 }, (_, i) => ({
      id: 300 + i,
      name: `${'Dinner at the harbour '.repeat(6)}${i}`,
      total_price: 3,
      members,
      payers,
    }));
    const input: AnswerInput = { toolCallId: 'r1', args: {}, value: { items }, card: crowded, today: '2026-06-01' };
    const list = answerCardOf('list_budget_items', input) as ExpensesCard | null;
    expect(list).not.toBeNull();
    expect(JSON.stringify(list).length).toBeLessThanOrEqual(MAX_CARD_CHARS);
    expect(list?.rows.length).toBeLessThan(12);
    expect((list?.rows.length ?? 0) + (list?.more ?? 0)).toBe(12);
  });
});

describe('change cards', () => {
  it('ASTCARD-BUD-010: a new expense is split evenly across everyone when the call names nobody', () => {
    const taxi = expensesOf('create_budget_item', { name: 'Taxi', total_price: 10, category: 'transport' });
    expect(taxi).toMatchObject({ id: null, name: 'Taxi', amount: { amount: 10, currency: 'EUR' }, change: 'new' });
    expect(taxi?.shares).toEqual([
      { person: MIA, amount: 3.34, paid: false },
      { person: JON, amount: 3.33, paid: false },
      { person: ADA, amount: 3.33, paid: false },
    ]);
    expect(describe_('create_budget_item', { name: 'Taxi', total_price: 10 }).verbKey).toBe('addBudgetItem');
  });

  it('ASTCARD-BUD-011: named payers set the amount, an empty member list plans only, members split unevenly', () => {
    const paid = expensesOf('create_budget_item', {
      name: 'Groceries',
      total_price: 99,
      currency: 'usd',
      payers: [
        { user_id: 8, amount: 12.5 },
        { user_id: 9, amount: 7.5 },
      ],
      member_ids: [8, 9],
      expense_date: '2026-06-04',
      place_id: 12,
      note: 'Market',
    });
    expect(paid).toMatchObject({
      amount: { amount: 20, currency: 'USD' },
      payers: [
        { person: JON, amount: 12.5 },
        { person: ADA, amount: 7.5 },
      ],
      date: '2026-06-04',
      place: { id: 12, name: 'Time Out Market' },
      note: 'Market',
      split: 'equal',
    });
    const planned = expensesOf('create_budget_item', { name: 'Hotel', total_price: 300, member_ids: [] });
    expect(planned).toMatchObject({ split: 'none', shares: [], moreShares: 0 });
    const uneven = expensesOf('create_budget_item', {
      name: 'Boat',
      total_price: 10,
      members: [
        { user_id: 7, amount: 6 },
        { user_id: 8, amount: 4 },
      ],
    });
    expect(uneven).toMatchObject({ split: 'custom' });
    expect(uneven?.shares.map((share) => [share.person.id, share.amount])).toEqual([
      [7, 6],
      [8, 4],
    ]);
    expect(describe_('create_budget_item', {}).card).toBeUndefined();
  });

  it('ASTCARD-BUD-012: an expense with members is split by everyone when the list is empty, as the tool does', () => {
    const preview = describe_('create_budget_item_with_members', { name: 'Fuel', total_price: 30, userIds: [] });
    expect(preview).toMatchObject({
      verbKey: 'addBudgetItem',
      tool: 'create_budget_item_with_members',
      undoable: true,
    });
    expect(preview.rows).toContainEqual({ op: 'add', labelKey: 'members', before: null, after: 'mia, jon, ada' });
    const row = preview.card?.kind === 'expenses' ? preview.card.rows[0] : undefined;
    expect(row?.shares.map((share) => share.person.id)).toEqual([7, 8, 9]);
    expect(row?.amount).toEqual({ amount: 30, currency: 'EUR' });
    const two = expensesOf('create_budget_item_with_members', { name: 'Fuel', total_price: 30, userIds: [8, 9] });
    expect(two?.shares.map((share) => share.amount)).toEqual([15, 15]);
  });

  it('ASTCARD-BUD-013: a changed expense shows what it replaces, its new split and who joins it', () => {
    const preview = describe_('update_budget_item', {
      itemId: 31,
      name: 'Dinner for three',
      total_price: 120,
      member_ids: [7, 8, 9],
    });
    // The core's words stay; the card comes on top.
    expect(preview).toMatchObject({ verbKey: 'updateBudgetItem', subject: 'Dinner for three' });
    const row = preview.card?.kind === 'expenses' ? preview.card.rows[0] : undefined;
    expect(row).toMatchObject({
      id: 31,
      name: 'Dinner for three',
      amount: { amount: 120, currency: 'EUR' },
      date: '2026-06-03',
      receipts: 1,
      change: 'changed',
      highlight: [9],
      before: { name: 'Dinner', amount: { amount: 90, currency: 'EUR' }, category: null, date: null, split: null },
    });
    // Mia's paid tick stays; the even split is worked out again for the new total.
    expect(row?.shares).toEqual([
      { person: MIA, amount: 40, paid: true },
      { person: JON, amount: 40, paid: false },
      { person: ADA, amount: 40, paid: false },
    ]);
    const cleared = expensesOf('update_budget_item', { itemId: 31, expense_date: null, currency: 'USD' });
    expect(cleared?.before).toMatchObject({ amount: { amount: 90, currency: 'EUR' }, date: '2026-06-03' });
    expect(cleared).toMatchObject({ date: null, amount: { amount: 90, currency: 'USD' } });
    expect(describe_('update_budget_item', { itemId: 99, name: 'Ghost' }).card).toBeUndefined();
  });

  it('ASTCARD-BUD-014: new members of an expense share it evenly, the paid ticks kept and own amounts dropped', () => {
    const preview = describe_('set_budget_item_members', { itemId: 32, userIds: [7, 8, 9] });
    expect(preview).toMatchObject({ verbKey: 'updateBudgetItem', subject: 'Museum', tool: 'set_budget_item_members' });
    expect(preview.rows).toEqual([{ op: 'change', labelKey: 'members', before: 'mia, jon', after: 'mia, jon, ada' }]);
    const row = preview.card?.kind === 'expenses' ? preview.card.rows[0] : undefined;
    expect(row).toMatchObject({ split: 'equal', highlight: [9], before: { split: 'custom' } });
    expect(row?.shares).toEqual([
      { person: MIA, amount: 16.67, paid: false },
      { person: JON, amount: 16.66, paid: true },
      { person: ADA, amount: 16.67, paid: false },
    ]);
  });

  it('ASTCARD-BUD-015: a paid tick changes one share and names the person it is about', () => {
    const preview = describe_('toggle_budget_member_paid', { itemId: 31, memberId: 8, paid: true });
    expect(preview).toMatchObject({ subject: 'Dinner', tool: 'toggle_budget_member_paid' });
    expect(preview.rows).toEqual([{ op: 'add', labelKey: 'members', before: null, after: 'jon ✓' }]);
    const row = preview.card?.kind === 'expenses' ? preview.card.rows[0] : undefined;
    expect(row?.shares.map((share) => share.paid)).toEqual([true, true]);
    expect(row?.highlight).toEqual([8]);
    expect(row?.before).toBeNull();
  });

  it('ASTCARD-BUD-016: a removed expense shows as it is, marked to go; one the trip does not hold reads as its id', () => {
    const preview = describe_('delete_budget_item', { itemId: 32 });
    expect(preview).toMatchObject({ verbKey: 'genericRemove', subject: 'Museum', tool: 'delete_budget_item' });
    expect(preview.rows).toEqual([{ op: 'add', labelKey: 'price', before: null, after: 'US$50.00' }]);
    const row = preview.card?.kind === 'expenses' ? preview.card.rows[0] : undefined;
    expect(row).toMatchObject({ id: 32, change: 'willDelete', amount: { amount: 50, currency: 'USD' } });
    const ghost = describe_('delete_budget_item', { itemId: 99 });
    expect(ghost.subject).toBe('#99');
    expect(ghost.card).toBeUndefined();
    expect(nameArgOf('delete_budget_item', 'itemId', 31, card)).toBe('Dinner');
    expect(nameArgOf('delete_budget_item', 'itemId', 99, card)).toBeNull();
  });

  it('ASTCARD-BUD-017: a recorded payment names who pays whom, how much and on which day', () => {
    const args = { from_user_id: 8, to_user_id: 7, amount: 42.5, settled_at: '2026-06-07', note: 'Bank' };
    const preview = describe_('create_settlement', args);
    expect(preview).toMatchObject({
      verbKey: 'addPayment',
      subject: 'jon → mia',
      tool: 'create_settlement',
      undoable: true,
    });
    expect(preview.rows.map((row) => row.labelKey)).toEqual(['price', 'day', 'notes']);
    expect(paymentOf('create_settlement', args)).toEqual({
      id: null,
      from: JON,
      to: MIA,
      amount: { amount: 42.5, currency: 'EUR' },
      date: '2026-06-07',
      note: 'Bank',
      before: null,
      change: 'new',
    });
    expect(describe_('create_settlement', { from_user_id: 8, to_user_id: 7, amount: 0 }).card).toBeUndefined();
  });

  it('ASTCARD-BUD-018: a changed payment shows the people and amount it replaces, a removed one as it is', () => {
    const stored = {
      id: 5,
      from_user_id: 8,
      to_user_id: 7,
      amount: 20,
      currency: 'EUR',
      created_at: '2026-06-02 09:00:00',
      settled_at: null,
      note: 'cash',
    };
    const loaded = { settlements: [stored] };
    const args = { settlementId: 5, from_user_id: 9, to_user_id: 7, amount: 25 };
    const changed = describe_('update_settlement', args, loaded);
    expect(changed).toMatchObject({ verbKey: 'updatePayment', subject: 'ada → mia', tool: 'update_settlement' });
    expect(changed.rows).toEqual([{ op: 'change', labelKey: 'price', before: '€20.00', after: '€25.00' }]);
    const row = changed.card?.kind === 'payments' ? changed.card.rows[0] : undefined;
    expect(row).toMatchObject({
      id: 5,
      from: ADA,
      amount: { amount: 25, currency: 'EUR' },
      date: '2026-06-02',
      note: 'cash',
      change: 'changed',
      before: { from: JON, to: null, amount: { amount: 20, currency: 'EUR' } },
    });
    expect(paymentOf('delete_settlement', { settlementId: 5 }, loaded)).toMatchObject({ id: 5, change: 'willDelete' });
    const unknown = describe_('delete_settlement', { settlementId: 6 }, loaded);
    expect(unknown).toMatchObject({ verbKey: 'genericRemove', subject: '#6' });
    expect(unknown.card).toBeUndefined();
  });

  it('ASTCARD-BUD-019: a change to a payment looks the payments up once, through the turn reader', async () => {
    const read = vi.fn(async (_tool: string, _args?: Record<string, unknown>) => ({ settlements: [] }));
    expect(await loadFor('update_settlement', { settlementId: 5 }, read)).toEqual({ settlements: [] });
    expect(await loadFor('delete_settlement', { settlementId: 5 }, read)).toEqual({ settlements: [] });
    expect(read.mock.calls.map((call) => call[0])).toEqual(['list_settlements', 'list_settlements']);
    expect(await loadFor('create_settlement', {}, read)).toBeNull();
    expect(read).toHaveBeenCalledTimes(2);
  });

  it('ASTCARD-BUD-020: every budget write reads without arguments, and its card names the verb it declares', () => {
    const tools = [
      'create_budget_item_with_members',
      'set_budget_item_members',
      'toggle_budget_member_paid',
      'delete_budget_item',
      'create_settlement',
      'update_settlement',
      'delete_settlement',
    ];
    for (const tool of tools) {
      const preview = describe_(tool, {});
      expect(assistantChangePreviewSchema.safeParse(preview).success, tool).toBe(true);
      expect(preview.verbKey, tool).toBe(ASSISTANT_WRITE_TOOLS[tool]?.verbKey);
      expect(preview.card, tool).toBeUndefined();
    }
  });
});

describe('receipts and the way back', () => {
  it('ASTCARD-BUD-021: a payment receipt names the payment, an expense receipt the expense', () => {
    const receipt = (tool: string, args: Record<string, unknown>, result: unknown) =>
      appliedChange(tool, 'tc', args, result, null, null);
    expect(receipt('create_settlement', {}, { settlement: { id: 77 } })).toMatchObject({
      entity: 'settlement',
      ids: [77],
    });
    expect(receipt('update_settlement', { settlementId: 5 }, { settlement: {} })).toMatchObject({ ids: [5] });
    expect(receipt('delete_settlement', { settlementId: 5 }, { success: true })).toMatchObject({ ids: [5] });
    expect(receipt('toggle_budget_member_paid', { itemId: 31 }, { member: {} })).toMatchObject({
      entity: 'budget',
      ids: [31],
    });
    expect(receipt('set_budget_item_members', { itemId: 32 }, { item: { id: 32 } })?.ids).toEqual([32]);
  });

  it('ASTCARD-BUD-022: an applied create keeps its card with the id the answer names', () => {
    const preview = describe_('create_budget_item', { name: 'Taxi', total_price: 10 });
    const expense = appliedCardOf('create_budget_item', { args: {}, result: { item: { id: 40 } }, preview });
    expect(expense?.kind === 'expenses' && expense.rows[0]?.id).toBe(40);
    const payment = describe_('create_settlement', { from_user_id: 8, to_user_id: 7, amount: 5 });
    const recorded = { settlement: { id: 9 } };
    const applied = appliedCardOf('create_settlement', { args: {}, result: recorded, preview: payment });
    expect(applied?.kind === 'payments' && applied.rows[0]?.id).toBe(9);
    // A card of another kind, or an answer that names no id, leaves the waiting card as it was.
    expect(appliedCardOf('create_settlement', { args: {}, result: { settlement: { id: 9 } }, preview })).toBeNull();
    expect(appliedCardOf('create_budget_item', { args: {}, result: { success: true }, preview })).toBeNull();
  });

  it('ASTCARD-BUD-023: a recorded payment is taken back while nobody changed it since', () => {
    const created = {
      id: 77,
      from_user_id: 8,
      to_user_id: 7,
      amount: 5,
      currency: 'EUR',
      settled_at: null,
      note: null,
    };
    const result = { settlement: created };
    expect(ASSISTANT_UNDO_MAP.create_settlement?.tool).toBe('delete_settlement');
    expect(ASSISTANT_UNDO_MAP.create_settlement?.args({}, result, null)).toEqual({ settlementId: 77 });
    expect(ASSISTANT_UNDO_MAP.create_settlement?.args({}, { success: true }, null)).toBeNull();
    expect([...undoTargetsOf('delete_settlement', 'create_settlement', {}, result)]).toContain('list_settlements');
    const snapshot = (settlements: unknown[]) => ({
      summary: {},
      places: {},
      reads: new Map([[readKey('list_settlements', {}), { settlements }]]),
    });
    expect(unchangedSinceApplied('create_settlement', result, snapshot([created]))).toBe(true);
    const edited = { ...created, note: 'paid back' };
    expect(unchangedSinceApplied('create_settlement', result, snapshot([edited]))).toBe(false);
    expect(unchangedSinceApplied('create_settlement', result, snapshot([]))).toBe(false);
  });

  it('ASTCARD-BUD-024: an expense created with its split is taken back while it is as it was created', () => {
    const created = { id: 31, name: 'Dinner', total_price: 90, category: 'food' };
    const undo = ASSISTANT_UNDO_MAP.create_budget_item_with_members;
    expect(undo?.tool).toBe('delete_budget_item');
    expect(undo?.args({}, { item: created }, null)).toEqual({ itemId: 31 });
    const snapshot = { summary: SUMMARY, places: {} };
    expect(unchangedSinceApplied('create_budget_item_with_members', { item: created }, snapshot)).toBe(true);
    const renamed = { ...created, name: 'Lunch' };
    expect(unchangedSinceApplied('create_budget_item_with_members', { item: renamed }, snapshot)).toBe(false);
    expect(CARD_PROMPT_LINES.some((line) => line.includes('list_budget_items'))).toBe(true);
  });
});

describe('edges', () => {
  it('ASTCARD-BUD-025: a later page of the list says where its expenses start, so pages join only where they meet', () => {
    const items = [{ id: 120, name: 'Taxi', total_price: 7 }];
    const page = answer<ExpensesCard>('list_budget_items', { currency: 'EUR', item_count: 21, offset: 20, items });
    expect(page).toMatchObject({ offset: 20, more: 20 });
    expect(answer<ExpensesCard>('list_budget_items', { items, offset: 'twenty' })?.offset).toBe(0);
  });

  it('ASTCARD-BUD-026: an update that clears the payers but names a total keeps that total, as the write path does', () => {
    const row = expensesOf('update_budget_item', { itemId: 31, payers: [], total_price: 75 });
    expect(row).toMatchObject({ amount: { amount: 75, currency: 'EUR' }, payers: [] });
    expect(row?.before?.amount).toEqual({ amount: 90, currency: 'EUR' });
    const unpaid = expensesOf('update_budget_item', { itemId: 31, payers: [] });
    expect(unpaid?.amount).toEqual({ amount: 0, currency: 'EUR' });
  });

  it('ASTCARD-BUD-027: a split of more people than a card may count says the most it may', () => {
    const members = Array.from({ length: 1100 }, (_, i) => ({ user_id: 1000 + i, amount: null, paid: false }));
    const items = [{ id: 5, name: 'Festival', total_price: 1100, members }];
    const list = answer<ExpensesCard>('list_budget_items', { items });
    expect(list?.rows[0]?.shares).toHaveLength(6);
    expect(list?.rows[0]?.moreShares).toBe(1000);
  });
});
