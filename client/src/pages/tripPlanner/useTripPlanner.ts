import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useTripStore } from '../../store/tripStore'
import { useCanDo } from '../../store/permissionsStore'
import { useSettingsStore } from '../../store/settingsStore'
import { getCached, fetchPhoto } from '../../services/photoService'
import { useToast } from '../../components/shared/Toast'
import { Map, Ticket, PackageCheck, Wallet, FolderOpen, Users, Train } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { addonsApi, accommodationsApi, authApi, tripsApi, assignmentsApi, healthApi, airtrailApi } from '../../api/client'
import { accommodationRepo } from '../../repo/accommodationRepo'
import { offlineDb } from '../../db/offlineDb'
import { useAuthStore } from '../../store/authStore'
import { useResizablePanels } from '../../hooks/useResizablePanels'
import { useTripWebSocket } from '../../hooks/useTripWebSocket'
import { useRouteCalculation } from '../../hooks/useRouteCalculation'
import { usePlaceSelection } from '../../hooks/usePlaceSelection'
import { usePlannerHistory } from '../../hooks/usePlannerHistory'
import { useAirtrailConnection } from '../../hooks/useAirtrailConnection'
import type { Accommodation, TripMember, Day, Place, Reservation } from '../../types'
import { resolvePoolAssignmentId } from './tripPlannerModel'

/**
 * Trip planner page logic — the big one. Owns the trip store wiring, addon
 * gating, accommodations/members loading, the tab + resizable-panel + selection
 * state, every place/assignment/reservation/transport CRUD handler (with undo),
 * the map filters/derivations and the splash gate. TripPlannerPage stays a
 * wiring container that lays out the day/map/places panes and modals.
 * Behaviour is identical to the previous in-component logic.
 */
export function useTripPlanner() {
  const { id } = useParams<{ id: string }>()
  // The route param is a string; convert once here so every downstream component
  // prop and store call gets a real number. An absent/invalid id becomes NaN,
  // which stays falsy in the `if (tripId)` guards below.
  const tripId = id ? Number(id) : NaN
  const navigate = useNavigate()
  const toast = useToast()
  const { t, language } = useTranslation()
  const { settings } = useSettingsStore()
  const placesPhotosEnabled = useAuthStore(s => s.placesPhotosEnabled)
  const trip = useTripStore(s => s.trip)
  const days = useTripStore(s => s.days)
  const places = useTripStore(s => s.places)
  const assignments = useTripStore(s => s.assignments)
  const packingItems = useTripStore(s => s.packingItems)
  const todoItems = useTripStore(s => s.todoItems)
  const categories = useTripStore(s => s.categories)
  const reservations = useTripStore(s => s.reservations)
  const budgetItems = useTripStore(s => s.budgetItems)
  const files = useTripStore(s => s.files)
  const selectedDayId = useTripStore(s => s.selectedDayId)
  const isLoading = useTripStore(s => s.isLoading)
  // Actions — stable references, don't cause re-renders
  const tripActions = useRef(useTripStore.getState()).current
  const can = useCanDo()
  const canUploadFiles = can('file_upload', trip)
  const { pushUndo, undo, canUndo, lastActionLabel } = usePlannerHistory()

  const handleUndo = useCallback(async () => {
    const label = lastActionLabel
    await undo()
    toast.info(t('undo.done', { action: label ?? '' }))
  }, [undo, lastActionLabel, toast])

  const [enabledAddons, setEnabledAddons] = useState<Record<string, boolean>>({ packing: true, budget: true, documents: true, collab: false })
  const [collabFeatures, setCollabFeatures] = useState<{ chat: boolean; notes: boolean; polls: boolean; whatsnext: boolean }>({ chat: true, notes: true, polls: true, whatsnext: true })
  const [tripAccommodations, setTripAccommodations] = useState<Accommodation[]>([])
  const [allowedFileTypes, setAllowedFileTypes] = useState<string | null>(null)
  const [tripMembers, setTripMembers] = useState<TripMember[]>([])

  const loadAccommodations = useCallback(() => {
    if (tripId) {
      accommodationRepo.list(tripId).then(d => setTripAccommodations(d.accommodations || [])).catch(() => {})
      tripActions.loadReservations(tripId)
    }
  }, [tripId])

  useEffect(() => {
    addonsApi.enabled().then(data => {
      const map: Record<string, boolean> = {}
      data.addons.forEach(a => { map[a.id] = true })
      setEnabledAddons({ packing: !!map.packing, budget: !!map.budget, documents: !!map.documents, collab: !!map.collab })
      if (data.collabFeatures) setCollabFeatures(data.collabFeatures)
    }).catch(() => {})
    authApi.getAppConfig().then(config => {
      if (config.allowed_file_types) setAllowedFileTypes(config.allowed_file_types)
    }).catch(() => {})
  }, [])

  const TRANSPORT_TYPES = new Set(['flight', 'train', 'bus', 'car', 'taxi', 'bicycle', 'cruise', 'ferry', 'transport_other'])

  const TRIP_TABS = [
    { id: 'plan', label: t('trip.tabs.plan'), icon: Map },
    { id: 'transports', label: t('trip.tabs.transports'), icon: Train },
    { id: 'buchungen', label: t('trip.tabs.reservations'), shortLabel: t('trip.tabs.reservationsShort'), icon: Ticket },
    ...(enabledAddons.packing ? [{ id: 'listen', label: t('trip.tabs.lists'), shortLabel: t('trip.tabs.listsShort'), icon: PackageCheck }] : []),
    ...(enabledAddons.budget ? [{ id: 'finanzplan', label: t('trip.tabs.budget'), icon: Wallet }] : []),
    ...(enabledAddons.documents ? [{ id: 'dateien', label: t('trip.tabs.files'), icon: FolderOpen }] : []),
    ...(enabledAddons.collab ? [{ id: 'collab', label: t('admin.addons.catalog.collab.name'), icon: Users }] : []),
  ]

  const [activeTab, setActiveTab] = useState<string>(() => {
    const saved = sessionStorage.getItem(`trip-tab-${tripId}`)
    return saved || 'plan'
  })

  useEffect(() => {
    const validTabIds = TRIP_TABS.map(t => t.id)
    if (!validTabIds.includes(activeTab)) {
      setActiveTab('plan')
      sessionStorage.setItem(`trip-tab-${tripId}`, 'plan')
    }
  }, [enabledAddons])

  const handleTabChange = (tabId: string): void => {
    setActiveTab(tabId)
    sessionStorage.setItem(`trip-tab-${tripId}`, tabId)
    if (tabId === 'finanzplan') tripActions.loadBudgetItems?.(tripId)
    if (tabId === 'dateien' && (!files || files.length === 0)) tripActions.loadFiles?.(tripId)
  }
  const { leftWidth, rightWidth, leftCollapsed, rightCollapsed, setLeftCollapsed, setRightCollapsed, startResizeLeft, startResizeRight } = useResizablePanels()
  const { selectedPlaceId, selectedAssignmentId, setSelectedPlaceId, selectAssignment } = usePlaceSelection()
  const [showDayDetail, setShowDayDetail] = useState<Day | null>(null)
  const [dayDetailCollapsed, setDayDetailCollapsed] = useState(false)
  const [showPlaceForm, setShowPlaceForm] = useState<boolean>(false)
  const [editingPlace, setEditingPlace] = useState<Place | null>(null)
  const [prefillCoords, setPrefillCoords] = useState<{ lat: number; lng: number; name?: string; address?: string; website?: string; phone?: string; osm_id?: string } | null>(null)
  const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  // The bottom-nav "+" opens the new-place form via ?create=place.
  useEffect(() => {
    if (searchParams.get('create') === 'place') {
      setEditingPlace(null); setEditingAssignmentId(null); setShowPlaceForm(true)
      setSearchParams(p => { p.delete('create'); return p }, { replace: true })
    }
  }, [searchParams])
  const [showTripForm, setShowTripForm] = useState<boolean>(false)
  const [showMembersModal, setShowMembersModal] = useState<boolean>(false)
  const [showReservationModal, setShowReservationModal] = useState<boolean>(false)
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  const [showBookingImport, setShowBookingImport] = useState<boolean>(false)
  const [bookingImportAvailable, setBookingImportAvailable] = useState<boolean>(false)
  const { available: airTrailAvailable } = useAirtrailConnection()
  const [showAirTrailImport, setShowAirTrailImport] = useState<boolean>(false)
  // Pull this user's AirTrail edits as soon as they open the trip, so changes
  // made in AirTrail show up without waiting for the background poll.
  const airtrailSyncedRef = useRef<number | null>(null)
  useEffect(() => {
    if (!airTrailAvailable || !tripId || airtrailSyncedRef.current === tripId) return
    airtrailSyncedRef.current = tripId
    airtrailApi.sync()
      .then(r => { if (r && r.changed > 0) tripActions.loadReservations(tripId) })
      .catch(() => {})
  }, [airTrailAvailable, tripId, tripActions])
  const [bookingForAssignmentId, setBookingForAssignmentId] = useState<number | null>(null)
  const [showTransportModal, setShowTransportModal] = useState<boolean>(false)
  const [editingTransport, setEditingTransport] = useState<Reservation | null>(null)
  const [transportModalDayId, setTransportModalDayId] = useState<number | null>(null)
  // Manual route planning: off by default, toggled from the day-plan footer. Mode
  // (driving/walking) is per-session and selects which travel time the connectors show.
  const [routeShown, setRouteShown] = useState(false)
  const [routeProfile, setRouteProfile] = useState<'driving' | 'walking'>('driving')
  const [fitKey, setFitKey] = useState<number>(0)
  const initialFitTripId = useRef<number | null>(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<'left' | 'right' | null>(null)
  const mobilePlanScrollTopRef = useRef<number>(0)
  const mobilePlacesScrollTopRef = useRef<number>(0)
  const [deletePlaceId, setDeletePlaceId] = useState<number | null>(null)
  const [deletePlaceIds, setDeletePlaceIds] = useState<number[] | null>(null)

  useEffect(() => {
    if (!trip) return
    if (initialFitTripId.current === trip.id) return
    const hasGeoPlaces = places.some(p => p.lat != null && p.lng != null)
    if (!hasGeoPlaces) return
    initialFitTripId.current = trip.id
    setFitKey(k => k + 1)
  }, [trip, places])

  useEffect(() => {
    healthApi.features().then(f => setBookingImportAvailable(f.bookingImport)).catch(() => {})
  }, [])

  const connectionsStorageKey = tripId ? `trek:visible-connections:${tripId}` : null
  const [visibleConnections, setVisibleConnections] = useState<number[]>(() => {
    if (typeof window === 'undefined' || !connectionsStorageKey) return []
    try {
      const stored = window.localStorage.getItem(connectionsStorageKey)
      return stored ? JSON.parse(stored) as number[] : []
    } catch { return [] }
  })
  useEffect(() => {
    if (typeof window === 'undefined' || !connectionsStorageKey) return
    window.localStorage.setItem(connectionsStorageKey, JSON.stringify(visibleConnections))
  }, [connectionsStorageKey, visibleConnections])
  const toggleConnection = useCallback((id: number) => {
    setVisibleConnections(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }, [])
  const [mapTransportDetail, setMapTransportDetail] = useState<Reservation | null>(null)

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Start photo fetches during splash screen so images are ready when map mounts
  useEffect(() => {
    if (isLoading || !places || places.length === 0 || !placesPhotosEnabled) return
    for (const p of places) {
      if (p.image_url) continue
      const cacheKey = p.google_place_id || p.osm_id || `${p.lat},${p.lng}`
      if (!cacheKey || getCached(cacheKey)) continue
      const photoId = p.google_place_id || p.osm_id
      if (photoId || (p.lat && p.lng)) {
        fetchPhoto(cacheKey, photoId || `coords:${p.lat}:${p.lng}`, p.lat, p.lng, p.name)
      }
    }
  }, [isLoading, places])

  // Load the trip. loadTrip hydrates every trip-scoped slice (days, places,
  // packing, todo, budget, reservations, files) so offline hydration is uniform
  // and there's no cross-trip bleed; members/accommodations load alongside.
  useEffect(() => {
    if (tripId) {
      tripActions.loadTrip(tripId).catch(() => { toast.error(t('trip.toast.loadError')); navigate('/dashboard') })
      loadAccommodations()
      if (!navigator.onLine) {
        offlineDb.tripMembers.where('tripId').equals(Number(tripId)).toArray()
          .then(rows => setTripMembers(rows))
          .catch(() => {})
      } else {
        tripsApi.getMembers(tripId).then(d => {
          const all = [d.owner, ...(d.members || [])].filter(Boolean)
          setTripMembers(all)
        }).catch(() => {})
      }
    }
  }, [tripId])

  useTripWebSocket(tripId)

  const [mapCategoryFilter, setMapCategoryFilter] = useState<Set<string>>(new Set())
  const [mapPlacesFilter, setMapPlacesFilter] = useState<string>('all')

  const [expandedDayIds, setExpandedDayIds] = useState<Set<number> | null>(null)

  const mapPlaces = useMemo(() => {
    // Build set of place IDs assigned to collapsed days
    const hiddenPlaceIds = new Set<number>()
    if (expandedDayIds) {
      for (const [dayId, dayAssignments] of Object.entries(assignments)) {
        if (!expandedDayIds.has(Number(dayId))) {
          for (const a of dayAssignments) {
            if (a.place?.id) hiddenPlaceIds.add(a.place.id)
          }
        }
      }
      // Don't hide places that are also assigned to an expanded day
      for (const [dayId, dayAssignments] of Object.entries(assignments)) {
        if (expandedDayIds.has(Number(dayId))) {
          for (const a of dayAssignments) {
            hiddenPlaceIds.delete(a.place?.id)
          }
        }
      }
    }

    // Build set of planned place IDs for unplanned filter
    const plannedIds = mapPlacesFilter === 'unplanned'
      ? new Set(Object.values(assignments).flatMap(da => da.map(a => a.place?.id).filter(Boolean)))
      : null

    return places.filter(p => {
      if (!p.lat || !p.lng) return false
      if (mapPlacesFilter === 'tracks' && !p.route_geometry) return false
      if (mapCategoryFilter.size > 0) {
        if (p.category_id == null) {
          if (!mapCategoryFilter.has('uncategorized')) return false
        } else if (!mapCategoryFilter.has(String(p.category_id))) return false
      }
      if (hiddenPlaceIds.has(p.id)) return false
      if (plannedIds && plannedIds.has(p.id)) return false
      return true
    })
  }, [places, mapCategoryFilter, mapPlacesFilter, assignments, expandedDayIds])

  const { route, routeSegments, routeInfo, setRoute, setRouteInfo, updateRouteForDay } = useRouteCalculation({ assignments } as any, selectedDayId, routeShown, routeProfile)

  const handleSelectDay = useCallback((dayId: number | null, skipFit?: boolean) => {
    const changed = dayId !== selectedDayId
    tripActions.setSelectedDay(dayId)
    if (changed && !skipFit) setFitKey(k => k + 1)
    setMobileSidebarOpen(null)
    updateRouteForDay(dayId)
  }, [updateRouteForDay, selectedDayId])

  const handlePlaceClick = useCallback((placeId: number | null, assignmentId?: number | null) => {
    if (assignmentId) {
      selectAssignment(assignmentId, placeId)
    } else {
      setSelectedPlaceId(placeId)
    }
    if (placeId) { setShowDayDetail(null); setLeftCollapsed(false); setRightCollapsed(false) }
  }, [selectAssignment, setSelectedPlaceId])

  const handleMarkerClick = useCallback((placeId?: number) => {
    if (placeId === undefined) {
      setSelectedPlaceId(null)
      return
    }
    // Find every assignment for this place (same place can sit on several
    // days / be planned twice in one day). Cycle through them on repeated
    // marker clicks so the sidebar highlight jumps to the next occurrence
    // instead of leaving the user confused.
    const allAssignments = Object.values(useTripStore.getState().assignments || {}).flat()
    const matching = allAssignments.filter(a => a?.place?.id === placeId)

    if (matching.length === 0) {
      setSelectedPlaceId(selectedPlaceId === placeId ? null : placeId)
    } else if (matching.length === 1) {
      const only = matching[0]
      if (selectedAssignmentId === only.id) {
        setSelectedPlaceId(null)
      } else {
        selectAssignment(only.id, placeId)
      }
    } else {
      const currentIdx = matching.findIndex(a => a.id === selectedAssignmentId)
      const nextIdx = currentIdx === -1 ? 0 : currentIdx + 1
      if (nextIdx >= matching.length) {
        // cycled past the last occurrence — clear selection so the next
        // click starts fresh at occurrence 0.
        setSelectedPlaceId(null)
      } else {
        selectAssignment(matching[nextIdx].id, placeId)
      }
    }
    setLeftCollapsed(false); setRightCollapsed(false)
  }, [selectAssignment, selectedAssignmentId, selectedPlaceId, setSelectedPlaceId])

  const handleMapClick = useCallback(() => {
    setSelectedPlaceId(null)
  }, [])

  const handleMapContextMenu = useCallback(async (e) => {
    if (!can('place_edit', trip)) return
    e.originalEvent?.preventDefault()
    const { lat, lng } = e.latlng
    setPrefillCoords({ lat, lng })
    setEditingPlace(null)
    setEditingAssignmentId(null)
    setShowPlaceForm(true)
    try {
      const { mapsApi } = await import('../../api/client')
      const data = await mapsApi.reverse(lat, lng, language)
      if (data.name || data.address) {
        setPrefillCoords(prev => prev ? { ...prev, name: data.name || '', address: data.address || '' } : prev)
      }
    } catch { /* best effort */ }
  }, [language])

  // Open the Add-Place form pre-filled from an OSM "explore" POI marker — all the
  // data already comes from the POI, so no reverse-geocode is needed.
  const openAddPlaceFromPoi = useCallback((poi: { lat: number; lng: number; name: string; address: string | null; website: string | null; phone: string | null; osm_id: string }) => {
    if (!can('place_edit', trip)) return
    setPrefillCoords({
      lat: poi.lat,
      lng: poi.lng,
      name: poi.name,
      address: poi.address || '',
      website: poi.website || undefined,
      phone: poi.phone || undefined,
      osm_id: poi.osm_id,
    })
    setEditingPlace(null)
    setEditingAssignmentId(null)
    setShowPlaceForm(true)
  }, [trip])

  const handleSavePlace = useCallback(async (data) => {
    const pendingFiles = data._pendingFiles
    delete data._pendingFiles
    if (editingPlace) {
      // Always strip time fields from place update — time is per-assignment only
      const { place_time, end_time, ...placeData } = data
      await tripActions.updatePlace(tripId, editingPlace.id, placeData)
      // If editing from assignment context, save time per-assignment
      if (editingAssignmentId) {
        await assignmentsApi.updateTime(tripId, editingAssignmentId, { place_time: place_time || null, end_time: end_time || null })
        await tripActions.refreshDays(tripId)
      }
      // Upload pending files with place_id
      if (pendingFiles?.length > 0) {
        for (const file of pendingFiles) {
          const fd = new FormData()
          fd.append('file', file)
          fd.append('place_id', String(editingPlace.id))
          try { await tripActions.addFile(tripId, fd) } catch { toast.error(t('files.uploadError')) }
        }
      }
      toast.success(t('trip.toast.placeUpdated'))
    } else {
      const place = await tripActions.addPlace(tripId, data)
      if (pendingFiles?.length > 0 && place?.id) {
        for (const file of pendingFiles) {
          const fd = new FormData()
          fd.append('file', file)
          fd.append('place_id', String(place.id))
          try { await tripActions.addFile(tripId, fd) } catch { toast.error(t('files.uploadError')) }
        }
      }
      toast.success(t('trip.toast.placeAdded'))
      if (place?.id) {
        const capturedId = place.id
        pushUndo(t('undo.addPlace'), async () => {
          await tripActions.deletePlace(tripId, capturedId)
        })
      }
    }
  }, [editingPlace, editingAssignmentId, tripId, toast, pushUndo])

  // Open the place editor from any entry point (Places pool, inspector, map).
  // Times live per day-assignment, so when no day is in context resolve the
  // place's lone assignment to hydrate & persist its times; with 0 or 2+
  // assignments the time is ambiguous and the modal hides the fields (#1247).
  const openPlaceEditor = useCallback((place: Place, preferredAssignmentId: number | null = null) => {
    setEditingPlace(place)
    setEditingAssignmentId(preferredAssignmentId ?? resolvePoolAssignmentId(assignments, place.id))
    setShowPlaceForm(true)
  }, [assignments])

  const handleDeletePlace = useCallback((placeId) => {
    setDeletePlaceId(placeId)
  }, [])

  const confirmDeletePlace = useCallback(async () => {
    if (!deletePlaceId) return
    const state = useTripStore.getState()
    const capturedPlace = state.places.find(p => p.id === deletePlaceId)
    const capturedAssignments = Object.entries(state.assignments).flatMap(([dayId, as]) =>
      as.filter(a => a.place?.id === deletePlaceId).map(a => ({ dayId: Number(dayId), orderIndex: a.order_index }))
    )
    try {
      await tripActions.deletePlace(tripId, deletePlaceId)
      if (selectedPlaceId === deletePlaceId) setSelectedPlaceId(null)
      updateRouteForDay(selectedDayId)
      toast.success(t('trip.toast.placeDeleted'))
      if (capturedPlace) {
        pushUndo(t('undo.deletePlace'), async () => {
          const newPlace = await tripActions.addPlace(tripId, {
            name: capturedPlace.name,
            description: capturedPlace.description,
            lat: capturedPlace.lat,
            lng: capturedPlace.lng,
            address: capturedPlace.address,
            category_id: capturedPlace.category_id,
            price: capturedPlace.price,
          })
          for (const { dayId, orderIndex } of capturedAssignments) {
            await tripActions.assignPlaceToDay(tripId, dayId, newPlace.id, orderIndex)
          }
        })
      }
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.unknownError')) }
  }, [deletePlaceId, tripId, toast, selectedPlaceId, selectedDayId, updateRouteForDay, pushUndo])

  const confirmDeletePlaces = useCallback(async (ids?: number[]) => {
    const targetIds = ids ?? deletePlaceIds
    if (!targetIds?.length) return
    const state = useTripStore.getState()
    const capturedPlaces = state.places.filter(p => targetIds.includes(p.id))
    const capturedAssignments = Object.entries(state.assignments).flatMap(([dayId, as]) =>
      as.filter(a => a.place?.id != null && targetIds.includes(a.place.id)).map(a => ({ dayId: Number(dayId), placeId: a.place!.id, orderIndex: a.order_index }))
    )
    try {
      await tripActions.deletePlacesMany(tripId, targetIds)
      if (selectedPlaceId != null && targetIds.includes(selectedPlaceId)) setSelectedPlaceId(null)
      if (!ids) setDeletePlaceIds(null)
      updateRouteForDay(selectedDayId)
      toast.success(t('trip.toast.placesDeleted', { count: capturedPlaces.length }))
      if (capturedPlaces.length > 0) {
        pushUndo(t('undo.deletePlaces'), async () => {
          for (const place of capturedPlaces) {
            const newPlace = await tripActions.addPlace(tripId, {
              name: place.name, description: place.description,
              lat: place.lat, lng: place.lng, address: place.address,
              category_id: place.category_id, price: place.price,
            })
            for (const a of capturedAssignments.filter(x => x.placeId === place.id)) {
              await tripActions.assignPlaceToDay(tripId, a.dayId, newPlace.id, a.orderIndex)
            }
          }
        })
      }
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.unknownError')) }
  }, [deletePlaceIds, tripId, toast, selectedPlaceId, selectedDayId, updateRouteForDay, pushUndo])

  const handleAssignToDay = useCallback(async (placeId: number, dayId?: number, position?: number) => {
    const target = dayId || selectedDayId
    if (!target) { toast.error(t('trip.toast.selectDay')); return }
    try {
      const assignment = await tripActions.assignPlaceToDay(tripId, target, placeId, position)
      toast.success(t('trip.toast.assignedToDay'))
      updateRouteForDay(target)
      if (assignment?.id) {
        const capturedAssignmentId = assignment.id
        const capturedTarget = target
        pushUndo(t('undo.assignPlace'), async () => {
          await tripActions.removeAssignment(tripId, capturedTarget, capturedAssignmentId)
        })
      }
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.unknownError')) }
  }, [selectedDayId, tripId, toast, updateRouteForDay, pushUndo])

  const handleRemoveAssignment = useCallback(async (dayId: number, assignmentId: number) => {
    const state = useTripStore.getState()
    const capturedAssignment = (state.assignments[String(dayId)] || []).find(a => a.id === assignmentId)
    const capturedPlaceId = capturedAssignment?.place?.id
    const capturedOrderIndex = capturedAssignment?.order_index ?? 0
    try {
      await tripActions.removeAssignment(tripId, dayId, assignmentId)
      updateRouteForDay(dayId)
      if (capturedPlaceId != null) {
        const capturedDayId = dayId
        const capturedPos = capturedOrderIndex
        pushUndo(t('undo.removeAssignment'), async () => {
          await tripActions.assignPlaceToDay(tripId, capturedDayId, capturedPlaceId, capturedPos)
        })
      }
    }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.unknownError')) }
  }, [tripId, toast, updateRouteForDay, pushUndo])

  const handleReorder = useCallback((dayId: number, orderedIds: number[]) => {
    const prevIds = (useTripStore.getState().assignments[String(dayId)] || [])
      .slice().sort((a, b) => a.order_index - b.order_index).map(a => a.id)
    try {
      tripActions.reorderAssignments(tripId, dayId, orderedIds)
        .then(() => {
          const capturedDayId = dayId
          const capturedPrevIds = prevIds
          pushUndo(t('undo.reorder'), async () => {
            await tripActions.reorderAssignments(tripId, capturedDayId, capturedPrevIds)
          })
        })
        .catch(err => toast.error(err instanceof Error ? err.message : t('trip.toast.reorderError')))
      updateRouteForDay(dayId)
    }
    catch { toast.error(t('trip.toast.reorderError')) }
  }, [tripId, toast, pushUndo, updateRouteForDay])

  const handleUpdateDayTitle = useCallback(async (dayId, title) => {
    try { await tripActions.updateDayTitle(tripId, dayId, title) }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.unknownError')) }
  }, [tripId, toast])

  const handleReorderDays = useCallback((orderedIds: number[]) => {
    const prevIds = (useTripStore.getState().days || [])
      .slice().sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0)).map(d => d.id)
    tripActions.reorderDays(tripId, orderedIds)
      .then(() => {
        pushUndo(t('dayplan.reorderUndo'), async () => {
          await tripActions.reorderDays(tripId, prevIds)
        })
      })
      .catch(err => toast.error(err instanceof Error ? err.message : t('dayplan.reorderError')))
  }, [tripId, toast, pushUndo])

  const handleAddDay = useCallback((position?: number) => {
    tripActions.insertDay(tripId, position)
      .catch(err => toast.error(err instanceof Error ? err.message : t('dayplan.addDayError')))
  }, [tripId, toast])

  const handleSaveReservation = async (data: Record<string, string | number | null> & { title: string }) => {
    try {
      if (editingReservation) {
        // Don't force a day here. The old code pinned it to the (often empty)
        // selected day, which dropped the booking out of the Plan; preserving the
        // old day_id instead left it stale when the date changed. Omitting it lets
        // the server derive the day from the booking's date, or keep the current
        // one when there is no date.
        const r = await tripActions.updateReservation(tripId, editingReservation.id, data)
        toast.success(t('trip.toast.reservationUpdated'))
        setShowReservationModal(false)
        setEditingReservation(null)
        if (data.type === 'hotel') {
          accommodationsApi.list(tripId).then(d => setTripAccommodations(d.accommodations || [])).catch(() => {})
        }
        return r
      } else {
        const r = await tripActions.addReservation(tripId, { ...data, day_id: selectedDayId || null })
        toast.success(t('trip.toast.reservationAdded'))
        setShowReservationModal(false)
        // Refresh accommodations if hotel was created
        if (data.type === 'hotel') {
          accommodationsApi.list(tripId).then(d => setTripAccommodations(d.accommodations || [])).catch(() => {})
        }
        return r
      }
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.unknownError')) }
  }

  const handleSaveTransport = async (data: Record<string, any> & { title: string }) => {
    try {
      if (editingTransport) {
        const r = await tripActions.updateReservation(tripId, editingTransport.id, data)
        toast.success(t('trip.toast.reservationUpdated'))
        setShowTransportModal(false)
        setEditingTransport(null)
        setTransportModalDayId(null)
        return r
      } else {
        const r = await tripActions.addReservation(tripId, data)
        toast.success(t('trip.toast.reservationAdded'))
        setShowTransportModal(false)
        setEditingTransport(null)
        setTransportModalDayId(null)
        return r
      }
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.unknownError')) }
  }

  const handleDeleteReservation = async (id) => {
    try {
      await tripActions.deleteReservation(tripId, id)
      toast.success(t('trip.toast.deleted'))
      // Refresh accommodations in case a hotel booking was deleted
      accommodationsApi.list(tripId).then(d => setTripAccommodations(d.accommodations || [])).catch(() => {})
    }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.unknownError')) }
  }

  const selectedPlace = selectedPlaceId ? places.find(p => p.id === selectedPlaceId) : null

  // Build placeId → order-number map from the selected day's assignments
  const dayOrderMap = useMemo(() => {
    if (!selectedDayId) return {}
    const da = assignments[String(selectedDayId)] || []
    const sorted = [...da].sort((a, b) => a.order_index - b.order_index)
    const map = {}
    sorted.forEach((a, i) => {
      if (!a.place?.id) return
      if (!map[a.place.id]) map[a.place.id] = []
      map[a.place.id].push(i + 1)
    })
    return map
  }, [selectedDayId, assignments])

  // Places assigned to selected day (with coords) — used for map fitting
  const dayPlaces = useMemo(() => {
    if (!selectedDayId) return []
    const da = assignments[String(selectedDayId)] || []
    return da.map(a => a.place).filter(p => p?.lat && p?.lng)
  }, [selectedDayId, assignments])

  const mapTileUrl = settings.map_tile_url || 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
  const defaultCenter = [settings.default_lat || 48.8566, settings.default_lng || 2.3522]
  const defaultZoom = settings.default_zoom || 10

  const fontStyle = { fontFamily: "var(--font-system)" }

  // Splash screen — show for initial load + a brief moment for photos to start loading
  const [splashDone, setSplashDone] = useState(false)
  useEffect(() => {
    if (!isLoading && trip) {
      const timer = setTimeout(() => setSplashDone(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [isLoading, trip])

  return {
    tripId, navigate, toast, t, language, settings, placesPhotosEnabled,
    trip, days, places, assignments, packingItems, todoItems, categories, reservations, budgetItems, files,
    selectedDayId, isLoading, tripActions, can, canUploadFiles,
    pushUndo, undo, canUndo, lastActionLabel, handleUndo,
    enabledAddons, collabFeatures, tripAccommodations, setTripAccommodations,
    allowedFileTypes, tripMembers, setTripMembers, loadAccommodations,
    TRANSPORT_TYPES, TRIP_TABS, activeTab, setActiveTab, handleTabChange,
    leftWidth, rightWidth, leftCollapsed, rightCollapsed, setLeftCollapsed, setRightCollapsed, startResizeLeft, startResizeRight,
    selectedPlaceId, selectedAssignmentId, setSelectedPlaceId, selectAssignment,
    showDayDetail, setShowDayDetail, dayDetailCollapsed, setDayDetailCollapsed,
    showPlaceForm, setShowPlaceForm, editingPlace, setEditingPlace,
    prefillCoords, setPrefillCoords, editingAssignmentId, setEditingAssignmentId,
    showTripForm, setShowTripForm, showMembersModal, setShowMembersModal,
    showReservationModal, setShowReservationModal, editingReservation, setEditingReservation,
    showBookingImport, setShowBookingImport, bookingImportAvailable,
    airTrailAvailable, showAirTrailImport, setShowAirTrailImport,
    bookingForAssignmentId, setBookingForAssignmentId,
    showTransportModal, setShowTransportModal, editingTransport, setEditingTransport,
    transportModalDayId, setTransportModalDayId,
    routeShown, setRouteShown, routeProfile, setRouteProfile, fitKey, setFitKey,
    mobileSidebarOpen, setMobileSidebarOpen, mobilePlanScrollTopRef, mobilePlacesScrollTopRef,
    deletePlaceId, setDeletePlaceId, deletePlaceIds, setDeletePlaceIds,
    visibleConnections, setVisibleConnections, toggleConnection, mapTransportDetail, setMapTransportDetail,
    isMobile, mapCategoryFilter, setMapCategoryFilter, mapPlacesFilter, setMapPlacesFilter,
    expandedDayIds, setExpandedDayIds, mapPlaces,
    route, routeSegments, routeInfo, setRoute, setRouteInfo, updateRouteForDay,
    handleSelectDay, handlePlaceClick, handleMarkerClick, handleMapClick, handleMapContextMenu, openAddPlaceFromPoi,
    handleSavePlace, openPlaceEditor, handleDeletePlace, confirmDeletePlace, confirmDeletePlaces,
    handleAssignToDay, handleRemoveAssignment, handleReorder, handleReorderDays, handleAddDay, handleUpdateDayTitle,
    handleSaveReservation, handleSaveTransport, handleDeleteReservation,
    selectedPlace, dayOrderMap, dayPlaces,
    mapTileUrl, defaultCenter, defaultZoom, fontStyle, splashDone,
  }
}
