import { ADDON_IDS } from '../../addons';
import { noAccess } from '../../mcp/tools/_shared';
import { McpController, Tool, TOOL_ANNOTATIONS_READONLY, ok, type McpContext } from '../../nest-mcp';
import type { BudgetItem } from '../../types';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { tripConverter } from './budget-money.helpers';
import { BudgetService } from './budget.service';
import {
  BUDGET_ITEMS_PAGE_DEFAULT,
  budgetItemsPageSchema,
  idSchema,
  toMinor,
  type BudgetItemsPage,
} from '@trek/shared';

/** The whole budget surface rides the budget addon, as in BudgetMcp. */
const budgetAddonOn = addonGate(ADDON_IDS.BUDGET);

/**
 * How long the expenses of one page may run as JSON. The assistant cuts a tool
 * answer at 40,000 characters, and a page cut there would leave its last rows
 * unread while next_offset skips past them. So a page ends early, before that
 * cut, and next_offset starts at the first expense it left out; the totals and
 * the names next to the page fit in what is left.
 */
const PAGE_CHARS = 30_000;

/** How much of an expense's note a page carries: enough to tell two similar expenses apart. */
const NOTE_CHARS = 200;

/** A split or payer list the service always fills; an empty one when it did not. */
function rows<T>(list: T[] | undefined): T[] {
  return list ?? [];
}

function shortNote(note: string | null | undefined): string | null {
  const line = (note ?? '').replace(/\s+/g, ' ').trim();
  if (!line) return null;
  return line.length > NOTE_CHARS ? `${line.slice(0, NOTE_CHARS - 1)}…` : line;
}

/** Today's rates for the expenses that froze none, as the totals use them; null when none were needed. */
type Rates = Record<string, number> | null;

/**
 * A foreign expense in the trip currency, at the rate it was booked at (else
 * today's), to the cent; null for one in the trip currency or one no rate
 * converts.
 */
function tripAmount(item: BudgetItem, tripCurrency: string, rates: Rates): number | null {
  if ((item.currency || tripCurrency).toUpperCase() === tripCurrency) return null;
  const convert = tripConverter(item.currency, item.exchange_rate, tripCurrency, rates);
  return convert ? toMinor(convert(item.total_price || 0)) / 100 : null;
}

/**
 * One expense as the tool answers it: the fields a model plans with and a
 * card shows, without the avatars, receipt files and itemised ticket the REST
 * row carries, and with the start of its note and the number of its receipts.
 * Amounts stay in the expense's own currency, which is the trip's when the row
 * names none; a foreign one also says what it comes to in the trip currency.
 */
function slimItem(item: BudgetItem, tripCurrency: string, rates: Rates) {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    total_price: item.total_price,
    currency: item.currency || tripCurrency,
    trip_amount: tripAmount(item, tripCurrency, rates),
    expense_date: item.expense_date ?? null,
    note: shortNote(item.note),
    place_id: item.place_id ?? null,
    reservation_id: item.reservation_id ?? null,
    payers: rows(item.payers).map((p) => ({ user_id: p.user_id, amount: p.amount })),
    members: rows(item.members).map((m) => ({ user_id: m.user_id, amount: m.amount ?? null, paid: m.paid === 1 })),
    receipt_count: rows(item.receipts).length,
  };
}

/**
 * The expenses a page answers: the ones asked for, in order, until their JSON
 * would pass PAGE_CHARS. Always at least one, so a page is never empty while
 * expenses are left.
 */
function fillPage(items: BudgetItem[], tripCurrency: string, rates: Rates) {
  const page: ReturnType<typeof slimItem>[] = [];
  let chars = 0;
  for (const item of items) {
    const slim = slimItem(item, tripCurrency, rates);
    chars += JSON.stringify(slim).length + 1;
    if (page.length > 0 && chars > PAGE_CHARS) break;
    page.push(slim);
  }
  return page;
}

/** The names behind the user ids on a page, once each, so a split reads as people rather than numbers. */
function peopleOf(items: BudgetItem[]) {
  const names = new Map<number, string>();
  for (const item of items) {
    for (const person of [...rows(item.members), ...rows(item.payers)]) {
      if (person.username && !names.has(person.user_id)) names.set(person.user_id, person.username);
    }
  }
  return [...names].sort(([a], [b]) => a - b).map(([user_id, username]) => ({ user_id, username }));
}

/**
 * The budget's read tools that answer with the rows themselves: the expense
 * list (the twin of GET /api/trips/:tripId/budget) and the per-person totals
 * (GET …/budget/summary/per-person). Same service calls and the same trip
 * access as the routes, which ask for no permission beyond it; BudgetMcp has
 * the writes and the settlement. A page of the list is a projection small
 * enough for a model, with the totals of the whole budget next to it.
 */
@McpController()
export class BudgetItemsMcp {
  constructor(
    private readonly budget: BudgetService,
    readonly addons: AddonsService,
  ) {}

  @Tool({
    name: 'list_budget_items',
    description: `List the trip's expenses with their ids, up to ${BUDGET_ITEMS_PAGE_DEFAULT} at a time from offset. A page of long expenses ends earlier, so always go on at next_offset (null on the last page). Each expense: name, category, total_price in its currency, expense_date, the start of its note, the place or booking it belongs to (place_id, reservation_id), who paid how much (payers), who shares it (members: amount is the member's share on an uneven split, null on an equal one; paid says whether they paid their share), trip_amount (a foreign expense in the trip currency, null otherwise or without a rate) and receipt_count. people names the user ids. Next to the page, over all expenses: the trip currency, the total and the totals per category in it, and unconverted_item_ids, foreign expenses no exchange rate converts, which count in no total. Use the ids with update_budget_item and delete_budget_item.`,
    inputSchema: { tripId: idSchema, ...budgetItemsPageSchema.shape },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: budgetAddonOn,
    access: { group: 'budget', mode: 'read' },
  })
  async listBudgetItems({ tripId, offset, limit }: { tripId: number } & BudgetItemsPage, ctx: McpContext) {
    const trip = await this.budget.verifyTripAccess(tripId, ctx.userId);
    if (!trip) return noAccess();
    const currency = (trip.currency || 'EUR').toUpperCase();
    const items = await this.budget.listBudgetItems(tripId);
    // The figures get_trip_summary shows: each row at the rate it was booked at (#2525).
    const rates = await this.budget.ratesForTripTotals(tripId, currency);
    const totals = await this.budget.tripTotals(tripId, currency, rates);
    const start = offset ?? 0;
    const page = fillPage(items.slice(start, start + (limit ?? BUDGET_ITEMS_PAGE_DEFAULT)), currency, rates);
    const end = start + page.length;
    return ok({
      currency,
      total: totals.total,
      by_category: totals.byCategory,
      unconverted_item_ids: totals.unconverted,
      item_count: items.length,
      offset: start,
      next_offset: end < items.length ? end : null,
      items: page,
      people: peopleOf(items.slice(start, end)),
    });
  }

  @Tool({
    name: 'get_budget_per_person',
    description:
      "What each person on the trip's expenses owes in all and how much of that they paid, in the trip currency: per user total_assigned (their shares of the expenses they are part of), total_paid (the shares marked paid) and items_count. Each share is converted at the rate its expense was booked at; a foreign expense no exchange rate converts counts for nobody. For who has to pay whom to settle up, use get_settlement_summary.",
    inputSchema: { tripId: idSchema },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: budgetAddonOn,
    access: { group: 'budget', mode: 'read' },
  })
  async getBudgetPerPerson({ tripId }: { tripId: number }, ctx: McpContext) {
    if (!(await this.budget.verifyTripAccess(tripId, ctx.userId))) return noAccess();
    return ok({ summary: await this.budget.perPersonSummary(tripId) });
  }
}
