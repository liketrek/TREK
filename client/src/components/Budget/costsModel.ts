import type { BudgetParticipantFinal, BudgetUnconverted, CostCategory } from '@trek/shared';
import { convertBooked, convertedLine, tripAmountOf } from '../../hooks/useExchangeRates';
import type { BudgetItem } from '../../types';
import { currencyDecimals } from '../../utils/formatters';
import { currenciesWith, SYMBOLS } from './BudgetPanel.constants';
import { paidByUser, readUserNote, settlementDate, splitEqualShares } from './CostsPanel.helpers';
import { catMeta, COST_CATEGORY_LIST } from './costsCategories';

/**
 * Costs view-model: the ledger maths both Costs surfaces run on, the desktop
 * `CostsPanel.tsx` and the phone `MCostsTab.tsx` (baseTotal, myPaidOf, the
 * shares, isUnfinished, totals, filters, payments, the category breakdown and
 * the CSV), so the two never disagree. Decoupled from React so it stays
 * testable. Money is converted to the display/base currency via an injected
 * `convert` (from `useExchangeRates`), never computed here.
 */

/** Per-render context every money computation needs — cheap to build, memoize in the caller. */
export interface CostsCtx {
  me: number;
  /** The trip's own currency — what a NULL `budget_items.currency` means. */
  tripCurrency: string;
  /** The currency everything is shown in, the base `convert` converts to. */
  displayCurrency: string;
  convert: (amount: number, currency: string | null | undefined) => number;
}

/** An expense's own currency, defaulting to the trip currency (NULL column = trip currency). */
export function currencyOf(e: BudgetItem, ctx: CostsCtx): string {
  return (e.currency || ctx.tripCurrency).toUpperCase();
}

/** An amount of this expense in the display currency, at the rate the expense was booked at. */
export function booked(amount: number, e: BudgetItem, ctx: CostsCtx): number {
  return convertBooked(amount, e.currency, e.exchange_rate, ctx.tripCurrency, ctx.convert);
}

/**
 * The line under an amount of this expense the list shows converted, what was entered and
 * where it went (#2525); null when there is nothing to explain. `shown` is the display
 * value printed beside it.
 */
export function lineOf(amount: number, e: BudgetItem, ctx: CostsCtx, shown: number) {
  return convertedLine(amount, e.currency, e.exchange_rate, ctx.tripCurrency, ctx.displayCurrency, shown);
}

/** Expense total converted to the display/base currency, at its booked rate. */
export function baseTotal(e: BudgetItem, ctx: CostsCtx): number {
  return booked(e.total_price || 0, e, ctx);
}

/** How much `ctx.me` personally fronted for this expense, in the base currency. */
export function myPaidOf(e: BudgetItem, ctx: CostsCtx): number {
  return booked(paidByUser(e, ctx.me), e, ctx);
}

/** A given member's share of this expense (explicit custom amount, else equal split), base currency. */
export function memberShareOf(e: BudgetItem, userId: number, ctx: CostsCtx): number {
  const member = (e.members || []).find((m) => m.user_id === userId);
  if (!member) return 0;
  if (member.amount !== null && member.amount !== undefined) {
    return booked(member.amount, e, ctx);
  }
  const shares = splitEqualShares(e.total_price || 0, e.members || [], e.id);
  return booked(shares[userId] || 0, e, ctx);
}

/** `ctx.me`'s own share — the common case of {@link memberShareOf}. */
export function myShareOf(e: BudgetItem, ctx: CostsCtx): number {
  return memberShareOf(e, ctx.me, ctx);
}

/** How a ledger counts `ctx.me`'s share of one expense, for the totals and the "owed" filter. */
export type ShareOf = (e: BudgetItem, ctx: CostsCtx) => number;

/**
 * A recorded total nobody has actually paid yet — counts toward the trip total
 * but stays out of settlement. A negative total (a refund, #2176) is just as
 * unfinished until its recipient is recorded as the (negative) payer.
 */
export function isUnfinished(e: BudgetItem, ctx: CostsCtx): boolean {
  return baseTotal(e, ctx) !== 0 && (e.payers || []).filter((p) => p.amount !== 0).length === 0;
}

/**
 * `ctx.me`'s share as the desktop ledger counts it: nobody paid, so nobody owes.
 * The ledger skips an unfinished expense entirely (#2225), and counting it here
 * left the tile contradicting the balances right beside it.
 */
export function settledShareOf(e: BudgetItem, ctx: CostsCtx): number {
  return isUnfinished(e, ctx) ? 0 : myShareOf(e, ctx);
}

// ── settlement (server-computed; these types describe what both ledgers read from it) ──

export interface CostsSettlementFlow {
  from: { user_id: number; username: string; avatar_url?: string | null };
  to: { user_id: number; username: string; avatar_url?: string | null };
  amount: number;
}

export interface CostsBalance {
  user_id: number;
  username: string;
  avatar_url: string | null;
  balance: number;
}

/** A recorded settle-up transfer ("Ajouter un paiement") — history, not a suggestion like {@link CostsSettlementFlow}. */
export interface CostsSettlement {
  id: number;
  from_user_id: number;
  to_user_id: number;
  amount: number;
  // Legacy rows predate this column (null) and are read as the display currency.
  currency?: string | null;
  // The rate frozen when the transfer was settled, units of `currency` per 1 trip
  // currency (#1445). Absent, or exactly 1, on rows written before the freeze existed.
  exchange_rate?: number;
  created_at?: string;
  // The day the transfer actually happened; editable, unlike created_at (when it
  // was recorded). Null/absent on rows predating this field.
  settled_at?: string | null;
  /** A free-text note on the payment (#2340). */
  note?: string | null;
}

/** The currency a recorded payment was entered in: legacy rows without one were in the display currency. */
function paymentCurrency(s: CostsSettlement, ctx: CostsCtx): string {
  return (s.currency || ctx.displayCurrency).toUpperCase();
}

/** A recorded payment in the display currency, at the rate frozen when it was settled (#1445). */
export function paymentAmount(s: CostsSettlement, ctx: CostsCtx): number {
  return convertBooked(s.amount, paymentCurrency(s, ctx), s.exchange_rate, ctx.tripCurrency, ctx.convert);
}

/** The line under a payment shown converted, explained the way an expense's is (#2525). */
export function paymentLineOf(s: CostsSettlement, ctx: CostsCtx, shown: number) {
  return convertedLine(
    s.amount,
    paymentCurrency(s, ctx),
    s.exchange_rate,
    ctx.tripCurrency,
    ctx.displayCurrency,
    shown
  );
}

export interface CostsSettlementResponse {
  balances: CostsBalance[];
  flows: CostsSettlementFlow[];
  settlements: CostsSettlement[];
  /** What the trip ends up costing each participant — netted server-side off the same ledger as `balances`. */
  finalBudgets: BudgetParticipantFinal[];
  /** The currency the figures are in: the display currency, or the trip's own without a quote for it. */
  currency?: string;
  /** Rows no rate could convert, left out of every figure above. */
  unconverted?: BudgetUnconverted;
}

// ── hero / tile totals (spec §3.1-§3.3) ────────────────────────────────────

export interface CostsTotals {
  totalSpend: number;
  myPaid: number;
  myShare: number;
  owe: number;
  owed: number;
  outstanding: number;
  outstandingCount: number;
}

export function computeTotals(
  items: BudgetItem[],
  flows: CostsSettlementFlow[],
  ctx: CostsCtx,
  shareOf: ShareOf = myShareOf
): CostsTotals {
  const totalSpend = items.reduce((a, e) => a + baseTotal(e, ctx), 0);
  const myPaid = items.reduce((a, e) => a + myPaidOf(e, ctx), 0);
  const myShare = items.reduce((a, e) => a + shareOf(e, ctx), 0);
  const owe = flows.filter((f) => f.from.user_id === ctx.me).reduce((a, f) => a + f.amount, 0);
  const owed = flows.filter((f) => f.to.user_id === ctx.me).reduce((a, f) => a + f.amount, 0);
  const outstandingItems = items.filter((e) => isUnfinished(e, ctx));
  const outstanding = outstandingItems.reduce((a, e) => a + baseTotal(e, ctx), 0);
  return { totalSpend, myPaid, myShare, owe, owed, outstanding, outstandingCount: outstandingItems.length };
}

// ── expenses list: filter + group (spec §3.6-§3.7) ─────────────────────────

export type CostsSegment = 'all' | 'mine' | 'owed';

export interface CostsFilterState {
  search: string;
  segment: CostsSegment;
  /** '' = all categories */
  categoryKey: string;
  /** '' = all days, else the expense's own YYYY-MM-DD */
  dayKey: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * `mine`/`owed` use the real balance, not the demo's `payer==='you'` shortcut
 * (spec 03 §3.6): `mine` = I fronted money on it, `owed` = I'm net owed on it.
 */
export function filterBudgetItems(
  items: BudgetItem[],
  f: CostsFilterState,
  ctx: CostsCtx,
  shareOf: ShareOf = myShareOf
): BudgetItem[] {
  let list = items.slice();
  if (f.segment === 'mine') list = list.filter((e) => myPaidOf(e, ctx) > 0);
  if (f.segment === 'owed') list = list.filter((e) => round2(myPaidOf(e, ctx) - shareOf(e, ctx)) > 0);
  if (f.categoryKey) list = list.filter((e) => catMeta(e.category).key === f.categoryKey);
  if (f.dayKey) list = list.filter((e) => (e.expense_date || '') === f.dayKey);
  const q = f.search.trim().toLowerCase();
  if (q) list = list.filter((e) => e.name.toLowerCase().includes(q));
  return list;
}

export interface CostsDayGroup {
  /** '' = no date (spec's "NO DATE" group) */
  dateKey: string;
  items: BudgetItem[];
}

/** Groups by `expense_date`, newest first, the no-date bucket sinking to the end (spec §3.7). */
export function groupByDay(items: BudgetItem[]): CostsDayGroup[] {
  const byDate = new Map<string, BudgetItem[]>();
  for (const e of items) {
    const key = e.expense_date || '';
    const bucket = byDate.get(key);
    if (bucket) bucket.push(e);
    else byDate.set(key, [e]);
  }
  const keys = Array.from(byDate.keys()).sort((a, b) => {
    if (a === b) return 0;
    if (a === '') return 1;
    if (b === '') return -1;
    return b.localeCompare(a);
  });
  return keys.map((dateKey) => ({ dateKey, items: byDate.get(dateKey) as BudgetItem[] }));
}

/**
 * Settlements ("payments") shown inline in the ledger: they have no name or
 * category, so a text or category filter hides them; "owed" excludes them;
 * "mine" keeps only transfers the current user is part of.
 */
export function filterSettlements(settlements: CostsSettlement[], f: CostsFilterState, me: number): CostsSettlement[] {
  if (f.search.trim() || f.categoryKey) return [];
  if (f.segment === 'owed') return [];
  let list = settlements.slice();
  if (f.segment === 'mine') list = list.filter((s) => s.from_user_id === me || s.to_user_id === me);
  if (f.dayKey) list = list.filter((s) => settlementDate(s) === f.dayKey);
  return list;
}

export type CostsLedgerEntry =
  { kind: 'expense'; date: string; item: BudgetItem } | { kind: 'payment'; date: string; settlement: CostsSettlement };

export interface CostsLedgerDayGroup {
  /** '' = no date (spec's "NO DATE" group) */
  dateKey: string;
  entries: CostsLedgerEntry[];
}

/**
 * Like {@link groupByDay}, but also folds in settlement payments (see
 * {@link filterSettlements}) as their own ledger entries, keyed by
 * {@link settlementDate} — the mobile counterpart to desktop's unified
 * `LedgerEntry` grouping, so a payment shows up even on a day with no expense.
 */
export function groupLedgerByDay(items: BudgetItem[], settlements: CostsSettlement[]): CostsLedgerDayGroup[] {
  const entries: CostsLedgerEntry[] = [
    ...items.map((item) => ({ kind: 'expense' as const, date: item.expense_date || '', item })),
    ...settlements.map((settlement) => ({ kind: 'payment' as const, date: settlementDate(settlement), settlement })),
  ];
  const byDate = new Map<string, CostsLedgerEntry[]>();
  for (const en of entries) {
    const bucket = byDate.get(en.date);
    if (bucket) bucket.push(en);
    else byDate.set(en.date, [en]);
  }
  const keys = Array.from(byDate.keys()).sort((a, b) => {
    if (a === b) return 0;
    if (a === '') return 1;
    if (b === '') return -1;
    return b.localeCompare(a);
  });
  return keys.map((dateKey) => ({ dateKey, entries: byDate.get(dateKey) as CostsLedgerEntry[] }));
}

/** Categories present among `items`, canonical order — the dropdown only lists categories in use (spec §3.6). */
export function categoryFilterKeys(items: BudgetItem[]): CostCategory[] {
  const present = new Set(items.map((e) => catMeta(e.category).key));
  return COST_CATEGORY_LIST.map((c) => c.key).filter((k) => present.has(k));
}

/** Distinct expense dates, ascending (spec §3.6: "Tage mit Ausgaben aufsteigend"). */
export function dayFilterKeys(items: BudgetItem[]): string[] {
  const dates = new Set(items.map((e) => e.expense_date).filter((d): d is string => Boolean(d)));
  return Array.from(dates).sort((a, b) => a.localeCompare(b));
}

// ── by-category breakdown (spec §3.5) ───────────────────────────────────────

export interface CostsCategoryBar {
  key: CostCategory;
  amount: number;
  /** 0-100, relative to the largest category (not the grand total) — spec §3.5. */
  widthPct: number;
}

export function categoryBreakdown(items: BudgetItem[], ctx: CostsCtx): CostsCategoryBar[] {
  // Categories net refunds against spend (#2176): a negative entry lowers its
  // category's sum. A category that nets negative keeps its own row at the
  // bottom, with widthPct 0 — the bars rank positive spend, and a negative
  // CSS width would be dropped and render as a full bar.
  const totals = new Map<CostCategory, number>();
  for (const e of items) {
    const key = catMeta(e.category).key;
    totals.set(key, (totals.get(key) || 0) + baseTotal(e, ctx));
  }
  const rows = COST_CATEGORY_LIST.map((c) => ({ key: c.key, amount: totals.get(c.key) || 0 }))
    .filter((r) => r.amount !== 0)
    .sort((a, b) => b.amount - a.amount);
  const max = Math.max(0, ...rows.map((r) => r.amount));
  return rows.map((r) => ({ ...r, widthPct: max > 0 && r.amount > 0 ? (r.amount / max) * 100 : 0 }));
}

// ── presentation helpers ─────────────────────────────────────────────────

/** Category colour at a fixed alpha — the expense card's border tint (spec §3.10: "brC"). */
export function tint(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── CSV export (spec §3.8 `csvGo`; string-building only — the caller turns this into a download) ──

export interface CsvBuildOptions {
  base: string;
  ctx: CostsCtx;
  locale: string;
  tripTitle?: string | null;
  t: (key: string) => string;
  /** The Currency column; {@link currencyOf} unless the caller writes it as stored. */
  currencyOf?: (e: BudgetItem) => string;
}

/** The Costs CSV export's rows, one per expense, oldest first; the Blob/download is a DOM concern left to the caller. */
export function buildCostsCsv(items: BudgetItem[], opts: CsvBuildOptions): { filename: string; content: string } {
  const sep = ';';
  // A cell starting with =, +, -, @, TAB or CR is evaluated as a formula by Excel
  // and Sheets, and the name/note columns are free text any trip member can write.
  const esc = (v: unknown) => {
    let s = String(v ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return s.includes(sep) || s.includes('"') || s.includes('\n') ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const fmtDate = (iso: string) => {
    if (!iso) return '';
    try {
      return new Date(iso + 'T00:00:00Z').toLocaleDateString(opts.locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC',
      });
    } catch {
      return iso;
    }
  };

  // Read in another currency than the trip's, what each row counts as in the trip currency
  // too, the figure every sum is built from (#2525).
  const trip = opts.ctx.tripCurrency.toUpperCase();
  const tripCol = trip !== opts.base.toUpperCase();
  const header = [
    'Date',
    'Name',
    'Category',
    'Amount',
    'Currency',
    ...(tripCol ? [`Amount (${trip})`] : []),
    `Amount (${opts.base})`,
    'Note',
  ];
  const rows = [header.join(sep)];
  const sorted = items.slice().sort((a, b) => (a.expense_date || '').localeCompare(b.expense_date || ''));
  for (const e of sorted) {
    const cur = opts.currencyOf ? opts.currencyOf(e) : currencyOf(e, opts.ctx);
    const note = readUserNote(e);
    const inTrip = tripAmountOf(e.total_price || 0, e.currency, e.exchange_rate, trip, opts.ctx.convert);
    rows.push(
      [
        esc(fmtDate(e.expense_date || '')),
        esc(e.name),
        esc(opts.t(catMeta(e.category).labelKey)),
        (e.total_price || 0).toFixed(currencyDecimals(cur)),
        cur,
        ...(tripCol ? [inTrip.toFixed(currencyDecimals(trip))] : []),
        baseTotal(e, opts.ctx).toFixed(currencyDecimals(opts.base)),
        esc(note),
      ].join(sep)
    );
  }

  const safeName = (opts.tripTitle || 'trip').replace(/[^a-zA-Z0-9À-ɏ _-]/g, '').trim();
  return { filename: `costs-${safeName}.csv`, content: rows.join('\r\n') };
}

/**
 * The currency picker of every Costs form (expense and payment, desktop and
 * phone): the supported currencies plus the one already chosen, each labelled
 * with its code and, when it has one, its symbol.
 */
export function currencyOptions(current?: string | null): { value: string; label: string }[] {
  return currenciesWith(current).map((c) => ({ value: c, label: SYMBOLS[c] ? `${c}  ${SYMBOLS[c]}` : c }));
}
