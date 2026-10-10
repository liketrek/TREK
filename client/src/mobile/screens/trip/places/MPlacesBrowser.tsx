import { ReactNode, useEffect, useMemo, useState } from 'react'
import {
  Bookmark, CheckCheck, CheckCircle2, Download, ListChecks, Loader2, Plus,
  SlidersHorizontal, Tag, Trash2, X,
} from 'lucide-react'
import MDancingTrek from '../../../components/MDancingTrek'
import { useAddonStore } from '../../../../store/addonStore'
import PlaceAvatar from '../../../../components/shared/PlaceAvatar'
import MarkdownText from '../../../../components/shared/MarkdownText'
import { getCategoryIcon } from '../../../../components/shared/categoryIcons'
import { resolveTrackColor } from '../../../../components/Map/trackColors'
import MConfirmSheet from '../../settings/MConfirmSheet'
import type { MPlacesBrowserProps } from '../MTripShell'
import DawarichSuggestionsPanel from '../../../../components/Dawarich/DawarichSuggestionsPanel'
import { formatDayOption } from '../../../../components/Dawarich/dawarichSuggestionModel'
import { refreshTripAfterAccept } from '../../../../components/Dawarich/dawarichTripRefresh'
import { useTranslation } from '../../../../i18n'
import type { Place } from '../../../../types'
import MPlacesBulkCategorySheet from './MPlacesBulkCategorySheet'
import MPlacesSaveToCollectionSheet from './MPlacesSaveToCollectionSheet'
import MPlacesToursModeSwitch from './MPlacesToursModeSwitch'
import MToursSelectionList from './MToursSelectionList'
import type { TourFilter } from '../../../../components/Tours/tourPresentation'
import { filterPool, firstPlannedDayNumbers, plannedPlaceIds } from './placesBrowserModel'
import { MCategoryFilterList, MRatingFloorChips, SquareCheck } from './MPlacesFilterControls'
import { countActivePlacesFilters } from '../../../../utils/placesFilter'
import { usePlacesPool } from '../../../../components/Planner/usePlacesPool'

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
  const { t, places, categories, assignments, days, trip, tripId } = planner
  // The planner hook carries `t` but not the locale; day labels need both.
  const { locale } = useTranslation()
  const canEditPlaces = planner.can('place_edit', trip)
  const collectionsEnabled = useAddonStore(s => s.isEnabled('collections'))
  const toursEnabled = useAddonStore(s => s.isEnabled('tours'))
  // Top level of the places browser, mirroring the desktop right add-panel's
  // Places <-> Tours switch placement.
  const [toursMode, setToursMode] = useState(false)
  const [toursFilter, setToursFilter] = useState<TourFilter>('all')

  const poolPlaces = useMemo(
    // Places that are tours stay out of the Places pool while the addon is on.
    // The planner's answer, not a second list of its own: that one is kept up
    // to date by the trip's realtime events and knows the mark on each place.
    () => toursEnabled ? places.filter(place => !planner.isTourPlace(place.id)) : places,
    [places, toursEnabled, planner.isTourPlace],
  )
  const {
    search, updateSearch, filter, setFilter, pickFilter, categoryFilters, ratingFilter, selectMode, toggleSelectMode,
    selectedIds, setSelectedIds, toggleSelected, exitSelectMode, markSelectionVisited, markVisitedBusy, hasTracks,
  } = usePlacesPool({ tripId: trip.id, places, poolPlaces, toursEnabled, t, staleSelection: 'prune' })

  const [catOpen, setCatOpen] = useState(false)
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false)
  const [saveToListOpen, setSaveToListOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  // Entering the browser from the edit segment starts on the unplanned pool.
  useEffect(() => {
    if (shell.browseFromEdit) setFilter('unplanned')
  }, [shell.browseFromEdit, setFilter])

  // A hotel is linked through its stay and a venue through its booking; neither is
  // ever dragged onto a day, and the pool used to call both unplanned (#2072).
  const plannedIds = useMemo(
    () => plannedPlaceIds(assignments, planner.tripAccommodations, planner.reservations),
    [assignments, planner.tripAccommodations, planner.reservations],
  )
  const dayNumberByPlace = useMemo(() => firstPlannedDayNumbers(assignments, days), [assignments, days])
  const filtered = useMemo(() => {
    return filterPool(poolPlaces, { filter, categoryFilters, ratingFilter, search, plannedIds })
  }, [poolPlaces, filter, categoryFilters, ratingFilter, search, plannedIds])

  // Compare the ids, not just the counts: a place removed remotely while another
  // one is selected keeps the sizes equal without the sets matching.
  const selectablePlaces = filtered.filter(place => !planner.isTourPlace(place.id))
  const allSelected = selectablePlaces.length > 0 && selectablePlaces.every(p => selectedIds.has(p.id))
  const toggleAllVisible = () => {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(selectablePlaces.map(p => p.id)))
  }

  const openAddPlace = () => {
    planner.setEditingPlace(null)
    planner.setEditingAssignmentId(null)
    planner.setPrefillCoords(null)
    planner.setShowPlaceForm(true)
  }

  const openRow = (place: Place) => {
    if (selectMode) {
      if (planner.isTourPlace(place.id)) {
        planner.handlePlaceClick(place.id)
        return
      }
      toggleSelected(place.id)
      return
    }
    shell.openSheet('bract', { placeId: place.id, dayPicker: false })
  }

  const selectedTours = [...selectedIds].filter(id => planner.isTourPlace(id))
  const panelFilterCount = countActivePlacesFilters({ filter: 'all', categoryFilters, ratingFilter })

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-[calc(var(--bottom-nav-h,84px)+22px)] pt-[calc(var(--m-safe-top,12px)+58px)]">
        {toursEnabled && (
          <MPlacesToursModeSwitch active={toursMode} onChange={setToursMode} />
        )}
        {toursEnabled && toursMode ? (
          <>
            {/* All / Unplanned / Planned only — no Tracks chip, no Import/Add/Select
                buttons: tours are attached here, never created or bulk-managed. */}
            <div className="flex items-center gap-[6px]">
              <FilterChip active={toursFilter === 'all'} label={t('places.all')} onClick={() => setToursFilter('all')} />
              <FilterChip active={toursFilter === 'unplanned'} label={t('places.unplanned')} onClick={() => setToursFilter('unplanned')} />
              <FilterChip active={toursFilter === 'planned'} label={t('places.planned')} onClick={() => setToursFilter('planned')} />
            </div>
            <MToursSelectionList planner={planner} shell={shell} filter={toursFilter} />
          </>
        ) : (
        <>
        {/* ── Filter chips + Import (Add sits in the search row below to free space) ── */}
        <div className="flex items-center gap-[6px]">
          <FilterChip
            active={filter === 'all'}
            label={t('places.all')}
            onClick={() => pickFilter('all')}
          />
          <FilterChip
            active={filter === 'unplanned'}
            label={t('places.unplanned')}
            onClick={() => pickFilter('unplanned')}
          />
          <FilterChip
            active={filter === 'planned'}
            label={t('places.planned')}
            onClick={() => pickFilter('planned')}
          />
          {hasTracks && (
            <FilterChip
              active={filter === 'tracks'}
              label={t('places.filterTracks')}
              onClick={() => pickFilter('tracks')}
            />
          )}
          {canEditPlaces && (
            <button
              type="button"
              onClick={() => shell.openSheet('import')}
              aria-label={t('mobileTrip.importPlaces')}
              className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-muted"
            >
              <Download size={16} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* ── Search + category filter + select toggle ── */}
        <div className="mt-[10px] flex items-stretch gap-2">
          <input
            value={search}
            onChange={e => updateSearch(e.target.value)}
            placeholder={t('places.search')}
            className="box-border min-w-0 flex-1 rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[13px] py-[10px] text-[0.8125rem] font-medium text-m-ink outline-none placeholder:text-m-faint"
          />
          <button
            type="button"
            onClick={() => setCatOpen(v => !v)}
            aria-expanded={catOpen}
            aria-label={t('places.filters')}
            className="relative flex w-[42px] flex-none items-center justify-center rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-muted"
          >
            <SlidersHorizontal size={15} strokeWidth={2} />
            {panelFilterCount > 0 && (
              <span className="absolute -end-[3px] -top-[3px] box-border flex h-4 min-w-[16px] items-center justify-center rounded-full bg-m-act px-1 font-geist text-[0.5625rem] font-bold text-m-actfg">
                {panelFilterCount}
              </span>
            )}
          </button>
          {canEditPlaces && (
            <button
              type="button"
              onClick={toggleSelectMode}
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

        {/* Stays Dawarich recorded on these dates (#2279). Same component as the
            desktop rail — the rows are the same rows, and the panel renders
            nothing when there is nothing pending. */}
        <div className="mt-3">
          <DawarichSuggestionsPanel
            tripId={planner.tripId}
            trips={[{ id: planner.tripId, label: t('dawarich.accept.thisTrip') }]}
            daysForTrip={() => days.map(day => ({
              id: day.id,
              ...formatDayOption(day.day_number, day.date, locale, t),
            }))}
            // The place it just created belongs on the map and in the list
            // now, not after a reload.
            onAccepted={() => { void refreshTripAfterAccept(planner.tripId) }}
            initiallyCollapsed
          />
        </div>

        {/* ── Selection toolbar ── */}
        {selectMode && (
          <div className="mt-2 flex items-center gap-2 rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] py-[6px] ps-[14px] pe-[6px] backdrop-blur-[20px]">
            <span className="font-geist text-[0.6875rem] font-bold text-m-muted">
              {t('places.selectionCount', { count: selectedIds.size })}
            </span>
            <div className="ms-auto flex gap-[5px]">
              <BulkBtn label={allSelected ? t('common.deselectAll') : t('common.selectAll')} onClick={toggleAllVisible}>
                <CheckCheck size={14} strokeWidth={2} />
              </BulkBtn>
              <BulkBtn label={t('places.changeCategory')} disabled={selectedIds.size === 0 || selectedTours.length > 0} onClick={() => setCategoryPickerOpen(true)}>
                <Tag size={14} strokeWidth={2} />
              </BulkBtn>
              {collectionsEnabled && (
                <BulkBtn label={t('inspector.saveToCollection')} disabled={selectedIds.size === 0 || selectedTours.length > 0} onClick={() => setSaveToListOpen(true)}>
                  <Bookmark size={14} strokeWidth={2} />
                </BulkBtn>
              )}
              {collectionsEnabled && (
                <BulkBtn
                  label={t('collections.markVisitedSelection')}
                  disabled={selectedIds.size === 0 || selectedTours.length > 0 || markVisitedBusy}
                  onClick={markSelectionVisited}
                >
                  {markVisitedBusy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} strokeWidth={2} />}
                </BulkBtn>
              )}
              <BulkBtn label={t('places.deleteSelected')} disabled={selectedIds.size === 0 || selectedTours.length > 0} onClick={() => setConfirmDeleteOpen(true)}>
                <Trash2 size={14} strokeWidth={2} />
              </BulkBtn>
            </div>
          </div>
        )}

        {/* ── Rating + category filter panel ── */}
        {catOpen && (
          <div className="mt-[6px] overflow-hidden rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-glass)]">
            <div className="border-b border-[color:var(--m-rowbr)] px-[13px] py-[10px]">
              <MRatingFloorChips onPick={() => setSelectedIds(new Set())} />
            </div>
            <MCategoryFilterList categories={categories} places={poolPlaces} />
          </div>
        )}

        {/* ── Count divider ── */}
        <div className="mb-1 mt-[14px] flex items-center gap-[10px]">
          <span className="h-px flex-1 bg-[color:var(--m-rowbr)]" />
          <span className="whitespace-nowrap font-geist text-[0.625rem] font-bold uppercase tracking-[.09em] text-m-faint">
            {t('places.count', { count: filtered.length })}
          </span>
          <span className="h-px flex-1 bg-[color:var(--m-rowbr)]" />
        </div>

        {/* ── Place list ── */}
        {filtered.length === 0 ? (
          filter === 'unplanned' && !search && categoryFilters.size === 0 && ratingFilter === 'all' ? (
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
                <button type="button" onClick={() => openRow(place)} className="flex min-w-0 flex-1 items-center gap-[11px] text-start">
                  {selectMode && !planner.isTourPlace(place.id) && <SquareCheck big checked={selectedIds.has(place.id)} />}
                  <PlaceAvatar place={place} category={cat} size={40} />
                  <div className="min-w-0 flex-1">
                    <span className="flex items-center gap-[6px]">
                      {/* Stroke in the track's colour — the mobile map is full-bleed
                          with no sidebar, so this is the only thing tying a line to
                          a row (#776). */}
                      {place.route_geometry && (
                        <span
                          className="h-[3px] w-[14px] flex-none rounded-full"
                          style={{ background: resolveTrackColor(place) }}
                        />
                      )}
                      <CatIcon size={12} strokeWidth={2.2} className="flex-none" style={{ color: cat?.color || 'var(--m-muted)' }} />
                      <span className="truncate text-[0.8125rem] font-semibold text-m-ink">{place.name}</span>
                    </span>
                    {sub && (
                      <MarkdownText clamp className="mt-px font-geist text-[0.65625rem] text-m-muted">{sub}</MarkdownText>
                    )}
                  </div>
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
        </>
        )}
      </div>

      <MPlacesBulkCategorySheet
        open={categoryPickerOpen}
        count={selectedIds.size}
        categories={categories}
        onClose={() => setCategoryPickerOpen(false)}
        onPick={async categoryId => {
          const ids = [...selectedIds]
          setCategoryPickerOpen(false)
          // Drop the selection only once the bulk edit went through — a failed
          // one has to stay retryable with the same set.
          try { await planner.confirmChangeCategory(ids, categoryId) } catch { return }
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
        message={selectedTours.length > 0
          ? t('tours.delete.bulkConfirmBody')
          : t('trip.confirm.deletePlaces', { count: selectedIds.size })}
        confirmLabel={selectedTours.length > 0
          ? t('tours.delete.confirmAction')
          : t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={async () => {
          const ids = [...selectedIds]
          setConfirmDeleteOpen(false)
          try { await planner.confirmDeletePlaces(ids) } catch { return }
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
