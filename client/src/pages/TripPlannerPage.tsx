import React, { useState, Suspense } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate, useSearchParams } from 'react-router'
import { useTripStore } from '../store/tripStore'
import { useSettingsStore } from '../store/settingsStore'
import { MapViewAuto as MapView } from '../components/Map/MapViewAuto'
import type { CompassMap } from '../components/Map/MapCompassPill'
import { getCached, fetchPhoto } from '../services/photoService'
import DayPlanSidebar from '../components/Planner/DayPlanSidebar'
import LocationSelect from '../components/Planner/LocationSelect';
import RoadtripModeSwitch from '../components/Roadtrip/RoadtripModeSwitch'
import PlacesToursModeSwitch from '../components/Tours/PlacesToursModeSwitch'
import ToursSidebar from '../components/Tours/ToursSidebar'
import { tourPlannedTimes as projectTourPlannedTimes } from '../components/Tours/tourPresentation'
import TourDetailDialog from '../components/Tours/TourDetailDialog'
import TripLoadingSplash from '../components/shared/TripLoadingSplash'
import PlacesSidebar from '../components/Planner/PlacesSidebar'
import PlaceInspector from '../components/Planner/PlaceInspector'
import DayDetailPanel from '../components/Planner/DayDetailPanel'
import PlaceFormModal from '../components/Planner/PlaceFormModal'
import TripFormModal from '../components/Trips/TripFormModal'
import SlidingTabs from '../components/shared/SlidingTabs'
import TripMembersModal from '../components/Trips/TripMembersModal'
import { ReservationModal } from '../components/Planner/ReservationModal'
import TransitJourneyModal from '../components/Planner/TransitJourneyModal'
import { BookingDetailPopup } from '../components/Planner/bookings/BookingDetailHost'
import BookingImportModal from '../components/Planner/BookingImportModal'
import AirTrailImportModal from '../components/Planner/AirTrailImportModal'
// MemoriesPanel moved to Journey addon
import type { ExpensePrefill } from '../components/Budget/CostsPanel'
import { expenseEditorFor } from '../components/Budget/CostsPanel.helpers'
import type { BookingExpenseRequest } from '../components/Planner/BookingCostsSection.types'
import type { BudgetItem } from '../types'
import PluginFrame from '../components/Plugins/PluginFrame'
import ErrorBoundary from '../components/shared/ErrorBoundary'
import { getDayBookendHotels } from '../utils/dayOrder'
import TripWarningsBanner from '../components/Planner/TripWarningsBanner'
import Navbar from '../components/Layout/Navbar'
import HelpAnchor from '../components/Help/HelpAnchor'
import { getHelpContext } from '../help/registry'
import { useToast } from '../components/shared/Toast'
import { Map, X, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Ticket, Wallet, FolderOpen, Users, Train } from 'lucide-react'
import { addonsApi, accommodationsApi, authApi, tripsApi, assignmentsApi, mapsApi } from '../api/client'
import { accommodationRepo } from '../repo/accommodationRepo'
import { useAuthStore } from '../store/authStore'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import { Tooltip } from '../components/shared/Tooltip'
import { useTripWebSocket } from '../hooks/useTripWebSocket'
import { useRouteCalculation } from '../hooks/useRouteCalculation'
import { usePlaceSelection } from '../hooks/usePlaceSelection'
import { usePlannerHistory } from '../hooks/usePlannerHistory'
import type { Accommodation, TripMember, Day, Place, Reservation } from '../types'
import { useTripPlannerPage } from './tripPlanner/useTripPlannerPage'
import {
  ReservationsPanel, FileManager, CostsPanel, ExpenseModal, CollabPanel,
  RoadtripSidebar, RoadtripCorridorPanel, RoadtripLimitsCard, RoadtripStopPopup, RoadtripStayModal, RoadtripTrackModal,
  TourPlannerRail, TourPlannerToursRail, TransportModal,
} from './tripPlanner/plannerLazy'
import { LazyPanel } from './tripPlanner/LazyPanel'
import { ListsContainer } from './tripPlanner/ListsContainer'
import { PlanMapStage } from './tripPlanner/PlanMapStage'
import { useMergedMapPois } from '../components/Map/useMergedMapPois'
import { useTouchDragBridge } from '../hooks/useTouchDragBridge'
import PanelResizeHandle from '../components/Planner/PanelResizeHandle'

/** The tab ids are historical; the help screens carry the names the tabs show. */
const TRIP_TAB_HELP: Record<string, string> = {
  transports: 'transports', buchungen: 'bookings', listen: 'lists', finanzplan: 'costs', dateien: 'files', collab: 'collab', roadtrip: 'roadtrip',
}

export default function TripPlannerPage(): React.ReactElement | null {
  // ViewportRoute in App.tsx picks the branch now, so the phone screen is a
  // chunk of its own instead of a dead limb in this one.
  return <TripPlannerPageDesktop />
}

function TripPlannerPageDesktop(): React.ReactElement | null {
  // Page = wiring container: the entire planner state machine (store, tabs,
  // selection, CRUD handlers with undo, map filters, splash) lives in the hook.
  const pageState = useTripPlannerPage()
  const {
    tripId, navigate, toast, t, language, placesPhotosEnabled,
    trip, days, places, assignments, packingItems, todoItems, categories, reservations, budgetItems, files,
    selectedDayId, isLoading, tripActions, can, canUploadFiles,
    pushUndo, undo, canUndo, lastActionLabel, handleUndo,
    enabledAddons, collabFeatures, tripAccommodations, setTripAccommodations,
    roadtripMode, toggleRoadtripMode, roadtripActive, roadtripRoutes, roadtripLineColors, roadtripMapLines, roadtripMapPlaces, collapsedRoadtripDays, toggleRoadtripDay, roadtripCorridor,
    overviewActive, tripOverview, toggleOverview, overviewShown,
    dawarichEnabled, dawarichTrailShown, toggleDawarichTrail, dawarichTrail, dawarichHiddenDates,
    followTrack, roadtripViaCounts,
    allowedFileTypes, tripMembers, setTripMembers, refreshMembers, loadAccommodations,
    TRANSPORT_TYPES, TRIP_TABS, activeTab, setActiveTab, handleTabChange,
    leftWidth, rightWidth,
    leftHidden, rightHidden, toggleLeft, toggleRight,
    startResizeLeft, startResizeRight, nudgeLeft, nudgeRight, resizeMin, resizeMax,
    selectedPlaceId, selectedAssignmentId, setSelectedPlaceId, selectAssignment,
    showDayDetail, setShowDayDetail, dayDetailCollapsed, setDayDetailCollapsed,
    stayPickerDayId, setStayPickerDayId,
    showPlaceForm, setShowPlaceForm, editingPlace, setEditingPlace, setPlaceFormDayId,
    prefillCoords, setPrefillCoords, editingAssignmentId, setEditingAssignmentId,
    stopDraft, setStopDraft, saveStopDraft, saveStopDraftAsNight, stopDraftToForm, stopDraftDuplicate, reorderRoadtripStop,
    setRoadtripStopKind,
    setRoadtripStopFill,
    saveRoadtripLimit, roadtripSettingsLoading, storedAssignments,
    roadtripVias, addRoadtripVia, moveRoadtripVia, removeRoadtripVia, resetDayBoundaries,
    openManualRoadtripStop, serviceStopMode, setServiceStopForm,
    routeAlternatives, askRouteAlternatives, refuel, askRefuel, acceptRefuel, chooseRouteAlternative, alternativeOverlays, alternativeFocusPoints, mapFocusPoints, roadtripMapVias, focusRoadtripPoint, dayBoundaryControls,
    stayDraft, setStayDraft, editRoadtripStay, setRoadtripStay, roadtripEndDay, roadtripStay,
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
    reservationPrefill, transportPrefill, importReviewActive, advanceImportReview,
    receiptExpense, clearReceiptExpense,
    routeShown, setRouteShown, transitRoutesShown, routeProfile, setRouteProfile, routeVias, fitKey, setFitKey,
    mobileSidebarOpen, setMobileSidebarOpen, mobilePlanScrollTopRef, mobilePlacesScrollTopRef,
    deletePlaceId, setDeletePlaceId, deletePlaceIds, setDeletePlaceIds, deletePlaceNote, deletePlacesNote,
    deletePlaceIsTour, deletePlacesIncludeTours,
    stayRelease, setStayRelease, confirmStayRelease,
    visibleConnections, roadtripConnections, toggleConnection, allConnectionsShown, toggleAllConnections, mapTransportDetail, setMapTransportDetail,
    isMobile, isTouch,
    expandedDayIds, setExpandedDayIds, mapPlaces,
    mapLocked, toggleMapLocked,
    route, routeWalking, routeSegments, routeInfo, setRoute, setRouteInfo, updateRouteForDay,
    handleSelectDay, handlePlaceClick, handleMarkerClick, handleMapClick, handleMapContextMenu, handlePoiClick,
    handleSavePlace, openPlaceEditor, handleDeletePlace, confirmDeletePlace, confirmDeletePlaces, confirmChangeCategory,
    handleDeleteTour,
    handleAssignToDay, handleMoveToDay, handleRemoveAssignment, handleReorder, handleReorderDays, handleAddDay, dayAdd, handleUpdateDayTitle,
    deleteDayQuestion, handleDeleteDay,
    clearDayId, clearDayTitle, handleClearDay, cancelClearDay, confirmClearDay,
    handleSaveReservation, handleSaveTransport, handleDeleteReservation,
    selectedPlace, dayOrderMap, dayPlaces,
    toursEnabled, toursMode, setToursMode, tours, toursLoading, tourDataReady, tourPlaceIds,
    reloadTourPlaceIds, invalidateTourPlaceIds, selectedTour,
    mapTileUrl, fontStyle, splashDone,
  } = pageState.planner
  const {
    poi,
    tourPlanner,
    permissions: { canPlaceEdit, canDayEdit },
    tourDetails,
    tourMap,
    locationSearch,
  } = pageState
  const plannedTourDurations = new globalThis.Map(tours.map(tour => [tour.place_id, { ...projectTourPlannedTimes(tour), tour }] as const))
  // Tablets run this very layout but cannot start an HTML5 drag with a finger,
  // so a long press stands in for one (#1616). Only where the pointer is
  // coarse — a hybrid laptop loads drag-drop-touch instead.
  useTouchDragBridge(isTouch && !isMobile)

  // The place inspector's booking strip opens the editor the booking belongs to.
  // Handed over as undefined when the right is missing, so the strip stays a
  // read-only summary rather than a button that does nothing (#2012).
  const openLinkedTransport = can('day_edit', trip) ? (reservation: Reservation) => {
    setEditingTransport(reservation)
    setTransportModalDayId(reservation.day_id ?? null)
    setTransportModalAutomated(false)
    setShowTransportModal(true)
    setMobileSidebarOpen(null)
  } : undefined
  const openLinkedReservation = can('reservation_edit', trip) ? (reservation: Reservation) => {
    setEditingReservation(reservation)
    setShowReservationModal(true)
    setMobileSidebarOpen(null)
  } : undefined

  const [glMap, setGlMap] = useState<CompassMap | null>(null)
  // The corridor search draws into the same map channel and answers the same question for
  // a drive, so the explore pill stands down while road trip mode is on.
  // Also in road trip mode: searching the view is a different question from searching the
  // drive ("is there a hotel at tonight's stop" versus "what is along the way"), and the
  // two answers are drawn side by side rather than one hiding the other.
  const poiPillEnabled = useSettingsStore(s => s.settings.map_poi_pill_enabled) !== false
  // The refuel offers ride the same channel: in road trip mode this is the only way a
  // POI reaches the map, so without them somebody is asked to accept a stop they cannot
  // see. They vanish with the offer rather than lingering as a search result.
  const mapPois = useMergedMapPois(roadtripActive ? roadtripCorridor.visible : null, poi.pois, refuel.offered)

  // Costs expense editor opened from a booking modal (save-then-open). Lives at the
  // page level so it has tripMembers / base currency / current user available.
  const meId = useAuthStore(s => s.user?.id ?? -1)
  const displayCurrency = useSettingsStore(s => s.settings.default_currency)
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)
  const costsBase = (displayCurrency || trip?.currency || 'EUR').toUpperCase()
  // Transit search departs against a real date, so the whole Automated mode —
  // the day-header tram button and the modal's mode switch — is off without one.
  const tripHasDates = Boolean(trip?.start_date && trip?.end_date)
  const loadBudgetItems = useTripStore(s => s.loadBudgetItems)
  const [bookingExpense, setBookingExpense] = useState<{ editing: BudgetItem | null; prefill?: ExpensePrefill } | null>(null)
  const openBookingExpense = (req: BookingExpenseRequest) => {
    if (req.editItem) setBookingExpense({ editing: req.editItem })
    else if (req.prefill) setBookingExpense({ editing: null, prefill: req.prefill })
  }
  // One expense editor for both openers: a booking's Costs block, and a scanned
  // receipt sent here from the background tasks widget.
  const expenseEditor = expenseEditorFor(bookingExpense, () => setBookingExpense(null), receiptExpense, clearReceiptExpense)

  if (isLoading || !splashDone) {
    return (
      <div className="bg-surface" style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        ...fontStyle,
      }}>
        <TripLoadingSplash title={trip?.title} />
      </div>
    )
  }
  if (!trip) return null

  // What each panel actually occupies right now, and where that leaves the
  // strip of map between them. The panels float 10px inside the map, so the
  // corridor starts past that margin.
  const leftPanelPx = leftHidden ? 0 : leftWidth
  const rightPanelPx = rightHidden ? 0 : rightWidth
  const mapInsetLeft = leftPanelPx ? leftPanelPx + 10 : 0
  const mapInsetRight = rightPanelPx ? rightPanelPx + 10 : 0

  // The trip is a family of help screens: the frame, then one per tab, and on
  // the plan one per overlay that is open. A screen that has no help yet falls
  // back to the frame.
  const helpFor = (id: string) => (getHelpContext(id) ? id : 'trip')
  const helpId = activeTab === 'plan'
    ? helpFor(roadtripActive ? 'trip-roadtrip' : selectedPlace ? 'trip-place' : showDayDetail ? 'trip-day-detail' : 'trip')
    : helpFor(`trip-${TRIP_TAB_HELP[activeTab] ?? activeTab}`)

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', ...fontStyle }}>
      <HelpAnchor id={helpId} />
      <Navbar tripTitle={trip.title} tripId={tripId} showBack onBack={() => navigate('/dashboard')} onShare={() => setShowMembersModal(true)} />

      <div className="bg-surface-elevated border-b border-edge-faint" style={{
        position: 'fixed', top: 'var(--nav-h)', insetInline: 0, zIndex: 40,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 12px',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        height: 44,
      }}>
        <SlidingTabs
          tabs={TRIP_TABS.map(tab => ({
            id: tab.id,
            label: <span className="hidden sm:inline">{tab.shortLabel || tab.label}</span>,
            // The visible label is abbreviated on purpose; the full name goes to
            // assistive tech only, so nothing repeats itself under the cursor.
            ariaLabel: tab.label,
            icon: tab.icon,
          }))}
          activeTab={activeTab}
          onChange={handleTabChange}
        />
      </div>

      {/* Offset by navbar + tab bar (44px) */}
      <div style={{ position: 'fixed', top: 'calc(var(--nav-h) + 44px)', insetInline: 0, bottom: 0, overflow: 'hidden', overscrollBehavior: 'contain' }}>

        {/* Plugin validation/warning contributions (#1429) — navbar chips for
            plugins with a tab here, floating bottom overlay for the rest. */}
        <TripWarningsBanner tripId={tripId} onOpenPluginTab={(pid) => handleTabChange(`plugin:${pid}`)} />

        {activeTab === 'plan' && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <PlanMapStage
              tripId={tripId} trip={trip} can={can} days={days} reservations={reservations} isMobile={isMobile}
              selectedDayId={selectedDayId} selectedPlaceId={selectedPlaceId} selectedPlace={selectedPlace} showDayDetail={showDayDetail} handleSelectDay={handleSelectDay}
              mapPlaces={mapPlaces} dayPlaces={dayPlaces} dayOrderMap={dayOrderMap} mapTileUrl={mapTileUrl} fitKey={fitKey} mapLocked={mapLocked} toggleMapLocked={toggleMapLocked} mapFocusPoints={mapFocusPoints}
              route={route} routeWalking={routeWalking} routeSegments={routeSegments} routeVias={routeVias} transitRoutesShown={transitRoutesShown}
              handleMarkerClick={handleMarkerClick} handleMapClick={handleMapClick} handleMapContextMenu={handleMapContextMenu} handlePoiClick={handlePoiClick}
              visibleConnections={visibleConnections} setMapTransportDetail={setMapTransportDetail} openBookingDetail={openBookingDetail}
              roadtripActive={roadtripActive} roadtripMapPlaces={roadtripMapPlaces} roadtripMapLines={roadtripMapLines} roadtripLineColors={roadtripLineColors} roadtripMapVias={roadtripMapVias}
              roadtripRoutes={roadtripRoutes} roadtripConnections={roadtripConnections} roadtripVias={roadtripVias}
              dayBoundaryControls={dayBoundaryControls} dropPoiOnRoute={dropPoiOnRoute} addRoadtripVia={addRoadtripVia} moveRoadtripVia={moveRoadtripVia} removeRoadtripVia={removeRoadtripVia}
              routeAlternatives={routeAlternatives} alternativeOverlays={alternativeOverlays} highlightedAlternative={highlightedAlternative} chooseRouteAlternative={chooseRouteAlternative} setHighlightedAlternative={setHighlightedAlternative}
              overviewActive={overviewActive} tripOverview={tripOverview} overviewShown={overviewShown} toggleOverview={toggleOverview}
              dawarichEnabled={dawarichEnabled} dawarichTrail={dawarichTrail} dawarichHiddenDates={dawarichHiddenDates} dawarichTrailShown={dawarichTrailShown} toggleDawarichTrail={toggleDawarichTrail}
              mobileSidebarOpen={mobileSidebarOpen} showPlaceForm={showPlaceForm} showMembersModal={showMembersModal} showReservationModal={showReservationModal}
              poi={poi} tourMap={tourMap} leftPanelPx={leftPanelPx} rightPanelPx={rightPanelPx} mapInsetLeft={mapInsetLeft} mapInsetRight={mapInsetRight}
              glMap={glMap} setGlMap={setGlMap} poiPillEnabled={poiPillEnabled} mapPois={mapPois} distanceUnit={distanceUnit}
            />

            <div className="hidden md:block" style={{ position: 'absolute', left: 10, top: 10, bottom: 10, zIndex: 20 }}>
              {/* The panel's tab: a flap on its edge while open, a raised accent tile once it is tucked away. */}
              <Tooltip label={leftHidden ? t('trip.mobilePlan') : t('common.collapse')} placement="right">
                <button type="button" onClick={toggleLeft}
                  aria-label={leftHidden ? t('trip.mobilePlan') : t('common.collapse')}
                  className={leftHidden ? 'bg-accent text-accent-text shadow-md hover:opacity-90' : 'text-content-faint hover:text-content'}
                  style={{
                    position: leftHidden ? 'fixed' : 'absolute', top: leftHidden ? 'calc(var(--nav-h) + 44px + 14px)' : 14, left: leftHidden ? 10 : undefined, right: leftHidden ? undefined : -28, zIndex: -1,
                    width: 36, height: 36, borderRadius: leftHidden ? 10 : '0 10px 10px 0',
                    background: leftHidden ? undefined : 'var(--sidebar-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                    border: 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'color 0.15s',
                  }}>
                  {leftHidden ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                </button>
              </Tooltip>

              <div style={{
                width: leftHidden ? 0 : leftWidth, height: '100%',
                background: 'var(--sidebar-bg)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                boxShadow: leftHidden ? 'none' : 'var(--sidebar-shadow)',
                borderRadius: 16,
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                transition: 'width 0.25s ease',
                opacity: leftHidden ? 0 : 1,
              }}>
                {enabledAddons.roadtrip && (
                  <RoadtripModeSwitch active={roadtripMode} onChange={(v) => { if (v !== roadtripMode) toggleRoadtripMode() }} />
                )}
                {enabledAddons.roadtrip && roadtripMode ? (
                  <LazyPanel id="roadtrip-rail">
                    <RoadtripSidebar
                      routes={roadtripRoutes}
                      onFocusPoint={focusRoadtripPoint}
                      selectedAssignmentId={selectedAssignmentId}
                      onSelectStop={(placeId, assignmentId) => handlePlaceClick(placeId, assignmentId)}
                      reservations={reservations}
                      // A terminal, a ride pill or a booking chip shows the booking's detail,
                      // as the day plan does; its Edit opens the editor.
                      onOpenBooking={(rid) => {
                        const r = reservations.find(x => x.id === rid)
                        if (r) openBookingDetail(r)
                      }}
                      canEditBookings={can('reservation_edit', trip)}
                      onReorderStop={can('day_edit', trip) ? reorderRoadtripStop : undefined}
                      onMoveStopToDay={can('day_edit', trip) ? moveRoadtripStopToDay : undefined}
                      onAskAlternatives={can('day_edit', trip) ? askRouteAlternatives : undefined}
                      openAlternatives={routeAlternatives.open}
                      onEditStay={can('place_edit', trip) ? editRoadtripStay : undefined}
                      onSetStopKind={can('place_edit', trip) ? setRoadtripStopKind : undefined}
                      onSetStopFill={can('place_edit', trip) ? setRoadtripStopFill : undefined}
                      onFollowTrack={can('day_edit', trip) && followTrack.available ? followTrack.open : undefined}
                      viaCounts={roadtripViaCounts}
                      trackNames={followTrack.namesByDay}
                      refuel={refuel}
                      onAskRefuel={askRefuel}
                      onAcceptRefuel={can('day_edit', trip) ? acceptRefuel : undefined}
                      collapsedDayIds={collapsedRoadtripDays}
                      onToggleDay={toggleRoadtripDay}
                    />
                  </LazyPanel>
                ) : (
                <DayPlanSidebar
                  isMobile={isMobile}
                  tripId={tripId}
                  trip={trip}
                  days={days}
                  places={places}
                  tourPlaceIds={tourPlaceIds}
                  plannedTourDurations={plannedTourDurations}
                  categories={categories}
                  assignments={storedAssignments}
                  selectedDayId={selectedDayId}
                  selectedPlaceId={selectedPlaceId}
                  selectedAssignmentId={selectedAssignmentId}
                  onSelectDay={handleSelectDay}
                  onPlaceClick={handlePlaceClick}
                  onReorder={handleReorder}
                  onReorderDays={handleReorderDays}
                  onAddDay={handleAddDay}
                  dayAdd={dayAdd}
                  onDeleteDay={handleDeleteDay}
                  deleteDayQuestion={deleteDayQuestion}
                  onClearDay={can('day_edit', trip) ? handleClearDay : undefined}
                  onUpdateDayTitle={handleUpdateDayTitle}
                  onAssignToDay={handleAssignToDay}
                  onMoveToDay={handleMoveToDay}
                  onRouteCalculated={(r) => { if (r) { setRoute([r.coordinates]); setRouteInfo(r) } else { setRoute(null); setRouteInfo(null) } }}
                  reservations={reservations}
                  visibleConnectionIds={visibleConnections}
                  onToggleConnection={toggleConnection}
                  allConnectionsShown={allConnectionsShown}
                  onToggleAllConnections={toggleAllConnections}
                  externalTransportDetail={mapTransportDetail}
                  onExternalTransportDetailHandled={() => setMapTransportDetail(null)}
                  onAddReservation={(dayId) => { setEditingReservation(null); tripActions.setSelectedDay(dayId); setShowReservationModal(true) }}
                  onAddTransport={can('day_edit', trip) ? (dayId) => { setTransportModalDayId(dayId); setEditingTransport(null); setTransitPrefill(null); setTransportModalAutomated(false); setShowTransportModal(true) } : undefined}
                  onOpenTransit={(r) => setTransitJourney(r)}
                  onPlanTransit={can('day_edit', trip) && tripHasDates ? (dayId) => { setTransportModalDayId(dayId); setEditingTransport(null); setTransitPrefill(null); setTransportModalAutomated(true); setShowTransportModal(true) } : undefined}
                  onPlanTransitLeg={can('day_edit', trip) && tripHasDates ? ({ dayId, from, to, time }) => { setTransportModalDayId(dayId); setEditingTransport(null); setTransitPrefill({ from, to, time }); setTransportModalAutomated(true); setShowTransportModal(true) } : undefined}
                  onEditTransport={can('day_edit', trip) ? (reservation) => { setEditingTransport(reservation); setTransportModalDayId(reservation.day_id ?? null); setShowTransportModal(true) } : undefined}
                  onEditReservation={can('reservation_edit', trip) ? (r) => { setEditingReservation(r); setShowReservationModal(true) } : undefined}
                  // The narrow layout keeps what a booking row opened before.
                  onOpenBooking={isMobile ? undefined : openBookingFromDayList}
                  onDayDetail={(day) => { setShowDayDetail(day); setSelectedPlaceId(null); selectAssignment(null) }}
                  onAddAccommodation={can('day_edit', trip) ? (day) => { handleSelectDay(day.id); setShowDayDetail(day); setSelectedPlaceId(null); selectAssignment(null); setStayPickerDayId(day.id) } : undefined}
                  onRemoveAssignment={handleRemoveAssignment}
                  onEditPlace={(place, assignmentId) => {
                    // The day is cleared on the way in: the form assigns to whatever
                    // placeFormDayId still holds when it saves, so an edit opened
                    // after a day-scoped add would otherwise inherit that day.
                    setEditingPlace(place); setEditingAssignmentId(assignmentId || null)
                    setPlaceFormDayId(null); setShowPlaceForm(true)
                  }}
                  onDeletePlace={(placeId) => handleDeletePlace(placeId)}
                  accommodations={tripAccommodations}
                  routeShown={routeShown}
                  routeProfile={routeProfile}
                  onToggleRoute={() => setRouteShown(v => !v)}
                  onSetRouteProfile={setRouteProfile}
                  onNavigateToFiles={() => handleTabChange('dateien')}
                  onExpandedDaysChange={setExpandedDayIds}
                  pushUndo={pushUndo}
                  canUndo={canUndo}
                  lastActionLabel={lastActionLabel}
                  onUndo={handleUndo}
                  onRouteRefresh={() => { if (selectedDayId) updateRouteForDay(selectedDayId) }}
                  onAddBookingToAssignment={can('day_edit', trip) ? (dayId, assignmentId) => { tripActions.setSelectedDay(dayId); setBookingForAssignmentId(assignmentId); setEditingReservation(null); setShowReservationModal(true) } : undefined}
                  onCreatePlaceForDay={can('place_edit', trip) ? (dayId) => { setEditingPlace(null); setPlaceFormDayId(dayId); setShowPlaceForm(true) } : undefined}
                />
                )}
                {!leftHidden && (
                  <PanelResizeHandle side="left" width={leftWidth} min={resizeMin} max={resizeMax} onStart={startResizeLeft} onNudge={nudgeLeft} />
                )}
              </div>
            </div>

            <div className="hidden md:block" style={{ position: 'absolute', right: 10, top: 10, bottom: 10, zIndex: 20 }}>
              {/* The panel's tab: a flap on its edge while open, a raised accent tile once it is tucked away. */}
              <Tooltip label={rightHidden ? t('trip.mobilePlaces') : t('common.collapse')} placement="left">
                <button type="button" onClick={toggleRight}
                  aria-label={rightHidden ? t('trip.mobilePlaces') : t('common.collapse')}
                  className={rightHidden ? 'bg-accent text-accent-text shadow-md hover:opacity-90' : 'text-content-faint hover:text-content'}
                  style={{
                    position: rightHidden ? 'fixed' : 'absolute', top: rightHidden ? 'calc(var(--nav-h) + 44px + 14px)' : 14, right: rightHidden ? 10 : undefined, left: rightHidden ? undefined : -28, zIndex: -1,
                    width: 36, height: 36, borderRadius: rightHidden ? 10 : '10px 0 0 10px',
                    background: rightHidden ? undefined : 'var(--sidebar-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                    border: 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'color 0.15s',
                  }}>
                  {rightHidden ? <PanelRightOpen size={16} /> : <PanelRightClose size={16} />}
                </button>
              </Tooltip>

              <div style={{
                width: rightHidden ? 0 : rightWidth, height: '100%',
                background: 'var(--sidebar-bg)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                boxShadow: rightHidden ? 'none' : 'var(--sidebar-shadow)',
                borderRadius: 16,
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                transition: 'width 0.25s ease',
                opacity: rightHidden ? 0 : 1,
              }}>
                {!rightHidden && (
                  <PanelResizeHandle side="right" width={rightWidth} min={resizeMin} max={resizeMax} onStart={startResizeRight} onNudge={nudgeRight} />
                )}
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {roadtripActive ? (
                    <LazyPanel id="roadtrip-corridor">
                      {/* No Add button for someone who may not add: openAddPlaceFromPoi
                          returns silently without the permission, which reads as a broken
                          button rather than a missing one. */}
                      <RoadtripCorridorPanel
                        tripId={Number(tripId)} canImport={can('place_edit', trip) && can('day_edit', trip)}
                        corridor={roadtripCorridor}
                        routes={roadtripRoutes}
                        onAddPoi={can('place_edit', trip) ? handlePoiClick : undefined}
                        onAddManual={can('place_edit', trip) ? openManualRoadtripStop : undefined}
                        onFocusPoint={focusRoadtripPoint}
                      />
                      {/* Under the search, because the limits are read while looking at
                          what the drive is doing rather than set up front. */}
                      <div className="px-3.5 pb-3.5">
                        <RoadtripLimitsCard loading={roadtripSettingsLoading} onSave={saveRoadtripLimit} onResetDayBoundaries={resetDayBoundaries} />
                      </div>
                    </LazyPanel>
                  ) : (
                  <>
                    {/* Top level of the right add-panel, mirroring the always-visible
                        Days <-> Roadtrip switch on the left rail. Hidden entirely
                        when the tours addon is off. */}
                    {toursEnabled && (
                      <PlacesToursModeSwitch active={toursMode} onChange={setToursMode} />
                    )}
                    {toursEnabled && toursMode ? (
                      <ToursSidebar tripId={tripId} days={days} tours={tours} loading={toursLoading} selectedPlaceId={selectedPlaceId} canEdit={canPlaceEdit} canAssign={canDayEdit} onAssignToDay={handleAssignToDay} onToursChanged={placeIds => invalidateTourPlaceIds(placeIds ? { placeIds } : undefined)} onSelectTour={tourDetails.onSelectTour} />
                    ) : (
                    <PlacesSidebar
                      tripId={tripId}
                      places={places}
                      toursEnabled={toursEnabled}
                      excludePlaceIds={toursEnabled ? tourPlaceIds : undefined}
                      categories={categories}
                      assignments={assignments}
                      accommodations={tripAccommodations}
                      selectedDayId={selectedDayId}
                      onClearSelectedDay={() => handleSelectDay(null)}
                      selectedPlaceId={selectedPlaceId}
                      onPlaceClick={handlePlaceClick}
                      onAddPlace={() => { setEditingPlace(null); setPlaceFormDayId(null); setShowPlaceForm(true) }}
                      onAddPlaceToSelectedDay={selectedDayId != null ? () => { setEditingPlace(null); setPlaceFormDayId(selectedDayId); setShowPlaceForm(true) } : undefined}
                      onAssignToDay={handleAssignToDay}
                      onEditPlace={(place) => openPlaceEditor(place)}
                      onDeletePlace={(placeId) => handleDeletePlace(placeId)}
                      onBulkDeletePlaces={(ids) => setDeletePlaceIds(ids)}
                      onBulkChangeCategory={(ids, catId) => confirmChangeCategory(ids, catId)}
                      pushUndo={pushUndo}
                      days={days}
                      isMobile={false}
                    />
                    )}
                  </>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile sidebar buttons — portal to body to escape Leaflet touch handling */}
            {activeTab === 'plan' && !mobileSidebarOpen && !showPlaceForm && !showMembersModal && !showReservationModal && createPortal(
              <div className="flex md:hidden" style={{ position: 'fixed', top: 'calc(var(--nav-h) + 44px + 12px)', insetInline: 12, justifyContent: 'space-between', zIndex: 100, pointerEvents: 'none' }}>
                <button type="button" onClick={() => setMobileSidebarOpen('left')}
                  className="bg-surface-card text-content border border-edge"
                  style={{ pointerEvents: 'auto', backdropFilter: 'blur(12px)', borderRadius: 24, padding: '11px 24px', fontSize: 'calc(15px * var(--fs-scale-subtitle, 1))', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.15)', minHeight: 44, fontFamily: 'inherit', touchAction: 'manipulation' }}>
                  {t('trip.mobilePlan')}
                </button>
                <button type="button" onClick={() => setMobileSidebarOpen('right')}
                  className="bg-surface-card text-content border border-edge"
                  style={{ pointerEvents: 'auto', backdropFilter: 'blur(12px)', borderRadius: 24, padding: '11px 24px', fontSize: 'calc(15px * var(--fs-scale-subtitle, 1))', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.15)', minHeight: 44, fontFamily: 'inherit', touchAction: 'manipulation' }}>
                  {t('trip.mobilePlaces')}
                </button>
              </div>,
              document.body
            )}

            {showDayDetail && !selectedPlace && (() => {
              const currentDay = days.find(d => d.id === showDayDetail.id) || showDayDetail
              const dayAssignments = assignments[String(currentDay.id)] || []
              // Day-local weather anchor only (#2167): first located stop of THIS day,
              // else the hotel you wake up in (unconditional bookend lookup, mirroring
              // useMPlanTimeline) — never a place from another day.
              const locatedPlace = dayAssignments.find(a => a.place?.lat && a.place?.lng)?.place
              const weatherHotel = locatedPlace ? undefined : getDayBookendHotels(currentDay, days, tripAccommodations).morning
              const weatherLat = locatedPlace?.lat ?? weatherHotel?.place_lat ?? null
              const weatherLng = locatedPlace?.lng ?? weatherHotel?.place_lng ?? null
              const weatherPlaceName = locatedPlace?.name ?? weatherHotel?.place_name ?? null
              return (
                <DayDetailPanel
                  day={currentDay}
                  days={days}
                  places={places}
                  categories={categories}
                  tripId={tripId}
                  assignments={assignments}
                  reservations={reservations}
                  lat={weatherLat}
                  lng={weatherLng}
                  weatherPlaceName={weatherPlaceName}
                  onClose={() => { setShowDayDetail(null); handleSelectDay(null) }}
                  onAccommodationChange={loadAccommodations}
                  leftWidth={isMobile ? 0 : leftPanelPx}
                  rightWidth={isMobile ? 0 : rightPanelPx}
                  collapsed={dayDetailCollapsed}
                  onToggleCollapse={() => setDayDetailCollapsed(c => !c)}
                  mobile={isMobile}
                  onUpdateDayTitle={handleUpdateDayTitle}
                  openStayPicker={stayPickerDayId === currentDay.id}
                  onStayPickerOpened={() => setStayPickerDayId(null)}
                  onOpenBooking={isMobile ? undefined : openBookingDetail}
                />
              )
            })()}

            {selectedPlace && (!toursEnabled || tourDataReady) && !selectedTour && !isMobile && (
              <PlaceInspector
                roadtripEndDay={roadtripEndDay}
                roadtripStay={roadtripStay} roadtripActive={roadtripActive}
                onEditTransport={openLinkedTransport}
                onEditReservation={openLinkedReservation}
                onOpenBooking={openBookingDetail}
                place={selectedPlace}
                categories={categories}
                days={days}
                selectedDayId={selectedDayId}
                selectedAssignmentId={selectedAssignmentId}
                assignments={assignments}
                reservations={reservations}
                onClose={() => setSelectedPlaceId(null)}
                onEdit={() => openPlaceEditor(selectedPlace, selectedAssignmentId)}
                onDelete={() => handleDeletePlace(selectedPlace.id)}
                onAssignToDay={handleAssignToDay}
                onRemoveAssignment={handleRemoveAssignment}
                files={files}
                onFileUpload={canUploadFiles ? (fd) => tripActions.addFile(tripId, fd) : undefined}
                tripMembers={tripMembers}
                onSetParticipants={async (assignmentId, dayId, userIds) => {
                  try {
                    const data = await assignmentsApi.setParticipants(tripId, assignmentId, userIds)
                    useTripStore.setState(state => ({
                      assignments: {
                        ...state.assignments,
                        [String(dayId)]: (state.assignments[String(dayId)] || []).map(a =>
                          a.id === assignmentId ? { ...a, participants: data.participants } : a
                        ),
                      }
                    }))
                  } catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.unknownError')) }
                }}
                onUpdatePlace={async (placeId, data) => { try { await tripActions.updatePlace(tripId, placeId, data) } catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.unknownError')) } }}
                onUploadImage={async (placeId, file) => { await tripActions.uploadPlaceImage(tripId, placeId, file) }}
                onImageFromFile={async (placeId, fileId) => { await tripActions.setPlaceImageFromFile(tripId, placeId, fileId) }}
                onRate={async (placeId, rating) => { try { await tripActions.ratePlace(tripId, placeId, rating) } catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.unknownError')) } }}
                leftWidth={isMobile ? 0 : leftPanelPx}
                rightWidth={isMobile ? 0 : rightPanelPx}
              />
            )}

            {selectedPlace && (!toursEnabled || tourDataReady) && !selectedTour && isMobile && createPortal(
              <div className="bg-[rgba(0,0,0,0.3)]" style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 'var(--bottom-nav-h)' }} role="presentation" onClick={() => setSelectedPlaceId(null)}>
                <div style={{ width: '100%', maxHeight: '85vh' }} role="presentation" onClick={e => e.stopPropagation()}>
                  <PlaceInspector
                    roadtripEndDay={roadtripEndDay}
                    roadtripStay={roadtripStay} roadtripActive={roadtripActive}
                    onEditTransport={openLinkedTransport}
                    onEditReservation={openLinkedReservation}
                    place={selectedPlace}
                    categories={categories}
                    days={days}
                    selectedDayId={selectedDayId}
                    selectedAssignmentId={selectedAssignmentId}
                    assignments={assignments}
                    reservations={reservations}
                    onClose={() => setSelectedPlaceId(null)}
                    onEdit={() => { openPlaceEditor(selectedPlace, selectedAssignmentId); setSelectedPlaceId(null) }}
                    onDelete={() => { handleDeletePlace(selectedPlace.id); setSelectedPlaceId(null) }}
                    onAssignToDay={handleAssignToDay}
                    onRemoveAssignment={handleRemoveAssignment}
                    files={files}
                    onFileUpload={canUploadFiles ? (fd) => tripActions.addFile(tripId, fd) : undefined}
                    tripMembers={tripMembers}
                    onSetParticipants={async (assignmentId, dayId, userIds) => {
                      try {
                        const data = await assignmentsApi.setParticipants(tripId, assignmentId, userIds)
                        useTripStore.setState(state => ({
                          assignments: {
                            ...state.assignments,
                            [String(dayId)]: (state.assignments[String(dayId)] || []).map(a =>
                              a.id === assignmentId ? { ...a, participants: data.participants } : a
                            ),
                          }
                        }))
                      } catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.unknownError')) }
                    }}
                    onUpdatePlace={async (placeId, data) => { try { await tripActions.updatePlace(tripId, placeId, data) } catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.unknownError')) } }}
                    onUploadImage={async (placeId, file) => { await tripActions.uploadPlaceImage(tripId, placeId, file) }}
                onImageFromFile={async (placeId, fileId) => { await tripActions.setPlaceImageFromFile(tripId, placeId, fileId) }}
                    onRate={async (placeId, rating) => { try { await tripActions.ratePlace(tripId, placeId, rating) } catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.unknownError')) } }}
                    leftWidth={0}
                    rightWidth={0}
                  />
                </div>
              </div>,
              document.body
            )}

            {selectedTour && selectedPlace && !isMobile && (
              <TourDetailDialog
                tour={selectedTour}
                desktopNonModal
                desktopFocusReturnTarget={tourDetails.openerRef.current?.placeId === selectedTour.place_id ? tourDetails.openerRef.current.element : null}
                canEdit={canPlaceEdit}
                canAssign={canDayEdit}
                place={selectedPlace}
                days={days}
                selectedDayId={selectedDayId}
                selectedAssignmentId={selectedAssignmentId}
                assignments={assignments}
                files={files}
                onClose={() => setSelectedPlaceId(null)}
                onUpdatePlace={async (placeId, data) => { await tripActions.updatePlace(tripId, placeId, data); await reloadTourPlaceIds() }}
                onFileUpload={canUploadFiles ? (formData) => tripActions.addFile(tripId, formData) : undefined}
                onAssignToDay={handleAssignToDay}
                onRemoveAssignment={handleRemoveAssignment}
                leftWidth={leftPanelPx}
                rightWidth={rightPanelPx}
              />
            )}

            {selectedTour && selectedPlace && isMobile && createPortal(
              <div className="bg-[rgba(0,0,0,0.3)]" style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 'var(--bottom-nav-h)' }} role="presentation" onClick={() => setSelectedPlaceId(null)}>
                <div style={{ width: '100%', maxHeight: '85vh' }} role="presentation" onClick={event => event.stopPropagation()}>
                  <TourDetailDialog
                    tour={selectedTour}
                    canEdit={canPlaceEdit}
                    canAssign={canDayEdit}
                    place={selectedPlace}
                    days={days}
                    selectedDayId={selectedDayId}
                    selectedAssignmentId={selectedAssignmentId}
                    assignments={assignments}
                    files={files}
                    onClose={() => setSelectedPlaceId(null)}
                    onUpdatePlace={async (placeId, data) => { await tripActions.updatePlace(tripId, placeId, data); await reloadTourPlaceIds() }}
                    onFileUpload={canUploadFiles ? (formData) => tripActions.addFile(tripId, formData) : undefined}
                    onAssignToDay={handleAssignToDay}
                    onRemoveAssignment={handleRemoveAssignment}
                  />
                </div>
              </div>,
              document.body
            )}

            {mobileSidebarOpen && createPortal(
              <div className="bg-[rgba(0,0,0,0.3)]" style={{ position: 'fixed', inset: 0, zIndex: 9999 }} role="presentation" onClick={() => setMobileSidebarOpen(null)}>
                <div className="bg-surface-card" style={{ position: 'absolute', top: 'var(--nav-h)', insetInline: 0, bottom: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} role="presentation" onClick={e => e.stopPropagation()}>
                  <div className="border-b border-edge-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
                    <span className="text-content" style={{ fontWeight: 600, fontSize: 'calc(14px * var(--fs-scale-body, 1))' }}>{mobileSidebarOpen === 'left' ? t('trip.mobilePlan') : t('trip.mobilePlaces')}</span>
                    <button type="button" onClick={() => setMobileSidebarOpen(null)} className="bg-surface-tertiary text-content" style={{ border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={14} />
                    </button>
                  </div>
                  <div style={{ flex: 1, overflow: 'auto', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                    {mobileSidebarOpen === 'left'
                                            ? <DayPlanSidebar tripId={tripId} trip={trip} days={days} places={places} tourPlaceIds={tourPlaceIds} plannedTourDurations={plannedTourDurations} categories={categories} assignments={storedAssignments} selectedDayId={selectedDayId} selectedPlaceId={selectedPlaceId} selectedAssignmentId={selectedAssignmentId} onSelectDay={(id) => { handleSelectDay(id); setMobileSidebarOpen(null) }} onPlaceClick={(placeId, assignmentId) => { handlePlaceClick(placeId, assignmentId) }} onReorder={handleReorder} onReorderDays={handleReorderDays} onAddDay={handleAddDay} dayAdd={dayAdd} onDeleteDay={handleDeleteDay} deleteDayQuestion={deleteDayQuestion} onClearDay={can('day_edit', trip) ? handleClearDay : undefined} onUpdateDayTitle={handleUpdateDayTitle} onAssignToDay={handleAssignToDay} onMoveToDay={handleMoveToDay} onRouteCalculated={(r) => { if (r) { setRoute([r.coordinates]); setRouteInfo(r) } else { setRoute(null); setRouteInfo(null) } }} reservations={reservations} visibleConnectionIds={visibleConnections} onToggleConnection={toggleConnection} allConnectionsShown={allConnectionsShown} onToggleAllConnections={toggleAllConnections} onAddReservation={(dayId) => { setEditingReservation(null); tripActions.setSelectedDay(dayId); setShowReservationModal(true); setMobileSidebarOpen(null) }} onAddTransport={can('day_edit', trip) ? (dayId) => { setTransportModalDayId(dayId); setEditingTransport(null); setTransitPrefill(null); setTransportModalAutomated(false); setShowTransportModal(true); setMobileSidebarOpen(null) } : undefined} onOpenTransit={(r) => { setTransitJourney(r); setMobileSidebarOpen(null) }} onPlanTransit={can('day_edit', trip) && tripHasDates ? (dayId) => { setTransportModalDayId(dayId); setEditingTransport(null); setTransitPrefill(null); setTransportModalAutomated(true); setShowTransportModal(true); setMobileSidebarOpen(null) } : undefined} onPlanTransitLeg={can('day_edit', trip) && tripHasDates ? ({ dayId, from, to, time }) => { setTransportModalDayId(dayId); setEditingTransport(null); setTransitPrefill({ from, to, time }); setTransportModalAutomated(true); setShowTransportModal(true); setMobileSidebarOpen(null) } : undefined} onAddPlace={() => { setEditingPlace(null); setPlaceFormDayId(null); setShowPlaceForm(true); setMobileSidebarOpen(null) }} onCreatePlaceForDay={can('place_edit', trip) ? (dayId) => { setEditingPlace(null); setPlaceFormDayId(dayId); setShowPlaceForm(true); setMobileSidebarOpen(null) } : undefined} onDayDetail={(day) => { setShowDayDetail(day); setSelectedPlaceId(null); selectAssignment(null) }} onRemoveAssignment={handleRemoveAssignment} onEditPlace={(place, assignmentId) => { setEditingPlace(place); setEditingAssignmentId(assignmentId || null); setPlaceFormDayId(null); setShowPlaceForm(true); setMobileSidebarOpen(null) }} onDeletePlace={(placeId) => handleDeletePlace(placeId)} accommodations={tripAccommodations} routeShown={routeShown} routeProfile={routeProfile} onToggleRoute={() => setRouteShown(v => !v)} onSetRouteProfile={setRouteProfile} onNavigateToFiles={() => { setMobileSidebarOpen(null); handleTabChange('dateien') }} onExpandedDaysChange={setExpandedDayIds} pushUndo={pushUndo} canUndo={canUndo} lastActionLabel={lastActionLabel} onUndo={handleUndo} onEditTransport={can('day_edit', trip) ? (reservation) => { setEditingTransport(reservation); setTransportModalDayId(reservation.day_id ?? null); setShowTransportModal(true); setMobileSidebarOpen(null) } : undefined} onEditReservation={can('reservation_edit', trip) ? (r) => { setEditingReservation(r); setShowReservationModal(true); setMobileSidebarOpen(null) } : undefined} initialScrollTop={mobilePlanScrollTopRef.current} onScrollTopChange={(top) => { mobilePlanScrollTopRef.current = top }} showRouteToolsWhenExpanded isMobile />
                      : <PlacesSidebar tripId={tripId} places={places} toursEnabled={toursEnabled} excludePlaceIds={toursEnabled ? tourPlaceIds : undefined} categories={categories} assignments={assignments} accommodations={tripAccommodations} selectedDayId={selectedDayId} onClearSelectedDay={() => handleSelectDay(null)} selectedPlaceId={selectedPlaceId} onPlaceClick={(placeId) => { handlePlaceClick(placeId); setMobileSidebarOpen(null) }} onAddPlace={() => { setEditingPlace(null); setPlaceFormDayId(null); setShowPlaceForm(true); setMobileSidebarOpen(null) }} onAssignToDay={handleAssignToDay} onEditPlace={(place) => { openPlaceEditor(place); setMobileSidebarOpen(null) }} onDeletePlace={(placeId) => handleDeletePlace(placeId)} onBulkDeletePlaces={(ids) => setDeletePlaceIds(ids)} onBulkDeleteConfirm={(ids) => confirmDeletePlaces(ids)} onBulkChangeCategory={(ids, catId) => confirmChangeCategory(ids, catId)} days={days} isMobile pushUndo={pushUndo} initialScrollTop={mobilePlacesScrollTopRef.current} onScrollTopChange={(top) => { mobilePlacesScrollTopRef.current = top }} />
                    }
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>
        )}

        {activeTab === 'tour-planner' && enabledAddons.tours && !isMobile && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <MapView
              tripId={tripId}
              places={[]}
              route={tourMap.route}
              followSelection={false}
              onMapClick={canPlaceEdit && !tourPlanner.isSaving && (tourPlanner.mode.type === 'new-draft' || tourPlanner.mode.type === 'edit-saved')
                ? ({ latlng }: { latlng: { lat: number; lng: number } }) => tourPlanner.addWaypoint(latlng.lat, latlng.lng)
                : undefined}
              tileUrl={mapTileUrl}
              leftWidth={leftPanelPx}
              rightWidth={rightPanelPx}
              focusPoints={tourMap.focusPoints}
              focusKey={tourMap.focusKey}
              plannerWaypoints={tourPlanner.mode.type === 'new-draft' || tourPlanner.mode.type === 'edit-saved' ? tourPlanner.waypoints : []}
              selectedPlannerWaypointId={tourPlanner.mode.type === 'new-draft' || tourPlanner.mode.type === 'edit-saved' ? tourPlanner.selectedWaypointId : null}
              onPlannerWaypointClick={tourPlanner.setSelectedWaypointId}
              onPlannerWaypointMove={canPlaceEdit && !tourPlanner.isSaving && (tourPlanner.mode.type === 'new-draft' || tourPlanner.mode.type === 'edit-saved')
                ? tourPlanner.setWaypointPosition
                : undefined}
              routeProfileFocus={tourPlanner.routeProfileFocus}
              viewBaseLayer={tourPlanner.mapBaseLayer}
              onViewBaseLayerChange={tourPlanner.setMapBaseLayer}
            />
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: `calc(50% + ${((leftHidden ? 56 : leftPanelPx) - (rightHidden ? 56 : rightPanelPx)) / 2}px)`,
                transform: 'translateX(-50%)',
                width: `min(360px, calc(100vw - ${(leftHidden ? 56 : leftPanelPx) + (rightHidden ? 56 : rightPanelPx) + 32}px))`,
                zIndex: 19,
              }}
            >
              <LocationSelect
                value={locationSearch.value}
                onChange={locationSearch.onChange}
                placeholder={t('reservations.searchLocation')}
                ariaLabel={t('reservations.searchLocation')}
                showSearchStatus
                style={{ width: '100%' }}
              />
            </div>
            <div className="hidden md:block" style={{ position: 'absolute', left: 10, top: 10, bottom: 10, zIndex: 20 }}>
              <Tooltip label={leftHidden ? t('trip.mobilePlan') : t('common.collapse')} placement="right">
                <button type="button" onClick={toggleLeft}
                  aria-label={leftHidden ? t('trip.mobilePlan') : t('common.collapse')}
                  aria-expanded={!leftHidden}
                  className={`${leftHidden ? 'bg-accent text-accent-text shadow-md hover:opacity-90' : 'text-content-faint hover:text-content'} focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent`}
                  style={{
                    position: leftHidden ? 'fixed' : 'absolute', top: leftHidden ? 'calc(var(--nav-h) + 44px + 14px)' : 14,
                    left: leftHidden ? 10 : undefined, right: leftHidden ? undefined : -28, zIndex: -1,
                    width: 36, height: 36, borderRadius: leftHidden ? 10 : '0 10px 10px 0',
                    background: leftHidden ? undefined : 'var(--sidebar-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s',
                  }}>
                  {leftHidden ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                </button>
              </Tooltip>
              <div style={{
                width: leftHidden ? 0 : leftPanelPx, height: '100%', position: 'relative',
                background: 'var(--sidebar-bg)', backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)', boxShadow: leftHidden ? 'none' : 'var(--sidebar-shadow)',
                borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                transition: 'width 0.25s ease', opacity: leftHidden ? 0 : 1,
              }}>
                {!leftHidden && <PanelResizeHandle side="left" width={leftWidth} min={resizeMin} max={resizeMax} onStart={startResizeLeft} onNudge={nudgeLeft} />}
                <LazyPanel id="tour-planner-rail"><TourPlannerRail planner={tourPlanner} canEdit={canPlaceEdit} canAssign={canDayEdit} /></LazyPanel>
              </div>
            </div>
            <div className="absolute bottom-[10px] right-[10px] top-[10px] z-20 hidden md:block">
              <Tooltip label={rightHidden ? t('tours.planner.tripTours') : t('common.collapse')} placement="left">
                <button type="button" onClick={toggleRight}
                  aria-label={rightHidden ? t('tours.planner.tripTours') : t('common.collapse')}
                  aria-expanded={!rightHidden}
                  className={`absolute flex h-9 w-9 items-center justify-center border-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${rightHidden ? 'right-0 top-1 rounded-xl bg-accent text-accent-text shadow-md hover:opacity-90' : '-left-7 top-3.5 rounded-l-xl text-content-faint hover:text-content'}`}
                  style={{ zIndex: -1, background: rightHidden ? undefined : 'var(--sidebar-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
                  {rightHidden ? <PanelRightOpen size={16} /> : <PanelRightClose size={16} />}
                </button>
              </Tooltip>
              <div
                className="h-full overflow-hidden rounded-2xl"
                style={{
                  width: rightHidden ? 0 : rightWidth,
                  opacity: rightHidden ? 0 : 1,
                  transition: 'width 0.25s ease, opacity 0.25s ease',
                  background: 'var(--sidebar-bg)',
                  backdropFilter: 'blur(24px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                  boxShadow: rightHidden ? 'none' : 'var(--sidebar-shadow)',
                }}
              >
                {!rightHidden && (
                  <PanelResizeHandle side="right" width={rightWidth} min={resizeMin} max={resizeMax} onStart={startResizeRight} onNudge={nudgeRight} />
                )}
                {!rightHidden && (
                  <LazyPanel id="tour-planner-tours">
                    <TourPlannerToursRail
                      planner={tourPlanner}
                      canEdit={canPlaceEdit}
                      canAssign={canDayEdit}
                      tours={tours}
                      days={days}
                      loading={toursLoading}
                      onAssignToDay={(placeId, dayId) => handleAssignToDay(placeId, dayId)}
                      onDeleteTour={handleDeleteTour}
                      onViewGpxTour={tour => {
                        const place = places.find(item => item.id === tour.place_id)
                        tourPlanner.viewGpxTour(tour, place?.route_geometry ?? null)
                      }}
                    />
                  </LazyPanel>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transports' && (
          <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto', overscrollBehavior: 'contain', paddingBottom: 'var(--bottom-nav-h)' }}>
            <LazyPanel id="transports">
              <ReservationsPanel
                tripId={tripId}
                reservations={reservations.filter(r => TRANSPORT_TYPES.has(r.type))}
                days={days}
                assignments={assignments}
                files={files}
                onAdd={() => { setEditingTransport(null); setTransitPrefill(null); setTransportModalAutomated(false); setShowTransportModal(true) }}
                onImport={() => { setBookingImportKind('transports'); setShowBookingImport(true) }}
                bookingImportAvailable={bookingImportAvailable}
                onAirTrailImport={() => setShowAirTrailImport(true)}
                airTrailAvailable={airTrailAvailable}
                onEdit={openTransportEditor}
                // The same right as on the plan: day_edit, as the journey view asked for.
                onChangeRoute={bookingDetailChangeRoute}
                onDelete={handleDeleteReservation}
                onNavigateToFiles={() => handleTabChange('dateien')}
                titleKey="transport.title"
                addManualKey="transport.addManual"
                contributionView="transports"
                tripMembers={tripMembers}
                contextReservations={reservations.filter(r => !TRANSPORT_TYPES.has(r.type))}
                onEditExpense={(item) => openBookingExpense({ editItem: item })}
                onShowOnMap={showBookingOnMap}
                isOnMap={isBookingOnMap}
              />
            </LazyPanel>
          </div>
        )}

        {activeTab === 'buchungen' && (
          <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto', overscrollBehavior: 'contain', paddingBottom: 'var(--bottom-nav-h)' }}>
            <LazyPanel id="buchungen">
              <ReservationsPanel
                tripId={tripId}
                reservations={reservations.filter(r => !TRANSPORT_TYPES.has(r.type))}
                days={days}
                assignments={assignments}
                files={files}
                onAdd={() => { setEditingReservation(null); setShowReservationModal(true) }}
                onImport={() => { setBookingImportKind('bookings'); setShowBookingImport(true) }}
                bookingImportAvailable={bookingImportAvailable}
                onEdit={(r) => { setEditingReservation(r); setShowReservationModal(true) }}
                onDelete={handleDeleteReservation}
                onNavigateToFiles={() => handleTabChange('dateien')}
                tripMembers={tripMembers}
                contextReservations={reservations.filter(r => TRANSPORT_TYPES.has(r.type))}
                onEditExpense={(item) => openBookingExpense({ editItem: item })}
                onShowOnMap={showBookingOnMap}
                isOnMap={isBookingOnMap}
              />
            </LazyPanel>
          </div>
        )}

        {activeTab === 'listen' && (
          <div style={{ height: '100%', overflowY: 'auto', overscrollBehavior: 'contain', width: '100%', paddingBottom: 'var(--bottom-nav-h)' }}>
            <ListsContainer tripId={tripId} packingItems={packingItems} todoItems={todoItems} />
          </div>
        )}

        {activeTab === 'finanzplan' && (
          <div style={{ height: '100%', overflowY: 'auto', overscrollBehavior: 'contain', width: '100%', paddingBottom: 'var(--bottom-nav-h)' }}>
            <LazyPanel id="finanzplan">
              <CostsPanel tripId={tripId} tripMembers={tripMembers} />
            </LazyPanel>
          </div>
        )}

        {activeTab === 'dateien' && (
          <div style={{ height: '100%', overflow: 'hidden', overscrollBehavior: 'contain', paddingBottom: 'var(--bottom-nav-h)' }}>
            <LazyPanel id="dateien">
              <FileManager
                files={files || []}
                onUpload={(fd) => tripActions.addFile(tripId, fd)}
                onDelete={(id) => tripActions.deleteFile(tripId, id)}
                onUpdate={() => tripActions.loadFiles(tripId)}
                places={places}
                days={days}
                assignments={assignments}
                reservations={reservations}
                tripId={tripId}
                allowedFileTypes={allowedFileTypes}
              />
            </LazyPanel>
          </div>
        )}

        {activeTab === 'collab' && (
          <div style={{ position: 'absolute', top: 0, insetInline: 0, bottom: 'var(--bottom-nav-h)', overflow: 'hidden' }}>
            <LazyPanel id="collab">
              <CollabPanel tripId={tripId} tripMembers={tripMembers} collabFeatures={collabFeatures} />
            </LazyPanel>
          </div>
        )}


        {activeTab.startsWith('plugin:') && (
          <div style={{ position: 'absolute', top: 0, insetInline: 0, bottom: 'var(--bottom-nav-h)', overflow: 'hidden' }}>
            <PluginFrame pluginId={activeTab.slice('plugin:'.length)} tripId={String(tripId)} fill surface="trip-tab" className="w-full h-full" />
          </div>
        )}
      </div>

      {/* The small way in for something found along the drive. Mounted only while a
          draft exists, so the chunk stays unloaded for anyone not using road trip mode. */}
      {/* How long a stop takes. Its own gate, not the corridor draft's: a stay is set on
          any stop of the trip, not only on something just found along the route. */}
      {/* Which track a day drives along. Mounted only while it is open, so the chunk and
          the parsing of every imported line stay out of an ordinary planner session. */}
      {followTrack.dayId !== null && (
        <LazyPanel id="roadtrip-track" overlay>
          <RoadtripTrackModal
            follow={followTrack}
            dayNumber={roadtripRoutes.days.find(d => d.dayId === followTrack.dayId)?.dayNumber ?? 0}
          />
        </LazyPanel>
      )}
      {stayDraft && (
        <LazyPanel id="roadtrip-stay" overlay>
          <RoadtripStayModal stop={stayDraft} onClose={() => setStayDraft(null)} onSave={setRoadtripStay} />
        </LazyPanel>
      )}
      {stopDraft && (
        <LazyPanel id="roadtrip-stop" overlay>
          <RoadtripStopPopup
            draft={stopDraft}
            duplicateName={stopDraftDuplicate}
            onClose={() => setStopDraft(null)}
            onSave={saveStopDraft}
            onSaveNight={saveStopDraftAsNight}
            onMoreDetails={stopDraftToForm}
          />
        </LazyPanel>
      )}
      <PlaceFormModal isOpen={showPlaceForm} onClose={() => { setShowPlaceForm(false); setEditingPlace(null); setEditingAssignmentId(null); setPrefillCoords(null); setServiceStopForm(false) }} onSave={handleSavePlace} place={editingPlace} prefillCoords={prefillCoords} assignmentId={editingAssignmentId} dayAssignments={editingPlace ? Object.values(assignments).flat() : []} tripId={tripId} categories={categories} onCategoryCreated={cat => tripActions.addCategory?.(cat)} isMobile={isMobile} onOpenExpense={openBookingExpense} serviceStop={serviceStopMode} roadtripActive={roadtripActive} />
      <TripFormModal
        isOpen={showTripForm}
        onClose={() => setShowTripForm(false)}
        onSave={async (data) => { await tripActions.updateTrip(tripId, data); loadAccommodations(); toast.success(t('trip.toast.tripUpdated')) }}
        trip={trip}
        onCoverUpdate={(_, coverUrl) => useTripStore.setState(state => ({ trip: state.trip ? { ...state.trip, cover_image: coverUrl } : state.trip }))}
      />
      <TripMembersModal isOpen={showMembersModal} onClose={() => setShowMembersModal(false)} tripId={tripId} tripTitle={trip?.title} onMembersChanged={refreshMembers} />
      <ReservationModal isOpen={showReservationModal} onClose={() => { if (importReviewActive) { advanceImportReview() } else { setShowReservationModal(false); setEditingReservation(null); setBookingForAssignmentId(null) } }} onSave={async (data) => { const r = await handleSaveReservation(data); if (importReviewActive && r) advanceImportReview(); return r }} reservation={editingReservation} prefill={reservationPrefill} days={days} places={places} assignments={assignments} selectedDayId={selectedDayId} files={files} onFileUpload={canUploadFiles ? (fd) => tripActions.addFile(tripId, fd) : undefined} onFileDelete={(id) => tripActions.deleteFile(tripId, id)} accommodations={tripAccommodations} defaultAssignmentId={bookingForAssignmentId} onOpenExpense={openBookingExpense} tripMembers={tripMembers} />
      {showTransportModal && (
        <ErrorBoundary boundaryId="planner-panel:transport" fallback={null}>
          <Suspense fallback={null}>
            <TransportModal isOpen={showTransportModal} onClose={() => { if (importReviewActive) { advanceImportReview() } else { setShowTransportModal(false); setEditingTransport(null); setTransportModalDayId(null); setTransportModalAutomated(false); setTransitPrefill(null) } }} onSave={async (data) => { const r = await handleSaveTransport(data); if (importReviewActive && r) advanceImportReview(); return r }} reservation={editingTransport} prefill={transportPrefill} days={days} selectedDayId={transportModalDayId} files={files} onFileUpload={canUploadFiles ? (fd) => tripActions.addFile(tripId, fd) : undefined} onFileDelete={(id) => tripActions.deleteFile(tripId, id)} onDelete={can('reservation_edit', trip) && editingTransport ? () => handleDeleteReservation(editingTransport.id) : undefined} onOpenExpense={openBookingExpense} places={places} assignments={assignments} accommodations={tripAccommodations} initialAutomated={transportModalAutomated} transitPrefill={transitPrefill} tripHasDates={tripHasDates} tripMembers={tripMembers} />
          </Suspense>
        </ErrorBoundary>
      )}
      {/* Journey view for a saved public-transit entry (#1065) */}
      {transitJourney && (
        <TransitJourneyModal
          reservation={reservations.find(r => r.id === transitJourney.id) ?? transitJourney}
          canEdit={can('day_edit', trip)}
          onClose={() => setTransitJourney(null)}
          onSave={async (fields) => { await tripActions.updateReservation(tripId, transitJourney.id, fields); setTransitJourney(null) }}
          onDelete={async () => { await handleDeleteReservation(transitJourney.id); setTransitJourney(null) }}
          onChangeRoute={() => changeTransitRoute(transitJourney)}
          // The store copy may be newer than the journey held in state.
          onEditDetails={() => openTransportEditor(reservations.find(r => r.id === transitJourney.id) ?? transitJourney)}
        />
      )}
      {/* A booking clicked on the desktop plan: its detail first, the editor one Edit away. */}
      {bookingDetail && (
        <BookingDetailPopup
          r={bookingDetail}
          tripId={tripId}
          days={days}
          assignments={assignments}
          files={files}
          canEdit={can('reservation_edit', trip)}
          onClose={closeBookingDetail}
          onEdit={bookingDetailEditor}
          onDelete={handleDeleteReservation}
          onShowOnMap={showBookingOnMap}
          isOnMap={isBookingOnMap}
          onEditExpense={(item) => openBookingExpense({ editItem: item })}
          onChangeRoute={bookingDetailChangeRoute}
          onNavigateToFiles={() => handleTabChange('dateien')}
        />
      )}
      {expenseEditor && (
        <ErrorBoundary boundaryId="planner-panel:expense" fallback={null}>
          <Suspense fallback={null}>
            <ExpenseModal
              key={expenseEditor.key}
              tripId={tripId}
              base={costsBase}
              people={tripMembers}
              me={meId}
              editing={expenseEditor.editing}
              prefill={expenseEditor.prefill}
              onClose={expenseEditor.close}
              onSaved={() => { expenseEditor.close(); loadBudgetItems(tripId) }}
            />
          </Suspense>
        </ErrorBoundary>
      )}
      <BookingImportModal isOpen={showBookingImport} onClose={() => setShowBookingImport(false)} tripId={tripId} kind={bookingImportKind} />
      <AirTrailImportModal isOpen={showAirTrailImport} onClose={() => setShowAirTrailImport(false)} tripId={tripId} pushUndo={pushUndo} />
      <ConfirmDialog
        isOpen={!!deletePlaceId}
        onClose={() => setDeletePlaceId(null)}
        onConfirm={async () => {
          const deletedTourId = await confirmDeletePlace()
          if (deletedTourId != null) tourPlanner.forgetDeletedTour(deletedTourId)
        }}
        title={t('common.delete')}
        message={deletePlaceIsTour
          ? [t('tours.delete.confirmBody'), deletePlaceNote].filter(Boolean).join(' ')
          : deletePlaceNote ? `${t('trip.confirm.deletePlace')} ${deletePlaceNote}` : t('trip.confirm.deletePlace')}
        confirmLabel={deletePlaceIsTour ? t('tours.delete.confirmAction') : undefined}
      />
      <ConfirmDialog
        isOpen={!!deletePlaceIds?.length}
        onClose={() => setDeletePlaceIds(null)}
        onConfirm={confirmDeletePlaces}
        title={t('common.delete')}
        message={deletePlacesIncludeTours
          ? [t('tours.delete.bulkConfirmBody'), deletePlacesNote].filter(Boolean).join(' ')
          : deletePlacesNote
            ? `${t('trip.confirm.deletePlaces', { count: deletePlaceIds?.length ?? 0 })} ${deletePlacesNote}`
            : t('trip.confirm.deletePlaces', { count: deletePlaceIds?.length ?? 0 })}
        confirmLabel={deletePlacesIncludeTours ? t('tours.delete.confirmAction') : undefined}
      />
      <ConfirmDialog
        isOpen={clearDayId != null}
        onClose={cancelClearDay}
        onConfirm={() => { void confirmClearDay() }}
        title={clearDayTitle}
        message={t('dayplan.clearDayBody')}
        confirmLabel={t('dayplan.clearDay')}
        danger
      />
      <ConfirmDialog
        isOpen={!!stayRelease}
        onClose={() => setStayRelease(null)}
        onConfirm={confirmStayRelease}
        title={t('roadtrip.stay.releaseTitle')}
        message={stayRelease?.booking
          ? t('roadtrip.stay.releaseBookedBody', { name: stayRelease.name, booking: stayRelease.booking })
          : t('roadtrip.stay.releaseBody', { name: stayRelease?.name ?? '' })}
        confirmLabel={t('roadtrip.stay.releaseAction')}
      />
    </div>
  )
}
