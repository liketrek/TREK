import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { ChevronDown, Lock, Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from '../../i18n'
import type { BudgetItem } from '../../types'
import { NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { Segmented } from '../shared/dialogParts'
import { Tooltip } from '../shared/Tooltip'
import { CustomDatePicker } from '../shared/CustomDateTimePicker'
import { MoreButton, tintOf } from '../Planner/planParts'
import { COST_CATEGORY_LIST, catMeta } from './costsCategories'
import { calcPD, calcPP, calcPPD, hasCustomMemberSplit, normalizePastedAmount } from './BudgetPanel.helpers'

/**
 * The Costs tab as a categorized table: the planning view the old budget had,
 * built on the same expenses the list shows. Name, date, total, persons and days
 * edit in place; everything a split or a payer needs stays in the expense
 * dialog, which each row opens.
 */

type EditableField = 'name' | 'total_price' | 'persons' | 'days'

export interface CostsTableProps {
  /** The expenses left after the bar's search and filters. */
  items: BudgetItem[]
  /** The display currency everything is shown in. */
  base: string
  canEdit: boolean
  /** An expense's total in the display currency, booked at its frozen rate. */
  baseTotal: (e: BudgetItem) => number
  /** Any amount of an expense in the display currency. */
  toBase: (amount: number, e: BudgetItem) => number
  /** The currency an expense was entered in. */
  currencyOf: (e: BudgetItem) => string
  fmt: (amount: number) => string
  personName: (userId: number) => string
  onUpdate: (id: number, patch: Partial<BudgetItem>) => Promise<unknown>
  /** Creates an empty expense in a category and resolves with it. */
  onAdd: (category: string, expenseDate: string | null) => Promise<BudgetItem | null | undefined>
  onOpen: (e: BudgetItem) => void
  onDelete: (id: number) => void
}

// Every column is centred on its title except the name, which reads from the left.
const HEAD_BASE = 'px-3 py-2.5 font-geist font-bold uppercase tracking-[.08em] text-content-faint'
const HEAD = `${HEAD_BASE} text-center`
const CELL = 'px-3 py-2 text-center tabular-nums text-content'
/** The three worked-out columns sit on their own quiet ground, apart from what is typed in. */
const CALC = 'bg-surface-secondary'
/** A value you can change, shown the way the rest of the app shows a fact: a white badge. */
const BADGE = 'inline-flex h-6 min-w-[40px] items-center justify-center rounded-full bg-surface-card px-2.5 font-geist tabular-nums text-content shadow-sm ring-1 ring-edge-faint'
/** The same place with nothing in it yet: a dashed outline and a plus that says it takes a value. */
const BADGE_EMPTY = 'inline-flex h-6 min-w-[40px] items-center justify-center rounded-full border border-dashed border-edge text-content-faint transition-colors group-hover:border-content-faint'
/** Shown and edited, a cell keeps one height, so a row never grows while you type in it. */
const CELL_H = 'h-7'
const INPUT = `${CELL_H} w-full min-w-0 rounded-[8px] border border-edge bg-surface-input px-1.5 py-0 leading-none text-content outline-none focus:ring-2 focus:ring-[color:var(--text-primary)]`

const hasPayers = (e: BudgetItem) => (e.payers || []).some(p => p.amount !== 0)

export default function CostsTable(p: CostsTableProps) {
  const { t, locale } = useTranslation()
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<{ id: number; field: EditableField } | null>(null)

  const groups = useMemo(() => {
    const byKey = new Map<string, BudgetItem[]>()
    for (const e of p.items) {
      const key = catMeta(e.category).key
      if (!byKey.has(key)) byKey.set(key, [])
      byKey.get(key)!.push(e)
    }
    // The category order of the dialog, each group oldest first like a ledger on paper.
    return COST_CATEGORY_LIST
      .filter(c => byKey.has(c.key))
      .map(c => ({ meta: c, items: byKey.get(c.key)!.slice().sort((a, b) => (a.expense_date || '￿').localeCompare(b.expense_date || '￿') || a.id - b.id) }))
  }, [p.items])

  const grandTotal = p.items.reduce((sum, e) => sum + p.baseTotal(e), 0)
  const numFmt = (v: number | null) => v == null ? '' : new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)

  const toggle = (key: string) => setCollapsed(prev => {
    const next = new Set(prev)
    if (next.has(key)) next.delete(key); else next.add(key)
    return next
  })

  // A new row takes the latest date of its category, so back-filling a day goes quickly.
  const add = async (category: string) => {
    const dates = p.items.filter(e => catMeta(e.category).key === category && e.expense_date).map(e => e.expense_date as string).sort((a, b) => a.localeCompare(b))
    const created = await p.onAdd(category, dates.length ? dates[dates.length - 1] : null)
    if (created) setEditing({ id: created.id, field: 'name' })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-2xl border border-edge-faint bg-surface-card">
        <table className="w-full min-w-[820px] border-collapse" style={fs(13, 'body')}>
          <colgroup>
            <col />
            <col className="w-[132px]" />
            <col className="w-[128px]" />
            <col className="w-[84px]" />
            <col className="w-[72px]" />
            <col className={`w-[104px] ${CALC}`} />
            <col className={`w-[96px] ${CALC}`} />
            <col className={`w-[104px] ${CALC}`} />
            <col className="w-11" />
          </colgroup>
          <thead>
            <tr className="border-b border-edge-faint bg-surface-tertiary" style={fs(10)}>
              <th scope="col" className={`${HEAD_BASE} text-left`}>{t('budget.table.name')}</th>
              <th scope="col" className={HEAD}>{t('budget.table.date')}</th>
              <th scope="col" className={HEAD}>{t('budget.table.total')}</th>
              <th scope="col" className={HEAD}>{t('budget.table.persons')}</th>
              <th scope="col" className={HEAD}>{t('budget.table.days')}</th>
              <th scope="col" className={HEAD}>{t('budget.table.perPerson')}</th>
              <th scope="col" className={HEAD}>{t('budget.table.perDay')}</th>
              <th scope="col" className={HEAD}>{t('budget.table.perPersonDay')}</th>
              <th scope="col"><span className="sr-only">{t('files.menu')}</span></th>
            </tr>
          </thead>
          {groups.map(({ meta, items }) => {
            const open = !collapsed.has(meta.key)
            const subtotal = items.reduce((sum, e) => sum + p.baseTotal(e), 0)
            return (
              <tbody key={meta.key}>
                <tr className="border-t border-edge-faint" style={{ background: tintOf(meta.color, 9) }}>
                  <th scope="rowgroup" colSpan={2} className="px-2 py-2 text-left font-normal">
                    <button type="button" onClick={() => toggle(meta.key)} aria-expanded={open}
                      className="inline-flex items-center gap-2.5 rounded-[10px] py-0.5 pl-1 pr-2 hover:bg-surface-card">
                      <ChevronDown size={14} strokeWidth={2.2} className={`text-content-faint transition-transform ${open ? '' : '-rotate-90'}`} />
                      <span className="grid h-7 w-7 place-items-center rounded-[9px] bg-surface-card shadow-sm">
                        <meta.Icon size={14} strokeWidth={2.2} style={{ color: meta.color }} />
                      </span>
                      <span className="font-semibold text-content">{t(meta.labelKey)}</span>
                      <span className="rounded-full bg-surface-card px-2 py-px font-geist tabular-nums text-content-muted shadow-sm" style={fs(10.5)}>{items.length}</span>
                    </button>
                  </th>
                  <td className="px-3 py-2 text-center">
                    <span className="inline-flex rounded-full bg-surface-card px-2.5 py-[3px] font-geist font-semibold tabular-nums text-content shadow-sm" style={fs(12, 'body')}>{p.fmt(subtotal)}</span>
                  </td>
                  <td colSpan={6} />
                </tr>
                {open && items.map(e => (
                  <Row key={e.id} e={e} p={p} editing={editing} setEditing={setEditing} numFmt={numFmt} />
                ))}
                {open && p.canEdit && (
                  <tr className="border-t border-edge-faint">
                    <td colSpan={9} className="px-3 py-1.5">
                      <button type="button" onClick={() => void add(meta.key)}
                        className="inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3 font-medium text-content-muted hover:bg-surface-hover hover:text-content"
                        style={fs(12, 'body')}>
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-surface-card shadow-sm ring-1 ring-edge-faint"><Plus size={12} strokeWidth={2.4} /></span>
                        {t('costs.addExpense')}
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            )
          })}
          <tfoot>
            <tr className="border-t border-edge" style={{ background: NEUTRAL_TINT }}>
              <th scope="row" colSpan={2} className="px-3 py-3 text-left font-geist font-bold uppercase tracking-[.08em] text-content-muted" style={fs(10.5)}>
                {t('budget.total')}
                <span className="ml-2 rounded-full bg-surface-card px-2 py-px font-normal normal-case tracking-normal text-content-muted shadow-sm" style={fs(10.5)}>{p.items.length}</span>
              </th>
              <td className="px-3 py-3 text-center">
                <span className="inline-flex rounded-full bg-accent px-3 py-1 font-geist font-bold tabular-nums text-accent-text" style={fs(13, 'body')}>{p.fmt(grandTotal)}</span>
              </td>
              <td colSpan={6} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

/** One expense as a table row, its own cells editable in place. */
function Row({ e, p, editing, setEditing, numFmt }: {
  e: BudgetItem
  p: CostsTableProps
  editing: { id: number; field: EditableField } | null
  setEditing: (v: { id: number; field: EditableField } | null) => void
  numFmt: (v: number | null) => string
}) {
  const { t, locale } = useTranslation()
  const total = p.baseTotal(e)
  const custom = hasCustomMemberSplit(e)
  const persons = e.persons ?? null
  const days = e.days ?? null
  const foreign = p.currencyOf(e) !== p.base
  // A total someone paid is the sum of what they paid, and a foreign one is shown
  // converted: both change in the expense itself, where the split and the rate live.
  const totalLock = hasPayers(e) ? t('costs.table.lockedPayer') : foreign ? t('costs.table.lockedCurrency', { currency: p.currencyOf(e) }) : null
  const isEditing = (field: EditableField) => editing?.id === e.id && editing.field === field
  const save = (patch: Partial<BudgetItem>) => { setEditing(null); void p.onUpdate(e.id, patch) }
  const dateText = e.expense_date
    ? (() => { try { return new Date(e.expense_date + 'T00:00:00Z').toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }) } catch { return e.expense_date } })()
    : ''

  return (
    <tr className="group border-t border-edge-faint hover:bg-surface-hover">
      <td className="px-3 py-2 text-left">
        <EditCell label={t('budget.table.name')} text={e.name} canEdit={p.canEdit} editing={isEditing('name')} onEdit={() => setEditing({ id: e.id, field: 'name' })}
          display={<span className="block truncate font-medium">{e.name}</span>}
          input={<TextInput value={e.name} onSave={v => { if (v.trim()) save({ name: v.trim() }); else setEditing(null) }} onCancel={() => setEditing(null)} label={t('budget.table.name')} />} />
      </td>
      <td className="px-3 py-2 text-center">
        {p.canEdit ? (
          // The app's own calendar, the way the old table picked a day.
          <div className={`mx-auto flex ${CELL_H} w-fit max-w-[132px] items-center rounded-full bg-surface-tertiary px-2`} aria-label={t('budget.table.date')}>
            <CustomDatePicker value={e.expense_date || ''} onChange={v => void p.onUpdate(e.id, { expense_date: v || null })} placeholder={t('costs.noDate')} compact borderless />
          </div>
        ) : (
          <span className="inline-flex rounded-full bg-surface-tertiary px-3.5 py-[3px] text-content-secondary" style={fs(12, 'body')}>{dateText || t('costs.noDate')}</span>
        )}
      </td>
      <td className={CELL}>
        {totalLock ? (
          <Tooltip label={totalLock} placement="top">
            <button type="button" onClick={() => p.onOpen(e)} aria-label={`${t('budget.table.total')}: ${p.fmt(total)}`}
              className="inline-flex min-h-7 w-full items-center justify-center gap-1.5 rounded-[8px] px-1.5 hover:bg-surface-card">
              <Lock size={10} strokeWidth={2.4} className="flex-none text-content-faint" />
              <span className="flex flex-col items-center leading-tight">
                <span className="font-semibold">{p.fmt(total)}</span>
                {foreign && <span className="mt-0.5 rounded-full bg-surface-tertiary px-1.5 font-geist text-content-muted" style={fs(10)}>{numFmt(e.total_price || 0)} {p.currencyOf(e)}</span>}
              </span>
            </button>
          </Tooltip>
        ) : (
          <EditCell label={t('budget.table.total')} text={p.fmt(total)} canEdit={p.canEdit} editing={isEditing('total_price')} onEdit={() => setEditing({ id: e.id, field: 'total_price' })} align="center"
            display={<span className="font-semibold">{p.fmt(total)}</span>}
            input={<TextInput value={String(e.total_price ?? '')} numeric onSave={v => {
              const n = Number(normalizePastedAmount(v))
              if (v.trim() && Number.isFinite(n)) save({ total_price: n }); else setEditing(null)
            }} onCancel={() => setEditing(null)} label={t('budget.table.total')} />} />
        )}
      </td>
      {(['persons', 'days'] as const).map(field => {
        const value = field === 'persons' ? persons : days
        return (
          <td key={field} className="px-2 py-2 text-center tabular-nums">
            <EditCell label={t(`budget.table.${field}`)} text={value == null ? '' : String(value)} canEdit={p.canEdit} editing={isEditing(field)} onEdit={() => setEditing({ id: e.id, field })} align="center"
              display={value == null
                ? <span className={BADGE_EMPTY}>{p.canEdit ? <Plus size={11} strokeWidth={2.4} /> : null}</span>
                : <span className={BADGE} style={fs(12, 'body')}>{value}</span>}
              input={<TextInput value={value == null ? '' : String(value)} numeric onSave={v => {
                const n = Number.parseInt(v, 10)
                save({ [field]: v.trim() === '' ? null : Number.isFinite(n) && n > 0 ? n : null } as Partial<BudgetItem>)
              }} onCancel={() => setEditing(null)} label={t(`budget.table.${field}`)} />} />
          </td>
        )
      })}
      {/* An uneven split has no single share per person, so those columns stay empty (#1458). */}
      <td className={`${CELL} text-content-secondary`}>{custom ? '' : numFmt(calcPP(total, persons))}</td>
      <td className={`${CELL} text-content-secondary`}>{numFmt(calcPD(total, days))}</td>
      <td className={`${CELL} text-content-secondary`}>{custom ? '' : numFmt(calcPPD(total, persons, days))}</td>
      <td className="px-1 py-1 text-center">
        <MoreButton label={t('files.menu')} items={[
          { label: p.canEdit ? t('common.edit') : t('common.open'), icon: Pencil, onClick: () => p.onOpen(e) },
          p.canEdit && { divider: true },
          p.canEdit && { label: t('common.delete'), icon: Trash2, danger: true, onClick: () => p.onDelete(e.id) },
        ]} size={26} />
      </td>
    </tr>
  )
}

/** A value that turns into a field on a click (or Enter), when the viewer may edit. */
function EditCell({ label, text, canEdit, editing, onEdit, display, input, align = 'left' }: {
  label: string
  /** The value as words, for the button's name: "Total: 45.00". */
  text: string
  canEdit: boolean
  editing: boolean
  onEdit: () => void
  display: ReactNode
  input: ReactNode
  align?: 'left' | 'right' | 'center'
}) {
  const justify = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'
  if (editing) return <>{input}</>
  if (!canEdit) return <span className={`flex ${CELL_H} min-w-0 items-center ${justify}`}>{display}</span>
  return (
    <button type="button" onClick={onEdit} aria-label={text ? `${label}: ${text}` : label}
      className={`flex ${CELL_H} w-full min-w-0 items-center rounded-[8px] px-1.5 hover:bg-surface-card ${justify}`}>
      {display}
    </button>
  )
}

/** The field a cell becomes: Enter or Tab keeps it, Escape leaves it as it was. */
function TextInput({ value, onSave, onCancel, label, numeric = false }: {
  value: string
  onSave: (v: string) => void
  onCancel: () => void
  label: string
  numeric?: boolean
}) {
  const [draft, setDraft] = useState(value)
  const done = useRef(false)
  const finish = (fn: () => void) => { if (done.current) return; done.current = true; fn() }
  const onKey = (ev: KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === 'Enter') { ev.preventDefault(); finish(() => onSave(draft)) }
    // Spent here: the field lets go, the page around it stays.
    if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); finish(onCancel) }
  }
  return (
    <input autoFocus type="text" value={draft} aria-label={label} inputMode={numeric ? 'decimal' : undefined}
      onChange={ev => setDraft(ev.target.value)} onKeyDown={onKey} onBlur={() => finish(() => onSave(draft))}
      className={`${INPUT} ${numeric ? 'text-center tabular-nums' : ''}`} />
  )
}

export type CostsSummaryTab = 'category' | 'date' | 'payer' | 'status'

/** The four ways the old budget summed the table up: by category, by day, by payer, paid against open. */
export function CostsTableSummary({ items, baseTotal, toBase, fmt, personName }: Pick<CostsTableProps, 'items' | 'baseTotal' | 'toBase' | 'fmt' | 'personName'>) {
  const { t, locale } = useTranslation()
  const [tab, setTab] = useState<CostsSummaryTab>('category')

  const rows = useMemo((): { key: string; label: string; amount: number; color?: string }[] => {
    const sum = new Map<string, { label: string; amount: number; color?: string }>()
    const addTo = (key: string, label: string, amount: number, color?: string) => {
      const prev = sum.get(key)
      sum.set(key, { label, amount: (prev?.amount ?? 0) + amount, color })
    }
    for (const e of items) {
      const total = baseTotal(e)
      if (tab === 'category') {
        const m = catMeta(e.category)
        addTo(m.key, t(m.labelKey), total, m.color)
      } else if (tab === 'date') {
        const d = e.expense_date || ''
        const label = d
          ? (() => { try { return new Date(d + 'T00:00:00Z').toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }) } catch { return d } })()
          : t('costs.noDate')
        addTo(d || '￿', label, total)
      } else if (tab === 'payer') {
        const paid = (e.payers || []).filter(x => x.amount !== 0)
        if (paid.length === 0) addTo('none', t('costs.table.noPayer'), total)
        for (const x of paid) addTo(String(x.user_id), personName(x.user_id), toBase(x.amount, e))
      } else if (hasPayers(e)) {
        addTo('paid', t('costs.table.paid'), total, 'var(--success)')
      } else {
        addTo('open', t('costs.table.open'), total, 'var(--warning)')
      }
    }
    const list = Array.from(sum.entries()).map(([key, v]) => ({ key, ...v }))
    if (tab === 'date') return list.sort((a, b) => a.key.localeCompare(b.key))
    return list.sort((a, b) => b.amount - a.amount)
  }, [items, tab, baseTotal, toBase, personName, locale, t])

  const max = Math.max(1, ...rows.map(r => Math.abs(r.amount)))

  return (
    <section aria-label={t('costs.table.summary')} className="overflow-hidden rounded-2xl border border-edge-faint bg-surface-secondary">
      <div className="flex flex-col gap-2.5 border-b border-edge-faint px-4 py-3" style={{ background: NEUTRAL_TINT }}>
        <span className="font-geist font-bold uppercase tracking-[.08em] text-content-faint" style={fs(11)}>{t('costs.table.summary')}</span>
        <Segmented<CostsSummaryTab> value={tab} onChange={setTab} label={t('costs.table.summary')} fill options={[
          { value: 'category', label: t('costs.table.byCategory') },
          { value: 'date', label: t('costs.table.byDate') },
          { value: 'payer', label: t('costs.table.byPayer') },
          { value: 'status', label: t('costs.table.byStatus') },
        ]} />
      </div>
      <ul className="m-0 flex list-none flex-col gap-3 p-4">
        {rows.length === 0 && <li className="text-content-faint" style={fs(12.5, 'body')}>{t('costs.emptyText')}</li>}
        {rows.map(r => (
          <li key={r.key} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2" style={fs(12.5, 'body')}>
              <span className="flex min-w-0 items-center gap-1.5 text-content">
                {r.color && <span className="h-2 w-2 flex-none rounded-full" style={{ background: r.color }} />}
                <span className="truncate">{r.label}</span>
              </span>
              <span className="flex-none rounded-full bg-surface-card px-2 py-px font-geist font-semibold tabular-nums text-content shadow-sm">{fmt(r.amount)}</span>
            </div>
            <span className="block h-1.5 overflow-hidden rounded-full bg-surface-tertiary">
              <span className="block h-full rounded-full" style={{ width: `${Math.round((Math.abs(r.amount) / max) * 100)}%`, background: r.color || 'var(--accent)' }} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
