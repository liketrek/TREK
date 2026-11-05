import L from 'leaflet';
import { coveredConnectionsShown } from './journeyMapConnections';
import type { JourneyMapLayerVisibility } from './journeyMapLayers';
import { MARK_CLUSTER_PX, clusterPoints, markHitSvg, type JourneyMapMark, type WorldPx } from './journeyMapMarks';

/**
 * The layers of the Leaflet journey map a switch takes off and puts back (JRN-04),
 * plus the stretches between entries a recording already shows, which follow two.
 */
export type LeafletLayerKind = keyof JourneyMapLayerVisibility | 'coveredConnections';
export type DrawnLayers = Record<LeafletLayerKind, L.Layer[]>;

export const NOTHING_DRAWN = (): DrawnLayers => ({ plan: [], recorded: [], entries: [], coveredConnections: [] });

/** Whether a layer of this kind is on the map with these switches. */
export function isLeafletLayerShown(kind: LeafletLayerKind, visibility: JourneyMapLayerVisibility): boolean {
  return kind === 'coveredConnections' ? coveredConnectionsShown(visibility) : visibility[kind];
}

/**
 * Puts each layer whose switch changed back on the map or takes it off,
 * exactly as it was drawn, and answers what is shown now.
 */
export function switchLeafletLayers(
  map: L.Map | null,
  drawn: DrawnLayers,
  shown: JourneyMapLayerVisibility,
  next: JourneyMapLayerVisibility
): JourneyMapLayerVisibility {
  if (!map) return shown;
  for (const kind of Object.keys(drawn) as LeafletLayerKind[]) {
    const visible = isLeafletLayerShown(kind, next);
    if (isLeafletLayerShown(kind, shown) === visible) continue;
    for (const layer of drawn[kind]) {
      if (visible) layer.addTo(map);
      else layer.remove();
    }
  }
  return next;
}

/**
 * World pixels at the map's current zoom, through the map's own CRS so a
 * GCJ-02 basemap groups where it draws. Only meaningful once the map has a view.
 */
export function leafletWorldPx(map: L.Map): WorldPx {
  const zoom = map.getZoom();
  return (lat, lng) => map.project([lat, lng], zoom);
}

/**
 * The plan's places and the stays as one layer: below the entry pins, above
 * the photo thumbnails, joined only where they would overlap on screen.
 * Null while there is nothing to draw or the map has no view yet.
 */
export function drawLeafletMarks(
  map: L.Map,
  marks: readonly JourneyMapMark[] | undefined,
  onPick: (members: JourneyMapMark[]) => void
): L.LayerGroup | null {
  if (!marks?.length) return null;
  try {
    map.getCenter();
  } catch {
    // No view yet: the moveend after the first fit draws them.
    return null;
  }
  const group = L.layerGroup();
  for (const hit of clusterPoints(marks, leafletWorldPx(map), MARK_CLUSTER_PX)) {
    const look = markHitSvg(hit.members);
    const marker = L.marker([hit.lat, hit.lng], {
      icon: L.divIcon({
        className: '',
        iconSize: [look.width, look.height],
        iconAnchor: [look.width / 2, look.anchor === 'bottom' ? look.height : look.height / 2],
        html: look.html,
      }),
      zIndexOffset: -200,
      keyboard: false,
    });
    marker.on('click', () => onPick(hit.members));
    group.addLayer(marker);
  }
  group.addTo(map);
  return group;
}
