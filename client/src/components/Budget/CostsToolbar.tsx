import { useCallback, useRef, useState, type ReactNode } from 'react'
import { Check, Download, Filter, Plus, RotateCcw, Rows3, ScanLine, Search, Table2, X } from 'lucide-react'
import { useTranslation } from '../../i18n'
import type { TripMember } from './BudgetPanelMemberChips'
import { Tooltip } from '../shared/Tooltip'
import { POPOVER, POPOVER_CAPTION, POPOVER_DIVIDER, useDismissOnOutside } from '../Packing/packingPopoverStyles'
import { PopoverItem } from '../Packing/PackingPopover'

export type OwnerFilter = 'all' | 'mine' | 'owed'
/** The day-by-day list, or the categorized table the old budget had. */
export type CostsView = 'list' | 'table'

export interface CostsFilterProps {
  query: string
  onQuery: (query: string) => void
  owner: OwnerFilter
  onOwner: (owner: OwnerFilter) => void
  /** The picked category, '' for all; the options start with that "all" entry. */
  category: string
  categoryOptions: { value: string; label: string; icon?: ReactNode }[]
  onCategory: (category: string) => void
  /** The picked day as YYYY-MM-DD, '' for all; the options start with that "all" entry. */
  day: string
  dayOptions: { value: string; label: string }[]
  onDay: (day: string) => void
  onResetFilters: () => void
  onExport: () => void
  canExport: boolean
}

interface CostsToolbarProps {
  /** The trip's span as a formatted range and its length in days; null for a trip without dates. */
  dateMeta: { range: string; days: number } | null
  people: TripMember[]
  me: number
  colorFor: (userId: number) => string
  canEdit: boolean
  /** Whether there is any suggested transfer left to settle. */
  canSettle: boolean
  onSettleAll: () => void
  onAddExpense: () => void
  /** Opens the receipt scan; left out when the AI model reads no images. */
  onScanReceipt?: () => void
  /** Search, filters and export, the way the Transports and Bookings bars carry them. */
  filters?: CostsFilterProps
  /** The switch between the list and the table; left out, the bar has none. */
  view?: CostsView
  onView?: (view: CostsView) => void
}

const BODY_SIZE = 'calc(13px * var(--fs-scale-body, 1))'
/** A 36 px control on the bar, in the card colour so it reads on the bar's tint. */
const BAR_BTN = 'relative grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-surface-card text-content-secondary hover:text-content disabled:cursor-default disabled:opacity-40'

/**
 * The bar on top of the Costs tab, in the same shape as the one Transports,
 * Bookings, Lists and Files open with: the tab's name and what the numbers
 * cover, then how to narrow the ledger and the actions on the right.
 */
export default function CostsToolbar({ dateMeta, people, me, colorFor, canEdit, canSettle, onSettleAll, onAddExpense, onScanReceipt, filters, view, onView }: CostsToolbarProps) {
  const { t } = useTranslation()
  const searchRef = useRef<HTMLInputElement>(null)
  const chip = 'inline-flex items-center whitespace-nowrap rounded-full bg-surface-card px-3 py-1.5 font-medium text-content-muted shadow-sm'
  const button = 'inline-flex h-9 items-center gap-1.5 rounded-[10px] border-0 px-3.5 font-medium hover:opacity-[0.88]'

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2.5 rounded-[18px] bg-surface-tertiary py-3 pl-[22px] pr-3">
      <h2 className="m-0 shrink-0 text-subtitle font-semibold tracking-[-0.01em] text-content">{t('trip.tabs.budget')}</h2>
      <div className="mx-1.5 h-[22px] w-px shrink-0 bg-edge-faint" />
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5" style={{ fontSize: BODY_SIZE }}>
        {dateMeta && (
          <span className={`${chip} gap-3`}>
            {dateMeta.range}
            {/* One pill in two fields, cut straight through in the bar's colour rather than two rounded halves. */}
            <span aria-hidden className="-my-1.5 w-[3px] self-stretch bg-surface-tertiary" />
            <b className="text-content">{t('costs.daysCount', { count: dateMeta.days })}</b>
          </span>
        )}
        <span className={`${chip} gap-2 pl-1.5`}>
          <span className="inline-flex">
            {people.slice(0, 4).map((p, i) => {
              const ring = { width: 22, height: 22, marginLeft: i ? -8 : 0 }
              return p.avatar_url
                ? <img key={p.id} src={p.avatar_url} alt="" className="block shrink-0 rounded-full border-2 border-surface-card object-cover" style={ring} />
                : (
                  <span key={p.id} className="grid shrink-0 place-items-center rounded-full border-2 border-surface-card font-bold" style={{
                    ...ring, background: colorFor(p.id), fontSize: 'calc(9px * var(--fs-scale-caption, 1))',
                    color: '#fff', // theme-lint-disable: an initial on the member's own colour
                  }}>{(p.id === me ? t('costs.youShort') : p.username.charAt(0)).toUpperCase()}</span>
                )
            })}
          </span>
          <b className="text-content">{t('costs.travelers', { count: people.length })}</b>
        </span>
      </div>

      {filters && (
        <>
          <label className="flex h-9 w-[200px] items-center gap-2 rounded-[10px] bg-surface-card px-3 text-content-faint focus-within:ring-2 focus-within:ring-[color:var(--text-primary)]">
            <Search size={14} strokeWidth={2} className="flex-none" />
            <input
              ref={searchRef}
              value={filters.query}
              onChange={e => filters.onQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') { filters.onQuery(''); searchRef.current?.blur() } }}
              placeholder={t('costs.searchPlaceholder')}
              aria-label={t('common.search')}
              className="min-w-0 flex-1 border-0 bg-transparent text-content outline-none placeholder:text-content-faint dark:bg-transparent"
              style={{ fontSize: BODY_SIZE }}
            />
            {filters.query && (
              <Tooltip label={t('common.clear')}>
                <button type="button" onClick={() => filters.onQuery('')} aria-label={t('common.clear')} className="flex-none text-content-faint hover:text-content"><X size={13} /></button>
              </Tooltip>
            )}
          </label>
          <FilterMenu {...filters} />
          <Tooltip label={t('budget.exportCsv')}>
            <button type="button" onClick={filters.onExport} disabled={!filters.canExport} aria-label={t('budget.exportCsv')} className={BAR_BTN}>
              <Download size={15} strokeWidth={2} />
            </button>
          </Tooltip>
        </>
      )}

      {view && onView && (
        // The same switch the Bookings bar has for its views.
        <div role="group" aria-label={t('costs.view.label')} className="inline-flex flex-none rounded-[10px] bg-surface-card p-[3px]">
          {([['list', Rows3, t('costs.view.list')], ['table', Table2, t('costs.view.table')]] as const).map(([v, Icon, label]) => (
            <Tooltip key={v} label={label}>
              <button type="button" onClick={() => onView(v)} aria-pressed={view === v} aria-label={label}
                className={`grid h-[30px] w-[34px] place-items-center rounded-[8px] transition-colors ${view === v ? 'bg-accent text-accent-text' : 'text-content-muted hover:text-content'}`}>
                <Icon size={15} strokeWidth={2} />
              </button>
            </Tooltip>
          ))}
        </div>
      )}

      {canEdit && (
        <>
          {filters && <span className="mx-0.5 h-[22px] w-px flex-none bg-edge-faint" />}
          <div className="flex shrink-0 flex-wrap gap-1.5" style={{ fontSize: BODY_SIZE }}>
            <button type="button" onClick={onSettleAll} disabled={!canSettle}
              className={`${button} bg-surface-card text-content disabled:cursor-default disabled:opacity-40`}>
              <Check size={14} strokeWidth={2.5} />
              {t('costs.settleUp')}
            </button>
            {onScanReceipt && (
              <button type="button" onClick={onScanReceipt} className={`${button} bg-surface-card text-content`}>
                <ScanLine size={14} strokeWidth={2.5} />
                {t('costs.scan.button')}
              </button>
            )}
            <button type="button" onClick={onAddExpense} className={`${button} bg-accent text-accent-text`}>
              <Plus size={14} strokeWidth={2.5} />
              {t('costs.addExpense')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/** Whose expenses, which category and which day, in one place; the button counts what is switched on. */
function FilterMenu(f: CostsFilterProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismissOnOutside(ref, open, close)
  const active = (f.owner !== 'all' ? 1 : 0) + (f.category ? 1 : 0) + (f.day ? 1 : 0)
  const owners: [OwnerFilter, string][] = [['all', t('costs.filter.all')], ['mine', t('costs.filter.mine')], ['owed', t('costs.filter.owed')]]

  return (
    <div ref={ref} className="relative flex-none">
      <Tooltip label={t('reservations.filter')}>
        <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label={t('reservations.filter')} className={`${BAR_BTN} ${active ? 'text-content' : ''}`}>
          <Filter size={15} strokeWidth={2} />
          {active > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 font-geist font-bold text-accent-text" style={{ fontSize: 'calc(9px * var(--fs-scale-caption, 1))' }}>{active}</span>}
        </button>
      </Tooltip>
      {open && (
        <div role="menu" onKeyDown={e => { if (e.key === 'Escape') close() }} className="absolute right-0 top-11 z-30" style={{ ...POPOVER, width: 310 }}>
          <div className="mx-1.5 mb-1 mt-1.5 flex rounded-[10px] bg-surface-tertiary p-[3px]">
            {owners.map(([o, label]) => (
              <button key={o} type="button" onClick={() => f.onOwner(o)} aria-pressed={f.owner === o}
                className={`flex-1 rounded-[8px] py-1 font-medium ${f.owner === o ? 'bg-surface-card text-content shadow-sm' : 'text-content-muted hover:text-content'}`}
                style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))' }}>
                {label}
              </button>
            ))}
          </div>

          <div style={POPOVER_DIVIDER} />
          <div style={POPOVER_CAPTION}>{t('costs.category')}</div>
          <div className="max-h-[220px] overflow-y-auto">
            {f.categoryOptions.map(o => (
              <PopoverItem key={o.value || 'all'} active={f.category === o.value} onClick={() => f.onCategory(o.value)}
                icon={o.icon ?? null} label={o.label}
                trailing={f.category === o.value ? <Check size={13} className="text-content-muted" /> : undefined} />
            ))}
          </div>

          <div style={POPOVER_DIVIDER} />
          <div style={POPOVER_CAPTION}>{t('costs.day')}</div>
          <div className="max-h-[220px] overflow-y-auto">
            {f.dayOptions.map(o => (
              <PopoverItem key={o.value || 'all'} active={f.day === o.value} onClick={() => f.onDay(o.value)} icon={null} label={o.label}
                trailing={f.day === o.value ? <Check size={13} className="text-content-muted" /> : undefined} />
            ))}
          </div>

          {active > 0 && (
            <>
              <div style={POPOVER_DIVIDER} />
              <PopoverItem icon={<RotateCcw size={14} />} label={t('reservations.resetFilters')} onClick={() => { f.onResetFilters(); close() }} />
            </>
          )}
        </div>
      )}
    </div>
  )
}
