import type { TripCard } from '../../assistant-context';
import { clipped, fileKeyOf, finite, personOf, recordOf, type Row } from '../card-values';
import { rowsOf } from '../undo-snapshot';
import {
  EXPENSE_PEOPLE_MAX,
  MAX_CARD_CHARS,
  splitEqualShares,
  toMinor,
  type CardExpense,
  type CardPayment,
  type CardPerson,
  type ExpenseChange,
} from '@trek/shared';

/**
 * The readers the budget's cards are built with. Expenses and payments come
 * from three places: the expense list a read answered, the trip summary the
 * turn holds (for the expense a change is about) and the payments
 * `list_settlements` answered. Each reader takes the row as it comes, trusts
 * no shape and leaves out what is not there. People are named from the trip
 * card, and someone who left the trip from the name the row still carries;
 * their picture is the stored file, never an address.
 */

export function positiveId(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

/** An amount a card may show, to the cent; null for anything else. */
export function amountOf(value: unknown): number | null {
  const number = finite(value);
  return number !== null && Math.abs(number) <= 1e9 ? toMinor(number) / 100 : null;
}

/** A currency code, upper case; the fallback's when the value is none, euros when neither is. */
export function codeOf(value: unknown, fallback: string | null): string {
  for (const candidate of [value, fallback]) {
    const code = typeof candidate === 'string' ? candidate.trim().toUpperCase() : '';
    if (/^[A-Z]{3}$/.test(code)) return code;
  }
  return 'EUR';
}

/** The day of a stored date or date and time, `YYYY-MM-DD`. */
export function dateOf(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const day = value.trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

/** A text from a call's arguments, on one line and cut to `max`: what will be stored, so it is not masked. */
export function argLine(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const line = value.replace(/\s+/g, ' ').trim();
  if (line === '') return null;
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

/** A traveller as a card shows them: from the trip card, else from what the row names. */
export function personFrom(card: TripCard, id: number, name?: unknown, avatarUrl?: unknown): CardPerson {
  return personOf(card, id) ?? { id, name: clipped(name, 80) ?? `#${id}`, avatarKey: fileKeyOf(avatarUrl) };
}

/** A trip place an expense belongs to, by its name on the trip card. */
export function placeOf(card: TripCard, placeId: unknown): CardExpense['place'] {
  const id = positiveId(placeId);
  const name = id === null ? null : clipped(card.places.get(id)?.name, 120);
  return id !== null && name !== null ? { id, name } : null;
}

/** One member of a split as the rows store it: their own amount on an uneven split, null on an even one. */
export interface SplitMember {
  id: number;
  amount: number | null;
  paid: boolean;
  name?: unknown;
  avatarUrl?: unknown;
}

/** How many people one row names. */
export interface PeopleCaps {
  shares: number;
  payers: number;
}

/** Every person a change row can name. */
export const ALL_PEOPLE: PeopleCaps = { shares: EXPENSE_PEOPLE_MAX, payers: EXPENSE_PEOPLE_MAX };

/** The members of a split as a row lists them, either the expense list's or the trip summary's. */
function membersOf(value: unknown, names?: ReadonlyMap<number, string>): SplitMember[] {
  return rowsOf(value).flatMap((member) => {
    const id = positiveId(member.user_id);
    if (id === null) return [];
    return [
      {
        id,
        amount: member.amount === null || member.amount === undefined ? null : amountOf(member.amount),
        paid: member.paid === true || member.paid === 1,
        name: member.username ?? names?.get(id),
        avatarUrl: member.avatar_url,
      },
    ];
  });
}

/**
 * Who shares an expense and what each part comes to. A member with an
 * amount of their own owes exactly that and the split is uneven; the others
 * share the total evenly, the left-over cents handed out from `itemId` on as
 * the server does, so the parts add up to the total.
 */
export function splitOf(
  card: TripCard,
  members: readonly SplitMember[],
  total: number,
  itemId: number,
  max: number,
): Pick<CardExpense, 'split' | 'shares' | 'moreShares'> {
  if (members.length === 0) return { split: 'none', shares: [], moreShares: 0 };
  const equal = splitEqualShares(
    toMinor(total),
    members.map((member) => ({ user_id: member.id })),
    itemId,
  );
  const shares = members.map((member) => ({
    person: personFrom(card, member.id, member.name, member.avatarUrl),
    amount: member.amount ?? (equal[member.id] ?? 0) / 100,
    paid: member.paid,
  }));
  return {
    split: members.some((member) => member.amount !== null) ? 'custom' : 'equal',
    shares: shares.slice(0, max),
    moreShares: Math.min(1000, Math.max(0, shares.length - max)),
  };
}

/** Who paid how much, as the rows store it. */
export function payersOf(card: TripCard, value: unknown, max: number, names?: ReadonlyMap<number, string>) {
  return rowsOf(value)
    .flatMap((payer) => {
      const id = positiveId(payer.user_id);
      const amount = amountOf(payer.amount);
      if (id === null || amount === null) return [];
      return [{ person: personFrom(card, id, payer.username ?? names?.get(id), payer.avatar_url), amount }];
    })
    .slice(0, max);
}

/** What an expense row needs beside the row: the trip currency, the names a list answered with and the caps. */
interface ExpenseRowContext {
  tripCurrency: string;
  names?: ReadonlyMap<number, string>;
  caps: PeopleCaps;
  change: ExpenseChange;
}

/**
 * One expense from a stored row: the expense list's slim one or the trip
 * summary's whole one. Null for a row without an id, a name or an amount.
 */
export function expenseFromRow(card: TripCard, raw: unknown, at: ExpenseRowContext): CardExpense | null {
  const row = recordOf(raw);
  const id = positiveId(row.id);
  const name = clipped(row.name, 120);
  const total = amountOf(row.total_price);
  if (id === null || name === null || total === null) return null;
  const currency = codeOf(row.currency, at.tripCurrency);
  const inTrip = amountOf(row.trip_amount);
  const receipts = finite(row.receipt_count) ?? (Array.isArray(row.receipts) ? row.receipts.length : 0);
  return {
    id,
    name,
    category: clipped(row.category, 60),
    amount: { amount: total, currency },
    tripAmount: inTrip !== null && currency !== at.tripCurrency ? { amount: inTrip, currency: at.tripCurrency } : null,
    date: dateOf(row.expense_date),
    place: placeOf(card, row.place_id),
    payers: payersOf(card, row.payers, at.caps.payers, at.names),
    ...splitOf(card, membersOf(row.members, at.names), total, id, at.caps.shares),
    note: null,
    receipts: Math.min(999, Math.max(0, Math.trunc(receipts))),
    before: null,
    highlight: [],
    change: at.change,
  };
}

/** One recorded payment from a row of `list_settlements`; null without an id, both people or an amount. */
export function paymentFromRow(card: TripCard, raw: unknown, change: ExpenseChange): CardPayment | null {
  const row = recordOf(raw);
  const id = positiveId(row.id);
  const from = positiveId(row.from_user_id);
  const to = positiveId(row.to_user_id);
  const amount = amountOf(row.amount);
  if (id === null || from === null || to === null || amount === null || amount <= 0) return null;
  return {
    id,
    from: personFrom(card, from, row.from_username, row.from_avatar_url),
    to: personFrom(card, to, row.to_username, row.to_avatar_url),
    amount: { amount, currency: codeOf(row.currency, card.currency) },
    date: dateOf(row.settled_at) ?? dateOf(row.created_at),
    note: clipped(row.note, 120),
    before: null,
    change,
  };
}

const EXPENSES = new WeakMap<TripCard, ReadonlyMap<number, Row>>();

/** The trip's expenses as the turn's trip summary holds them, by id; read once per trip card. */
export function budgetRows(card: TripCard): ReadonlyMap<number, Row> {
  let rows = EXPENSES.get(card);
  if (!rows) {
    const items = rowsOf(recordOf(recordOf(card.sources.summary).budget).items);
    rows = new Map(
      items.flatMap((item): Array<[number, Row]> => {
        const id = positiveId(item.id);
        return id === null ? [] : [[id, item]];
      }),
    );
    EXPENSES.set(card, rows);
  }
  return rows;
}

/** The recorded payment `list_settlements` answered under `id`. */
export function settlementRow(loaded: unknown, id: number | null): Row | undefined {
  return id === null ? undefined : rowsOf(recordOf(loaded).settlements).find((row) => row.id === id);
}

/**
 * A list card cut to what one card may weigh: rows come off its end, and
 * into `more`, until its JSON fits, so a long list still shows its start.
 */
export function fitted<C extends { rows: readonly unknown[]; more: number }>(card: C): C {
  let fit = card;
  while (fit.rows.length > 1 && JSON.stringify(fit).length > MAX_CARD_CHARS) {
    fit = { ...fit, rows: fit.rows.slice(0, -1), more: fit.more + 1 };
  }
  return fit;
}
