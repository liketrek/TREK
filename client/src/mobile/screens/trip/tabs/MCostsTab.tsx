import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  AlertCircle, ArrowDown, ArrowLeftRight, ArrowRight, ArrowUp, Check, ChevronDown, ChevronUp,
  Layers, Pencil, Plus, RotateCcw, StickyNote, Trash2, Receipt,
} from 'lucide-react'
import MDancingTrek from '../../../components/MDancingTrek'
import { useTranslation } from '../../../../i18n'
import { formatMoney } from '../../../../utils/formatters'
import { flowText } from '../../../../utils/flowText'
import { openFile } from '../../../../utils/fileDownload'
import MCostSheet from '../sheets/MCostSheet'
import { ReceiptPreviewModal } from '../../../../components/Budget/ReceiptPreviewModal'
import { useCostsLedger } from '../../../../components/Budget/useCostsLedger'
import { useExpenseLinks } from '../../../../components/Budget/useExpenseLinks'
import { useCostsMode } from '../../../../components/Budget/useCostsMode'
import { CostsCurrencyPicker } from '../../../../components/Budget/CostsCurrencyPicker'
import ToggleSwitch from '../../../../components/Settings/ToggleSwitch'
import { finalBudgetFor, finalBudgetSources, formerParticipantRows, paidByUser, readUserNote } from '../../../../components/Budget/CostsPanel.helpers'
import { catMeta, COST_CAT_META } from '../../../../components/Budget/costsCategories'
import MConfirmSheet from '../../settings/MConfirmSheet'
import { CountPill, TabPanes } from './tabChrome'
import { AddPaymentSheet, MemberAvatar } from './MCostsPayment'
import { STATUS_COLOR, type MTabScreenProps } from './tabModel'
import {
  baseTotal, categoryFilterKeys, dayFilterKeys, groupLedgerByDay, isUnfinished, lineOf, memberShareOf,
  paymentAmount, paymentLineOf, tint, type CostsCtx, type CostsSettlement,
} from '../../../../components/Budget/costsModel'
import type { BudgetParticipantFinal } from '@trek/shared'
import type { BudgetItem, BudgetItemReceipt } from '../../../../types'

type TFn = (key: string, params?: Record<string, string | number>) => string

/**
 * Tab 3 — Kosten (`finanzplan`). Real `planner.budgetItems` + a server-computed
 * settlement (min-transfer, not in the store — `budgetApi.settlement`), summed
 * client-side exactly like the desktop `CostsPanel.tsx` (see `costsModel.ts`).
 * The shell owns the header (Add expense / CSV export); this panel watches
 * `shell.addExpenseSignal` / `shell.exportCostsCsvSignal` the way
 * `useTodoList.ts` watches `addItemSignal`. Add/edit reuses the desktop
 * `ExpenseModal` unchanged; "Add payment" is a small local sheet (no mobile or
 * exported desktop equivalent existed for it).
 */
export default function MCostsTab({ planner, shell }: MTabScreenProps) {
  const { t, tripId, trip, tripMembers, budgetItems, days, toast } = planner
  const { locale } = useTranslation()
  const canEdit = planner.can('budget_edit', trip)

  // The display and trip currencies, the server-computed settlement, totals,
  // filters and the ledger writes: the same ledger the desktop panel runs on.
  const {
    me, base, tripCurrency, ctx, settlement, settlementError, loadSettlement, flows, splitting, knownNames,
    search, setSearch, segment, setSegment, catFilter, setCatFilter, dayFilter, setDayFilter,
    totals, filtered, filteredSettlements, catBreakdown, leftOutLabel, toggleLeftOutCat, countAllCats, exportCsv: handleExportCsv,
    deleteExpense, undoSettlement: handleUndoSettlement, setBase, baseOptions,
  } = useCostsLedger({ tripId, trip, budgetItems, memberCount: tripMembers.length, actions: planner.tripActions, canEdit, t, toast })

  // Split between the travellers or totals only (#1714), switched at the foot of the summary.
  const costsMode = useCostsMode(trip, tripMembers.length, canEdit)
  const modeHintId = useId()
  const [catOpen, setCatOpen] = useState(false)
  const [dayOpen, setDayOpen] = useState(false)
  const [settleOpen, setSettleOpen] = useState(true)
  // One traveler's final-budget breakdown open at a time; the list stays scannable.
  const [expandedFinalId, setExpandedFinalId] = useState<number | null>(null)
  const [addPaymentOpen, setAddPaymentOpen] = useState(false)
  const [editingSettlement, setEditingSettlement] = useState<CostsSettlement | null>(null)
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<BudgetItem | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<BudgetItem | null>(null)
  const [previewReceipts, setPreviewReceipts] = useState<{ receipts: BudgetItemReceipt[]; initialIndex: number } | null>(null)
  useExpenseLinks(tripId, budgetItems, (e) => { if (canEdit) { setEditingExpense(e); setExpenseModalOpen(true) } })

  const groups = useMemo(() => groupLedgerByDay(filtered, filteredSettlements), [filtered, filteredSettlements])
  const catKeys = useMemo(() => categoryFilterKeys(budgetItems), [budgetItems])
  const dayKeys = useMemo(() => dayFilterKeys(budgetItems), [budgetItems])

  // Someone who left the trip is no longer a member, but the expenses still name them (#2604).
  const personName = (id: number) => (id === me ? t('costs.you') : tripMembers.find(p => p.id === id)?.username || knownNames.get(id) || '?')
  // The members, then whoever left the trip with money still on their name, so the rows add up.
  const memberIds = tripMembers.map(p => p.id)
  const asPerson = (r: { user_id: number; username: string; avatar_url?: string | null }) => ({ id: r.user_id, username: r.username, avatar_url: r.avatar_url ?? null })
  const balancePeople = [...tripMembers, ...formerParticipantRows(memberIds, settlement?.balances || [], b => Math.abs(b.balance) >= 0.005).map(asPerson)]
  const finalPeople = [...tripMembers, ...formerParticipantRows(memberIds, settlement?.finalBudgets || [], f => Math.abs(f.final) >= 0.005 || Math.abs(f.expenses) >= 0.005).map(asPerson)]

  const shortDate = (dateIso: string) => {
    try {
      return new Date(dateIso + 'T00:00:00Z').toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' })
    } catch {
      return dateIso
    }
  }
  const dayOptionLabel = (dateIso: string) => {
    const dayNumber = days.find(d => d.date && d.date.slice(0, 10) === dateIso)?.day_number
    return dayNumber != null ? `${t('dayplan.dayN', { n: dayNumber })} · ${shortDate(dateIso)}` : shortDate(dateIso)
  }
  const groupLabel = (dateIso: string) => {
    if (!dateIso) return t('costs.noDate')
    try {
      return new Date(dateIso + 'T00:00:00Z').toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
    } catch {
      return dateIso
    }
  }

  // Header intent signals (spec 03 §3.8 addExpense/csvGo) — increment-only
  // counters the shell owns; pattern mirrors useTodoList.ts's addItemSignal.
  const lastAddSignal = useRef(shell.addExpenseSignal)
  useEffect(() => {
    if (shell.addExpenseSignal !== lastAddSignal.current && shell.addExpenseSignal > 0) {
      setEditingExpense(null)
      setExpenseModalOpen(true)
    }
    lastAddSignal.current = shell.addExpenseSignal
  }, [shell.addExpenseSignal])

  const lastCsvSignal = useRef(shell.exportCostsCsvSignal)
  useEffect(() => {
    if (shell.exportCostsCsvSignal !== lastCsvSignal.current && shell.exportCostsCsvSignal > 0) {
      handleExportCsv()
    }
    lastCsvSignal.current = shell.exportCostsCsvSignal
  }, [shell.exportCostsCsvSignal, handleExportCsv])

  const handleDeleteExpense = (item: BudgetItem) => deleteExpense(item.id)

  const handleTogglePaid = async (itemId: number, userId: number, paid: boolean) => {
    try {
      await planner.tripActions.toggleBudgetMemberPaid(tripId, itemId, userId, paid)
    } catch {
      toast.error(t('common.unknownError'))
    }
  }

  // The summary: what the trip costs and who owes whom. Beside the expenses on
  // a window with room for two panes, above them everywhere else.
  const summary = (
    <>
      {/* Hero — "Total Trip Spend" (spec §3.1). Fixed dark card, both themes. */}
      <div className="rounded-[20px] p-4 shadow-[0_18px_44px_-18px_rgba(0,0,0,.5)]" style={{ background: '#15151A', color: '#F5F5F7' }}>
        <div className="font-geist text-[0.625rem] font-bold uppercase tracking-[.09em]" style={{ color: 'rgba(245,245,247,.55)' }}>
          {t('costs.totalSpend')}
        </div>
        <div className="mt-1 font-geist text-[1.875rem] font-extrabold tabular-nums tracking-[-0.02em]">
          {formatMoney(totals.totalSpend, base, locale)}
        </div>
        {/* Categories left out below (#2819) leave this total too, which it says. */}
        {leftOutLabel && <div className="mt-[2px] text-caption opacity-70">{leftOutLabel}</div>}
        {/* Each figure under its own label, so the two pairs never read as one run.
            Only with something to split (#2689), like everything owed below. */}
        {splitting && <div className="mt-[8px] flex flex-wrap gap-x-[22px] gap-y-[6px] text-[0.6875rem]" style={{ color: 'rgba(245,245,247,.7)' }}>
          <span className="flex flex-col">
            {t('costs.yourShare')}
            <b className="tabular-nums" style={{ color: '#F5F5F7' }}>{formatMoney(totals.myShare, base, locale)}</b>
          </span>
          <span className="flex flex-col">
            {t('costs.youPaid')}
            <b className="tabular-nums" style={{ color: '#F5F5F7' }}>{formatMoney(totals.myPaid, base, locale)}</b>
          </span>
        </div>}
      </div>

      {splitting && <>
      {/* You owe / You're owed (spec §3.2). The two tiles stand level and each
          amount sits at the foot of its tile, so a label that wraps in one of
          them (German "Dir wird geschuldet") leaves both amounts on one line. */}
      <div className="mt-[10px] flex gap-2">
        <div className="flex flex-1 flex-col rounded-2xl border border-[color:var(--m-rowbr)] bg-m-card p-[13px]">
          <span className="flex h-[30px] w-[30px] items-center justify-center self-start rounded-[10px]" style={{ background: 'rgba(214,39,59,.12)', color: STATUS_COLOR.danger }}>
            <ArrowDown size={15} strokeWidth={2.2} />
          </span>
          <div className="mt-2 text-[0.8125rem] font-bold text-m-ink">{t('costs.youOwe')}</div>
          <div className="font-geist text-[0.59375rem] text-m-faint">{t('costs.youOweSub')}</div>
          <div className="mt-auto pt-1 font-geist text-[1.1875rem] font-extrabold tabular-nums" style={{ color: totals.owe > 0.5 ? STATUS_COLOR.danger : 'var(--m-ink)' }}>
            {formatMoney(totals.owe, base, locale)}
          </div>
        </div>
        <div className="flex flex-1 flex-col rounded-2xl border border-[color:var(--m-rowbr)] bg-m-card p-[13px]">
          <span className="flex h-[30px] w-[30px] items-center justify-center self-start rounded-[10px]" style={{ background: 'rgba(47,163,122,.12)', color: STATUS_COLOR.confirmed }}>
            <ArrowUp size={15} strokeWidth={2.2} />
          </span>
          <div className="mt-2 text-[0.8125rem] font-bold text-m-ink">{t('costs.youreOwed')}</div>
          <div className="font-geist text-[0.59375rem] text-m-faint">{t('costs.youreOwedSub')}</div>
          <div className="mt-auto pt-1 font-geist text-[1.1875rem] font-extrabold tabular-nums" style={{ color: totals.owed > 0.5 ? STATUS_COLOR.confirmed : 'var(--m-ink)' }}>
            {formatMoney(totals.owed, base, locale)}
          </div>
        </div>
      </div>

      {/* Outstanding amount (spec §3.3) — only when unpaid expenses exist */}
      {totals.outstandingCount > 0 && (
        <div className="mt-2 flex items-center gap-[10px] rounded-2xl border border-[color:var(--m-rowbr)] bg-m-card px-[13px] py-[11px]">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[11px]" style={{ background: 'rgba(232,161,58,.14)', color: STATUS_COLOR.pending }}>
            <AlertCircle size={16} strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[0.78125rem] font-bold text-m-ink">{t('costs.outstanding')}</div>
            <div className="font-geist text-[0.59375rem] text-m-faint"><b>{totals.outstandingCount}</b> {t('costs.outstandingItems', { count: totals.outstandingCount })}</div>
          </div>
          <div className="flex-none font-geist text-[0.9375rem] font-extrabold tabular-nums" style={{ color: STATUS_COLOR.pending }}>
            {formatMoney(totals.outstanding, base, locale)}
          </div>
        </div>
      )}

      {/* Settle up (spec §3.4) */}
      <div className="mt-2 rounded-2xl border border-[color:var(--m-rowbr)] bg-m-card p-[13px]">
        {/* Toggle and "Add payment" are siblings, not nested: a control inside a
            control reads as one element to a screen reader. Where the title, the
            count, the chevron and the button do not fit on one line (a long
            language in a narrow pane), the button moves to a line of its own
            under them instead of lying over the count and the chevron. */}
        <div className="flex w-full flex-wrap items-center gap-x-[10px] gap-y-2">
          <button
            type="button"
            aria-expanded={settleOpen}
            onClick={() => setSettleOpen(v => !v)}
            className="flex min-w-0 flex-[1_1_auto] items-center gap-[7px] text-start"
          >
            <span className="min-w-0 text-[0.875rem] font-extrabold text-m-ink">{t('costs.settleUp')}</span>
            <CountPill>{flows.length}</CountPill>
            {settleOpen ? (
              <ChevronUp size={14} strokeWidth={2} className="ms-auto flex-none text-m-faint" />
            ) : (
              <ChevronDown size={14} strokeWidth={2} className="ms-auto flex-none text-m-faint" />
            )}
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={() => setAddPaymentOpen(true)}
              className="ms-auto flex flex-none items-center gap-[5px] whitespace-nowrap rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[11px] py-[6px] font-[inherit] text-[0.71875rem] font-semibold text-m-muted"
            >
              <Plus size={11} strokeWidth={2.2} />
              {t('costs.addPayment')}
            </button>
          )}
        </div>

        {settleOpen && (
          <>
            {flows.length === 0 ? (
              <div className="py-[14px] text-center">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full" style={{ background: 'rgba(47,163,122,.14)', color: STATUS_COLOR.confirmed }}>
                  <Check size={19} strokeWidth={2.5} />
                </span>
                <div className="mt-[7px] text-[0.84375rem] font-bold text-m-ink">{t('costs.everyoneSquare')}</div>
                <div className="mt-[2px] font-geist text-[0.65625rem] text-m-faint">{t('costs.nothingOutstanding')}</div>
              </div>
            ) : (
              <div className="mt-[6px]">
                {flows.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 border-b border-[color:var(--m-rowbr)] py-2 last:border-b-0">
                    <span dir="auto" className="min-w-0 flex-1 truncate text-[0.78125rem] font-semibold text-m-ink">{personName(f.from.user_id)}</span>
                    <ArrowRight size={12} strokeWidth={2.2} className="flex-none text-m-faint" />
                    <span dir="auto" className="min-w-0 flex-1 truncate text-[0.78125rem] font-semibold text-m-ink">{personName(f.to.user_id)}</span>
                    <span dir="ltr" className="ms-auto flex-none font-geist text-[0.78125rem] font-extrabold tabular-nums text-m-ink">{formatMoney(f.amount, base, locale)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-[2px] mt-3 font-geist text-[0.625rem] font-bold uppercase tracking-[.09em] text-m-faint">{t('costs.balances')}</div>
            {balancePeople.map(p => {
              const balance = settlement?.balances.find(b => b.user_id === p.id)?.balance ?? 0
              const pos = balance > 0.01
              const neg = balance < -0.01
              return (
                <div key={p.id} className="flex items-center gap-[9px] border-b border-[color:var(--m-rowbr)] py-[7px] last:border-b-0">
                  <MemberAvatar name={p.username} avatarUrl={p.avatar_url} variant="neutral" size={24} />
                  <span className="min-w-0 flex-1 truncate text-[0.78125rem] font-semibold text-m-ink">{p.id === me ? t('costs.you') : p.username}</span>
                  <span dir="ltr" className="ms-auto flex-none font-geist text-[0.75rem] font-extrabold tabular-nums" style={{ color: pos ? STATUS_COLOR.confirmed : neg ? STATUS_COLOR.danger : 'var(--m-faint)' }}>
                    {pos ? '+' : neg ? '−' : ''}
                    {formatMoney(Math.abs(balance), base, locale)}
                  </span>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Final budget — what the trip costs each traveler; the arithmetic opens on tap */}
      <div className="mt-2 rounded-2xl border border-[color:var(--m-rowbr)] bg-m-card p-[13px]">
        <div className="font-geist text-[0.625rem] font-bold uppercase tracking-[.09em] text-m-faint">{t('costs.finalBudget')}</div>
        {settlementError ? (
          <p className="py-[14px] text-center font-geist text-[0.71875rem] text-m-muted">{t('common.unknownError')}</p>
        ) : finalPeople.map(p => {
          const row = finalBudgetFor(settlement?.finalBudgets || [], p)
          const open = expandedFinalId === p.id
          return (
            <div key={p.id} className="border-b border-[color:var(--m-rowbr)] last:border-b-0">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setExpandedFinalId(open ? null : p.id)}
                className="flex w-full items-center gap-[9px] py-[7px] text-start font-[inherit]"
              >
                <MemberAvatar name={p.username} avatarUrl={p.avatar_url} variant="neutral" size={24} />
                <span dir="auto" className="min-w-0 flex-1 truncate text-[0.78125rem] font-semibold text-m-ink">{personName(p.id)}</span>
                <span dir="ltr" className="ms-auto flex-none font-geist text-[0.75rem] font-extrabold tabular-nums text-m-ink">{formatMoney(row.final, base, locale)}</span>
                {open
                  ? <ChevronUp size={13} strokeWidth={2.2} className="flex-none text-m-faint" />
                  : <ChevronDown size={13} strokeWidth={2.2} className="flex-none text-m-faint" />}
              </button>
              {open && (
                <FinalBudgetBreakdown row={row} items={budgetItems} ctx={ctx} base={base} locale={locale} t={t} personName={personName} />
              )}
            </div>
          )
        })}
      </div>

      </>}

      {/* By category (spec §3.5). A tap leaves a category out of the totals
          for a look without it (#2819); the row stays, dimmed. */}
      <div className="mt-2 rounded-2xl border border-[color:var(--m-rowbr)] bg-m-card p-[13px]">
        <div className="flex items-center gap-2">
          <div className="font-geist text-[0.625rem] font-bold uppercase tracking-[.09em] text-m-faint">{t('costs.byCategory')}</div>
          {leftOutLabel && (
            <button
              type="button"
              onClick={countAllCats}
              className="ms-auto flex flex-none items-center gap-1 rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[9px] py-[3px] text-caption font-semibold text-m-muted"
            >
              <RotateCcw size={11} strokeWidth={2.2} />
              {t('costs.breakdown.countAll')}
            </button>
          )}
        </div>
        {leftOutLabel
          ? <p className="mt-1 text-caption text-m-muted">{leftOutLabel}</p>
          : catBreakdown.length > 1 && <p className="mt-1 text-caption text-m-faint">{t('costs.breakdown.hint')}</p>}
        {catBreakdown.length === 0 ? (
          <p className="mt-2 font-geist text-[0.71875rem] text-m-faint">{t('costs.noCategories')}</p>
        ) : (
          catBreakdown.map(c => {
            const meta = COST_CAT_META[c.key]
            const name = t(meta.labelKey)
            const action = c.leftOut ? t('costs.breakdown.countIn', { category: name }) : t('costs.breakdown.leaveOut', { category: name })
            return (
              <button
                key={c.key}
                type="button"
                aria-label={action}
                onClick={() => toggleLeftOutCat(c.key)}
                className={`block w-full pb-[2px] pt-[6px] text-start ${c.leftOut ? 'opacity-45' : ''}`}
              >
                <span className="flex items-center gap-[7px]">
                  <span className="h-2 w-2 flex-none rounded-full" style={{ background: meta.color }} />
                  <span className="min-w-0 flex-1 truncate font-geist text-[0.65625rem] font-semibold text-m-muted">{name}</span>
                  <span dir="ltr" className={`ms-auto flex-none font-geist text-[0.65625rem] font-bold tabular-nums text-m-ink ${c.leftOut ? 'line-through' : ''}`}>{formatMoney(c.amount, base, locale)}</span>
                </span>
                <span className="mt-1 block h-1 overflow-hidden rounded-full bg-[color:var(--m-ic)]">
                  <span className="block h-full rounded-full" style={{ width: `${c.widthPct}%`, background: meta.color }} />
                </span>
              </button>
            )
          })
        )}
      </div>

      {costsMode.offered && (
        <div className="mt-2 flex items-start gap-3 rounded-2xl border border-[color:var(--m-rowbr)] bg-m-card p-[13px]">
          <div className="min-w-0 flex-1">
            <div className="text-body font-bold text-m-ink">{t('costs.mode.label')}</div>
            <p id={modeHintId} className="m-0 mt-[2px] text-caption text-m-faint">
              {costsMode.splitting ? t('costs.mode.hintSplit') : t('costs.mode.hintTotals')}
            </p>
          </div>
          <ToggleSwitch
            on={costsMode.splitting}
            onToggle={() => void costsMode.setSplitting(!costsMode.splitting)}
            label={t('costs.mode.label')}
            describedBy={modeHintId}
            disabled={costsMode.saving}
          />
        </div>
      )}
    </>
  )

  return (
    <>
    <TabPanes aside={summary} asideLabel={t('budget.title')}>
      {/* Expenses — header, search, filters (spec §3.6). One block, so on a wide
          window the search field keeps to the column like the heading above it. */}
      <section aria-label={t('costs.expenses')}>
      {/* The currency the tab reads the trip in (#1683) sits by the heading, as on the desktop. */}
      <div className="mt-4 flex items-center gap-2 split:mt-0">
        <h2 className="min-w-0 flex-1 text-[1.0625rem] font-extrabold text-m-ink">{t('costs.expenses')}</h2>
        <CostsCurrencyPicker value={base} options={baseOptions} onChange={setBase} />
      </div>
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        enterKeyHint="search" placeholder={t('costs.searchPlaceholder')}
        aria-label={t('costs.searchPlaceholder')}
        className="mt-2 block w-full rounded-full border border-[color:var(--m-rowbr)] bg-m-card px-[13px] py-[10px] font-[inherit] text-[0.8125rem] font-medium text-m-ink outline-none placeholder:text-m-faint"
      />
      {splitting && <div className="mt-2 flex rounded-full bg-m-card p-[3px]">
        {(['all', 'mine', 'owed'] as const).map(seg => (
          <button
            key={seg}
            type="button"
            aria-pressed={segment === seg}
            onClick={() => setSegment(seg)}
            className={`flex-1 rounded-full py-[7px] text-center text-[0.71875rem] font-semibold ${segment === seg ? 'bg-m-act text-m-actfg' : 'text-m-ink'}`}
          >
            {t('costs.filter.' + seg)}
          </button>
        ))}
      </div>}

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          aria-expanded={catOpen}
          onClick={() => {
            setCatOpen(v => !v)
            setDayOpen(false)
          }}
          className="flex flex-1 items-center justify-between gap-2 overflow-hidden rounded-xl border border-[color:var(--m-rowbr)] bg-m-card px-[13px] py-[9px] text-start"
        >
          <span className="min-w-0 flex-1 truncate text-[0.75rem] font-semibold text-m-ink">
            {catFilter ? t(catMeta(catFilter).labelKey) : t('costs.filter.allCategories')}
          </span>
          <ChevronDown size={13} strokeWidth={2} className="flex-none text-m-faint" />
        </button>
        <button
          type="button"
          aria-expanded={dayOpen}
          onClick={() => {
            setDayOpen(v => !v)
            setCatOpen(false)
          }}
          className="flex flex-1 items-center justify-between gap-2 overflow-hidden rounded-xl border border-[color:var(--m-rowbr)] bg-m-card px-[13px] py-[9px] text-start"
        >
          <span className="min-w-0 flex-1 truncate text-[0.75rem] font-semibold text-m-ink">
            {dayFilter ? dayOptionLabel(dayFilter) : t('costs.filter.allDays')}
          </span>
          <ChevronDown size={13} strokeWidth={2} className="flex-none text-m-faint" />
        </button>
      </div>

      {catOpen && (
        <div className="mt-[6px] overflow-hidden rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-glass)]">
          <button
            type="button"
            onClick={() => {
              setCatFilter('')
              setCatOpen(false)
            }}
            className="flex w-full items-center gap-[10px] border-b border-[color:var(--m-rowbr)] px-[13px] py-[10px] text-start"
          >
            <Layers size={14} strokeWidth={2} className="flex-none text-m-muted" />
            <span className="text-[0.78125rem] font-medium text-m-ink">{t('costs.filter.allCategories')}</span>
          </button>
          {catKeys.map(k => {
            const meta = COST_CAT_META[k]
            const Icon = meta.Icon
            return (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setCatFilter(k)
                  setCatOpen(false)
                }}
                className="flex w-full items-center gap-[10px] border-b border-[color:var(--m-rowbr)] px-[13px] py-[10px] text-start last:border-b-0"
              >
                <Icon size={14} strokeWidth={2} style={{ color: meta.color }} className="flex-none" />
                <span className="text-[0.78125rem] font-medium text-m-ink">{t(meta.labelKey)}</span>
              </button>
            )
          })}
        </div>
      )}

      {dayOpen && (
        <div className="mt-[6px] overflow-hidden rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-glass)]">
          <button
            type="button"
            onClick={() => {
              setDayFilter('')
              setDayOpen(false)
            }}
            className="w-full border-b border-[color:var(--m-rowbr)] px-[13px] py-[10px] text-start text-[0.78125rem] font-medium text-m-ink"
          >
            {t('costs.filter.allDays')}
          </button>
          {dayKeys.map(d => (
            <button
              key={d}
              type="button"
              onClick={() => {
                setDayFilter(d)
                setDayOpen(false)
              }}
              className="w-full border-b border-[color:var(--m-rowbr)] px-[13px] py-[10px] text-start text-[0.78125rem] font-medium text-m-ink last:border-b-0"
            >
              {dayOptionLabel(d)}
            </button>
          ))}
        </div>
      )}

      {/* Expense groups (spec §3.7) — expenses and recorded settle-up payments, day-merged */}
      {groups.map(g => {
        const groupTotal = g.entries.reduce((a, en) => en.kind === 'expense' ? a + baseTotal(en.item, ctx) : a, 0)
        return (
          <div key={g.dateKey || 'no-date'}>
            <div className="mt-[14px] flex items-baseline gap-2 px-[2px]">
              <span className="font-geist text-[0.625rem] font-bold uppercase tracking-[.09em] text-m-faint">{groupLabel(g.dateKey)}</span>
              <span className="ms-auto flex-none font-geist text-[0.59375rem] font-bold tabular-nums text-m-muted">
                {t('costs.spent', { amount: formatMoney(groupTotal, base, locale) })}
              </span>
            </div>
            {g.entries.map(en => en.kind === 'expense' ? (
              <ExpenseRow
                key={'e' + en.item.id}
                item={en.item}
                ctx={ctx}
                base={base}
                locale={locale}
                t={t}
                canEdit={canEdit}
                splitting={splitting}
                onEdit={() => {
                  setEditingExpense(en.item)
                  setExpenseModalOpen(true)
                }}
                onDelete={() => setConfirmDelete(en.item)}
                onTogglePaid={(userId, paid) => handleTogglePaid(en.item.id, userId, paid)}
                onPreviewReceipts={(receipts) => setPreviewReceipts({ receipts, initialIndex: 0 })}
              />
            ) : (
              <PaymentRow
                key={'s' + en.settlement.id}
                settlement={en.settlement}
                ctx={ctx}
                base={base}
                locale={locale}
                t={t}
                personName={personName}
                canEdit={canEdit}
                onEdit={() => setEditingSettlement(en.settlement)}
                onUndo={() => handleUndoSettlement(en.settlement.id)}
              />
            ))}
          </div>
        )
      })}

      {groups.length === 0 && (
        budgetItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MDancingTrek scene="costs" className="mb-2" />
            <p className="font-geist text-[0.8125rem] font-medium text-m-muted">{t('costs.emptyText')}</p>
          </div>
        ) : (
          <p className="py-6 text-center font-geist text-[0.6875rem] text-m-faint">{t('costs.noMatch')}</p>
        )
      )}
      </section>
    </TabPanes>

      {/* Add / edit expense — the shared desktop modal (spec §3.9); not rebuilt here. */}
      {expenseModalOpen && (
        <MCostSheet
          tripId={tripId}
          base={base}
          people={tripMembers}
          me={me}
          editing={editingExpense}
          onClose={() => setExpenseModalOpen(false)}
          onSaved={() => {
            setExpenseModalOpen(false)
            planner.tripActions.loadBudgetItems(tripId)
            loadSettlement()
          }}
        />
      )}

      <AddPaymentSheet
        open={addPaymentOpen || editingSettlement != null}
        editing={editingSettlement}
        onClose={() => {
          setAddPaymentOpen(false)
          setEditingSettlement(null)
        }}
        tripId={tripId}
        base={base}
        tripCurrency={tripCurrency}
        people={tripMembers}
        me={me}
        toast={toast}
        t={t}
        onSaved={() => {
          setAddPaymentOpen(false)
          setEditingSettlement(null)
          loadSettlement()
        }}
      />

      <MConfirmSheet
        open={confirmDelete != null}
        onClose={() => setConfirmDelete(null)}
        title={t('costs.confirm.deleteTitle')}
        message={t((confirmDelete?.receipts || []).length > 0 ? 'costs.confirm.deleteBodyReceipts' : 'costs.confirm.deleteBody', { name: confirmDelete?.name ?? '' })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => {
          const item = confirmDelete
          setConfirmDelete(null)
          if (item) void handleDeleteExpense(item)
        }}
      />

      {previewReceipts && (
        <ReceiptPreviewModal
          receipts={previewReceipts.receipts}
          initialIndex={previewReceipts.initialIndex}
          onClose={() => setPreviewReceipts(null)}
        />
      )}
    </>
  )
}

/** One expense card (spec 03 §3.7): category ribbon, optional unfinished ribbon, member chips, total pill, edit/delete stack. */
function ExpenseRow({ item, ctx, base, locale, t, canEdit, splitting, onEdit, onDelete, onTogglePaid, onPreviewReceipts }: {
  item: BudgetItem
  ctx: CostsCtx
  base: string
  locale: string
  t: TFn
  canEdit: boolean
  /** False with nothing to split (#2689): no unfinished ribbon, no shares to tick paid. */
  splitting: boolean
  onEdit: () => void
  onDelete: () => void
  onTogglePaid: (userId: number, paid: boolean) => void
  onPreviewReceipts: (receipts: BudgetItemReceipt[]) => void
}) {
  const meta = catMeta(item.category)
  const Icon = meta.Icon
  const total = baseTotal(item, ctx)
  const line = lineOf(item.total_price || 0, item, ctx, total)
  const unfinished = splitting && isUnfinished(item, ctx)
  const borderColor = tint(meta.color, 0.55)
  const members = splitting ? item.members || [] : []
  const note = readUserNote(item)

  // No swipe here: edit and delete stand beside the card already, and a swipe
  // put a second, larger pair of the same buttons next to them.
  return (
    <div className="mt-2 flex items-center gap-[6px]">
      <div className="relative min-w-0 flex-1 rounded-2xl bg-m-card px-3 pb-[10px] pt-[22px]" style={{ border: `1.5px solid ${borderColor}` }}>
        <span
          className="absolute -start-[1.5px] -top-[1.5px] flex items-center gap-1 rounded-es-none rounded-ee-[12px] rounded-ss-[15px] rounded-se-none px-[11px] pb-[4px] pt-[3px] font-geist text-[0.5625rem] font-extrabold uppercase tracking-[.05em] text-white"
          style={{ background: meta.color }}
        >
          <Icon size={10} strokeWidth={2.4} />
          {t(meta.labelKey)}
        </span>
        {unfinished && (
          <span
            className="absolute -end-[1.5px] -top-[1.5px] rounded-es-[12px] rounded-ee-none rounded-ss-none rounded-se-[15px] px-[11px] pb-[4px] pt-[3px] font-geist text-[0.53125rem] font-extrabold uppercase tracking-[.03em] text-white"
            style={{ background: 'var(--m-st-pending)' }}
          >
            {t('costs.unfinished')}
          </span>
        )}

        <div className="flex items-center gap-[10px]">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span dir="auto" className="truncate text-[0.8125rem] font-bold text-m-ink">{item.name}</span>
              {(item.receipts || []).length > 0 && (
                <button
                  type="button"
                  onClick={(ev) => {
                    ev.stopPropagation()
                    onPreviewReceipts(item.receipts!)
                  }}
                  title={t('costs.viewReceipt')}
                  className="inline-flex items-center gap-1 rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-2 py-0.5 text-[0.625rem] font-semibold text-m-muted active:scale-95 transition-all"
                >
                  <Receipt size={11} className="text-m-faint" />
                  <span>{t('costs.receipts', { count: item.receipts!.length })}{item.receipts!.length > 1 ? ` (${item.receipts!.length})` : ''}</span>
                </button>
              )}
            </div>
            {line && (
              <div dir="auto" className="mt-[1px] truncate font-geist text-[0.59375rem] text-m-faint">
                {formatMoney(line.entered.amount, line.entered.currency, locale)} {'→'} {formatMoney(line.into.amount, line.into.currency, locale)}
              </div>
            )}
            {members.length > 0 && (
              <div className="mt-[5px] flex flex-wrap gap-1">
                {members.map(m => (
                  <button
                    key={m.user_id}
                    type="button"
                    disabled={!canEdit}
                    aria-pressed={Boolean(m.paid)}
                    onClick={() => onTogglePaid(m.user_id, !m.paid)}
                    className={`inline-flex items-center gap-1 rounded-full py-[2px] ps-[3px] pe-[7px] ${
                      m.paid ? 'border-2 border-[color:var(--m-st-confirmed)]' : 'border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)]'
                    }`}
                  >
                    <MemberAvatar name={m.username} avatarUrl={m.avatar_url} variant="accent" size={14} />
                    <span dir="ltr" className="font-geist text-[0.5625rem] font-bold tabular-nums text-m-ink">
                      {formatMoney(memberShareOf(item, m.user_id, ctx), base, locale)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <span dir="ltr" className="flex-none rounded-full bg-[color:var(--m-ic)] px-[11px] py-1 font-geist text-[0.75rem] font-extrabold tabular-nums text-m-ink">
            {formatMoney(total, base, locale)}
          </span>
        </div>

        {note && <RowNote note={note} />}
      </div>

      {canEdit && (
        <div className="flex flex-none flex-col gap-1 rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] p-[5px]">
          <button type="button" onClick={onEdit} aria-label={`${t('common.edit')}: ${item.name}`} className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-m-muted">
            <Pencil size={12} strokeWidth={2} />
          </button>
          <button type="button" onClick={onDelete} aria-label={`${t('common.delete')}: ${item.name}`} className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-m-muted">
            <Trash2 size={12} strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * A row's note, folded to one line until tapped: a phone row has no width to
 * spare for it. Expenses and payments (#2340) share it.
 */
function RowNote({ note }: { note: string }) {
  const [open, setOpen] = useState(false)
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={() => setOpen(v => !v)}
      className="mt-[7px] flex w-full items-center gap-[7px] rounded-xl bg-[color:var(--m-ic)] px-[9px] py-[6px] text-start"
    >
      <StickyNote size={11} strokeWidth={2} className="flex-none text-m-faint" />
      <span className={`min-w-0 flex-1 text-[0.6875rem] leading-[1.5] text-m-muted ${open ? 'whitespace-pre-wrap [overflow-wrap:anywhere]' : 'truncate'}`}>
        {note}
      </span>
      <ChevronDown
        size={12}
        strokeWidth={2}
        className={`flex-none text-m-faint transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      />
    </button>
  )
}

/**
 * A recorded settle-up payment mixed into the day-grouped ledger (spec 03
 * §3.7 desktop parity — see `CostsPanel.tsx`'s `SettlementRow`). Edit opens
 * `AddPaymentSheet` pre-filled; undo deletes it outright (the recorded
 * transfer is what closes the flow, so undoing it reopens the flow — same
 * as desktop's `undoSettlement`, no confirmation prompt either).
 */
function PaymentRow({ settlement, ctx, base, locale, t, personName, canEdit, onEdit, onUndo }: {
  settlement: CostsSettlement
  ctx: CostsCtx
  base: string
  locale: string
  t: TFn
  personName: (id: number) => string
  canEdit: boolean
  onEdit: () => void
  onUndo: () => void
}) {
  // At the rate it was settled at, not today's (#1445), as on the desktop ledger.
  // A transfer without a currency was entered in the display currency, not the trip's.
  const amount = paymentAmount(settlement, ctx)
  const line = paymentLineOf(settlement, ctx, amount)
  const who = flowText([personName(settlement.from_user_id), personName(settlement.to_user_id)])
  return (
    <div className="mt-2 flex items-center gap-[6px]">
      <div className="relative min-w-0 flex-1 rounded-2xl border border-[color:var(--m-rowbr)] bg-m-card px-3 py-[12px]">
        <div className="flex items-center gap-[10px]">
          <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[12px]" style={{ background: 'rgba(47,163,122,.12)', color: STATUS_COLOR.confirmed }}>
            <ArrowLeftRight size={17} strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[0.8125rem] font-bold text-m-ink">{t('costs.payment')}</div>
            <div className="truncate font-geist text-[0.65625rem] text-m-faint">{who}</div>
            {line && (
              <div dir="auto" className="mt-[1px] truncate font-geist text-[0.59375rem] text-m-faint">
                {formatMoney(line.entered.amount, line.entered.currency, locale)} {'→'} {formatMoney(line.into.amount, line.into.currency, locale)}
              </div>
            )}
          </div>
          <span dir="ltr" className="flex-none rounded-full bg-[color:var(--m-ic)] px-[11px] py-1 font-geist text-[0.75rem] font-extrabold tabular-nums text-m-ink">
            {formatMoney(amount, base, locale)}
          </span>
        </div>
        {settlement.note && <RowNote note={settlement.note} />}
      </div>

      {canEdit && (
        <div className="flex flex-none flex-col gap-1 rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] p-[5px]">
          <button type="button" onClick={onEdit} aria-label={`${t('common.edit')}: ${who}`} className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-m-muted">
            <Pencil size={12} strokeWidth={2} />
          </button>
          <button type="button" onClick={onUndo} aria-label={`${t('costs.undo')}: ${who}`} className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-m-muted">
            <RotateCcw size={12} strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * The three lines behind one traveler's final budget, then the rows they come
 * from. Figures and rows are the server's, in the display currency and netted
 * with the balances; each line is signed by what it does to the final, so the
 * column reads as a subtraction and the rows add up to the line above them.
 */
function FinalBudgetBreakdown({ row, items, ctx, base, locale, t, personName }: {
  row: BudgetParticipantFinal
  items: BudgetItem[]
  ctx: CostsCtx
  base: string
  locale: string
  t: TFn
  personName: (id: number) => string
}) {
  const signed = (v: number) => (v < 0 ? '−' : '+') + formatMoney(Math.abs(v), base, locale)
  const { fronted, moved, outstanding } = finalBudgetSources(row, items)
  const transfer = (fromId: number, toId: number) => flowText([personName(fromId), personName(toId)])
  // Beside a converted row's name, what was entered, as the list above names it (#2525).
  const nameOf = (itemId: number, name: string, shown: number) => {
    const e = items.find(i => i.id === itemId)
    const entered = e ? lineOf(paidByUser(e, row.user_id), e, ctx, shown)?.entered : null
    return entered ? `${name} (${formatMoney(entered.amount, entered.currency, locale)})` : name
  }
  const line = (key: string, label: string, value: string) => (
    <div key={key} className="flex items-baseline gap-2 py-[2px] font-geist text-[0.6875rem]">
      <span className="min-w-0 flex-1 truncate text-m-muted">{label}</span>
      <span dir="ltr" className="flex-none font-semibold tabular-nums text-m-ink">{value}</span>
    </div>
  )
  // Capped and scrollable so a long trip's list can't push the page away.
  const section = (title: string, rows: ReactNode[]) => rows.length > 0 && (
    <div className="mt-2">
      <div className="font-geist text-[0.5625rem] font-bold uppercase tracking-[.09em] text-m-faint">{title}</div>
      <div className="mt-1 max-h-[160px] overflow-y-auto">{rows}</div>
    </div>
  )
  return (
    <div className="mb-2 rounded-xl bg-[color:var(--m-ic)] px-[11px] py-[9px]">
      {line('expenses', t('costs.finalExpenses'), signed(row.expenses))}
      {line('reimbursed', t('costs.finalReimbursed'), signed(-row.reimbursed))}
      {line('pending', t('costs.finalPending'), signed(-row.pending))}
      {section(t('costs.finalExpenses'), fronted.map(r => line(`e${r.item_id}`, nameOf(r.item_id, r.name, r.amount), signed(r.amount))))}
      {section(t('costs.finalReimbursed'), moved.map(r => line(`s${r.settlement_id}`, transfer(r.from_user_id, r.to_user_id), signed(-r.amount))))}
      {section(t('costs.finalPending'), outstanding.map((r, i) => line(`f${i}`, transfer(r.from_user_id, r.to_user_id), signed(-r.amount))))}
    </div>
  )
}

