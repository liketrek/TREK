import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, BarChart3, Plus, Search, ArrowRight, ArrowLeftRight, Check, RotateCcw, Pencil, Trash2, AlertCircle, Download } from 'lucide-react'
import { useTripStore } from '../../store/tripStore'
import { useAuthStore } from '../../store/authStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useCanDo } from '../../store/permissionsStore'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'
import { budgetApi } from '../../api/client'
import { useExchangeRates } from '../../hooks/useExchangeRates'
import { useIsMobile } from '../../hooks/useIsMobile'
import { formatMoney, currencyDecimals, currencyLocale } from '../../utils/formatters'
import Modal from '../shared/Modal'
import CustomSelect from '../shared/CustomSelect'
import { CustomDatePicker } from '../shared/CustomDateTimePicker'
import { SYMBOLS, currenciesWith, SPLIT_COLORS } from './BudgetPanel.constants'
import { payersBalanced, rebalancePayers } from './CostsPanel.helpers'
import { COST_CATEGORY_LIST, catMeta } from './costsCategories'
import type { BudgetItem } from '../../types'
import type { TripMember } from './BudgetPanelMemberChips'
import GuestBadge from '../shared/GuestBadge'
import { NumericInput } from '../shared/NumericInput'

export function splitEqualShares(total: number, members: { user_id: number }[], itemId: number): Record<number, number> {
  const n = members.length
  if (n === 0) return {}

  const totalCents = Math.round(total * 100)
  const baseCents = Math.floor(totalCents / n)
  const remainder = totalCents % n

  const shares: Record<number, number> = {}
  const sortedMembers = [...members].sort((a, b) => a.user_id - b.user_id)
  const startIndex = itemId % n

  for (let i = 0; i < n; i++) {
    const member = sortedMembers[i]
    const hasExtraCent = ((i - startIndex + n) % n) < remainder
    shares[member.user_id] = (baseCents + (hasExtraCent ? 1 : 0)) / 100
  }

  return shares
}

export interface TicketItem {
  id: string
  name: string
  price: string
  participants: Set<number>
}

export function calculateTicketShares(items: TicketItem[]): { shares: Record<number, number>; total: number } {
  const shares: Record<number, number> = {}
  let totalCents = 0

  for (const item of items) {
    const priceNum = parseFloat(item.price) || 0
    const priceCents = Math.round(priceNum * 100)
    totalCents += priceCents

    const partIds = [...item.participants]
    const n = partIds.length
    if (n === 0) continue

    const baseCents = Math.floor(priceCents / n)
    const remainder = priceCents % n

    const sortedPartIds = [...partIds].sort((a, b) => a - b)

    for (let i = 0; i < n; i++) {
      const id = sortedPartIds[i]
      const hasExtraCent = i < remainder
      const shareCents = baseCents + (hasExtraCent ? 1 : 0)
      shares[id] = (shares[id] || 0) + shareCents
    }
  }

  const finalShares: Record<number, number> = {}
  for (const id of Object.keys(shares)) {
    finalShares[Number(id)] = shares[Number(id)] / 100
  }

  return { shares: finalShares, total: totalCents / 100 }
}

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
  created_at?: string
  from_username?: string
  to_username?: string
}
interface SettlementData {
  balances: { user_id: number; username: string; avatar_url: string | null; balance: number }[]
  flows: { from: { user_id: number; username: string }; to: { user_id: number; username: string }; amount: number }[]
  settlements: Settlement[]
}

// One row in the unified Costs ledger — either an expense or a settle-up payment,
// carrying the date used to group it by day.
type LedgerEntry =
  | { kind: 'expense'; date: string; e: BudgetItem }
  | { kind: 'payment'; date: string; s: Settlement }

const round2 = (n: number) => Math.round(n * 100) / 100
const FIELD_H = 40 // shared height for the amount / currency / day row in the modal

export default function CostsPanel({ tripId, tripMembers = [] }: CostsPanelProps) {
  const { trip, budgetItems, deleteBudgetItem, loadBudgetItems } = useTripStore()
  const me = useAuthStore(s => s.user?.id ?? -1)
  const can = useCanDo()
  const canEdit = can('budget_edit', trip)
  const toast = useToast()
  const { t, locale } = useTranslation()
  const isMobile = useIsMobile()

  // Display/base currency = the user's preferred currency (Settings), falling back
  // to the trip's own currency. Everything in Costs is converted to and shown in it.
  const displayCurrency = useSettingsStore(s => s.settings.default_currency)
  const base = (displayCurrency || trip?.currency || 'EUR').toUpperCase()
  // Pre-rework rows stored currency = NULL, meaning "the trip's own currency".
  const tripCurrency = (trip?.currency || base).toUpperCase()
  const { convert } = useExchangeRates(base)
  const curOf = useCallback((e: BudgetItem) => (e.currency || tripCurrency), [tripCurrency])
  const [settlement, setSettlement] = useState<SettlementData | null>(null)
  const [filter, setFilter] = useState<'all' | 'mine' | 'owed'>('all')
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')   // '' = all categories
  const [dayFilter, setDayFilter] = useState('')   // '' = all days, else YYYY-MM-DD
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<BudgetItem | null>(null)
  const [editingSettlement, setEditingSettlement] = useState<Settlement | null>(null)
  const [addingPayment, setAddingPayment] = useState(false)

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

  const loadSettlement = useCallback(() => {
    budgetApi.settlement(tripId, base).then(setSettlement).catch(() => {})
  }, [tripId, base])

  useEffect(() => { loadBudgetItems(tripId); loadSettlement() }, [tripId])
  useEffect(() => { loadSettlement() }, [budgetItems.length, base])

  // The bottom-nav "+" on the Costs tab opens the add-expense modal via ?create=expense.
  const [searchParams, setSearchParams] = useSearchParams()
  useEffect(() => {
    if (searchParams.get('create') === 'expense') {
      setEditing(null); setModalOpen(true)
      setSearchParams(p => { p.delete('create'); return p }, { replace: true })
    }
  }, [searchParams])

  // ── derived expense maths (everything converted to the base currency) ────
  const baseTotal = (e: BudgetItem) => convert(e.total_price || 0, curOf(e))
  const myPaidOf = (e: BudgetItem) => (e.payers || []).filter(p => p.user_id === me).reduce((a, p) => a + convert(p.amount, curOf(e)), 0)
  const myShareOf = (e: BudgetItem) => {
    const myMember = (e.members || []).find(m => m.user_id === me)
    if (!myMember) return 0
    if (myMember.amount !== null && myMember.amount !== undefined) {
      return convert(myMember.amount, curOf(e))
    }
    const shares = splitEqualShares(e.total_price || 0, e.members || [], e.id)
    const myShare = shares[me] || 0
    return convert(myShare, curOf(e))
  }
  // "Unfinished": a recorded total nobody has paid yet — counts toward the trip
  // total but stays out of settlements until who-paid is filled in.
  const isUnfinished = (e: BudgetItem) => baseTotal(e) > 0 && (e.payers || []).filter(p => p.amount > 0).length === 0

  const totals = useMemo(() => {
    const totalSpend = budgetItems.reduce((a, e) => a + baseTotal(e), 0)
    const myPaid = budgetItems.reduce((a, e) => a + myPaidOf(e), 0)
    const myShare = budgetItems.reduce((a, e) => a + myShareOf(e), 0)
    const owe = (settlement?.flows || []).filter(f => f.from.user_id === me).reduce((a, f) => a + f.amount, 0)
    const owed = (settlement?.flows || []).filter(f => f.to.user_id === me).reduce((a, f) => a + f.amount, 0)
    const outstanding = budgetItems.reduce((a, e) => (isUnfinished(e) ? a + baseTotal(e) : a), 0)
    const outstandingCount = budgetItems.filter(isUnfinished).length
    return { totalSpend, myPaid, myShare, owe, owed, outstanding, outstandingCount }
  }, [budgetItems, settlement, me])

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
  }, [budgetItems, filter, search, catFilter, dayFilter, me])

  // Settlements ("payments") shown inline in the ledger. They have no name, so a
  // text search hides them; they're excluded from the "owed" expense filter and,
  // under "mine", only show transfers I'm part of.
  const filteredSettlements = useMemo(() => {
    // Payments carry no name or category, so a text/category filter hides them.
    if (search.trim() || catFilter) return []
    if (filter === 'owed') return []
    let list = settlement?.settlements || []
    if (filter === 'mine') list = list.filter(s => s.from_user_id === me || s.to_user_id === me)
    if (dayFilter) list = list.filter(s => (s.created_at || '').slice(0, 10) === dayFilter)
    return list
  }, [settlement, filter, search, catFilter, dayFilter, me])

  const dayGroups = useMemo(() => {
    const entries: LedgerEntry[] = [
      ...filtered.map(e => ({ kind: 'expense' as const, date: e.expense_date || '', e })),
      ...filteredSettlements.map(s => ({ kind: 'payment' as const, date: (s.created_at || '').slice(0, 10), s })),
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
      await budgetApi.createSettlement(tripId, { from_user_id: fromId, to_user_id: toId, amount, currency: base })
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
      for (const f of flows) await budgetApi.createSettlement(tripId, { from_user_id: f.from.user_id, to_user_id: f.to.user_id, amount: f.amount, currency: base })
      loadSettlement()
    } catch { toast.error(t('common.unknownError')) }
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

  // CSV export of all expenses — the wiki-documented export that got lost in the
  // Costs rework (#1500). One row per expense, oldest first.
  const handleExportCsv = () => {
    const sep = ';'
    const esc = (v: unknown) => { const s = String(v ?? ''); return s.includes(sep) || s.includes('"') || s.includes('\n') ? '"' + s.replace(/"/g, '""') + '"' : s }
    const fmtDate = (iso: string) => { if (!iso) return ''; try { return new Date(iso + 'T00:00:00Z').toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }) } catch { return iso } }

    const header = ['Date', 'Name', 'Category', 'Amount', 'Currency', 'Amount (' + base + ')', 'Note']
    const rows = [header.join(sep)]
    const items = budgetItems.slice().sort((a, b) => (a.expense_date || '').localeCompare(b.expense_date || ''))
    for (const e of items) {
      const cur = curOf(e)
      // Ticket notes carry the itemized-receipt JSON, not a human note.
      const note = e.note && !e.note.startsWith('TICKETJSON:') ? e.note : ''
      rows.push([
        esc(fmtDate(e.expense_date || '')), esc(e.name), esc(t(catMeta(e.category).labelKey)),
        (e.total_price || 0).toFixed(currencyDecimals(cur)), cur,
        baseTotal(e).toFixed(currencyDecimals(base)),
        esc(note),
      ].join(sep))
    }

    const bom = '﻿'
    const blob = new Blob([bom + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const safeName = (trip?.title || 'trip').replace(/[^a-zA-Z0-9À-ɏ _-]/g, '').trim()
    a.download = `costs-${safeName}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── small presentational helpers ────────────────────────────────────────
  const Avatar = ({ id, size = 24 }: { id: number; size?: number }) => {
    const url = personById(id)?.avatar_url
    if (url) return <img src={url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, display: 'block' }} />
    return <span style={{ width: size, height: size, borderRadius: '50%', background: colorFor(id), color: '#fff', display: 'grid', placeItems: 'center', fontSize: size * 0.4, fontWeight: 700, flexShrink: 0 }}>{initial(id)}</span>
  }

  const cardCls = 'bg-surface-card border border-edge'
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
  const filterControls = (
    <>
      <CustomSelect value={catFilter} onChange={v => setCatFilter(String(v))} options={categoryOptions} size="sm" style={{ minWidth: 148 }} />
      <CustomSelect value={dayFilter} onChange={v => setDayFilter(String(v))} options={dayOptions} size="sm" searchable style={{ minWidth: 140 }} />
    </>
  )

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
    <div className="costs-root" style={{ minHeight: '100%', background: 'var(--c-bg)', padding: isMobile ? '6px 14px 28px' : '40px 24px 48px' }}>
     {isMobile ? <MobileBody /> : (
     <div style={{ maxWidth: '100%', margin: '0 auto' }}>
      {/* ── Header bar ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 28, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {dateMeta && (
            <span className="bg-surface-card border border-edge text-content-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500, whiteSpace: 'nowrap' }}>
              {dateMeta.range} · <b className="text-content">{t('costs.daysCount', { count: dateMeta.days })}</b>
            </span>
          )}
          <span className="bg-surface-card border border-edge text-content-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px 8px 10px', borderRadius: 999, fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500 }}>
            <span style={{ display: 'inline-flex' }}>
              {people.slice(0, 4).map((p, i) => {
                const common = { width: 22, height: 22, borderRadius: '50%', border: '2px solid var(--bg-card)', marginLeft: i ? -8 : 0, flexShrink: 0 } as const
                return p.avatar_url
                  ? <img key={p.id} src={p.avatar_url} alt="" style={{ ...common, objectFit: 'cover', display: 'block' }} />
                  : <span key={p.id} style={{ ...common, background: colorFor(p.id), color: '#fff', display: 'grid', placeItems: 'center', fontSize: 'calc(9px * var(--fs-scale-caption, 1))', fontWeight: 700 }}>{(p.id === me ? t('costs.youShort') : p.username.charAt(0)).toUpperCase()}</span>
              })}
            </span>
            <b className="text-content">{t('costs.travelers', { count: people.length })}</b>
          </span>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={settleAll} disabled={!(settlement?.flows || []).length}
              className="bg-surface-card border border-edge text-content disabled:opacity-40"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 12, fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Check size={16} /> {t('costs.settleUp')}
            </button>
            <button onClick={() => { setEditing(null); setModalOpen(true) }}
              className="bg-[var(--text-primary)] text-[var(--bg-primary)]"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 12, fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 600, border: 0, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Plus size={16} /> {t('costs.addExpense')}
            </button>
          </div>
        )}
      </div>

      {/* ── Summary cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 36 }} className="costs-summary">
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
          foot={<span style={{ display: 'flex', gap: 16 }}><span>{t('costs.yourShare')} · <b>{fmt0(totals.myShare)}</b></span><span>{t('costs.youPaid')} · <b>{fmt0(totals.myPaid)}</b></span></span>} />
      </div>

      {/* ── Main grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }} className="costs-grid">
        {/* expenses */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
            <h3 className="text-content" style={{ fontSize: 'calc(24px * var(--fs-scale-title, 1))', fontWeight: 600, letterSpacing: '-0.025em', margin: 0 }}>
              {t('costs.expenses')}
            </h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="bg-surface-input border border-edge" style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10, padding: '0 10px', height: 34 }}>
                <Search size={15} className="text-content-faint" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('costs.searchPlaceholder')}
                  className="text-content" style={{ border: 0, background: 'none', outline: 'none', fontSize: 'calc(13px * var(--fs-scale-body, 1))', width: 150, fontFamily: 'inherit' }} />
              </div>
              {filterControls}
              <div className="bg-surface-secondary" style={{ display: 'flex', borderRadius: 9, padding: 3 }}>
                {(['all', 'mine', 'owed'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={filter === f ? 'bg-surface-card text-content' : 'text-content-muted'}
                    style={{ padding: '6px 11px', fontSize: 'calc(12px * var(--fs-scale-body, 1))', borderRadius: 7, fontWeight: 500, border: 0, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {t('costs.filter.' + f)}
                  </button>
                ))}
              </div>
              <button onClick={handleExportCsv} title={t('budget.exportCsv')} disabled={!budgetItems.length}
                className="bg-surface-input border border-edge text-content-muted disabled:opacity-40"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                <Download size={15} />
              </button>
            </div>
          </div>

          {dayBanner}
          {dayGroups.length === 0 ? (
            <div className="text-content-faint" style={{ textAlign: 'center', padding: '60px 20px' }}>
              {search ? t('costs.noMatch') : t('costs.emptyText')}
            </div>
          ) : dayGroups.map(g => {
            const dtot = g.entries.reduce((a, en) => en.kind === 'expense' ? a + baseTotal(en.e) : a, 0)
            return (
              <div key={g.day} style={{ marginBottom: 22 }}>
                {!dayFilter && (
                <div className={labelCls} style={{ display: 'flex', alignItems: 'center', margin: '0 0 10px 4px' }}>
                  {g.day}<span className="text-content-muted" style={{ marginLeft: 'auto', textTransform: 'none', letterSpacing: 0, fontWeight: 500, fontSize: 'calc(12px * var(--fs-scale-body, 1))' }}>{t('costs.spent', { amount: fmt(dtot) })}</span>
                </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {g.entries.map(en => en.kind === 'expense'
                    ? <ExpenseRow key={'e' + en.e.id} e={en.e} />
                    : <SettlementRow key={'s' + en.s.id} s={en.s} />)}
                </div>
              </div>
            )
          })}
        </div>

        {/* sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* settle up */}
          <div className={cardCls} style={{ borderRadius: 22, padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div className={labelCls}>{t('costs.settleUp')} · <span className="text-content">{(settlement?.flows || []).length}</span></div>
              {canEdit && (
                <button onClick={() => setAddingPayment(true)}
                  className="text-content-muted bg-surface-secondary border border-edge"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 9px', borderRadius: 8, fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <Plus size={13} /> {t('costs.addPayment')}
                </button>
              )}
            </div>
            <SettleFlows />
          </div>

          {/* balances */}
          <div className={cardCls} style={{ borderRadius: 22, padding: '22px 24px' }}>
            <div className={labelCls} style={{ marginBottom: 14 }}>{t('costs.balances')}</div>
            <BalancesList balances={settlement?.balances || []} />
          </div>

          {/* by category */}
          <div className={cardCls} style={{ borderRadius: 22, padding: '22px 24px' }}>
            <div className={labelCls} style={{ marginBottom: 14 }}>{t('costs.byCategory')}</div>
            <CategoryBreakdown />
          </div>
        </div>
      </div>
      </div>)}

      {modalOpen && (
        <ExpenseModal tripId={tripId} base={base} people={people} me={me} editing={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); loadBudgetItems(tripId); loadSettlement() }} />
      )}

      {(editingSettlement || addingPayment) && (
        <SettlementModal tripId={tripId} people={people} me={me} editing={editingSettlement} currency={base}
          onClose={() => { setEditingSettlement(null); setAddingPayment(false) }}
          onSaved={() => { setEditingSettlement(null); setAddingPayment(false); loadSettlement() }} />
      )}

      <style>{`
        .costs-root {
          --c-bg: #f8fafc; --c-bg2: oklch(0.965 0.01 70);
          --c-surface: #ffffff; --c-surface2: oklch(0.985 0.006 78);
          --c-ink: oklch(0.22 0.012 65); --c-ink2: oklch(0.42 0.012 65); --c-ink3: oklch(0.62 0.01 65);
          --c-line: oklch(0.92 0.008 70);
        }
        html.dark .costs-root {
          --c-bg: #121215; --c-bg2: #18181c;
          --c-surface: #1a1a1e; --c-surface2: #202027;
          --c-ink: #f4f4f5; --c-ink2: #a1a1aa; --c-ink3: #71717a;
          --c-line: #2a2a31;
        }
        .costs-root .bg-surface-card { background: var(--c-surface) !important; }
        .costs-root .bg-surface-secondary, .costs-root .bg-surface-input { background: var(--c-surface2) !important; }
        .costs-root .border-edge { border-color: var(--c-line) !important; }
        /* dark = neutral zinc + a touch of liquid glass, matching the dashboard */
        html.dark .costs-root .bg-surface-card {
          background: rgba(255,255,255,0.035) !important;
          border-color: rgba(255,255,255,0.08) !important;
          backdrop-filter: blur(20px) saturate(1.4);
          -webkit-backdrop-filter: blur(20px) saturate(1.4);
        }
        html.dark .costs-root .bg-surface-secondary,
        html.dark .costs-root .bg-surface-input { background: rgba(255,255,255,0.05) !important; }
        html.dark .costs-root .border-edge { border-color: rgba(255,255,255,0.08) !important; }
        .costs-root .text-content { color: var(--c-ink) !important; }
        .costs-root .text-content-muted { color: var(--c-ink2) !important; }
        .costs-root .text-content-faint { color: var(--c-ink3) !important; }
        .costs-root .exp-actions { opacity: 1; }
        @media (max-width: 1100px) {
          .costs-root .costs-summary { grid-template-columns: 1fr 1fr !important; }
          .costs-root .costs-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .costs-root .costs-summary { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )

  // ── shared settle-flow list ──────────────────────────────────────────────
  function SettleFlows() {
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }} title={`${personName(f.from.user_id)} → ${f.to.user_id === me ? t('costs.youLower') : personName(f.to.user_id)}`}>
              <Avatar id={f.from.user_id} size={32} /><ArrowRight size={15} className="text-content-faint" /><Avatar id={f.to.user_id} size={32} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span className="text-content" style={{ fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 700 }}>{fmt(f.amount)}</span>
              {canEdit && <button onClick={() => settleFlow(f.from.user_id, f.to.user_id, f.amount)} className="bg-[var(--text-primary)] text-[var(--bg-primary)]" style={{ padding: '7px 12px', borderRadius: 9, fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, border: 0, cursor: 'pointer', fontFamily: 'inherit' }}>{t('costs.settle')}</button>}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── mobile layout (Budget1Mobile.html): single flat column, total card on top ──
  function MobileBody() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
        {/* Total card */}
        <section style={{ background: 'linear-gradient(135deg,#1f2937,#111827)', color: '#fff', borderRadius: 22, padding: '20px 20px 16px', boxShadow: '0 8px 24px -8px rgba(0,0,0,0.28)' }}>
          <div style={{ fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{t('costs.totalSpend')}</div>
          <div style={{ fontSize: 'calc(44px * var(--fs-scale-title, 1))', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, marginTop: 8, display: 'flex', alignItems: 'baseline' }}>{bigMoney(totals.totalSpend, 24, 'rgba(255,255,255,0.6)')}</div>
          <div style={{ display: 'flex', gap: 18, marginTop: 12, fontSize: 'calc(12px * var(--fs-scale-body, 1))', color: 'rgba(255,255,255,0.6)', flexWrap: 'wrap' }}>
            <span>{t('costs.yourShare')} · <b style={{ color: '#fff', fontWeight: 600 }}>{fmt0(totals.myShare)}</b></span>
            <span>{t('costs.youPaid')} · <b style={{ color: '#fff', fontWeight: 600 }}>{fmt0(totals.myPaid)}</b></span>
          </div>
          {canEdit && (
            <button onClick={() => { setEditing(null); setModalOpen(true) }} style={{ marginTop: 16, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.16)', color: '#fff', padding: 13, borderRadius: 14, fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Plus size={17} /> {t('costs.addExpense')}
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
              <button onClick={() => setAddingPayment(true)} className="text-content-muted bg-surface-card border border-edge" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 9, fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}><Plus size={13} /> {t('costs.addPayment')}</button>
            )}
          </div>
          <SettleFlows />
        </div>

        {/* Expenses */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div className="text-content" style={{ fontSize: 'calc(19px * var(--fs-scale-subtitle, 1))', fontWeight: 700, letterSpacing: '-0.02em' }}>{t('costs.expenses')}</div>
            <button onClick={handleExportCsv} title={t('budget.exportCsv')} disabled={!budgetItems.length}
              className="bg-surface-card border border-edge text-content-muted disabled:opacity-40"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
              <Download size={15} />
            </button>
          </div>
          <div className="bg-surface-card border border-edge" style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, padding: '0 12px', height: 42 }}>
            <Search size={16} className="text-content-faint" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('costs.searchPlaceholder')} className="text-content" style={{ border: 0, background: 'none', outline: 'none', fontSize: 'calc(14px * var(--fs-scale-body, 1))', width: '100%', fontFamily: 'inherit' }} />
          </div>
          <div className="bg-surface-secondary" style={{ display: 'flex', borderRadius: 11, padding: 3, gap: 2 }}>
            {(['all', 'mine', 'owed'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={filter === f ? 'bg-surface-card text-content' : 'text-content-muted'} style={{ flex: 1, padding: '8px 6px', fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', fontWeight: 500, borderRadius: 8, border: 0, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>{t('costs.filter.' + f)}</button>
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
                      ? <ExpenseRow key={'e' + en.e.id} e={en.e} />
                      : <SettlementRow key={'s' + en.s.id} s={en.s} />)}</div>
                  </div>
                )
              })}
        </div>

        {/* Balances */}
        <div className={cardCls} style={{ borderRadius: 18, padding: 16 }}>
          <div className={labelCls} style={{ marginBottom: 14 }}>{t('costs.balances')}</div>
          <BalancesList balances={settlement?.balances || []} />
        </div>

        {/* By category */}
        <div className={cardCls} style={{ borderRadius: 18, padding: 16 }}>
          <div className={labelCls} style={{ marginBottom: 14 }}>{t('costs.byCategory')}</div>
          <CategoryBreakdown />
        </div>
      </div>
    )
  }

  // ── inline subcomponents (close over helpers) ────────────────────────────
  function ExpenseRow({ e }: { e: BudgetItem }) {
    const c = catMeta(e.category)
    const Icon = c.Icon
    const cur = curOf(e)
    const payers = (e.payers || []).filter(p => p.amount > 0)
    const net = round2(myPaidOf(e) - myShareOf(e))
    const unfinished = isUnfinished(e)
    return (
      <div className="bg-surface-card border border-edge exp-row" style={{ display: 'grid', gridTemplateColumns: '46px 1fr auto', gap: 16, alignItems: 'center', borderRadius: 18, padding: '16px 20px' }}>
        <span style={{ position: 'relative', width: 46, height: 46, borderRadius: 13, display: 'grid', placeItems: 'center', background: c.color + '22', color: c.color }}>
          <Icon size={21} />
          {isMobile && unfinished && (
            <span title={t('costs.unfinishedHint')} style={{ position: 'absolute', bottom: -4, right: -4, width: 20, height: 20, borderRadius: '50%', background: '#d97706', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 800, lineHeight: 1, border: '2px solid var(--bg-card)' }}>!</span>
          )}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <span className="text-content" style={{ fontSize: 'calc(15px * var(--fs-scale-subtitle, 1))', fontWeight: 600 }}>{e.name}</span>
            {unfinished && !isMobile && (
              <span title={t('costs.unfinishedHint')} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px 2px 6px', borderRadius: 999, background: 'rgba(217,119,6,0.14)', color: '#d97706', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 700, flexShrink: 0 }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#d97706', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 800 }}>!</span>
                {t('costs.unfinished')}
              </span>
            )}
          </div>
          {payers.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 5 }}>
              {payers.map(p => (
                <span key={p.user_id} className="bg-surface-secondary border border-edge" title={personName(p.user_id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px 3px 3px', borderRadius: 999, fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))' }}>
                  <Avatar id={p.user_id} size={18} />
                  <span className="text-content" style={{ fontWeight: 700 }}>{fmt(convert(p.amount, cur))}</span>
                </span>
              ))}
            </div>
          )}
          {!isMobile && (
            <div className="text-content-faint" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t(c.labelKey)}{cur !== base ? ` · ${fmt(e.total_price, cur)} → ${fmt(baseTotal(e))}` : ''}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, alignSelf: 'center' }}>
          <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
            <div className="text-content" style={{ fontSize: 'calc(18px * var(--fs-scale-subtitle, 1))', fontWeight: 600 }}>{fmt(baseTotal(e))}</div>
            {!isUnfinished && (e.members || []).length > 0 && Math.abs(net) > 0.01 && (
              <div style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', marginTop: 2, fontWeight: 500, whiteSpace: 'nowrap', color: net > 0 ? '#16a34a' : '#dc2626' }}>
                {net > 0 ? t('costs.youLent', { amount: fmt(net) }) : t('costs.youBorrowed', { amount: fmt(-net) })}
              </div>
            )}
          </div>
          {canEdit && (
            <div className="exp-actions" style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
              <button title={t('common.edit')} onClick={() => { setEditing(e); setModalOpen(true) }} className="bg-surface-secondary border border-edge text-content-muted" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 999, cursor: 'pointer' }}><Pencil size={13} /></button>
              <button title={t('common.delete')} onClick={() => handleDelete(e.id)} className="bg-surface-secondary border border-edge" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 999, cursor: 'pointer', color: '#dc2626' }}><Trash2 size={13} /></button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // A settle-up payment as a ledger row — visually distinct from an expense, with
  // inline edit + undo (reuses deleteSettlement) so it isn't buried in a modal.
  function SettlementRow({ s }: { s: Settlement }) {
    // Legacy transfers carry no currency and were entered in the display base.
    const cur = (s.currency || base).toUpperCase()
    return (
      <div className="bg-surface-card border border-edge exp-row" style={{ display: 'grid', gridTemplateColumns: '46px 1fr auto', gap: 16, alignItems: 'center', borderRadius: 18, padding: '16px 20px' }}>
        <span style={{ width: 46, height: 46, borderRadius: 13, display: 'grid', placeItems: 'center', background: 'rgba(22,163,74,0.12)', color: '#16a34a' }}><ArrowLeftRight size={21} /></span>
        <div style={{ minWidth: 0 }}>
          <div className="text-content" style={{ fontSize: 'calc(15px * var(--fs-scale-subtitle, 1))', fontWeight: 600, marginBottom: 6 }}>
            {t('costs.payment')}
            {cur !== base && <span className="text-content-faint" style={{ fontWeight: 400, fontSize: 'calc(12px * var(--fs-scale-body, 1))' }}> · {fmt(s.amount, cur)} → {fmt(convert(s.amount, cur))}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }} title={`${personName(s.from_user_id)} → ${personName(s.to_user_id)}`}>
            <Avatar id={s.from_user_id} size={20} /><ArrowRight size={13} className="text-content-faint" /><Avatar id={s.to_user_id} size={20} />
            <span className="text-content-faint" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{personName(s.from_user_id)} → {personName(s.to_user_id)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, alignSelf: 'center' }}>
          <div className="text-content" style={{ fontSize: 'calc(18px * var(--fs-scale-subtitle, 1))', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmt(convert(s.amount, cur))}</div>
          {canEdit && (
            <div className="exp-actions" style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
              <button title={t('common.edit')} onClick={() => setEditingSettlement(s)} className="bg-surface-secondary border border-edge text-content-muted" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 999, cursor: 'pointer' }}><Pencil size={13} /></button>
              <button title={t('costs.undo')} onClick={() => undoSettlement(s.id)} className="bg-surface-secondary border border-edge" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 999, cursor: 'pointer', color: '#dc2626' }}><RotateCcw size={13} /></button>
            </div>
          )}
        </div>
      </div>
    )
  }

  function BalancesList({ balances }: { balances: SettlementData['balances'] }) {
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

  function CategoryBreakdown() {
    const tot: Record<string, number> = {}
    for (const e of budgetItems) { const k = catMeta(e.category).key; tot[k] = (tot[k] || 0) + baseTotal(e) }
    const rows = COST_CATEGORY_LIST.filter(c => (tot[c.key] || 0) > 0).sort((a, b) => (tot[b.key] || 0) - (tot[a.key] || 0))
    if (rows.length === 0) return <div className="text-content-faint" style={{ fontSize: 'calc(12.5px * var(--fs-scale-body, 1))' }}>{t('costs.noCategories')}</div>
    // Bars are scaled relative to the most expensive category (the top row fills the
    // bar), not to the trip grand total — makes the relative ranking readable.
    const maxCat = Math.max(0, ...rows.map(c => tot[c.key] || 0))
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map(c => {
          const v = tot[c.key]; const pct = maxCat ? v / maxCat * 100 : 0
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
function SummaryCard({ label, sub, amount, currency, locale, icon, foot, tone }: { label: string; sub: string; amount: number; currency: string; locale: string; icon: React.ReactNode; foot: React.ReactNode; tone: 'owe' | 'owed' | 'total' | 'unfinished' }) {
  const total = tone === 'total'
  const accent = tone === 'owe' ? '#dc2626' : tone === 'owed' ? '#16a34a' : tone === 'unfinished' ? '#d97706' : undefined
  const muted = total ? 'rgba(255,255,255,0.55)' : 'var(--text-faint)'
  // formatToParts keeps the design's "big integer + muted symbol/decimals" styling
  // while letting Intl place the symbol and pick separators per locale + currency.
  let parts: Intl.NumberFormatPart[] | null = null
  try {
    const d = currencyDecimals(currency)
    parts = new Intl.NumberFormat(currencyLocale(currency), { style: 'currency', currency: (currency || 'EUR').toUpperCase(), minimumFractionDigits: d, maximumFractionDigits: d }).formatToParts(amount || 0)
  } catch { parts = null }
  const big = (p: Intl.NumberFormatPart) => p.type === 'integer' || p.type === 'group' || p.type === 'minusSign'
  return (
    <div className={total ? '' : 'bg-surface-card border border-edge'}
      style={{ borderRadius: 22, padding: '26px 28px', position: 'relative', overflow: 'hidden', ...(total ? { background: 'linear-gradient(135deg,#1f2937,#111827)', color: '#fff' } : {}) }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <span style={{ width: 36, height: 36, borderRadius: 11, display: 'grid', placeItems: 'center', background: total ? 'rgba(255,255,255,0.12)' : (accent + '22'), color: total ? '#fff' : accent }}>{icon}</span>
        <div>
          <div style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600 }} className={total ? '' : 'text-content'}>{label}</div>
          <div style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', opacity: total ? 0.6 : 1 }} className={total ? '' : 'text-content-faint'}>{sub}</div>
        </div>
      </div>
      <div style={{ fontSize: 'calc(46px * var(--fs-scale-title, 1))', fontWeight: 600, letterSpacing: '-0.035em', lineHeight: 1, marginTop: 20, display: 'flex', alignItems: 'baseline', color: total ? '#fff' : accent }}>
        {parts
          ? parts.map((p, i) => <span key={i} style={big(p) ? undefined : { fontSize: 'calc(26px * var(--fs-scale-title, 1))', fontWeight: 500, color: muted }}>{p.value}</span>)
          : <span>{formatMoney(amount, currency, locale)}</span>}
      </div>
      <div style={{ marginTop: 16, fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', opacity: total ? 0.85 : 1 }}>{foot}</div>
    </div>
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
function SettlementModal({ tripId, people, me, editing, currency, onClose, onSaved }: {
  tripId: number; people: TripMember[]; me: number; editing: Settlement | null; currency: string; onClose: () => void; onSaved: () => void
}) {
  const { t } = useTranslation()
  const toast = useToast()
  const otherDefault = people.find(p => p.id !== me)?.id ?? me
  const [fromId, setFromId] = useState<string>(String(editing?.from_user_id ?? me))
  const [toId, setToId] = useState<string>(String(editing?.to_user_id ?? otherDefault))
  const [amount, setAmount] = useState<string>(editing ? String(editing.amount) : '')
  const [cur, setCur] = useState<string>((editing?.currency || currency).toUpperCase())
  const [saving, setSaving] = useState(false)

  const amt = parseFloat(amount) || 0
  const valid = amt > 0 && fromId !== toId
  const opts = people.map(p => ({ value: String(p.id), label: p.id === me ? t('costs.you') : p.username }))

  const save = async () => {
    if (!valid) return
    setSaving(true)
    const data = { from_user_id: Number(fromId), to_user_id: Number(toId), amount: amt, currency: cur }
    try {
      if (editing) await budgetApi.updateSettlement(tripId, editing.id, data)
      else await budgetApi.createSettlement(tripId, data)
      onSaved()
    } catch { toast.error(t('common.unknownError')) } finally { setSaving(false) }
  }

  const labelCls = 'block text-[11px] font-semibold uppercase tracking-[0.08em] text-content-faint mb-[6px]'

  return (
    <Modal isOpen onClose={onClose} title={editing ? t('costs.editPayment') : t('costs.addPayment')} size="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} className="text-content-muted border border-edge" style={{ padding: '8px 16px', borderRadius: 10, background: 'none', fontSize: 'calc(13px * var(--fs-scale-body, 1))', cursor: 'pointer', fontFamily: 'inherit' }}>{t('common.cancel')}</button>
          <button onClick={save} disabled={!valid || saving} className="bg-[var(--text-primary)] text-[var(--bg-primary)]" style={{ padding: '8px 20px', borderRadius: 10, border: 0, fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: !valid || saving ? 0.5 : 1 }}>{editing ? t('common.save') : t('costs.addPayment')}</button>
        </div>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className={labelCls}>{t('costs.from')}</label>
          <CustomSelect value={fromId} onChange={v => setFromId(String(v))} options={opts} style={{ width: '100%' }} />
        </div>
        <div>
          <label className={labelCls}>{t('costs.to')}</label>
          <CustomSelect value={toId} onChange={v => setToId(String(v))} options={opts} style={{ width: '100%' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <label className={labelCls}>{t('costs.amount')}</label>
            <div className="bg-surface-input border border-edge" style={{ height: FIELD_H, boxSizing: 'border-box', display: 'flex', alignItems: 'center', borderRadius: 10, padding: '0 12px' }}>
              <span className="text-content-faint" style={{ fontSize: 'calc(14px * var(--fs-scale-body, 1))' }}>{SYMBOLS[cur] || (cur + ' ')}</span>
              <input type="text" inputMode="decimal" placeholder="0.00" value={amount}
                onChange={e => setAmount(e.target.value.replace(',', '.'))}
                className="text-content" style={{ flex: 1, border: 0, background: 'none', outline: 'none', fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 600, paddingLeft: 6, width: '100%' }} />
            </div>
          </div>
          <div style={{ minWidth: 0 }}>
            <label className={labelCls}>{t('costs.currency')}</label>
            <CustomSelect value={cur} onChange={v => setCur(String(v))} searchable
              options={currenciesWith(cur).map(c => ({ value: c, label: SYMBOLS[c] ? `${c}  ${SYMBOLS[c]}` : c }))}
              style={{ width: '100%' }} />
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ── Add / edit expense modal ───────────────────────────────────────────────
export interface ExpensePrefill {
  name?: string
  category?: string
  amount?: number
  reservationId?: number
}

export function ExpenseModal({ tripId, base, people, me, editing, prefill, onClose, onSaved }: {
  tripId: number; base: string; people: TripMember[]; me: number; editing: BudgetItem | null; prefill?: ExpensePrefill; onClose: () => void; onSaved: () => void
}) {
  const { t, locale } = useTranslation()
  const toast = useToast()
  const { addBudgetItem, updateBudgetItem } = useTripStore()
  const { convert } = useExchangeRates(base)
  const sym = (c: string) => SYMBOLS[c] || (c + ' ')

  const [name, setName] = useState(editing?.name || prefill?.name || '')
  const [cat, setCat] = useState<string>(editing ? catMeta(editing.category).key : (prefill?.category || 'food'))
  const [currency, setCurrency] = useState((editing?.currency || base).toUpperCase())
  const [day, setDay] = useState(editing?.expense_date || new Date().toISOString().slice(0, 10))
  const [total, setTotal] = useState<string>(() => {
    if (editing) return editing.total_price ? String(editing.total_price) : ''
    if (prefill?.amount != null) return String(prefill.amount)
    return ''
  })
  const [participants, setParticipants] = useState<Set<number>>(() =>
    editing ? new Set((editing.members || []).map(m => m.user_id)) : new Set(people.map(p => p.id)))

  // Payer state. An expense can be fronted by several people, each with their own
  // amount (budget_item_payers) — a shared card, or "I got this round, you get the
  // next". The single-payer dropdown stays the default path; multiPayer swaps in a
  // per-person amount editor. 0 represents "Nobody (planning entry)"; on an
  // existing expense a missing payer is a deliberate choice, so only a brand-new
  // one defaults to me.
  const initialPayers = (editing?.payers || []).filter(p => p.amount > 0)

  const [payerId, setPayerId] = useState<number>(() => {
    const existingPayer = initialPayers[0]
    if (existingPayer) return existingPayer.user_id
    return editing ? 0 : me
  })
  const [multiPayer, setMultiPayer] = useState(() => initialPayers.length > 1)
  const [payerIds, setPayerIds] = useState<Set<number>>(() => new Set(initialPayers.map(p => p.user_id)))
  const [payerAmounts, setPayerAmounts] = useState<Record<number, string>>(() => {
    const m: Record<number, string> = {}
    for (const p of initialPayers) m[p.user_id] = String(p.amount)
    return m
  })
  // Payers the user typed an amount for: rebalance leaves these alone and makes
  // the others absorb the remainder.
  const [pinnedPayers, setPinnedPayers] = useState<Set<number>>(() => new Set(initialPayers.map(p => p.user_id)))

  const [splitMode, setSplitMode] = useState<'equally' | 'custom' | 'ticket'>(() => {
    if (editing?.note && editing.note.startsWith('TICKETJSON:')) {
      return 'ticket'
    }
    if (editing && editing.members && editing.members.length > 0) {
      const hasCustom = editing.members.some(m => m.amount !== null && m.amount !== undefined)
      return hasCustom ? 'custom' : 'equally'
    }
    return 'equally'
  })

  const [ticketItems, setTicketItems] = useState<TicketItem[]>(() => {
    if (editing?.note && editing.note.startsWith('TICKETJSON:')) {
      try {
        const parsed = JSON.parse(editing.note.slice(11))
        return (parsed.items || []).map((item: any) => ({
          id: String(Math.random()),
          name: item.name,
          price: String(item.price),
          participants: new Set(item.parts || [])
        }))
      } catch {
        return []
      }
    }
    return []
  })

  const [customAmounts, setCustomAmounts] = useState<Record<number, string>>(() => {
    const m: Record<number, string> = {}
    if (editing && editing.members) {
      for (const member of editing.members) {
        if (member.amount !== null && member.amount !== undefined) {
          m[member.user_id] = String(member.amount)
        }
      }
    }
    return m
  })

  const [saving, setSaving] = useState(false)

  const isTicketMode = splitMode === 'ticket'

  const ticketInfo = useMemo(() => {
    return calculateTicketShares(ticketItems)
  }, [ticketItems])

  const totalNum = isTicketMode ? ticketInfo.total : (parseFloat(total) || 0)
  const splitSum = [...participants].reduce((sum, id) => sum + (parseFloat(customAmounts[id]) || 0), 0)
  const customBalanced = Math.round(splitSum * 100) === Math.round(totalNum * 100)
  const each = participants.size > 0 ? totalNum / participants.size : 0
  const equalShares = useMemo(() => {
    return splitEqualShares(totalNum, [...participants].map(id => ({ user_id: id })), editing?.id || 0)
  }, [totalNum, participants, editing])

  const placeholderShares = useMemo(() => {
    const emptyParts = [...participants].filter(id => !customAmounts[id])
    if (emptyParts.length === 0) return {}

    const enteredSum = [...participants]
      .filter(id => customAmounts[id])
      .reduce((sum, id) => sum + (parseFloat(customAmounts[id]) || 0), 0)
    const remaining = Math.max(0, totalNum - enteredSum)

    return splitEqualShares(remaining, emptyParts.map(id => ({ user_id: id })), editing?.id || 0)
  }, [totalNum, participants, customAmounts, editing])
  
  const ticketValid = ticketItems.length > 0 && ticketItems.every(item => item.name.trim().length > 0 && (parseFloat(item.price) || 0) > 0 && item.participants.size > 0)
  const payersOk = !multiPayer || (payerIds.size > 0 && payersBalanced(payerAmounts, payerIds, totalNum))
  const valid = name.trim().length > 0 && payersOk && (
    isTicketMode
      ? ticketValid
      : totalNum > 0 && (participants.size === 0 || splitMode === 'equally' || customBalanced)
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
    const seed = payerIds.size > 0 ? new Set(payerIds) : new Set<number>([payerId > 0 ? payerId : me])
    const pinned = new Set<number>()
    setPayerIds(seed)
    setPinnedPayers(pinned)
    setPayerAmounts(prev => rebalancePayers(prev, pinned, seed, totalNum))
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
    if (/^\d*\.?\d{0,2}$/.test(val) || val === '') {
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
    if (/^\d*\.?\d{0,2}$/.test(price) || price === '') {
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
    const payerList = multiPayer
      ? [...payerIds]
          .map(id => ({ user_id: id, amount: parseFloat(payerAmounts[id]) || 0 }))
          .filter(p => p.amount > 0)
      : (payerId > 0 && participants.size > 0) ? [{ user_id: payerId, amount: totalNum }] : []
    const memberList = [...participants].map(id => ({
      user_id: id,
      amount: splitMode === 'custom'
        ? (parseFloat(customAmounts[id]) || 0)
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
      member_ids: [...participants],
      expense_date: day || null,
      total_price: totalNum,
      note: splitMode === 'ticket' ? 'TICKETJSON:' + JSON.stringify({
        items: ticketItems.map(item => ({
          name: item.name,
          price: item.price,
          parts: [...item.participants]
        }))
      }) : null,
      ...(!editing && prefill?.reservationId ? { reservation_id: prefill.reservationId } : {}),
    }
    try {
      if (editing) await updateBudgetItem(tripId, editing.id, data)
      else await addBudgetItem(tripId, data)
      onSaved()
    } catch {
      toast.error(t('common.unknownError'))
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full bg-surface-input border border-edge text-content'
  const labelCls = 'block text-[11px] font-semibold uppercase tracking-[0.08em] text-content-faint mb-[6px]'

  return (
    <Modal isOpen onClose={onClose} title={editing ? t('costs.editExpense') : t('costs.addExpense')} size="2xl"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} className="text-content-muted border border-edge" style={{ padding: '8px 16px', borderRadius: 10, background: 'none', fontSize: 'calc(13px * var(--fs-scale-body, 1))', cursor: 'pointer', fontFamily: 'inherit' }}>{t('common.cancel')}</button>
          <button onClick={save} disabled={!valid || saving} className="bg-[var(--text-primary)] text-[var(--bg-primary)]" style={{ padding: '8px 20px', borderRadius: 10, border: 0, fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: !valid || saving ? 0.5 : 1 }}>{editing ? t('common.save') : t('costs.addExpense')}</button>
        </div>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className={labelCls}>{t('costs.whatFor')}</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder={t('costs.namePlaceholder')} className={inputCls} style={{ borderRadius: 10, padding: '11px 13px', fontSize: 'calc(14px * var(--fs-scale-body, 1))', outline: 'none' }} />
        </div>

        <div>
          <label className={labelCls}>{t('costs.totalAmount')}</label>
          <div className="bg-surface-input border border-edge" style={{ height: FIELD_H, boxSizing: 'border-box', display: 'flex', alignItems: 'center', borderRadius: 10, padding: '0 12px', opacity: isTicketMode ? 0.6 : 1 }}>
            <span className="text-content-faint" style={{ fontSize: 'calc(15px * var(--fs-scale-subtitle, 1))' }}>{sym(currency)}</span>
            <NumericInput mode="decimal" placeholder="0.00" value={isTicketMode ? ticketInfo.total.toFixed(2) : total}
              onValueChange={onTotalChange}
              disabled={isTicketMode}
              className="text-content" style={{ flex: 1, border: 0, background: 'none', outline: 'none', fontSize: 'calc(15px * var(--fs-scale-subtitle, 1))', fontWeight: 600, paddingLeft: 6, width: '100%' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <label className={labelCls}>{t('costs.currency')}</label>
            <CustomSelect value={currency} onChange={v => setCurrency(String(v))} searchable
              options={currenciesWith(currency).map(c => ({ value: c, label: SYMBOLS[c] ? `${c}  ${SYMBOLS[c]}` : c }))}
              style={{ width: '100%' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <label className={labelCls}>{t('costs.day')}</label>
            <CustomDatePicker value={day} onChange={setDay} style={{ width: '100%' }} />
          </div>
        </div>

        {currency !== base && totalNum > 0 && (
          <div className="bg-surface-secondary border border-edge text-content-muted" style={{ borderRadius: 10, padding: '10px 12px', fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span>{formatMoney(totalNum, currency, locale)}</span>
            <span className="text-content-faint">≈</span>
            <span className="text-content" style={{ fontWeight: 600 }}>{formatMoney(convert(totalNum, currency), base, locale)}</span>
            <span className="text-content-faint">· {t('costs.liveRate')}</span>
          </div>
        )}

        <div>
          <label className={labelCls}>{t('costs.category')}</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {COST_CATEGORY_LIST.map(c => {
              const Icon = c.Icon; const on = cat === c.key
              return (
                <button key={c.key} onClick={() => setCat(c.key)}
                  className={on ? 'bg-surface-card text-content border' : 'bg-surface-secondary text-content-muted border border-edge'}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px 6px 7px', borderRadius: 999, fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', borderColor: on ? 'var(--text-primary)' : undefined }}>
                  <span style={{ width: 20, height: 20, borderRadius: 6, display: 'grid', placeItems: 'center', background: c.color + '22', color: c.color }}><Icon size={12} /></span>
                  {t(c.labelKey)}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label className={labelCls} style={{ marginBottom: 0 }}>{t('costs.whoPaid')}</label>
            <button type="button" onClick={() => (multiPayer ? disableMultiPayer() : enableMultiPayer())}
              className="text-content-muted"
              style={{ background: 'none', border: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))', fontWeight: 600, textDecoration: 'underline' }}>
              {multiPayer ? t('costs.singlePayer') : t('costs.multiplePayers')}
            </button>
          </div>
          {!multiPayer ? (
            <CustomSelect value={String(payerId)} onChange={v => setPayerId(Number(v))}
              options={[
                { value: '0', label: t('costs.noOnePaid') || 'Nobody (planning entry)' },
                ...people.map(p => ({ value: String(p.id), label: p.id === me ? t('costs.you') : p.username }))
              ]}
              style={{ width: '100%' }} />
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {people.map((p, idx) => {
                  const on = payerIds.has(p.id)
                  return (
                    <div key={p.id} className="bg-surface-secondary border border-edge"
                      style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: 10, alignItems: 'center', padding: '8px 11px', borderRadius: 10, opacity: on ? 1 : 0.5 }}>
                      <button type="button" onClick={() => togglePayer(p.id)} data-testid="payer-toggle"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'none', border: 0, cursor: 'pointer', fontFamily: 'inherit', padding: 0, minWidth: 0, textAlign: 'left' }}>
                        {p.avatar_url
                          ? <img src={p.avatar_url} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', display: 'block', flexShrink: 0, opacity: on ? 1 : 0.45 }} />
                          : <span style={{ width: 22, height: 22, borderRadius: '50%', background: SPLIT_COLORS[idx % SPLIT_COLORS.length].gradient, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0, opacity: on ? 1 : 0.45 }}>
                              {(p.id === me ? t('costs.youShort') : p.username.charAt(0)).toUpperCase()}
                            </span>}
                        <span className="text-content" style={{ fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.id === me ? t('costs.you') : p.username}
                        </span>
                      </button>
                      {on ? (
                        <div className="bg-surface-input border border-edge" style={{ display: 'flex', alignItems: 'center', gap: 4, borderRadius: 8, padding: '0 10px' }}>
                          <span className="text-content-faint" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))' }}>{sym(currency)}</span>
                          <NumericInput mode="decimal" placeholder="0.00" data-testid="payer-amount"
                            value={payerAmounts[p.id] || ''}
                            onValueChange={v => onPayerAmountChange(p.id, v)}
                            className="text-content"
                            style={{ width: '100%', border: 0, background: 'none', outline: 'none', fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 600, padding: '8px 0', textAlign: 'right' }} />
                        </div>
                      ) : (
                        <button type="button" onClick={() => togglePayer(p.id)} className="text-content-faint"
                          style={{ background: 'none', border: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'calc(12px * var(--fs-scale-caption, 1))', textAlign: 'right' }}>
                          {t('costs.tapToInclude')}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
              {!payersOk && (
                <div style={{ marginTop: 8, fontSize: 'calc(12.5px * var(--fs-scale-caption, 1))', color: '#d97706' }}>
                  {t('costs.payersUnbalanced', { amount: formatMoney(totalNum, currency, locale) })}
                </div>
              )}
            </>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <label className={labelCls}>{t('costs.split') || 'Split'}</label>
            <div className="bg-surface-secondary" style={{ display: 'flex', borderRadius: 8, padding: 2 }}>
              <button type="button" onClick={() => setSplitMode('equally')}
                className={splitMode === 'equally' ? 'bg-surface-card text-content' : 'text-content-muted'}
                style={{ padding: '4px 10px', fontSize: 11.5, borderRadius: 6, fontWeight: 600, border: 0, cursor: 'pointer', fontFamily: 'inherit' }}>
                {t('costs.splitEqually') || 'Equally'}
              </button>
              <button type="button" onClick={() => setSplitMode('custom')}
                className={splitMode === 'custom' ? 'bg-surface-card text-content' : 'text-content-muted'}
                style={{ padding: '4px 10px', fontSize: 11.5, borderRadius: 6, fontWeight: 600, border: 0, cursor: 'pointer', fontFamily: 'inherit' }}>
                {t('costs.splitCustom') || 'Custom'}
              </button>
              <button type="button" onClick={() => setSplitMode('ticket')}
                className={splitMode === 'ticket' ? 'bg-surface-card text-content' : 'text-content-muted'}
                style={{ padding: '4px 10px', fontSize: 11.5, borderRadius: 6, fontWeight: 600, border: 0, cursor: 'pointer', fontFamily: 'inherit' }}>
                {t('costs.splitTicket') || 'Ticket'}
              </button>
            </div>
          </div>
          {splitMode === 'ticket' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ticketItems.map((item, itemIdx) => (
                  <div key={item.id} className="bg-surface-secondary border border-edge" style={{ padding: 10, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 130px auto', gap: 8, alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Item name"
                        value={item.name}
                        onChange={e => handleUpdateItemName(item.id, e.target.value)}
                        className="bg-surface-input border border-edge text-content"
                        style={{ minWidth: 0, padding: '6px 10px', borderRadius: 8, fontSize: 13, border: '1px solid var(--border-color)', outline: 'none' }}
                      />
                      <div className="bg-surface-input border border-edge" style={{ display: 'flex', alignItems: 'center', padding: '0 8px', borderRadius: 8 }}>
                        <span className="text-content-faint" style={{ fontSize: 12 }}>{sym(currency)}</span>
                        <NumericInput
                          mode="decimal"
                          placeholder="0.00"
                          value={item.price}
                          onValueChange={v => handleUpdateItemPrice(item.id, v)}
                          className="text-content"
                          style={{ width: '100%', border: 0, background: 'none', outline: 'none', fontSize: 13, fontWeight: 600, textAlign: 'right', padding: '6px 0' }}
                        />
                      </div>
                      <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-content-muted" style={{ background: 'none', border: 0, cursor: 'pointer', padding: 4 }}>
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
                      <span className="text-content-faint" style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', marginRight: 4 }}>Splitting:</span>
                      {people.map((p, pIdx) => {
                        const active = item.participants.has(p.id)
                        return (
                          <button
                            type="button"
                            key={p.id}
                            onClick={() => handleToggleItemParticipant(item.id, p.id)}
                            className={active ? 'bg-surface-card text-content border' : 'bg-surface-secondary text-content-muted border border-edge'}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', border: active ? '1px solid var(--text-primary)' : undefined }}
                          >
                            {p.avatar_url
                              ? <img src={p.avatar_url} alt="" style={{ width: 14, height: 14, borderRadius: '50%', objectFit: 'cover' }} />
                              : <span style={{ width: 14, height: 14, borderRadius: '50%', background: SPLIT_COLORS[pIdx % SPLIT_COLORS.length].gradient, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 7, fontWeight: 700 }}>{(p.id === me ? t('costs.youShort') : p.username.charAt(0)).toUpperCase()}</span>}
                            <span>{p.id === me ? t('costs.you') : p.username}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" onClick={handleAddEmptyItem} className="border border-dashed border-edge text-content-muted" style={{ padding: '8px 12px', borderRadius: 10, background: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Plus size={14} /> Add item
              </button>

              {ticketItems.length > 0 && (
                <div className="bg-surface-secondary border border-edge" style={{ padding: 12, borderRadius: 10 }}>
                  <div className="text-content" style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Individual Shares Summary</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {people.map(p => {
                      const share = ticketInfo.shares[p.id] || 0
                      return (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span className="text-content-muted">{p.id === me ? t('costs.you') : p.username}</span>
                          <span className="text-content" style={{ fontWeight: 600 }}>{sym(currency)}{share.toFixed(2)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {people.map((p, idx) => {
                  const on = participants.has(p.id)
                  return (
                    <div key={p.id} className="bg-surface-secondary border border-edge" style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: 10, alignItems: 'center', padding: '8px 11px', borderRadius: 10, opacity: on ? 1 : 0.5 }}>
                      <button type="button" onClick={() => toggleParticipant(p.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'none', border: 0, cursor: 'pointer', fontFamily: 'inherit', padding: 0, minWidth: 0, textAlign: 'left' }}>
                        {p.avatar_url
                          ? <img src={p.avatar_url} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', display: 'block', flexShrink: 0, opacity: on ? 1 : 0.45 }} />
                          : <span style={{ width: 22, height: 22, borderRadius: '50%', background: SPLIT_COLORS[idx % SPLIT_COLORS.length].gradient, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0, opacity: on ? 1 : 0.45 }}>{(p.id === me ? t('costs.youShort') : p.username.charAt(0)).toUpperCase()}</span>}
                        <span className="text-content" style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.id === me ? t('costs.you') : p.username}</span>
                        {p.is_guest && <GuestBadge size="xs" />}
                      </button>
                      {splitMode === 'equally' ? (
                        on ? (
                          <span className="text-content" style={{ fontSize: 14, fontWeight: 600, textAlign: 'right', paddingRight: 10 }}>
                            {sym(currency)}{(equalShares[p.id] || 0).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-content-faint" style={{ fontSize: 12, textAlign: 'right', paddingRight: 10 }}>Excluded</span>
                        )
                      ) : (
                        on ? (
                          <div className="bg-surface-input border border-edge" style={{ display: 'flex', alignItems: 'center', gap: 4, borderRadius: 8, padding: '0 10px' }}>
                            <span className="text-content-faint" style={{ fontSize: 13 }}>{sym(currency)}</span>
                            <input type="text" inputMode="decimal" placeholder={(placeholderShares[p.id] || 0).toFixed(2)} value={customAmounts[p.id] || ''}
                              onChange={e => handleCustomAmountChange(p.id, e.target.value)}
                              className="text-content" style={{ width: '100%', border: 0, background: 'none', outline: 'none', fontSize: 14, fontWeight: 600, padding: '8px 0', textAlign: 'right' }} />
                          </div>
                        ) : (
                          <button type="button" onClick={() => toggleParticipant(p.id)} className="text-content-faint" style={{ background: 'none', border: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, textAlign: 'right' }}>{t('costs.tapToInclude')}</button>
                        )
                      )}
                    </div>
                  )
                })}
              </div>
              <div style={{ marginTop: 10, fontSize: 12.5, display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                {splitMode === 'equally' ? (
                  <span className="text-content-faint">
                    {participants.size > 0 && t('costs.splitSummary', { count: participants.size, amount: sym(currency) + each.toFixed(2) })}
                  </span>
                ) : (
                  <span style={{ fontWeight: 600, color: customBalanced ? '#16a34a' : '#dc2626' }}>
                    {customBalanced 
                      ? 'Split matches total' 
                      : `Sum of splits: ${sym(currency)}${splitSum.toFixed(2)} of ${sym(currency)}${totalNum.toFixed(2)} (${(totalNum - splitSum) > 0 ? 'under by' : 'over by'} ${sym(currency)}${Math.abs(totalNum - splitSum).toFixed(2)})`}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}
