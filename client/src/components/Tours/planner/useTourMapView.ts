import { useCallback, useEffect, useState } from 'react';
import type { TourBaseLayer } from '../../Map/MapLayerSwitcher';

const STORAGE_KEY = 'trek.tours.mapView';
const BASE_LAYERS: readonly TourBaseLayer[] = ['default', 'satellite', 'topo', 'hiking', 'cycle'];

interface StoredView {
  base: TourBaseLayer;
  on: string[];
  off: string[];
}

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

/** The map choice left in this browser; a blocked, cleared or damaged storage gives the defaults. */
function readView(): StoredView {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (raw && typeof raw === 'object') {
      const { base, on, off } = raw as Record<string, unknown>;
      return {
        base: BASE_LAYERS.find((layer) => layer === base) ?? 'default',
        on: strings(on),
        off: strings(off),
      };
    }
  } catch {
    // Unreadable storage: the defaults.
  }
  return { base: 'default', on: [], off: [] };
}

function storeView(view: StoredView): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(view));
  } catch {
    // Private mode or blocked storage: the map starts from its defaults next time.
  }
}

interface OverlayChoice {
  /** Switched on by hand. */
  on: ReadonlySet<string>;
  /** Switched off by hand: an overlay on by default for a type (the pistes on a ski tour, SKI-01) stays off. */
  off: ReadonlySet<string>;
}

/**
 * How the planner's map looks, kept with the planner so it lasts while tours
 * are opened, saved and closed, and across a reload like the rail folds: the
 * base layer and the overlays switched on or off by hand. Planner-local by
 * design (P2B-07): nothing here touches the global map setting, and none of
 * it changes a tour.
 */
export function useTourMapView() {
  const [initial] = useState(readView);
  const [mapBaseLayer, setMapBaseLayer] = useState<TourBaseLayer>(initial.base);
  const [overlays, setOverlays] = useState<OverlayChoice>(() => ({
    on: new Set(initial.on),
    off: new Set(initial.off),
  }));
  useEffect(() => {
    storeView({
      base: mapBaseLayer,
      on: [...overlays.on],
      off: [...overlays.off],
    });
  }, [mapBaseLayer, overlays]);
  /**
   * An overlay switched by hand. `shown` is whether it shows now, for an
   * overlay that can show without being switched on; left out, it shows
   * while it is switched on.
   */
  const toggleMapOverlay = useCallback((id: string, shown?: boolean) => {
    setOverlays(({ on, off }) => {
      const nextOn = new Set(on);
      const nextOff = new Set(off);
      if (shown ?? on.has(id)) {
        nextOn.delete(id);
        nextOff.add(id);
      } else {
        nextOn.add(id);
        nextOff.delete(id);
      }
      return { on: nextOn, off: nextOff };
    });
  }, []);
  return { mapBaseLayer, setMapBaseLayer, mapOverlays: overlays.on, mapOverlaysOff: overlays.off, toggleMapOverlay };
}
