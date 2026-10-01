import { useCallback, useRef, useState, type ReactNode } from 'react'
import {
  ArrowDownUp, CalendarDays, Check, Download, FileSpreadsheet, Filter, GanttChart, Layers, LayoutGrid, Plane, Plus, RotateCcw, Rows3,
  Search, SlidersHorizontal, Tag, X,
} from 'lucide-react'
import { useTranslation } from '../../../i18n'
import type { TripMember } from '../../Budget/BudgetPanelMemberChips'
import ToggleSwitch from '../../Settings/ToggleSwitch'
import { POPOVER, POPOVER_CAPTION, POPOVER_DIVIDER, useDismissOnOutside } from '../../Packing/packingPopoverStyles'
import { PopoverItem } from '../../Packing/PackingPopover'
import { Tooltip } from '../../shared/Tooltip'
import { typeInfo, type BookingsView, type GroupBy, type SortBy, type StatusFilter } from './bookingsModel'
import { CountPill, fs } from './bookingParts'

export interface BookingsHeaderProps {
  title: string
  total: number
  canEdit: boolean
  addLabel: string
  onAdd: () => void
  onImport?: () => void
  onAirTrail?: () => void
  view: BookingsView
  onView: (v: BookingsView) => void
  status: StatusFilter
  onStatus: (s: StatusFilter) => void
  query: string
  onQuery: (q: string) => void
  shown: number
  filtering: boolean
  onResetFilters: () => void
  types: { type: string; count: number }[]
  activeTypes: Set<string>
  onToggleType: (type: string) => void
  onAllTypes: () => void
  members: TripMember[]
  showTravelers: boolean
  activeTravelers: Set<number>
  onToggleTraveler: (id: number) => void
  onClearTravelers: () => void
  group: GroupBy
  onGroup: (g: GroupBy) => void
  sort: SortBy
  sortDir: 'asc' | 'desc'
  onSort: (s: SortBy) => void
  onSortDir: () => void
  byType: boolean
  onByType: () => void
  showContext: boolean
  onShowContext: () => void
  transitApart: boolean
  /** Set only where the choice changes something: cards grouped by status, with transit to place. */
  onTransitApart?: () => void
  viewIsDefault: boolean
  onResetView: () => void
  /** Downloads what is shown as a CSV (#1360). */
  onExport?: () => void
}

/** A 36 px control on the bar, in the card colour so it reads on the bar's tint. */
const BAR_BTN = 'relative grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-surface-card text-content-secondary hover:text-content'

/**
 * One bar, as on the other planner tabs: what this is on the left, how to look
 * at it and what to add on the right. Filters and view options wait in their
 * popovers, so the page below starts with the bookings themselves.
 */
export default function BookingsHeader(p: BookingsHeaderProps) {
  const { t } = useTranslation()
  const searchRef = useRef<HTMLInputElement>(null)
  const views: [BookingsView, typeof LayoutGrid, string][] = [
    ['cards', LayoutGrid, t('reservations.view.cards')],
    ['list', Rows3, t('reservations.view.list')],
    ['timeline', GanttChart, t('reservations.view.timeline')],
  ]
  const hasEntries = p.total > 0

  return (
    <div className="flex flex-wrap items-center gap-2.5 rounded-[18px] bg-surface-tertiary py-3 pl-[22px] pr-3">
      <h2 className="m-0 shrink-0 text-subtitle font-semibold tracking-[-0.01em] text-content">{p.title}</h2>
      <span className="flex-1" />

      {hasEntries && (
        <>
          <label className="flex h-9 w-[200px] items-center gap-2 rounded-[10px] bg-surface-card px-3 text-content-faint focus-within:ring-2 focus-within:ring-[color:var(--text-primary)]">
            <Search size={14} strokeWidth={2} className="flex-none" />
            <input
              ref={searchRef}
              value={p.query}
              onChange={e => p.onQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') { p.onQuery(''); searchRef.current?.blur() } }}
              placeholder={t('reservations.searchPlaceholder')}
              aria-label={t('common.search')}
              className="min-w-0 flex-1 border-0 bg-transparent text-content outline-none placeholder:text-content-faint"
              style={fs(13, 'body')}
            />
            {p.query && (
              <Tooltip label={t('common.clear')}>
                <button type="button" onClick={() => p.onQuery('')} aria-label={t('common.clear')} className="flex-none text-content-faint hover:text-content"><X size={13} /></button>
              </Tooltip>
            )}
          </label>
          {p.filtering && (
            <Tooltip label={t('reservations.resetFilters')}>
              <button type="button" onClick={p.onResetFilters}
                className="inline-flex h-9 flex-none items-center gap-1 rounded-[10px] bg-surface-card px-2.5 font-geist font-semibold tabular-nums text-content-muted hover:text-content" style={fs(12)}>
                {t('reservations.results', { shown: p.shown, total: p.total })}<X size={12} />
              </button>
            </Tooltip>
          )}
          <FilterMenu {...p} />
          <div className="inline-flex flex-none rounded-[10px] bg-surface-card p-[3px]" role="group" aria-label={t('reservations.view.label')}>
            {views.map(([v, Icon, label]) => (
              <Tooltip key={v} label={label}>
                <button type="button" onClick={() => p.onView(v)} aria-pressed={p.view === v} aria-label={label}
                  className={`grid h-[30px] w-[34px] place-items-center rounded-[8px] ${p.view === v ? 'bg-accent text-accent-text' : 'text-content-muted hover:text-content'}`}>
                  <Icon size={15} strokeWidth={2} />
                </button>
              </Tooltip>
            ))}
          </div>
          <ViewOptions {...p} />
          {p.onExport && (
            <Tooltip label={t('reservations.exportCsv')}>
              <button type="button" onClick={p.onExport} aria-label={t('reservations.exportCsv')} className={BAR_BTN}><FileSpreadsheet size={15} strokeWidth={2} /></button>
            </Tooltip>
          )}
        </>
      )}

      {p.canEdit && (
        <>
          {hasEntries && <span className="mx-0.5 h-[22px] w-px flex-none bg-edge-faint" />}
          {p.onImport && (
            <Tooltip label={t('reservations.import.title')}>
              <button type="button" onClick={p.onImport} aria-label={t('reservations.import.title')} className={BAR_BTN}><Download size={15} strokeWidth={2} /></button>
            </Tooltip>
          )}
          {p.onAirTrail && (
            <Tooltip label={t('reservations.airtrail.title')}>
              <button type="button" onClick={p.onAirTrail} aria-label={t('reservations.airtrail.title')} className={BAR_BTN}><Plane size={15} strokeWidth={2} /></button>
            </Tooltip>
          )}
          <button type="button" onClick={p.onAdd} className="inline-flex h-9 flex-none items-center gap-1.5 rounded-[10px] bg-accent px-3.5 font-medium text-accent-text hover:opacity-90" style={fs(13, 'body')}>
            <Plus size={14} strokeWidth={2.5} />{p.addLabel}
          </button>
        </>
      )}
    </div>
  )
}

/** Opens a popover under a bar button and closes it on a press outside or on Escape. */
function usePopover() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismissOnOutside(ref, open, close)
  return { open, setOpen, ref, close }
}

function Menu({ children, onClose, width = 260 }: { children: ReactNode; onClose: () => void; width?: number }) {
  return (
    <div role="menu" onKeyDown={e => { if (e.key === 'Escape') onClose() }} className="absolute right-0 top-11 z-30" style={{ ...POPOVER, width }}>
      {children}
    </div>
  )
}

/** Status, types and travellers in one place; the button counts what is switched on. */
function FilterMenu(p: BookingsHeaderProps) {
  const { t } = useTranslation()
  const { open, setOpen, ref, close } = usePopover()
  const active = (p.status !== 'all' ? 1 : 0) + p.activeTypes.size + p.activeTravelers.size
  const statuses: [StatusFilter, string][] = [['all', t('common.all')], ['confirmed', t('reservations.confirmed')], ['pending', t('reservations.pending')]]

  return (
    <div ref={ref} className="relative flex-none">
      <Tooltip label={t('reservations.filter')}>
        <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label={t('reservations.filter')} className={`${BAR_BTN} ${active ? 'text-content' : ''}`}>
          <Filter size={15} strokeWidth={2} />
          {active > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 font-geist font-bold text-accent-text" style={fs(9)}>{active}</span>}
        </button>
      </Tooltip>
      {open && (
        <Menu onClose={close} width={280}>
          <div style={POPOVER_CAPTION}>{t('reservations.status')}</div>
          <div className="mx-1.5 mb-1 mt-0.5 flex rounded-[10px] bg-surface-tertiary p-[3px]">
            {statuses.map(([s, label]) => (
              <button key={s} type="button" onClick={() => p.onStatus(s)} aria-pressed={p.status === s}
                className={`flex-1 rounded-[8px] py-1 font-medium ${p.status === s ? 'bg-surface-card text-content shadow-sm' : 'text-content-muted hover:text-content'}`} style={fs(12, 'body')}>
                {label}
              </button>
            ))}
          </div>

          {p.types.length > 1 && (
            <>
              <div style={POPOVER_DIVIDER} />
              <div style={POPOVER_CAPTION}>{t('reservations.group.type')}</div>
              {p.types.map(({ type, count }) => {
                const info = typeInfo(type)
                const on = p.activeTypes.has(type)
                return (
                  <PopoverItem key={type} active={on} onClick={() => p.onToggleType(type)}
                    icon={<info.Icon size={14} strokeWidth={2} style={{ color: info.color }} />}
                    label={t(info.labelKey)}
                    trailing={<span className="flex items-center gap-1.5"><CountPill>{count}</CountPill>{on && <Check size={13} className="text-content-muted" />}</span>} />
                )
              })}
            </>
          )}

          {p.showTravelers && (
            <>
              <div style={POPOVER_DIVIDER} />
              <div style={POPOVER_CAPTION}>{t('reservations.travelers.label')}</div>
              <div className="flex flex-wrap gap-1.5 px-2.5 pb-1.5 pt-0.5">
                {p.members.map(m => {
                  const on = p.activeTravelers.has(m.id)
                  return (
                    <button key={m.id} type="button" onClick={() => p.onToggleTraveler(m.id)} aria-pressed={on}
                      className={`flex items-center gap-1.5 rounded-full border py-[3px] pl-[3px] pr-2.5 ${on ? 'border-[color:var(--text-primary)] text-content' : 'border-edge-faint text-content-muted hover:text-content'}`} style={fs(12, 'body')}>
                      <span className="grid h-5 w-5 flex-none place-items-center overflow-hidden rounded-full bg-surface-tertiary font-bold" style={fs(9)}>
                        {m.avatar_url ? <img src={m.avatar_url} alt="" className="h-full w-full object-cover" /> : m.username?.[0]?.toUpperCase()}
                      </span>
                      {m.username}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {active > 0 && (
            <>
              <div style={POPOVER_DIVIDER} />
              <PopoverItem icon={<RotateCcw size={14} />} label={t('reservations.resetFilters')} onClick={() => { p.onResetFilters(); close() }} />
            </>
          )}
        </Menu>
      )}
    </div>
  )
}

/** How the entries are laid out: group and sort for cards and list, lanes for the timeline. */
function ViewOptions(p: BookingsHeaderProps) {
  const { t } = useTranslation()
  const { open, setOpen, ref, close } = usePopover()
  const groups: [GroupBy, string][] = [['status', t('reservations.group.status')], ['day', t('reservations.group.day')], ['type', t('reservations.group.type')], ['none', t('reservations.group.none')]]
  const sorts: [SortBy, string][] = [['date', t('reservations.sort.date')], ['title', t('reservations.sort.title')], ['type', t('reservations.sort.type')], ['status', t('reservations.sort.status')]]

  return (
    <div ref={ref} className="relative flex-none">
      <Tooltip label={t('reservations.viewOptions')}>
        <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label={t('reservations.viewOptions')} className={BAR_BTN}>
          <SlidersHorizontal size={15} strokeWidth={2} />
          {!p.viewIsDefault && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />}
        </button>
      </Tooltip>
      {open && (
        <Menu onClose={close} width={250}>
          {p.view === 'timeline' ? (
            <>
              <div style={POPOVER_CAPTION}>{t('reservations.view.timeline')}</div>
              <SwitchRow label={t('reservations.timeline.byType')} on={p.byType} onToggle={p.onByType} />
              <SwitchRow label={t('reservations.timeline.context')} on={p.showContext} onToggle={p.onShowContext} />
            </>
          ) : (
            <>
              <div style={POPOVER_CAPTION}>{t('reservations.group.label')}</div>
              {groups.map(([g, label]) => (
                <PopoverItem key={g} icon={g === 'day' ? <CalendarDays size={14} /> : g === 'type' ? <Tag size={14} /> : <Layers size={14} />} label={label} active={p.group === g} onClick={() => p.onGroup(g)} />
              ))}
              {p.onTransitApart && (
                <>
                  <div style={POPOVER_DIVIDER} />
                  <SwitchRow label={t('reservations.transitApart')} on={p.transitApart} onToggle={p.onTransitApart} />
                </>
              )}
              <div style={POPOVER_DIVIDER} />
              <div style={POPOVER_CAPTION}>{t('reservations.sort.label')}</div>
              {sorts.map(([s, label]) => (
                <PopoverItem key={s} icon={<ArrowDownUp size={14} />} label={label} active={p.sort === s} onClick={() => p.onSort(s)} />
              ))}
              <PopoverItem icon={<ArrowDownUp size={14} />} muted label={p.sortDir === 'asc' ? t(p.sort === 'date' ? 'reservations.sort.earlyFirst' : 'reservations.sort.aToZ') : t(p.sort === 'date' ? 'reservations.sort.lateFirst' : 'reservations.sort.zToA')} onClick={p.onSortDir} />
            </>
          )}
          <div style={POPOVER_DIVIDER} />
          <PopoverItem icon={<RotateCcw size={14} />} label={t('reservations.resetView')} onClick={() => { p.onResetView(); close() }} />
        </Menu>
      )}
    </div>
  )
}

function SwitchRow({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-3 px-2.5 py-2">
      <span className="min-w-0 flex-1 text-content" style={fs(12.5, 'body')}>{label}</span>
      <ToggleSwitch on={on} onToggle={onToggle} label={label} />
    </div>
  )
}
