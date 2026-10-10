import type React from 'react'
import { placeLocality } from '../../utils/placeLocality'
import { localityGroups, matchesLocality, type LocalityFilter } from './placeLocalityFilter'
import { readPlacesSort, sortPlaces, writePlacesSort, type PlacesSort } from './placesSort'
import { useState, useMemo, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { Pencil, Trash2, ExternalLink, Navigation, CalendarDays, Bookmark } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import { useContextMenu } from '../shared/ContextMenu'
import { useTripStore } from '../../store/tripStore'
import { useCanDo } from '../../store/permissionsStore'
import { useAddonStore } from '../../store/addonStore'
import { useSaveToCollectionStore } from '../../store/saveToCollectionStore'
import { placeToSaveTarget } from '../Collections/saveTarget'
import type { Place, Category, Day, AssignmentsMap } from '../../types'
import { getGoogleMapsUrlForPlace } from './placeGoogleMaps'
import { placeMatchesSearch } from '../../utils/placeSearch'
import { matchesCategoryFilter, matchesPlacesFilter } from '../../utils/placesFilter'
import { safeHttpUrl } from '../../utils/safeUrl'
import { plannedPlaceIds, plannedPlaceIdsForDay, type PlannedAccommodation } from '../../utils/plannedPlaces'
import type { MenuEntry } from './planParts'
import { useListImport, type ListImportProvider } from './useListImport'
import { usePlacesPool, type PlacesFilter } from './usePlacesPool'

/** Stable identity — a fresh [] default would invalidate the planned memo on every render. */
const NO_ACCOMMODATIONS: PlannedAccommodation[] = []

export interface PlacesSidebarProps {
  tripId: number
  places: Place[]
  /** The trip's stays — hook-local state in useTripPlanner, so it arrives as a prop. */
  accommodations?: PlannedAccommodation[]
  categories: Category[]
  assignments: AssignmentsMap
  selectedDayId: number | null
  selectedPlaceId: number | null
  onPlaceClick: (placeId: number | null) => void
  onAddPlace: () => void
  /**
   * Create a place and drop it straight into the day that is open.
   *
   * Only reachable while a day is selected, which is what the split button in
   * the header is about: the pool is one click away from the plan, and adding a
   * place you already know belongs to today should not need a second trip
   * through the day picker.
   */
  onAddPlaceToSelectedDay?: () => void
  /**
   * Close the open day, from the note that says the pool is showing only that day.
   * Absent leaves the note without its dismiss, which is what the mobile day picker
   * wants: there the day is closed by the picker itself.
   */
  onClearSelectedDay?: () => void
  onAssignToDay: (placeId: number, dayId: number) => void
  onEditPlace: (place: Place) => void
  onDeletePlace: (placeId: number) => void
  onBulkDeletePlaces?: (ids: number[]) => void
  onBulkDeleteConfirm?: (ids: number[]) => void
  onBulkChangeCategory?: (ids: number[], categoryId: number | null) => void
  days: Day[]
  isMobile: boolean
  pushUndo?: (label: string, undoFn: () => Promise<void> | void) => void
  initialScrollTop?: number
  onScrollTopChange?: (top: number) => void
  /**
  * With the Tours addon on, file import belongs to Tours mode, list import
  * stays here, and the "Tracks" chip is hidden because tracks are tours.
   */
  toursEnabled?: boolean
  /** Places that are tours (a `tours` facet row exists) — hidden from the pool entirely while tours is on. */
  excludePlaceIds?: Set<number>
}

/**
 * Sidebar state: file/list import, search + filter + category multi-select,
 * multi-select/bulk-delete and the mobile day-picker sheet. Kept in one hook so
 * PlacesSidebar stays a thin layout shell over the sub-sections below.
 */
export function usePlacesSidebar(props: PlacesSidebarProps) {
  const {
    tripId, places, assignments, selectedDayId, days, accommodations = NO_ACCOMMODATIONS,
    pushUndo, initialScrollTop, onScrollTopChange, onEditPlace, onAssignToDay, onDeletePlace,
  } = props
  const poolPlaces = useMemo(
    () => props.toursEnabled && props.excludePlaceIds ? places.filter(p => !props.excludePlaceIds!.has(p.id)) : places,
    [places, props.toursEnabled, props.excludePlaceIds],
  )
  const { t, language } = useTranslation()
  const toast = useToast()
  const ctxMenu = useContextMenu()
  const trip = useTripStore((s) => s.trip)
  // A booking plans the place it points at, so the pool has to see them (#2072).
  const reservations = useTripStore((s) => s.reservations)
  const loadTrip = useTripStore((s) => s.loadTrip)
  const can = useCanDo()
  const canEditPlaces = can('place_edit', trip)
  const collectionsEnabled = useAddonStore((s) => s.isEnabled('collections'))

  const [fileImportOpen, setFileImportOpen] = useState(false)
  const [sidebarDropFile, setSidebarDropFile] = useState<File | null>(null)
  const [sidebarDragOver, setSidebarDragOver] = useState(false)
  const sidebarDragCounter = useRef(0)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const placeRowRefs = useRef(new Map<number, HTMLDivElement>())
  const lastAutoScrolledPlaceIdRef = useRef<number | null>(null)
  useLayoutEffect(() => {
    if (scrollContainerRef.current && initialScrollTop) {
      scrollContainerRef.current.scrollTop = initialScrollTop
    }
  }, [])

  const handleSidebarDragEnter = (e: React.DragEvent) => {
    if (!canEditPlaces || props.toursEnabled) return
    e.preventDefault()
    sidebarDragCounter.current++
    setSidebarDragOver(true)
  }

  const handleSidebarDragOver = (e: React.DragEvent) => {
    if (!canEditPlaces || props.toursEnabled) return
    e.preventDefault()
  }

  const handleSidebarDragLeave = () => {
    sidebarDragCounter.current--
    if (sidebarDragCounter.current === 0) setSidebarDragOver(false)
  }

  const handleSidebarDrop = (e: React.DragEvent) => {
    e.preventDefault()
    sidebarDragCounter.current = 0
    setSidebarDragOver(false)
    if (!canEditPlaces || props.toursEnabled) return
    const f = e.dataTransfer.files[0]
    if (!f) return
    setSidebarDropFile(f)
    setFileImportOpen(true)
  }

  const listImport = useListImport({ tripId, t, toast, loadTrip, pushUndo })
  const availableListImportProviders: ListImportProvider[] = ['google', 'naver']
  const hasMultipleListImportProviders = availableListImportProviders.length > 1

  const {
    search, setSearch, updateSearch, filter, setFilter, pickFilter, categoryFilters, setCategoryFilters, toggleCategoryFilter,
    ratingFilter, setRatingFilter, selectMode, setSelectMode, toggleSelectMode, selectedIds, setSelectedIds, toggleSelected,
    exitSelectMode, markSelectionVisited, markVisitedBusy, hasTracks,
  } = usePlacesPool({ tripId, places, poolPlaces, toursEnabled: props.toursEnabled, t, staleSelection: 'exit' })
  // The list's order (#2093), remembered on this device.
  const [placesSort, setPlacesSortState] = useState<PlacesSort>(readPlacesSort)
  const setPlacesSort = useCallback((sort: PlacesSort) => { setPlacesSortState(sort); writePlacesSort(sort) }, [])
  // Country, or country and region, from each place's resolved position (#2537). List-only,
  // like the rating floor.
  const [localityFilter, setLocalityFilter] = useState<LocalityFilter | null>(null)
  const localityOf = useMemo(() => new Map(poolPlaces.map(p => [p.id, placeLocality(p, language)])), [poolPlaces, language])
  const localities = useMemo(() => localityGroups(poolPlaces.map(p => localityOf.get(p.id)!)), [poolPlaces, localityOf])
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[] | null>(null)
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false)
  const [saveToListOpen, setSaveToListOpen] = useState(false)

  const [dayPickerPlace, setDayPickerPlace] = useState<Place | null>(null)
  // One panel holds what used to be three dropdowns (show, categories, rating).
  const [mobileShowDays, setMobileShowDays] = useState(false)

  // Alle geplanten Ort-IDs abrufen (einem Tag zugewiesen)
  const plannedIds = useMemo(
    () => plannedPlaceIds({ assignments, accommodations, reservations }),
    [assignments, accommodations, reservations],
  )

  /**
   * What "planned" means while a day is open: that day's plan, not the whole trip's.
   *
   * The map has narrowed to the selected day since #2024, and the list did not, which is
   * how a trip with 55 planned places showed 55 in the pool and five pins on the map with
   * nothing to explain the gap — read, reasonably, as the map being broken. The list now
   * follows the map, and `dayScoped` tells the header to say so.
   *
   * Only "planned" narrows. "Unplanned" stays trip-wide on purpose: a place assigned to
   * some other day is planned, whichever day happens to be open.
   */
  const plannedInDayIds = useMemo(
    () => (selectedDayId
      ? plannedPlaceIdsForDay(selectedDayId, days, { assignments, accommodations, reservations })
      : null),
    [selectedDayId, days, assignments, accommodations, reservations],
  )
  const plannedFilterIds = plannedInDayIds ?? plannedIds
  const dayScoped = filter === 'planned' && plannedInDayIds !== null

  const filtered = useMemo(() => {
    const list = poolPlaces.filter(p => {
      if (!matchesPlacesFilter(p, { filter, categoryFilters, ratingFilter }, { plannedIds, plannedFilterIds })) return false
      if (!placeMatchesSearch(p, search)) return false
      if (localityFilter && !matchesLocality(localityOf.get(p.id), localityFilter)) return false
      return true
    })
    return sortPlaces(list, placesSort, language)
  }, [poolPlaces, filter, categoryFilters, search, plannedIds, plannedFilterIds, ratingFilter, localityFilter, localityOf, placesSort, language])

  /**
   * How many places each "show" choice would leave, under the category and search
   * filters but not the rating floor. While a day is open "planned" counts that day's
   * plan, the same set the list and the map show: counting the whole trip is what made
   * the choice read 55 beside five pins, with nothing to say the two answered
   * different questions.
   */
  const filterCounts = useMemo(() => {
    const base = poolPlaces.filter(p => matchesCategoryFilter(p, categoryFilters) && placeMatchesSearch(p, search))
    return {
      all: base.length,
      unplanned: base.filter(p => !plannedIds.has(p.id)).length,
      planned: base.filter(p => plannedFilterIds.has(p.id)).length,
      tracks: base.filter(p => p.route_geometry).length,
    } satisfies Record<PlacesFilter, number>
  }, [poolPlaces, categoryFilters, search, plannedIds, plannedFilterIds])

  /** The filters narrowing the list besides the search box, for the badge on the filter button. */

  const registerPlaceRow = useCallback((placeId: number, element: HTMLDivElement | null) => {
    if (element) {
      placeRowRefs.current.set(placeId, element)
    } else {
      placeRowRefs.current.delete(placeId)
    }
  }, [])

  useEffect(() => {
    if (!props.selectedPlaceId) {
      lastAutoScrolledPlaceIdRef.current = null
      return
    }
    if (lastAutoScrolledPlaceIdRef.current === props.selectedPlaceId) return
    if (!filtered.some(place => place.id === props.selectedPlaceId)) return

    const selectedRow = placeRowRefs.current.get(props.selectedPlaceId)
    if (!selectedRow) return
    selectedRow.scrollIntoView({ behavior: 'smooth', block: 'center' })
    lastAutoScrolledPlaceIdRef.current = props.selectedPlaceId
  }, [filtered, props.selectedPlaceId])

  const selectedDayIdRef = useRef<number | null>(selectedDayId)
  useEffect(() => { selectedDayIdRef.current = selectedDayId }, [selectedDayId])

  // The day list handed in is the one the planner shows, and in the day view that
  // list leaves out the stop a booking wrote. The store still holds it, so the set
  // that decides between "in the day" and the add button reads the day from there
  // as well: on the list alone the hotel of a booked night offered "add to day" on
  // its own check-in day, and taking that offer put a second row beside the night.
  const storedDayAssignments = useTripStore((s) => (selectedDayId ? s.assignments[String(selectedDayId)] : undefined))

  const inDaySet = useMemo(() => {
    if (!selectedDayId) return new Set<number>()
    const ids = new Set<number>((assignments[String(selectedDayId)] || []).map((a: any) => a.place?.id).filter(Boolean))
    for (const a of storedDayAssignments ?? []) if (a.place?.id) ids.add(a.place.id)
    return ids
  }, [assignments, storedDayAssignments, selectedDayId])

  const isAssignedToSelectedDay = (placeId) => inDaySet.has(placeId)

  /**
   * A row's actions, one list for both ways in: the right-click menu and the row's
   * "…" button. `dayId` is the day "+ Day" puts the place on.
   */
  const placeMenuItems = useCallback((place: Place, dayId: number | null): MenuEntry[] => {
    const googleMapsUrl = getGoogleMapsUrlForPlace(place)
    const website = safeHttpUrl(place.website)
    const entries: Array<MenuEntry | false> = [
      canEditPlaces && { label: t('common.edit'), icon: Pencil, onClick: () => onEditPlace(place) },
      !!dayId && { label: t('planner.addToDay'), icon: CalendarDays, onClick: () => onAssignToDay(place.id, dayId) },
      !!website && { label: t('inspector.website'), icon: ExternalLink, onClick: () => window.open(website, '_blank', 'noopener,noreferrer') },
      !!googleMapsUrl && { label: t('inspector.google'), icon: Navigation, onClick: () => window.open(googleMapsUrl, '_blank') },
      collectionsEnabled && { label: t('inspector.saveToCollection'), icon: Bookmark, onClick: () => useSaveToCollectionStore.getState().open(placeToSaveTarget(place)) },
      { divider: true },
      canEditPlaces && { label: t('common.delete'), icon: Trash2, danger: true, onClick: () => onDeletePlace(place.id) },
    ]
    return entries.filter((entry): entry is MenuEntry => entry !== false)
  }, [canEditPlaces, collectionsEnabled, t, onEditPlace, onAssignToDay, onDeletePlace])

  // The day is read when the menu opens, so it stays stable across day switches.
  const openCtxMenu = ctxMenu.open
  const openContextMenu = useCallback((e: React.MouseEvent, place: Place) => {
    openCtxMenu(e, placeMenuItems(place, selectedDayIdRef.current))
  }, [openCtxMenu, placeMenuItems])

  return {
    ...props,
    t, toast, ctxMenu, trip, canEditPlaces,
    fileImportOpen, setFileImportOpen, sidebarDropFile, setSidebarDropFile,
    sidebarDragOver, handleSidebarDragEnter, handleSidebarDragOver, handleSidebarDragLeave, handleSidebarDrop,
    scrollContainerRef, onScrollTopChange,
    listImportOpen: listImport.open, setListImportOpen: listImport.setOpen,
    listImportUrl: listImport.url, setListImportUrl: listImport.setUrl,
    listImportLoading: listImport.loading, listImportProvider: listImport.provider, setListImportProvider: listImport.setProvider,
    listImportEnrich: listImport.enrich, setListImportEnrich: listImport.setEnrich, canEnrichImport: listImport.canEnrich,
    availableListImportProviders, hasMultipleListImportProviders, handleListImport: listImport.handleImport,
    search, setSearch, updateSearch, filter, setFilter, pickFilter, filterCounts,
    categoryFilters, setCategoryFilters,
    ratingFilter, setRatingFilter,
    placesSort, setPlacesSort,
    localityFilter, setLocalityFilter, localities,
    selectMode, setSelectMode, toggleSelectMode, selectedIds, setSelectedIds, pendingDeleteIds, setPendingDeleteIds,
    categoryPickerOpen, setCategoryPickerOpen,
    saveToListOpen, setSaveToListOpen, collectionsEnabled, tripId,
    markSelectionVisited, markVisitedBusy,
    exitSelectMode, toggleSelected, toggleCategoryFilter, dayPickerPlace, setDayPickerPlace,
    mobileShowDays, setMobileShowDays,
    hasTracks, plannedIds, plannedFilterIds, dayScoped, filtered, registerPlaceRow, isAssignedToSelectedDay, inDaySet,
    openContextMenu, placeMenuItems,
  }
}

export type SidebarState = ReturnType<typeof usePlacesSidebar>
