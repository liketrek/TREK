import { useState } from 'react'
import { MapViewAuto } from '../../../../components/Map/MapViewAuto'
import { MapCompassPill, type CompassMap } from '../../../../components/Map/MapCompassPill'
import PoiCategoryPill from '../../../../components/Map/PoiCategoryPill'
import { usePoiExplore } from '../../../../components/Map/usePoiExplore'
import { useSettingsStore } from '../../../../store/settingsStore'
import type { MMapAreaProps } from '../MTripShell'

/**
 * Fullscreen map layer of the mobile trip screen (plan tab). Stays mounted for
 * the whole plan-tab lifetime — the plan timeline / places browser overlays
 * simply cover it — so tiles, markers and the GL engine stay warm across view
 * toggles.
 *
 * The map itself is the shared planner renderer (Leaflet or GL, per user
 * setting) with the full desktop feature set: clusters, photo/icon markers,
 * day-order badges, dashed day route, transport overlays per booking, POI
 * explore markers and long-press → add place. Only the floating chrome is
 * mobile: the POI/compass cluster sits centre-top below the day-chip rail, and
 * the map's built-in three-state locate button is lifted above the dock via
 * the --bottom-nav-h contract it already reads.
 *
 * Marker data honours the shared places category filter (#1541) because
 * planner.mapPlaces is derived from tripStore's placesCategoryFilter — the
 * same set the places browser renders, so the two can't desync.
 */
export default function MMapArea({ planner, shell }: MMapAreaProps) {
  const poi = usePoiExplore()
  const [glMap, setGlMap] = useState<CompassMap | null>(null)
  const poiPillEnabled = useSettingsStore(s => s.settings.map_poi_pill_enabled) !== false

  const mapActive = shell.view === 'map'

  return (
    // `isolate` keeps the map's internal z-indexes (Leaflet panes, the z-1000
    // locate button) inside this layer so they can never paint over the plan
    // timeline (z-10) or the browse/tab overlays (z-30) above it.
    // The dock is 62px tall at safe-bottom + 12, so a 104px --bottom-nav-h
    // floats the built-in locate button at the spec's 116px band above it.
    <div className="absolute inset-0 isolate overflow-hidden bg-[color:var(--m-mapb)] [--bottom-nav-h:calc(env(safe-area-inset-bottom,0px)+104px)]">
      <MapViewAuto
        tripId={planner.tripId}
        places={planner.mapPlaces}
        dayPlaces={planner.dayPlaces}
        route={planner.route}
        routeVias={planner.routeVias}
        showTransitRoutes={planner.routeShown}
        routeSegments={planner.routeSegments}
        selectedPlaceId={planner.selectedPlaceId}
        onMarkerClick={planner.handleMarkerClick}
        // Tap on empty map = deselect, same contract as desktop.
        onMapClick={planner.handleMapClick}
        onMapContextMenu={planner.handleMapContextMenu}
        // No center/zoom: the map frames itself on the trip's places at mount.
        tileUrl={planner.mapTileUrl}
        fitKey={planner.fitKey}
        dayOrderMap={planner.dayOrderMap}
        reservations={planner.reservations}
        showReservationStats={true}
        visibleConnectionIds={planner.visibleConnections}
        // Transport overlay tap → the mobile transport detail sheet (desktop
        // routes this through mapTransportDetail into the day sidebar instead).
        onReservationClick={(rid: number) => shell.openSheet('transport', { reservationId: rid })}
        pois={poi.pois}
        onPoiClick={planner.openAddPlaceFromPoi}
        onViewportChange={poi.onViewportChange}
        onMapReady={setGlMap}
      />

      {/* Floating map chrome — only while the map view is front-most. Centre-top,
          below the day-chip rail (safe-top + 50px + ~42px chip height). The
          compass renders on GL maps only (Leaflet can't rotate). */}
      {mapActive && (poiPillEnabled || glMap) && (
        <div className="pointer-events-none absolute left-4 right-4 z-[25] flex flex-col items-center gap-2 top-[calc(var(--m-safe-top,12px)+96px)]">
          {poiPillEnabled && (
            <PoiCategoryPill
              active={poi.active}
              onToggle={poi.toggle}
              loadingKeys={poi.loadingKeys}
              errorKeys={poi.errorKeys}
              moved={poi.moved}
              onSearchArea={poi.searchArea}
            />
          )}
          {glMap && <MapCompassPill map={glMap} />}
        </div>
      )}
    </div>
  )
}
