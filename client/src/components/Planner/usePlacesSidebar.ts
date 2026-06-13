import type React from 'react'
import { useState, useMemo, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { Pencil, Trash2, ExternalLink, Navigation, CalendarDays } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import { useContextMenu } from '../shared/ContextMenu'
import { placesApi } from '../../api/client'
import { useTripStore } from '../../store/tripStore'
import { useCanDo } from '../../store/permissionsStore'
import { useAuthStore } from '../../store/authStore'
import type { Place, Category, Day, AssignmentsMap } from '../../types'

export interface PlacesSidebarProps {
  tripId: number
  places: Place[]
  categories: Category[]
  assignments: AssignmentsMap
  selectedDayId: number | null
  selectedPlaceId: number | null
  onPlaceClick: (placeId: number | null) => void
  onAddPlace: () => void
  onAssignToDay: (placeId: number, dayId: number) => void
  onEditPlace: (place: Place) => void
  onDeletePlace: (placeId: number) => void
  onBulkDeletePlaces?: (ids: number[]) => void
  onBulkDeleteConfirm?: (ids: number[]) => void
  days: Day[]
  isMobile: boolean
  onCategoryFilterChange?: (categoryIds: Set<string>) => void
  onPlacesFilterChange?: (filter: string) => void
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
    tripId, places, assignments, selectedDayId,
    onCategoryFilterChange, onPlacesFilterChange, pushUndo, initialScrollTop, onScrollTopChange,
  } = props
  const { t } = useTranslation()
  const toast = useToast()
  const ctxMenu = useContextMenu()
  const trip = useTripStore((s) => s.trip)
  const loadTrip = useTripStore((s) => s.loadTrip)
  const can = useCanDo()
  const canEditPlaces = can('place_edit', trip)
  // Places-API enrichment (#886) needs a Google Maps key; gate the toggle on it.
  const canEnrichImport = useAuthStore((s) => s.hasMapsKey)
  const isNaverListImportEnabled = true

  const [fileImportOpen, setFileImportOpen] = useState(false)
  const [sidebarDropFile, setSidebarDropFile] = useState<File | null>(null)
  const [sidebarDragOver, setSidebarDragOver] = useState(false)
  const sidebarDragCounter = useRef(0)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
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
  const availableListImportProviders: Array<'google' | 'naver'> = isNaverListImportEnabled ? ['google', 'naver'] : ['google']
  const hasMultipleListImportProviders = availableListImportProviders.length > 1

  useEffect(() => {
    if (!isNaverListImportEnabled && listImportProvider === 'naver') {
      setListImportProvider('google')
    }
  }, [isNaverListImportEnabled, listImportProvider])

  const handleListImport = async () => {
    if (!listImportUrl.trim()) return
    setListImportLoading(true)
    const provider = listImportProvider === 'naver' && isNaverListImportEnabled ? 'naver' : 'google'
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
  const [filter, setFilter] = useState('all')
  const [categoryFilters, setCategoryFiltersLocal] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[] | null>(null)

  const exitSelectMode = () => { setSelectMode(false); setSelectedIds(new Set()) }

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
    setCategoryFiltersLocal(prev => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId); else next.add(catId)
      onCategoryFilterChange?.(next)
      return next
    })
  }
  const [dayPickerPlace, setDayPickerPlace] = useState(null)
  const [catDropOpen, setCatDropOpen] = useState(false)
  const [mobileShowDays, setMobileShowDays] = useState(false)

  // Alle geplanten Ort-IDs abrufen (einem Tag zugewiesen)
  const hasTracks = useMemo(() => places.some(p => p.route_geometry), [places])
  useEffect(() => { if (filter === 'tracks' && !hasTracks) setFilter('all') }, [hasTracks, filter])

  const plannedIds = useMemo(() => new Set(
    Object.values(assignments).flatMap(da => da.map(a => a.place?.id).filter(Boolean))
  ), [assignments])

  const filtered = useMemo(() => places.filter(p => {
    if (filter === 'unplanned' && plannedIds.has(p.id)) return false
    if (filter === 'tracks' && !p.route_geometry) return false
    if (categoryFilters.size > 0) {
      if (p.category_id == null) {
        if (!categoryFilters.has('uncategorized')) return false
      } else if (!categoryFilters.has(String(p.category_id))) return false
    }
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
        !(p.address || '').toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [places, filter, categoryFilters, search, plannedIds])

  const isAssignedToSelectedDay = (placeId) =>
    selectedDayId && (assignments[String(selectedDayId)] || []).some(a => a.place?.id === placeId)

  const selectedDayIdRef = useRef<number | null>(selectedDayId)
  useEffect(() => { selectedDayIdRef.current = selectedDayId }, [selectedDayId])

  const inDaySet = useMemo(() => {
    if (!selectedDayId) return new Set<number>()
    return new Set<number>((assignments[String(selectedDayId)] || []).map((a: any) => a.place?.id).filter(Boolean))
  }, [assignments, selectedDayId])

  const openContextMenu = useCallback((e: React.MouseEvent, place: Place) => {
    const selDayId = selectedDayIdRef.current
    ctxMenu.open(e, [
      canEditPlaces && { label: t('common.edit'), icon: Pencil, onClick: () => props.onEditPlace(place) },
      selDayId && { label: t('planner.addToDay'), icon: CalendarDays, onClick: () => props.onAssignToDay(place.id, selDayId) },
      place.website && { label: t('inspector.website'), icon: ExternalLink, onClick: () => window.open(place.website, '_blank') },
      (place.lat && place.lng) && { label: 'Google Maps', icon: Navigation, onClick: () => window.open(`https://www.google.com/maps/search/?api=1&query=${(place as any).google_place_id ? encodeURIComponent(place.name) + '&query_place_id=' + (place as any).google_place_id : place.lat + ',' + place.lng}`, '_blank') },
      { divider: true },
      canEditPlaces && { label: t('common.delete'), icon: Trash2, danger: true, onClick: () => props.onDeletePlace(place.id) },
    ])
  }, [ctxMenu.open, canEditPlaces, t, props.onEditPlace, props.onAssignToDay, props.onDeletePlace])

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
    search, setSearch, filter, setFilter, categoryFilters, setCategoryFiltersLocal,
    selectMode, setSelectMode, selectedIds, setSelectedIds, pendingDeleteIds, setPendingDeleteIds,
    exitSelectMode, toggleSelected, toggleCategoryFilter, dayPickerPlace, setDayPickerPlace,
    catDropOpen, setCatDropOpen, mobileShowDays, setMobileShowDays,
    hasTracks, plannedIds, filtered, isAssignedToSelectedDay, inDaySet, openContextMenu,
  }
}

export type SidebarState = ReturnType<typeof usePlacesSidebar>
