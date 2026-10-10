import { useRoadtripSettings } from '../../hooks/useRoadtripSettings'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router'
import { useTripStore } from '../../store/tripStore'
import { useCanDo } from '../../store/permissionsStore'
import { useSettingsStore } from '../../store/settingsStore'
import { getCached, fetchPhoto } from '../../services/photoService'
import { useToast } from '../../components/shared/Toast'
import { Map, Ticket, PackageCheck, Wallet, FolderOpen, Users, Train, Mountain, Route } from 'lucide-react'
import { resolvePluginIcon } from '../../components/shared/PluginIcon'
import { useTranslation } from '../../i18n'
import { addonsApi, authApi, tripsApi, healthApi, placesApi } from '../../api/client'
import { TRANSPORT_TYPES } from '../../utils/dayMerge'
import { accommodationRepo } from '../../repo/accommodationRepo'
import { offlineDb } from '../../db/offlineDb'
import { isEffectivelyOffline } from '../../sync/networkMode'
import { useAuthStore } from '../../store/authStore'
import { useResizablePanels } from '../../hooks/useResizablePanels'
import { useTripWebSocket } from '../../hooks/useTripWebSocket'
import { useRouteCalculation } from '../../hooks/useRouteCalculation'
import { useTripRouteOverview } from '../../components/Map/useTripRouteOverview'
import { useDayClear } from './useDayClear'
import { isServiceStopType } from '../../components/Roadtrip/roadtripModel'
import { inspectorStay } from '../../components/Roadtrip/stayReading'
import { usePlaceSelection } from '../../hooks/usePlaceSelection'
import { useTourPlaceIds } from '../../hooks/useTourPlaceIds'
import { useAddonStore } from '../../store/addonStore'
import { usePlannerHistory } from '../../hooks/usePlannerHistory'
import { useIsTouch } from '../../hooks/useIsTouch'
import { usePluginStore } from '../../store/pluginStore'
import type { Accommodation, Assignment, TripMember, Day, Reservation } from '../../types'
import { OFM_POSITRON, DEFAULT_MAP_LAT, DEFAULT_MAP_LNG, DEFAULT_MAP_ZOOM } from '../../constants/mapDefaults'
import { useTileUrl } from '../../hooks/useTileUrl'
import { placesForDays } from './tripPlannerModel'
import { isDeepLinkableTripTab, TRIP_TAB_LABEL_KEYS } from '../../constants/tripTabs'
import { isRoutableReservation } from '../../utils/reservationRoutes'
import { showReservationOnMap } from '../../components/Planner/bookings/showOnMap'
import {
  parseStoredConnections, resolveEffectiveConnections, resolveVisibleConnectionIds,
  toggleConnectionId, toggleAllConnections as flipAllConnectionsMode,
  type StoredConnections,
} from '../../utils/connectionsVisibility'
import { usePlaceLanguage } from '../../hooks/usePlaceLanguage'
import { useDayDelete } from './useDayDelete'
import { useDayAdd } from './useDayAdd'
import { usePlannerDialogs } from './usePlannerDialogs'
import { usePlannerMapView } from './usePlannerMapView'
import { useMapPlaces } from './useMapPlaces'
import { useRoadtripFeed } from './useRoadtripFeed'
import { useRoadtripStopEdits } from './useRoadtripStopEdits'
import { useRoadtripAlternatives } from './useRoadtripAlternatives'
import { useRoadtripDriveShaping } from './useRoadtripDriveShaping'
import { usePlaceEdits } from './usePlaceEdits'
import { usePlaceFormOpeners } from './usePlaceFormOpeners'
import { useDayPlanEdits } from './useDayPlanEdits'
import { useBookingEdits } from './useBookingEdits'
import { useIsPhone } from '../../mobile/useIsPhone'

/**
 * Trip planner page logic, the big one. Owns the trip store wiring, addon
 * gating, accommodations/members loading, the tab + resizable-panel + selection
 * state, the booking detail and the splash gate. TripPlannerPage stays a wiring
 * container that lays out the day/map/places panes and modals.
 * Behaviour is identical to the previous in-component logic.
 *
 * Self-contained parts live in the use* sub-hooks beside this file. Each one is
 * called where its code used to sit, so React still runs every effect in the
 * order it always did.
 */
export function useTripPlanner() {
  const { id } = useParams<{ id: string }>()
  // The route param is a string; convert once here so every downstream component
  // prop and store call gets a real number. An absent/invalid id becomes NaN,
  // which stays falsy in the `if (tripId)` guards below.
  const tripId = id ? Number(id) : Number.NaN
  const navigate = useNavigate()
  const toast = useToast()
  const { t, language, locale } = useTranslation()
  const placeLang = usePlaceLanguage()
  const { settings } = useSettingsStore()
  const roadtripSettings = useRoadtripSettings(s => s, tripId)
  // trip-page plugins mount as tabs inside this trip planner (tripId-scoped).
  const allPlugins = usePluginStore(s => s.plugins)
  const pluginsLoaded = usePluginStore(s => s.loaded)
  const placesPhotosEnabled = useAuthStore(s => s.placesPhotosEnabled)
  const trip = useTripStore(s => s.trip)
  const days = useTripStore(s => s.days)
  const allPlaces = useTripStore(s => s.places)
  const storedAssignments = useTripStore(s => s.assignments)
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
  const { pushUndo, undo, forgetDay, forgetPlace, canUndo, lastActionLabel } = usePlannerHistory()

  // A step that could not be taken back says so instead of claiming it was.
  const handleUndo = useCallback(async () => {
    const label = lastActionLabel
    const undone = await undo()
    if (undone === false) toast.error(t('undo.failed', { action: label ?? '' }))
    else if (undone) toast.info(t('undo.done', { action: label ?? '' }))
  }, [undo, lastActionLabel, toast])

  const [enabledAddons, setEnabledAddons] = useState<Record<string, boolean>>({ packing: true, budget: true, documents: true, collab: false, roadtrip: false, tours: false, dawarich: false })
  // The values above are an optimistic guess until the addon feed answers. The
  // tab guard below waits for this before evicting anything, so a tab we were
  // asked to open ('collab' in particular, guessed off) survives the gap.
  const [addonsLoaded, setAddonsLoaded] = useState<boolean>(false)
  // Road trip mode swaps the plan view's left rail (and later its map layer) for the
  // drive-first reading of the same trip. Per trip and per session, like the tab choice:
  // someone planning a road trip stays in it across reloads without it leaking into
  // their next, non-driving trip.
  const [storedRoadtripMode, setRoadtripMode] = useState<boolean>(() => sessionStorage.getItem(`trip-roadtrip-${tripId}`) === '1')
  // Declared here rather than with the other layout state further down, because
  // road-trip mode is decided on it and the assignment and place lists below are
  // decided on that. One subscriber for the whole hook.
  const isMobile = useIsPhone()
  // The phone shell has no road-trip surface at all: no rail, no drive lines, and
  // no switch to turn the mode back off. Narrowing a desktop window past the
  // phone breakpoint used to carry the flag across anyway, which took the trip
  // overview pill away with nothing in its place and listed every booked night
  // twice. The flag is kept, so widening the window again returns to the drive.
  const roadtripMode = storedRoadtripMode && !isMobile
  // Two reasons a stop can be road-trip-only, and they are not the same reason.
  //
  // The switch is the traveller's: it hides the petrol stations and rest areas
  // they added along the drive from a day list they want to read as a plan.
  //
  // A stop a lodging booking put there is hidden whatever the switch says,
  // because the day already shows that booking as its own overnight block and
  // the row would be the same hotel a second time. Road trip mode wants it: the
  // drive has to end somewhere, and that somewhere is where you sleep.
  const assignments = useMemo(() => {
    if (roadtripMode) return storedAssignments
    const hideServiceStops = roadtripSettings.roadtrip_service_stops_in_days === false
    const hidden = (visit: Assignment) => visit.accommodation_id != null
      || (hideServiceStops && isServiceStopType(visit.place?.stop_type))
    // Same object back when nothing is hidden, so a trip without bookings does not
    // rebuild every day list on each render of this hook.
    if (!Object.values(storedAssignments).some(visits => visits.some(hidden))) return storedAssignments
    return Object.fromEntries(
      Object.entries(storedAssignments).map(([dayId, visits]) => [dayId, visits.filter(v => !hidden(v))]),
    )
  }, [roadtripMode, roadtripSettings.roadtrip_service_stops_in_days, storedAssignments])
  const toggleRoadtripMode = useCallback(() => {
    setRoadtripMode(prev => {
      const next = !prev
      sessionStorage.setItem(`trip-roadtrip-${tripId}`, next ? '1' : '0')
      return next
    })
  }, [tripId])
  const [collabFeatures, setCollabFeatures] = useState<{ chat: boolean; notes: boolean; links: boolean; polls: boolean; whatsnext: boolean }>({ chat: true, notes: true, links: true, polls: true, whatsnext: true })
  const [tripAccommodations, setTripAccommodations] = useState<Accommodation[]>([])
  const places = useMemo(
    () => (roadtripMode
      ? allPlaces
      : placesForDays(allPlaces, roadtripSettings.roadtrip_service_stops_in_days === false, { accommodations: tripAccommodations, reservations })),
    [roadtripMode, roadtripSettings.roadtrip_service_stops_in_days, allPlaces, tripAccommodations, reservations],
  )
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
        setEnabledAddons({ packing: !!map.packing, budget: !!map.budget, documents: !!map.documents, collab: !!map.collab, roadtrip: !!map.roadtrip, tours: !!map.tours, dawarich: !!map.dawarich })
      if (data.collabFeatures) setCollabFeatures(data.collabFeatures)
    }).catch(() => {}).finally(() => setAddonsLoaded(true))
    authApi.getAppConfig().then(config => {
      if (config.allowed_file_types) setAllowedFileTypes(config.allowed_file_types)
    }).catch(() => {})
  }, [])


  const tripPagePlugins = allPlugins.filter(p => p.type === 'trip-page')
  const tripPluginIds = tripPagePlugins.map(p => p.id).join(',')

  // A trip-page plugin may replace core tabs while it's active (its manifest names
  // them; 'plan' is never replaceable) and may pick where its own tab sits.
  const replacedTabs = new Set(tripPagePlugins.flatMap(p => p.tripPage?.replaces ?? []))
  const TRIP_TABS = [
    { id: 'plan', label: t(TRIP_TAB_LABEL_KEYS.plan), icon: Map },
    ...(enabledAddons.tours && !isMobile ? [{ id: 'tour-planner', label: t(TRIP_TAB_LABEL_KEYS['tour-planner']), icon: Mountain, desktopOnly: true }] : []),
    { id: 'transports', label: t(TRIP_TAB_LABEL_KEYS.transports), icon: Train },
    { id: 'buchungen', label: t(TRIP_TAB_LABEL_KEYS.buchungen), shortLabel: t('trip.tabs.reservationsShort'), icon: Ticket },
    // Phone only: the desktop reaches the drive through the mode switch beside the
    // day plan, and a second entry point there would be a tab nobody needs.
    ...(enabledAddons.roadtrip && isMobile ? [{ id: 'roadtrip', label: t(TRIP_TAB_LABEL_KEYS.roadtrip), icon: Route }] : []),
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
  }, [activeTab, enabledAddons, addonsLoaded, tripPluginIds, pluginsLoaded, isMobile])

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
  const {
    leftWidth, rightWidth, leftCollapsed, rightCollapsed, setLeftCollapsed, setRightCollapsed,
    leftHidden, rightHidden, toggleLeft, toggleRight, narrow: narrowPanels,
    startResizeLeft, startResizeRight, nudgeLeft, nudgeRight, resizeMin, resizeMax,
  } = useResizablePanels()
  const { selectedPlaceId, selectedAssignmentId, setSelectedPlaceId, selectAssignment } = usePlaceSelection()
  const toursEnabled = useAddonStore(state => state.isEnabled('tours'))
  const [toursMode, setToursMode] = useState(false)
  const previousToursModeRef = useRef(false)
  const { tours, toursLoading, tourDataReady, tourPlaceIds, reloadTourPlaceIds, invalidateTourPlaceIds, upsertTour } = useTourPlaceIds(tripId, toursEnabled)

  useEffect(() => {
    if (!toursEnabled) {
      setToursMode(false)
      previousToursModeRef.current = false
      return
    }
    const enteredToursMode = toursMode && !previousToursModeRef.current
    previousToursModeRef.current = toursMode
    if (enteredToursMode) setSelectedPlaceId(null)
  }, [toursEnabled, toursMode, setSelectedPlaceId])
  const [dayDetail, setShowDayDetail] = useState<Day | null>(null)
  // A day deleted while its panel is open, here or by a fellow traveller, takes
  // the panel along instead of leaving it on a day that is gone.
  const showDayDetail = dayDetail && days.some(d => d.id === dayDetail.id) ? dayDetail : null
  const [dayDetailCollapsed, setDayDetailCollapsed] = useState(false)
  // The day's "+" can ask for a new stay: the details panel opens on that day and
  // takes the request once, then hands it back so a later opening stays plain.
  const [stayPickerDayId, setStayPickerDayId] = useState<number | null>(null)
  const plannerDialogs = usePlannerDialogs({ tripId, tripActions, searchParams, setSearchParams })
  // The dialog state this hook reads further down as well as returning it.
  const {
    setShowPlaceForm, editingPlace, setEditingPlace, setPrefillCoords, editingAssignmentId, setEditingAssignmentId,
    placeFormDayId, setPlaceFormDayId, placeFormPosition, setPlaceFormPosition,
    serviceStopForm, setServiceStopForm, serviceStopKind, setServiceStopKind,
    stopDraft, setStopDraft, stayRelease, setStayRelease, setBookingImportAvailable,
    setShowReservationModal, editingReservation, setEditingReservation,
    setShowTransportModal, editingTransport, setEditingTransport, setTransportModalDayId,
    bookingDetailOpen, setBookingDetailOpen, openTransportEditor, changeTransitRoute,
  } = plannerDialogs
  // The dialog state that only passes through to the shells.
  const {
    showPlaceForm, prefillCoords, reservationModalDayId, setReservationModalDayId,
    showTripForm, setShowTripForm, showMembersModal, setShowMembersModal, showReservationModal,
    showBookingImport, setShowBookingImport, bookingImportKind, setBookingImportKind, bookingImportAvailable,
    airTrailAvailable, showAirTrailImport, setShowAirTrailImport, bookingForAssignmentId, setBookingForAssignmentId,
    showTransportModal, transportModalDayId, transportModalAutomated, setTransportModalAutomated,
    transitPrefill, setTransitPrefill, transitJourney, setTransitJourney,
  } = plannerDialogs
  const {
    mapLocked, toggleMapLocked, mapLockedRef, isMobileRef, fitKey, setFitKey,
    overviewShown, toggleOverview, dawarichTrailShown, toggleDawarichTrail, dawarichTrail,
    routeShown, setRouteShown, autoShowRoute, transitRoutesShown, routeProfile, setRouteProfile,
  } = usePlannerMapView({ tripId, trip, places, selectedDayId, isMobile })
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<'left' | 'right' | null>(null)
  const mobilePlanScrollTopRef = useRef<number>(0)
  const mobilePlacesScrollTopRef = useRef<number>(0)

  useEffect(() => {
    // The server runs the import when EITHER kitinerary or the LLM parser is
    // there (booking-import.service.ts), so gating the entry point on kitinerary
    // alone hid a working feature on LLM-only instances (#2007).
    healthApi.features().then(f => setBookingImportAvailable(f.bookingImport || f.aiParsing)).catch(() => {})
  }, [setBookingImportAvailable])

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

  useTripWebSocket(tripId, invalidateTourPlaceIds)

  const { expandedDayIds, setExpandedDayIds, mapPlaces, dayOrderMap, dayPlaces } = useMapPlaces({
    places, assignments, selectedDayId, days, tripAccommodations, reservations, toursEnabled,
  })

  const { route, routeWalking, routeSegments, routeVias, routeInfo, setRoute, setRouteInfo, updateRouteForDay } = useRouteCalculation({ assignments } as any, selectedDayId, routeShown, routeProfile, tripAccommodations)
  // Road trip mode already draws the whole trip its own way, so the overview stands
  // down there rather than drawing a second set of lines over it.
  const overviewActive = overviewShown && !roadtripMode
  const tripOverview = useTripRouteOverview(tripId, days, assignments, reservations, tripAccommodations, routeProfile, overviewActive, places)

  // Called here so the road trip's effects keep their place, right after the overview's.
  const {
    roadtripActive, roadtripFeedActive, roadtripRoutes, roadtripVias, roadtripCorridor, refuel, followTrack,
    roadtripPreferencesState, dailyTimesActive, dayBoundaries, resetDayBoundaries, dayBoundaryControls, saveRoadtripLimit,
    roadtripStopsOf, viaLiesBefore, viasAfterInsert, roadtripConnections, roadtripViaCounts,
    collapsedRoadtripDays, toggleRoadtripDay, roadtripMapLines, roadtripMapPlaces, roadtripLineColors, dawarichHiddenDates,
  } = useRoadtripFeed({
    tripId, trip, can, toast, t, enabledAddons, roadtripMode, roadtripSettings, isMobile, activeTab,
    days, reservations, storedAssignments, assignments, tripAccommodations, places,
    mapPlaces, expandedDayIds, routeProfile, visibleConnections,
  })

  const handleSelectDay = useCallback((dayId: number | null, skipFit?: boolean) => {
    tripActions.setSelectedDay(dayId)
    // The lock is a desktop control; the phone always follows the day.
    if (!skipFit && !(mapLockedRef.current && !isMobileRef.current)) setFitKey(k => k + 1)
    setMobileSidebarOpen(null)
    updateRouteForDay(dayId)
  }, [updateRouteForDay, isMobileRef, mapLockedRef, setFitKey])

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

  const {
    stayDraft, setStayDraft, editRoadtripStay, setRoadtripStay, roadtripEndsDayAt, setRoadtripEndDay,
    saveStopDraft, saveStopDraftAsNight, confirmStayRelease, reorderRoadtripStop, moveRoadtripStopToDay,
    setRoadtripStopKind, setRoadtripStopFill,
  } = useRoadtripStopEdits({
    tripId, trip, can, tripActions, toast, t, stopDraft, setStopDraft, stayRelease, setStayRelease,
    assignments, tripAccommodations, reservations, loadAccommodations, updateRouteForDay,
    roadtripVias, roadtripStopsOf, viaLiesBefore, dayBoundaries, dailyTimesActive,
  })

  // Called here so the picker's effects keep their place after the road trip's own.
  const {
    highlightedAlternative, setHighlightedAlternative, routeAlternatives, alternativeOverlays, alternativeFocusPoints,
    mapFocusPoints, roadtripMapVias, focusRoadtripPoint, askRouteAlternatives, chooseRouteAlternative,
  } = useRoadtripAlternatives({
    t, toast, isMobile, activeTab, roadtripActive, roadtripFeedActive, roadtripRoutes, roadtripVias, refuel,
    collapsedRoadtripDays,
  })

  const {
    manualStopTargetFor, addRoadtripVia, moveRoadtripVia, removeRoadtripVia, askRefuel, acceptRefuel, dropPoiOnRoute,
  } = useRoadtripDriveShaping({
    trip, can, toast, t, roadtripSettings, setStopDraft, roadtripRoutes, roadtripVias, roadtripCorridor, refuel,
  })

  const {
    handleSavePlace, handleDeletePlace, handleDeleteTour, confirmDeletePlace, confirmDeletePlaces, confirmChangeCategory,
    isTourPlace, deletePlaceId, setDeletePlaceId, deletePlaceIds, setDeletePlaceIds,
    deletePlaceIsTour, deletePlacesIncludeTours, deletePlaceNote, deletePlacesNote,
  } = usePlaceEdits({
    tripId, trip, can, tripActions, toast, t, places, allPlaces, tripAccommodations, reservations,
    toursEnabled, tourPlaceIds, invalidateTourPlaceIds, reloadTourPlaceIds, selectedPlaceId, setSelectedPlaceId,
    selectedDayId, updateRouteForDay, pushUndo, forgetPlace,
    editingPlace, editingAssignmentId, placeFormDayId, placeFormPosition, roadtripRoutes, roadtripVias, viaLiesBefore,
  })

  const {
    openPlaceEditor, stopDraftToForm, stopDraftDuplicate, openManualRoadtripStop, serviceStopMode,
    handleMapContextMenu, openAddPlaceFromPoi, handlePoiClick,
  } = usePlaceFormOpeners({
    trip, can, placeLang, isMobile, days, places, assignments, tripAccommodations, handlePlaceClick,
    stopDraft, setStopDraft, serviceStopForm, setServiceStopForm, serviceStopKind, setServiceStopKind,
    setPrefillCoords, setEditingPlace, setEditingAssignmentId, setPlaceFormDayId, setPlaceFormPosition, setShowPlaceForm,
    roadtripActive, roadtripFeedActive, roadtripRoutes, roadtripCorridor, manualStopTargetFor, isTourPlace,
  })

  const {
    handleReorder, handleReorderDays, handleUpdateDayTitle, handleAssignToDay, handleMoveToDay, handleRemoveAssignment,
  } = useDayPlanEdits({
    tripId, tripActions, toast, t, places, storedAssignments, tripAccommodations, selectedDayId,
    pushUndo, reloadTourPlaceIds, updateRouteForDay, isTourPlace, roadtripVias, viasAfterInsert, roadtripStopsOf,
  })

  const { handleAddDay, dayAdd } = useDayAdd({
    tripId, trip, days, canEditDays: can('day_edit', trip), t, locale, toast,
  })

  // A deleted day can take a stay along, and the selected day's route may have
  // lost its day or its stops. Its panel closes, and undo steps that would act
  // on it are dropped rather than left to fail.
  const afterDayDeleted = useCallback((dayId: number) => {
    setShowDayDetail(open => (open?.id === dayId ? null : open))
    forgetDay(dayId)
    loadAccommodations()
    updateRouteForDay(useTripStore.getState().selectedDayId)
    void reloadTourPlaceIds()
  }, [loadAccommodations, updateRouteForDay, forgetDay, reloadTourPlaceIds])
  const dayDelete = useDayDelete({
    tripId, trip, days, places: allPlaces, reservations, accommodations: tripAccommodations,
    canEditDays: can('day_edit', trip), t, locale, toast, onDeleted: afterDayDeleted,
  })

  const dayClear = useDayClear({
    tripId, days, canEditDays: can('day_edit', trip), t, locale, toast, roadtripVias, updateRouteForDay, pushUndo,
    onToursChanged: reloadTourPlaceIds,
  })

  // Called here so the bridge from the background tasks keeps its place among the effects.
  const {
    reservationPrefill, transportPrefill, importReviewActive, receiptExpense, setReceiptExpense,
    handleSaveReservation, handleSaveTransport, handleDeleteReservation, startImportReview, advanceImportReview,
  } = useBookingEdits({
    tripId, trip, tripActions, toast, t, places, selectedDayId, canUploadFiles, setTripAccommodations,
    editingReservation, setEditingReservation, setShowReservationModal,
    editingTransport, setEditingTransport, setShowTransportModal, setTransportModalDayId,
  })

  // ── The plan's booking detail ───────────────────────────────────────────────
  // A click on a booking in the plan shows it first; the editor is one Edit away.
  const bookingDetail = bookingDetailOpen == null ? null : reservations.find(r => r.id === bookingDetailOpen.id) ?? null
  const openBookingDetail = (r: Reservation) => setBookingDetailOpen({ id: r.id, fromDayList: false })
  const openBookingFromDayList = (r: Reservation) => setBookingDetailOpen({ id: r.id, fromDayList: true })
  const closeBookingDetail = () => setBookingDetailOpen(null)
  // Edit opens the editor the click used to open straight away, under the same right:
  // day_edit for the transport editor, reservation_edit for the booking editor, and
  // from a row of the day list day_edit on top, as that row asked for it. Without
  // the right the detail has no Edit.
  const editReservation = (r: Reservation) => { setEditingReservation(r); setShowReservationModal(true) }
  const editorFor = (r: Reservation | null, fromDayList: boolean) => {
    if (!r) return undefined
    if (TRANSPORT_TYPES.has(r.type)) return can('day_edit', trip) ? openTransportEditor : undefined
    if (fromDayList && !can('day_edit', trip)) return undefined
    return can('reservation_edit', trip) ? editReservation : undefined
  }
  const bookingDetailEditor = editorFor(bookingDetail, !!bookingDetailOpen?.fromDayList)
  // A transit journey is searched again under the right its journey view asked for,
  // on the plan and on the Transports tab alike.
  const bookingDetailChangeRoute = can('day_edit', trip) ? changeTransitRoute : undefined
  // "On map", from the plan and from both booking tabs: the route switches on and its
  // day opens, or the place is selected.
  const showBookingOnMap = (r: Reservation) => showReservationOnMap(r, {
    visibleConnections, toggleConnection, selectDay: id => handleSelectDay(id), selectPlace: setSelectedPlaceId, openPlan: () => handleTabChange('plan'),
  })
  const isBookingOnMap = (r: Reservation) => visibleConnections.includes(r.id)

  const selectedPlace = selectedPlaceId ? places.find(p => p.id === selectedPlaceId) : null
  const selectedTour = toursEnabled && selectedPlaceId
    ? tours.find(tour => tour.place_id === selectedPlaceId) ?? null
    : null
  // The stops the inspector speaks for. A booked night at a day's edge stands on the
  // hotel's place without being a stop of the day, so it is left out: counted, the hotel's
  // own stop lost its stay and its day end to a second match.
  const selectedRoadtripStops = roadtripRoutes.days.flatMap(day => day.stops).filter(stop =>
    !stop.automaticNight && !stop.bookend && (selectedAssignmentId ? stop.assignmentId === selectedAssignmentId : stop.placeId === selectedPlaceId),
  )
  const endDayStop = selectedRoadtripStops.length === 1 ? selectedRoadtripStops[0] : undefined
  const roadtripEndDay = roadtripActive && dailyTimesActive && can('day_edit', trip) && endDayStop && endDayStop.assignmentId > 0
    ? { active: roadtripEndsDayAt(endDayStop), onToggle: () => setRoadtripEndDay(endDayStop) }
    : undefined
  const roadtripStay = roadtripActive && selectedPlace
    ? inspectorStay(roadtripRoutes.days, endDayStop, selectedPlace, can('place_edit', trip) ? editRoadtripStay : undefined)
    : undefined

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
    tripId, navigate, toast, t, language, locale, settings, placesPhotosEnabled,
    trip, days, places, assignments, storedAssignments, packingItems, todoItems, categories, reservations, budgetItems, files,
    selectedDayId, isLoading, tripActions, can, canUploadFiles,
    pushUndo, undo, canUndo, lastActionLabel, handleUndo,
    enabledAddons, collabFeatures, tripAccommodations, setTripAccommodations,
    roadtripMode, toggleRoadtripMode, roadtripActive, roadtripFeedActive, roadtripRoutes, roadtripLineColors, roadtripMapLines, roadtripMapPlaces, collapsedRoadtripDays, toggleRoadtripDay, roadtripCorridor,
    overviewShown, toggleOverview, overviewActive, tripOverview,
    dawarichTrailShown, toggleDawarichTrail, dawarichTrail, dawarichHiddenDates, dawarichEnabled: !!enabledAddons.dawarich,
    followTrack, roadtripViaCounts,
    allowedFileTypes, tripMembers, setTripMembers, refreshMembers, loadAccommodations,
    TRANSPORT_TYPES, TRIP_TABS, activeTab, setActiveTab, handleTabChange,
    leftWidth, rightWidth, leftCollapsed, rightCollapsed, setLeftCollapsed, setRightCollapsed,
    leftHidden, rightHidden, toggleLeft, toggleRight, narrowPanels,
    startResizeLeft, startResizeRight, nudgeLeft, nudgeRight, resizeMin, resizeMax,
    selectedPlaceId, selectedAssignmentId, setSelectedPlaceId, selectAssignment,
    toursEnabled, toursMode, setToursMode, tours, toursLoading, tourDataReady, tourPlaceIds,
    reloadTourPlaceIds, invalidateTourPlaceIds, upsertTour, selectedTour,
    showDayDetail, setShowDayDetail, dayDetailCollapsed, setDayDetailCollapsed,
    stayPickerDayId, setStayPickerDayId,
    showPlaceForm, setShowPlaceForm, editingPlace, setEditingPlace,
    prefillCoords, setPrefillCoords, editingAssignmentId, setEditingAssignmentId,
    placeFormDayId, setPlaceFormDayId, reservationModalDayId, setReservationModalDayId,
    stopDraft, setStopDraft, saveStopDraft, saveStopDraftAsNight, stopDraftToForm, stopDraftDuplicate, reorderRoadtripStop,
    stayRelease, setStayRelease, confirmStayRelease,
    setRoadtripStopKind,
    setRoadtripStopFill,
    roadtripEndsDayAt,
    roadtripSettingsLoading: !roadtripPreferencesState.ready && !roadtripPreferencesState.failed,
    saveRoadtripLimit: roadtripPreferencesState.ready && can('day_edit', trip) ? saveRoadtripLimit : undefined,
    roadtripVias, addRoadtripVia, moveRoadtripVia, removeRoadtripVia, dayBoundaryControls, resetDayBoundaries,
    manualStopTargetFor, openManualRoadtripStop, serviceStopMode, setServiceStopForm,
    refuel, askRefuel, acceptRefuel,
    routeAlternatives, askRouteAlternatives, chooseRouteAlternative, alternativeOverlays, alternativeFocusPoints, mapFocusPoints, roadtripMapVias, focusRoadtripPoint,
    stayDraft, setStayDraft, editRoadtripStay, setRoadtripStay, roadtripEndDay, roadtripStay,
    // Addressed by stop rather than by selection: the phone's stage sheet knows which
    // stop it is showing, and going through the place selection there would open the
    // permanently mounted place inspector underneath it.
    setRoadtripEndDay, dailyTimesActive,
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
    openTransportEditor, changeTransitRoute,
    bookingDetail, openBookingDetail, openBookingFromDayList, closeBookingDetail, bookingDetailEditor, bookingDetailChangeRoute, showBookingOnMap, isBookingOnMap,
    reservationPrefill, transportPrefill, importReviewActive, startImportReview, advanceImportReview,
    receiptExpense, clearReceiptExpense: () => setReceiptExpense(null),
    mapLocked, toggleMapLocked,
    routeShown, setRouteShown, autoShowRoute, transitRoutesShown, routeProfile, setRouteProfile, routeVias, fitKey, setFitKey,
    mobileSidebarOpen, setMobileSidebarOpen, mobilePlanScrollTopRef, mobilePlacesScrollTopRef,
    deletePlaceId, setDeletePlaceId, deletePlaceIds, setDeletePlaceIds, deletePlaceNote, deletePlacesNote,
    isTourPlace, deletePlaceIsTour, deletePlacesIncludeTours,
    visibleConnections, roadtripConnections, toggleConnection, allConnectionsShown, toggleAllConnections, mapTransportDetail, setMapTransportDetail,
    isMobile, isTouch,
    expandedDayIds, setExpandedDayIds, mapPlaces,
    route, routeWalking, routeSegments, routeInfo, setRoute, setRouteInfo, updateRouteForDay,
    handleSelectDay, handlePlaceClick, handleMarkerClick, handleMapClick, handleMapContextMenu, openAddPlaceFromPoi, handlePoiClick,
    handleSavePlace, openPlaceEditor, handleDeletePlace, confirmDeletePlace, confirmDeletePlaces, confirmChangeCategory,
    handleDeleteTour,
    handleAssignToDay, handleMoveToDay, handleRemoveAssignment, handleReorder, handleReorderDays, handleAddDay, dayAdd, handleUpdateDayTitle,
    ...dayDelete,
    ...dayClear,
    handleSaveReservation, handleSaveTransport, handleDeleteReservation,
    selectedPlace, dayOrderMap, dayPlaces,
    mapTileUrl, fontStyle, splashDone,
  }
}
