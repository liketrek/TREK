import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { useFerrataMapLayer } from '../../components/Ferratas/useFerrataMapLayer';
import { paddleMapItems, selectedPaddleKey } from '../../components/Tours/paddle/paddleMapLayer';
import { usePaddlePaint } from '../../components/Tours/paddle/paddlePaint';
import type { TourPlannerController } from '../../components/Tours/planner/useTourPlanner';
import { baseLayerFor, SEAMARK_OVERLAY, tourMapLayersFor } from '../../components/Tours/tourMapLayers';
import { useTourRasterOverlay } from '../../components/Tours/useTourRasterOverlay';
import { selectPaddleObstacle, usePaddleObstacleStore } from '../../store/paddleObstacleStore';

const NO_CROSSINGS: never[] = [];

type FerrataLayerState = ReturnType<typeof useFerrataMapLayer>;

/**
 * What the planner map shows for the tour in it (P2B-06/07): the base layers
 * and overlays of its type, an import with its own type's and a draft with the
 * one chosen. A type without the via ferrata layer, or no tour open at all,
 * neither draws nor warns about ferratas, even if the layer was switched on before; a base layer it
 * does not offer falls back to its default without changing the choice kept.
 */
export function useTourStageLayers(
  tourPlanner: Pick<TourPlannerController, 'mode' | 'tourType' | 'mapBaseLayer' | 'mapOverlays' | 'toggleMapOverlay'>,
  ferrata: FerrataLayerState
) {
  const { mode } = tourPlanner;
  const layerSet = tourMapLayersFor(mode.type === 'view-gpx' ? mode.tour.tour_type : tourPlanner.tourType);
  // With no tour open nothing is a hike yet: the ferratas wait for one, as the seamarks wait for a paddle tour.
  const offersFerratas = mode.type !== 'neutral' && layerSet.overlays.includes('ferratas');
  const { toggleMapOverlay } = tourPlanner;
  const toggleSeamarks = useCallback(() => toggleMapOverlay(SEAMARK_OVERLAY.id), [toggleMapOverlay]);
  const seamarks = useTourRasterOverlay(
    SEAMARK_OVERLAY,
    layerSet.overlays.includes('seamarks'),
    tourPlanner.mapOverlays.has(SEAMARK_OVERLAY.id),
    toggleSeamarks
  );
  // PAD-05B: the obstacles the sync hook read around the paddle tour, only while one is open.
  const { features, related, selectedRef } = usePaddleObstacleStore(
    useShallow((state) => ({ features: state.features, related: state.related, selectedRef: state.selectedRef }))
  );
  const paddlePaint = usePaddlePaint();
  const paddleItems = useMemo(() => paddleMapItems(features, related, paddlePaint), [features, related, paddlePaint]);
  const paddle = useMemo(
    () =>
      paddleItems.length
        ? {
            items: paddleItems,
            selectedRef,
            selectedKey: selectedPaddleKey(features, selectedRef),
            onSelect: selectPaddleObstacle,
          }
        : undefined,
    [paddleItems, features, selectedRef]
  );
  const tourLayers = useMemo(
    () => ({ bases: layerSet.bases, overlays: layerSet.overlays.includes('seamarks') ? [seamarks] : [], paddle }),
    [layerSet, seamarks, paddle]
  );
  return {
    baseLayer: baseLayerFor(layerSet, tourPlanner.mapBaseLayer),
    tourLayers,
    ferrataLayer: offersFerratas ? ferrata.layer : undefined,
    ferrataCrossings: offersFerratas ? ferrata.crossings : NO_CROSSINGS,
    ferrataSelected: offersFerratas ? ferrata.selected : null,
  };
}
