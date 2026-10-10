import type { Dispatch, ReactElement, SetStateAction } from 'react'
import { createPortal } from 'react-dom'
import { MapViewAuto as MapView } from '../../components/Map/MapViewAuto'
import { MapCompassPill, type CompassMap } from '../../components/Map/MapCompassPill'
import { TripRouteOverviewPill, TripRouteOverviewPanel } from '../../components/Map/TripRouteOverview'
import { DawarichTrailPill } from '../../components/Map/DawarichTrailPill'
import PoiCategoryPill from '../../components/Map/PoiCategoryPill'
import type { Poi } from '../../components/Map/poiCategories'
import type { Settings } from '../../types'
import { RoadtripAlternativesBar } from './plannerLazy'
import { LazyPanel } from './LazyPanel'
import type { useTripPlanner } from './useTripPlanner'
import type { useTripPlannerPage } from './useTripPlannerPage'

type Planner = ReturnType<typeof useTripPlanner>
type PageState = ReturnType<typeof useTripPlannerPage>

// Picked per concern so the key lists stay short and typed by the hook that owns them.
type StageTrip = Pick<Planner, 'tripId' | 'trip' | 'can' | 'days' | 'reservations' | 'isMobile' | 'selectedDayId' | 'selectedPlaceId' | 'selectedPlace' | 'showDayDetail' | 'handleSelectDay'>
type StageMap = Pick<Planner,
  | 'mapPlaces' | 'dayPlaces' | 'dayOrderMap' | 'mapTileUrl' | 'fitKey' | 'mapLocked' | 'toggleMapLocked' | 'mapFocusPoints'
  | 'route' | 'routeWalking' | 'routeSegments' | 'routeVias' | 'transitRoutesShown'
  | 'handleMarkerClick' | 'handleMapClick' | 'handleMapContextMenu' | 'handlePoiClick'
  | 'visibleConnections' | 'setMapTransportDetail' | 'openBookingDetail'
>
type StageRoadtrip = Pick<Planner,
  | 'roadtripActive' | 'roadtripMapPlaces' | 'roadtripMapLines' | 'roadtripLineColors' | 'roadtripMapVias' | 'roadtripRoutes' | 'roadtripConnections' | 'roadtripVias'
  | 'dayBoundaryControls' | 'dropPoiOnRoute' | 'addRoadtripVia' | 'moveRoadtripVia' | 'removeRoadtripVia'
>
type StageAlternatives = Pick<Planner, 'routeAlternatives' | 'alternativeOverlays' | 'highlightedAlternative' | 'chooseRouteAlternative' | 'setHighlightedAlternative'>
type StageOverlays = Pick<Planner,
  | 'overviewActive' | 'tripOverview' | 'overviewShown' | 'toggleOverview'
  | 'dawarichEnabled' | 'dawarichTrail' | 'dawarichHiddenDates' | 'dawarichTrailShown' | 'toggleDawarichTrail'
  | 'mobileSidebarOpen' | 'showPlaceForm' | 'showMembersModal' | 'showReservationModal'
>

/** What the page works out itself: the panel geometry, the compass map and the POI settings. */
interface StagePageLocals {
  leftPanelPx: number
  rightPanelPx: number
  mapInsetLeft: number
  mapInsetRight: number
  glMap: CompassMap | null
  setGlMap: Dispatch<SetStateAction<CompassMap | null>>
  poiPillEnabled: boolean
  mapPois: Poi[]
  distanceUnit: Settings['distance_unit']
}

export interface PlanMapStageProps
  extends StageTrip, StageMap, StageRoadtrip, StageAlternatives, StageOverlays, Pick<PageState, 'poi' | 'tourMap'>, StagePageLocals {}

/**
 * The plan tab's map and the controls floating over it. It returns a fragment on
 * purpose: the children sit straight in the plan container, ahead of the side
 * panels, so their stacking and the order of the portals in document.body stay
 * exactly what they were when this lived in the page.
 */
export function PlanMapStage({
  tripId, trip, can, days, reservations, isMobile,
  selectedDayId, selectedPlaceId, selectedPlace, showDayDetail, handleSelectDay,
  mapPlaces, dayPlaces, dayOrderMap, mapTileUrl, fitKey, mapLocked, toggleMapLocked, mapFocusPoints,
  route, routeWalking, routeSegments, routeVias, transitRoutesShown,
  handleMarkerClick, handleMapClick, handleMapContextMenu, handlePoiClick,
  visibleConnections, setMapTransportDetail, openBookingDetail,
  roadtripActive, roadtripMapPlaces, roadtripMapLines, roadtripLineColors, roadtripMapVias,
  roadtripRoutes, roadtripConnections, roadtripVias,
  dayBoundaryControls, dropPoiOnRoute, addRoadtripVia, moveRoadtripVia, removeRoadtripVia,
  routeAlternatives, alternativeOverlays, highlightedAlternative, chooseRouteAlternative, setHighlightedAlternative,
  overviewActive, tripOverview, overviewShown, toggleOverview,
  dawarichEnabled, dawarichTrail, dawarichHiddenDates, dawarichTrailShown, toggleDawarichTrail,
  mobileSidebarOpen, showPlaceForm, showMembersModal, showReservationModal,
  poi, tourMap, leftPanelPx, rightPanelPx, mapInsetLeft, mapInsetRight,
  glMap, setGlMap, poiPillEnabled, mapPois, distanceUnit,
}: Readonly<PlanMapStageProps>): ReactElement {
  return (
    <>
      <MapView
        tripId={tripId}
        dawarichTrack={dawarichTrail.track}
        dawarichHiddenDates={dawarichHiddenDates}
        places={roadtripActive ? roadtripMapPlaces : mapPlaces}
        dayPlaces={dayPlaces}
        route={roadtripActive ? roadtripMapLines : overviewActive ? tripOverview.lines : route}
        routeColors={roadtripActive ? roadtripLineColors : overviewActive ? tripOverview.lineColors : undefined}
        routeWalking={roadtripActive || overviewActive ? undefined : routeWalking}
        followSelection={!mapLocked || isMobile}
        onToggleFollow={isMobile ? undefined : toggleMapLocked}
        routeVias={roadtripActive ? roadtripMapVias : routeVias}
        dayBoundaryControls={roadtripActive ? dayBoundaryControls : undefined}
        accessLines={roadtripActive ? roadtripRoutes.accessLines : undefined}
        showTransitRoutes={transitRoutesShown}
        // The route toggle belongs to one day, so the map needs that day to
        // know which automated transports may ride it (#2019).
        days={days}
        selectedDayId={selectedDayId}
        routeSegments={roadtripActive ? roadtripRoutes.segments : overviewActive ? tripOverview.segments : routeSegments}
        selectedPlaceId={selectedPlaceId}
        selectedPlace={selectedPlace}
        onMarkerClick={handleMarkerClick}
        onMapClick={handleMapClick}
        onMapContextMenu={handleMapContextMenu}
        // No center/zoom: the map frames itself on the trip's places at mount, and
        // falls back to the world view when the trip has none.
        tileUrl={mapTileUrl}
        fitKey={fitKey}
        dayOrderMap={dayOrderMap}
        leftWidth={leftPanelPx}
        rightWidth={rightPanelPx}
        hasInspector={!!selectedPlace}
        hasDayDetail={!!showDayDetail && !selectedPlace}
        reservations={reservations}
        showReservationStats={true}
        // In road trip mode the rides that seam the drive are drawn as their own arcs
        // beside the roads, on top of what the reader switched on under Days.
        visibleConnectionIds={roadtripActive ? roadtripConnections : visibleConnections}
        // The desktop plan shows the booking's detail; the narrow layout keeps the day
        // list's transport view.
        onReservationClick={(rid) => {
          const r = reservations.find(x => x.id === rid)
          if (!r) return
          if (isMobile) setMapTransportDetail(r)
          else openBookingDetail(r)
        }}
        /* In road trip mode the corridor's `visible` (not `search.results`: the map is
           the picture of that very list, and filtering the list while seventy pins stay
           on the map no longer answers "which of these") plus whatever the category
           pill found in view. Outside it, only the pill's hits. */
        pois={mapPois}
        onPoiClick={handlePoiClick}
        // Only while road trip mode is on: outside it there is no drive to drop onto.
        onPoiDropOnRoute={roadtripActive ? dropPoiOnRoute : undefined}
        // Clicking the drawn route puts a via there; only in road trip mode, where
        // the route is the thing being worked on.
        onRouteClick={roadtripActive && can('day_edit', trip) ? addRoadtripVia : undefined}
        roadtripVias={roadtripActive ? roadtripVias.byDay : undefined}
        alternativeRoutes={alternativeOverlays}
        focusPoints={overviewActive ? tripOverview.focusPoints : mapFocusPoints}
        clusterLoosely={roadtripActive}
        activeAlternative={highlightedAlternative}
        onChooseAlternative={chooseRouteAlternative}
        onHighlightAlternative={setHighlightedAlternative}
        onMoveVia={can('day_edit', trip) ? moveRoadtripVia : undefined}
        onRemoveVia={can('day_edit', trip) ? removeRoadtripVia : undefined}
        onViewportChange={tourMap.captureViewport}
        onMapReady={setGlMap}
      />

      {/* Over the map rather than in a dialog: the answer to "which of these" is the
          roads drawn behind it, so covering them to ask would hide the point. */}
      {routeAlternatives.open && (
        <div style={{ position: 'absolute', bottom: 18, left: '50%', /* rtl-lint-disable: centred on the map */ transform: 'translateX(-50%)', zIndex: 26, pointerEvents: 'none', display: 'flex', justifyContent: 'center' }}>
          <LazyPanel id="roadtrip-alternatives">
            <RoadtripAlternativesBar
              open={routeAlternatives.open}
              overlays={alternativeOverlays}
              onChoose={chooseRouteAlternative}
              onClose={routeAlternatives.close}
              onHighlight={setHighlightedAlternative}
            />
          </LazyPanel>
        </div>
      )}

      {/* Bottom-RIGHT. Not the top corridor between the panels, which is already
          contested by the POI bar and the collapse tabs (#2247); and not the
          bottom-left corner, where Leaflet's base-layer switcher sits at
          z-index 1000 and would cover this. The right corner is free on both
          renderers: the locate button that lives there is phone-only. */}
      {(!roadtripActive || dawarichEnabled) && (
        <div className="hidden md:flex" style={{
          position: 'absolute', bottom: 18, right: mapInsetRight + 14, zIndex: 26, // rtl-lint-disable: measured from the right panel's inset
          pointerEvents: 'none', flexDirection: 'column', alignItems: 'flex-end', gap: 8,
        }}>
          {!roadtripActive && overviewActive && (
            <TripRouteOverviewPanel
              overview={tripOverview}
              unit={distanceUnit}
              selectedDayId={selectedDayId}
              onSelectDay={handleSelectDay}
            />
          )}
          {!roadtripActive && (
            <TripRouteOverviewPill active={overviewShown} onToggle={toggleOverview} />
          )}
          {/* Stays in road-trip mode, unlike the overview: the route that was
              actually driven is the thing you most want beside the planned
              one. It is drawn, never applied. Correcting the plan from the
              recording is a different feature and deliberately not this one. */}
          {dawarichEnabled && (
            <DawarichTrailPill
              active={dawarichTrailShown}
              status={dawarichTrail.status}
              onToggle={toggleDawarichTrail}
            />
          )}
        </div>
      )}

      {(poiPillEnabled || glMap) && (
        <div className="hidden md:flex" style={{
          position: 'absolute', top: 14,
          // Centred on the corridor the panels leave, not on the viewport: at
          // 860px the viewport centre sits under the Places panel, where this
          // cluster covered both collapse tabs and Add Place/Activity (#2247).
          left: `calc(${mapInsetLeft}px + (100% - ${mapInsetLeft}px - ${mapInsetRight}px) / 2)`, // rtl-lint-disable: centred between the measured panel insets
          // No wider than that corridor either: once plugins add categories the pill
          // scrolls inside it instead of running on under a panel.
          maxWidth: `calc(100% - ${mapInsetLeft}px - ${mapInsetRight}px - 24px)`,
          transform: 'translateX(-50%)', zIndex: 25, pointerEvents: 'none', alignItems: 'flex-start', gap: 8,
        }}>
          {poiPillEnabled && (
            <PoiCategoryPill categories={poi.categories} active={poi.active} onToggle={poi.toggle} loadingKeys={poi.loadingKeys} errorKeys={poi.errorKeys} moved={poi.moved} onSearchArea={poi.searchArea} />
          )}
          {glMap && <MapCompassPill map={glMap} />}
        </div>
      )}

      {/* Mobile: the compass/reset-orientation control lives centre-top on its own
          (the desktop cluster above is hidden below md), between the edge Plan/Places tabs. */}
      {glMap && (
        <div className="flex md:hidden" style={{ position: 'absolute', top: 14, left: '50%', /* rtl-lint-disable: centred on the map */ transform: 'translateX(-50%)', zIndex: 25, pointerEvents: 'none' }}>
          <MapCompassPill map={glMap} />
        </div>
      )}

      {/* Mobile POI search controls live in a portal like the Plan/Places
          buttons so map touch handlers cannot swallow the tap targets. */}
      {poiPillEnabled && !mobileSidebarOpen && !showPlaceForm && !showMembersModal && !showReservationModal && createPortal(
        <div data-testid="mobile-poi-category-pill" className="flex md:hidden" style={{ position: 'fixed', insetInline: 12, bottom: 'calc(var(--bottom-nav-h, 0px) + 12px)', justifyContent: 'center', zIndex: 100, pointerEvents: 'none' }}>
          <PoiCategoryPill categories={poi.categories} active={poi.active} onToggle={poi.toggle} loadingKeys={poi.loadingKeys} errorKeys={poi.errorKeys} moved={poi.moved} onSearchArea={poi.searchArea} />
        </div>,
        document.body
      )}
    </>
  )
}
