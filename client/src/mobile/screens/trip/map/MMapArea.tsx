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
 * mobile: the POI bar spans the full width below the day-chip rail, and the two
 * round controls share the band just above the dock — the compass on the left,
 * the map's built-in three-state locate button on the right, both riding the
 * --bottom-nav-h contract the map already reads so they cannot drift apart.
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
    // The dock is 62px tall at safe-bottom + 12, so a 74px --bottom-nav-h puts
    // the round controls (which add their own 12px) a dock's gap above it —
    // close enough to the thumb to reach one-handed, clear of the dock itself.
    <div className="absolute inset-0 isolate overflow-hidden bg-[color:var(--m-mapb)] [--bottom-nav-h:calc(env(safe-area-inset-bottom,0px)+74px)]">
      <MapViewAuto
        tripId={planner.tripId}
        places={planner.mapPlaces}
        dayPlaces={planner.dayPlaces}
        route={planner.route}
        routeVias={planner.routeVias}
        showTransitRoutes={planner.routeShown}
        // The route toggle belongs to one day, so the map needs that day to know
        // which automated transports may ride it (#2019).
        days={planner.days}
        selectedDayId={planner.selectedDayId}
        routeSegments={planner.routeSegments}
        selectedPlaceId={planner.selectedPlaceId}
        onMarkerClick={planner.handleMarkerClick}
        // Tap on empty map = deselect, same contract as desktop.
        onMapClick={planner.handleMapClick}
        // The chip rail names a day at all times on mobile, so a place dropped on
        // the map belongs to it — the desktop map has no such context and passes
        // nothing, which keeps its pool behaviour (#1998).
        onMapContextMenu={e => planner.handleMapContextMenu(e, planner.selectedDayId)}
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
        onPoiClick={marker => planner.openAddPlaceFromPoi(marker, planner.selectedDayId)}
        onViewportChange={poi.onViewportChange}
        onMapReady={setGlMap}
      />

      {/* Floating map chrome — only while the map view is front-most. The POI bar
          sits below the day-chip rail (safe-top + 50px + ~42px chip height) and
          takes the full width between the screen margins, so its segments are
          the same size as everything else the thumb aims at on this screen. */}
      {mapActive && poiPillEnabled && (
        <div className="pointer-events-none absolute left-4 right-4 z-[25] flex flex-col items-center gap-2 top-[calc(var(--m-safe-top,12px)+96px)]">
          <PoiCategoryPill
            fullWidth
            active={poi.active}
            onToggle={poi.toggle}
            loadingKeys={poi.loadingKeys}
            errorKeys={poi.errorKeys}
            moved={poi.moved}
            onSearchArea={poi.searchArea}
          />
        </div>
      )}

      {/* Compass — GL maps only (Leaflet can't rotate). Bottom-left, mirroring
          the locate button's own `right: 12` off the same --bottom-nav-h, so the
          two round controls always sit on one line. Leaflet has no compass but
          puts its base-layer switcher in the same corner, so the band reads the
          same either way. */}
      {mapActive && glMap && (
        <div className="pointer-events-none absolute left-3 z-[25]" style={{ bottom: 'calc(var(--bottom-nav-h, 84px) + 12px)' }}>
          <MapCompassPill map={glMap} />
        </div>
      )}
    </div>
  )
}
