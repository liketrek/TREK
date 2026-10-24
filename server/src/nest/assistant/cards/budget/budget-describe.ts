import type { Described, PreviewContext, ToolArgs } from '../card-types';
import { argId, recordOf, type Row } from '../card-values';
import { formatDate, id, memberNames, money, placeName, Rows, text } from '../preview-format';
import { rowsOf } from '../undo-snapshot';
import { budgetRows, codeOf, settlementRow } from './budget-values';

/**
 * The change cards, in words, of the budget writes that had none of their
 * own: an expense added with its split, who shares one, who has paid their
 * part, an expense removed, and the settle-up payments recorded, changed and
 * removed. Each names the tool it runs, so the card reads the tool's own
 * action ("Record a payment") rather than a plain add or change. The
 * expense or payment it is about is named from the turn's trip summary or the
 * payments its lookup read; one the card cannot find reads as its id.
 */

/** The stored expense a call names with `itemId`. */
function expense(ctx: PreviewContext, args: ToolArgs): Row | undefined {
  const itemId = argId(args, 'itemId');
  return itemId === null ? undefined : budgetRows(ctx.card).get(itemId);
}

function expenseName(ctx: PreviewContext, args: ToolArgs): string {
  const found = expense(ctx, args);
  const itemId = argId(args, 'itemId');
  return text(found?.name) || (itemId === null ? '' : `#${itemId}`);
}

/** Who shares a stored expense, by name. */
function sharedBy(ctx: PreviewContext, row: Row | undefined): string {
  return memberNames(
    ctx,
    rowsOf(row?.members).map((member) => member.user_id),
  );
}

/** "Ana → Ben", from the two people of a payment. */
function between(ctx: PreviewContext, from: unknown, to: unknown): string {
  const named = [from, to].map((person) => (typeof person === 'number' ? memberNames(ctx, [person]) : ''));
  return named.every((name) => name !== '') ? text(`${named[0]} → ${named[1]}`) : '';
}

/** An amount in its currency, empty for one that is no number. */
function amount(ctx: PreviewContext, value: unknown, currency: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '';
  return money(ctx, value, codeOf(currency, ctx.card.currency));
}

function day(ctx: PreviewContext, value: unknown): string {
  return typeof value === 'string' && value !== '' ? formatDate(ctx, value.slice(0, 10)) : '';
}

/** The stored payment `settlementId` names, from the payments the lookup read. */
function payment(args: ToolArgs, loaded: unknown): Row {
  return recordOf(settlementRow(loaded, argId(args, 'settlementId')));
}

/** "Ana → Ben" for a payment, its id where the card cannot name both people. */
function paymentSubject(ctx: PreviewContext, row: Row, args: ToolArgs): string {
  const named = between(ctx, args.from_user_id ?? row.from_user_id, args.to_user_id ?? row.to_user_id);
  const settlementId = argId(args, 'settlementId');
  return named || (settlementId === null ? '' : `#${settlementId}`);
}

export const BUDGET_DESCRIBERS = {
  create_budget_item_with_members: (ctx, args) => {
    const placeId = id(args, 'place_id');
    const ids = Array.isArray(args.userIds) && args.userIds.length > 0 ? args.userIds : [...ctx.card.members.keys()];
    const rows = new Rows()
      .add('price', amount(ctx, args.total_price, ctx.card.currency))
      .add('category', text(args.category))
      .add('members', memberNames(ctx, ids))
      .add('location', placeName(ctx, placeId))
      .add('notes', text(args.note));
    return {
      subject: text(args.name),
      rows,
      dayId: null,
      placeIds: placeId ? [placeId] : [],
      tool: 'create_budget_item_with_members',
    };
  },
  set_budget_item_members: (ctx, args) => {
    const rows = new Rows();
    if (Array.isArray(args.userIds)) {
      rows.change('members', sharedBy(ctx, expense(ctx, args)), memberNames(ctx, args.userIds));
    }
    return { subject: expenseName(ctx, args), rows, dayId: null, placeIds: [], tool: 'set_budget_item_members' };
  },
  toggle_budget_member_paid: (ctx, args) => {
    const memberId = argId(args, 'memberId');
    const who = memberId === null ? '' : memberNames(ctx, [memberId]);
    const rows = new Rows().add('members', who && typeof args.paid === 'boolean' ? `${who} ${text(args.paid)}` : who);
    return { subject: expenseName(ctx, args), rows, dayId: null, placeIds: [], tool: 'toggle_budget_member_paid' };
  },
  delete_budget_item: (ctx, args) => {
    const row = expense(ctx, args);
    const rows = new Rows().add('price', amount(ctx, row?.total_price, row?.currency));
    return { subject: expenseName(ctx, args), rows, dayId: null, placeIds: [], tool: 'delete_budget_item' };
  },
  create_settlement: (ctx, args) => {
    const rows = new Rows()
      .add('price', amount(ctx, args.amount, args.currency))
      .add('day', day(ctx, args.settled_at))
      .add('notes', text(args.note));
    return { subject: paymentSubject(ctx, {}, args), rows, dayId: null, placeIds: [], tool: 'create_settlement' };
  },
  update_settlement: (ctx, args, loaded) => {
    const row = payment(args, loaded);
    const rows = new Rows();
    const after = amount(ctx, args.amount, args.currency === undefined ? row.currency : args.currency);
    const before = amount(ctx, row.amount, row.currency);
    if (after !== '') rows.change('price', before === after ? null : before, after);
    if (args.settled_at !== undefined) rows.change('day', day(ctx, row.settled_at) || null, day(ctx, args.settled_at));
    if (args.note !== undefined) rows.change('notes', text(row.note) || null, text(args.note));
    return { subject: paymentSubject(ctx, row, args), rows, dayId: null, placeIds: [], tool: 'update_settlement' };
  },
  delete_settlement: (ctx, args, loaded) => {
    const row = payment(args, loaded);
    const rows = new Rows().add('price', amount(ctx, row.amount, row.currency));
    return { subject: paymentSubject(ctx, row, args), rows, dayId: null, placeIds: [], tool: 'delete_settlement' };
  },
} satisfies Readonly<Record<string, (ctx: PreviewContext, args: ToolArgs, loaded: unknown) => Described>>;
