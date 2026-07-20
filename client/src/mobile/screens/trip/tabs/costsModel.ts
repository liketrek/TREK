import type { CostCategory } from '@trek/shared'
import { splitEqualShares } from '../../../../components/Budget/CostsPanel'
import { catMeta, COST_CATEGORY_LIST } from '../../../../components/Budget/costsCategories'
import { currencyDecimals } from '../../../../utils/formatters'
import type { BudgetItem } from '../../../../types'

/**
 * Costs view-model — the real-data counterpart to the demo's `EXPS`/`CATS`
 * (spec 03 §3.10). Every function here mirrors the desktop `CostsPanel.tsx`
 * maths 1:1 (baseTotal/myPaidOf/myShareOf/isUnfinished/totals/filters/CSV) so
 * the two surfaces never disagree, decoupled from React so it stays testable.
 * Money is converted to the display/base currency via an injected `convert`
 * (from `useExchangeRates`), never computed here.
 */

/** Per-render context every money computation needs — cheap to build, memoize in the caller. */
export interface CostsCtx {
  me: number
  /** The trip's own currency — what a NULL `budget_items.currency` means. */
  tripCurrency: string
  convert: (amount: number, currency: string | null | undefined) => number
}

/** An expense's own currency, defaulting to the trip currency (NULL column = trip currency). */
export function currencyOf(e: BudgetItem, ctx: CostsCtx): string {
  return (e.currency || ctx.tripCurrency).toUpperCase()
}

/** Expense total converted to the display/base currency. */
export function baseTotal(e: BudgetItem, ctx: CostsCtx): number {
  return ctx.convert(e.total_price || 0, currencyOf(e, ctx))
}

/** How much `ctx.me` personally fronted for this expense, in the base currency. */
export function myPaidOf(e: BudgetItem, ctx: CostsCtx): number {
  return (e.payers || [])
    .filter(p => p.user_id === ctx.me)
    .reduce((a, p) => a + ctx.convert(p.amount, currencyOf(e, ctx)), 0)
}

/** A given member's share of this expense (explicit custom amount, else equal split), base currency. */
export function memberShareOf(e: BudgetItem, userId: number, ctx: CostsCtx): number {
  const member = (e.members || []).find(m => m.user_id === userId)
  if (!member) return 0
  if (member.amount !== null && member.amount !== undefined) {
    return ctx.convert(member.amount, currencyOf(e, ctx))
  }
  const shares = splitEqualShares(e.total_price || 0, e.members || [], e.id)
  return ctx.convert(shares[userId] || 0, currencyOf(e, ctx))
}

/** `ctx.me`'s own share — the common case of {@link memberShareOf}. */
export function myShareOf(e: BudgetItem, ctx: CostsCtx): number {
  return memberShareOf(e, ctx.me, ctx)
}

/** A recorded total nobody has actually paid yet — counts toward the trip total but stays out of settlement. */
export function isUnfinished(e: BudgetItem, ctx: CostsCtx): boolean {
  return baseTotal(e, ctx) > 0 && (e.payers || []).filter(p => p.amount > 0).length === 0
}

// ── settlement (server-computed; these types describe what MCostsTab reads from it) ──

export interface CostsSettlementFlow {
  from: { user_id: number; username: string; avatar_url?: string | null }
  to: { user_id: number; username: string; avatar_url?: string | null }
  amount: number
}

export interface CostsBalance {
  user_id: number
  username: string
  avatar_url: string | null
  balance: number
}

export interface CostsSettlementResponse {
  balances: CostsBalance[]
  flows: CostsSettlementFlow[]
}

// ── hero / tile totals (spec §3.1-§3.3) ────────────────────────────────────

export interface CostsTotals {
  totalSpend: number
  myPaid: number
  myShare: number
  owe: number
  owed: number
  outstanding: number
  outstandingCount: number
}

export function computeTotals(items: BudgetItem[], flows: CostsSettlementFlow[], ctx: CostsCtx): CostsTotals {
  const totalSpend = items.reduce((a, e) => a + baseTotal(e, ctx), 0)
  const myPaid = items.reduce((a, e) => a + myPaidOf(e, ctx), 0)
  const myShare = items.reduce((a, e) => a + myShareOf(e, ctx), 0)
  const owe = flows.filter(f => f.from.user_id === ctx.me).reduce((a, f) => a + f.amount, 0)
  const owed = flows.filter(f => f.to.user_id === ctx.me).reduce((a, f) => a + f.amount, 0)
  const outstandingItems = items.filter(e => isUnfinished(e, ctx))
  const outstanding = outstandingItems.reduce((a, e) => a + baseTotal(e, ctx), 0)
  return { totalSpend, myPaid, myShare, owe, owed, outstanding, outstandingCount: outstandingItems.length }
}

// ── expenses list: filter + group (spec §3.6-§3.7) ─────────────────────────

export type CostsSegment = 'all' | 'mine' | 'owed'

export interface CostsFilterState {
  search: string
  segment: CostsSegment
  /** '' = all categories */
  categoryKey: string
  /** '' = all days, else the expense's own YYYY-MM-DD */
  dayKey: string
}

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * `mine`/`owed` use the real balance, not the demo's `payer==='you'` shortcut
 * (spec 03 §3.6): `mine` = I fronted money on it, `owed` = I'm net owed on it.
 */
export function filterBudgetItems(items: BudgetItem[], f: CostsFilterState, ctx: CostsCtx): BudgetItem[] {
  let list = items.slice()
  if (f.segment === 'mine') list = list.filter(e => myPaidOf(e, ctx) > 0)
  if (f.segment === 'owed') list = list.filter(e => round2(myPaidOf(e, ctx) - myShareOf(e, ctx)) > 0)
  if (f.categoryKey) list = list.filter(e => catMeta(e.category).key === f.categoryKey)
  if (f.dayKey) list = list.filter(e => (e.expense_date || '') === f.dayKey)
  const q = f.search.trim().toLowerCase()
  if (q) list = list.filter(e => e.name.toLowerCase().includes(q))
  return list
}

export interface CostsDayGroup {
  /** '' = no date (spec's "NO DATE" group) */
  dateKey: string
  items: BudgetItem[]
}

/** Groups by `expense_date`, newest first, the no-date bucket sinking to the end (spec §3.7). */
export function groupByDay(items: BudgetItem[]): CostsDayGroup[] {
  const byDate = new Map<string, BudgetItem[]>()
  for (const e of items) {
    const key = e.expense_date || ''
    const bucket = byDate.get(key)
    if (bucket) bucket.push(e)
    else byDate.set(key, [e])
  }
  const keys = Array.from(byDate.keys()).sort((a, b) => {
    if (a === b) return 0
    if (a === '') return 1
    if (b === '') return -1
    return b.localeCompare(a)
  })
  return keys.map(dateKey => ({ dateKey, items: byDate.get(dateKey) as BudgetItem[] }))
}

/** Categories present among `items`, canonical order — the dropdown only lists categories in use (spec §3.6). */
export function categoryFilterKeys(items: BudgetItem[]): CostCategory[] {
  const present = new Set(items.map(e => catMeta(e.category).key))
  return COST_CATEGORY_LIST.map(c => c.key).filter(k => present.has(k))
}

/** Distinct expense dates, ascending (spec §3.6: "Tage mit Ausgaben aufsteigend"). */
export function dayFilterKeys(items: BudgetItem[]): string[] {
  const dates = new Set(items.map(e => e.expense_date).filter((d): d is string => Boolean(d)))
  return Array.from(dates).sort((a, b) => a.localeCompare(b))
}

// ── by-category breakdown (spec §3.5) ───────────────────────────────────────

export interface CostsCategoryBar {
  key: CostCategory
  amount: number
  /** 0-100, relative to the largest category (not the grand total) — spec §3.5. */
  widthPct: number
}

export function categoryBreakdown(items: BudgetItem[], ctx: CostsCtx): CostsCategoryBar[] {
  const totals = new Map<CostCategory, number>()
  for (const e of items) {
    const key = catMeta(e.category).key
    totals.set(key, (totals.get(key) || 0) + baseTotal(e, ctx))
  }
  const rows = COST_CATEGORY_LIST
    .map(c => ({ key: c.key, amount: totals.get(c.key) || 0 }))
    .filter(r => r.amount > 0)
    .sort((a, b) => b.amount - a.amount)
  const max = Math.max(0, ...rows.map(r => r.amount))
  return rows.map(r => ({ ...r, widthPct: max > 0 ? (r.amount / max) * 100 : 0 }))
}

// ── presentation helpers ─────────────────────────────────────────────────

/** Category colour at a fixed alpha — the expense card's border tint (spec §3.10: "brC"). */
export function tint(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// ── CSV export (spec §3.8 `csvGo`; string-building only — the caller turns this into a download) ──

export interface CsvBuildOptions {
  base: string
  ctx: CostsCtx
  locale: string
  tripTitle?: string | null
  t: (key: string) => string
}

/** Ports `CostsPanel.tsx`'s `handleExportCsv` row-building 1:1; the Blob/download is a DOM concern left to the caller. */
export function buildCostsCsv(items: BudgetItem[], opts: CsvBuildOptions): { filename: string; content: string } {
  const sep = ';'
  const esc = (v: unknown) => {
    const s = String(v ?? '')
    return s.includes(sep) || s.includes('"') || s.includes('\n') ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  const fmtDate = (iso: string) => {
    if (!iso) return ''
    try {
      return new Date(iso + 'T00:00:00Z').toLocaleDateString(opts.locale, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
    } catch {
      return iso
    }
  }

  const header = ['Date', 'Name', 'Category', 'Amount', 'Currency', `Amount (${opts.base})`, 'Note']
  const rows = [header.join(sep)]
  const sorted = items.slice().sort((a, b) => (a.expense_date || '').localeCompare(b.expense_date || ''))
  for (const e of sorted) {
    const cur = currencyOf(e, opts.ctx)
    // Ticket notes carry the itemized-receipt JSON, not a human note.
    const note = e.note && !e.note.startsWith('TICKETJSON:') ? e.note : ''
    rows.push(
      [
        esc(fmtDate(e.expense_date || '')),
        esc(e.name),
        esc(opts.t(catMeta(e.category).labelKey)),
        (e.total_price || 0).toFixed(currencyDecimals(cur)),
        cur,
        baseTotal(e, opts.ctx).toFixed(currencyDecimals(opts.base)),
        esc(note),
      ].join(sep),
    )
  }

  const safeName = (opts.tripTitle || 'trip').replace(/[^a-zA-Z0-9À-ɏ _-]/g, '').trim()
  return { filename: `costs-${safeName}.csv`, content: rows.join('\r\n') }
}
