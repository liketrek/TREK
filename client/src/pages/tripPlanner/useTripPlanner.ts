import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router'
import { useTripStore } from '../../store/tripStore'
import { useCanDo } from '../../store/permissionsStore'
import { useSettingsStore } from '../../store/settingsStore'
import { getCached, fetchPhoto } from '../../services/photoService'
import { useToast } from '../../components/shared/Toast'
import { Map, Ticket, PackageCheck, Wallet, FolderOpen, Users, Train } from 'lucide-react'
import { resolvePluginIcon } from '../../components/shared/PluginIcon'
import { useTranslation, translateApiError } from '../../i18n'
import { addonsApi, accommodationsApi, authApi, tripsApi, assignmentsApi, healthApi, airtrailApi, mapsApi, placesApi } from '../../api/client'
import { getDayOrder } from '../../utils/dayOrder'
import { isOvernightCategory } from '../../components/Roadtrip/stopKinds'
import { parsedItemToDraft, isTransportItem, isUnplaceableItem, type BookingReviewDraft } from '../../components/Planner/parsedItemToDraft'
import type { BookingImportPreviewItem } from '@trek/shared'
import { accommodationRepo } from '../../repo/accommodationRepo'
import { offlineDb, getImportFiles, deleteImportFiles } from '../../db/offlineDb'
import { isEffectivelyOffline } from '../../sync/networkMode'
import { useBackgroundTasksStore } from '../../store/backgroundTasksStore'
import { useAuthStore } from '../../store/authStore'
import { useResizablePanels } from '../../hooks/useResizablePanels'
import { useTripWebSocket } from '../../hooks/useTripWebSocket'
import { useRouteCalculation } from '../../hooks/useRouteCalculation'
import { useRoadtripRoutes } from '../../components/Roadtrip/useRoadtripRoutes'
import { useRoadtripCorridor } from '../../components/Roadtrip/useRoadtripCorridor'
import { useRoadtripVias } from '../../components/Roadtrip/useRoadtripVias'
import { useFollowTrack } from '../../components/Roadtrip/useFollowTrack'
import { useRouteAlternatives } from '../../components/Roadtrip/useRouteAlternatives'
import { buildAlternativeOverlays } from '../../components/Roadtrip/alternativeOverlays'
import type { CorridorPoi } from '../../components/Roadtrip/useCorridorPois'
import { projectOntoRoute, type LatLng } from '../../components/Roadtrip/corridor'
import {
  insertIndexForAlong,
  reanchorAfterInsert,
  reanchorAfterRemove,
  reanchorAfterReorder,
} from '../../components/Roadtrip/roadtripModel'
import type { RoadtripStopDraft } from '../../components/Roadtrip/RoadtripStopPopup'
import type { RoadtripStopType } from '@trek/shared'
import { usePlaceSelection } from '../../hooks/usePlaceSelection'
import { usePlannerHistory } from '../../hooks/usePlannerHistory'
import { useAirtrailConnection } from '../../hooks/useAirtrailConnection'
import { useIsTouch } from '../../hooks/useIsTouch'
import { usePluginStore } from '../../store/pluginStore'
import type { Accommodation, TripMember, Day, Place, Reservation, Settings } from '../../types'
import { OFM_POSITRON, DEFAULT_MAP_LAT, DEFAULT_MAP_LNG, DEFAULT_MAP_ZOOM } from '../../constants/mapDefaults'
import { useTileUrl } from '../../hooks/useTileUrl'
import { resolvePoolAssignmentId } from './tripPlannerModel'
import { isDeepLinkableTripTab, TRIP_TAB_LABEL_KEYS } from '../../constants/tripTabs'
import { isRoutableReservation } from '../../utils/reservationRoutes'
import {
  parseStoredConnections, resolveEffectiveConnections, resolveVisibleConnectionIds,
  toggleConnectionId, toggleAllConnections as flipAllConnectionsMode,
  type StoredConnections,
} from '../../utils/connectionsVisibility'
import { plannedPlaceIds, plannedPlaceIdsForDay } from '../../utils/plannedPlaces'

/** Stable empty list so the road trip hook stays inert while its mode is off. */
const EMPTY_DAYS: Day[] = []

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
  const tripId = id ? Number(id) : Number.NaN
  const navigate = useNavigate()
  const toast = useToast()
  const { t, language } = useTranslation()
  const { settings, updateSettings } = useSettingsStore()
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

  const [enabledAddons, setEnabledAddons] = useState<Record<string, boolean>>({ packing: true, budget: true, documents: true, collab: false, roadtrip: false })
  // The values above are an optimistic guess until the addon feed answers. The
  // tab guard below waits for this before evicting anything, so a tab we were
  // asked to open ('collab' in particular, guessed off) survives the gap.
  const [addonsLoaded, setAddonsLoaded] = useState<boolean>(false)
  // Road trip mode swaps the plan view's left rail (and later its map layer) for the
  // drive-first reading of the same trip. Per trip and per session, like the tab choice:
  // someone planning a road trip stays in it across reloads without it leaking into
  // their next, non-driving trip.
  const [roadtripMode, setRoadtripMode] = useState<boolean>(() => sessionStorage.getItem(`trip-roadtrip-${tripId}`) === '1')
  const toggleRoadtripMode = useCallback(() => {
    setRoadtripMode(prev => {
      const next = !prev
      sessionStorage.setItem(`trip-roadtrip-${tripId}`, next ? '1' : '0')
      return next
    })
  }, [tripId])
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
      setEnabledAddons({ packing: !!map.packing, budget: !!map.budget, documents: !!map.documents, collab: !!map.collab, roadtrip: !!map.roadtrip })
      if (data.collabFeatures) setCollabFeatures(data.collabFeatures)
    }).catch(() => {}).finally(() => setAddonsLoaded(true))
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
    { id: 'plan', label: t(TRIP_TAB_LABEL_KEYS.plan), icon: Map },
    { id: 'transports', label: t(TRIP_TAB_LABEL_KEYS.transports), icon: Train },
    { id: 'buchungen', label: t(TRIP_TAB_LABEL_KEYS.buchungen), shortLabel: t('trip.tabs.reservationsShort'), icon: Ticket },
    ...(enabledAddons.packing ? [{ id: 'listen', label: t(TRIP_TAB_LABEL_KEYS.listen), shortLabel: t('trip.tabs.listsShort'), icon: PackageCheck }] : []),
    ...(enabledAddons.budget ? [{ id: 'finanzplan', label: t(TRIP_TAB_LABEL_KEYS.finanzplan), icon: Wallet }] : []),
    ...(enabledAddons.documents ? [{ id: 'dateien', label: t(TRIP_TAB_LABEL_KEYS.dateien), icon: FolderOpen }] : []),
    ...(enabledAddons.collab ? [{ id: 'collab', label: t(TRIP_TAB_LABEL_KEYS.collab), icon: Users }] : []),
  ].filter(tab => tab.id === 'plan' || !replacedTabs.has(tab.id))
  // Positioned plugin tabs splice in ascending order so two positions stay stable;
  // the rest append, exactly as before this capability existed.
  const positioned = tripPagePlugins.filter(p => p.tripPage?.position != null).sort((a, b) => (a.tripPage!.position! - b.tripPage!.position!))
  for (const p of positioned) TRIP_TABS.splice(Math.min(p.tripPage!.position!, TRIP_TABS.length), 0, { id: `plugin:${p.id}`, label: p.name, icon: resolvePluginIcon(p.icon) })
  for (const p of tripPagePlugins.filter(p => p.tripPage?.position == null)) TRIP_TABS.push({ id: `plugin:${p.id}`, label: p.name, icon: resolvePluginIcon(p.icon) })

  const [searchParams, setSearchParams] = useSearchParams()

  // ?tab=<id> opens the trip straight on that tab (the startup destination
  // setting, a browser shortcut, a wrapper app). It beats the session's last
  // tab because it is an explicit request for this one, and it is read in the
  // initializer rather than an effect so the planner never paints the plan view
  // first and swaps a frame later.
  const [activeTab, setActiveTab] = useState<string>(() => {
    const requested = searchParams.get('tab')
    if (requested && isDeepLinkableTripTab(requested)) return requested
    return sessionStorage.getItem(`trip-tab-${tripId}`) || 'plan'
  })

  useEffect(() => {
    // Don't evict a saved plugin tab before the plugin feed has loaded.
    if (activeTab.startsWith('plugin:') && !pluginsLoaded) return
    // Same for the addon-owned tabs: until the feed answers, enabledAddons is a
    // guess, and evicting on a guess would drop a legitimately requested tab.
    if (!addonsLoaded) return
    const validTabIds = TRIP_TABS.map(t => t.id)
    if (!validTabIds.includes(activeTab)) {
      setActiveTab('plan')
      sessionStorage.setItem(`trip-tab-${tripId}`, 'plan')
    }
  }, [activeTab, enabledAddons, addonsLoaded, tripPluginIds, pluginsLoaded])

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

  // handleTabChange is where a tab's lazy load and its session memory happen, and
  // the tab we *start* on never goes through it — neither a ?tab= deep link nor a
  // tab restored from a previous visit. Catch both up once per trip, or opening
  // straight into Files shows an empty list.
  const startTabSettled = useRef<number | null>(null)
  useEffect(() => {
    if (!tripId || startTabSettled.current === tripId) return
    startTabSettled.current = tripId
    sessionStorage.setItem(`trip-tab-${tripId}`, activeTab)
    if (activeTab === 'finanzplan') tripActions.loadBudgetItems?.(tripId)
    if (activeTab === 'dateien' && (!files || files.length === 0)) tripActions.loadFiles?.(tripId)
  }, [tripId])
  const { leftWidth, rightWidth, leftCollapsed, rightCollapsed, setLeftCollapsed, setRightCollapsed, startResizeLeft, startResizeRight } = useResizablePanels()
  const { selectedPlaceId, selectedAssignmentId, setSelectedPlaceId, selectAssignment } = usePlaceSelection()
  const [showDayDetail, setShowDayDetail] = useState<Day | null>(null)
  const [dayDetailCollapsed, setDayDetailCollapsed] = useState(false)
  const [showPlaceForm, setShowPlaceForm] = useState<boolean>(false)
  const [editingPlace, setEditingPlace] = useState<Place | null>(null)
  const [prefillCoords, setPrefillCoords] = useState<{ lat: number; lng: number; name?: string; address?: string; website?: string; phone?: string; osm_id?: string; stop_type?: RoadtripStopType | null; duration_minutes?: number } | null>(null)
  const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(null)
  // Day context of the open form. Set only by the day-scoped entry points (the
  // mobile day toolbar, a long-press on the mobile map); every other opener
  // clears it, so a place added from the pool still lands in the pool (#1998).
  const [placeFormDayId, setPlaceFormDayId] = useState<number | null>(null)
  /**
   * Where in the day the place being added belongs, when the caller knows.
   * Null means the old behaviour: the server appends it at the end.
   */
  const [placeFormPosition, setPlaceFormPosition] = useState<number | null>(null)
  /**
   * The corridor hit waiting to become a stop, while the small popup is open.
   *
   * The full place form is the wrong question for a petrol station — category, price,
   * photo, notes and files are all empty for one — so in road trip mode a hit opens this
   * instead, and the form stays one click away behind "more details".
   */
  const [stopDraft, setStopDraft] = useState<RoadtripStopDraft | null>(null)
  const [reservationModalDayId, setReservationModalDayId] = useState<number | null>(null)

  // The bottom-nav "+" opens the new-place form via ?create=place.
  useEffect(() => {
    if (searchParams.get('create') === 'place') {
      setEditingPlace(null); setEditingAssignmentId(null); setPlaceFormDayId(null); setShowPlaceForm(true)
      setSearchParams(p => { p.delete('create'); return p }, { replace: true })
    }
  }, [searchParams])

  // ?tab= has done its job in the state initializer above — drop it so the URL
  // stops claiming a tab the user may have since switched away from. The session
  // memory keeps the choice across a reload.
  useEffect(() => {
    if (searchParams.get('tab') === null) return
    setSearchParams(p => { p.delete('tab'); return p }, { replace: true })
  }, [searchParams])
  const [showTripForm, setShowTripForm] = useState<boolean>(false)
  const [showMembersModal, setShowMembersModal] = useState<boolean>(false)
  const [showReservationModal, setShowReservationModal] = useState<boolean>(false)
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  const [showBookingImport, setShowBookingImport] = useState<boolean>(false)
  // Which tab opened the importer. Only ever a tie-breaker — see openImportItem.
  const [bookingImportKind, setBookingImportKind] = useState<'transports' | 'bookings'>('bookings')
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
  const [transitPrefill, setTransitPrefill] = useState<{ from?: { name: string; lat: number; lng: number } | null; to?: { name: string; lat: number; lng: number } | null; time?: string | null } | null>(null)
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
  // The tab the items under review came from. A ref, not the bookingImportKind
  // state: the parse outlives navigation and reload, and the review is triggered
  // by the global widget, so by then the state has remounted back to its default.
  // The value comes off the persisted job (#2076).
  const importKindRef = useRef<'transports' | 'bookings'>('bookings')
  // Manual route planning: off by default, toggled from the day-plan footer. Mode
  // is per-session and selects which travel time the connectors show — either a
  // built-in OSRM profile or a plugin route profile ('plugin:<id>/<profile>').
  // Per-trip route visibility. `null` = the user has never said anything, which
  // is what lets the mobile map switch it on by default; an explicit false has to
  // survive every later map entry, and it used to be clobbered on each one (#2003).
  const routeStorageKey = tripId ? `trek:day-route:${tripId}` : null
  const [routeChoice, setRouteChoice] = useState<boolean | null>(() => {
    if (typeof window === 'undefined' || !routeStorageKey) return null
    const raw = window.localStorage.getItem(routeStorageKey)
    return raw === 'true' ? true : raw === 'false' ? false : null
  })
  const routeShown = routeChoice === true
  const setRouteShown = useCallback((v: boolean | ((prev: boolean) => boolean)) => {
    setRouteChoice(prev => {
      const next = typeof v === 'function' ? v(prev === true) : v
      if (routeStorageKey && typeof window !== 'undefined') {
        window.localStorage.setItem(routeStorageKey, String(next))
      }
      return next
    })
  }, [routeStorageKey])
  // The mobile map opens with the day's route drawn — a default, not a choice, so
  // it never overwrites an explicit off and is never written to storage itself.
  const autoShowRoute = useCallback(() => {
    setRouteChoice(prev => (prev === null ? true : prev))
  }, [])
  // What the planner maps actually draw. The persisted toggle can rehydrate as
  // true while no day is selected yet (trip re-entry resets the selection, and
  // a second click on the day header clears it) — without a day context the
  // per-day transit filter is off, so the map would draw every automated
  // transport in the trip (#2019).
  const transitRoutesShown = routeShown && selectedDayId != null
  const [routeProfile, setRouteProfile] = useState<string>('driving')
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
    // The server runs the import when EITHER kitinerary or the LLM parser is
    // there (booking-import.service.ts), so gating the entry point on kitinerary
    // alone hid a working feature on LLM-only instances (#2007).
    healthApi.features().then(f => setBookingImportAvailable(f.bookingImport || f.aiParsing)).catch(() => {})
  }, [])

  const connectionsStorageKey = tripId ? `trek:visible-connections:${tripId}` : null
  // Per-trip route-visibility preference — null means "never touched", which
  // falls back to the account-wide map_always_show_routes default (see
  // connectionsVisibility.ts). That fallback is purely computed, never
  // written, so flipping the account setting later doesn't silently override
  // a trip you've already made an explicit choice on.
  const [storedConnections, setStoredConnections] = useState<StoredConnections | null>(() => {
    if (typeof window === 'undefined' || !connectionsStorageKey) return null
    return parseStoredConnections(window.localStorage.getItem(connectionsStorageKey))
  })
  useEffect(() => {
    if (typeof window === 'undefined' || !connectionsStorageKey || !storedConnections) return
    window.localStorage.setItem(connectionsStorageKey, JSON.stringify(storedConnections))
  }, [connectionsStorageKey, storedConnections])
  const alwaysShowRoutesDefault = settings.map_always_show_routes === true
  const routableReservationIds = useMemo(
    () => reservations.filter(isRoutableReservation).map(r => r.id),
    [reservations]
  )
  const effectiveConnections = useMemo(
    () => resolveEffectiveConnections(storedConnections, alwaysShowRoutesDefault),
    [storedConnections, alwaysShowRoutesDefault]
  )
  const visibleConnections = useMemo(
    () => resolveVisibleConnectionIds(effectiveConnections, routableReservationIds),
    [effectiveConnections, routableReservationIds]
  )
  const allConnectionsShown = effectiveConnections.mode === 'all-except'
  const toggleConnection = useCallback((id: number) => {
    setStoredConnections(prev => toggleConnectionId(prev, alwaysShowRoutesDefault, id))
  }, [alwaysShowRoutesDefault])
  const toggleAllConnections = useCallback(() => {
    setStoredConnections(prev => flipAllConnectionsMode(prev, alwaysShowRoutesDefault))
  }, [alwaysShowRoutesDefault])
  const [mapTransportDetail, setMapTransportDetail] = useState<Reservation | null>(null)

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  // Layout is width-driven (isMobile); the drag bridge is pointer-driven (isTouch).
  // Conflating them is what left a tablet's places list undraggable-but-unscrollable (#1432).
  const isTouch = useIsTouch()

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

  // Accommodations live in this hook's local state, so store-level refreshes
  // (remote trip date change, reconnect hydration) nudge us via this event (#1288).
  useEffect(() => {
    const onRefresh = () => loadAccommodations()
    window.addEventListener('accommodations:refresh', onRefresh)
    return () => window.removeEventListener('accommodations:refresh', onRefresh)
  }, [loadAccommodations])

  useTripWebSocket(tripId)

  // Same filter the places sidebar renders — shared via the store so tab
  // switches can't desync the marker set from the filter UI (#1541).
  const placesFilter = useTripStore((s) => s.placesFilter)
  const placesCategoryFilter = useTripStore((s) => s.placesCategoryFilter)

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
            if (a.place?.id) hiddenPlaceIds.delete(a.place.id)
          }
        }
      }
    }

    // Planned place IDs — needed by both the 'unplanned' filter (exclude them) and
    // the new 'planned' filter (keep only them). With a day selected, 'planned'
    // follows it like the other filters do; with no day selected it keeps showing
    // the whole plan (#2024). 'unplanned' always uses the whole-trip set — a place
    // assigned to any day is not unplanned.
    const plannedIds = placesFilter === 'unplanned' || placesFilter === 'planned'
      ? (placesFilter === 'planned' && selectedDayId
        ? plannedPlaceIdsForDay(selectedDayId, days, { assignments, accommodations: tripAccommodations, reservations })
        : plannedPlaceIds({ assignments, accommodations: tripAccommodations, reservations }))
      : null

    return places.filter(p => {
      if (!p.lat || !p.lng) return false
      if (placesFilter === 'tracks' && !p.route_geometry) return false
      if (placesCategoryFilter.size > 0) {
        if (p.category_id == null) {
          if (!placesCategoryFilter.has('uncategorized')) return false
        } else if (!placesCategoryFilter.has(String(p.category_id))) return false
      }
      // Collapsed-day declutter hides a day's stops on every filter EXCEPT 'planned':
      // there the user asked to see the whole plan on the map, so a collapsed day
      // must not drop its planned places.
      if (placesFilter !== 'planned' && hiddenPlaceIds.has(p.id)) return false
      if (placesFilter === 'unplanned' && plannedIds && plannedIds.has(p.id)) return false
      if (placesFilter === 'planned' && plannedIds && !plannedIds.has(p.id)) return false
      return true
    })
  }, [places, placesCategoryFilter, placesFilter, assignments, expandedDayIds, selectedDayId, days, tripAccommodations, reservations])

  const { route, routeSegments, routeVias, routeInfo, setRoute, setRouteInfo, updateRouteForDay } = useRouteCalculation({ assignments } as any, selectedDayId, routeShown, routeProfile, tripAccommodations)

  // Road trip mode reads the whole trip, not the selected day, so it owns its own legs.
  // Passing no days while the mode is off keeps it inert — no routing requests, no state.
  const roadtripActive = !!enabledAddons.roadtrip && roadtripMode
  const roadtripVias = useRoadtripVias(tripId, roadtripActive)
  const roadtripRoutes = useRoadtripRoutes(
    tripId,
    roadtripActive ? days : EMPTY_DAYS,
    assignments,
    routeProfile,
    roadtripVias.byDay,
  )
  // Lives here rather than in the panel because the map draws what it finds.
  const roadtripCorridor = useRoadtripCorridor(roadtripRoutes)
  // Applying a track is a long job — a routing round trip per refinement — so it lives
  // above the dialog: a component that unmounted halfway would leave the day holding
  // half a chain of vias.
  const followTrack = useFollowTrack(tripId, places, roadtripRoutes, roadtripVias)
  /** How many vias each day carries, for the rail's badge. */
  const roadtripViaCounts = useMemo(() => {
    const counts: Record<number, number> = {}
    for (const [dayId, list] of Object.entries(roadtripVias.byDay)) counts[Number(dayId)] = list.length
    return counts
  }, [roadtripVias.byDay])

  const handleSelectDay = useCallback((dayId: number | null, skipFit?: boolean) => {
    tripActions.setSelectedDay(dayId)
    if (!skipFit) setFitKey(k => k + 1)
    setMobileSidebarOpen(null)
    updateRouteForDay(dayId)
  }, [updateRouteForDay])

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

  const handleMapContextMenu = useCallback(async (e, dayId?: number | null) => {
    if (!can('place_edit', trip)) return
    e.originalEvent?.preventDefault()
    const { lat, lng } = e.latlng
    setPrefillCoords({ lat, lng })
    setEditingPlace(null)
    setEditingAssignmentId(null)
    setPlaceFormDayId(dayId ?? null)
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
  const openAddPlaceFromPoi = useCallback((
    poi: { lat: number; lng: number; name: string; address: string | null; website: string | null; phone: string | null; osm_id: string },
    dayId?: number | null,
    /** Index within that day. Omitted, the place is appended, which is what every caller did before. */
    position?: number | null,
    /**
     * What the corridor popup had worked out before the traveller asked for the full
     * form. Without it, leaving the popup by "more details" quietly turned a fuel stop
     * into a numbered destination that counts in every total.
     */
    stop?: { stopType: RoadtripStopType | null; dwellMinutes: number } | null,
  ) => {
    if (!can('place_edit', trip)) return
    setPrefillCoords({
      lat: poi.lat,
      lng: poi.lng,
      name: poi.name,
      address: poi.address || '',
      website: poi.website || undefined,
      phone: poi.phone || undefined,
      osm_id: poi.osm_id,
      stop_type: stop?.stopType ?? null,
      duration_minutes: stop?.dwellMinutes,
    })
    setEditingPlace(null)
    setEditingAssignmentId(null)
    setPlaceFormDayId(dayId ?? null)
    setPlaceFormPosition(position ?? null)
    setShowPlaceForm(true)
  }, [trip])

  /**
   * Adding a POI straight off the map, with the day it belongs to.
   *
   * In road trip mode that is the day being searched: without it the place lands in the
   * unplanned pool, and neither column shows that pool while road trip mode is on, so a
   * just-added stop disappears without a trace. Outside road trip mode nothing changes —
   * `undefined` keeps the old "let the user pick" behaviour.
   *
   * Memoised because both map renderers rebuild every POI marker whenever this callback's
   * identity changes.
   */
  const roadtripDayId = roadtripCorridor.day?.dayId ?? null
  const { insertIndexFor: roadtripInsertIndexFor } = roadtripCorridor
  const roadtripDayNumber = roadtripCorridor.day?.dayNumber ?? 0
  /**
   * The check-out days a night started on `dayId` can end on.
   *
   * Ordered by the trip's own day order rather than by array position, the same rule the
   * day detail panel follows: a day list can be sorted by anything, and a hotel booked
   * out on "the next day" has to mean the next day of the trip.
   */
  const overnightOptions = useCallback((dayId: number) => {
    const ordered = [...days].sort((a, b) => getDayOrder(a, days) - getDayOrder(b, days))
    const from = ordered.findIndex(d => d.id === dayId)
    const rest = from < 0 ? ordered : ordered.slice(from)
    return {
      days: rest.map(d => ({ id: d.id, number: d.day_number ?? 0, date: d.date ?? null })),
      // The day after, or this one when it is the last: a night on the final day of a
      // trip has nowhere else to end.
      defaultEndDayId: rest[1]?.id ?? rest[0]?.id ?? dayId,
    }
  }, [days])

  const handlePoiClick = useCallback((poi: Parameters<typeof openAddPlaceFromPoi>[0]) => {
    if (!can('place_edit', trip)) return
    // A corridor hit knows how far along the drive it sits, so it can go straight into
    // the chain in driving order instead of being dragged there afterwards.
    const hit = roadtripActive && 'alongKm' in poi ? (poi as unknown as CorridorPoi) : null
    if (hit && roadtripDayId != null) {
      setStopDraft({
        poi: hit,
        dayId: roadtripDayId,
        position: roadtripInsertIndexFor(hit),
        dayNumber: roadtripDayNumber,
        // Only for a hit somebody could sleep at, and it is what gives the popup its
        // second mode. The check-out options are the days from this one on in travel
        // order; the default is the next one, which is what a night usually means.
        ...(isOvernightCategory(hit.category) ? { overnight: overnightOptions(roadtripDayId) } : {}),
      })
      return
    }
    openAddPlaceFromPoi(poi, roadtripActive ? roadtripDayId : undefined)
  }, [openAddPlaceFromPoi, roadtripActive, roadtripDayId, roadtripDayNumber, roadtripInsertIndexFor, overnightOptions, can, trip])

  /**
   * The stops of a day as the road trip counts them, in the order it drives them.
   *
   * This is the index space `after_order_index` lives in: sorted by `order_index`, and
   * filtered to the rows that have coordinates, because a place the map cannot put
   * anywhere is not a point the router is given. Built from `assignments` rather than
   * from `roadtripRoutes` so it also answers for a day with one stop or none — exactly
   * the day a stop gets pushed onto when a leg turns out too long.
   */
  const roadtripStopsOf = useCallback((dayId: number) =>
    (assignments[String(dayId)] ?? [])
      .slice()
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      .filter(a => typeof a.place?.lat === 'number' && typeof a.place?.lng === 'number'),
  [assignments])

  /**
   * Which half of a split leg a via belongs to, measured on the road actually driven.
   *
   * Both the via and the new stop are projected onto the day's current routed line, so
   * the comparison is "which one does the car reach first" rather than a straight-line
   * guess. The line already includes the detour the via causes, so the via sits exactly
   * on it and its position along the drive is exact.
   *
   * Falls back to keeping the via on the first half. A projection only fails when the
   * point is nowhere near the drive, and in that case leaving the anchor where it was is
   * the answer that changes least.
   */
  const viaLiesBefore = useCallback((dayId: number, at: { lat: number; lng: number }) => {
    const line: LatLng[] = (roadtripRoutes.days.find(d => d.dayId === dayId)?.geometry ?? [])
      .map(([lat, lng]) => ({ lat, lng }))
    const insertAt = line.length ? projectOntoRoute(at, line)?.alongKm ?? null : null
    return (via: { lat: number; lng: number }) => {
      if (insertAt === null) return true
      const viaAt = projectOntoRoute({ lat: via.lat, lng: via.lng }, line)?.alongKm
      return viaAt === undefined || viaAt === null ? true : viaAt < insertAt
    }
  }, [roadtripRoutes.days])

  /**
   * Saves a corridor hit as a stop: the place itself, then its position in the day.
   *
   * `stop_type` is what makes it a fuel stop rather than a place that happens to sell
   * fuel — the road-trip kinds are their own dimension, deliberately not one of the
   * traveller's editable categories, so the palette and the meaning stay put.
   */
  /**
   * Stores one of the three driving limits.
   *
   * Straight to the settings store rather than through the offline queue: these are
   * per-user preferences on the settings table, the same path the map provider and the
   * distance unit take, and they are read locally the moment they change.
   */
  const saveRoadtripLimit = useCallback(async (key: string, value: number) => {
    try {
      await updateSettings({ [key]: value } as Partial<Settings>)
    } catch {
      toast.error(t('settings.saveFailed'))
    }
  }, [updateSettings, toast, t])

  const saveStopDraft = useCallback(async ({ stopType, dwellMinutes }: { stopType: RoadtripStopType | null; dwellMinutes: number }) => {
    if (!stopDraft) return
    const { poi, dayId, position } = stopDraft
    try {
      const place = await tripActions.addPlace(tripId, {
        name: poi.name,
        lat: poi.lat,
        lng: poi.lng,
        address: poi.address || null,
        website: poi.website || undefined,
        phone: poi.phone || undefined,
        osm_id: poi.osm_id,
        duration_minutes: dwellMinutes,
        stop_type: stopType,
      })
      if (place?.id) {
        // Worked out BEFORE the stop lands, against the day as it stands and the road as
        // it is currently driven — once the list has shifted there is no record of which
        // leg each via was drawn for.
        const plan = reanchorAfterInsert(
          roadtripVias.byDay[dayId] ?? [],
          position,
          viaLiesBefore(dayId, { lat: poi.lat, lng: poi.lng }),
        )
        await tripActions.assignPlaceToDay(tripId, dayId, place.id, position)
        // Awaited before the day re-routes: the routing effect reads the anchors against
        // the new stop list, so a correction landing after it would draw the wrong road
        // first and the right one a moment later.
        await roadtripVias.reanchor(dayId, plan)
        updateRouteForDay(dayId)
      }
      setStopDraft(null)
      toast.success(t('trip.toast.placeAdded'))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
    }
  }, [stopDraft, tripId, tripActions, updateRouteForDay, toast, t, roadtripVias, viaLiesBefore])

  /**
   * Saves a corridor hit as somewhere to sleep rather than as a pause on the drive.
   *
   * Three writes and deliberately not one transaction: the place, its day, and the row in
   * day_accommodations. A hotel keeps its number in the chain — it is where the day ends,
   * not something the drive passes through — so it gets no `stop_type` and no dwell.
   *
   * The check-out day is the traveller's answer, defaulting to the day after. Both times
   * are optional and go through as empty when nobody filled them in: a hotel found on a
   * map has no idea when its reception opens, and the server stores null.
   */
  const saveStopDraftAsNight = useCallback(async ({ endDayId, checkIn, checkOut }: {
    endDayId: number
    checkIn: string
    checkOut: string
  }) => {
    if (!stopDraft) return
    const { poi, dayId, position } = stopDraft
    try {
      const place = await tripActions.addPlace(tripId, {
        name: poi.name,
        lat: poi.lat,
        lng: poi.lng,
        address: poi.address || null,
        website: poi.website || undefined,
        phone: poi.phone || undefined,
        osm_id: poi.osm_id,
      })
      if (place?.id) {
        const plan = reanchorAfterInsert(
          roadtripVias.byDay[dayId] ?? [],
          position,
          viaLiesBefore(dayId, { lat: poi.lat, lng: poi.lng }),
        )
        await tripActions.assignPlaceToDay(tripId, dayId, place.id, position)
        await accommodationsApi.create(tripId, {
          place_id: place.id,
          start_day_id: dayId,
          end_day_id: endDayId,
          ...(checkIn ? { check_in: checkIn } : {}),
          ...(checkOut ? { check_out: checkOut } : {}),
        })
        await loadAccommodations()
        await roadtripVias.reanchor(dayId, plan)
        updateRouteForDay(dayId)
      }
      setStopDraft(null)
      toast.success(t('roadtrip.stay.nightAdded'))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
    }
  }, [stopDraft, tripId, tripActions, updateRouteForDay, toast, t, roadtripVias, viaLiesBefore, loadAccommodations])

  /**
   * Turns a stop on the drive into a pause, or back into a destination.
   *
   * The only difference between the two is `stop_type`, which decides whether the stop
   * takes a number, counts in the day's total and appears in the printout. So this is one
   * field on one place, and the rail redraws itself off the store the moment it lands.
   */
  const setRoadtripStopKind = useCallback(async (placeId: number, kind: RoadtripStopType | null) => {
    try {
      await tripActions.updatePlace(tripId, placeId, { stop_type: kind })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
    }
  }, [tripId, tripActions, toast, t])

  /**
   * Moves a stop within its day, from the road trip rail.
   *
   * The rail reports only "this assignment, from here to there" and the full order is
   * rebuilt here, from the day's COMPLETE assignment list rather than from what the rail
   * shows. That matters: the rail hides stops without coordinates, and both
   * `reorderAssignments` and the WebSocket handler rebuild the day's array purely from the
   * ids they are given — anything left out would vanish from the store, for every session
   * watching the trip.
   *
   * Within one day only. Moving between days stays in the day plan, where empty and
   * one-stop days are visible and can be dropped onto; the rail leaves them out, so a day
   * would disappear from under the cursor mid-gesture.
   *
   * No confirmation prompt for a stop with a pinned time, unlike the day plan: the rail
   * recomputes the cascade immediately and marks a stop it can no longer reach in time.
   * Showing the consequence is better than asking about it in advance.
   */
  const reorderRoadtripStop = useCallback(async (dayId: number, assignmentId: number, toIndex: number) => {
    if (!can('day_edit', trip)) return
    const all = assignments[String(dayId)] ?? []
    const ordered = [...all].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    const fromIdx = ordered.findIndex(a => a.id === assignmentId)
    if (fromIdx === -1) return

    // `toIndex` counts stops as the rail lists them; map it onto the full list, which may
    // hold rows the rail never showed.
    const visible = ordered.filter(a => typeof a.place?.lat === 'number' && typeof a.place?.lng === 'number')
    const target = visible[Math.min(Math.max(toIndex, 0), visible.length - 1)]
    if (!target || target.id === assignmentId) return
    const toIdx = ordered.findIndex(a => a.id === target.id)
    if (toIdx === -1 || toIdx === fromIdx) return

    const next = [...ordered]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)

    // In the rail's own index space, which is the one the anchors are counted in. A stop
    // without coordinates never entered that space, so moving it changes nothing there.
    const fromVis = visible.findIndex(a => a.id === assignmentId)
    const plan = fromVis === -1
      ? null
      : reanchorAfterReorder(roadtripVias.byDay[dayId] ?? [], fromVis, toIndex, visible.length)

    try {
      await tripActions.reorderAssignments(tripId, dayId, next.map(a => a.id))
      if (plan) await roadtripVias.reanchor(dayId, plan)
      updateRouteForDay(dayId)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
    }
  }, [assignments, tripId, tripActions, updateRouteForDay, toast, t, can, trip, roadtripVias])

  /**
   * The stop whose length is being set, or null while the dialog is closed.
   *
   * Held here rather than in the rail because the write goes through `tripActions`, and
   * the rail is a list — putting a dialog's state inside a row means it dies whenever the
   * list re-renders around it.
   */
  const [stayDraft, setStayDraft] = useState<{ placeId: number; name: string; minutes: number | null; arrival: string | null } | null>(null)

  /**
   * How long the traveller stays at one stop.
   *
   * Writes `places.duration_minutes`, which the schedule has read since it was written
   * and which nothing in TREK has ever been able to set — the road trip is the only place
   * the value means anything, so it is the only place that edits it.
   *
   * Zero rather than null to clear: the update statement folds a null into "leave it
   * alone" (`COALESCE(?, duration_minutes)`), so a null could give a stop a stay but
   * never take one away. The rail reads zero and absent as the same thing.
   */
  const setRoadtripStay = useCallback(async (placeId: number, minutes: number) => {
    if (!can('place_edit', trip)) return
    try {
      await tripActions.updatePlace(tripId, placeId, { duration_minutes: minutes })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
    }
  }, [tripId, tripActions, toast, t, can, trip])

  /**
   * Moves a stop onto another day, from the road trip rail.
   *
   * Split from `reorderRoadtripStop` because it is a different call with a different
   * failure mode: `moveAssignment` writes to two days, and the rail has to be able to
   * reach days it draws no drive for — a day with one stop or none is exactly what a
   * stop gets moved onto when a leg turns out to be too long for one day.
   *
   * The target index counts the stops the rail shows on that day; an empty day takes
   * position 0.
   */
  const moveRoadtripStopToDay = useCallback(async (
    fromDayId: number,
    assignmentId: number,
    toDayId: number,
    toIndex: number,
  ) => {
    if (!can('day_edit', trip)) return
    if (fromDayId === toDayId) return
    const target = (assignments[String(toDayId)] ?? [])
      .slice()
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    const visible = target.filter(a => typeof a.place?.lat === 'number' && typeof a.place?.lng === 'number')
    // Map the rail's own count onto the day's full list, which may hold rows it hides.
    const anchor = visible[Math.min(Math.max(toIndex, 0), Math.max(visible.length - 1, 0))]
    const at = anchor ? target.findIndex(a => a.id === anchor.id) : target.length

    // Both days shift at once, and each needs its own correction: the stop leaves a gap
    // on one side and opens one on the other. No geometry is measured for the arriving
    // day — its roads are about to be different anyway, so there is nothing stable to
    // measure a via against.
    const fromStops = roadtripStopsOf(fromDayId)
    const fromVis = fromStops.findIndex(a => a.id === assignmentId)
    const fromPlan = fromVis === -1
      ? null
      : reanchorAfterRemove(roadtripVias.byDay[fromDayId] ?? [], fromVis, fromStops.length)
    const toVis = Math.min(Math.max(toIndex, 0), visible.length)
    const toPlan = fromVis === -1
      ? null
      : reanchorAfterInsert(roadtripVias.byDay[toDayId] ?? [], toVis, () => true)

    try {
      await tripActions.moveAssignment(tripId, assignmentId, fromDayId, toDayId, at < 0 ? target.length : at)
      if (fromPlan) await roadtripVias.reanchor(fromDayId, fromPlan)
      if (toPlan) await roadtripVias.reanchor(toDayId, toPlan)
      updateRouteForDay(fromDayId)
      updateRouteForDay(toDayId)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
    }
  }, [assignments, tripId, tripActions, updateRouteForDay, toast, t, can, trip, roadtripVias, roadtripStopsOf])

  const routeAlternatives = useRouteAlternatives()
  /**
   * Which offered route the pointer is on, so the map can light that one up.
   *
   * Lives here rather than in the bar because the map draws it and the bar reports it —
   * neither owns it, and passing it through the page would put state in a wiring
   * container the Page pattern keeps stateless.
   */
  const [highlightedAlternative, setHighlightedAlternative] = useState<number | null>(null)
  // Closing the picker has to clear it, or the next one opens with a road already lit.
  useEffect(() => {
    if (!routeAlternatives.open) setHighlightedAlternative(null)
  }, [routeAlternatives.open])

  /**
   * The offered routes as the map draws them: line, colour, and the label that sits on
   * the road. Built here rather than in the page so the page stays a wiring container
   * and both renderers get the identical shape.
   */
  const alternativeOverlays = useMemo(
    () => buildAlternativeOverlays(routeAlternatives.open?.routes, {
      fastest: t('roadtrip.alt.fastest'),
      current: t('roadtrip.alt.current'),
      noMotorway: t('roadtrip.alt.noMotorway'),
      noToll: t('roadtrip.alt.noToll'),
    }),
    [routeAlternatives.open, t],
  )

  /**
   * The stretch of map the offered routes cover, handed to whichever renderer is up.
   *
   * Opening the picker without moving the camera means weighing three roads you cannot
   * see. Derived from the overlays rather than from the two endpoints so the frame holds
   * the whole of every alternative, including one that swings far off the direct line.
   * Empty while nothing is open, and the map is told to do nothing with an empty list —
   * so closing the picker leaves the view where the user put it.
   */
  const alternativeFocusPoints = useMemo(
    () => alternativeOverlays.flatMap(o => o.coordinates),
    [alternativeOverlays],
  )

  /** Asks the router for other ways of driving one leg of one day. */
  const askRouteAlternatives = useCallback((dayId: number, legIndex: number) => {
    const day = roadtripRoutes.days.find(d => d.dayId === dayId)
    const from = day?.stops[legIndex]
    const to = day?.stops[legIndex + 1]
    if (!from || !to || !day) return
    if (routeAlternatives.open?.dayId === dayId && routeAlternatives.open.index === legIndex) {
      routeAlternatives.close()
      return
    }
    // The vias on THIS leg, so the road currently driven is offered alongside the
    // router's own suggestions rather than being missing from its own picker.
    const dayIndex = day.stops.indexOf(from)
    const legVias = (roadtripVias.byDay[dayId] ?? [])
      .filter(v => v.after_order_index === dayIndex)
      .sort((a, b) => a.sequence - b.sequence)
    routeAlternatives.ask(dayId, legIndex, from, to, routeProfile, legVias)
  }, [roadtripRoutes.days, routeAlternatives, routeProfile, roadtripVias.byDay])

  /**
   * Taking one of the offered routes.
   *
   * Saved as a via at the point where that route differs most from the default, not as a
   * stored polyline: a polyline goes stale with the next OSM update and with every stop
   * that moves, while a via keeps forcing the router back onto this road for as long as
   * the road exists.
   */
  const chooseRouteAlternative = useCallback(async (index: number) => {
    const open = routeAlternatives.open
    const alt = open?.routes[index]
    if (!open || !alt) return
    // Choosing the road already being driven changes nothing.
    if (alt.current) { routeAlternatives.close(); return }
    // The router's own preference means no detour at all, so the vias on this leg go.
    if (alt.direct || !alt.divergence) {
      const day = roadtripRoutes.days.find(d => d.dayId === open.dayId)
      const stop = day?.stops[open.index]
      const dayIndex = stop && day ? day.stops.indexOf(stop) : -1
      // Clearing the leg in one write. One delete per via meant a full trip re-route
      // between each of them, so undoing a detour with three vias drew three routes.
      if (dayIndex >= 0) await roadtripVias.addMany(open.dayId, [], [dayIndex]).catch(() => {})
      routeAlternatives.close()
      return
    }
    const day = roadtripRoutes.days.find(d => d.dayId === open.dayId)
    const stop = day?.stops[open.index]
    if (!day || !stop) return
    try {
      await roadtripVias.add(open.dayId, day.stops.indexOf(stop), alt.divergence.lat, alt.divergence.lng)
      routeAlternatives.close()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
    }
  }, [routeAlternatives, roadtripRoutes.days, roadtripVias, toast, t])

  /**
   * A click on the drawn route puts a via there, and the drive is redrawn through it.
   *
   * Which pair of stops it belongs between comes from projecting the click onto the
   * day's routed geometry — the same measurement the corridor search uses, so "after the
   * third stop" means the same thing everywhere. The day is the one whose line was hit,
   * found by trying each day's geometry and keeping the closest.
   */
  const addRoadtripVia = useCallback(async (lat: number, lng: number) => {
    if (!can('day_edit', trip)) return
    let best: { dayId: number; afterIndex: number; offRouteKm: number } | null = null
    for (const day of roadtripRoutes.days) {
      if (day.geometry.length < 2) continue
      const spine = day.geometry.map(([la, ln]) => ({ lat: la, lng: ln }))
      const hit = projectOntoRoute({ lat, lng }, spine)
      if (!hit) continue
      if (best && hit.offRouteKm >= best.offRouteKm) continue
      // Which stop the via follows: the last one the car passes before reaching it.
      const stopsAlong = day.stops.map(stop => projectOntoRoute({ lat: stop.lat, lng: stop.lng }, spine)?.alongKm ?? 0)
      const afterIndex = Math.max(0, insertIndexForAlong(stopsAlong, hit.alongKm) - 1)
      best = { dayId: day.dayId, afterIndex, offRouteKm: hit.offRouteKm }
    }
    // A click that landed on some other line is not a via anywhere.
    if (!best || best.offRouteKm > 2) return
    try {
      await roadtripVias.add(best.dayId, best.afterIndex, lat, lng)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
    }
  }, [roadtripRoutes.days, roadtripVias, can, trip, toast, t])

  /** Dragging a via redraws the route through its new position. */
  const moveRoadtripVia = useCallback(async (dayId: number, id: number, lat: number, lng: number) => {
    if (!can('day_edit', trip)) return
    try {
      await roadtripVias.move(dayId, id, lat, lng)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
    }
  }, [roadtripVias, can, trip, toast, t])

  /** Removing a via lets the drive take the direct road again. */
  const removeRoadtripVia = useCallback(async (dayId: number, id: number) => {
    if (!can('day_edit', trip)) return
    try {
      await roadtripVias.remove(dayId, id)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.unknownError'))
    }
  }, [roadtripVias, can, trip, toast, t])

  /**
   * A corridor hit dropped on the map, placed where it was dropped rather than where the
   * corridor projected it.
   *
   * The two differ whenever a drive passes near the same spot twice — a loop, an
   * out-and-back — and the automatic projection can only pick one of them. Dropping says
   * which, and the drop coordinate is projected onto the same routed line the hits were
   * measured along, so the answer is in the same units as everything else.
   *
   * A drop nowhere near the drive is ignored rather than guessed at: adding a stop
   * fifty kilometres off the route because the pointer slipped is worse than nothing
   * happening.
   */
  const dropPoiOnRoute = useCallback((osmId: string, lat: number, lng: number) => {
    if (!can('place_edit', trip)) return
    const hit = roadtripCorridor.visible.find(p => p.osm_id === osmId)
    const day = roadtripCorridor.day
    if (!hit || !day) return
    const at = projectOntoRoute({ lat, lng }, roadtripCorridor.search.spine)
    if (!at || at.offRouteKm > roadtripCorridor.widthKm) return
    setStopDraft({
      poi: hit,
      dayId: day.dayId,
      position: insertIndexForAlong(roadtripCorridor.stopsAlongKm, at.alongKm),
      dayNumber: day.dayNumber,
    })
  }, [roadtripCorridor, can, trip])

  /** Hands the draft over to the full form, keeping the day and the position it worked out. */
  const stopDraftToForm = useCallback((stop?: { stopType: RoadtripStopType | null; dwellMinutes: number }) => {
    if (!stopDraft) return
    const { poi, dayId, position } = stopDraft
    setStopDraft(null)
    // Carries the kind and the dwell the popup had already worked out. Leaving them
    // behind is what turned a fuel stop into a numbered destination on the way to the
    // full form, silently and in every total.
    openAddPlaceFromPoi(poi, dayId, position, stop ?? null)
  }, [stopDraft, openAddPlaceFromPoi])

  /**
   * A place on this trip that came from the same OSM object.
   *
   * The full place form warns about duplicates; without the same check here the popup
   * would be the quickest way to add one petrol station twice.
   */
  const stopDraftDuplicate = useMemo(() => {
    if (!stopDraft?.poi.osm_id) return null
    return places.find(p => p.osm_id === stopDraft.poi.osm_id)?.name ?? null
  }, [stopDraft, places])

  const handleSavePlace = useCallback(async (data) => {
    const pendingFiles = data._pendingFiles
    delete data._pendingFiles
    if (editingPlace) {
      // Always strip time fields from place update — time is per-assignment only.
      // Same for the day-specific note (#2163): it belongs to the assignment,
      // never to the pool place.
      const { place_time, end_time, assignment_notes, ...placeData } = data
      await tripActions.updatePlace(tripId, editingPlace.id, placeData)
      // If editing from assignment context, save time per-assignment
      if (editingAssignmentId) {
        await assignmentsApi.updateTime(tripId, editingAssignmentId, { place_time: place_time || null, end_time: end_time || null })
        // The form only includes assignment_notes when the user changed it, so
        // an untouched note never produces a PUT (#2163). '' clears like null.
        if (assignment_notes !== undefined) {
          await assignmentsApi.updateNotes(tripId, editingAssignmentId, { notes: assignment_notes || null })
        }
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
      return { id: editingPlace.id }
    } else {
      const place = await tripActions.addPlace(tripId, data)
      // Added from inside a day? Then it belongs to that day. Without this the
      // place drops into the unplanned pool and, on mobile, into a different
      // screen entirely — which reads as "it wasn't saved" (#1998).
      if (place?.id && placeFormDayId != null) {
        try {
          // With a position the stop lands where it will be driven past, not at the end
          // of the day. The slice has taken one all along; nothing ever passed it.
          await tripActions.assignPlaceToDay(tripId, placeFormDayId, place.id, placeFormPosition)
          updateRouteForDay(placeFormDayId)
        } catch (err: unknown) {
          // The place itself exists; only the day link failed.
          toast.error(err instanceof Error ? err.message : t('common.unknownError'))
        }
      }
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
      // Handed back so the form can link an expense to a place that did not
      // exist a moment ago (#1298), the same way the booking modals work.
      return place?.id ? { id: place.id } : undefined
    }
  }, [editingPlace, editingAssignmentId, placeFormDayId, placeFormPosition, tripId, toast, pushUndo, updateRouteForDay])

  // Open the place editor from any entry point (Places pool, inspector, map).
  // Times live per day-assignment, so when no day is in context resolve the
  // place's lone assignment to hydrate & persist its times; with 0 or 2+
  // assignments the time is ambiguous and the modal hides the fields (#1247).
  const openPlaceEditor = useCallback((place: Place, preferredAssignmentId: number | null = null) => {
    setEditingPlace(place)
    setEditingAssignmentId(preferredAssignmentId ?? resolvePoolAssignmentId(assignments, place.id))
    setPlaceFormDayId(null)
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
            // An undone track has to come back as a track, not a bare point.
            route_geometry: capturedPlace.route_geometry,
            route_color: capturedPlace.route_color,
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
              route_geometry: place.route_geometry, route_color: place.route_color,
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
  //
  // A type neither form can express belongs to whichever tab the user started from.
  // Handing an unreadable transport document to the booking form is what left them
  // with six chips, none of them a transport, and 'other' as the only honest pick
  // (#2076). A type either form DOES know always wins over the tab — one PDF
  // routinely holds a flight and a hotel.
  const openImportItem = (item: BookingImportPreviewItem) => {
    const draft = parsedItemToDraft(item)
    // Attach the file this item was parsed from so it lands in the booking's Files on save.
    const srcName = item.source?.fileName
    const srcFile = srcName ? importSourceFilesRef.current.find(f => f.name === srcName) : undefined
    if (srcFile) draft._sourceFiles = [srcFile]
    if (isTransportItem(item) || (isUnplaceableItem(item) && importKindRef.current === 'transports')) {
      setShowReservationModal(false); setEditingReservation(null); setReservationPrefill(null)
      setEditingTransport(null); setTransportModalDayId(null)
      setTransportPrefill(draft); setShowTransportModal(true)
    } else {
      setShowTransportModal(false); setEditingTransport(null); setTransportPrefill(null); setTransportModalDayId(null)
      setEditingReservation(null)
      setReservationPrefill(draft); setShowReservationModal(true)
    }
  }

  const startImportReview = (
    items: BookingImportPreviewItem[],
    sourceFiles: File[] = [],
    kind: 'transports' | 'bookings' = 'bookings',
  ) => {
    if (!items.length) return
    importSourceFilesRef.current = sourceFiles
    importKindRef.current = kind
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
      const kind = task.kind ?? 'bookings'
      dismissBgTask(jobId)
      // Prefer the in-memory files (immediate path); after a reload they live in IndexedDB.
      void (async () => {
        const files = inMemory && inMemory.length ? inMemory : await getImportFiles(jobId)
        deleteImportFiles(jobId)
        startImportReview(items, files, kind)
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

  const mapTileUrl = useTileUrl(OFM_POSITRON)

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
    roadtripMode, toggleRoadtripMode, roadtripActive, roadtripRoutes, roadtripCorridor,
    followTrack, roadtripViaCounts,
    allowedFileTypes, tripMembers, setTripMembers, refreshMembers, loadAccommodations,
    TRANSPORT_TYPES, TRIP_TABS, activeTab, setActiveTab, handleTabChange,
    leftWidth, rightWidth, leftCollapsed, rightCollapsed, setLeftCollapsed, setRightCollapsed, startResizeLeft, startResizeRight,
    selectedPlaceId, selectedAssignmentId, setSelectedPlaceId, selectAssignment,
    showDayDetail, setShowDayDetail, dayDetailCollapsed, setDayDetailCollapsed,
    showPlaceForm, setShowPlaceForm, editingPlace, setEditingPlace,
    prefillCoords, setPrefillCoords, editingAssignmentId, setEditingAssignmentId,
    placeFormDayId, setPlaceFormDayId, reservationModalDayId, setReservationModalDayId,
    stopDraft, setStopDraft, saveStopDraft, saveStopDraftAsNight, stopDraftToForm, stopDraftDuplicate, reorderRoadtripStop,
    setRoadtripStopKind,
    saveRoadtripLimit,
    roadtripVias, addRoadtripVia, moveRoadtripVia, removeRoadtripVia,
    routeAlternatives, askRouteAlternatives, chooseRouteAlternative, alternativeOverlays, alternativeFocusPoints,
    stayDraft, setStayDraft, setRoadtripStay,
    highlightedAlternative, setHighlightedAlternative,
    moveRoadtripStopToDay,
    dropPoiOnRoute,
    showTripForm, setShowTripForm, showMembersModal, setShowMembersModal,
    showReservationModal, setShowReservationModal, editingReservation, setEditingReservation,
    showBookingImport, setShowBookingImport, bookingImportKind, setBookingImportKind, bookingImportAvailable,
    airTrailAvailable, showAirTrailImport, setShowAirTrailImport,
    bookingForAssignmentId, setBookingForAssignmentId,
    showTransportModal, setShowTransportModal, editingTransport, setEditingTransport,
    transportModalDayId, setTransportModalDayId,
    transportModalAutomated, setTransportModalAutomated, transitPrefill, setTransitPrefill, transitJourney, setTransitJourney,
    reservationPrefill, transportPrefill, importReviewActive, startImportReview, advanceImportReview,
    routeShown, setRouteShown, autoShowRoute, transitRoutesShown, routeProfile, setRouteProfile, routeVias, fitKey, setFitKey,
    mobileSidebarOpen, setMobileSidebarOpen, mobilePlanScrollTopRef, mobilePlacesScrollTopRef,
    deletePlaceId, setDeletePlaceId, deletePlaceIds, setDeletePlaceIds,
    visibleConnections, toggleConnection, allConnectionsShown, toggleAllConnections, mapTransportDetail, setMapTransportDetail,
    isMobile, isTouch,
    expandedDayIds, setExpandedDayIds, mapPlaces,
    route, routeSegments, routeInfo, setRoute, setRouteInfo, updateRouteForDay,
    handleSelectDay, handlePlaceClick, handleMarkerClick, handleMapClick, handleMapContextMenu, openAddPlaceFromPoi, handlePoiClick,
    handleSavePlace, openPlaceEditor, handleDeletePlace, confirmDeletePlace, confirmDeletePlaces, confirmChangeCategory,
    handleAssignToDay, handleRemoveAssignment, handleReorder, handleReorderDays, handleAddDay, handleUpdateDayTitle,
    handleSaveReservation, handleSaveTransport, handleDeleteReservation,
    selectedPlace, dayOrderMap, dayPlaces,
    mapTileUrl, fontStyle, splashDone,
  }
}
