import type { TripCard } from '../../assistant-context';
import type { PreviewContext, ToolArgs } from '../card-types';
import { argId, clipped, recordOf, type Row } from '../card-values';
import { rowsOf } from '../undo-snapshot';
import {
  ALL_PEOPLE,
  amountOf,
  argLine,
  budgetRows,
  codeOf,
  dateOf,
  expenseFromRow,
  payersOf,
  paymentFromRow,
  personFrom,
  placeOf,
  positiveId,
  settlementRow,
  splitOf,
  type SplitMember,
} from './budget-values';
import {
  sumMinor,
  type CardExpense,
  type CardExpenseBefore,
  type CardPayment,
  type ExpensesCard,
  type PaymentsCard,
} from '@trek/shared';

/**
 * The cards a held budget write shows inside its change card: the expense
 * as it will be (the full split, who paid, the amounts) or the payment, with
 * what an update replaces and the people a change is about. A new expense is
 * read from the call's arguments the way the write path reads them; a change
 * to one starts from the expense in the turn's trip summary, a change to a
 * payment from the payments its lookup read. Without the row a change is
 * about there is no card, and the change card built from the words stands.
 */

/** One expense as a change card holds it. */
function expenseCard(row: CardExpense): ExpensesCard {
  return { kind: 'expenses', rows: [row], offset: 0, more: 0, total: null, unconverted: 0 };
}

function paymentCard(row: CardPayment): PaymentsCard {
  return { kind: 'payments', rows: [row], more: 0 };
}

function idsOf(value: unknown): number[] {
  return Array.isArray(value) ? value.filter((id): id is number => positiveId(id) !== null) : [];
}

/** Members splitting evenly, nobody marked paid yet. */
function evenly(ids: readonly number[]): SplitMember[] {
  return ids.map((id) => ({ id, amount: null, paid: false }));
}

/** The uneven split of `members` (`[{ user_id, amount }]`). */
function unevenly(value: unknown): SplitMember[] {
  return rowsOf(value).flatMap((member) => {
    const id = positiveId(member.user_id);
    const amount = amountOf(member.amount);
    return id === null || amount === null ? [] : [{ id, amount, paid: false }];
  });
}

/** Everyone on the trip, as an expense split across all members reads them. */
function everyone(card: TripCard): number[] {
  return [...card.members.keys()];
}

/** What a new expense comes to: the payers' sum when they are named, as the write path derives it. */
function newTotal(card: TripCard, args: ToolArgs): number | null {
  const payers = payersOf(card, args.payers, Number.MAX_SAFE_INTEGER);
  return payers.length > 0 ? sumMinor(payers.map((payer) => payer.amount)) / 100 : amountOf(args.total_price);
}

/** A new expense from its arguments: who shares it is `members`, else `split`, else everyone on the trip. */
function newExpense(ctx: PreviewContext, args: ToolArgs, split: SplitMember[]): ExpensesCard | null {
  const name = argLine(args.name, 120);
  const total = newTotal(ctx.card, args);
  if (name === null || total === null) return null;
  return expenseCard({
    id: null,
    name,
    category: argLine(args.category, 60),
    amount: { amount: total, currency: codeOf(args.currency, ctx.card.currency) },
    tripAmount: null,
    date: dateOf(args.expense_date),
    place: placeOf(ctx.card, args.place_id),
    payers: payersOf(ctx.card, args.payers, ALL_PEOPLE.payers),
    ...splitOf(ctx.card, split, total, 0, ALL_PEOPLE.shares),
    note: argLine(args.note, 160),
    receipts: 0,
    before: null,
    highlight: [],
    change: 'new',
  });
}

/** `create_budget_item`: an uneven split, an even one among `member_ids` (none for `[]`), else everyone. */
export function createExpenseChange(ctx: PreviewContext, args: ToolArgs): ExpensesCard | null {
  const split = Array.isArray(args.members)
    ? unevenly(args.members)
    : evenly(Array.isArray(args.member_ids) ? idsOf(args.member_ids) : everyone(ctx.card));
  return newExpense(ctx, args, split);
}

/**
 * `create_budget_item_with_members`: shared evenly by `userIds`, or by
 * everyone on the trip when it lists nobody, an empty list included, as the
 * tool does and says.
 */
export function createWithMembersChange(ctx: PreviewContext, args: ToolArgs): ExpensesCard | null {
  const ids = idsOf(args.userIds);
  // The tool takes no currency, date or payers: the expense is in the trip currency and nobody paid yet.
  const own = { name: args.name, category: args.category, total_price: args.total_price, note: args.note };
  return newExpense(ctx, { ...own, place_id: args.place_id }, evenly(ids.length > 0 ? ids : everyone(ctx.card)));
}

/** The stored expense a change is about, as a row and as the card reads it. */
function storedExpense(ctx: PreviewContext, args: ToolArgs): { raw: Row; was: CardExpense } | null {
  const itemId = argId(args, 'itemId');
  const raw = itemId === null ? undefined : budgetRows(ctx.card).get(itemId);
  const was = raw ? expenseOf(ctx, raw) : null;
  return raw && was ? { raw, was } : null;
}

function expenseOf(ctx: PreviewContext, raw: unknown): CardExpense | null {
  return expenseFromRow(ctx.card, raw, {
    tripCurrency: codeOf(ctx.card.currency, null),
    caps: ALL_PEOPLE,
    change: 'changed',
  });
}

/** Whether a member was marked paid on the stored expense. */
function paidBefore(raw: Row, id: number): boolean {
  return rowsOf(raw.members).some((member) => member.user_id === id && (member.paid === 1 || member.paid === true));
}

/** The people a change brings into the split. */
function joined(was: CardExpense, now: CardExpense): number[] {
  const before = new Set(was.shares.map((share) => share.person.id));
  return now.shares.map((share) => share.person.id).filter((id) => !before.has(id));
}

/** What a change replaces, each value only where it differs; null when nothing it shows changes. */
function beforeOf(was: CardExpense, now: CardExpense): CardExpenseBefore | null {
  const moved = was.amount.amount !== now.amount.amount || was.amount.currency !== now.amount.currency;
  const before: CardExpenseBefore = {
    name: was.name !== now.name ? was.name : null,
    amount: moved ? was.amount : null,
    category: was.category !== now.category ? was.category : null,
    date: was.date !== now.date ? was.date : null,
    split: was.split !== now.split ? was.split : null,
  };
  return Object.values(before).some((value) => value !== null) ? before : null;
}

/** The stored row with an update's arguments laid over it, the way the write path stores them. */
function updatedRow(ctx: PreviewContext, raw: Row, args: ToolArgs): Row {
  const next: Row = { ...raw };
  const payers = payersOf(ctx.card, args.payers, Number.MAX_SAFE_INTEGER);
  const total = amountOf(args.total_price);
  if (Array.isArray(args.payers)) {
    next.payers = payers.map((payer) => ({ user_id: payer.person.id, amount: payer.amount }));
    // The payers' sum is the total; clearing them keeps a total the call names, as the write path re-applies it.
    next.total_price =
      payers.length === 0 && total !== null ? total : sumMinor(payers.map((payer) => payer.amount)) / 100;
  } else if (total !== null) next.total_price = total;
  if (args.currency !== undefined) next.currency = args.currency;
  if (args.expense_date !== undefined) next.expense_date = args.expense_date;
  if (args.place_id !== undefined) next.place_id = args.place_id;
  const keep = (id: number) => ({ user_id: id, paid: paidBefore(raw, id) });
  if (Array.isArray(args.members)) {
    next.members = unevenly(args.members).map((member) => ({ ...keep(member.id), amount: member.amount }));
  } else if (Array.isArray(args.member_ids)) {
    next.members = idsOf(args.member_ids).map((id) => ({ ...keep(id), amount: null }));
  }
  return next;
}

/** `update_budget_item`: the expense as it will be, with what it replaces and who joins its split. */
export function updateExpenseChange(ctx: PreviewContext, args: ToolArgs): ExpensesCard | null {
  const stored = storedExpense(ctx, args);
  const laid = stored ? expenseOf(ctx, updatedRow(ctx, stored.raw, args)) : null;
  if (!stored || !laid) return null;
  const now: CardExpense = {
    ...laid,
    name: argLine(args.name, 120) ?? laid.name,
    category: typeof args.category === 'string' ? argLine(args.category, 60) : laid.category,
    note: args.note === undefined ? null : argLine(args.note, 160),
  };
  return expenseCard({ ...now, before: beforeOf(stored.was, now), highlight: joined(stored.was, now) });
}

/** `set_budget_item_members`: an even split among `userIds`, the paid ticks kept, own amounts dropped. */
export function setMembersChange(ctx: PreviewContext, args: ToolArgs): ExpensesCard | null {
  const stored = storedExpense(ctx, args);
  if (!stored || !Array.isArray(args.userIds)) return null;
  const members = idsOf(args.userIds).map((id) => ({ user_id: id, paid: paidBefore(stored.raw, id), amount: null }));
  const now = expenseOf(ctx, { ...stored.raw, members });
  if (!now) return null;
  return expenseCard({ ...now, before: beforeOf(stored.was, now), highlight: joined(stored.was, now) });
}

/** `toggle_budget_member_paid`: one member's paid tick set or taken off. */
export function togglePaidChange(ctx: PreviewContext, args: ToolArgs): ExpensesCard | null {
  const stored = storedExpense(ctx, args);
  const memberId = argId(args, 'memberId');
  if (!stored || memberId === null || typeof args.paid !== 'boolean') return null;
  const paid = args.paid;
  const shares = stored.was.shares.map((share) => (share.person.id === memberId ? { ...share, paid } : share));
  return expenseCard({ ...stored.was, shares, highlight: [memberId] });
}

/** `delete_budget_item`: the expense that goes. */
export function deleteExpenseChange(ctx: PreviewContext, args: ToolArgs): ExpensesCard | null {
  const stored = storedExpense(ctx, args);
  return stored ? expenseCard({ ...stored.was, change: 'willDelete' }) : null;
}

/** A payment from its arguments; the stored one's values stand in for those the call leaves out. */
function paymentOf(card: TripCard, args: ToolArgs, base: Row | undefined): CardPayment | null {
  const stored = recordOf(base);
  const from = argId(args, 'from_user_id') ?? positiveId(stored.from_user_id);
  const to = argId(args, 'to_user_id') ?? positiveId(stored.to_user_id);
  const amount = amountOf(args.amount ?? stored.amount);
  if (from === null || to === null || amount === null || amount <= 0) return null;
  const currency = args.currency === undefined ? stored.currency : args.currency;
  const settled = args.settled_at === undefined ? stored.settled_at : args.settled_at;
  // Someone who left the trip keeps the name the stored payment gives them.
  const side = (id: number, key: 'from' | 'to') =>
    stored[`${key}_user_id`] === id
      ? personFrom(card, id, stored[`${key}_username`], stored[`${key}_avatar_url`])
      : personFrom(card, id);
  return {
    id: positiveId(stored.id),
    from: side(from, 'from'),
    to: side(to, 'to'),
    amount: { amount, currency: codeOf(currency, card.currency) },
    date: dateOf(settled) ?? dateOf(stored.created_at),
    note: args.note === undefined ? clipped(stored.note, 120) : argLine(args.note, 120),
    before: null,
    change: base ? 'changed' : 'new',
  };
}

/** `create_settlement`: who pays whom how much, and on which day. */
export function createPaymentChange(ctx: PreviewContext, args: ToolArgs): PaymentsCard | null {
  const payment = paymentOf(ctx.card, args, undefined);
  return payment ? paymentCard(payment) : null;
}

/** `update_settlement`: the payment as it will be, with the people and the amount it replaces. */
export function updatePaymentChange(ctx: PreviewContext, args: ToolArgs, loaded: unknown): PaymentsCard | null {
  const base = settlementRow(loaded, argId(args, 'settlementId'));
  const was = base ? paymentFromRow(ctx.card, base, 'none') : null;
  const now = paymentOf(ctx.card, args, base);
  if (!now) return null;
  if (!was) return paymentCard({ ...now, id: argId(args, 'settlementId'), change: 'changed' });
  const moved = was.amount.amount !== now.amount.amount || was.amount.currency !== now.amount.currency;
  const before = {
    from: was.from.id !== now.from.id ? was.from : null,
    to: was.to.id !== now.to.id ? was.to : null,
    amount: moved ? was.amount : null,
  };
  const changed = before.from !== null || before.to !== null || before.amount !== null;
  return paymentCard({ ...now, before: changed ? before : null });
}

/** `delete_settlement`: the payment that goes, when the lookup found it. */
export function deletePaymentChange(ctx: PreviewContext, args: ToolArgs, loaded: unknown): PaymentsCard | null {
  const base = settlementRow(loaded, argId(args, 'settlementId'));
  const payment = base ? paymentFromRow(ctx.card, base, 'willDelete') : null;
  return payment ? paymentCard(payment) : null;
}
