import { useCallback, useState } from 'react';
import type { TourBaseLayer } from '../../Map/MapLayerSwitcher';

/**
 * How the planner's map looks, kept with the planner so it lasts while tours
 * are opened, saved and closed: the base layer and the overlays switched on.
 * Planner-local by design (P2B-07): nothing here touches the global map
 * setting, and none of it changes a tour.
 */
export function useTourMapView() {
  const [mapBaseLayer, setMapBaseLayer] = useState<TourBaseLayer>('default');
  const [mapOverlays, setMapOverlays] = useState<ReadonlySet<string>>(() => new Set());
  const toggleMapOverlay = useCallback((id: string) => {
    setMapOverlays((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }, []);
  return { mapBaseLayer, setMapBaseLayer, mapOverlays, toggleMapOverlay };
}
