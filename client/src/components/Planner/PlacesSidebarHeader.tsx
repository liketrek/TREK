import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import { Search, Plus, X, Upload, FileDown, ListPlus, Check, Star, CalendarPlus, CalendarDays, ChevronDown, Tag, Globe2, ArrowDownUp } from 'lucide-react'
import { Tooltip } from '../shared/Tooltip'
import { ContextMenu, useContextMenu } from '../shared/ContextMenu'
import { NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { useElementSize } from '../../hooks/useElementSize'
import { Eyebrow } from './bookings/bookingParts'
import { tintOf } from './planParts'
import { CategoryTile } from './PlacesBulkCategoryModal'
import type { PlacesFilter, SidebarState } from './usePlacesSidebar'
import { PLACES_SORTS, type PlacesSort } from './placesSort'
import { RATING_FLOORS } from '../../utils/placesFilter'

/**
 * Below this the two labels stop fitting side by side and both buttons fall back
 * to their icon. Measured on the add row itself, the full width of the head band,
 * rather than derived from the sidebar width: the labels are translated, so how
 * much room they need differs per locale, and the row is what runs out of space.
 * The rail is draggable down to 200px, which leaves the row 172.
 */
const COMPACT_BUTTONS_WIDTH = 232

/** The controls of the head band: one height, one radius, the card colour of the other trip bars. */
const CONTROL = 'h-8 rounded-[10px] shadow-sm'

/** A 32px icon control on the head band, named by its tooltip. `on` fills it in the accent (a mode that is switched on). */
function BandButton({ label, onClick, on = false, lit = false, ariaPressed, ariaExpanded, ariaHaspopup, children }: {
  label: string
  onClick: (e: ReactMouseEvent<HTMLButtonElement>) => void
  on?: boolean
  /** Brighter while its panel or menu is open, or while it is filtering. */
  lit?: boolean
  ariaPressed?: boolean
  ariaExpanded?: boolean
  ariaHaspopup?: 'dialog' | 'menu'
  children: ReactNode
}) {
  let tone = 'bg-surface-card text-content-secondary hover:text-content'
  if (on) tone = 'bg-accent text-accent-text'
  else if (lit) tone = 'bg-surface-card text-content'
  return (
    <Tooltip label={label}>
      <button type="button" onClick={onClick} aria-label={label}
        aria-pressed={ariaPressed} aria-expanded={ariaExpanded} aria-haspopup={ariaHaspopup}
        className={`${CONTROL} relative grid w-8 flex-none place-items-center transition-colors ${tone}`}>
        {children}
      </button>
    </Tooltip>
  )
}

export function PlacesDropOverlay({ t }: SidebarState) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-accent"
      style={{ background: tintOf('var(--accent)', 12) }}
    >
      <Upload size={28} strokeWidth={1.5} className="text-accent" />
      <span className="font-semibold text-accent" style={fs(13, 'body')}>{t('places.sidebarDrop')}</span>
    </div>
  )
}

/**
 * The head of the places column, one tinted band like every panel head in the
 * planner, in three rows: adding and importing first, as the column's main job;
 * search with the category and rating filters and the select switch; what to
 * show as tabs with their counts. While a day is open on the planned tab, a chip
 * says so.
 */
export function PlacesHeader(S: SidebarState) {
  const { canEditPlaces, t, selectMode, setSelectMode, setSelectedIds } = S
  return (
    <div className="flex flex-none flex-col gap-2 border-b border-edge-faint px-3 py-2.5" style={{ background: NEUTRAL_TINT }}>
      {canEditPlaces && <AddRow {...S} />}
      <div className="relative flex items-center gap-1.5">
        <SearchField {...S} />
        {canEditPlaces && (
          <BandButton
            label={t('common.select')}
            on={selectMode}
            ariaPressed={selectMode}
            onClick={() => { setSelectMode(v => !v); setSelectedIds(new Set()) }}
          >
            {selectMode ? <X size={15} strokeWidth={2.4} /> : <Check size={15} strokeWidth={2.4} />}
          </BandButton>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <ShowDropdown {...S} />
        <CategoryFilter {...S} />
        <RatingFilter {...S} />
        <LocalityFilterDropdown {...S} />
        <SortDropdown {...S} />
      </div>
      <ActiveFilterChips {...S} />
    </div>
  )
}

function SearchField({ t, search, setSearch, selectMode, setSelectedIds }: SidebarState) {
  return (
    <label className={`${CONTROL} flex min-w-0 flex-1 items-center gap-2 bg-surface-card pl-2.5 pr-1.5 text-content-faint focus-within:ring-2 focus-within:ring-[color:var(--text-primary)]`}>
      <Search size={13} strokeWidth={2} className="flex-none" />
      <input
        type="text"
        value={search}
        onChange={e => { setSearch(e.target.value); if (selectMode) setSelectedIds(new Set()) }}
        placeholder={t('common.search')}
        aria-label={t('common.search')}
        className="min-w-0 flex-1 border-0 bg-transparent text-content outline-none placeholder:text-content-faint"
        style={fs(12.5, 'body')}
      />
      {search && (
        <Tooltip label={t('places.clearSearch')}>
          <button type="button" onClick={() => setSearch('')} aria-label={t('places.clearSearch')}
            className="grid h-5 w-5 flex-none place-items-center rounded-full text-content-faint hover:bg-surface-hover hover:text-content">
            <X size={12} strokeWidth={2.2} />
          </button>
        </Tooltip>
      )}
    </label>
  )
}

/** A category (or the no-category bucket) in the category list, ticked while it filters. */
function CategoryChoice({ on, onClick, tile, label }: { on: boolean; onClick: () => void; tile: ReactNode; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={`flex w-full items-center gap-2 rounded-[9px] px-1.5 py-1 text-left transition-colors ${on ? 'bg-surface-tertiary' : 'hover:bg-surface-hover'}`}
      style={fs(12.5, 'body')}>
      {tile}
      <span className="min-w-0 flex-1 truncate text-content">{label}</span>
      {on && <Check size={13} strokeWidth={2.4} className="flex-none text-content-muted" />}
    </button>
  )
}

/** The "show" choices; tracks only once a place has one. */
function filterTabs({ t, hasTracks }: Pick<SidebarState, 't' | 'hasTracks'>) {
  const tabs: Array<{ id: PlacesFilter; label: string }> = [
    { id: 'all', label: t('places.all') },
    { id: 'unplanned', label: t('places.unplanned') },
    { id: 'planned', label: t('places.planned') },
  ]
  if (hasTracks) tabs.push({ id: 'tracks', label: t('places.filterTracks') })
  return tabs
}

/** What the list shows (every place, the unplanned, the planned, the tracks) as one dropdown with their counts. */
function ShowDropdown(S: SidebarState) {
  const { t, filter, pickFilter, filterCounts } = S
  const [open, setOpen] = useState(false)
  const tabs = filterTabs(S)
  const current = tabs.find(tab => tab.id === filter) ?? tabs[0]
  return (
    <FilterDropdown
      wide
      name={t('places.filterShow')}
      label={current.label}
      count={filterCounts[current.id]}
      active={filter !== 'all'}
      open={open}
      setOpen={setOpen}
    >
      <div data-testid="places-filter" role="group" aria-label={t('places.filterShow')} className="flex flex-col gap-px">
        {tabs.map(tab => {
          const on = filter === tab.id
          return (
            <button type="button" key={tab.id} onClick={() => { pickFilter(tab.id); setOpen(false) }} aria-pressed={on}
              className={`flex w-full items-center gap-2 rounded-[9px] px-2 py-1.5 text-left transition-colors ${on ? 'bg-surface-tertiary' : 'hover:bg-surface-hover'}`}
              style={fs(12.5, 'body')}>
              <span className="min-w-0 flex-1 truncate text-content">{tab.label}</span>
              <span className="font-geist tabular-nums text-content-faint" style={fs(11)}>{filterCounts[tab.id]}</span>
              <span className="grid w-3.5 flex-none place-items-center">{on && <Check size={13} strokeWidth={2.4} className="text-content-muted" />}</span>
            </button>
          )
        })}
      </div>
    </FilterDropdown>
  )
}

/**
 * A filter as one icon on the tabs row, opening a small list under it; closes on a
 * click outside or Escape. A badge marks it while it is narrowing the list, and the
 * tooltip says to what.
 */
function FilterDropdown({ label, active, badge, icon, open, setOpen, name, children, wide = false, count }: {
  /** What is in force: on the trigger when `wide`, else in the tooltip ("All categories", "4+"). */
  label: string
  active: boolean
  badge?: string | number
  icon?: ReactNode
  /** Takes the row's free width and shows its label (and `count`) on the trigger. */
  wide?: boolean
  count?: number
  open: boolean
  setOpen: (v: boolean | ((v: boolean) => boolean)) => void
  /** The trigger's accessible name: what it filters by. */
  name: string
  children: ReactNode
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!wrapRef.current?.contains(e.target as Node)) setOpen(false) }
    // Captured and stopped, so the key takes back the list and nothing under it.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      setOpen(false)
      wrapRef.current?.querySelector('button')?.focus()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open, setOpen])
  return (
    <div ref={wrapRef} className={`relative ${wide ? 'min-w-0 flex-1' : 'flex-none'}`}>
      {wide ? (
        <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-haspopup="listbox" aria-label={name}
          className={`${CONTROL} flex w-full min-w-0 items-center gap-1.5 bg-surface-card px-2.5 font-semibold transition-colors ${active || open ? 'text-content' : 'text-content-secondary hover:text-content'}`}
          style={fs(12, 'body')}>
          <span className="min-w-0 truncate text-left">{label}</span>
          {count != null && <span className="font-geist tabular-nums text-content-faint" style={fs(10.5)}>{count}</span>}
          <ChevronDown size={13} strokeWidth={2.2} className={`ml-auto flex-none text-content-faint transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      ) : (
      <Tooltip label={active ? `${name}: ${label}` : name} disabled={open}>
        <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-haspopup="listbox" aria-label={name}
          className={`${CONTROL} relative grid w-8 place-items-center bg-surface-card transition-colors ${active || open ? 'text-content' : 'text-content-secondary hover:text-content'}`}>
          {icon}
          {active && badge != null && (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 font-geist font-bold tabular-nums text-accent-text" style={fs(9)}>
              {badge}
            </span>
          )}
        </button>
      </Tooltip>
      )}
      {open && (
        <div className={`trek-popover-enter absolute ${wide ? 'left-0' : 'right-0'} top-full z-50 mt-1.5 flex max-h-[min(60vh,360px)] flex-col overflow-y-auto rounded-[12px] border border-edge-secondary bg-surface-card p-1.5 shadow-popover`} style={{ width: 'max-content', minWidth: 180, maxWidth: 260 }}>
          {children}
        </div>
      )}
    </div>
  )
}

/** Which categories to show, many at once; the label says what is in force. */
function CategoryFilter(S: SidebarState) {
  const { t, places, categories, categoryFilters, setCategoryFilters, toggleCategoryFilter } = S
  const [open, setOpen] = useState(false)
  if (categories.length === 0) return null
  let label = t('places.allCategories')
  if (categoryFilters.size === 1) {
    const only = categories.find(c => categoryFilters.has(String(c.id)))
    if (categoryFilters.has('uncategorized')) label = t('places.noCategory')
    else if (only) label = only.name
  } else if (categoryFilters.size > 1) {
    label = `${categoryFilters.size} ${t('places.categoriesSelected')}`
  }
  return (
    <FilterDropdown name={t('categories.title')} label={label} active={categoryFilters.size > 0} badge={categoryFilters.size}
      icon={<Tag size={14} strokeWidth={2} />} open={open} setOpen={setOpen}>
      {categories.map(c => (
        <CategoryChoice
          key={c.id}
          on={categoryFilters.has(String(c.id))}
          onClick={() => toggleCategoryFilter(String(c.id))}
          tile={<CategoryTile category={c} size={22} />}
          label={c.name}
        />
      ))}
      {places.some(p => p.category_id == null) && (
        <CategoryChoice
          on={categoryFilters.has('uncategorized')}
          onClick={() => toggleCategoryFilter('uncategorized')}
          tile={<CategoryTile size={22} />}
          label={t('places.noCategory')}
        />
      )}
      {categoryFilters.size > 0 && (
        <button type="button" onClick={() => setCategoryFilters(new Set())}
          className="mt-1 flex w-full items-center gap-1.5 rounded-[9px] border-t border-edge-faint px-1.5 pb-1 pt-2 text-left font-semibold text-content-muted hover:text-content"
          style={fs(12, 'body')}>
          <X size={12} strokeWidth={2.4} />
          {t('places.clearFilter')}
        </button>
      )}
    </FilterDropdown>
  )
}

/** A minimum of stars (#1435), the same floors as the collections bar. */
function RatingFilter(S: SidebarState) {
  const { t, ratingFilter, setRatingFilter } = S
  const [open, setOpen] = useState(false)
  const star = <Star size={12} strokeWidth={2.2} fill="currentColor" className="flex-none text-warning" />
  return (
    <FilterDropdown
      label={ratingFilter === 'all' ? t('common.all') : `${ratingFilter}+`}
      name={t('places.filterByRating')}
      active={ratingFilter !== 'all'}
      badge={ratingFilter === 'all' ? undefined : `${ratingFilter}+`}
      icon={<Star size={14} strokeWidth={2} className={ratingFilter === 'all' ? '' : 'fill-current text-warning'} />}
      open={open}
      setOpen={setOpen}
    >
      {RATING_FLOORS.map(opt => {
        const on = ratingFilter === opt
        return (
          <button type="button" key={String(opt)} onClick={() => { setRatingFilter(opt); setOpen(false) }} aria-pressed={on}
            className={`flex w-full items-center gap-2 rounded-[9px] px-2 py-1.5 text-left transition-colors ${on ? 'bg-surface-tertiary' : 'hover:bg-surface-hover'}`}
            style={fs(12.5, 'body')}>
            {opt === 'all' ? <span className="w-3" /> : star}
            <span className="min-w-0 flex-1 text-content">{opt === 'all' ? t('common.all') : `${opt}+`}</span>
            {on && <Check size={13} strokeWidth={2.4} className="flex-none text-content-muted" />}
          </button>
        )
      })}
    </FilterDropdown>
  )
}

const SORT_LABEL_KEYS: Record<PlacesSort, string> = {
  newest: 'places.sortNewest',
  oldest: 'places.sortOldest',
  name: 'places.sortName',
  rating: 'places.sortRating',
  updated: 'places.sortUpdated',
}

/** The list's order (#2093); marked while it is anything but newest first. */
function SortDropdown(S: SidebarState) {
  const { t, placesSort, setPlacesSort } = S
  const [open, setOpen] = useState(false)
  const active = placesSort !== 'newest'
  return (
    <FilterDropdown
      label={t(SORT_LABEL_KEYS[placesSort])}
      name={t('places.sortBy')}
      active={active}
      badge={active ? '' : undefined}
      icon={<ArrowDownUp size={14} strokeWidth={2} />}
      open={open}
      setOpen={setOpen}
    >
      <div className="px-2 pb-1 pt-0.5 font-geist font-bold uppercase tracking-[.08em] text-content-faint" style={fs(9.5)}>{t('places.sortBy')}</div>
      {PLACES_SORTS.map(opt => {
        const on = placesSort === opt
        return (
          <button type="button" key={opt} onClick={() => { setPlacesSort(opt); setOpen(false) }} aria-pressed={on}
            className={`flex w-full items-center gap-2 rounded-[9px] px-2 py-1.5 text-left transition-colors ${on ? 'bg-surface-tertiary' : 'hover:bg-surface-hover'}`}
            style={fs(12.5, 'body')}>
            <span className="min-w-0 flex-1 text-content">{t(SORT_LABEL_KEYS[opt])}</span>
            {on && <Check size={13} strokeWidth={2.4} className="flex-none text-content-muted" />}
          </button>
        )
      })}
    </FilterDropdown>
  )
}

/**
 * Country, or one region in it, from each place's resolved position (#2537). Shown once
 * the trip spans more than one country or region; a single one has nothing to narrow.
 */
function LocalityFilterDropdown(S: SidebarState) {
  const { t, localities, localityFilter, setLocalityFilter } = S
  const [open, setOpen] = useState(false)
  const regionCount = localities.reduce((n, g) => n + g.regions.length, 0)
  if (localities.length < 2 && regionCount < 2) return null
  const pick = (country: string, region: string | null) => { setLocalityFilter({ country, region }); setOpen(false) }
  const row = (key: string, label: string, count: number, on: boolean, onClick: () => void, indent: boolean) => (
    <button type="button" key={key} onClick={onClick} aria-pressed={on}
      className={`flex w-full items-center gap-2 rounded-[9px] py-1.5 pr-2 text-left transition-colors ${indent ? 'pl-5' : 'pl-2'} ${on ? 'bg-surface-tertiary' : 'hover:bg-surface-hover'}`}
      style={fs(indent ? 12 : 12.5, 'body')}>
      <span className={`min-w-0 flex-1 truncate ${indent ? 'text-content-secondary' : 'font-semibold text-content'}`}>{label}</span>
      <span className="rounded-full bg-surface-secondary px-1.5 font-geist tabular-nums text-content-faint" style={fs(10.5)}>{count}</span>
      <span className="grid w-3.5 flex-none place-items-center">{on && <Check size={13} strokeWidth={2.4} className="text-content-muted" />}</span>
    </button>
  )
  const label = localityFilter ? (localityFilter.region ?? localityFilter.country) : t('places.allLocations')
  return (
    <FilterDropdown name={t('places.filterByLocation')} label={label} active={!!localityFilter} badge={1}
      icon={<Globe2 size={14} strokeWidth={2} />} open={open} setOpen={setOpen}>
      {localities.map(g => (
        <div key={g.country} className="flex flex-col gap-px">
          {row(`c:${g.country}`, g.country, g.count, localityFilter?.country === g.country && localityFilter.region == null, () => pick(g.country, null), false)}
          {g.regions.map(r => row(`c:${g.country}:${r.region}`, r.region, r.count, localityFilter?.country === g.country && localityFilter.region === r.region, () => pick(g.country, r.region), true))}
        </div>
      ))}
      {localityFilter && (
        <button type="button" onClick={() => { setLocalityFilter(null); setOpen(false) }}
          className="mt-1 flex w-full items-center gap-1.5 rounded-[9px] border-t border-edge-faint px-1.5 pb-1 pt-2 text-left font-semibold text-content-muted hover:text-content"
          style={fs(12, 'body')}>
          <X size={12} strokeWidth={2.4} />
          {t('places.clearFilter')}
        </button>
      )}
    </FilterDropdown>
  )
}

function AddRow(S: SidebarState) {
  const { onAddPlace, onAddPlaceToSelectedDay, selectedDayId, t, setFileImportOpen, setListImportOpen, hasMultipleListImportProviders } = S
  const dayOpen = selectedDayId != null
  const split = dayOpen && !!onAddPlaceToSelectedDay
  const { ref: rowRef, width: rowWidth } = useElementSize<HTMLDivElement>()
  // Zero is the first paint, before the observer has measured anything — treat
  // that as roomy so the labels do not flash away and back on every mount.
  const compact = rowWidth > 0 && rowWidth < COMPACT_BUTTONS_WIDTH
  const addLabel = t(dayOpen ? 'places.addPlaceShort' : 'places.addPlace')
  const importMenu = useContextMenu()
  const importItems = [
    { label: t('places.importFile'), icon: FileDown, onClick: () => setFileImportOpen(true) },
    { label: t(hasMultipleListImportProviders ? 'places.importList' : 'places.importGoogleList'), icon: ListPlus, onClick: () => setListImportOpen(true) },
  ]
  return (
    <div ref={rowRef} className="flex items-center gap-1.5">
      {/* The label shortens while the second button is out, so both fit side by
          side in a default rail without either one truncating; a squeezed rail
          drops the labels entirely and the aria-labels carry the names instead. */}
      <div className="flex min-w-0 flex-1 gap-1.5">
        <Tooltip label={addLabel} disabled={!compact}>
          <button type="button"
            onClick={onAddPlace}
            aria-label={compact ? addLabel : undefined}
            className={`${CONTROL} flex min-w-0 items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap bg-accent px-3 font-semibold text-accent-text transition-[flex-basis] duration-200 hover:opacity-90 motion-reduce:transition-none`}
            // Both halves are driven by flex-basis rather than by grow, so the pair
            // lands on an exact 50/50 and the handover animates in both directions.
            style={{ ...fs(12.5, 'body'), flex: `0 1 ${split ? 'calc(50% - 3px)' : '100%'}` }}
          >
            <Plus size={14} strokeWidth={2.2} className="flex-none" />
            {!compact && <span className="truncate">{addLabel}</span>}
          </button>
        </Tooltip>
        {/* Kept mounted and collapsed rather than unmounted, so it has something
            to animate out of. Hidden from the tab order and from screen readers in
            the same breath, because a zero-width button is still focusable otherwise. */}
        {onAddPlaceToSelectedDay && (
          <Tooltip label={t('places.addToSelectedDay')} disabled={!dayOpen}>
            <button type="button"
              onClick={onAddPlaceToSelectedDay}
              aria-label={t('places.addToSelectedDay')}
              data-testid="add-place-to-day"
              aria-hidden={!dayOpen}
              tabIndex={dayOpen ? 0 : -1}
              className={`flex h-8 min-w-0 items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-[10px] bg-surface-card font-semibold text-content transition-[flex-basis,opacity,padding] duration-200 hover:text-content-secondary motion-reduce:transition-none ${dayOpen ? 'px-3 opacity-100 shadow-sm' : 'pointer-events-none px-0 opacity-0 shadow-none'}`}
              style={{ ...fs(12.5, 'body'), flex: `0 1 ${dayOpen ? 'calc(50% - 3px)' : '0%'}` }}
            >
              <CalendarPlus size={14} strokeWidth={2} className="flex-none" />
              {!compact && <span className="truncate">{t('places.addToDayShort')}</span>}
            </button>
          </Tooltip>
        )}
      </div>
      <BandButton
        label={t('mobileTrip.importPlaces')}
        lit={!!importMenu.menu}
        ariaHaspopup="menu"
        ariaExpanded={!!importMenu.menu}
        onClick={e => { if (importMenu.menu) importMenu.close(); else importMenu.open(e, importItems, true) }}
      >
        <FileDown size={15} strokeWidth={2} />
      </BandButton>
      <ContextMenu menu={importMenu.menu} onClose={importMenu.close} />
    </div>
  )
}

/** A filter in force, said out loud, with the X that lifts it. */
function FilterChip({ label, clearLabel, onClear, icon, tone = 'neutral' }: {
  label: string
  /** The X's name; its tooltip, too, unless the X says more than the tooltip. */
  clearLabel: string
  onClear?: () => void
  icon?: ReactNode
  tone?: 'neutral' | 'info'
}) {
  const look = tone === 'info' ? 'bg-info-soft text-info' : 'border border-edge-faint bg-surface-card text-content-secondary'
  return (
    <span className={`inline-flex min-w-0 max-w-full items-center gap-1 rounded-full py-[3px] font-semibold ${onClear ? 'pl-2 pr-[3px]' : 'px-2'} ${look}`} style={fs(11)}>
      {icon}
      <span className="min-w-0 truncate">{label}</span>
      {onClear && (
        <Tooltip label={clearLabel}>
          <button type="button" onClick={onClear} aria-label={clearLabel}
            className="grid h-[18px] w-[18px] flex-none place-items-center rounded-full opacity-70 transition-opacity hover:bg-surface-hover hover:opacity-100">
            <X size={11} strokeWidth={2.4} />
          </button>
        </Tooltip>
      )}
    </span>
  )
}

function ActiveFilterChips(S: SidebarState) {
  const { t, dayScoped, onClearSelectedDay } = S
  // Says out loud what the count below already narrowed to. The map has followed
  // the open day on this filter since #2024, and until this said so the pool read 55
  // beside five pins and the honest conclusion was that the map was broken. The X
  // closes the day rather than changing the filter.
  if (!dayScoped) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      <FilterChip tone="info" label={t('places.dayScoped')} clearLabel={t('places.dayScopedClear')} onClear={onClearSelectedDay}
        icon={<CalendarDays size={11} strokeWidth={2.2} className="flex-none" />} />
    </div>
  )
}
