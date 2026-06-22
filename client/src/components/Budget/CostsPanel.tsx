import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, BarChart3, Plus, Search, ArrowRight, ArrowLeftRight, Check, RotateCcw, Pencil, Trash2 } from 'lucide-react'
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
import { SYMBOLS, CURRENCIES, SPLIT_COLORS } from './BudgetPanel.constants'
import { COST_CATEGORY_LIST, catMeta } from './costsCategories'
import type { BudgetItem } from '../../types'
import type { TripMember } from './BudgetPanelMemberChips'

interface CostsPanelProps {
  tripId: number
  tripMembers?: TripMember[]
}

interface Settlement {
  id: number
  from_user_id: number
  to_user_id: number
  amount: number
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
    const n = (e.members || []).length
    if (!n || !(e.members || []).some(m => m.user_id === me)) return 0
    return baseTotal(e) / n
  }

  const totals = useMemo(() => {
    const totalSpend = budgetItems.reduce((a, e) => a + baseTotal(e), 0)
    const myPaid = budgetItems.reduce((a, e) => a + myPaidOf(e), 0)
    const myShare = budgetItems.reduce((a, e) => a + myShareOf(e), 0)
    const owe = (settlement?.flows || []).filter(f => f.from.user_id === me).reduce((a, f) => a + f.amount, 0)
    const owed = (settlement?.flows || []).filter(f => f.to.user_id === me).reduce((a, f) => a + f.amount, 0)
    return { totalSpend, myPaid, myShare, owe, owed }
  }, [budgetItems, settlement, me])

  // ── filtering + day grouping ────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = budgetItems.slice()
    if (filter === 'mine') list = list.filter(e => myPaidOf(e) > 0)
    if (filter === 'owed') list = list.filter(e => round2(myPaidOf(e) - myShareOf(e)) > 0)
    const q = search.trim().toLowerCase()
    if (q) list = list.filter(e => e.name.toLowerCase().includes(q))
    return list
  }, [budgetItems, filter, search, me])

  // Settlements ("payments") shown inline in the ledger. They have no name, so a
  // text search hides them; they're excluded from the "owed" expense filter and,
  // under "mine", only show transfers I'm part of.
  const filteredSettlements = useMemo(() => {
    if (search.trim()) return []
    if (filter === 'owed') return []
    let list = settlement?.settlements || []
    if (filter === 'mine') list = list.filter(s => s.from_user_id === me || s.to_user_id === me)
    return list
  }, [settlement, filter, search, me])

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

  // ── settle actions ──────────────────────────────────────────────────────
  const settleFlow = async (fromId: number, toId: number, amount: number) => {
    try {
      await budgetApi.createSettlement(tripId, { from_user_id: fromId, to_user_id: toId, amount })
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
      for (const f of flows) await budgetApi.createSettlement(tripId, { from_user_id: f.from.user_id, to_user_id: f.to.user_id, amount: f.amount })
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

  return (
    <div className="costs-root" style={{ minHeight: '100%', background: 'var(--c-bg)', padding: isMobile ? '6px 14px 28px' : '40px 24px 48px' }}>
     {isMobile ? <MobileBody /> : (
     <div style={{ maxWidth: '100%', margin: '0 auto' }}>
      {/* ── Header bar ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 28, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {dateMeta && (
            <span className="bg-surface-card border border-edge text-content-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
              {dateMeta.range} · <b className="text-content">{t('costs.daysCount', { count: dateMeta.days })}</b>
            </span>
          )}
          <span className="bg-surface-card border border-edge text-content-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px 8px 10px', borderRadius: 999, fontSize: 13, fontWeight: 500 }}>
            <span style={{ display: 'inline-flex' }}>
              {people.slice(0, 4).map((p, i) => {
                const common = { width: 22, height: 22, borderRadius: '50%', border: '2px solid var(--bg-card)', marginLeft: i ? -8 : 0, flexShrink: 0 } as const
                return p.avatar_url
                  ? <img key={p.id} src={p.avatar_url} alt="" style={{ ...common, objectFit: 'cover', display: 'block' }} />
                  : <span key={p.id} style={{ ...common, background: colorFor(p.id), color: '#fff', display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 700 }}>{(p.id === me ? t('costs.youShort') : p.username.charAt(0)).toUpperCase()}</span>
              })}
            </span>
            <b className="text-content">{t('costs.travelers', { count: people.length })}</b>
          </span>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={settleAll} disabled={!(settlement?.flows || []).length}
              className="bg-surface-card border border-edge text-content disabled:opacity-40"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Check size={16} /> {t('costs.settleUp')}
            </button>
            <button onClick={() => { setEditing(null); setModalOpen(true) }}
              className="bg-[var(--text-primary)] text-[var(--bg-primary)]"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 12, fontSize: 14, fontWeight: 600, border: 0, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Plus size={16} /> {t('costs.addExpense')}
            </button>
          </div>
        )}
      </div>

      {/* ── Summary cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.15fr', gap: 16, marginBottom: 36 }} className="costs-summary">
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
        <SummaryCard label={t('costs.totalSpend')} sub={t('costs.totalSpendSub')} amount={totals.totalSpend} currency={base} locale={locale}
          icon={<BarChart3 size={18} />} tone="total"
          foot={<span style={{ display: 'flex', gap: 16 }}><span>{t('costs.yourShare')} · <b>{fmt0(totals.myShare)}</b></span><span>{t('costs.youPaid')} · <b>{fmt0(totals.myPaid)}</b></span></span>} />
      </div>

      {/* ── Main grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }} className="costs-grid">
        {/* expenses */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
            <h3 className="text-content" style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.025em', margin: 0 }}>
              {t('costs.expenses')}
            </h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div className="bg-surface-input border border-edge" style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10, padding: '0 10px', height: 34 }}>
                <Search size={15} className="text-content-faint" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('costs.searchPlaceholder')}
                  className="text-content" style={{ border: 0, background: 'none', outline: 'none', fontSize: 13, width: 150, fontFamily: 'inherit' }} />
              </div>
              <div className="bg-surface-secondary" style={{ display: 'flex', borderRadius: 9, padding: 3 }}>
                {(['all', 'mine', 'owed'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={filter === f ? 'bg-surface-card text-content' : 'text-content-muted'}
                    style={{ padding: '6px 11px', fontSize: 12, borderRadius: 7, fontWeight: 500, border: 0, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {t('costs.filter.' + f)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {dayGroups.length === 0 ? (
            <div className="text-content-faint" style={{ textAlign: 'center', padding: '60px 20px' }}>
              {search ? t('costs.noMatch') : t('costs.emptyText')}
            </div>
          ) : dayGroups.map(g => {
            const dtot = g.entries.reduce((a, en) => en.kind === 'expense' ? a + baseTotal(en.e) : a, 0)
            return (
              <div key={g.day} style={{ marginBottom: 22 }}>
                <div className={labelCls} style={{ display: 'flex', alignItems: 'center', margin: '0 0 10px 4px' }}>
                  {g.day}<span className="text-content-muted" style={{ marginLeft: 'auto', textTransform: 'none', letterSpacing: 0, fontWeight: 500, fontSize: 12 }}>{t('costs.spent', { amount: fmt(dtot) })}</span>
                </div>
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
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 9px', borderRadius: 8, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
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
        <SettlementModal tripId={tripId} people={people} me={me} editing={editingSettlement}
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
          .costs-root .costs-summary { grid-template-columns: 1fr !important; }
          .costs-root .costs-grid { grid-template-columns: 1fr !important; }
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
        <div className="text-content" style={{ fontSize: 14.5, fontWeight: 600 }}>{t('costs.everyoneSquare')}</div>
        <div className="text-content-faint" style={{ fontSize: 12, marginTop: 2 }}>{t('costs.nothingOutstanding')}</div>
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
              <span className="text-content" style={{ fontSize: 14, fontWeight: 700 }}>{fmt(f.amount)}</span>
              {canEdit && <button onClick={() => settleFlow(f.from.user_id, f.to.user_id, f.amount)} className="bg-[var(--text-primary)] text-[var(--bg-primary)]" style={{ padding: '7px 12px', borderRadius: 9, fontSize: 12, fontWeight: 600, border: 0, cursor: 'pointer', fontFamily: 'inherit' }}>{t('costs.settle')}</button>}
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
          <div style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{t('costs.totalSpend')}</div>
          <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, marginTop: 8, display: 'flex', alignItems: 'baseline' }}>{bigMoney(totals.totalSpend, 24, 'rgba(255,255,255,0.6)')}</div>
          <div style={{ display: 'flex', gap: 18, marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.6)', flexWrap: 'wrap' }}>
            <span>{t('costs.yourShare')} · <b style={{ color: '#fff', fontWeight: 600 }}>{fmt0(totals.myShare)}</b></span>
            <span>{t('costs.youPaid')} · <b style={{ color: '#fff', fontWeight: 600 }}>{fmt0(totals.myPaid)}</b></span>
          </div>
          {canEdit && (
            <button onClick={() => { setEditing(null); setModalOpen(true) }} style={{ marginTop: 16, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.16)', color: '#fff', padding: 13, borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Plus size={17} /> {t('costs.addExpense')}
            </button>
          )}
        </section>

        {/* Owe / Owed */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className={cardCls} style={{ borderRadius: 18, padding: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', marginBottom: 10, background: '#dc262622', color: '#dc2626' }}><ArrowDown size={17} /></div>
            <div className="text-content" style={{ fontSize: 12.5, fontWeight: 600 }}>{t('costs.youOwe')}</div>
            <div className="text-content-faint" style={{ fontSize: 10.5 }}>{t('costs.youOweSub')}</div>
            <div style={{ fontSize: 27, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, marginTop: 12, display: 'flex', alignItems: 'baseline', color: '#dc2626' }}>{bigMoney(totals.owe, 16, 'var(--c-ink3)')}</div>
          </div>
          <div className={cardCls} style={{ borderRadius: 18, padding: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', marginBottom: 10, background: '#16a34a22', color: '#16a34a' }}><ArrowUp size={17} /></div>
            <div className="text-content" style={{ fontSize: 12.5, fontWeight: 600 }}>{t('costs.youreOwed')}</div>
            <div className="text-content-faint" style={{ fontSize: 10.5 }}>{t('costs.youreOwedSub')}</div>
            <div style={{ fontSize: 27, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, marginTop: 12, display: 'flex', alignItems: 'baseline', color: '#16a34a' }}>{bigMoney(totals.owed, 16, 'var(--c-ink3)')}</div>
          </div>
        </div>

        {/* Settle up */}
        <div className={cardCls} style={{ borderRadius: 18, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8 }}>
            <div className="text-content" style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: 8 }}>{t('costs.settleUp')} <span className="text-content-faint" style={{ fontSize: 12, fontWeight: 500 }}>{(settlement?.flows || []).length}</span></div>
            {canEdit && (
              <button onClick={() => setAddingPayment(true)} className="text-content-muted bg-surface-card border border-edge" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 9, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}><Plus size={13} /> {t('costs.addPayment')}</button>
            )}
          </div>
          <SettleFlows />
        </div>

        {/* Expenses */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="text-content" style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em' }}>{t('costs.expenses')}</div>
          <div className="bg-surface-card border border-edge" style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, padding: '0 12px', height: 42 }}>
            <Search size={16} className="text-content-faint" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('costs.searchPlaceholder')} className="text-content" style={{ border: 0, background: 'none', outline: 'none', fontSize: 14, width: '100%', fontFamily: 'inherit' }} />
          </div>
          <div className="bg-surface-secondary" style={{ display: 'flex', borderRadius: 11, padding: 3, gap: 2 }}>
            {(['all', 'mine', 'owed'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={filter === f ? 'bg-surface-card text-content' : 'text-content-muted'} style={{ flex: 1, padding: '8px 6px', fontSize: 12.5, fontWeight: 500, borderRadius: 8, border: 0, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>{t('costs.filter.' + f)}</button>
            ))}
          </div>
          {dayGroups.length === 0
            ? <div className="text-content-faint" style={{ textAlign: 'center', padding: '36px 16px', fontSize: 13 }}>{search ? t('costs.noMatch') : t('costs.emptyText')}</div>
            : dayGroups.map(g => {
                const dtot = g.entries.reduce((a, en) => en.kind === 'expense' ? a + baseTotal(en.e) : a, 0)
                return (
                  <div key={g.day} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className={labelCls} style={{ display: 'flex', alignItems: 'center', padding: '0 2px' }}>{g.day}<span className="text-content-muted" style={{ marginLeft: 'auto', textTransform: 'none', letterSpacing: 0, fontWeight: 500, fontSize: 11.5 }}>{t('costs.spent', { amount: fmt(dtot) })}</span></div>
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
    // "Unfinished": a recorded total nobody has paid yet — counts toward the trip
    // total but stays out of settlements until who-paid is filled in.
    const isUnfinished = baseTotal(e) > 0 && payers.length === 0
    return (
      <div className="bg-surface-card border border-edge exp-row" style={{ display: 'grid', gridTemplateColumns: '46px 1fr auto', gap: 16, alignItems: 'center', borderRadius: 18, padding: '16px 20px' }}>
        <span style={{ position: 'relative', width: 46, height: 46, borderRadius: 13, display: 'grid', placeItems: 'center', background: c.color + '22', color: c.color }}>
          <Icon size={21} />
          {isMobile && isUnfinished && (
            <span title={t('costs.unfinishedHint')} style={{ position: 'absolute', bottom: -4, right: -4, width: 20, height: 20, borderRadius: '50%', background: '#d97706', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, lineHeight: 1, border: '2px solid var(--bg-card)' }}>!</span>
          )}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <span className="text-content" style={{ fontSize: 15, fontWeight: 600 }}>{e.name}</span>
            {isUnfinished && !isMobile && (
              <span title={t('costs.unfinishedHint')} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px 2px 6px', borderRadius: 999, background: 'rgba(217,119,6,0.14)', color: '#d97706', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#d97706', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 800 }}>!</span>
                {t('costs.unfinished')}
              </span>
            )}
          </div>
          {payers.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 5 }}>
              {payers.map(p => (
                <span key={p.user_id} className="bg-surface-secondary border border-edge" title={personName(p.user_id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px 3px 3px', borderRadius: 999, fontSize: 11.5 }}>
                  <Avatar id={p.user_id} size={18} />
                  <span className="text-content" style={{ fontWeight: 700 }}>{fmt(convert(p.amount, cur))}</span>
                </span>
              ))}
            </div>
          )}
          {!isMobile && (
            <div className="text-content-faint" style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t(c.labelKey)}{cur !== base ? ` · ${fmt(e.total_price, cur)} → ${fmt(baseTotal(e))}` : ''}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, alignSelf: 'center' }}>
          <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
            <div className="text-content" style={{ fontSize: 18, fontWeight: 600 }}>{fmt(baseTotal(e))}</div>
            {!isUnfinished && (e.members || []).length > 0 && Math.abs(net) > 0.01 && (
              <div style={{ fontSize: 12, marginTop: 2, fontWeight: 500, whiteSpace: 'nowrap', color: net > 0 ? '#16a34a' : '#dc2626' }}>
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
    return (
      <div className="bg-surface-card border border-edge exp-row" style={{ display: 'grid', gridTemplateColumns: '46px 1fr auto', gap: 16, alignItems: 'center', borderRadius: 18, padding: '16px 20px' }}>
        <span style={{ width: 46, height: 46, borderRadius: 13, display: 'grid', placeItems: 'center', background: 'rgba(22,163,74,0.12)', color: '#16a34a' }}><ArrowLeftRight size={21} /></span>
        <div style={{ minWidth: 0 }}>
          <div className="text-content" style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{t('costs.payment')}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }} title={`${personName(s.from_user_id)} → ${personName(s.to_user_id)}`}>
            <Avatar id={s.from_user_id} size={20} /><ArrowRight size={13} className="text-content-faint" /><Avatar id={s.to_user_id} size={20} />
            <span className="text-content-faint" style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{personName(s.from_user_id)} → {personName(s.to_user_id)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, alignSelf: 'center' }}>
          <div className="text-content" style={{ fontSize: 18, fontWeight: 600, whiteSpace: 'nowrap' }}>{fmt(s.amount)}</div>
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
                <div className="text-content" style={{ fontSize: 13, fontWeight: 600 }}>{personName(r.user_id)}</div>
                <div className="bg-surface-secondary" style={{ height: 5, borderRadius: 3, marginTop: 5, position: 'relative', overflow: 'hidden' }}>
                  <span style={{ position: 'absolute', left: '50%', top: -1, bottom: -1, width: 1, background: 'var(--border-primary)' }} />
                  {pos && <span style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: pct / 2 + '%', background: '#16a34a', borderRadius: 3 }} />}
                  {neg && <span style={{ position: 'absolute', right: '50%', top: 0, bottom: 0, width: pct / 2 + '%', background: '#dc2626', borderRadius: 3 }} />}
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, textAlign: 'right', color: pos ? '#16a34a' : neg ? '#dc2626' : 'var(--text-faint)' }}>
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
    if (rows.length === 0) return <div className="text-content-faint" style={{ fontSize: 12.5 }}>{t('costs.noCategories')}</div>
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
              <span className="text-content" style={{ fontSize: 13, fontWeight: 500 }}>{t(c.labelKey)}</span>
              <span className="text-content-muted" style={{ fontSize: 13, fontWeight: 600 }}>{fmt0(v)}</span>
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
function SummaryCard({ label, sub, amount, currency, locale, icon, foot, tone }: { label: string; sub: string; amount: number; currency: string; locale: string; icon: React.ReactNode; foot: React.ReactNode; tone: 'owe' | 'owed' | 'total' }) {
  const total = tone === 'total'
  const accent = tone === 'owe' ? '#dc2626' : tone === 'owed' ? '#16a34a' : undefined
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
          <div style={{ fontSize: 13, fontWeight: 600 }} className={total ? '' : 'text-content'}>{label}</div>
          <div style={{ fontSize: 12, opacity: total ? 0.6 : 1 }} className={total ? '' : 'text-content-faint'}>{sub}</div>
        </div>
      </div>
      <div style={{ fontSize: 46, fontWeight: 600, letterSpacing: '-0.035em', lineHeight: 1, marginTop: 20, display: 'flex', alignItems: 'baseline', color: total ? '#fff' : accent }}>
        {parts
          ? parts.map((p, i) => <span key={i} style={big(p) ? undefined : { fontSize: 26, fontWeight: 500, color: muted }}>{p.value}</span>)
          : <span>{formatMoney(amount, currency, locale)}</span>}
      </div>
      <div style={{ marginTop: 16, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', opacity: total ? 0.85 : 1 }}>{foot}</div>
    </div>
  )
}

function FlowPills({ ids, lead, Avatar, name }: { ids: number[]; lead: string; Avatar: (p: { id: number; size?: number }) => React.JSX.Element; name: (id: number) => string }) {
  const uniq = Array.from(new Set(ids))
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span className="text-content-faint">{lead}</span>
      {uniq.map(id => (
        <span key={id} className="bg-surface-secondary border border-edge text-content" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px 3px 3px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
          <Avatar id={id} size={18} />{name(id)}
        </span>
      ))}
    </span>
  )
}

// Add or edit a settle-up payment (from / to / amount). Reachable inline from the
// ledger row and from a manual "Add payment" button, so recording "I sent money to
// X" works the same whether or not there's an outstanding expense behind it.
function SettlementModal({ tripId, people, me, editing, onClose, onSaved }: {
  tripId: number; people: TripMember[]; me: number; editing: Settlement | null; onClose: () => void; onSaved: () => void
}) {
  const { t } = useTranslation()
  const toast = useToast()
  const otherDefault = people.find(p => p.id !== me)?.id ?? me
  const [fromId, setFromId] = useState<string>(String(editing?.from_user_id ?? me))
  const [toId, setToId] = useState<string>(String(editing?.to_user_id ?? otherDefault))
  const [amount, setAmount] = useState<string>(editing ? String(editing.amount) : '')
  const [saving, setSaving] = useState(false)

  const amt = parseFloat(amount) || 0
  const valid = amt > 0 && fromId !== toId
  const opts = people.map(p => ({ value: String(p.id), label: p.id === me ? t('costs.you') : p.username }))

  const save = async () => {
    if (!valid) return
    setSaving(true)
    const data = { from_user_id: Number(fromId), to_user_id: Number(toId), amount: amt }
    try {
      if (editing) await budgetApi.updateSettlement(tripId, editing.id, data)
      else await budgetApi.createSettlement(tripId, data)
      onSaved()
    } catch { toast.error(t('common.unknownError')) } finally { setSaving(false) }
  }

  const inputCls = 'w-full bg-surface-input border border-edge text-content'
  const labelCls = 'block text-[11px] font-semibold uppercase tracking-[0.08em] text-content-faint mb-[6px]'

  return (
    <Modal isOpen onClose={onClose} title={editing ? t('costs.editPayment') : t('costs.addPayment')} size="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} className="text-content-muted border border-edge" style={{ padding: '8px 16px', borderRadius: 10, background: 'none', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>{t('common.cancel')}</button>
          <button onClick={save} disabled={!valid || saving} className="bg-[var(--text-primary)] text-[var(--bg-primary)]" style={{ padding: '8px 20px', borderRadius: 10, border: 0, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: !valid || saving ? 0.5 : 1 }}>{editing ? t('common.save') : t('costs.addPayment')}</button>
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
        <div>
          <label className={labelCls}>{t('costs.amount')}</label>
          <input type="text" inputMode="decimal" placeholder="0.00" value={amount}
            onChange={e => setAmount(e.target.value.replace(',', '.'))} className={inputCls} style={{ borderRadius: 10, padding: '11px 13px', fontSize: 14, outline: 'none', fontWeight: 600 }} />
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
  // One participant list: a person is "in" the split and may have paid an amount.
  // Entering the total auto-distributes it equally across the non-pinned participants;
  // touching an amount pins it and the rest rebalance so the paid amounts always sum
  // back to the total. Leaving every amount blank = an unfinished expense (counts
  // toward the trip total only, never settlements, until who-paid is filled in).
  const [total, setTotal] = useState<string>(() => {
    if (editing) return editing.total_price ? String(editing.total_price) : ''
    if (prefill?.amount != null) return String(prefill.amount)
    return ''
  })
  const [participants, setParticipants] = useState<Set<number>>(() =>
    editing ? new Set((editing.members || []).map(m => m.user_id)) : new Set(people.map(p => p.id)))
  const [paid, setPaid] = useState<Record<number, string>>(() => {
    const m: Record<number, string> = {}
    for (const p of editing?.payers || []) if (p.amount > 0) m[p.user_id] = String(p.amount)
    return m
  })
  // Amounts the user pinned by typing — kept out of the auto-rebalance. Existing
  // payer amounts load as pinned so opening an expense never reshuffles them.
  const [dirty, setDirty] = useState<Set<number>>(() =>
    new Set((editing?.payers || []).filter(p => p.amount > 0).map(p => p.user_id)))
  const [saving, setSaving] = useState(false)

  const totalNum = parseFloat(total) || 0
  const paidSum = round2([...participants].reduce((a, id) => a + (parseFloat(paid[id]) || 0), 0))
  const paidEntered = paidSum > 0
  const balanced = Math.abs(paidSum - totalNum) < 0.01
  const each = participants.size > 0 ? totalNum / participants.size : 0
  // No participants = a recorded total with nobody to split with (e.g. a booking
  // paid on-site later). It saves as an "unfinished" expense (#1286); selecting
  // people only adds the who-owes-whom split on top.
  const valid = name.trim().length > 0 && totalNum > 0 && (!paidEntered || balanced)

  // Spread `amount` across `n` people in whole cents so the parts sum back exactly.
  const splitCents = (amount: number, n: number): number[] => {
    if (n <= 0) return []
    const cents = Math.max(0, Math.round(amount * 100))
    const base = Math.floor(cents / n), rem = cents - base * n
    return Array.from({ length: n }, (_, i) => (base + (i < rem ? 1 : 0)) / 100)
  }
  // Recompute the non-pinned participants so every paid amount sums to the total.
  const rebalance = (paidMap: Record<number, string>, dirtySet: Set<number>, parts: Set<number>, totalVal: number): Record<number, string> => {
    const ids = [...parts]
    const free = ids.filter(id => !dirtySet.has(id))
    if (free.length === 0) return paidMap
    const pinnedSum = ids.filter(id => dirtySet.has(id)).reduce((a, id) => a + (parseFloat(paidMap[id]) || 0), 0)
    const shares = splitCents(totalVal - pinnedSum, free.length)
    const next = { ...paidMap }
    free.forEach((id, i) => { next[id] = shares[i] ? String(shares[i]) : '' })
    return next
  }

  const onTotalChange = (v: string) => {
    v = v.replace(',', '.')
    setTotal(v)
    setPaid(prev => rebalance(prev, dirty, participants, parseFloat(v) || 0))
  }
  const onPaidChange = (id: number, v: string) => {
    v = v.replace(',', '.')
    const nextDirty = new Set(dirty); nextDirty.add(id)
    setDirty(nextDirty)
    setPaid(prev => rebalance({ ...prev, [id]: v }, nextDirty, participants, totalNum))
  }
  const toggleParticipant = (id: number) => {
    const nextParts = new Set(participants), nextDirty = new Set(dirty), nextPaid = { ...paid }
    if (nextParts.has(id)) { nextParts.delete(id); nextDirty.delete(id); delete nextPaid[id] }
    else nextParts.add(id)
    setParticipants(nextParts); setDirty(nextDirty)
    setPaid(rebalance(nextPaid, nextDirty, nextParts, totalNum))
  }

  const save = async () => {
    if (!valid) return
    setSaving(true)
    const payerList = [...participants]
      .map(id => ({ user_id: id, amount: parseFloat(paid[id]) || 0 }))
      .filter(p => p.amount > 0)
    const data = {
      name: name.trim(), category: cat,
      // Store the actual currency the amounts were entered in; conversion to the
      // viewer's display currency happens live (real rates), no manual rate.
      currency,
      payers: payerList, member_ids: [...participants],
      expense_date: day || null,
      // Always record the entered total: the server keeps it as-is for an unfinished
      // expense (no payers) and otherwise re-derives it from the payer sum (== total).
      total_price: totalNum,
      // Link a freshly-created expense to its booking (create-from-booking flow).
      ...(!editing && prefill?.reservationId ? { reservation_id: prefill.reservationId } : {}),
    }
    try {
      if (editing) await updateBudgetItem(tripId, editing.id, data)
      else await addBudgetItem(tripId, data)
      onSaved()
    } catch { toast.error(t('common.unknownError')) } finally { setSaving(false) }
  }

  const inputCls = 'w-full bg-surface-input border border-edge text-content'
  const labelCls = 'block text-[11px] font-semibold uppercase tracking-[0.08em] text-content-faint mb-[6px]'

  return (
    <Modal isOpen onClose={onClose} title={editing ? t('costs.editExpense') : t('costs.addExpense')} size="2xl"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} className="text-content-muted border border-edge" style={{ padding: '8px 16px', borderRadius: 10, background: 'none', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>{t('common.cancel')}</button>
          <button onClick={save} disabled={!valid || saving} className="bg-[var(--text-primary)] text-[var(--bg-primary)]" style={{ padding: '8px 20px', borderRadius: 10, border: 0, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: !valid || saving ? 0.5 : 1 }}>{editing ? t('common.save') : t('costs.addExpense')}</button>
        </div>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className={labelCls}>{t('costs.whatFor')}</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder={t('costs.namePlaceholder')} className={inputCls} style={{ borderRadius: 10, padding: '11px 13px', fontSize: 14, outline: 'none' }} />
        </div>

        <div>
          <label className={labelCls}>{t('costs.totalAmount')}</label>
          <div className="bg-surface-input border border-edge" style={{ height: FIELD_H, boxSizing: 'border-box', display: 'flex', alignItems: 'center', borderRadius: 10, padding: '0 12px' }}>
            <span className="text-content-faint" style={{ fontSize: 15 }}>{sym(currency)}</span>
            <input type="text" inputMode="decimal" placeholder="0.00" value={total}
              onChange={e => onTotalChange(e.target.value)}
              className="text-content" style={{ flex: 1, border: 0, background: 'none', outline: 'none', fontSize: 15, fontWeight: 600, paddingLeft: 6, width: '100%' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <label className={labelCls}>{t('costs.currency')}</label>
            <CustomSelect value={currency} onChange={v => setCurrency(String(v))} searchable
              options={CURRENCIES.map(c => ({ value: c, label: SYMBOLS[c] ? `${c}  ${SYMBOLS[c]}` : c }))}
              style={{ width: '100%' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <label className={labelCls}>{t('costs.day')}</label>
            <CustomDatePicker value={day} onChange={setDay} style={{ width: '100%' }} />
          </div>
        </div>

        {currency !== base && totalNum > 0 && (
          <div className="bg-surface-secondary border border-edge text-content-muted" style={{ borderRadius: 10, padding: '10px 12px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px 6px 7px', borderRadius: 999, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', borderColor: on ? 'var(--text-primary)' : undefined }}>
                  <span style={{ width: 20, height: 20, borderRadius: 6, display: 'grid', placeItems: 'center', background: c.color + '22', color: c.color }}><Icon size={12} /></span>
                  {t(c.labelKey)}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className={labelCls}>{t('costs.whoPaid')}</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {people.map((p, idx) => {
              const on = participants.has(p.id)
              return (
                <div key={p.id} className="bg-surface-secondary border border-edge" style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: 10, alignItems: 'center', padding: '8px 11px', borderRadius: 10, opacity: on ? 1 : 0.5 }}>
                  <button onClick={() => toggleParticipant(p.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'none', border: 0, cursor: 'pointer', fontFamily: 'inherit', padding: 0, minWidth: 0, textAlign: 'left' }}>
                    {p.avatar_url
                      ? <img src={p.avatar_url} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', display: 'block', flexShrink: 0, opacity: on ? 1 : 0.45 }} />
                      : <span style={{ width: 22, height: 22, borderRadius: '50%', background: SPLIT_COLORS[idx % SPLIT_COLORS.length].gradient, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0, opacity: on ? 1 : 0.45 }}>{(p.id === me ? t('costs.youShort') : p.username.charAt(0)).toUpperCase()}</span>}
                    <span className="text-content" style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.id === me ? t('costs.you') : p.username}</span>
                  </button>
                  {on ? (
                    <div className="bg-surface-input border border-edge" style={{ display: 'flex', alignItems: 'center', gap: 4, borderRadius: 8, padding: '0 10px' }}>
                      <span className="text-content-faint" style={{ fontSize: 13 }}>{sym(currency)}</span>
                      <input type="text" inputMode="decimal" placeholder="0.00" value={paid[p.id] || ''}
                        onChange={e => onPaidChange(p.id, e.target.value)}
                        className="text-content" style={{ width: '100%', border: 0, background: 'none', outline: 'none', fontSize: 14, fontWeight: 600, padding: '8px 0', textAlign: 'right' }} />
                    </div>
                  ) : (
                    <button onClick={() => toggleParticipant(p.id)} className="text-content-faint" style={{ background: 'none', border: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, textAlign: 'right' }}>{t('costs.tapToInclude')}</button>
                  )}
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 10, fontSize: 12.5, display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <span className="text-content-faint">
              {participants.size > 0 && t('costs.splitSummary', { count: participants.size, amount: sym(currency) + each.toFixed(2) })}
            </span>
            {paidEntered
              ? <span style={{ fontWeight: 600, color: balanced ? '#16a34a' : '#dc2626' }}>{sym(currency)}{paidSum.toFixed(2)} / {sym(currency)}{totalNum.toFixed(2)}</span>
              : (totalNum > 0 && <span style={{ color: '#d97706', fontWeight: 600 }}>{t('costs.unfinishedHint')}</span>)}
          </div>
        </div>
      </div>
    </Modal>
  )
}
