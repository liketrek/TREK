import type { TripCard } from '../../assistant-context';
import type { AnswerInput } from '../card-types';
import { finite, recordOf, type Row } from '../card-values';
import { rowsOf } from '../undo-snapshot';
import {
  amountOf,
  codeOf,
  dateOf,
  expenseFromRow,
  fitted,
  paymentFromRow,
  personFrom,
  positiveId,
  type PeopleCaps,
} from './budget-values';
import {
  COST_PER_PERSON_ROWS_MAX,
  EXPENSE_ROWS_MAX,
  PAYMENT_ROWS_MAX,
  SETTLEMENT_BALANCES_MAX,
  SETTLEMENT_FLOWS_MAX,
  type CardPerson,
  type CostPerPersonCard,
  type ExpensesCard,
  type PaymentsCard,
  type SettlementCard,
} from '@trek/shared';

/**
 * The cards the budget's reads show beside the answer, built from each
 * read's raw answer: the expense list, settle up, the payments recorded and
 * what the trip costs each traveller. A read that found nothing shows no card.
 */

/** People an expense row of the list names: the list stays short, a change row names everyone. */
const LIST_PEOPLE: PeopleCaps = { shares: 6, payers: 3 };

/** Counts a card states, kept inside their bounds. */
function count(value: number, max: number): number {
  return Math.min(max, Math.max(0, Math.trunc(value)));
}

/** A person an answer names as `{ user_id, username, avatar_url }`. */
function personIn(card: TripCard, raw: unknown): CardPerson | null {
  const row = recordOf(raw);
  const id = positiveId(row.user_id);
  return id === null ? null : personFrom(card, id, row.username, row.avatar_url);
}

/** `list_budget_items`: the page's expenses in the list's order, where they start, the rest counted, the total. */
export function expensesAnswer({ value, card }: AnswerInput): ExpensesCard | null {
  const root = recordOf(value);
  const tripCurrency = codeOf(root.currency, card.currency);
  const names = new Map(
    rowsOf(root.people).flatMap((person): Array<[number, string]> => {
      const id = positiveId(person.user_id);
      return id !== null && typeof person.username === 'string' ? [[id, person.username]] : [];
    }),
  );
  const items = rowsOf(root.items);
  const rows = items.slice(0, EXPENSE_ROWS_MAX).flatMap((item) => {
    const row = expenseFromRow(card, item, { tripCurrency, names, caps: LIST_PEOPLE, change: 'none' });
    return row ? [row] : [];
  });
  if (rows.length === 0) return null;
  const total = amountOf(root.total);
  const all = finite(root.item_count) ?? items.length;
  return fitted<ExpensesCard>({
    kind: 'expenses',
    rows,
    offset: count(finite(root.offset) ?? 0, 100_000),
    more: count(all - rows.length, 100_000),
    total: total === null ? null : { amount: total, currency: tripCurrency },
    unconverted: count(Array.isArray(root.unconverted_item_ids) ? root.unconverted_item_ids.length : 0, 100_000),
  });
}

/** The balances worth naming: everyone not square, or all of them when everyone is; largest credit first. */
function balancesOf(card: TripCard, rows: Row[]) {
  const all = rows.flatMap((row) => {
    const person = personIn(card, row);
    const balance = amountOf(row.balance);
    return person && balance !== null ? [{ person, balance }] : [];
  });
  const open = all.filter((row) => Math.abs(row.balance) >= 0.005);
  return (open.length > 0 ? open : all).sort((a, b) => b.balance - a.balance);
}

/** `get_settlement_summary`: who pays whom, the balances, the payments recorded, what no rate converts. */
export function settlementAnswer({ value, card }: AnswerInput): SettlementCard | null {
  const summary = recordOf(recordOf(value).summary);
  if (!Array.isArray(summary.flows) && !Array.isArray(summary.balances)) return null;
  const flows = rowsOf(summary.flows).flatMap((flow) => {
    const from = personIn(card, flow.from);
    const to = personIn(card, flow.to);
    const amount = amountOf(flow.amount);
    return from && to && amount !== null && amount > 0 ? [{ from, to, amount }] : [];
  });
  const balances = balancesOf(card, rowsOf(summary.balances));
  const unconverted = recordOf(summary.unconverted);
  const listed = (key: string) => (Array.isArray(unconverted[key]) ? (unconverted[key] as unknown[]).length : 0);
  const currencies = Array.isArray(unconverted.currencies)
    ? unconverted.currencies.filter((code): code is string => typeof code === 'string' && /^[A-Z]{3}$/.test(code))
    : [];
  return {
    kind: 'settlement',
    currency: codeOf(summary.currency, card.currency),
    flows: flows.slice(0, SETTLEMENT_FLOWS_MAX),
    moreFlows: count(flows.length - SETTLEMENT_FLOWS_MAX, 1000),
    balances: balances.slice(0, SETTLEMENT_BALANCES_MAX),
    moreBalances: count(balances.length - SETTLEMENT_BALANCES_MAX, 1000),
    recorded: count(Array.isArray(summary.settlements) ? summary.settlements.length : 0, 100_000),
    unconverted: {
      entries: count(listed('item_ids') + listed('settlement_ids'), 100_000),
      currencies: currencies.slice(0, 6),
    },
  };
}

/** `get_budget_per_person`: each traveller's share, largest first, with what of it is marked paid. */
export function costPerPersonAnswer({ value, card }: AnswerInput): CostPerPersonCard | null {
  const summary = rowsOf(recordOf(value).summary);
  const rows = summary
    .flatMap((row) => {
      const person = personIn(card, row);
      const share = amountOf(row.total_assigned);
      if (!person || share === null) return [];
      return [
        { person, share, paid: amountOf(row.total_paid) ?? 0, count: count(finite(row.items_count) ?? 0, 100_000) },
      ];
    })
    .sort((a, b) => b.share - a.share);
  if (rows.length === 0) return null;
  return {
    kind: 'costPerPerson',
    currency: codeOf(summary[0]?.currency, card.currency),
    rows: rows.slice(0, COST_PER_PERSON_ROWS_MAX),
    more: count(rows.length - COST_PER_PERSON_ROWS_MAX, 1000),
  };
}

/** The day a payment is filed under, the newest first: the day it was paid, else the day it was recorded. */
function newestFirst(a: Row, b: Row): number {
  const day = (row: Row) => dateOf(row.settled_at) ?? dateOf(row.created_at) ?? '';
  const byDay = day(b).localeCompare(day(a));
  return byDay !== 0 ? byDay : (finite(b.id) ?? 0) - (finite(a.id) ?? 0);
}

/** `list_settlements`: the payments recorded, newest first, the rest counted. */
export function paymentsAnswer({ value, card }: AnswerInput): PaymentsCard | null {
  const all = rowsOf(recordOf(value).settlements).sort(newestFirst);
  const rows = all.slice(0, PAYMENT_ROWS_MAX).flatMap((row) => {
    const payment = paymentFromRow(card, row, 'none');
    return payment ? [payment] : [];
  });
  if (rows.length === 0) return null;
  return fitted<PaymentsCard>({ kind: 'payments', rows, more: count(all.length - rows.length, 100_000) });
}
