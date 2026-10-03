import type React from 'react'
import { placeLocality } from '../../utils/placeLocality'
import { localityGroups, matchesLocality, type LocalityFilter } from './placeLocalityFilter'
import { readPlacesSort, sortPlaces, writePlacesSort, type PlacesSort } from './placesSort'
import { useState, useMemo, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { Pencil, Trash2, ExternalLink, Navigation, CalendarDays, Bookmark } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import { useContextMenu } from '../shared/ContextMenu'
import { placesApi } from '../../api/client'
import { collectionsApi } from '../../api/collections'
import { useTripStore } from '../../store/tripStore'
import { useCanDo } from '../../store/permissionsStore'
import { useAuthStore } from '../../store/authStore'
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

/** Stable identity — a fresh [] default would invalidate the planned memo on every render. */
const NO_ACCOMMODATIONS: PlannedAccommodation[] = []

/** What the pool shows: everything, what is not on a day yet, what is, or the tracks. */
export type PlacesFilter = 'all' | 'unplanned' | 'planned' | 'tracks'

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
  // Places-API enrichment (#886) needs a Google Maps key. Not the places
  // *provider* choice: enrichment's photos and summary come from Google (and,
  // keyless, from Wikimedia), which is independent of which provider answers
  // search — an Amap install with a Google key still enriches through Google.
  const canEnrichImport = useAuthStore((s) => s.hasMapsKey)

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
    if (!canEditPlaces) return
    e.preventDefault()
    sidebarDragCounter.current++
    setSidebarDragOver(true)
  }

  const handleSidebarDragOver = (e: React.DragEvent) => {
    if (!canEditPlaces) return
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
    if (!canEditPlaces) return
    const f = e.dataTransfer.files[0]
    if (!f) return
    setSidebarDropFile(f)
    setFileImportOpen(true)
  }

  const [listImportOpen, setListImportOpen] = useState(false)
  const [listImportUrl, setListImportUrl] = useState('')
  const [listImportLoading, setListImportLoading] = useState(false)
  const [listImportProvider, setListImportProvider] = useState<'google' | 'naver'>('google')
  const [listImportEnrich, setListImportEnrich] = useState(false)
  const availableListImportProviders: Array<'google' | 'naver'> = ['google', 'naver']
  const hasMultipleListImportProviders = availableListImportProviders.length > 1

  const handleListImport = async () => {
    if (!listImportUrl.trim()) return
    setListImportLoading(true)
    const provider = listImportProvider
    try {
      const enrich = listImportEnrich && canEnrichImport
      const result = provider === 'google'
        ? await placesApi.importGoogleList(tripId, listImportUrl.trim(), enrich)
        : await placesApi.importNaverList(tripId, listImportUrl.trim(), enrich)
      await loadTrip(tripId)
      if (result.count === 0 && result.skipped > 0) {
        toast.warning(t('places.importAllSkipped'))
      } else {
        toast.success(t(provider === 'google' ? 'places.googleListImported' : 'places.naverListImported', { count: result.count, list: result.listName }))
      }
      setListImportOpen(false)
      setListImportUrl('')
      if (result.places?.length > 0) {
        const importedIds: number[] = result.places.map((p: { id: number }) => p.id)
        pushUndo?.(t(provider === 'google' ? 'undo.importGoogleList' : 'undo.importNaverList'), async () => {
          try { await placesApi.bulkDelete(tripId, importedIds) } catch {}
          await loadTrip(tripId)
        })
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || t(provider === 'google' ? 'places.googleListError' : 'places.naverListError'))
    } finally {
      setListImportLoading(false)
    }
  }

  const [search, setSearch] = useState('')
  // Filter state lives in the trip store so it survives the Plan tab
  // unmounting (tab switch, mobile sheet close) and stays in lockstep with the
  // map markers, which filter on the same values (#1541).
  const filter = useTripStore((s) => s.placesFilter)
  const setFilter = useTripStore((s) => s.setPlacesFilter)
  const categoryFilters = useTripStore((s) => s.placesCategoryFilter)
  const setCategoryFilters = useTripStore((s) => s.setPlacesCategoryFilter)
  const [selectMode, setSelectMode] = useState(false)
  // Minimum average stars, matching the collections filter (#1435): 'all', or a
  // floor of 1..5 that unrated places fall through. It replaced a sort toggle,
  // which put the best first but still left everything else on the list — no
  // help at all when the point is to see only what the group actually rated.
  // In the trip store with the other filters, so the map markers follow it too.
  const ratingFilter = useTripStore((s) => s.placesRatingFilter)
  const setRatingFilter = useTripStore((s) => s.setPlacesRatingFilter)
  // The list's order (#2093), remembered on this device.
  const [placesSort, setPlacesSortState] = useState<PlacesSort>(readPlacesSort)
  const setPlacesSort = useCallback((sort: PlacesSort) => { setPlacesSortState(sort); writePlacesSort(sort) }, [])
  // Country, or country and region, from each place's resolved position (#2537). List-only,
  // like the rating floor.
  const [localityFilter, setLocalityFilter] = useState<LocalityFilter | null>(null)
  const localityOf = useMemo(() => new Map(places.map(p => [p.id, placeLocality(p, language)])), [places, language])
  const localities = useMemo(() => localityGroups(places.map(p => localityOf.get(p.id)!)), [places, localityOf])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[] | null>(null)
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false)
  const [saveToListOpen, setSaveToListOpen] = useState(false)

  const [markVisitedBusy, setMarkVisitedBusy] = useState(false)

  const exitSelectMode = () => { setSelectMode(false); setSelectedIds(new Set()) }

  /**
   * "I have been to these" for the selection, applied wherever the places are
   * saved in the library (#1469). The server does the matching, so a place saved
   * under a different name in a list is still found.
   */
  const markSelectionVisited = useCallback(async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0 || markVisitedBusy) return
    setMarkVisitedBusy(true)
    try {
      const { updated, places: matchedPlaces } = await collectionsApi.setStatusFromTrip(props.tripId, ids, 'visited')
      if (updated === 0) toast.info(t('collections.markVisitedNone'))
      else toast.success(t('collections.markedVisitedTrip', { count: matchedPlaces ?? 0 }))
      exitSelectMode()
    } catch {
      toast.error(t('common.error'))
    } finally {
      setMarkVisitedBusy(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, markVisitedBusy, props.tripId, t])

  // Auto-exit when all selected places have been removed from the store (e.g. after bulk delete)
  useEffect(() => {
    if (!selectMode || selectedIds.size === 0) return
    const placeIdSet = new Set(places.map(p => p.id))
    if ([...selectedIds].every(id => !placeIdSet.has(id))) {
      setSelectMode(false)
      setSelectedIds(new Set())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places])

  const toggleSelected = useCallback((id: number) => setSelectedIds(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  }), [])

  const toggleCategoryFilter = (catId: string) => {
    const next = new Set(categoryFilters)
    if (next.has(catId)) next.delete(catId); else next.add(catId)
    setCategoryFilters(next)
  }
  const [dayPickerPlace, setDayPickerPlace] = useState<Place | null>(null)
  // One panel holds what used to be three dropdowns (show, categories, rating).
  const [mobileShowDays, setMobileShowDays] = useState(false)

  /** A new "show" choice starts a fresh selection, as picking it from the old select did. */
  const pickFilter = (next: PlacesFilter) => { setFilter(next); setSelectedIds(new Set()) }

  // Alle geplanten Ort-IDs abrufen (einem Tag zugewiesen)
  // Whether to offer the "Tracks" tab. useTripPlanner moves the filter back to
  // "all" once the last track is gone, whichever screen is in front.
  const hasTracks = useMemo(() => places.some(p => p.route_geometry), [places])

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
    const list = places.filter(p => {
      if (!matchesPlacesFilter(p, { filter, categoryFilters, ratingFilter }, { plannedIds, plannedFilterIds })) return false
      if (!placeMatchesSearch(p, search)) return false
      if (localityFilter && !matchesLocality(localityOf.get(p.id), localityFilter)) return false
      return true
    })
    return sortPlaces(list, placesSort, language)
  }, [places, filter, categoryFilters, search, plannedIds, plannedFilterIds, ratingFilter, localityFilter, localityOf, placesSort, language])

  /**
   * How many places each "show" choice would leave, under the category and search
   * filters but not the rating floor. While a day is open "planned" counts that day's
   * plan, the same set the list and the map show: counting the whole trip is what made
   * the choice read 55 beside five pins, with nothing to say the two answered
   * different questions.
   */
  const filterCounts = useMemo(() => {
    const base = places.filter(p => matchesCategoryFilter(p, categoryFilters) && placeMatchesSearch(p, search))
    return {
      all: base.length,
      unplanned: base.filter(p => !plannedIds.has(p.id)).length,
      planned: base.filter(p => plannedFilterIds.has(p.id)).length,
      tracks: base.filter(p => p.route_geometry).length,
    } satisfies Record<PlacesFilter, number>
  }, [places, categoryFilters, search, plannedIds, plannedFilterIds])

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
    listImportOpen, setListImportOpen, listImportUrl, setListImportUrl,
    listImportLoading, listImportProvider, setListImportProvider,
    listImportEnrich, setListImportEnrich, canEnrichImport,
    availableListImportProviders, hasMultipleListImportProviders, handleListImport,
    search, setSearch, filter, setFilter, pickFilter, filterCounts,
    categoryFilters, setCategoryFilters,
    ratingFilter, setRatingFilter,
    placesSort, setPlacesSort,
    localityFilter, setLocalityFilter, localities,
    selectMode, setSelectMode, selectedIds, setSelectedIds, pendingDeleteIds, setPendingDeleteIds,
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
