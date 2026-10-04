import { Fragment, useState, useEffect, useMemo, useCallback, useId, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { ArrowDown, ArrowUp, BarChart3, Plus, Search, ArrowRight, ArrowLeftRight, Check, RotateCcw, Pencil, Trash2, AlertCircle, Download, StickyNote, ChevronDown, Receipt, Paperclip, ScanLine, Users } from 'lucide-react'
import { useTripStore } from '../../store/tripStore'
import { useAuthStore } from '../../store/authStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useCanDo } from '../../store/permissionsStore'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'
import { budgetApi } from '../../api/client'
import { saveWithReceipts } from './receiptUploads'
import { convertBooked, convertedLine, tripAmountOf, useExchangeRates, withFallbackFx } from '../../hooks/useExchangeRates'
import { splitShareLabel, useExpenseFx } from './expenseFx'
import { useFreezeMissingRates } from './useFreezeMissingRates'
import { useIsMobile } from '../../hooks/useIsMobile'
import { formatMoney, currencyDecimals, currencyLocale, localizeAmountInput, amountToInputString } from '../../utils/formatters'
import { downloadBlob, openFile } from '../../utils/fileDownload'
import CustomSelect from '../shared/CustomSelect'
import { CustomDatePicker } from '../shared/CustomDateTimePicker'
import { localToday } from '../Planner/today'
import { useReceiptScan } from './useReceiptScan'
import { ReceiptScanModal } from './ReceiptScanModal'
import { SYMBOLS, currenciesWith, SPLIT_COLORS } from './BudgetPanel.constants'
import { amountPattern, calculateTicketShares, finalBudgetFor, finalBudgetSources, hasTicketSplit, NOTE_MAX, paidByUser, payersBalanced, readTicketItems, newExpenseSeed, readUserNote, rebalancePayers, settlementDate, splitEqualShares, writeTicketItems, type TicketItem } from './CostsPanel.helpers'
import { COST_CATEGORY_LIST, catMeta } from './costsCategories'
import { usePercentSplit, type CustomSplitUnit } from './usePercentSplit'
import { ReceiptPreviewModal } from './ReceiptPreviewModal'
import type { BudgetParticipantFinal, BudgetUnconverted, ReceiptLine } from '@trek/shared'
import type { BudgetItem, BudgetItemReceipt } from '../../types'
import type { TripMember } from './BudgetPanelMemberChips'
import GuestBadge from '../shared/GuestBadge'
import { NumericInput } from '../shared/NumericInput'
import EmptyState from '../shared/EmptyState'
import { Tooltip } from '../shared/Tooltip'
import { DialogButton, DialogFooter, DialogHeader, DialogSection, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { AddRowButton, EditorField, GRID_2, INPUT, PillSelect, Segmented, TEXTAREA } from '../shared/dialogParts'
import { CountPill, EYEBROW } from '../Planner/bookings/bookingParts'
import CostsToolbar, { type CostsView } from './CostsToolbar'
import CostsTable, { CostsTableSummary } from './CostsTable'

/** Split chips a row shows before the rest fold into "+N" (#1763). */
const SPLIT_CHIP_MAX = 6

interface CostsPanelProps {
  tripId: number
  tripMembers?: TripMember[]
}

interface Settlement {
  id: number
  from_user_id: number
  to_user_id: number
  amount: number
  // The currency the transfer was entered in. Legacy rows predate it (null) and are
  // read as the display currency, which is what the server assumes for them too.
  currency?: string | null
  // The rate frozen when the transfer was settled, in units of `currency` per 1 trip
  // currency (#1445). Absent, or exactly 1, on rows written before the freeze existed.
  exchange_rate?: number
  created_at?: string
  // The day the transfer actually happened; editable, unlike created_at (when it
  // was recorded). Null/absent on rows predating this field — settlementDate()
  // falls back to created_at for those.
  settled_at?: string | null
  /** A free-text note on the payment (#2340). */
  note?: string | null
  from_username?: string
  to_username?: string
}
interface SettlementData {
  balances: { user_id: number; username: string; avatar_url: string | null; balance: number }[]
  flows: { from: { user_id: number; username: string }; to: { user_id: number; username: string }; amount: number }[]
  settlements: Settlement[]
  // What the trip ends up costing each participant. Computed server-side off the
  // same ledger as the balances, so the breakdown can't contradict them.
  finalBudgets: BudgetParticipantFinal[]
  // The currency the figures are in: the display currency, or the trip's own when
  // neither the server nor `base_rate` could quote the pair.
  currency?: string
  // Rows no rate could convert, left out of every figure above.
  unconverted?: BudgetUnconverted
}

// One row in the unified Costs ledger — either an expense or a settle-up payment,
// carrying the date used to group it by day.
type LedgerEntry =
  | { kind: 'expense'; date: string; e: BudgetItem }
  | { kind: 'payment'; date: string; s: Settlement }

const round2 = (n: number) => Math.round(n * 100) / 100
const FIELD_H = 40 // shared height for the amount / currency / day row in the modal
const COSTS_VIEW_KEY = 'trek:costs-view'

export default function CostsPanel({ tripId, tripMembers = [] }: CostsPanelProps) {
  const { trip, budgetItems, deleteBudgetItem, loadBudgetItems, addBudgetItem, updateBudgetItem } = useTripStore()
  const me = useAuthStore(s => s.user?.id ?? -1)
  const can = useCanDo()
  const canEdit = can('budget_edit', trip)
  const receiptScan = useReceiptScan(tripId, canEdit)
  const toast = useToast()
  const { t, locale } = useTranslation()
  const isMobile = useIsMobile()

  // Display/base currency = the user's preferred currency (Settings), falling back
  // to the trip's own currency. Everything in Costs is converted to and shown in it.
  const displayCurrency = useSettingsStore(s => s.settings.default_currency)
  const base = (displayCurrency || trip?.currency || 'EUR').toUpperCase()
  // Pre-rework rows stored currency = NULL, meaning "the trip's own currency".
  const tripCurrency = (trip?.currency || base).toUpperCase()
  // Anchored on the trip currency's quote, the one the server books with (#2525).
  const { convert, displayPerTrip } = useExchangeRates(base, tripCurrency)
  const curOf = useCallback((e: BudgetItem) => (e.currency || tripCurrency), [tripCurrency])
  const [settlement, setSettlement] = useState<SettlementData | null>(null)
  // A failed settlement read leaves `settlement` null, which the empty views would
  // otherwise present as "everyone is square", a balance claim we cannot make.
  const [settlementError, setSettlementError] = useState(false)
  const [filter, setFilter] = useState<'all' | 'mine' | 'owed'>('all')
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')   // '' = all categories
  const [dayFilter, setDayFilter] = useState('')   // '' = all days, else YYYY-MM-DD
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<BudgetItem | null>(null)
  const [previewReceipts, setPreviewReceipts] = useState<{ receipts: BudgetItemReceipt[]; initialIndex: number } | null>(null)
  // One note open at a time: two expanded rows next to each other read as a mess,
  // and the point of the collapse is that the list stays scannable.
  // Keyed 'e<id>' for an expense and 's<id>' for a payment, whose ids are counted apart.
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null)
  // One open final-budget breakdown at a time, for the same reason a single note
  // is expanded at a time: the card is a sidebar, not a report.
  const [expandedFinalId, setExpandedFinalId] = useState<number | null>(null)
  const [editingSettlement, setEditingSettlement] = useState<Settlement | null>(null)
  const [addingPayment, setAddingPayment] = useState(false)
  // The list stays what Costs opens with; the table is the planning view beside it,
  // remembered in this browser like the Bookings view.
  const [view, setViewState] = useState<CostsView>(() => {
    try { return localStorage.getItem(COSTS_VIEW_KEY) === 'table' ? 'table' : 'list' } catch { return 'list' }
  })
  const setView = (next: CostsView) => {
    setViewState(next)
    try { localStorage.setItem(COSTS_VIEW_KEY, next) } catch { /* storage unavailable: the choice lasts until reload */ }
  }

  const people = tripMembers
  const personById = useCallback((id: number) => people.find(p => p.id === id), [people])
  const personName = useCallback((id: number) => id === me ? t('costs.you') : (personById(id)?.username || '?'), [me, personById, t])
  const colorFor = useCallback((id: number) => {
    const idx = people.findIndex(p => p.id === id)
    return SPLIT_COLORS[(idx >= 0 ? idx : 0) % SPLIT_COLORS.length].gradient
  }, [people])
  const initial = useCallback((id: number) => id === me ? t('costs.youShort') : (personById(id)?.username || '?').charAt(0).toUpperCase(), [me, personById, t])

  const fmt = useCallback((v: number, c = base) => formatMoney(v, c, locale), [base, locale])
  const fmt0 = useCallback((v: number, c = base) => formatMoney(v, c, locale, { decimals: 0 }), [base, locale])

  // The browser's own figure for the display currency goes along, for the server to
  // answer in it when it cannot fetch a quote itself.
  const loadSettlement = useCallback(() => {
    budgetApi.settlement(tripId, base, base !== tripCurrency ? displayPerTrip : null)
      .then(s => { setSettlement(s); setSettlementError(false) })
      .catch(() => setSettlementError(true))
  }, [tripId, base, tripCurrency, displayPerTrip])

  useEffect(() => { loadBudgetItems(tripId); loadSettlement() }, [tripId])
  useEffect(() => { loadSettlement() }, [budgetItems.length, loadSettlement])

  // Rows the server could not count get a rate frozen from the browser's, and the
  // settlement is read again once they count.
  useFreezeMissingRates({ tripId, tripCurrency, canEdit, unconverted: settlement?.unconverted, onHealed: loadSettlement })

  // The bottom-nav "+" on the Costs tab opens the add-expense modal via ?create=expense.
  const [searchParams, setSearchParams] = useSearchParams()
  useEffect(() => {
    if (searchParams.get('create') === 'expense') {
      setEditing(null); setModalOpen(true)
      setSearchParams(p => { p.delete('create'); return p }, { replace: true })
    }
  }, [searchParams])

  // ── derived expense maths (everything converted to the base currency) ────
  // Booked, not live: an expense entered in a foreign currency keeps the rate it was
  // entered at, which is the same rule the server settles by (#1335).
  const booked = useCallback(
    (amount: number, e: BudgetItem) => convertBooked(amount, e.currency, e.exchange_rate, tripCurrency, convert),
    [convert, tripCurrency],
  )
  const baseTotal = (e: BudgetItem) => booked(e.total_price || 0, e)
  // A transfer freezes its own rate at settle time, in its own table (#1445). One
  // without a currency predates that and was entered in the display currency, which
  // is how the server settles it too, not in the trip's.
  const settled = useCallback(
    (s: Settlement) => convertBooked(s.amount, s.currency || base, s.exchange_rate, tripCurrency, convert),
    [convert, tripCurrency, base],
  )
  const myPaidOf = (e: BudgetItem) => booked(paidByUser(e, me), e)
  // The line under an amount shown converted: what was entered, then where it went (#2525).
  const lineOf = (amount: number, e: BudgetItem, shown: number) =>
    convertedLine(amount, e.currency, e.exchange_rate, tripCurrency, base, shown)
  // "Unfinished": a recorded total nobody has paid yet — counts toward the trip
  // total but stays out of settlements until who-paid is filled in. A negative
  // total (a refund, #2176) is just as unfinished until its recipient is named.
  const isUnfinished = (e: BudgetItem) => baseTotal(e) !== 0 && (e.payers || []).filter(p => p.amount !== 0).length === 0
  // A member's part of an expense: the custom amount when one was set, else the
  // equal split the server settles with, in the display currency.
  const shareOf = (e: BudgetItem, userId: number) => {
    const member = (e.members || []).find(m => m.user_id === userId)
    if (!member) return 0
    if (member.amount !== null && member.amount !== undefined) {
      return booked(member.amount, e)
    }
    const shares = splitEqualShares(e.total_price || 0, e.members || [], e.id)
    return booked(shares[userId] || 0, e)
  }
  // Nobody paid, so nobody owes: the ledger skips these entirely (#2225), and
  // counting them here left the tile contradicting the balances right beside it.
  const myShareOf = (e: BudgetItem) => (isUnfinished(e) ? 0 : shareOf(e, me))

  // `booked` carries the rates. They can land after the expenses, and without it in the
  // deps the cards kept the sums they were first added up with while the rows moved on.
  const totals = useMemo(() => {
    const totalSpend = budgetItems.reduce((a, e) => a + baseTotal(e), 0)
    const myPaid = budgetItems.reduce((a, e) => a + myPaidOf(e), 0)
    const myShare = budgetItems.reduce((a, e) => a + myShareOf(e), 0)
    const owe = (settlement?.flows || []).filter(f => f.from.user_id === me).reduce((a, f) => a + f.amount, 0)
    const owed = (settlement?.flows || []).filter(f => f.to.user_id === me).reduce((a, f) => a + f.amount, 0)
    const outstanding = budgetItems.reduce((a, e) => (isUnfinished(e) ? a + baseTotal(e) : a), 0)
    const outstandingCount = budgetItems.filter(isUnfinished).length
    return { totalSpend, myPaid, myShare, owe, owed, outstanding, outstandingCount }
  }, [budgetItems, settlement, me, booked])

  // ── filtering + day grouping ────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = budgetItems.slice()
    if (filter === 'mine') list = list.filter(e => myPaidOf(e) > 0)
    if (filter === 'owed') list = list.filter(e => round2(myPaidOf(e) - myShareOf(e)) > 0)
    // catMeta normalises legacy/free-text categories to the fixed keys, so the
    // filter matches rows saved before the category rework too.
    if (catFilter) list = list.filter(e => catMeta(e.category).key === catFilter)
    if (dayFilter) list = list.filter(e => (e.expense_date || '') === dayFilter)
    const q = search.trim().toLowerCase()
    if (q) list = list.filter(e => e.name.toLowerCase().includes(q))
    return list
  }, [budgetItems, filter, search, catFilter, dayFilter, me, booked])

  // Settlements ("payments") shown inline in the ledger. They have no name, so a
  // text search hides them; they're excluded from the "owed" expense filter and,
  // under "mine", only show transfers I'm part of.
  const filteredSettlements = useMemo(() => {
    // Payments carry no name or category, so a text/category filter hides them.
    if (search.trim() || catFilter) return []
    if (filter === 'owed') return []
    let list = settlement?.settlements || []
    if (filter === 'mine') list = list.filter(s => s.from_user_id === me || s.to_user_id === me)
    if (dayFilter) list = list.filter(s => settlementDate(s) === dayFilter)
    return list
  }, [settlement, filter, search, catFilter, dayFilter, me])

  const dayGroups = useMemo(() => {
    const entries: LedgerEntry[] = [
      ...filtered.map(e => ({ kind: 'expense' as const, date: e.expense_date || '', e })),
      ...filteredSettlements.map(s => ({ kind: 'payment' as const, date: settlementDate(s), s })),
    ]
    const labelOf = (date: string) => {
      if (!date) return t('costs.noDate')
      try { return new Date(date + 'T00:00:00Z').toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }) } catch { return date }
    }
    // Newest day first; within a day, expenses before payments (insertion order).
    const sorted = entries.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    const groups: { day: string; entries: LedgerEntry[] }[] = []
    for (const en of sorted) {
      const day = labelOf(en.date)
      let g = groups.find(x => x.day === day)
      if (!g) { g = { day, entries: [] }; groups.push(g) }
      g.entries.push(en)
    }
    return groups
  }, [filtered, filteredSettlements, locale, t])

  // ── filter dropdown options (category + single day) ──────────────────────
  const categoryOptions = useMemo(() => [
    { value: '', label: t('costs.filter.allCategories') },
    ...COST_CATEGORY_LIST.map(c => ({ value: c.key, label: t(c.labelKey), icon: <c.Icon size={14} style={{ color: c.color }} /> })),
  ], [t])

  const dayOptions = useMemo(() => {
    const days = Array.from(new Set(budgetItems.map(e => e.expense_date).filter(Boolean) as string[])).sort((a, b) => b.localeCompare(a))
    const fmtDay = (d: string) => {
      try { return new Date(d + 'T00:00:00Z').toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }) } catch { return d }
    }
    return [{ value: '', label: t('costs.filter.allDays') }, ...days.map(d => ({ value: d, label: fmtDay(d) }))]
  }, [budgetItems, locale, t])

  // ── settle actions ──────────────────────────────────────────────────────
  const settleFlow = async (fromId: number, toId: number, amount: number) => {
    try {
      await budgetApi.createSettlement(tripId, withFallbackFx({ from_user_id: fromId, to_user_id: toId, amount, currency: base }, tripCurrency))
      loadSettlement()
    } catch { toast.error(t('common.unknownError')) }
  }
  const undoSettlement = async (id: number) => {
    try { await budgetApi.deleteSettlement(tripId, id); loadSettlement() } catch { toast.error(t('common.unknownError')) }
  }
  const settleAll = async () => {
    const flows = settlement?.flows || []
    if (!flows.length) return
    try {
      for (const f of flows) await budgetApi.createSettlement(tripId, withFallbackFx({ from_user_id: f.from.user_id, to_user_id: f.to.user_id, amount: f.amount, currency: base }, tripCurrency))
    } catch { toast.error(t('common.unknownError')) }
    // Refresh even when one transfer failed: the ones created before it are real,
    // and leaving them in the flow list invites a second, doubled settle-up.
    finally { loadSettlement() }
  }

  const dateMeta = useMemo(() => {
    if (!trip?.start_date || !trip?.end_date) return null
    try {
      const s = new Date(trip.start_date + 'T00:00:00Z'), e = new Date(trip.end_date + 'T00:00:00Z')
      const days = Math.round((e.getTime() - s.getTime()) / 86400000) + 1
      const opt = { day: 'numeric', month: 'short', timeZone: 'UTC' } as const
      return { range: `${s.toLocaleDateString(locale, opt)} – ${e.toLocaleDateString(locale, opt)}`, days }
    } catch { return null }
  }, [trip?.start_date, trip?.end_date, locale])

  const handleDelete = async (id: number) => {
    try { await deleteBudgetItem(tripId, id); loadSettlement() } catch { toast.error(t('common.unknownError')) }
  }
  // The table's own writes: one cell at a time, and an empty row to type into.
  const updateFromTable = async (id: number, patch: Partial<BudgetItem>) => {
    try { await updateBudgetItem(tripId, id, patch); loadSettlement() } catch { toast.error(t('common.unknownError')) }
  }
  const addFromTable = async (category: string, expenseDate: string | null) => {
    try {
      return await addBudgetItem(tripId, { name: t('budget.newEntry'), category, total_price: 0, expense_date: expenseDate })
    } catch {
      toast.error(t('common.unknownError'))
      return null
    }
  }

  // CSV export of all expenses — the wiki-documented export that got lost in the
  // Costs rework (#1500). One row per expense, oldest first.
  const handleExportCsv = () => {
    const sep = ';'
    // A cell starting with =, +, -, @, TAB or CR is evaluated as a formula by Excel
    // and Sheets, and the name/note columns are free text any trip member can write.
    const esc = (v: unknown) => {
      let s = String(v ?? '')
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s
      return s.includes(sep) || s.includes('"') || s.includes('\n') ? '"' + s.replace(/"/g, '""') + '"' : s
    }
    const fmtDate = (iso: string) => { if (!iso) return ''; try { return new Date(iso + 'T00:00:00Z').toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }) } catch { return iso } }

    // Read in another currency than the trip's, what each row counts as in the trip
    // currency too, the figure every sum is built from (#2525).
    const tripCol = tripCurrency !== base
    const header = ['Date', 'Name', 'Category', 'Amount', 'Currency', ...(tripCol ? ['Amount (' + tripCurrency + ')'] : []), 'Amount (' + base + ')', 'Note']
    const rows = [header.join(sep)]
    const items = budgetItems.slice().sort((a, b) => (a.expense_date || '').localeCompare(b.expense_date || ''))
    for (const e of items) {
      const cur = curOf(e)
      const note = readUserNote(e)
      const inTrip = tripAmountOf(e.total_price || 0, e.currency, e.exchange_rate, tripCurrency, convert)
      rows.push([
        esc(fmtDate(e.expense_date || '')), esc(e.name), esc(t(catMeta(e.category).labelKey)),
        (e.total_price || 0).toFixed(currencyDecimals(cur)), cur,
        ...(tripCol ? [inTrip.toFixed(currencyDecimals(tripCurrency))] : []),
        baseTotal(e).toFixed(currencyDecimals(base)),
        esc(note),
      ].join(sep))
    }

    const bom = '﻿'
    const blob = new Blob([bom + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
    const safeName = (trip?.title || 'trip').replace(/[^a-zA-Z0-9À-ɏ _-]/g, '').trim()
    downloadBlob(blob, `costs-${safeName}.csv`)
  }

  // ── small presentational helpers ────────────────────────────────────────
  const Avatar = ({ id, size = 24 }: { id: number; size?: number }) => {
    const url = personById(id)?.avatar_url
    if (url) return <img src={url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, display: 'block' }} />
    return <span style={{ width: size, height: size, borderRadius: '50%', background: colorFor(id), color: '#fff', display: 'grid', placeItems: 'center', fontSize: size * 0.4, fontWeight: 700, flexShrink: 0 }}>{initial(id)}</span>
  }

  const cardCls = 'bg-surface-card border border-edge'
  // A small figure beside its name, in place of "Your share · 12 €".
  const CHIP = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-surface-card px-2.5 py-[3px] font-geist tabular-nums shadow-sm'
  // The sidebar's cards: the summary cards' frame with the section name in the head band.
  const SIDE_CARD = 'overflow-hidden rounded-2xl border border-edge-faint bg-surface-secondary'
  const sideHead = (label: string, extra?: React.ReactNode, action?: React.ReactNode) => (
    <div className="flex min-h-[48px] items-center gap-2 border-b border-edge-faint px-4 py-2.5" style={{ background: NEUTRAL_TINT }}>
      <span className={EYEBROW} style={fs(11)}>{label}</span>
      {extra}
      {action && <span className="ml-auto">{action}</span>}
    </div>
  )
  const labelCls = 'text-[11px] font-semibold uppercase tracking-[0.12em] text-content-faint'

  // Big money number with the design's muted symbol/decimals, locale-correct via Intl.
  const bigMoney = (amount: number, smallSize: number, mutedColor: string) => {
    let parts: Intl.NumberFormatPart[] | null = null
    try {
      const d = currencyDecimals(base)
      parts = new Intl.NumberFormat(currencyLocale(base), { style: 'currency', currency: base, minimumFractionDigits: d, maximumFractionDigits: d }).formatToParts(amount || 0)
    } catch { return <>{formatMoney(amount, base, locale)}</> }
    const isBig = (p: Intl.NumberFormatPart) => p.type === 'integer' || p.type === 'group' || p.type === 'minusSign'
    return <>{parts.map((p, i) => <span key={i} style={isBig(p) ? undefined : { fontSize: smallSize, fontWeight: 500, color: mutedColor }}>{p.value}</span>)}</>
  }

  // ── category + day filter controls (shared by both layouts) ──────────────
  // A prominent summary shown when a single day is selected: the day + its total.
  const dayFilterTotal = dayFilter ? filtered.reduce((a, e) => a + baseTotal(e), 0) : 0
  const dayFilterLabel = dayFilter
    ? (() => { try { return new Date(dayFilter + 'T00:00:00Z').toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }) } catch { return dayFilter } })()
    : ''
  const dayBanner = dayFilter ? (
    <div className={cardCls} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderRadius: 16, padding: '16px 20px', marginBottom: 16 }}>
      <div style={{ minWidth: 0 }}>
        <div className="text-content" style={{ fontSize: 'calc(15px * var(--fs-scale-subtitle, 1))', fontWeight: 700, letterSpacing: '-0.01em' }}>{dayFilterLabel}</div>
        <div className="text-content-muted" style={{ marginTop: 3, fontSize: 'calc(12px * var(--fs-scale-body, 1))' }}>{t('costs.expensesCount', { count: filtered.length })}</div>
      </div>
      <div className="text-content" style={{ fontSize: 'calc(26px * var(--fs-scale-title, 1))', fontWeight: 700, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>{bigMoney(dayFilterTotal, 15, 'var(--text-muted)')}</div>
    </div>
  ) : null

  return (
    <div className="costs-root" style={{ minHeight: '100%', background: 'var(--c-bg)', padding: isMobile ? '6px 14px 28px' : '24px 28px 48px' }}>
     {isMobile ? MobileBody() : (
     <div style={{ maxWidth: '100%', margin: '0 auto' }}>
      <CostsToolbar dateMeta={dateMeta} people={people} me={me} colorFor={colorFor}
        canEdit={canEdit} canSettle={(settlement?.flows || []).length > 0}
        onSettleAll={settleAll} onAddExpense={() => { setEditing(null); setModalOpen(true) }}
        onScanReceipt={receiptScan.offered ? receiptScan.open : undefined}
        view={view} onView={setView}
        filters={{
          query: search, onQuery: setSearch,
          owner: filter, onOwner: setFilter,
          category: catFilter, categoryOptions, onCategory: setCatFilter,
          day: dayFilter, dayOptions, onDay: setDayFilter,
          onResetFilters: () => { setFilter('all'); setCatFilter(''); setDayFilter('') },
          onExport: handleExportCsv, canExport: budgetItems.length > 0,
        }} />

      {/* ── Summary cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 36 }} className="costs-summary">
        <SummaryCard label={t('costs.youOwe')} sub={t('costs.youOweSub')} amount={totals.owe} currency={base} locale={locale}
          icon={<ArrowDown size={18} />} tone="owe"
          foot={totals.owe > 0.01
            ? <FlowPills ids={(settlement?.flows || []).filter(f => f.from.user_id === me).map(f => f.to.user_id)} lead={t('costs.to')} Avatar={Avatar} name={personName} />
            : <span className="text-content-faint">{t('costs.allSettled')}</span>} />
        <SummaryCard label={t('costs.youreOwed')} sub={t('costs.youreOwedSub')} amount={totals.owed} currency={base} locale={locale}
          icon={<ArrowUp size={18} />} tone="owed"
          foot={totals.owed > 0.01
            ? <FlowPills ids={(settlement?.flows || []).filter(f => f.to.user_id === me).map(f => f.from.user_id)} lead={t('costs.from')} Avatar={Avatar} name={personName} />
            : <span className="text-content-faint">{t('costs.nothingOwed')}</span>} />
        <SummaryCard label={t('costs.outstanding')} sub={t('costs.outstandingSub')} amount={totals.outstanding} currency={base} locale={locale}
          icon={<AlertCircle size={18} />} tone="unfinished"
          foot={totals.outstandingCount > 0
            ? <span><b>{totals.outstandingCount}</b> {t('costs.outstandingItems')}</span>
            : <span className="text-content-faint">{t('costs.allSettled')}</span>} />
        <SummaryCard label={t('costs.totalSpend')} sub={t('costs.totalSpendSub')} amount={totals.totalSpend} currency={base} locale={locale}
          icon={<BarChart3 size={18} />} tone="total"
          foot={<>
            <span className={CHIP}>{t('costs.yourShare')}<b className="text-content">{fmt0(totals.myShare)}</b></span>
            <span className={CHIP}>{t('costs.youPaid')}<b className="text-content">{fmt0(totals.myPaid)}</b></span>
          </>} />
      </div>

      {/* ── Main grid ── */}
      {/* The same four columns as the cards above: the ledger takes three, the
          sidebar the last, so it lines up with the total-spend card. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', columnGap: 16, rowGap: 32, alignItems: 'start' }} className="costs-grid">
        {/* expenses */}
        <div className="costs-main" style={{ gridColumn: 'span 3', minWidth: 0 }}>

          {dayBanner}
          {view === 'table' ? (
            filtered.length === 0 && budgetItems.length > 0 ? (
              <div className="text-content-faint" style={{ textAlign: 'center', padding: '60px 20px' }}>{t('costs.noMatch')}</div>
            ) : (
              <CostsTable items={filtered} base={base} canEdit={canEdit}
                baseTotal={baseTotal} toBase={booked} currencyOf={curOf} fmt={v => fmt(v)} personName={personName}
                onUpdate={updateFromTable} onAdd={addFromTable}
                onOpen={e => { setEditing(e); setModalOpen(true) }} onDelete={id => void handleDelete(id)} />
            )
          ) : dayGroups.length === 0 ? (
            search ? (
              <div className="text-content-faint" style={{ textAlign: 'center', padding: '60px 20px' }}>
                {t('costs.noMatch')}
              </div>
            ) : (
              <EmptyState scene="costs" title={t('costs.emptyText')} />
            )
          ) : dayGroups.map(g => {
            const dtot = g.entries.reduce((a, en) => en.kind === 'expense' ? a + baseTotal(en.e) : a, 0)
            return (
              <div key={g.day} style={{ marginBottom: 22 }}>
                {!dayFilter && (
                <div className="mb-3 flex items-center gap-2 px-0.5">
                  <span className={EYEBROW} style={fs(11)}>{g.day}</span>
                  <CountPill>{g.entries.length}</CountPill>
                  <span className="ml-auto rounded-full bg-surface-tertiary px-2.5 py-[3px] font-geist font-semibold tabular-nums text-content-secondary" style={fs(11.5)}>{t('costs.spent', { amount: fmt(dtot) })}</span>
                </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {g.entries.map(en => en.kind === 'expense'
                    ? <Fragment key={'e' + en.e.id}>{ExpenseRow({ e: en.e })}</Fragment>
                    : <Fragment key={'s' + en.s.id}>{SettlementRow({ s: en.s })}</Fragment>)}
                </div>
              </div>
            )
          })}
        </div>

        {/* sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* settle up */}
          <section aria-label={t('costs.settleUp')} className={SIDE_CARD}>
            {sideHead(t('costs.settleUp'), <CountPill>{(settlement?.flows || []).length}</CountPill>, canEdit && (
              <button type="button" onClick={() => setAddingPayment(true)}
                className="inline-flex items-center gap-1 rounded-full bg-surface-card px-2.5 py-1 font-semibold text-content-muted shadow-sm hover:text-content" style={fs(11.5)}>
                <Plus size={12} /> {t('costs.addPayment')}
              </button>
            ))}
            <div className="px-4 py-4">{SettleFlows()}</div>
          </section>

          {/* balances */}
          <section aria-label={t('costs.balances')} className={SIDE_CARD}>
            {sideHead(t('costs.balances'))}
            <div className="px-4 py-4">{BalancesList({ balances: settlement?.balances || [] })}</div>
          </section>

          {/* final budget */}
          <section aria-label={t('costs.finalBudget')} className={SIDE_CARD}>
            {sideHead(t('costs.finalBudget'))}
            <div className="px-4 py-4">{FinalBudgetList()}</div>
          </section>

          {/* by category; the table view sums up four ways instead */}
          {view === 'table' ? (
            <CostsTableSummary items={filtered} baseTotal={baseTotal} toBase={booked} fmt={v => fmt(v)} personName={personName} />
          ) : (
            <section aria-label={t('costs.byCategory')} className={SIDE_CARD}>
              {sideHead(t('costs.byCategory'))}
              <div className="px-4 py-4">{CategoryBreakdown()}</div>
            </section>
          )}
        </div>
      </div>
      </div>)}

      <ReceiptScanModal scan={receiptScan} />

      {modalOpen && (
        <ExpenseModal tripId={tripId} base={base} people={people} me={me} editing={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); loadBudgetItems(tripId); loadSettlement() }} />
      )}

      {(editingSettlement || addingPayment) && (
        <SettlementModal tripId={tripId} people={people} me={me} editing={editingSettlement} currency={base} tripCurrency={tripCurrency}
          onClose={() => { setEditingSettlement(null); setAddingPayment(false) }}
          onSaved={() => { setEditingSettlement(null); setAddingPayment(false); loadSettlement() }} />
      )}

      {previewReceipts && (
        <ReceiptPreviewModal
          receipts={previewReceipts.receipts}
          initialIndex={previewReceipts.initialIndex}
          onClose={() => setPreviewReceipts(null)}
        />
      )}

      <style>{`
        /* The tab's own names for the app's tokens: Costs sits on the same page,
           cards and ink as every other tab of the trip. */
        .costs-root {
          --c-bg: var(--bg-primary); --c-bg2: var(--bg-secondary);
          --c-surface: var(--bg-card); --c-surface2: var(--bg-secondary);
          --c-ink: var(--text-primary); --c-ink2: var(--text-muted); --c-ink3: var(--text-faint);
          --c-line: var(--border-faint);
        }
        .costs-root .exp-actions { opacity: 1; }
        .costs-root .exp-actions button { background: none; }
        .costs-root .exp-actions button:hover { background: var(--bg-tertiary); color: var(--c-ink); }
        /* Destructive actions keep their own tint: the neutral one would read as
           "safe" on the button that deletes the expense. */
        .costs-root .exp-actions .exp-action-danger:hover { background: rgba(220,38,38,0.14); color: #dc2626; }
        @media (max-width: 1100px) {
          .costs-root .costs-summary { grid-template-columns: 1fr 1fr !important; }
          .costs-root .costs-grid { grid-template-columns: 1fr !important; }
          .costs-root .costs-main { grid-column: auto !important; }
        }
        @media (max-width: 640px) {
          .costs-root .costs-summary { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )

  // Settle-up and Balances both come from the one settlement request, so they
  // share the notice that says the numbers are missing rather than zero.
  function loadFailed() {
    return <div className="text-content-muted" style={{ textAlign: 'center', padding: '14px 8px', fontSize: 'calc(12.5px * var(--fs-scale-body, 1))' }}>{t('common.unknownError')}</div>
  }

  // ── shared settle-flow list ──────────────────────────────────────────────
  function SettleFlows() {
    if (settlementError) return loadFailed()
    const flows = settlement?.flows || []
    if (flows.length === 0) return (
      <div style={{ textAlign: 'center', padding: '14px 8px' }}>
        <div style={{ width: 46, height: 46, borderRadius: '50%', margin: '0 auto 10px', display: 'grid', placeItems: 'center', background: 'rgba(22,163,74,0.12)', color: '#16a34a' }}><Check size={22} /></div>
        <div className="text-content" style={{ fontSize: 'calc(14.5px * var(--fs-scale-body, 1))', fontWeight: 600 }}>{t('costs.everyoneSquare')}</div>
        <div className="text-content-faint" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', marginTop: 2 }}>{t('costs.nothingOutstanding')}</div>
      </div>
    )
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {flows.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <Tooltip label={`${personName(f.from.user_id)} → ${f.to.user_id === me ? t('costs.youLower') : personName(f.to.user_id)}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <Avatar id={f.from.user_id} size={32} /><ArrowRight size={15} className="text-content-faint" /><Avatar id={f.to.user_id} size={32} />
            </div>
            </Tooltip>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span className="text-content" style={{ fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 700 }}>{fmt(f.amount)}</span>
              {canEdit && <button type="button" onClick={() => settleFlow(f.from.user_id, f.to.user_id, f.amount)} className="bg-[var(--text-primary)] text-[var(--bg-primary)]" style={{ padding: '7px 12px', borderRadius: 9, fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, border: 0, cursor: 'pointer', fontFamily: 'inherit' }}>{t('costs.settle')}</button>}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── mobile layout (Budget1Mobile.html): single flat column, total card on top ──
  //
  // Called as a plain function — `{MobileBody()}`, not `<MobileBody />` — and the
  // same goes for ExpenseRow, SettleFlows, BalancesList and CategoryBreakdown.
  // A component declared inside this one is a fresh component type on every
  // render, so React tears the old subtree down and mounts a new one instead of
  // updating it; the search box then loses focus after every keystroke. Calling
  // them keeps the markup inline where it always was. Do not "tidy" these back
  // into elements.
  function MobileBody() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
        {/* Total card */}
        <section style={{ background: 'linear-gradient(135deg,#1f2937,#111827)', color: '#fff', borderRadius: 22, padding: '20px 20px 16px', boxShadow: '0 8px 24px -8px rgba(0,0,0,0.28)' }}>
          <div style={{ fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{t('costs.totalSpend')}</div>
          <div style={{ fontSize: 'calc(44px * var(--fs-scale-title, 1))', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, marginTop: 8, display: 'flex', alignItems: 'baseline' }}>{bigMoney(totals.totalSpend, 24, 'rgba(255,255,255,0.6)')}</div>
          <div style={{ display: 'flex', gap: 18, marginTop: 12, fontSize: 'calc(12px * var(--fs-scale-body, 1))', color: 'rgba(255,255,255,0.6)', flexWrap: 'wrap' }}>
            <span>{t('costs.yourShare')} <b style={{ color: '#fff', fontWeight: 600, marginLeft: 4 }}>{fmt0(totals.myShare)}</b></span>
            <span>{t('costs.youPaid')} <b style={{ color: '#fff', fontWeight: 600, marginLeft: 4 }}>{fmt0(totals.myPaid)}</b></span>
          </div>
          {canEdit && (
            <button type="button" onClick={() => { setEditing(null); setModalOpen(true) }} style={{ marginTop: 16, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.16)', color: '#fff', padding: 13, borderRadius: 14, fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Plus size={17} /> {t('costs.addExpense')}
            </button>
          )}
          {receiptScan.offered && (
            <button type="button" onClick={receiptScan.open}
              style={{ marginTop: 8, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.16)', color: '#fff', padding: 11, borderRadius: 14, fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }} // theme-lint-disable — on the dark total card, drawn like Add expense above it
            >
              <ScanLine size={16} /> {t('costs.scan.button')}
            </button>
          )}
        </section>

        {/* Owe / Owed */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className={cardCls} style={{ borderRadius: 18, padding: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', marginBottom: 10, background: '#dc262622', color: '#dc2626' }}><ArrowDown size={17} /></div>
            <div className="text-content" style={{ fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', fontWeight: 600 }}>{t('costs.youOwe')}</div>
            <div className="text-content-faint" style={{ fontSize: 'calc(10.5px * var(--fs-scale-caption, 1))' }}>{t('costs.youOweSub')}</div>
            <div style={{ fontSize: 'calc(27px * var(--fs-scale-title, 1))', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, marginTop: 12, display: 'flex', alignItems: 'baseline', color: '#dc2626' }}>{bigMoney(totals.owe, 16, 'var(--c-ink3)')}</div>
          </div>
          <div className={cardCls} style={{ borderRadius: 18, padding: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', marginBottom: 10, background: '#16a34a22', color: '#16a34a' }}><ArrowUp size={17} /></div>
            <div className="text-content" style={{ fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', fontWeight: 600 }}>{t('costs.youreOwed')}</div>
            <div className="text-content-faint" style={{ fontSize: 'calc(10.5px * var(--fs-scale-caption, 1))' }}>{t('costs.youreOwedSub')}</div>
            <div style={{ fontSize: 'calc(27px * var(--fs-scale-title, 1))', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, marginTop: 12, display: 'flex', alignItems: 'baseline', color: '#16a34a' }}>{bigMoney(totals.owed, 16, 'var(--c-ink3)')}</div>
          </div>
        </div>

        {/* Outstanding */}
        <div className={cardCls} style={{ borderRadius: 18, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', background: '#d9770622', color: '#d97706', flexShrink: 0 }}><AlertCircle size={17} /></div>
            <div style={{ minWidth: 0 }}>
              <div className="text-content" style={{ fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', fontWeight: 600 }}>{t('costs.outstanding')}</div>
              <div className="text-content-faint" style={{ fontSize: 'calc(10.5px * var(--fs-scale-caption, 1))' }}>{t('costs.outstandingSub')}</div>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 'calc(27px * var(--fs-scale-title, 1))', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, display: 'flex', alignItems: 'baseline', color: '#d97706' }}>{bigMoney(totals.outstanding, 16, 'var(--c-ink3)')}</div>
          </div>
        </div>

        {/* Settle up */}
        <div className={cardCls} style={{ borderRadius: 18, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8 }}>
            <div className="text-content" style={{ fontSize: 'calc(19px * var(--fs-scale-subtitle, 1))', fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: 8 }}>{t('costs.settleUp')} <span className="text-content-faint" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 500 }}>{(settlement?.flows || []).length}</span></div>
            {canEdit && (
              <button type="button" onClick={() => setAddingPayment(true)} className="text-content-muted bg-surface-card border border-edge" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 9, fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}><Plus size={13} /> {t('costs.addPayment')}</button>
            )}
          </div>
          {SettleFlows()}
        </div>

        {/* Expenses */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div className="text-content" style={{ fontSize: 'calc(19px * var(--fs-scale-subtitle, 1))', fontWeight: 700, letterSpacing: '-0.02em' }}>{t('costs.expenses')}</div>
            <Tooltip label={t('budget.exportCsv')}>
            <button type="button" onClick={handleExportCsv} aria-label={t('budget.exportCsv')} disabled={!budgetItems.length}
              className="bg-surface-card border border-edge text-content-muted disabled:opacity-40"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
              <Download size={15} />
            </button>
            </Tooltip>
          </div>
          <div className="bg-surface-card border border-edge" style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, padding: '0 12px', height: 42 }}>
            <Search size={16} className="text-content-faint" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('costs.searchPlaceholder')} className="text-content" style={{ border: 0, background: 'none', outline: 'none', fontSize: 'calc(14px * var(--fs-scale-body, 1))', width: '100%', fontFamily: 'inherit' }} />
          </div>
          <div className="bg-surface-secondary" style={{ display: 'flex', borderRadius: 11, padding: 3, gap: 2 }}>
            {(['all', 'mine', 'owed'] as const).map(f => (
              <button type="button" key={f} onClick={() => setFilter(f)} className={filter === f ? 'bg-surface-card text-content' : 'text-content-muted'} style={{ flex: 1, padding: '8px 6px', fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', fontWeight: 500, borderRadius: 8, border: 0, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>{t('costs.filter.' + f)}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <CustomSelect value={catFilter} onChange={v => setCatFilter(String(v))} options={categoryOptions} size="sm" style={{ flex: 1, minWidth: 0 }} />
            <CustomSelect value={dayFilter} onChange={v => setDayFilter(String(v))} options={dayOptions} size="sm" searchable style={{ flex: 1, minWidth: 0 }} />
          </div>
          {dayBanner}
          {dayGroups.length === 0
            ? <div className="text-content-faint" style={{ textAlign: 'center', padding: '36px 16px', fontSize: 'calc(13px * var(--fs-scale-body, 1))' }}>{search ? t('costs.noMatch') : t('costs.emptyText')}</div>
            : dayGroups.map(g => {
                const dtot = g.entries.reduce((a, en) => en.kind === 'expense' ? a + baseTotal(en.e) : a, 0)
                return (
                  <div key={g.day} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {!dayFilter && <div className={labelCls} style={{ display: 'flex', alignItems: 'center', padding: '0 2px' }}>{g.day}<span className="text-content-muted" style={{ marginLeft: 'auto', textTransform: 'none', letterSpacing: 0, fontWeight: 500, fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))' }}>{t('costs.spent', { amount: fmt(dtot) })}</span></div>}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{g.entries.map(en => en.kind === 'expense'
                      ? <Fragment key={'e' + en.e.id}>{ExpenseRow({ e: en.e })}</Fragment>
                      : <Fragment key={'s' + en.s.id}>{SettlementRow({ s: en.s })}</Fragment>)}</div>
                  </div>
                )
              })}
        </div>

        {/* Balances */}
        <div className={cardCls} style={{ borderRadius: 18, padding: 16 }}>
          <div className={labelCls} style={{ marginBottom: 14 }}>{t('costs.balances')}</div>
          {BalancesList({ balances: settlement?.balances || [] })}
        </div>

        {/* Final budget */}
        <div className={cardCls} style={{ borderRadius: 18, padding: 16 }}>
          <div className={labelCls} style={{ marginBottom: 14 }}>{t('costs.finalBudget')}</div>
          {FinalBudgetList()}
        </div>

        {/* By category */}
        <div className={cardCls} style={{ borderRadius: 18, padding: 16 }}>
          <div className={labelCls} style={{ marginBottom: 14 }}>{t('costs.byCategory')}</div>
          {CategoryBreakdown()}
        </div>
      </div>
    )
  }

  // ── inline subcomponents (close over helpers) ────────────────────────────
  /**
   * Edit and delete, in a capsule beside the row rather than inside it — the
   * mobile card has always done it this way, and out here the buttons stop
   * competing with the amount for the right edge of the card.
   */
  function RowActions({ onEdit, onDelete, deleteLabel }: { onEdit: () => void; onDelete: () => void; deleteLabel: string }) {
    // No `background` here on purpose: an inline value would beat the :hover
    // rule in the stylesheet block below, which is how the first attempt at
    // this silently did nothing.
    const btn: React.CSSProperties = {
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 30, height: 30, borderRadius: 999, border: 0,
      cursor: 'pointer', padding: 0,
    }
    return (
      <div className="exp-actions bg-surface-secondary border border-edge-faint" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3, flexShrink: 0, borderRadius: 999, padding: 5 }}>
        <Tooltip label={t('common.edit')}>
        <button type="button" aria-label={t('common.edit')} onClick={onEdit} className="text-content-muted transition-colors" style={btn}><Pencil size={13} /></button>
        </Tooltip>
        <Tooltip label={deleteLabel}>
        <button type="button" aria-label={deleteLabel} onClick={onDelete} className="exp-action-danger transition-colors" style={{ ...btn, color: '#dc2626' }}><Trash2 size={13} /></button>
        </Tooltip>
      </div>
    )
  }

  // Called, not rendered — see MobileBody: an element here would remount the
  // list on every keystroke in the search box.
  function ExpenseRow({ e }: { e: BudgetItem }) {
    const c = catMeta(e.category)
    const Icon = c.Icon
    const line = lineOf(e.total_price || 0, e, baseTotal(e))
    const payers = (e.payers || []).filter(p => p.amount !== 0)
    const net = round2(myPaidOf(e) - myShareOf(e))
    const unfinished = isUnfinished(e)
    const note = readUserNote(e)

    // Fixed columns, identical on every row, so the eye can run down the list
    // instead of re-finding each field on each line. A row without a note leaves
    // its column empty rather than letting everything after it drift left, which
    // is what made the list read as unstructured.
    const cols = isMobile ? '46px 1fr auto' : '46px minmax(200px, 1fr) minmax(0, 1.5fr) auto'

    return (
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
      <div className="bg-surface-secondary border border-edge-faint exp-row" style={{ position: 'relative', flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: cols, gap: 18, alignItems: 'center', borderRadius: 18, padding: isMobile ? '16px 20px' : '20px 20px 16px' }}>
        {/* The category rides the card edge as a tab, the way the mobile card
            does, so it stops taking up a slot inside the row itself. */}
        {!isMobile && (
          <span aria-hidden="true" style={{ position: 'absolute', left: -1, top: -1, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 11px 4px 10px', borderRadius: '17px 0 12px 0', background: c.color, color: '#fff', fontSize: 'calc(9.5px * var(--fs-scale-caption, 1))', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1.2 }}>
            <Icon size={10} strokeWidth={2.4} />
            {t(c.labelKey)}
          </span>
        )}

        <span style={{ position: 'relative', width: 46, height: 46, borderRadius: 13, display: 'grid', placeItems: 'center', background: c.color + '22', color: c.color }}>
          <Icon size={21} />
          {isMobile && unfinished && (
            <Tooltip label={t('costs.unfinishedHint')}>
            <span role="img" aria-label={t('costs.unfinishedHint')} style={{ position: 'absolute', bottom: -4, right: -4, width: 20, height: 20, borderRadius: '50%', background: '#d97706', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 800, lineHeight: 1, border: '2px solid var(--bg-card)' }}>!</span>
            </Tooltip>
          )}
        </span>

        {/* What it was. */}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
            <span className="text-content" style={{ fontSize: 'calc(15px * var(--fs-scale-subtitle, 1))', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</span>
            {unfinished && !isMobile && (
              <Tooltip label={t('costs.unfinishedHint')}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px 2px 6px', borderRadius: 999, background: 'rgba(217,119,6,0.14)', color: '#d97706', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 700, flexShrink: 0 }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#d97706', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 800 }}>!</span>
                {t('costs.unfinished')}
              </span>
              </Tooltip>
            )}
            {(e.receipts || []).length > 0 && (
              <Tooltip label={t('costs.viewReceipt')}>
              <button
                type="button"
                onClick={(ev) => {
                  ev.stopPropagation()
                  setPreviewReceipts({ receipts: e.receipts!, initialIndex: 0 })
                }}
 aria-label={t('costs.viewReceipt')}
                className="bg-surface-card border border-edge-faint text-content-muted hover:text-content hover:border-content-faint transition-all"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontSize: 'calc(11px * var(--fs-scale-caption, 1))',
                  fontWeight: 600,
                  flexShrink: 0,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <Receipt size={12} className="text-content-muted" />
                <span>{t('costs.receipts') || 'Beleg'}{e.receipts!.length > 1 ? ` (${e.receipts!.length})` : ''}</span>
              </button>
              </Tooltip>
            )}
          </div>
          {line && (
            <div className="text-content-faint" style={{ marginTop: 4, fontSize: 'calc(12px * var(--fs-scale-body, 1))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {fmt(line.entered.amount, line.entered.currency)} {'→'} {fmt(line.into.amount, line.into.currency)}
            </div>
          )}
          {/* Under the name, because a chip reading "Y 122,00" says nothing on
              its own — the name above it is what gives it a meaning. */}
          {payers.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
              {payers.map(p => (
                <Tooltip key={p.user_id} label={personName(p.user_id)}>
                <span className="bg-surface-card border border-edge-faint" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px 3px 3px', borderRadius: 999, fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))' }}>
                  <Avatar id={p.user_id} size={18} />
                  <span className="text-content" style={{ fontWeight: 700 }}>{fmt(booked(p.amount, e))}</span>
                </span>
                </Tooltip>
              ))}
            </div>
          )}
          {SplitChips({ e })}
        </div>

        {/* The note, marked by a rule in the category colour instead of a box, so
            it reads as part of the row rather than something dropped onto it. */}
        {!isMobile && NoteCell({ note, noteKey: 'e' + e.id, color: c.color })}

        {/* The money, and what to do with it. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, alignSelf: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, whiteSpace: 'nowrap' }}>
            <span className="bg-surface-card border border-edge-faint text-content" style={{ display: 'inline-flex', alignItems: 'center', padding: isMobile ? '0' : '6px 13px', borderRadius: 999, border: isMobile ? 0 : undefined, background: isMobile ? 'none' : undefined, fontSize: isMobile ? 'calc(18px * var(--fs-scale-subtitle, 1))' : 'calc(15px * var(--fs-scale-subtitle, 1))', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(baseTotal(e))}</span>
            {!unfinished && (e.members || []).length > 0 && Math.abs(net) > 0.01 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: isMobile ? 0 : '2px 9px', borderRadius: 999, background: isMobile ? 'none' : (net > 0 ? 'rgba(22,163,74,0.13)' : 'rgba(220,38,38,0.13)'), fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))', fontWeight: 600, color: net > 0 ? '#16a34a' : '#dc2626' }}>
                {net > 0 ? t('costs.youLent', { amount: fmt(net) }) : t('costs.youBorrowed', { amount: fmt(-net) })}
              </span>
            )}
          </div>
        </div>
      </div>
      {canEdit && RowActions({ onEdit: () => { setEditing(e); setModalOpen(true) }, onDelete: () => handleDelete(e.id), deleteLabel: t('common.delete') })}
      </div>
    )
  }

  // Who an expense is split between and each one's part (#1763), so checking that
  // the right people are in no longer means opening every expense. Quieter than
  // the payer chips above, and capped so a large group cannot crowd the row.
  function SplitChips({ e }: { e: BudgetItem }) {
    const members = e.members || []
    if (members.length === 0) return null
    const shown = members.length > SPLIT_CHIP_MAX ? members.slice(0, SPLIT_CHIP_MAX - 1) : members
    const rest = members.slice(shown.length)
    const chip = 'inline-flex items-center gap-[5px] rounded-full bg-surface-tertiary text-content-secondary'
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 5, marginTop: 6 }}>
        <span className="text-content-faint" style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginRight: 2 }}>{t('costs.split')}</span>
        {shown.map(m => {
          const share = fmt(shareOf(e, m.user_id))
          return (
            <Tooltip key={m.user_id} label={t('costs.splitChipLabel', { name: personName(m.user_id), amount: share })}>
            <span className={chip} data-testid="split-chip" style={{ padding: '2px 8px 2px 2px', fontSize: 'calc(11px * var(--fs-scale-caption, 1))' }}>
              <Avatar id={m.user_id} size={16} />
              <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{share}</span>
              {m.paid ? <Check size={11} strokeWidth={2.6} className="text-success" aria-label={t('costs.paid')} /> : null}
            </span>
            </Tooltip>
          )
        })}
        {rest.length > 0 && (
          <Tooltip label={rest.map(m => t('costs.splitChipLabel', { name: personName(m.user_id), amount: fmt(shareOf(e, m.user_id)) })).join(', ')}>
          <span className={chip} style={{ padding: '2px 8px', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 700 }}>+{rest.length}</span>
          </Tooltip>
        )}
      </div>
    )
  }

  // A row's note as a pill that opens in place; an empty one keeps the column.
  function NoteCell({ note, noteKey, color }: { note: string; noteKey: string; color: string }) {
    if (!note) return <span />
    const open = expandedNoteId === noteKey
    return (
      <Tooltip label={open ? t('costs.hideNote') : t('costs.showNote')}>
      <button type="button" onClick={() => setExpandedNoteId(open ? null : noteKey)}
        aria-expanded={open}
        className="bg-surface-card border border-edge-faint text-content-muted hover:text-content hover:border-content-faint transition-colors exp-note-btn"
        style={{ display: 'flex', alignItems: open ? 'flex-start' : 'center', gap: 9, minWidth: 0, width: '100%', padding: open ? '10px 14px 11px 13px' : '7px 12px 7px 11px', borderRadius: open ? 14 : 999, borderLeft: '3px solid ' + color, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', lineHeight: 1.5, textAlign: 'left' }}>
        <span style={open
          ? { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', minWidth: 0, flex: 1 }
          : { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flex: 1 }}>{note}</span>
        <ChevronDown size={13} style={{ flexShrink: 0, marginTop: open ? 3 : 0, transition: 'transform .18s ease', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      </Tooltip>
    )
  }

  // A settle-up payment as a ledger row — visually distinct from an expense, with
  // inline edit + undo (reuses deleteSettlement) so it isn't buried in a modal.
  function SettlementRow({ s }: { s: Settlement }) {
    // Legacy transfers carry no currency and were entered in the display base.
    const cur = (s.currency || base).toUpperCase()
    // Booked in the trip currency like an expense, so it is explained the same way.
    const line = convertedLine(s.amount, cur, s.exchange_rate, tripCurrency, base, settled(s))
    return (
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
      <div className="bg-surface-secondary border border-edge-faint exp-row" style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: isMobile ? '46px 1fr auto' : '46px minmax(200px, 1fr) minmax(0, 1.5fr) auto', gap: isMobile ? 16 : 18, alignItems: 'center', borderRadius: 18, padding: '16px 20px' }}>
        <span style={{ width: 46, height: 46, borderRadius: 13, display: 'grid', placeItems: 'center', background: 'rgba(22,163,74,0.12)', color: '#16a34a' }}><ArrowLeftRight size={21} /></span>
        <div style={{ minWidth: 0 }}>
          <div className="text-content" style={{ fontSize: 'calc(15px * var(--fs-scale-subtitle, 1))', fontWeight: 600, marginBottom: 6 }}>
            {t('costs.payment')}
            {line && <span className="text-content-faint" style={{ fontWeight: 400, fontSize: 'calc(12px * var(--fs-scale-body, 1))', marginLeft: 10 }}>{fmt(line.entered.amount, line.entered.currency)} → {fmt(line.into.amount, line.into.currency)}</span>}
          </div>
          <Tooltip label={`${personName(s.from_user_id)} → ${personName(s.to_user_id)}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
            <Avatar id={s.from_user_id} size={20} /><ArrowRight size={13} className="text-content-faint" /><Avatar id={s.to_user_id} size={20} />
            <span className="text-content-faint" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{personName(s.from_user_id)} → {personName(s.to_user_id)}</span>
          </div>
          </Tooltip>
        </div>
        {/* The payment's note (#2340), in the column every expense keeps for its own,
            so its amount lands on the same axis as every expense above it. */}
        {!isMobile && NoteCell({ note: s.note || '', noteKey: 's' + s.id, color: '#16a34a' })}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, alignSelf: 'center' }}>
          <span className="bg-surface-card border border-edge-faint text-content" style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 13px', borderRadius: 999, fontSize: 'calc(15px * var(--fs-scale-subtitle, 1))', fontWeight: 700, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{fmt(settled(s))}</span>
        </div>
      </div>
      {canEdit && (
        <div className="exp-actions bg-surface-secondary border border-edge-faint" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3, flexShrink: 0, borderRadius: 999, padding: 5 }}>
          <Tooltip label={t('common.edit')}>
          <button type="button" aria-label={t('common.edit')} onClick={() => setEditingSettlement(s)} className="text-content-muted transition-colors" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 999, border: 0, cursor: 'pointer', padding: 0 }}><Pencil size={13} /></button>
          </Tooltip>
          <Tooltip label={t('costs.undo')}>
          <button type="button" aria-label={t('costs.undo')} onClick={() => undoSettlement(s.id)} className="exp-action-danger transition-colors" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 999, border: 0, cursor: 'pointer', padding: 0, color: '#dc2626' }}><RotateCcw size={13} /></button>
          </Tooltip>
        </div>
      )}
      </div>
    )
  }

  function BalancesList({ balances }: { balances: SettlementData['balances'] }) {
    if (settlementError) return loadFailed()
    const rows = people.map(p => balances.find(b => b.user_id === p.id) || { user_id: p.id, username: p.username, avatar_url: null, balance: 0 })
    const max = Math.max(1, ...rows.map(r => Math.abs(r.balance)))
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {rows.map(r => {
          const pct = Math.min(100, Math.abs(r.balance) / max * 100)
          const pos = r.balance > 0.01, neg = r.balance < -0.01
          return (
            <div key={r.user_id} style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 10, alignItems: 'center' }}>
              <Avatar id={r.user_id} size={28} />
              <div>
                <div className="text-content" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600 }}>{personName(r.user_id)}</div>
                <div className="bg-surface-secondary" style={{ height: 5, borderRadius: 3, marginTop: 5, position: 'relative', overflow: 'hidden' }}>
                  <span style={{ position: 'absolute', left: '50%', top: -1, bottom: -1, width: 1, background: 'var(--border-primary)' }} />
                  {pos && <span style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: pct / 2 + '%', background: '#16a34a', borderRadius: 3 }} />}
                  {neg && <span style={{ position: 'absolute', right: '50%', top: 0, bottom: 0, width: pct / 2 + '%', background: '#dc2626', borderRadius: 3 }} />}
                </div>
              </div>
              <div style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600, textAlign: 'right', color: pos ? '#16a34a' : neg ? '#dc2626' : 'var(--text-faint)' }}>
                {pos ? '+' + fmt(r.balance) : neg ? '−' + fmt(-r.balance) : fmt(0)}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  /**
   * What the trip actually costs each traveler — one amount per person, with the
   * arithmetic behind it a click away.
   *
   * The four figures come from the settlement response, not from a second pass
   * over the expenses here: the server nets them in the same integer cents as
   * the balances, so `expenses − reimbursed − pending` always lands on the total
   * printed beside the name. The lists under the breakdown are the rows those
   * figures came from, which is what makes an unexpected total explainable.
   */
  function FinalBudgetList() {
    if (settlementError) return loadFailed()
    const finals = settlement?.finalBudgets || []
    const rows = people.map(p => finalBudgetFor(finals, p))
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {rows.map(r => {
          const open = expandedFinalId === r.user_id
          return (
            <div key={r.user_id}>
              <button type="button" onClick={() => setExpandedFinalId(open ? null : r.user_id)} aria-expanded={open}
                className="text-content"
                style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto 14px', gap: 10, alignItems: 'center', width: '100%', padding: '7px 0', background: 'none', border: 0, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                <Avatar id={r.user_id} size={28} />
                <span style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{personName(r.user_id)}</span>
                <span style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 700 }}>{fmt(r.final)}</span>
                <ChevronDown size={14} className="text-content-faint" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>
              {open && FinalBudgetBreakdown({ row: r })}
            </div>
          )
        })}
      </div>
    )
  }

  /** The three lines behind one traveler's final budget, and the rows they add up from. */
  function FinalBudgetBreakdown({ row }: { row: BudgetParticipantFinal }) {
    // Each line is signed by what it does to the final, so the column reads as the
    // subtraction it is: a reimbursement this traveler *sent* raises their cost and
    // shows as a plus, which "received: −50" could never say. The rows under a line
    // carry the same sign, so they visibly add up to it. Their amounts are the
    // server's display cents, not a conversion of the expense list done here.
    const signed = (v: number) => (v < 0 ? '−' : '+') + fmt(Math.abs(v))
    const { fronted, moved, outstanding } = finalBudgetSources(row, budgetItems)
    // Beside a converted row's name, what was entered, so the breakdown names the bill
    // the way the list above it does rather than by a figure nobody typed.
    const enteredOf = (itemId: number, shown: number) => {
      const e = budgetItems.find(i => i.id === itemId)
      const line = e ? lineOf(paidByUser(e, row.user_id), e, shown) : null
      return line ? fmt(line.entered.amount, line.entered.currency) : null
    }
    const lineCls = { display: 'flex', alignItems: 'baseline', gap: 10, fontSize: 'calc(12px * var(--fs-scale-body, 1))' } as const
    const detail = (label: string, value: string) => (
      <div style={lineCls}>
        <span className="text-content-muted" style={{ minWidth: 0, flex: 1 }}>{label}</span>
        <span className="text-content" style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{value}</span>
      </div>
    )
    const transferLabel = (fromId: number, toId: number) => `${personName(fromId)} → ${toId === me ? t('costs.youLower') : personName(toId)}`
    // Capped and scrollable: a long trip's expense list would otherwise push the
    // rest of the sidebar off the screen every time a name is tapped.
    const listCls = { display: 'flex', flexDirection: 'column', gap: 5, marginTop: 6, maxHeight: 180, overflowY: 'auto' } as const
    return (
      <div className="bg-surface-secondary" style={{ borderRadius: 12, padding: '11px 12px', margin: '2px 0 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {detail(t('costs.finalExpenses'), signed(row.expenses))}
          {detail(t('costs.finalReimbursed'), signed(-row.reimbursed))}
          {detail(t('costs.finalPending'), signed(-row.pending))}
        </div>
        {fronted.length > 0 && (
          <div>
            <div className={labelCls}>{t('costs.finalExpenses')}</div>
            <div style={listCls}>
              {fronted.map(r => {
                const entered = enteredOf(r.item_id, r.amount)
                return (
                  <div key={r.item_id} style={lineCls}>
                    <span className="text-content-muted" style={{ minWidth: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.name}{entered && <span className="text-content-faint" style={{ marginLeft: 8 }}>{entered}</span>}
                    </span>
                    <span className="text-content" style={{ whiteSpace: 'nowrap' }}>{signed(r.amount)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {moved.length > 0 && (
          <div>
            <div className={labelCls}>{t('costs.finalReimbursed')}</div>
            <div style={listCls}>
              {moved.map(r => (
                <div key={r.settlement_id} style={lineCls}>
                  <span className="text-content-muted" style={{ minWidth: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{transferLabel(r.from_user_id, r.to_user_id)}</span>
                  <span className="text-content" style={{ whiteSpace: 'nowrap' }}>{signed(-r.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {outstanding.length > 0 && (
          <div>
            <div className={labelCls}>{t('costs.finalPending')}</div>
            <div style={listCls}>
              {outstanding.map((r, i) => (
                <div key={i} style={lineCls}>
                  <span className="text-content-muted" style={{ minWidth: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{transferLabel(r.from_user_id, r.to_user_id)}</span>
                  <span className="text-content" style={{ whiteSpace: 'nowrap' }}>{signed(-r.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  function CategoryBreakdown() {
    // Categories net refunds against spend (#2176): a negative entry lowers its
    // category's sum, and a category that nets negative keeps its own row —
    // just without a bar, since the bars rank positive spend.
    const tot: Record<string, number> = {}
    for (const e of budgetItems) { const k = catMeta(e.category).key; tot[k] = (tot[k] || 0) + baseTotal(e) }
    const rows = COST_CATEGORY_LIST.filter(c => (tot[c.key] || 0) !== 0).sort((a, b) => (tot[b.key] || 0) - (tot[a.key] || 0))
    if (rows.length === 0) return <div className="text-content-faint" style={{ fontSize: 'calc(12.5px * var(--fs-scale-body, 1))' }}>{t('costs.noCategories')}</div>
    // Bars are scaled relative to the most expensive category (the top row fills the
    // bar), not to the trip grand total — makes the relative ranking readable.
    const maxCat = Math.max(0, ...rows.map(c => tot[c.key] || 0))
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map(c => {
          const v = tot[c.key]; const pct = maxCat > 0 && v > 0 ? v / maxCat * 100 : 0
          return (
            <div key={c.key} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 10, alignItems: 'center' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color }} />
              <span className="text-content" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500 }}>{t(c.labelKey)}</span>
              <span className="text-content-muted" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600 }}>{fmt0(v)}</span>
              <div className="bg-surface-secondary" style={{ gridColumn: '1 / -1', height: 5, borderRadius: 3, overflow: 'hidden', marginTop: -2 }}>
                <span style={{ display: 'block', height: '100%', width: pct + '%', background: c.color, borderRadius: 3 }} />
              </div>
            </div>
          )
        })}
      </div>
    )
  }
}

// ── pure subcomponents ─────────────────────────────────────────────────────
/** A tone's colour, from the status tokens the booking cards use. */
const TONE_COLOR = { owe: 'var(--danger)', owed: 'var(--success)', unfinished: 'var(--warning)', total: 'var(--accent)' } as const

/**
 * One of the four figures on top, drawn like a booking card: a head band tinted
 * by what the figure means, with its icon, name and a line on what it counts,
 * then the amount and a foot with who or what is behind it.
 */
function SummaryCard({ label, sub, amount, currency, locale, icon, foot, tone }: { label: string; sub: string; amount: number; currency: string; locale: string; icon: React.ReactNode; foot: React.ReactNode; tone: 'owe' | 'owed' | 'total' | 'unfinished' }) {
  const color = TONE_COLOR[tone]
  // formatToParts keeps the design's "big integer + muted symbol/decimals" styling
  // while letting Intl place the symbol and pick separators per locale + currency.
  let parts: Intl.NumberFormatPart[] | null = null
  try {
    const d = currencyDecimals(currency)
    parts = new Intl.NumberFormat(currencyLocale(currency), { style: 'currency', currency: (currency || 'EUR').toUpperCase(), minimumFractionDigits: d, maximumFractionDigits: d }).formatToParts(amount || 0)
  } catch { parts = null }
  const big = (p: Intl.NumberFormatPart) => p.type === 'integer' || p.type === 'group' || p.type === 'minusSign'
  return (
    <section aria-label={label} className="flex flex-col overflow-hidden rounded-2xl border border-edge-faint bg-surface-secondary">
      <div className="flex items-center gap-2.5 border-b border-edge-faint px-4 py-3" style={{ background: `color-mix(in srgb, ${color} ${tone === 'total' ? 7 : 11}%, transparent)` }}>
        <span className="grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-surface-card shadow-sm" style={{ color: tone === 'total' ? 'var(--text-primary)' : color }}>{icon}</span>
        <div className="min-w-0">
          <div className="truncate font-bold text-content" style={fs(13.5, 'body')}>{label}</div>
          <div className="truncate text-content-faint" style={fs(11.5)}>{sub}</div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-3.5">
        <div className="flex items-baseline font-semibold leading-none tracking-[-0.035em]" style={{ fontSize: 'calc(40px * var(--fs-scale-title, 1))', color: tone === 'total' ? 'var(--text-primary)' : color }}>
          {parts
            ? parts.map((p, i) => <span key={i} className={big(p) ? undefined : 'font-medium text-content-faint'} style={big(p) ? undefined : { fontSize: 'calc(22px * var(--fs-scale-title, 1))' }}>{p.value}</span>)
            : <span>{formatMoney(amount, currency, locale)}</span>}
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 text-content-muted" style={fs(12.5, 'body')}>{foot}</div>
      </div>
    </section>
  )
}

function FlowPills({ ids, lead, Avatar, name }: { ids: number[]; lead: string; Avatar: (p: { id: number; size?: number }) => React.JSX.Element; name: (id: number) => string }) {
  const uniq = Array.from(new Set(ids))
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span className="text-content-faint">{lead}</span>
      {uniq.map(id => (
        <span key={id} className="bg-surface-secondary border border-edge text-content" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px 3px 3px', borderRadius: 999, fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600 }}>
          <Avatar id={id} size={18} />{name(id)}
        </span>
      ))}
    </span>
  )
}

// Add or edit a settle-up payment (from / to / amount / currency). Reachable inline
// from the ledger row and from a manual "Add payment" button, so recording "I sent
// money to X" works the same whether or not there's an outstanding expense behind it.
// A transfer can be made in any currency — paying a rouble debt in euros is normal —
// so it carries its own, defaulting to the display currency. The server freezes its
// FX rate on write, the same way an expense's is frozen.
function SettlementModal({ tripId, people, me, editing, currency, tripCurrency, onClose, onSaved }: {
  tripId: number; people: TripMember[]; me: number; editing: Settlement | null; currency: string; tripCurrency: string; onClose: () => void; onSaved: () => void
}) {
  const { t } = useTranslation()
  const toast = useToast()
  const otherDefault = people.find(p => p.id !== me)?.id ?? me
  const [fromId, setFromId] = useState<string>(String(editing?.from_user_id ?? me))
  const [toId, setToId] = useState<string>(String(editing?.to_user_id ?? otherDefault))
  // Seeded with the transfer's own currency decimals, so a reopened 4,90 reads
  // "4.90" and not "4.9" (#2175) — and a JPY transfer gets no fake decimals.
  const [amount, setAmount] = useState<string>(editing ? amountToInputString(editing.amount, (editing.currency || currency).toUpperCase()) : '')
  const [cur, setCur] = useState<string>((editing?.currency || currency).toUpperCase())
  const [day, setDay] = useState(editing ? settlementDate(editing) : localToday())
  const [note, setNote] = useState(editing?.note || '')
  const [saving, setSaving] = useState(false)

  const amt = Number.parseFloat(amount) || 0
  const valid = amt > 0 && fromId !== toId && !!day
  const opts = people.map(p => ({ value: String(p.id), label: p.id === me ? t('costs.you') : p.username }))

  const save = async () => {
    if (!valid) return
    setSaving(true)
    const data = withFallbackFx({ from_user_id: Number(fromId), to_user_id: Number(toId), amount: amt, currency: cur, settled_at: day, note: note.trim() || null }, tripCurrency)
    try {
      if (editing) await budgetApi.updateSettlement(tripId, editing.id, data)
      else await budgetApi.createSettlement(tripId, data)
      onSaved()
    } catch { toast.error(t('common.unknownError')) } finally { setSaving(false) }
  }

  const labelId = useId()
  const nameOf = (id: string) => {
    const p = people.find(x => String(x.id) === id)
    if (!p) return ''
    return p.id === me ? t('costs.you') : p.username
  }

  return (
    <DialogShell
      onClose={onClose}
      labelledBy={labelId}
      width="narrow"
      header={(
        <DialogHeader
          tile={<DialogTile><ArrowLeftRight size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={onClose}
          title={editing ? t('costs.editPayment') : t('costs.addPayment')}
          sub={fromId !== toId ? `${nameOf(fromId)} → ${nameOf(toId)}` : undefined}
        />
      )}
      footer={(
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
          <DialogButton variant="primary" onClick={save} disabled={!valid || saving}>{editing ? t('common.save') : t('costs.addPayment')}</DialogButton>
        </DialogFooter>
      )}
    >
      <div className={GRID_2}>
        <EditorField label={t('costs.from')}>
          <CustomSelect value={fromId} onChange={v => setFromId(String(v))} options={opts} style={{ width: '100%' }} />
        </EditorField>
        <EditorField label={t('costs.to')}>
          <CustomSelect value={toId} onChange={v => setToId(String(v))} options={opts} style={{ width: '100%' }} />
        </EditorField>
      </div>
      <div className={GRID_2}>
        <EditorField label={t('costs.amount')}>
          <div className="flex items-center rounded-[10px] border border-edge bg-surface-input px-3" style={{ height: FIELD_H }}>
            <span className="text-content-faint" style={fs(14, 'body')}>{SYMBOLS[cur] || (cur + ' ')}</span>
            {/* Typed and shown the way the expense total is, in the reader's own decimal mark. */}
            <NumericInput mode="decimal" placeholder={localizeAmountInput('0.00', cur)} value={localizeAmountInput(amount, cur)}
              onValueChange={v => setAmount(v.replace(',', '.'))}
              className="w-full flex-1 border-0 bg-transparent pl-1.5 font-semibold text-content outline-none dark:bg-transparent" style={fs(14, 'body')} />
          </div>
        </EditorField>
        <EditorField label={t('costs.currency')}>
          <CustomSelect value={cur} onChange={v => setCur(String(v))} searchable
            options={currenciesWith(cur).map(c => ({ value: c, label: SYMBOLS[c] ? `${c}  ${SYMBOLS[c]}` : c }))}
            style={{ width: '100%' }} />
        </EditorField>
      </div>
      <EditorField label={t('costs.day')}>
        <CustomDatePicker value={day} onChange={setDay} style={{ width: '100%' }} />
      </EditorField>
      <EditorField label={t('costs.note')} htmlFor="payment-note">
        <textarea id="payment-note" value={note} onChange={e => setNote(e.target.value)} rows={2}
          placeholder={t('costs.paymentNotePlaceholder')} maxLength={NOTE_MAX} className={`${TEXTAREA} resize-y`} />
      </EditorField>
    </DialogShell>
  )
}

// ── Add / edit expense modal ───────────────────────────────────────────────
export interface ExpensePrefill {
  name?: string
  category?: string
  amount?: number
  reservationId?: number
  /** Set when the expense is being created from a place (#1298). */
  placeId?: number
  /** The rest comes from a scanned receipt: its currency, day and lines, and the photo, attached on save. */
  currency?: string
  date?: string
  lines?: ReceiptLine[]
  receiptFiles?: File[]
}

export function ExpenseModal({ tripId, base, people, me, editing, prefill, onClose, onSaved }: {
  tripId: number; base: string; people: TripMember[]; me: number; editing: BudgetItem | null; prefill?: ExpensePrefill; onClose: () => void; onSaved: () => void
}) {
  const { t, locale } = useTranslation()
  const toast = useToast()
  const isMobile = useIsMobile()
  const titleId = useId()
  const { addBudgetItem, updateBudgetItem } = useTripStore()
  const sym = (c: string) => SYMBOLS[c] || (c + ' ')
  // A saved expense without a currency opens in the trip's own (#2525).
  const { tripCurrency: tripCur, editingCurrency, preview } = useExpenseFx(base, editing)

  const [name, setName] = useState(editing?.name || prefill?.name || '')
  const [cat, setCat] = useState<string>(editing ? catMeta(editing.category).key : (prefill?.category || 'food'))
  const [seed] = useState(() => newExpenseSeed(prefill, base, people.map(p => p.id), localToday()))
  const [currency, setCurrency] = useState(editing ? editingCurrency : seed.currency)
  const [day, setDay] = useState(editing ? (editing.expense_date || localToday()) : seed.day)
  const [note, setNote] = useState(() => readUserNote(editing))
  // Edit and prefill seeds are padded to the currency's decimals (#2175): the DB
  // returns numbers, so a saved 4,90 would otherwise reopen as "4,9" and a saved
  // 5,00 as "5".
  const [total, setTotal] = useState<string>(() => {
    if (editing) return editing.total_price ? amountToInputString(editing.total_price, editingCurrency) : ''
    return seed.total
  })
  const [participants, setParticipants] = useState<Set<number>>(() =>
    editing ? new Set((editing.members || []).map(m => m.user_id)) : new Set(people.map(p => p.id)))

  // Payer state. An expense can be fronted by several people, each with their own
  // amount (budget_item_payers) — a shared card, or "I got this round, you get the
  // next". The single-payer dropdown stays the default path; multiPayer swaps in a
  // per-person amount editor. 0 represents "Nobody (planning entry)"; on an
  // existing expense a missing payer is a deliberate choice, so only a brand-new
  // one defaults to me. A negative payer (the recipient of a refund, #2176) is a
  // real payer — filtering on > 0 here would silently drop them on save.
  const initialPayers = (editing?.payers || []).filter(p => p.amount !== 0)

  const [payerId, setPayerId] = useState<number>(() => {
    const existingPayer = initialPayers[0]
    if (existingPayer) return existingPayer.user_id
    return editing ? 0 : me
  })
  const [multiPayer, setMultiPayer] = useState(() => initialPayers.length > 1)
  const [payerIds, setPayerIds] = useState<Set<number>>(() => new Set(initialPayers.map(p => p.user_id)))
  const [payerAmounts, setPayerAmounts] = useState<Record<number, string>>(() => {
    const m: Record<number, string> = {}
    for (const p of initialPayers) m[p.user_id] = amountToInputString(p.amount, currency)
    return m
  })
  // Payers the user typed an amount for: rebalance leaves these alone and makes
  // the others absorb the remainder.
  const [pinnedPayers, setPinnedPayers] = useState<Set<number>>(() => new Set(initialPayers.map(p => p.user_id)))

  const [splitMode, setSplitMode] = useState<'equally' | 'custom' | 'ticket'>(() => {
    if (hasTicketSplit(editing)) {
      return 'ticket'
    }
    if (editing && editing.members && editing.members.length > 0) {
      const hasCustom = editing.members.some(m => m.amount !== null && m.amount !== undefined)
      return hasCustom ? 'custom' : 'equally'
    }
    return 'equally'
  })

  const [ticketItems, setTicketItems] = useState<TicketItem[]>(() => editing ? readTicketItems(editing) : seed.ticketItems)

  const [customAmounts, setCustomAmounts] = useState<Record<number, string>>(() => {
    const m: Record<number, string> = {}
    if (editing && editing.members) {
      for (const member of editing.members) {
        if (member.amount !== null && member.amount !== undefined) {
          m[member.user_id] = amountToInputString(member.amount, currency)
        }
      }
    }
    return m
  })

  const [receipts, setReceipts] = useState<BudgetItemReceipt[]>(() => editing?.receipts || [])
  const [pendingReceiptFiles, setPendingReceiptFiles] = useState<File[]>(() => editing ? [] : seed.receiptFiles)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [modalPreviewReceipts, setModalPreviewReceipts] = useState<{ receipts: BudgetItemReceipt[]; initialIndex: number } | null>(null)

  const handleReceiptFileSelect = (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return
    setPendingReceiptFiles(prev => [...prev, ...Array.from(files)])
  }

  const handleRemoveReceipt = (receiptId: number) => {
    setReceipts(prev => prev.filter(r => r.id !== receiptId))
  }

  const handleRemovePendingReceipt = (index: number) => {
    setPendingReceiptFiles(prev => prev.filter((_, i) => i !== index))
  }

  const [saving, setSaving] = useState(false)

  const isTicketMode = splitMode === 'ticket'

  const ticketInfo = useMemo(() => {
    return calculateTicketShares(ticketItems)
  }, [ticketItems])

  const totalNum = isTicketMode ? ticketInfo.total : (Number.parseFloat(total) || 0)
  const fx = preview(totalNum, currency)
  const splitSum = [...participants].reduce((sum, id) => sum + (Number.parseFloat(customAmounts[id]) || 0), 0)
  const customBalanced = Math.round(splitSum * 100) === Math.round(totalNum * 100)
  // How much is still to be handed out, read on the total's own side: on a refund
  // (#2176) the shares run negative, so a plain total minus sum flips under and
  // over around and sends the user the wrong way.
  const splitShortfall = totalNum < 0 ? splitSum - totalNum : totalNum - splitSum
  const each = participants.size > 0 ? totalNum / participants.size : 0
  const equalShares = useMemo(() => {
    return splitEqualShares(totalNum, [...participants].map(id => ({ user_id: id })), editing?.id || 0)
  }, [totalNum, participants, editing])

  // The custom split typed as percentages instead of amounts (#1709).
  const pct = usePercentSplit({ total: totalNum, participants, customAmounts, setCustomAmounts, currency })
  const inPercent = splitMode === 'custom' && pct.unit === 'percent'

  const placeholderShares = useMemo(() => {
    const emptyParts = [...participants].filter(id => !customAmounts[id])
    if (emptyParts.length === 0) return {}

    const enteredSum = [...participants]
      .filter(id => customAmounts[id])
      .reduce((sum, id) => sum + (Number.parseFloat(customAmounts[id]) || 0), 0)
    // Clamped toward zero on the total's own side, so an over-entered positive
    // split never suggests negative leftovers — while a negative total (#2176)
    // still previews its negative equal shares.
    const rest = totalNum - enteredSum
    const remaining = totalNum >= 0 ? Math.max(0, rest) : Math.min(0, rest)

    return splitEqualShares(remaining, emptyParts.map(id => ({ user_id: id })), editing?.id || 0)
  }, [totalNum, participants, customAmounts, editing])

  const ticketValid = ticketItems.length > 0 && ticketItems.every(item => item.name.trim().length > 0 && (Number.parseFloat(item.price) || 0) > 0 && item.participants.size > 0)
  const payersOk = !multiPayer || (payerIds.size > 0 && payersBalanced(payerAmounts, payerIds, totalNum))
  // A negative total is a valid entry (a refund, #2176); only zero has nothing to say.
  const valid = name.trim().length > 0 && payersOk && (
    isTicketMode
      ? ticketValid
      : totalNum !== 0 && (participants.size === 0 || splitMode === 'equally' || customBalanced)
  )

  const onTotalChange = (v: string) => {
    setTotal(v.replace(',', '.'))
  }

  // Keep the payer amounts summing to the total as it changes — including in ticket
  // mode, where the total is derived from the ticket items rather than typed.
  useEffect(() => {
    if (!multiPayer) return
    setPayerAmounts(prev => rebalancePayers(prev, pinnedPayers, payerIds, totalNum))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalNum])

  const enableMultiPayer = () => {
    const startPayers = payerIds.size > 0 ? new Set(payerIds) : new Set<number>([payerId > 0 ? payerId : me])
    const pinned = new Set<number>()
    setPayerIds(startPayers)
    setPinnedPayers(pinned)
    setPayerAmounts(prev => rebalancePayers(prev, pinned, startPayers, totalNum))
    setMultiPayer(true)
  }

  const disableMultiPayer = () => {
    // Collapsing back keeps the first payer; their amount becomes the whole total.
    const [first] = [...payerIds]
    setPayerId(first ?? me)
    setMultiPayer(false)
  }

  const togglePayer = (id: number) => {
    const nextIds = new Set(payerIds)
    const nextPinned = new Set(pinnedPayers)
    if (nextIds.has(id)) {
      nextIds.delete(id)
      nextPinned.delete(id)
    } else {
      nextIds.add(id)
    }
    setPayerIds(nextIds)
    setPinnedPayers(nextPinned)
    setPayerAmounts(prev => rebalancePayers(prev, nextPinned, nextIds, totalNum))
  }

  const onPayerAmountChange = (id: number, v: string) => {
    const val = v.replace(',', '.')
    const nextPinned = new Set(pinnedPayers)
    nextPinned.add(id)
    setPinnedPayers(nextPinned)
    setPayerAmounts(prev => rebalancePayers({ ...prev, [id]: val }, nextPinned, payerIds, totalNum))
  }

  const handleCustomAmountChange = (id: number, val: string) => {
    val = val.replace(',', '.')
    if (val === '' || amountPattern(currency, true).test(val)) {
      setCustomAmounts(prev => ({ ...prev, [id]: val }))
    }
  }

  const handleAddEmptyItem = () => {
    setTicketItems(prev => [
      ...prev,
      {
        id: String(Date.now() + Math.random()),
        name: '',
        price: '',
        participants: new Set(people.map(p => p.id))
      }
    ])
  }

  const handleUpdateItemName = (id: string, name: string) => {
    setTicketItems(prev => prev.map(item => item.id === id ? { ...item, name } : item))
  }

  const handleUpdateItemPrice = (id: string, price: string) => {
    price = price.replace(',', '.')
    if (price === '' || amountPattern(currency, false).test(price)) {
      setTicketItems(prev => prev.map(item => item.id === id ? { ...item, price } : item))
    }
  }

  const handleRemoveItem = (id: string) => {
    setTicketItems(prev => prev.filter(item => item.id !== id))
  }

  const handleToggleItemParticipant = (itemId: string, userId: number) => {
    setTicketItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const nextParts = new Set(item.participants)
        if (nextParts.has(userId)) nextParts.delete(userId)
        else nextParts.add(userId)
        return { ...item, participants: nextParts }
      }
      return item
    }))
  }

  const toggleParticipant = (id: number) => {
    const nextParts = new Set(participants)
    if (nextParts.has(id)) {
      nextParts.delete(id)
      setCustomAmounts(prev => {
        const copy = { ...prev }
        delete copy[id]
        return copy
      })
    } else {
      nextParts.add(id)
    }
    setParticipants(nextParts)
  }

  const save = async () => {
    if (!valid) return
    setSaving(true)
    // A picked payer always goes out, even when nobody shares the expense: the
    // server re-derives total_price from the payer sum (CostsPanel.helpers), so
    // dropping the payer would store the entry with a total of 0.
    const payerList = multiPayer
      ? [...payerIds]
          .map(id => ({ user_id: id, amount: Number.parseFloat(payerAmounts[id]) || 0 }))
          .filter(p => p.amount !== 0)
      : payerId > 0 ? [{ user_id: payerId, amount: totalNum }] : []
    // A receipt line can name somebody who is not ticked as a participant. Sending
    // only the ticked set would drop their share, leaving the member sum short of
    // total_price and handing the settlement a difference it can never clear (#1382).
    const memberIds = splitMode === 'ticket'
      ? [...new Set([...participants, ...Object.keys(ticketInfo.shares).map(Number)])].sort((a, b) => a - b)
      : [...participants]
    const memberList = memberIds.map(id => ({
      user_id: id,
      amount: splitMode === 'custom'
        ? (Number.parseFloat(customAmounts[id]) || 0)
        : splitMode === 'ticket'
        ? (ticketInfo.shares[id] || 0)
        : null
    }))
    const data = {
      name: name.trim(),
      category: cat,
      currency,
      payers: payerList,
      members: memberList,
      member_ids: memberIds,
      expense_date: day || null,
      total_price: totalNum,
      note: note.trim() || null,
      ticket_json: splitMode === 'ticket' ? writeTicketItems(ticketItems) : null,
      ...(!editing && prefill?.reservationId ? { reservation_id: prefill.reservationId } : {}),
      ...(!editing && prefill?.placeId ? { place_id: prefill.placeId } : {}),
    }
    try {
      setUploadingReceipt(pendingReceiptFiles.length > 0)
      await saveWithReceipts(tripId, pendingReceiptFiles, editing ? editing.id : null, ids => (
        editing
          ? updateBudgetItem(tripId, editing.id, { ...data, receipt_file_ids: [...receipts.map(r => r.id), ...ids] })
          : addBudgetItem(tripId, { ...data, receipt_file_ids: ids })
      ))
      // Only cleared once the save went through, so a retry after a failure
      // does not upload a second copy of every file.
      setPendingReceiptFiles([])
      onSaved()
    } catch (err) {
      // A receipt the rollback could not remove is still on the trip, and the
      // user is the only one who can clear it out of the Files tab.
      const stuck = (err as { stuckReceiptIds?: number[] })?.stuckReceiptIds
      toast.error(stuck?.length ? t('costs.receiptLeftBehind', { count: stuck.length }) : t('common.unknownError'))
    } finally {
      setUploadingReceipt(false)
      setSaving(false)
    }
  }

  const catInfo = catMeta(cat)
  const money = (v: number) => formatMoney(v, currency, locale)
  // A person's row in the payer and split lists: avatar or initial, then the name.
  const personFace = (p: TripMember, idx: number, on: boolean, size = 22) => p.avatar_url
    ? <img src={p.avatar_url} alt="" className="block flex-none rounded-full object-cover" style={{ width: size, height: size, opacity: on ? 1 : 0.45 }} />
    : <span className="grid flex-none place-items-center rounded-full font-bold text-white" style={{ width: size, height: size, background: SPLIT_COLORS[idx % SPLIT_COLORS.length].gradient, opacity: on ? 1 : 0.45, ...fs(9) }}>
        {(p.id === me ? t('costs.youShort') : p.username.charAt(0)).toUpperCase()}
      </span>
  const GROUP = 'rounded-[16px] bg-surface-secondary p-4'
  const PERSON_LIST = 'divide-y divide-edge-faint overflow-hidden rounded-[12px] border border-edge-faint bg-surface-card'
  const PERSON_ROW = 'grid min-h-[48px] grid-cols-[minmax(0,1fr)_130px] items-center gap-2.5 px-3 py-1.5'
  const AMOUNT_BOX = 'flex items-center gap-1 rounded-[8px] border border-edge bg-surface-input px-2.5'
  const AMOUNT_INPUT = 'w-full border-0 bg-transparent py-2 text-right font-semibold text-content outline-none dark:bg-transparent'

  const nameOf = (p: TripMember) => (p.id === me ? t('costs.you') : p.username)
  // Who is in, shown as a real box to tick instead of a row that only fades.
  const tick = (on: boolean) => (
    <span aria-hidden className={`grid h-[18px] w-[18px] flex-none place-items-center rounded-[5px] border ${on ? 'border-transparent bg-accent text-accent-text' : 'border-edge bg-surface-card'}`}>
      {on && <Check size={12} strokeWidth={3} />}
    </span>
  )
  const personName = (p: TripMember, on: boolean) => (
    <span className={`truncate font-medium ${on ? 'text-content' : 'text-content-faint'}`} style={fs(13.5, 'body')}>{nameOf(p)}</span>
  )
  const excludedNote = <span />
  const modeHint = (text: string) => <p className="m-0 mb-2.5 text-content-faint" style={fs(12, 'body')}>{text}</p>
  // Figures sit in badges, so an amount never reads as part of the sentence beside it.
  const BADGE = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-[3px] font-geist font-semibold tabular-nums'
  const badge = (content: ReactNode, tone: 'neutral' | 'success' | 'danger' | 'warning' = 'neutral') => {
    const look = { neutral: 'bg-surface-tertiary text-content-secondary', success: 'bg-success-soft text-success', danger: 'bg-danger-soft text-danger', warning: 'bg-warning-soft text-warning' }[tone]
    return <span className={`${BADGE} ${look}`} style={fs(12)}>{content}</span>
  }

  const payerSection = (
    <DialogSection
      label={t('costs.whoPaid')}
      className={GROUP}
      action={(
        <Segmented<'one' | 'several'>
          label={t('costs.whoPaid')}
          value={multiPayer ? 'several' : 'one'}
          onChange={mode => {
            if (mode === 'several' && !multiPayer) enableMultiPayer()
            if (mode === 'one' && multiPayer) disableMultiPayer()
          }}
          options={[
            { value: 'one', label: t('costs.singlePayer') },
            { value: 'several', label: t('costs.multiplePayers') },
          ]}
        />
      )}
    >
      {!multiPayer ? (
        // One payer: everybody as a chip to pick, and "nobody yet" for a planning entry.
        <div role="radiogroup" aria-label={t('costs.whoPaid')} className="flex flex-wrap gap-1.5">
          {people.map((p, idx) => {
            const on = payerId === p.id
            return (
              <button key={p.id} type="button" role="radio" aria-checked={on} aria-label={nameOf(p)} onClick={() => setPayerId(p.id)}
                className={`inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 font-medium ${on ? 'border-[color:var(--text-primary)] bg-surface-card text-content shadow-sm' : 'border-edge-faint bg-surface-secondary text-content-muted hover:text-content'}`}
                style={fs(13, 'body')}>
                {personFace(p, idx, true, 22)}
                {nameOf(p)}
              </button>
            )
          })}
          <button type="button" role="radio" aria-checked={payerId === 0} onClick={() => setPayerId(0)}
            className={`inline-flex items-center rounded-full border border-dashed px-3 py-1 font-medium ${payerId === 0 ? 'border-[color:var(--text-primary)] text-content' : 'border-edge text-content-faint hover:text-content'}`}
            style={fs(13, 'body')}>
            {t('costs.noOnePaid') || 'Nobody (planning entry)'}
          </button>
        </div>
      ) : (
        <>
          {modeHint(t('costs.payersHint'))}
          <div className={PERSON_LIST}>
            {people.map((p, idx) => {
              const on = payerIds.has(p.id)
              return (
                <div key={p.id} className={PERSON_ROW}>
                  <button type="button" role="checkbox" aria-checked={on} aria-label={nameOf(p)} onClick={() => togglePayer(p.id)} data-testid="payer-toggle"
                    className="inline-flex min-w-0 items-center gap-2.5 text-left">
                    {tick(on)}
                    {personFace(p, idx, on)}
                    {personName(p, on)}
                  </button>
                  {on ? (
                    <div className={AMOUNT_BOX}>
                      <span className="text-content-faint" style={fs(13, 'body')}>{sym(currency)}</span>
                      <NumericInput mode="signed-decimal" placeholder={localizeAmountInput('0.00', currency)} data-testid="payer-amount"
                        value={localizeAmountInput(payerAmounts[p.id] || '', currency)}
                        onValueChange={v => onPayerAmountChange(p.id, v)}
                        className={AMOUNT_INPUT} style={fs(13.5, 'body')} />
                    </div>
                  ) : excludedNote}
                </div>
              )
            })}
          </div>
          {!payersOk && (
            <div className="mt-2.5">{badge(<><AlertCircle size={12} strokeWidth={2.4} />{t('costs.payersUnbalanced', { amount: formatMoney(totalNum, currency, locale) })}</>, 'warning')}</div>
          )}
        </>
      )}
    </DialogSection>
  )

  const splitSection = (
    <DialogSection
      label={t('costs.split') || 'Split'}
      className={GROUP}
      action={(
        <Segmented<'equally' | 'custom' | 'ticket'>
          label={t('costs.split') || 'Split'}
          value={splitMode}
          onChange={setSplitMode}
          options={[
            { value: 'equally', label: t('costs.splitEqually') || 'Equally' },
            { value: 'custom', label: t('costs.splitCustom') || 'Custom' },
            { value: 'ticket', label: t('costs.splitTicket') || 'Ticket' },
          ]}
        />
      )}
    >
      {splitMode === 'custom' ? (
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <p className="m-0 min-w-0 text-content-faint" style={fs(12, 'body')}>{t(inPercent ? 'costs.splitHint.percent' : 'costs.splitHint.custom')}</p>
          <Segmented<CustomSplitUnit>
            label={t('costs.splitUnit')}
            value={pct.unit}
            onChange={pct.setUnit}
            options={[
              { value: 'amount', label: sym(currency) },
              { value: 'percent', label: '%' },
            ]}
          />
        </div>
      ) : modeHint(t(`costs.splitHint.${splitMode}`))}
      {splitMode === 'ticket' ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            {ticketItems.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 rounded-[10px] border border-edge-faint bg-surface-secondary p-2.5">
                <div className="grid grid-cols-[minmax(0,1fr)_130px_auto] items-center gap-2">
                  <input
                    type="text"
                    placeholder={t('costs.ticketItemName')}
                    value={item.name}
                    onChange={e => handleUpdateItemName(item.id, e.target.value)}
                    className={INPUT}
                  />
                  <div className={AMOUNT_BOX}>
                    <span className="text-content-faint" style={fs(12)}>{sym(currency)}</span>
                    <NumericInput
                      mode="decimal"
                      placeholder={localizeAmountInput('0.00', currency)}
                      value={localizeAmountInput(item.price, currency)}
                      onValueChange={v => handleUpdateItemPrice(item.id, v)}
                      className={AMOUNT_INPUT}
                      style={fs(13, 'body')}
                    />
                  </div>
                  <Tooltip label={t('common.delete')}>
                    <button type="button" onClick={() => handleRemoveItem(item.id)} aria-label={t('common.delete')} className="grid h-8 w-8 place-items-center rounded-full text-content-muted hover:text-danger">
                      <Trash2 size={15} />
                    </button>
                  </Tooltip>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 font-geist font-bold uppercase tracking-[.08em] text-content-faint" style={fs(9.5)}>{t('costs.ticketSplitting')}</span>
                  {people.map((p, pIdx) => {
                    const active = item.participants.has(p.id)
                    return (
                      <button
                        type="button"
                        key={p.id}
                        role="checkbox"
                        aria-checked={active}
                        onClick={() => handleToggleItemParticipant(item.id, p.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full border py-[3px] pl-1 pr-2 font-medium ${active ? 'border-[color:var(--text-primary)] bg-surface-card text-content' : 'border-edge bg-surface-secondary text-content-faint'}`}
                        style={fs(11.5)}
                      >
                        {personFace(p, pIdx, active, 16)}
                        <span>{nameOf(p)}</span>
                        {active && <Check size={11} strokeWidth={3} />}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <AddRowButton onClick={handleAddEmptyItem}>{t('costs.ticketAddItem')}</AddRowButton>

          {ticketItems.length > 0 && (
            <div>
              <div className="mb-1.5 font-geist font-bold uppercase tracking-[.08em] text-content-faint" style={fs(9.5)}>{t('costs.ticketShares')}</div>
              <div className="flex flex-wrap gap-1.5">
                {people.map(p => (
                  <span key={p.id}>{badge(<><span className="font-medium text-content-muted">{nameOf(p)}</span><span>{money(ticketInfo.shares[p.id] || 0)}</span></>)}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className={PERSON_LIST}>
            {people.map((p, idx) => {
              const on = participants.has(p.id)
              return (
                <div key={p.id} className={PERSON_ROW}>
                  <button type="button" role="checkbox" aria-checked={on} aria-label={nameOf(p)} onClick={() => toggleParticipant(p.id)}
                    className="inline-flex min-w-0 items-center gap-2.5 text-left">
                    {tick(on)}
                    {personFace(p, idx, on)}
                    {personName(p, on)}
                    {p.is_guest && <GuestBadge size="xs" customTooltip />}
                  </button>
                  {!on ? excludedNote : splitMode === 'equally' ? (
                    <span className="text-right">{badge(money(equalShares[p.id] || 0))}</span>
                  ) : inPercent ? (
                    <div className="flex flex-col items-end gap-0.5">
                      <div className={`${AMOUNT_BOX} w-full`}>
                        <input type="text" inputMode="decimal" aria-label={`${nameOf(p)} %`} placeholder={pct.placeholderPercent} value={pct.percents[p.id] ?? ''}
                          onChange={e => pct.onPercentChange(p.id, e.target.value)}
                          className={AMOUNT_INPUT} style={fs(13.5, 'body')} />
                        <span className="text-content-faint" style={fs(13, 'body')}>%</span>
                      </div>
                      {customAmounts[p.id] && <span className="font-geist tabular-nums text-content-faint" style={fs(10.5)}>{money(Number.parseFloat(customAmounts[p.id]) || 0)}</span>}
                    </div>
                  ) : (
                    <div className={AMOUNT_BOX}>
                      <span className="text-content-faint" style={fs(13, 'body')}>{sym(currency)}</span>
                      <input type="text" inputMode="decimal" placeholder={localizeAmountInput((placeholderShares[p.id] || 0).toFixed(2), currency)} value={localizeAmountInput(customAmounts[p.id] || '', currency)}
                        onChange={e => handleCustomAmountChange(p.id, e.target.value)}
                        className={AMOUNT_INPUT} style={fs(13.5, 'body')} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {splitMode === 'equally' ? (
              participants.size > 0 && <>
                {badge(<><Users size={12} strokeWidth={2.4} />{participants.size}</>)}
                {badge(t('costs.perPerson', { amount: splitShareLabel(each, currency, fx, participants.size, base, null, locale) }))}
              </>
            ) : customBalanced ? (
              badge(<><Check size={12} strokeWidth={3} />{t('costs.splitBalanced')}</>, 'success')
            ) : inPercent ? (
              badge(<><AlertCircle size={12} strokeWidth={2.4} />{t('costs.splitPercentOff', { sum: String(Math.round(pct.percentSum * 100) / 100) })}</>, 'danger')
            ) : (
              badge(<><AlertCircle size={12} strokeWidth={2.4} />{t(splitShortfall > 0 ? 'costs.splitSumUnder' : 'costs.splitSumOver', {
                sum: money(splitSum),
                total: money(totalNum),
                diff: money(Math.abs(totalNum - splitSum)),
              })}</>, 'danger')
            )}
          </div>
        </>
      )}
    </DialogSection>
  )

  const receiptRow = 'flex items-center justify-between gap-2 rounded-[10px] border border-edge-faint bg-surface-secondary px-3 py-2'
  const receiptsSection = (
    <DialogSection
      label={t('costs.receiptsTitle') || t('costs.receipts')}
      className={GROUP}
      action={(
        <label className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-surface-tertiary px-2.5 py-1 font-semibold text-content-muted hover:text-content" style={fs(11.5)}>
          <input
            type="file"
            multiple
            accept="image/*,application/pdf"
            className="hidden"
            onChange={e => {
              handleReceiptFileSelect(e.target.files)
              e.target.value = ''
            }}
          />
          <Plus size={12} /> {t('costs.attach')}
        </label>
      )}
    >
      {uploadingReceipt && (
        <div className="mb-2 text-content-faint" style={fs(12)}>{t('common.saving')}...</div>
      )}
      {receipts.length === 0 && pendingReceiptFiles.length === 0 ? (
        <div className="py-1 text-content-faint" style={fs(12.5, 'body')}>{t('costs.noReceipts')}</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {receipts.map((r, rIdx) => (
            <div key={r.id} className={receiptRow}>
              <button type="button" onClick={() => setModalPreviewReceipts({ receipts, initialIndex: rIdx })}
                className="inline-flex min-w-0 items-center gap-2 text-left text-content hover:underline" style={fs(13, 'body')}>
                <Receipt size={14} className="flex-shrink-0 text-content-faint" />
                <span className="truncate">{r.original_name}</span>
              </button>
              <Tooltip label={t('costs.deleteReceipt')}>
                <button type="button" onClick={() => handleRemoveReceipt(r.id)} aria-label={t('costs.deleteReceipt')} className="flex p-1 text-content-muted hover:text-danger">
                  <Trash2 size={14} />
                </button>
              </Tooltip>
            </div>
          ))}
          {pendingReceiptFiles.map((file, idx) => (
            <div key={idx} className={receiptRow}>
              <div className="inline-flex min-w-0 items-center gap-2" style={fs(13, 'body')}>
                <Paperclip size={14} className="flex-shrink-0 text-content-faint" />
                <span className="truncate text-content">{file.name}</span>
              </div>
              <Tooltip label={t('costs.deleteReceipt')}>
                <button type="button" onClick={() => handleRemovePendingReceipt(idx)} aria-label={t('costs.deleteReceipt')} className="flex p-1 text-content-muted hover:text-danger">
                  <Trash2 size={14} />
                </button>
              </Tooltip>
            </div>
          ))}
        </div>
      )}
    </DialogSection>
  )

  return (
    <>
      <DialogShell
        onClose={onClose}
        labelledBy={titleId}
        width="editor"
        blocked={!!modalPreviewReceipts}
        header={(
          <DialogHeader
            tile={<DialogTile><catInfo.Icon size={20} strokeWidth={1.9} style={{ color: catInfo.color }} /></DialogTile>}
            tint={`color-mix(in srgb, ${catInfo.color} 10%, transparent)`}
            labelId={titleId}
            onClose={onClose}
            eyebrow={editing ? t('costs.editExpense') : t('costs.addExpense')}
            titleInput={{ value: name, onChange: setName, label: t('costs.whatFor'), placeholder: t('costs.namePlaceholder') }}
            pills={(
              <PillSelect
                label={t('costs.category')}
                value={cat}
                onChange={setCat}
                options={COST_CATEGORY_LIST.map(c => ({ value: c.key, label: t(c.labelKey), icon: <c.Icon size={14} style={{ color: c.color }} /> }))}
              />
            )}
          />
        )}
        footer={(
          <DialogFooter>
            <FooterSpacer />
            <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
            <DialogButton variant="primary" onClick={save} disabled={!valid || saving}>{editing ? t('common.save') : t('costs.addExpense')}</DialogButton>
          </DialogFooter>
        )}
      >
        <div className={`${GROUP} flex flex-col gap-3`}>
        <div className={isMobile ? 'flex flex-col gap-5' : 'grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] items-start gap-3'}>
          <EditorField label={t('costs.totalAmount')}>
            <div className="flex items-center rounded-[10px] border border-edge bg-surface-input px-3" style={{ height: FIELD_H, opacity: isTicketMode ? 0.6 : 1 }}>
              <span className="text-content-faint" style={fs(15, 'subtitle')}>{sym(currency)}</span>
              <NumericInput mode="signed-decimal" placeholder={localizeAmountInput('0.00', currency)} value={localizeAmountInput(isTicketMode ? ticketInfo.total.toFixed(2) : total, currency)}
                onValueChange={onTotalChange}
                signToggleLabel={t('costs.toggleSign')}
                disabled={isTicketMode}
                className="w-full flex-1 border-0 bg-transparent pl-1.5 font-semibold text-content outline-none dark:bg-transparent" style={fs(15, 'subtitle')} />
            </div>
          </EditorField>
          <EditorField label={t('costs.currency')}>
            <CustomSelect value={currency} onChange={v => setCurrency(String(v))} searchable
              options={currenciesWith(currency).map(c => ({ value: c, label: SYMBOLS[c] ? `${c}  ${SYMBOLS[c]}` : c }))}
              style={{ width: '100%' }} />
          </EditorField>
          <EditorField label={t('costs.day')}>
            <CustomDatePicker value={day} onChange={setDay} style={{ width: '100%' }} />
          </EditorField>
        </div>

        {fx && (
          <div className="flex flex-wrap items-center gap-1.5 text-content-faint" style={fs(12, 'body')}>
            {badge(formatMoney(totalNum, currency, locale))}
            {fx.inTrip != null && <>
              <span>→</span>
              {badge(formatMoney(fx.inTrip, tripCur, locale))}
            </>}
            {fx.shown != null && <>
              <span>≈</span>
              {badge(formatMoney(fx.shown, base, locale))}
              <span>{t('costs.liveRate')}</span>
            </>}
          </div>
        )}
        </div>

        {payerSection}
        {splitSection}

        {/* Side by side the two panels share one height. */}
        <div className={isMobile ? 'flex flex-col gap-5' : 'grid grid-cols-2 gap-3'}>
          <EditorField label={t('costs.note')} htmlFor="expense-note" className={GROUP}>
            <textarea id="expense-note" value={note} onChange={e => setNote(e.target.value)} rows={3}
              placeholder={t('costs.notePlaceholder')} maxLength={NOTE_MAX} className={`${TEXTAREA} resize-y`} />
          </EditorField>
          {receiptsSection}
        </div>
      </DialogShell>

      {modalPreviewReceipts && (
        <ReceiptPreviewModal
          receipts={modalPreviewReceipts.receipts}
          initialIndex={modalPreviewReceipts.initialIndex}
          onClose={() => setModalPreviewReceipts(null)}
        />
      )}
    </>
  )
}
