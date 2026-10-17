import type { FerrataBbox } from '@trek/shared';
import { lazy, Suspense, useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { crossingLegs, waypointsAtFerrataEnds } from '../../components/Ferratas/ferrataCrossings';
import FerrataDetailOverlay from '../../components/Ferratas/FerrataDetailOverlay';
import { ferrataLabel, type FerrataGroup } from '../../components/Ferratas/ferrataGroups';
import { useFerrataMapLayer } from '../../components/Ferratas/useFerrataMapLayer';
import { useOutsidePressGuard } from '../../components/Ferratas/useOutsidePressGuard';
import { MAP_LAYER_SWITCHER_INSET, MAP_ROUND_CONTROL_SIZE } from '../../components/Map/MapLayerSwitcher';
import { MapUndoHint } from '../../components/Map/MapUndoHint';
import { MapViewAuto as MapView } from '../../components/Map/MapViewAuto';
import LocationSelect from '../../components/Planner/LocationSelect';
import { ChecklistObstaclePanel } from '../../components/Tours/paddle/ObstacleDecisionPanel';
import PaddleObstacleOverlay from '../../components/Tours/paddle/PaddleObstacleOverlay';
import { PaddleObstaclePlaceButton } from '../../components/Tours/paddle/PaddleObstaclePlaceButton';
import { useShapingClick } from '../../components/Tours/planner/useShapingClick';
import type { TerrainLegendLayout } from '../../components/Tours/terrain/TourTerrainMap';
import { isRtlLanguage, useTranslation } from '../../i18n';
import { selectPaddleObstacle, usePaddleObstacleStore } from '../../store/paddleObstacleStore';
import { useSettingsStore } from '../../store/settingsStore';
import { publishTourFerrataCrossings } from '../../store/tourFerrataCrossingStore';
import { useFerrataAdopt } from './useFerrataAdopt';
import { useTourMapPoints } from './useTourMapPoints';
import { useTourStageLayers } from './useTourStageLayers';
import { useTrackLinePick } from './useTrackLinePick';
import type { useTripPlanner } from './useTripPlanner';
import type { useTripPlannerPage } from './useTripPlannerPage';

// The 3D mode pulls the GL engine in, so it loads only once someone switches to it.
const TourTerrainMap = lazy(() => import('../../components/Tours/terrain/TourTerrainMap'));

/** The route blue the planner draws a tour in. */
const TOUR_TRACK_COLOR = '#0a84ff';
/** The gap both maps keep between the bottom edge, their row of controls and what floats above it. */
const CONTROL_GAP = 12;
/** A via ferrata's card floats above the bottom row of controls, at the gap the row keeps to the edge. */
const FERRATA_CARD_BOTTOM = CONTROL_GAP + MAP_ROUND_CONTROL_SIZE + CONTROL_GAP;
/** The crosshair over either engine's map while a click sets a point (markers keep their own cursor). */
const PLACING_CURSOR =
  '[&_.leaflet-container]:!cursor-crosshair [&_.maplibregl-canvas-container]:!cursor-crosshair [&_.mapboxgl-canvas-container]:!cursor-crosshair';

/**
 * Where a via ferrata's card sits. On the flat map nothing is under its corner,
 * so it rests at the edge gap; in 3D it stands on the dock row, as wide as the
 * grade legend it sits over, and on the legend's bands while they are open.
 */
function ferrataCardPlacement(
  terrain3d: boolean,
  bottomRowTop: number,
  legend: TerrainLegendLayout | null
): { bottom: number; width?: number } {
  if (!terrain3d) return { bottom: CONTROL_GAP };
  return { bottom: bottomRowTop + (legend?.raisedBy ?? 0), width: legend?.width };
}

type Planner = ReturnType<typeof useTripPlanner>;
const NO_POINTS: readonly { id: string; lat: number; lng: number }[] = [];
type PageState = ReturnType<typeof useTripPlannerPage>;

export interface TourPlannerMapStageProps
  extends
    Pick<Planner, 'tripId' | 'mapTileUrl' | 'leftHidden' | 'rightHidden' | 't'>,
    Pick<PageState, 'tourPlanner' | 'tourMap' | 'locationSearch'> {
  canPlaceEdit: boolean;
  leftPanelPx: number;
  rightPanelPx: number;
  /** Told the visible area too, besides the via ferrata layer (the wanderer area search). */
  onViewportChange?: (bounds: FerrataBbox) => void;
  /** The open paddle tour's checklist (PAD-06): its part for the picked object rides in the object's map card. */
  paddleChecklist?: PageState['paddleChecklist'];
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
  onViewportChange,
  paddleChecklist,
}: Readonly<TourPlannerMapStageProps>): ReactElement {
  const [terrain3d, setTerrain3d] = useState(false);
  // How high the 3D map's controls reach: one row, or two once the grade legend moved above the dock.
  const [terrainControlsPx, setTerrainControlsPx] = useState(MAP_ROUND_CONTROL_SIZE);
  const [terrainLegend, setTerrainLegend] = useState<TerrainLegendLayout | null>(null);
  // One via ferrata layer for both modes: it stays on, and keeps its card, across 2D and 3D.
  // The trip's area for the layer to prefetch: the framed points and the tour's line.
  const ferrataArea = useMemo(
    () => [tourMap.focusPoints, ...(tourMap.route ?? [])],
    [tourMap.focusPoints, tourMap.route]
  );
  const analysis = tourPlanner.mode.type === 'view-gpx' ? tourPlanner.readOnlyGpxAnalysis : tourPlanner.routeAnalysis;
  const ferrata = useFerrataMapLayer(tripId, ferrataArea, analysis?.routeCoordinates ?? null);
  // The maps this tour's type offers: its base layers, its overlays, and the ferratas only where they belong.
  const { baseLayer, tourLayers, ferrataLayer, ferrataCrossings, ferrataSelected } = useTourStageLayers(
    tourPlanner,
    ferrata
  );
  const ferrataViewportChange = ferrata.onViewportChange;
  const viewportChanged = useCallback(
    (bounds: FerrataBbox) => {
      ferrataViewportChange(bounds);
      onViewportChange?.(bounds);
    },
    [ferrataViewportChange, onViewportChange]
  );
  // The rails beside the map warn about the stretches that climb a ferrata, and band them on the profile.
  const { t: translate, language } = useTranslation();
  const tourWaypoints = tourPlanner.mode.type === 'view-gpx' ? NO_POINTS : tourPlanner.waypoints;
  useEffect(() => {
    const describe = (group: FerrataGroup) => {
      const label = ferrataLabel(group, translate);
      return { name: label.name, grade: label.grade };
    };
    const legs = crossingLegs(tourWaypoints, analysis?.distanceIndexedProfileSamples ?? [], ferrataCrossings);
    publishTourFerrataCrossings(
      ferrataCrossings.map(({ group, fromM, toM }, i) => ({
        id: group.id,
        ...describe(group),
        fromM,
        toM,
        afterWaypoint: legs[i] ?? null,
      })),
      waypointsAtFerrataEnds(tourWaypoints, ferrataCrossings, describe)
    );
  }, [analysis, ferrataCrossings, tourWaypoints, translate]);
  useEffect(() => () => publishTourFerrataCrossings([]), []);
  // The click that closes a ferrata's or a paddle obstacle's card must not also add a waypoint under it.
  const closingPress = useOutsidePressGuard();
  const paddleOpen = usePaddleObstacleStore((state) => state.selectedRef !== null);
  const adoptFerrata = useFerrataAdopt(tourPlanner, canPlaceEdit, ferrata.close);
  // PAD-05B: a put-in, slipway or egress taken over from its card as the tour's next point.
  const placeFromCard =
    canPlaceEdit && tourPlanner.isPaddle && !tourPlanner.isSaving && tourPlanner.mode.type !== 'view-gpx'
      ? (lat: number, lng: number) => {
          tourPlanner.addWaypoint(lat, lng);
          selectPaddleObstacle(null);
        }
      : undefined;
  const ferrataOnTour = useMemo(() => new Set(ferrataCrossings.map(({ group }) => group.id)), [ferrataCrossings]);
  const distanceUnit = useSettingsStore((s) => s.settings.distance_unit);
  // The "set points" tool, per mode; only a real click places, never the end of a drag.
  const { waypoints, placeTool, placeOn, attachSurface, placedHint } = useTourMapPoints({
    tourPlanner,
    canPlaceEdit,
    mode: terrain3d ? '3d' : '2d',
    cardOpen: !!ferrataSelected || paddleOpen,
    guard: closingPress.guard,
    previewPoints: tourMap.previewPoints,
  });
  // PAD-03 on a recorded paddle track: with a marking tool on, a click on the line marks the spot on it.
  const { pickOnLine, onAddOrMark } = useTrackLinePick(tourPlanner, canPlaceEdit, closingPress.guard, waypoints.onAdd);
  // P2A-03: a click on the route being edited sets a shaping point there.
  const shapeAt = useShapingClick(tourPlanner, { editable: !!waypoints.onMove, picking: pickOnLine });
  // What each panel covers of the map, a collapsed one its rail.
  const leftInset = leftHidden ? 56 : leftPanelPx;
  const rightInset = rightHidden ? 56 : rightPanelPx;
  const bottomRowTop = terrain3d ? CONTROL_GAP + terrainControlsPx + CONTROL_GAP : FERRATA_CARD_BOTTOM;
  return (
    <>
      {/* Around either map, to follow its presses and show the crosshair while placing. */}
      <div
        ref={attachSurface}
        className={`absolute inset-0 ${placeOn || pickOnLine ? PLACING_CURSOR : ''}`}
        data-testid="tour-map-surface"
        data-placing={placeOn || undefined}
      >
        {terrain3d ? (
          <Suspense fallback={null}>
            <TourTerrainMap
              samples={analysis?.distanceIndexedProfileSamples ?? []}
              routes={tourMap.route}
              trackColor={TOUR_TRACK_COLOR}
              unit={distanceUnit}
              baseLayer={baseLayer}
              onBaseLayerChange={tourPlanner.setMapBaseLayer}
              tourLayers={tourLayers}
              onExit={() => setTerrain3d(false)}
              focus={tourPlanner.routeProfileFocus}
              onFocusChange={tourPlanner.setRouteProfileFocus}
              leftWidth={leftInset}
              rightWidth={rightInset}
              waypoints={waypoints}
              framePoints={tourMap.focusPoints}
              water={tourPlanner.isPaddle}
              ferrataLayer={ferrataLayer}
              onViewportChange={viewportChanged}
              onControlsHeightChange={setTerrainControlsPx}
              onLegendLayout={setTerrainLegend}
              placeTool={placeTool}
            />
          </Suspense>
        ) : (
          <MapView
            tripId={tripId}
            places={[]}
            route={tourMap.route}
            routeWalking={tourMap.routeWalking}
            routeColors={tourMap.routeColors}
            followSelection={false}
            onMapClick={
              onAddOrMark
                ? ({ latlng }: { latlng: { lat: number; lng: number } }) => onAddOrMark(latlng.lat, latlng.lng)
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
            onRouteClick={shapeAt}
            routeProfileFocus={tourPlanner.routeProfileFocus}
            viewBaseLayer={baseLayer}
            onViewBaseLayerChange={tourPlanner.setMapBaseLayer}
            tourLayers={tourLayers}
            onToggleTerrain3d={() => setTerrain3d(true)}
            ferrataLayer={ferrataLayer}
            onViewportChange={viewportChanged}
            placeTool={placeTool}
          />
        )}
      </div>
      {/* The card sits at the inline end; the panels keep their physical sides, so in a
          right-to-left language that end is the left panel's. */}
      <FerrataDetailOverlay
        selection={ferrataSelected}
        onClose={ferrata.close}
        onOutsidePress={closingPress.arm}
        insetEnd={(isRtlLanguage(language) ? leftInset : rightInset) + MAP_LAYER_SWITCHER_INSET}
        {...ferrataCardPlacement(terrain3d, bottomRowTop, terrainLegend)}
        onAdopt={adoptFerrata}
        onTourIds={ferrataOnTour}
      />
      <PaddleObstacleOverlay
        onOutsidePress={closingPress.arm}
        insetEnd={(isRtlLanguage(language) ? leftInset : rightInset) + MAP_LAYER_SWITCHER_INSET}
        {...ferrataCardPlacement(terrain3d, bottomRowTop, terrainLegend)}
        extra={(detail) => (
          <>
            {paddleChecklist && <ChecklistObstaclePanel checklist={paddleChecklist} featureRef={detail.feature.ref} />}
            {placeFromCard && (
              <PaddleObstaclePlaceButton
                kind={detail.feature.kind}
                geometry={detail.feature.geometry}
                onPlace={placeFromCard}
              />
            )}
          </>
        )}
      />
      {/* "Point set", with the way back, above the bottom row and between the panels. */}
      {placedHint.shown && (
        <div
          className="pointer-events-none absolute inset-x-0 z-[19] flex justify-center"
          style={{ bottom: bottomRowTop }}
        >
          <div
            className="flex justify-center"
            style={{
              transform: `translateX(${(leftInset - rightInset) / 2}px)`,
              maxWidth: `calc(100% - ${leftInset + rightInset + 2 * MAP_LAYER_SWITCHER_INSET}px)`,
            }}
          >
            <MapUndoHint
              key={placedHint.key}
              message={t('tours.planner.pointPlaced')}
              undoLabel={t('undo.button')}
              onUndo={placedHint.undoPlacement}
              onHold={placedHint.hold}
            />
          </div>
        </div>
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
            placeholder={t('tours.planner.mapSearch')}
            ariaLabel={t('tours.planner.mapSearch')}
            floating
            showSearchStatus
            showSource
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </>
  );
}
