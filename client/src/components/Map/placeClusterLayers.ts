/**
 * The GL map's cluster bubbles for the trip's places (MapViewGL draws them):
 * named here so the layers drawn over them, the assistant's route lines among
 * them, can leave a tap on a bubble to the bubble.
 */
export const PLACE_CLUSTER_CIRCLE_LAYER_ID = 'trip-place-clusters-circle';
export const PLACE_CLUSTER_COUNT_LAYER_ID = 'trip-place-clusters-count';

// Marker grouping for the GL map (#1385): MapLibre/Mapbox can't show the rich
// HTML photo markers *and* cluster them natively, so we feed the place points
// into a clustered GeoJSON source. The source decides what is clustered; the
// bubbles are drawn as DOM (`drawClusterBubbles`) and the individual rich HTML
// markers only for the points the source reports as currently unclustered.
// Grouping is always on, matching the Leaflet map's MarkerClusterGroup.
export const PLACE_CLUSTER_SOURCE_ID = 'trip-place-clusters';
const PLACE_UNCLUSTERED_LAYER_ID = 'trip-place-unclustered-hit';

/**
 * How eagerly place markers merge into a cluster.
 *
 * The overview band the Leaflet map clusters in as well (`CLUSTER_UNTIL_ZOOM` there),
 * kept as plain numbers rather than shared constants so the GL bundle does not have to
 * carry Leaflet for them. Above the cutoff supercluster hands every point back on its
 * own, and the stops that share a coordinate are folded together at the pin level
 * instead — see the reconcile in MapViewGL.
 */
const CLUSTER_RADIUS = 20;
const CLUSTER_MAX_ZOOM = 8;

/** The part of either SDK's map the cluster code calls. */
export interface ClusterMap {
  addSource: (id: string, source: object) => void;
  addLayer: (layer: object) => void;
  getSource: (id: string) => unknown;
  easeTo: (options: { center: unknown[]; zoom: number; duration: number }) => void;
  querySourceFeatures: (id: string, options: { filter: unknown[] }) => ClusterFeature[] | null | undefined;
}

interface ClusterFeature {
  properties?: { cluster_id?: unknown; point_count?: unknown } | null;
  geometry?: { coordinates?: unknown };
}

interface ClusterSource {
  getClusterExpansionZoom?: (id: unknown, done: (err: Error | null, zoom: number) => void) => unknown;
}

/** The cluster source and the three layers over it. Extracted so the rebuild on a mode
 *  change and the initial build cannot drift apart. */
export function addPlaceClusterLayers(map: Pick<ClusterMap, 'addSource' | 'addLayer'>): void {
  map.addSource(PLACE_CLUSTER_SOURCE_ID, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
    cluster: true,
    clusterRadius: CLUSTER_RADIUS,
    clusterMaxZoom: CLUSTER_MAX_ZOOM,
  });
  // Invisible: the bubble the user sees is DOM (createClusterBubble), these two
  // layers stay as the hit area the track and route layers check a click against.
  map.addLayer({
    id: PLACE_CLUSTER_CIRCLE_LAYER_ID,
    type: 'circle',
    source: PLACE_CLUSTER_SOURCE_ID,
    filter: ['has', 'point_count'],
    paint: {
      'circle-opacity': 0,
      'circle-stroke-opacity': 0,
      'circle-radius': ['step', ['get', 'point_count'], 18, 10, 21, 50, 24],
    },
  });
  map.addLayer({
    id: PLACE_CLUSTER_COUNT_LAYER_ID,
    type: 'symbol',
    source: PLACE_CLUSTER_SOURCE_ID,
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-size': 12,
      'text-allow-overlap': true,
    },
    paint: { 'text-opacity': 0 },
  });
  map.addLayer({
    id: PLACE_UNCLUSTERED_LAYER_ID,
    type: 'circle',
    source: PLACE_CLUSTER_SOURCE_ID,
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-radius': 24,
      'circle-opacity': 0,
      'circle-stroke-opacity': 0,
    },
  });
}

/** Eases the map in to the zoom a cluster falls apart at. Both SDKs answer that
 *  question, one through a callback and one through a promise. */
export function expandCluster(
  map: Pick<ClusterMap, 'getSource' | 'easeTo'>,
  clusterId: unknown,
  coordinates: unknown
): void {
  if (clusterId == null || !Array.isArray(coordinates)) return;
  const source = map.getSource(PLACE_CLUSTER_SOURCE_ID) as ClusterSource | undefined;
  const easeToZoom = (nextZoom: number) => {
    try {
      map.easeTo({ center: coordinates, zoom: nextZoom, duration: 350 });
    } catch {
      /* noop */
    }
  };
  try {
    const maybeZoom = source?.getClusterExpansionZoom?.(clusterId, (err, nextZoom) => {
      if (!err && typeof nextZoom === 'number') easeToZoom(nextZoom);
    });
    if (typeof maybeZoom === 'number') easeToZoom(maybeZoom);
    else if (maybeZoom instanceof Promise) maybeZoom.then(easeToZoom).catch(() => {});
  } catch {
    /* noop */
  }
}

/**
 * Puts one count bubble on the map per cluster the source currently reports, through
 * `place` (the caller's pin factory), and returns what `place` handed back. A cluster
 * crossing a tile edge comes back once per tile, so bubbles are keyed by cluster id.
 */
export function drawClusterBubbles<T>(map: ClusterMap, place: (el: HTMLElement, lng: number, lat: number) => T): T[] {
  const pins: T[] = [];
  const seen = new Set<unknown>();
  for (const feature of map.querySourceFeatures(PLACE_CLUSTER_SOURCE_ID, { filter: ['has', 'point_count'] }) ?? []) {
    const clusterId = feature?.properties?.cluster_id;
    const count = feature?.properties?.point_count;
    const coordinates = feature?.geometry?.coordinates;
    if (typeof count !== 'number' || !Array.isArray(coordinates) || seen.has(clusterId)) continue;
    seen.add(clusterId);
    const el = createClusterBubble(count);
    el.addEventListener('click', (ev) => {
      ev.stopPropagation();
      expandCluster(map, clusterId, coordinates);
    });
    pins.push(place(el, coordinates[0], coordinates[1]));
  }
  return pins;
}

/** A count bubble's diameter in pixels: both renderers size their bubbles by it. */
export function clusterBubbleSize(count: number): number {
  return count < 10 ? 36 : count < 50 ? 42 : 48;
}

/**
 * A count bubble as DOM, styled by `.marker-cluster-custom` in index.css.
 *
 * The GL map draws its bubbles with this element rather than as canvas text, so they
 * read in the app's own font and get the same hover the Leaflet map has. A canvas
 * symbol layer can only use the glyphs the map style ships and knows no `:hover`.
 * The bubble sits in a bare wrapper because the pin positions its element through
 * `transform`, which would otherwise override the hover's scale.
 */
export function createClusterBubble(count: number): HTMLDivElement {
  const size = clusterBubbleSize(count);
  const bubble = document.createElement('div');
  bubble.className = 'marker-cluster-custom';
  bubble.style.width = `${size}px`;
  bubble.style.height = `${size}px`;
  const label = document.createElement('span');
  label.textContent = String(count);
  bubble.appendChild(label);
  const wrapper = document.createElement('div');
  wrapper.appendChild(bubble);
  return wrapper;
}
