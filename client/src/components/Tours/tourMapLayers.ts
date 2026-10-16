import type { TourTypeKey } from '@trek/shared';
import type { TourBaseLayer } from '../Map/MapLayerSwitcher';

/**
 * P2B-06: which maps the tour planner offers for each tour type. The planner
 * reads this one table; the global map setting is never touched, and a choice
 * made here lasts only as long as the planner keeps it.
 *
 * A base layer is the map itself (one at a time). An overlay is information
 * laid over it and switched on its own; it is off until the user turns it on.
 * Only sources TREK already ships or that a card cleared are listed: OpenTopoMap
 * and the Esri imagery the planner had, the via ferrata layer (RC-10) and
 * OpenSeaMap's seamarks (PAD-10).
 *
 * - Hike: the standard map first, as before; topo and satellite beside it; via ferratas.
 * - Paddle: the standard map, whose water reads clearly, and satellite. No topo and
 *   no ferratas, those are hiking maps. Seamarks as an overlay.
 * - Any other type (switched off, or one this build does not plan): the standard map
 *   and satellite, no overlays.
 *
 * If an overlay fails, the base map and the planning go on; the switch says so.
 */
type TourOverlayId = 'ferratas' | 'seamarks';

export interface TourMapLayerSet {
  bases: readonly TourBaseLayer[];
  defaultBase: TourBaseLayer;
  overlays: readonly TourOverlayId[];
}

const HIKE: TourMapLayerSet = {
  bases: ['default', 'topo', 'satellite'],
  defaultBase: 'default',
  overlays: ['ferratas'],
};
const PADDLE: TourMapLayerSet = { bases: ['default', 'satellite'], defaultBase: 'default', overlays: ['seamarks'] };
const OTHER: TourMapLayerSet = { bases: ['default', 'satellite'], defaultBase: 'default', overlays: [] };

export function tourMapLayersFor(type: TourTypeKey | null | undefined): TourMapLayerSet {
  if (type === 'hike') return HIKE;
  if (type === 'kayak') return PADDLE;
  return OTHER;
}

/** The base layer to show: the one chosen while this type offers it, else the type's own default. */
export function baseLayerFor(set: TourMapLayerSet, chosen: TourBaseLayer): TourBaseLayer {
  return set.bases.includes(chosen) ? chosen : set.defaultBase;
}

/**
 * OpenSeaMap's transparent seamark layer, as its embedding guide names it:
 * HTTPS, the seamark path only, no basemap of theirs. Tiles CC-BY-SA 2.0, data
 * ODbL. Checked on 16.10.2026: from zoom 6 to 18 every tile answers 200 with a
 * PNG (an empty one is transparent), CORS open, no Cache-Control; so a failed
 * tile means the service is unreachable, not that the water has no seamarks.
 */
export const SEAMARK_OVERLAY = {
  id: 'seamarks',
  url: 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
  attribution:
    'Seamarks &copy; <a href="https://www.openseamap.org">OpenSeaMap</a> contributors (<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC BY-SA 2.0</a>)',
  minZoom: 6,
  maxZoom: 18,
} as const;
