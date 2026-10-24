import {
  CYCLOSM_TILE_ATTRIBUTION,
  CYCLOSM_TILE_MAXZOOM,
  CYCLOSM_TILE_URL,
  OPENHIKINGMAP_TILE_ATTRIBUTION,
  OPENHIKINGMAP_TILE_MAXZOOM,
  OPENHIKINGMAP_TILE_URL,
  OPENTOPOMAP_TILE_ATTRIBUTION,
  OPENTOPOMAP_TILE_MAXZOOM,
  OPENTOPOMAP_TILE_URL,
} from '../../constants/mapDefaults';

/** The raster base maps only the Tours planner offers, drawn the same way by Leaflet, GL and the 3D map. */
export type TourRasterBase = 'topo' | 'hiking' | 'cycle';

export interface TourRasterBaseSource {
  /** The Leaflet template; `{s}` is a shard Leaflet fills in. */
  url: string;
  /** The same tiles spelled out for a GL source, which knows no shards. */
  tiles: string[];
  attribution: string;
  maxZoom: number;
  /**
   * A map its operator offers on terms (MAP-01, BIK-06): loaded only as viewed, never
   * prefetched or kept offline, its credit readable without a click, and watched for whether it
   * answers. `credit` is what the 3D map shows above its controls.
   */
  onTerms?: { credit: ReadonlyArray<{ label: string; href: string }> };
}

export const TOUR_RASTER_BASES: Record<TourRasterBase, TourRasterBaseSource> = {
  topo: {
    url: OPENTOPOMAP_TILE_URL,
    tiles: ['a', 'b', 'c'].map((shard) => OPENTOPOMAP_TILE_URL.replace('{s}', shard)),
    attribution: OPENTOPOMAP_TILE_ATTRIBUTION,
    maxZoom: OPENTOPOMAP_TILE_MAXZOOM,
  },
  hiking: {
    url: OPENHIKINGMAP_TILE_URL,
    tiles: [OPENHIKINGMAP_TILE_URL],
    attribution: OPENHIKINGMAP_TILE_ATTRIBUTION,
    maxZoom: OPENHIKINGMAP_TILE_MAXZOOM,
    onTerms: {
      credit: [
        { label: '\u00a9 OpenHikingMap', href: 'https://wiki.openstreetmap.org/wiki/OpenHikingMap' },
        { label: '\u00a9 OpenStreetMap', href: 'https://www.openstreetmap.org/copyright' },
        { label: '\u2764\ufe0f Donation', href: 'https://openmaps.fr/donate' },
      ],
    },
  },
  cycle: {
    url: CYCLOSM_TILE_URL,
    tiles: ['a', 'b', 'c'].map((shard) => CYCLOSM_TILE_URL.replace('{s}', shard)),
    attribution: CYCLOSM_TILE_ATTRIBUTION,
    maxZoom: CYCLOSM_TILE_MAXZOOM,
    onTerms: {
      credit: [
        { label: '\u00a9 CyclOSM', href: 'https://www.cyclosm.org' },
        { label: '\u00a9 OpenStreetMap', href: 'https://www.openstreetmap.org/copyright' },
      ],
    },
  },
};

export const TOUR_RASTER_BASE_IDS = Object.keys(TOUR_RASTER_BASES) as TourRasterBase[];

/** The raster source of a base layer, or null for the user's own map and the imagery. */
export function tourRasterBaseOf(layer: string): TourRasterBaseSource | null {
  return Object.prototype.hasOwnProperty.call(TOUR_RASTER_BASES, layer)
    ? TOUR_RASTER_BASES[layer as TourRasterBase]
    : null;
}

/** Whether the layer is a map its operator offers on terms (OpenHikingMap, CyclOSM). */
export function isOnTermsBase(layer: string): layer is TourRasterBase {
  return !!tourRasterBaseOf(layer)?.onTerms;
}

/**
 * Whether a best-effort tile source still answers: a run of failed tiles marks
 * it down, one tile arriving clears that. The maps report into it, the switch
 * shows it.
 */
export interface TileHealth {
  down: boolean;
  onTileError: () => void;
  onTileLoad: () => void;
}

/** The health of the map on terms that is the base map now, with which one it is. */
export interface BaseMapHealth extends TileHealth {
  base: TourRasterBase;
}

/** A Leaflet tile layer's events that report into the health of `layer`, while it is the map watched. */
export function tileHealthHandlers(health: BaseMapHealth | undefined, layer: string) {
  return health?.base === layer ? { tileerror: health.onTileError, tileload: health.onTileLoad } : undefined;
}
