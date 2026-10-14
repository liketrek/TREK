import { lazy, Suspense, useState, type ReactElement } from 'react';
import { MapViewAuto as MapView } from '../../components/Map/MapViewAuto';
import LocationSelect from '../../components/Planner/LocationSelect';
import { useSettingsStore } from '../../store/settingsStore';
import type { useTripPlanner } from './useTripPlanner';
import type { useTripPlannerPage } from './useTripPlannerPage';

// The 3D mode pulls the GL engine in, so it loads only once someone switches to it.
const TourTerrainMap = lazy(() => import('../../components/Tours/terrain/TourTerrainMap'));

/** The route blue the planner draws a tour in. */
const TOUR_TRACK_COLOR = '#0a84ff';

type Planner = ReturnType<typeof useTripPlanner>;
type PageState = ReturnType<typeof useTripPlannerPage>;

export interface TourPlannerMapStageProps
  extends
    Pick<Planner, 'tripId' | 'mapTileUrl' | 'leftHidden' | 'rightHidden' | 't'>,
    Pick<PageState, 'tourPlanner' | 'tourMap' | 'locationSearch'> {
  canPlaceEdit: boolean;
  leftPanelPx: number;
  rightPanelPx: number;
}

/**
 * The tour planner tab's map and the location search floating over it. It returns a
 * fragment so both sit straight in the tab container, ahead of the side panels, with
 * the stacking they had when this lived in the page.
 */
export function TourPlannerMapStage({
  tripId,
  mapTileUrl,
  leftHidden,
  rightHidden,
  t,
  tourPlanner,
  tourMap,
  locationSearch,
  canPlaceEdit,
  leftPanelPx,
  rightPanelPx,
}: Readonly<TourPlannerMapStageProps>): ReactElement {
  const [terrain3d, setTerrain3d] = useState(false);
  const distanceUnit = useSettingsStore((s) => s.settings.distance_unit);
  const analysis = tourPlanner.mode.type === 'view-gpx' ? tourPlanner.readOnlyGpxAnalysis : tourPlanner.routeAnalysis;
  const editing = tourPlanner.mode.type === 'new-draft' || tourPlanner.mode.type === 'edit-saved';
  const canEditRoute = canPlaceEdit && !tourPlanner.isSaving && editing;
  const waypoints = {
    points: editing ? tourPlanner.waypoints : [],
    selectedId: editing ? tourPlanner.selectedWaypointId : null,
    onSelect: tourPlanner.setSelectedWaypointId,
    onMove: canEditRoute ? tourPlanner.setWaypointPosition : undefined,
    onAdd: canEditRoute ? tourPlanner.addWaypoint : undefined,
  };
  // What each panel covers of the map, a collapsed one its rail.
  const leftInset = leftHidden ? 56 : leftPanelPx;
  const rightInset = rightHidden ? 56 : rightPanelPx;
  return (
    <>
      {terrain3d ? (
        <Suspense fallback={null}>
          <TourTerrainMap
            samples={analysis?.distanceIndexedProfileSamples ?? []}
            routes={tourMap.route}
            trackColor={TOUR_TRACK_COLOR}
            unit={distanceUnit}
            baseLayer={tourPlanner.mapBaseLayer}
            onBaseLayerChange={tourPlanner.setMapBaseLayer}
            onExit={() => setTerrain3d(false)}
            focus={tourPlanner.routeProfileFocus}
            onFocusChange={tourPlanner.setRouteProfileFocus}
            leftWidth={leftInset}
            rightWidth={rightInset}
            waypoints={waypoints}
            framePoints={tourMap.focusPoints}
          />
        </Suspense>
      ) : (
        <MapView
          tripId={tripId}
          places={[]}
          route={tourMap.route}
          followSelection={false}
          onMapClick={
            canEditRoute
              ? ({ latlng }: { latlng: { lat: number; lng: number } }) =>
                  tourPlanner.addWaypoint(latlng.lat, latlng.lng)
              : undefined
          }
          tileUrl={mapTileUrl}
          leftWidth={leftPanelPx}
          rightWidth={rightPanelPx}
          focusPoints={tourMap.focusPoints}
          focusKey={tourMap.focusKey}
          plannerWaypoints={waypoints.points}
          selectedPlannerWaypointId={waypoints.selectedId}
          onPlannerWaypointClick={tourPlanner.setSelectedWaypointId}
          onPlannerWaypointMove={waypoints.onMove}
          routeProfileFocus={tourPlanner.routeProfileFocus}
          viewBaseLayer={tourPlanner.mapBaseLayer}
          onViewBaseLayerChange={tourPlanner.setMapBaseLayer}
          onToggleTerrain3d={() => setTerrain3d(true)}
        />
      )}
      {/* Centred over the map between the two panels, which sit on fixed physical sides. */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          insetInline: 0,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 19,
        }}
      >
        <div
          style={{
            transform: `translateX(${(leftInset - rightInset) / 2}px)`,
            width: `min(360px, calc(100vw - ${leftInset + rightInset + 32}px))`,
            pointerEvents: 'auto',
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
      </div>
    </>
  );
}
