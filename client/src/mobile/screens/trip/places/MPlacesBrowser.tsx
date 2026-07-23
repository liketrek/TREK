import { ReactNode, useEffect, useMemo, useState } from 'react'
import {
  Bookmark, Check, CheckCheck, ListChecks, MapPin, MoreHorizontal, Plus,
  SlidersHorizontal, Tag, Trash2, X,
} from 'lucide-react'
import MDancingTrek from '../../../components/MDancingTrek'
import { useTripStore } from '../../../../store/tripStore'
import { useAddonStore } from '../../../../store/addonStore'
import PlaceAvatar from '../../../../components/shared/PlaceAvatar'
import { getCategoryIcon } from '../../../../components/shared/categoryIcons'
import MConfirmSheet from '../../settings/MConfirmSheet'
import type { MPlacesBrowserProps } from '../MTripShell'
import type { Place } from '../../../../types'
import MPlacesBulkCategorySheet from './MPlacesBulkCategorySheet'
import MPlacesSaveToCollectionSheet from './MPlacesSaveToCollectionSheet'
import { filterPool, firstPlannedDayNumbers, plannedPlaceIds } from './placesBrowserModel'

/**
 * Fullscreen places pool (mode === 'browse'): All/Unplanned/Tracks filter
 * chips, search, the category filter panel, multi-select with the bulk
 * toolbar (delete / category / save to collection) and the place list with
 * DAY badge / quick-add. The pool filter and the category set live in the
 * trip store, so the map markers filter with the exact same values (#1541).
 *
 * Row taps and quick-add open the 'bract' place-actions sheet via
 * shell.openSheet('bract', { placeId, dayPicker }) — the sheet host renders
 * it. The header ellipsis opens the 'import' sheet (sheets/MImportSheet).
 */
export default function MPlacesBrowser({ planner, shell }: MPlacesBrowserProps) {
  const { t, places, categories, assignments, days, trip } = planner
  const canEditPlaces = planner.can('place_edit', trip)
  const collectionsEnabled = useAddonStore(s => s.isEnabled('collections'))

  const filter = useTripStore(s => s.placesFilter)
  const setFilter = useTripStore(s => s.setPlacesFilter)
  const categoryFilters = useTripStore(s => s.placesCategoryFilter)
  const setCategoryFilters = useTripStore(s => s.setPlacesCategoryFilter)

  const [search, setSearch] = useState('')
  const [catOpen, setCatOpen] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false)
  const [saveToListOpen, setSaveToListOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  // Entering the browser from the edit segment starts on the unplanned pool.
  useEffect(() => {
    if (shell.browseFromEdit) setFilter('unplanned')
  }, [shell.browseFromEdit, setFilter])

  const hasTracks = useMemo(() => places.some(p => p.route_geometry), [places])
  useEffect(() => {
    if (filter === 'tracks' && !hasTracks) setFilter('all')
  }, [filter, hasTracks, setFilter])

  const plannedIds = useMemo(() => plannedPlaceIds(assignments), [assignments])
  const dayNumberByPlace = useMemo(() => firstPlannedDayNumbers(assignments, days), [assignments, days])
  const filtered = useMemo(
    () => filterPool(places, { filter, categoryFilters, search, plannedIds }),
    [places, filter, categoryFilters, search, plannedIds],
  )

  // A bulk delete (or a remote edit) can remove selected places — drop the
  // stale ids so the toolbar count stays honest.
  useEffect(() => {
    if (selectedIds.size === 0) return
    const alive = new Set(places.map(p => p.id))
    if ([...selectedIds].some(id => !alive.has(id))) {
      setSelectedIds(prev => new Set([...prev].filter(id => alive.has(id))))
    }
  }, [places, selectedIds])

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  const toggleSelected = (id: number) =>
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length
  const toggleAllVisible = () => {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(filtered.map(p => p.id)))
  }

  const toggleCategory = (catId: string) => {
    const next = new Set(categoryFilters)
    if (next.has(catId)) next.delete(catId)
    else next.add(catId)
    setCategoryFilters(next)
  }

  const openAddPlace = () => {
    planner.setEditingPlace(null)
    planner.setEditingAssignmentId(null)
    planner.setPrefillCoords(null)
    planner.setShowPlaceForm(true)
  }

  const openRow = (place: Place) => {
    if (selectMode) {
      toggleSelected(place.id)
      return
    }
    shell.openSheet('bract', { placeId: place.id, dayPicker: false })
  }

  const hasUncategorized = places.some(p => p.category_id == null)

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(var(--bottom-nav-h,84px)+22px)] pt-[calc(var(--m-safe-top,12px)+58px)]">
        {/* ── Filter chips + Import (Add sits in the search row below to free space) ── */}
        <div className="flex items-center gap-[6px]">
          <FilterChip
            active={filter === 'all'}
            label={t('places.all')}
            onClick={() => { setFilter('all'); setSelectedIds(new Set()) }}
          />
          <FilterChip
            active={filter === 'unplanned'}
            label={t('places.unplanned')}
            onClick={() => { setFilter('unplanned'); setSelectedIds(new Set()) }}
          />
          <FilterChip
            active={filter === 'planned'}
            label={t('places.planned')}
            onClick={() => { setFilter('planned'); setSelectedIds(new Set()) }}
          />
          {hasTracks && (
            <FilterChip
              active={filter === 'tracks'}
              label={t('places.filterTracks')}
              onClick={() => { setFilter('tracks'); setSelectedIds(new Set()) }}
            />
          )}
          {canEditPlaces && (
            <button
              type="button"
              onClick={() => shell.openSheet('import')}
              aria-label={t('mobileTrip.importPlaces')}
              className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-muted"
            >
              <MoreHorizontal size={16} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* ── Search + category filter + select toggle ── */}
        <div className="mt-[10px] flex items-stretch gap-2">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); if (selectMode) setSelectedIds(new Set()) }}
            placeholder={t('places.search')}
            className="box-border min-w-0 flex-1 rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[13px] py-[10px] text-[0.8125rem] font-medium text-m-ink outline-none placeholder:text-m-faint"
          />
          <button
            type="button"
            onClick={() => setCatOpen(v => !v)}
            aria-expanded={catOpen}
            aria-label={t('places.allCategories')}
            className="relative flex w-[42px] flex-none items-center justify-center rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-muted"
          >
            <SlidersHorizontal size={15} strokeWidth={2} />
            {categoryFilters.size > 0 && (
              <span className="absolute -right-[3px] -top-[3px] box-border flex h-4 min-w-[16px] items-center justify-center rounded-full bg-m-act px-1 font-geist text-[0.5625rem] font-bold text-m-actfg">
                {categoryFilters.size}
              </span>
            )}
          </button>
          {canEditPlaces && (
            <button
              type="button"
              onClick={() => { setSelectMode(v => !v); setSelectedIds(new Set()) }}
              aria-pressed={selectMode}
              aria-label={t('common.select')}
              className={`flex w-[42px] flex-none items-center justify-center rounded-full border ${
                selectMode
                  ? 'border-[color:var(--m-act)] bg-m-act text-m-actfg'
                  : 'border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-muted'
              }`}
            >
              {selectMode ? <X size={15} strokeWidth={2} /> : <ListChecks size={15} strokeWidth={2} />}
            </button>
          )}
          {canEditPlaces && (
            <button
              type="button"
              onClick={openAddPlace}
              aria-label={t('common.add')}
              className="flex w-[42px] flex-none items-center justify-center rounded-full bg-m-act text-m-actfg"
            >
              <Plus size={18} strokeWidth={2.2} />
            </button>
          )}
        </div>

        {/* ── Selection toolbar ── */}
        {selectMode && (
          <div className="mt-2 flex items-center gap-2 rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] py-[6px] pl-[14px] pr-[6px] backdrop-blur-[20px]">
            <span className="font-geist text-[0.6875rem] font-bold text-m-muted">
              {t('places.selectionCount', { count: selectedIds.size })}
            </span>
            <div className="ml-auto flex gap-[5px]">
              <BulkBtn label={allSelected ? t('common.deselectAll') : t('common.selectAll')} onClick={toggleAllVisible}>
                <CheckCheck size={14} strokeWidth={2} />
              </BulkBtn>
              <BulkBtn label={t('places.changeCategory')} disabled={selectedIds.size === 0} onClick={() => setCategoryPickerOpen(true)}>
                <Tag size={14} strokeWidth={2} />
              </BulkBtn>
              {collectionsEnabled && (
                <BulkBtn label={t('inspector.saveToCollection')} disabled={selectedIds.size === 0} onClick={() => setSaveToListOpen(true)}>
                  <Bookmark size={14} strokeWidth={2} />
                </BulkBtn>
              )}
              <BulkBtn label={t('places.deleteSelected')} disabled={selectedIds.size === 0} onClick={() => setConfirmDeleteOpen(true)}>
                <Trash2 size={14} strokeWidth={2} />
              </BulkBtn>
            </div>
          </div>
        )}

        {/* ── Category filter panel ── */}
        {catOpen && (
          <div className="mt-[6px] overflow-hidden rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-glass)]">
            {categories.map(c => {
              const CatIcon = getCategoryIcon(c.icon)
              return (
                <CategoryFilterRow
                  key={c.id}
                  checked={categoryFilters.has(String(c.id))}
                  onToggle={() => toggleCategory(String(c.id))}
                  label={c.name}
                >
                  <CatIcon size={14} strokeWidth={2} className="flex-none" style={{ color: c.color || 'var(--m-muted)' }} />
                </CategoryFilterRow>
              )
            })}
            {hasUncategorized && (
              <CategoryFilterRow
                checked={categoryFilters.has('uncategorized')}
                onToggle={() => toggleCategory('uncategorized')}
                label={t('places.noCategory')}
              >
                <MapPin size={14} strokeWidth={2} className="flex-none text-m-faint" />
              </CategoryFilterRow>
            )}
          </div>
        )}

        {/* ── Count divider ── */}
        <div className="mb-1 mt-[14px] flex items-center gap-[10px]">
          <span className="h-px flex-1 bg-[color:var(--m-rowbr)]" />
          <span className="whitespace-nowrap font-geist text-[0.625rem] font-bold uppercase tracking-[.09em] text-m-faint">
            {filtered.length === 1 ? t('places.countSingular') : t('places.count', { count: filtered.length })}
          </span>
          <span className="h-px flex-1 bg-[color:var(--m-rowbr)]" />
        </div>

        {/* ── Place list ── */}
        {filtered.length === 0 ? (
          filter === 'unplanned' && !search && categoryFilters.size === 0 ? (
            <div className="flex min-h-[60vh] flex-col items-center justify-center px-8 py-10 text-center">
              <MDancingTrek scene="idle" mood="happy" className="mb-2" />
              <p className="font-geist text-[0.8125rem] font-medium text-m-muted">{t('places.allPlanned')}</p>
            </div>
          ) : (
            <div className="flex min-h-[60vh] flex-col items-center justify-center px-8 py-10 text-center">
              <MDancingTrek scene="search" className="mb-2" />
              <p className="font-geist text-[0.8125rem] font-medium text-m-muted">{t('places.noneFound')}</p>
            </div>
          )
        ) : (
          filtered.map(place => {
            const cat = place.category_id != null ? categories.find(c => c.id === place.category_id) : undefined
            const CatIcon = getCategoryIcon(cat?.icon)
            const dayNumber = dayNumberByPlace.get(place.id)
            const sub = place.address || place.description
            return (
              <div key={place.id} className="flex items-center gap-[11px] border-b border-[color:var(--m-rowbr)] px-[2px] py-[9px]">
                <button type="button" onClick={() => openRow(place)} className="flex min-w-0 flex-1 items-center gap-[11px] text-left">
                  {selectMode && <SquareCheck big checked={selectedIds.has(place.id)} />}
                  <PlaceAvatar place={place} category={cat} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-[6px]">
                      <CatIcon size={12} strokeWidth={2.2} className="flex-none" style={{ color: cat?.color || 'var(--m-muted)' }} />
                      <span className="truncate text-[0.8125rem] font-semibold text-m-ink">{place.name}</span>
                    </span>
                    {sub && (
                      <span className="mt-px block truncate font-geist text-[0.65625rem] text-m-muted">{sub}</span>
                    )}
                  </span>
                </button>
                {!selectMode && dayNumber != null && (
                  <span className="flex-none whitespace-nowrap rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[9px] py-1 font-geist text-[0.59375rem] font-bold uppercase tracking-[.05em] text-m-muted">
                    {t('planner.dayN', { n: dayNumber })}
                  </span>
                )}
                {!selectMode && dayNumber == null && (
                  <button
                    type="button"
                    onClick={() => shell.openSheet('bract', { placeId: place.id, dayPicker: true })}
                    aria-label={t('places.assignToDay')}
                    className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full bg-m-act text-m-actfg"
                  >
                    <Plus size={14} strokeWidth={2.2} />
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>

      <MPlacesBulkCategorySheet
        open={categoryPickerOpen}
        count={selectedIds.size}
        categories={categories}
        onClose={() => setCategoryPickerOpen(false)}
        onPick={categoryId => {
          planner.confirmChangeCategory([...selectedIds], categoryId)
          setCategoryPickerOpen(false)
          exitSelectMode()
        }}
      />
      {collectionsEnabled && (
        <MPlacesSaveToCollectionSheet
          open={saveToListOpen}
          tripId={planner.tripId}
          placeIds={[...selectedIds]}
          onClose={() => setSaveToListOpen(false)}
          onDone={exitSelectMode}
        />
      )}
      <MConfirmSheet
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title={t('places.deleteSelected')}
        message={t('trip.confirm.deletePlaces', { count: selectedIds.size })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => {
          planner.confirmDeletePlaces([...selectedIds])
          setConfirmDeleteOpen(false)
          exitSelectMode()
        }}
      />
    </div>
  )
}

/** All / Unplanned / Planned / Tracks pool chip. Counts are omitted on mobile to save row
 *  space; chips flex to share the row's full width up to the import button on the right. */
function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-full px-[12px] text-[0.75rem] font-semibold ${
        active ? 'bg-m-act text-m-actfg' : 'bg-[color:var(--m-ic)] text-m-ink'
      }`}
    >
      {label}
    </button>
  )
}

/** 30px circle action of the selection toolbar; 0-selection state dims it. */
function BulkBtn({ label, onClick, disabled = false, children }: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-ink ${
        disabled ? 'pointer-events-none opacity-35' : ''
      }`}
    >
      {children}
    </button>
  )
}

/** 17px (panel) / 19px (row) square checkbox in the demo's act-fill style. */
function SquareCheck({ checked, big = false }: { checked: boolean; big?: boolean }) {
  return (
    <span
      className={`flex flex-none items-center justify-center border-[1.5px] ${
        big ? 'h-[19px] w-[19px] rounded-[6px]' : 'h-[17px] w-[17px] rounded-[5px]'
      } ${checked ? 'border-[color:var(--m-act)] bg-m-act text-m-actfg' : 'border-[color:var(--m-trackoff)] text-transparent'}`}
    >
      <Check size={big ? 12 : 11} strokeWidth={3} />
    </span>
  )
}

function CategoryFilterRow({ checked, onToggle, label, children }: {
  checked: boolean
  onToggle: () => void
  label: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      role="checkbox"
      aria-checked={checked}
      className="flex w-full items-center gap-[10px] border-b border-[color:var(--m-rowbr)] px-[13px] py-[10px] text-left last:border-b-0"
    >
      <SquareCheck checked={checked} />
      {children}
      <span className="min-w-0 flex-1 truncate text-[0.78125rem] font-medium text-m-ink">{label}</span>
    </button>
  )
}
