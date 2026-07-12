import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useTripStore } from '../../store/tripStore'
import { useCanDo } from '../../store/permissionsStore'
import { useSettingsStore } from '../../store/settingsStore'
import { getCached, fetchPhoto } from '../../services/photoService'
import { useToast } from '../../components/shared/Toast'
import { Map, Ticket, PackageCheck, Wallet, FolderOpen, Users, Train, Blocks } from 'lucide-react'
import { useTranslation, translateApiError } from '../../i18n'
import { addonsApi, accommodationsApi, authApi, tripsApi, assignmentsApi, healthApi, airtrailApi, mapsApi, placesApi } from '../../api/client'
import { parsedItemToDraft, isTransportItem, type BookingReviewDraft } from '../../components/Planner/parsedItemToDraft'
import type { BookingImportPreviewItem } from '@trek/shared'
import { accommodationRepo } from '../../repo/accommodationRepo'
import { offlineDb, getImportFiles, deleteImportFiles } from '../../db/offlineDb'
import { isEffectivelyOffline } from '../../sync/networkMode'
import { useBackgroundTasksStore } from '../../store/backgroundTasksStore'
import { useAuthStore } from '../../store/authStore'
import { useResizablePanels } from '../../hooks/useResizablePanels'
import { useTripWebSocket } from '../../hooks/useTripWebSocket'
import { useRouteCalculation } from '../../hooks/useRouteCalculation'
import { usePlaceSelection } from '../../hooks/usePlaceSelection'
import { usePlannerHistory } from '../../hooks/usePlannerHistory'
import { useAirtrailConnection } from '../../hooks/useAirtrailConnection'
import { usePluginStore } from '../../store/pluginStore'
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
  // trip-page plugins mount as tabs inside this trip planner (tripId-scoped).
  const allPlugins = usePluginStore(s => s.plugins)
  const pluginsLoaded = usePluginStore(s => s.loaded)
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

  // Re-fetch the trip roster so consumers (Costs participants, Collab, …) pick up a
  // just-added guest or member without a full page reload.
  const refreshMembers = useCallback(() => {
    if (!tripId || isEffectivelyOffline()) return
    tripsApi.getMembers(tripId).then(d => {
      const all = [d.owner, ...(d.members || [])].filter(Boolean)
      setTripMembers(all)
    }).catch(() => {})
  }, [tripId])

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

  const TRANSPORT_TYPES = new Set(['flight', 'train', 'bus', 'car', 'taxi', 'bicycle', 'cruise', 'ferry', 'transit', 'transport_other'])

  const tripPagePlugins = allPlugins.filter(p => p.type === 'trip-page')
  const tripPluginIds = tripPagePlugins.map(p => p.id).join(',')

  // A trip-page plugin may replace core tabs while it's active (its manifest names
  // them; 'plan' is never replaceable) and may pick where its own tab sits.
  const replacedTabs = new Set(tripPagePlugins.flatMap(p => p.tripPage?.replaces ?? []))
  const TRIP_TABS = [
    { id: 'plan', label: t('trip.tabs.plan'), icon: Map },
    { id: 'transports', label: t('trip.tabs.transports'), icon: Train },
    { id: 'buchungen', label: t('trip.tabs.reservations'), shortLabel: t('trip.tabs.reservationsShort'), icon: Ticket },
    ...(enabledAddons.packing ? [{ id: 'listen', label: t('trip.tabs.lists'), shortLabel: t('trip.tabs.listsShort'), icon: PackageCheck }] : []),
    ...(enabledAddons.budget ? [{ id: 'finanzplan', label: t('trip.tabs.budget'), icon: Wallet }] : []),
    ...(enabledAddons.documents ? [{ id: 'dateien', label: t('trip.tabs.files'), icon: FolderOpen }] : []),
    ...(enabledAddons.collab ? [{ id: 'collab', label: t('admin.addons.catalog.collab.name'), icon: Users }] : []),
  ].filter(tab => tab.id === 'plan' || !replacedTabs.has(tab.id))
  // Positioned plugin tabs splice in ascending order so two positions stay stable;
  // the rest append, exactly as before this capability existed.
  const positioned = tripPagePlugins.filter(p => p.tripPage?.position != null).sort((a, b) => (a.tripPage!.position! - b.tripPage!.position!))
  for (const p of positioned) TRIP_TABS.splice(Math.min(p.tripPage!.position!, TRIP_TABS.length), 0, { id: `plugin:${p.id}`, label: p.name, icon: Blocks })
  for (const p of tripPagePlugins.filter(p => p.tripPage?.position == null)) TRIP_TABS.push({ id: `plugin:${p.id}`, label: p.name, icon: Blocks })

  const [activeTab, setActiveTab] = useState<string>(() => {
    const saved = sessionStorage.getItem(`trip-tab-${tripId}`)
    return saved || 'plan'
  })

  useEffect(() => {
    // Don't evict a saved plugin tab before the plugin feed has loaded.
    if (activeTab.startsWith('plugin:') && !pluginsLoaded) return
    const validTabIds = TRIP_TABS.map(t => t.id)
    if (!validTabIds.includes(activeTab)) {
      setActiveTab('plan')
      sessionStorage.setItem(`trip-tab-${tripId}`, 'plan')
    }
  }, [enabledAddons, tripPluginIds, pluginsLoaded])

  const handleTabChange = (rawTabId: string): void => {
    // A core tab a plugin replaced is gone from the bar, but a programmatic jump
    // (e.g. onNavigateToFiles) could still target it and render a dead panel with
    // no active pill — fall back to the plan view like the invalid-tab guard does.
    const tabId = replacedTabs.has(rawTabId) ? 'plan' : rawTabId
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
  // Public transit (#1065): open the TransportModal in its Automated mode, seed
  // the search (change-route), and show the journey view for a saved entry.
  const [transportModalAutomated, setTransportModalAutomated] = useState<boolean>(false)
  const [transitPrefill, setTransitPrefill] = useState<{ from?: { name: string; lat: number; lng: number } | null; to?: { name: string; lat: number; lng: number } | null } | null>(null)
  const [transitJourney, setTransitJourney] = useState<Reservation | null>(null)

  // The bottom-nav "+" is context-aware per tab: on the Bookings / Transports tabs
  // it opens the booking / transport modal via ?create=reservation|transport
  // (place is handled above, expense in CostsPanel). #1349
  useEffect(() => {
    const intent = searchParams.get('create')
    if (intent === 'reservation') {
      setEditingReservation(null); setBookingForAssignmentId(null); setShowReservationModal(true)
      setSearchParams(p => { p.delete('create'); return p }, { replace: true })
    } else if (intent === 'transport') {
      setEditingTransport(null); setTransportModalDayId(null); setShowTransportModal(true)
      setSearchParams(p => { p.delete('create'); return p }, { replace: true })
    }
  }, [searchParams])
  // Review-before-save import: each parsed item pre-fills the normal edit modal so
  // the user checks/fixes it, then saves. A ref drives the queue (no stale closures).
  const [reservationPrefill, setReservationPrefill] = useState<BookingReviewDraft | null>(null)
  const [transportPrefill, setTransportPrefill] = useState<BookingReviewDraft | null>(null)
  const [importReviewActive, setImportReviewActive] = useState(false)
  const importQueueRef = useRef<BookingImportPreviewItem[]>([])
  // The files this import was parsed from, so each reviewed booking can attach its source doc.
  const importSourceFilesRef = useRef<File[]>([])
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
      if (isEffectivelyOffline()) {
        offlineDb.tripMembers.where('tripId').equals(Number(tripId)).toArray()
          .then(rows => setTripMembers(rows))
          .catch(() => {})
      } else {
        refreshMembers()
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

  const { route, routeSegments, routeInfo, setRoute, setRouteInfo, updateRouteForDay } = useRouteCalculation({ assignments } as any, selectedDayId, routeShown, routeProfile, tripAccommodations)

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
          try { await tripActions.addFile(tripId, fd) } catch (err) { toast.error(translateApiError(t, err, 'files.uploadError')) }
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
          try { await tripActions.addFile(tripId, fd) } catch (err) { toast.error(translateApiError(t, err, 'files.uploadError')) }
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

  const confirmChangeCategory = useCallback(async (ids: number[], categoryId: number | null) => {
    if (!ids.length) return
    const state = useTripStore.getState()
    // Capture each place's prior category so undo can restore them per group.
    const captured = state.places.filter(p => ids.includes(p.id)).map(p => ({ id: p.id, prev: p.category_id ?? null }))
    try {
      await tripActions.updatePlacesMany(tripId, ids, { category_id: categoryId })
      toast.success(t('places.categoryChanged', { count: ids.length }))
      if (captured.length > 0) {
        pushUndo(t('undo.changeCategory'), async () => {
          // Group the captured ids by their prior category so each set is restored
          // in one call ('null' key = previously uncategorized). Map is shadowed by
          // the lucide icon import in this file, so use a plain object.
          const byPrev: Record<string, number[]> = {}
          for (const { id, prev } of captured) {
            const key = prev === null ? 'null' : String(prev)
            ;(byPrev[key] ??= []).push(id)
          }
          for (const [key, group] of Object.entries(byPrev)) {
            await tripActions.updatePlacesMany(tripId, group, { category_id: key === 'null' ? null : Number(key) })
          }
        })
      }
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.unknownError')) }
  }, [tripId, toast, pushUndo])

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
      // Imported hotel with a reviewed address but no existing place picked: match
      // an existing place by name, else geocode the address and create one, then link it.
      const acc = (data as Record<string, any>).create_accommodation
      if (data.type === 'hotel' && acc && acc.venue && !acc.place_id) {
        acc.place_id = (await resolveImportedPlace(acc.venue)) ?? undefined
        delete acc.venue
      }
      // A hotel's address lives on the linked place. Write an edited address
      // through to it, otherwise the typed value was silently dropped and the
      // old one reappeared on the next open (#1496).
      if (data.type === 'hotel' && acc && typeof acc.address === 'string') {
        const address = acc.address.trim()
        const linkedPlace = acc.place_id ? places.find(p => p.id === Number(acc.place_id)) : undefined
        if (address && linkedPlace && (linkedPlace.address || '') !== address) {
          try { await tripActions.updatePlace(tripId, linkedPlace.id, { address }) }
          catch { /* keep saving the booking; the address still lands in location */ }
        }
        delete acc.address
      }
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
        // An imported booking auto-creates a linked cost server-side; the saving client gets
        // no budget:created echo, so refresh the budget items here to surface it without a reload.
        if ((data as Record<string, unknown>).create_budget_entry) await tripActions.loadBudgetItems?.(tripId)
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
        // Surface the auto-created linked cost without a reload (no budget:created echo to us).
        if (data.create_budget_entry) await tripActions.loadBudgetItems?.(tripId)
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

  // ── Review-before-save booking import ───────────────────────────────────────
  // Match an existing trip place by name, else geocode the reviewed address and
  // create one. Returns the place id (or null if even creation failed).
  const resolveImportedPlace = async (venue: { name?: string; address?: string | null }): Promise<number | null> => {
    const name = (venue.name || '').trim()
    const n = name.toLowerCase()
    if (n) {
      const existing = places.find(p => p.name?.trim().toLowerCase() === n)
        ?? places.find(p => p.name && (p.name.toLowerCase().includes(n) || n.includes(p.name.toLowerCase())))
      if (existing) return existing.id
    }
    let lat: number | null = null
    let lng: number | null = null
    let address: string | null = venue.address ?? null
    try {
      const query = venue.address ? `${name} ${venue.address}`.trim() : name
      if (query) {
        const res = await mapsApi.search(query)
        const hit = res?.places?.[0] as { lat?: number; lng?: number; address?: string } | undefined
        if (hit && hit.lat != null && hit.lng != null) {
          lat = hit.lat; lng = hit.lng
          if (!address && hit.address) address = hit.address
        }
      }
    } catch { /* geocode failure is non-fatal — create the place without coords */ }
    try {
      const place = await placesApi.create(tripId, { name: name || address || 'Accommodation', lat, lng, address } as never)
      return (place as { id?: number })?.id ?? null
    } catch { return null }
  }

  // Open the right edit modal for a parsed item, pre-filled, in create mode.
  const openImportItem = (item: BookingImportPreviewItem) => {
    const draft = parsedItemToDraft(item)
    // Attach the file this item was parsed from so it lands in the booking's Files on save.
    const srcName = item.source?.fileName
    const srcFile = srcName ? importSourceFilesRef.current.find(f => f.name === srcName) : undefined
    if (srcFile) draft._sourceFiles = [srcFile]
    if (isTransportItem(item)) {
      setShowReservationModal(false); setEditingReservation(null); setReservationPrefill(null)
      setEditingTransport(null); setTransportModalDayId(null)
      setTransportPrefill(draft); setShowTransportModal(true)
    } else {
      setShowTransportModal(false); setEditingTransport(null); setTransportPrefill(null); setTransportModalDayId(null)
      setEditingReservation(null)
      setReservationPrefill(draft); setShowReservationModal(true)
    }
  }

  const startImportReview = (items: BookingImportPreviewItem[], sourceFiles: File[] = []) => {
    if (!items.length) return
    importSourceFilesRef.current = sourceFiles
    importQueueRef.current = items.slice(1)
    setImportReviewActive(true)
    openImportItem(items[0])
  }

  // Bridge: when a finished background import is sent here for review (the user hit
  // "review" in the background widget, on this or any page), open the per-item flow.
  // Lives in the hook so the page stays a pure wiring container.
  const bgTasks = useBackgroundTasksStore((s) => s.tasks)
  const dismissBgTask = useBackgroundTasksStore((s) => s.dismiss)
  useEffect(() => {
    const task = bgTasks.find(
      (tk) => tk.tripId === String(tripId) && tk.status === 'done' && tk.reviewRequested && !tk.consumed,
    )
    if (task && task.items && task.items.length > 0) {
      // Hand the items (and the source files, to attach to each booking) to the review flow
      // and clear the widget entry — once the user hit "review", the background card is done.
      const items = task.items
      const jobId = task.id
      const inMemory = task.sourceFiles
      dismissBgTask(jobId)
      // Prefer the in-memory files (immediate path); after a reload they live in IndexedDB.
      void (async () => {
        const files = inMemory && inMemory.length ? inMemory : await getImportFiles(jobId)
        deleteImportFiles(jobId)
        startImportReview(items, files)
      })()
    }
  }, [bgTasks, tripId, startImportReview, dismissBgTask])

  // Called when a reviewed item's modal closes (saved or skipped): open the next,
  // or finish the review session and refresh accommodations.
  const advanceImportReview = () => {
    const queue = importQueueRef.current
    if (queue.length > 0) {
      importQueueRef.current = queue.slice(1)
      openImportItem(queue[0])
      return
    }
    importQueueRef.current = []
    setImportReviewActive(false)
    setShowReservationModal(false); setEditingReservation(null); setReservationPrefill(null)
    setShowTransportModal(false); setEditingTransport(null); setTransportPrefill(null); setTransportModalDayId(null)
    accommodationsApi.list(tripId).then(d => setTripAccommodations(d.accommodations || [])).catch(() => {})
    // Imported bookings auto-create their linked costs server-side, but the saving client
    // suppresses its own budget:created echo (X-Socket-Id) — so reload the budget items here
    // to surface those expenses without a manual page refresh.
    tripActions.loadBudgetItems?.(tripId)
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
    allowedFileTypes, tripMembers, setTripMembers, refreshMembers, loadAccommodations,
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
    transportModalAutomated, setTransportModalAutomated, transitPrefill, setTransitPrefill, transitJourney, setTransitJourney,
    reservationPrefill, transportPrefill, importReviewActive, startImportReview, advanceImportReview,
    routeShown, setRouteShown, routeProfile, setRouteProfile, fitKey, setFitKey,
    mobileSidebarOpen, setMobileSidebarOpen, mobilePlanScrollTopRef, mobilePlacesScrollTopRef,
    deletePlaceId, setDeletePlaceId, deletePlaceIds, setDeletePlaceIds,
    visibleConnections, setVisibleConnections, toggleConnection, mapTransportDetail, setMapTransportDetail,
    isMobile, mapCategoryFilter, setMapCategoryFilter, mapPlacesFilter, setMapPlacesFilter,
    expandedDayIds, setExpandedDayIds, mapPlaces,
    route, routeSegments, routeInfo, setRoute, setRouteInfo, updateRouteForDay,
    handleSelectDay, handlePlaceClick, handleMarkerClick, handleMapClick, handleMapContextMenu, openAddPlaceFromPoi,
    handleSavePlace, openPlaceEditor, handleDeletePlace, confirmDeletePlace, confirmDeletePlaces, confirmChangeCategory,
    handleAssignToDay, handleRemoveAssignment, handleReorder, handleReorderDays, handleAddDay, handleUpdateDayTitle,
    handleSaveReservation, handleSaveTransport, handleDeleteReservation,
    selectedPlace, dayOrderMap, dayPlaces,
    mapTileUrl, defaultCenter, defaultZoom, fontStyle, splashDone,
  }
}
