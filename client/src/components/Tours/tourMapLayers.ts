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
 * and the Esri imagery the planner had, OpenHikingMap (MAP-01), the via ferrata
 * layer (RC-10), OpenSeaMap's seamarks (PAD-10) and OpenSnowMap's pistes (SKI-01).
 *
 * - Hike: the standard map first, as before; topo, OpenHikingMap (MAP-01, while the admin
 *   allows it) and satellite beside it; via ferratas. A hike is summer only: winter hiking and
 *   snowshoeing are ski tours, so the pistes are not offered here.
 * - Bike (BIK-01): the standard map, topo for the climbs, CyclOSM (BIK-06, while the admin
 *   allows it) and satellite. No ferratas, a bike tour climbs none.
 * - Run (RUN-01): the standard map, topo for the climbs and satellite. No ferratas, a run
 *   takes none.
 * - Ski (SKI-02): the standard map, topo for the slopes and satellite. No ferratas. The
 *   pistes as an overlay (SKI-01), the only type that offers them, shown until switched off.
 * - Paddle: the standard map, whose water reads clearly, and satellite. No topo and
 *   no ferratas, those are hiking maps. Seamarks as an overlay.
 * - Horse (HOR-01): the standard map, topo for the lie of the land and satellite for
 *   the tracks on the ground. No ferratas, a horse climbs none.
 * - Any other type (switched off, or one this build does not plan): the standard map
 *   and satellite, no overlays.
 *
 * The planner offers the pistes with no tour open too, so a ski area can be looked at
 * without any route (useTourStageLayers decides that, as it does for the ferratas).
 *
 * If an overlay fails, the base map and the planning go on; the switch says so.
 */
type TourOverlayId = 'ferratas' | 'seamarks' | 'pistes';

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
const HIKE_WITH_HIKING_MAP: TourMapLayerSet = { ...HIKE, bases: ['default', 'topo', 'hiking', 'satellite'] };
const BIKE: TourMapLayerSet = { bases: ['default', 'topo', 'satellite'], defaultBase: 'default', overlays: [] };
const BIKE_WITH_CYCLE_MAP: TourMapLayerSet = { ...BIKE, bases: ['default', 'topo', 'cycle', 'satellite'] };
const RUN: TourMapLayerSet = { bases: ['default', 'topo', 'satellite'], defaultBase: 'default', overlays: [] };
const SKI: TourMapLayerSet = {
  bases: ['default', 'topo', 'satellite'],
  defaultBase: 'default',
  overlays: ['pistes'],
};
const PADDLE: TourMapLayerSet = { bases: ['default', 'satellite'], defaultBase: 'default', overlays: ['seamarks'] };
const HORSE: TourMapLayerSet = { bases: ['default', 'topo', 'satellite'], defaultBase: 'default', overlays: [] };
const OTHER: TourMapLayerSet = { bases: ['default', 'satellite'], defaultBase: 'default', overlays: [] };

/** `hikingMap`, `cycleMap`: the admin allows OpenHikingMap (MAP-01) and CyclOSM (BIK-06) on this install. */
export function tourMapLayersFor(
  type: TourTypeKey | null | undefined,
  { hikingMap = false, cycleMap = false }: { hikingMap?: boolean; cycleMap?: boolean } = {}
): TourMapLayerSet {
  if (type === 'hike') return hikingMap ? HIKE_WITH_HIKING_MAP : HIKE;
  if (type === 'bike') return cycleMap ? BIKE_WITH_CYCLE_MAP : BIKE;
  if (type === 'run') return RUN;
  if (type === 'ski') return SKI;
  if (type === 'kayak') return PADDLE;
  if (type === 'horse') return HORSE;
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

/**
 * SKI-01: OpenSnowMap's transparent piste layer (pistes, cross-country trails,
 * winter walking trails, toboggan runs and lifts as mapped in OpenStreetMap),
 * only the overlay and never their relief or base maps, which are not cleared
 * for use elsewhere. Tiles CC-BY-SA, data ODbL, both credited in the map's
 * attribution. Their terms forbid bulk downloads: like every overlay it loads
 * only the tiles in view, the tile prefetch and the Service Worker never store
 * it, and the browser sends the page's origin as the referer, which the app's
 * referrer policy (strict-origin-when-cross-origin) keeps. Checked on
 * 20.10.2026: every tile answers 200 with a PNG, an empty one transparent, CORS
 * open; nothing is drawn below zoom 9, and from zoom 19 the server answers a
 * "No tile here" picture instead of a transparent tile, so the layer stops at
 * 18 and the maps enlarge that zoom's tiles further in.
 */
export const PISTE_OVERLAY = {
  id: 'pistes',
  url: 'https://tiles.opensnowmap.org/pistes/{z}/{x}/{y}.png',
  attribution:
    'Pistes &copy; <a href="https://www.opensnowmap.org">OpenSnowMap.org</a> (<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC BY-SA</a>), data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  minZoom: 9,
  maxZoom: 18,
} as const;
