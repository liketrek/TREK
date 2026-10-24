import L from 'leaflet';
import { useMemo, useState } from 'react';
import { Marker, Polyline, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { useTranslation } from '../../../i18n';
import {
  isPaddleItemSelected,
  markerSize,
  paddleItemsAtZoom,
  paddleMarkerHtml,
  type PaddleMapItem,
  type PaddleMapLayer,
} from './paddleMapLayer';

const LINE_WEIGHT = { on_route: 4, near: 3, area: 2 } as const;

/**
 * The pane the paddle lines are drawn in: under the overlay pane the tour's
 * route is in, so a rule that covers a whole river never hides the line
 * planned along it. The markers stay in the marker pane above, where they are
 * picked.
 */
const LINE_PANE = 'trek-paddle-lines';

/** Makes the line pane on a map that has none yet; undefined where the renderer has no panes, which then stacks by order. */
function ensureLinePane(map: L.Map): string | undefined {
  if (typeof map.getPane !== 'function' || typeof map.createPane !== 'function') return undefined;
  if (!map.getPane(LINE_PANE)) {
    const pane = map.createPane(LINE_PANE);
    pane.style.zIndex = '397';
    // The app's stylesheet levels every pane (`.leaflet-pane { z-index: 0 !important }`), so
    // the order in the map pane decides: right before the overlay pane, under the route.
    const overlay = map.getPane('overlayPane');
    if (overlay?.parentElement) overlay.parentElement.insertBefore(pane, overlay);
  }
  return LINE_PANE;
}

/** The line pane, made once per map before the first line is drawn into it. */
function useLinePane(): string | undefined {
  const map = useMap();
  const [pane] = useState(() => ensureLinePane(map));
  return pane;
}
const LINE_OPACITY = { on_route: 1, near: 0.85, area: 0.5 } as const;

function iconOf(item: PaddleMapItem, selected: boolean): L.DivIcon {
  const size = markerSize(item.relation, selected);
  return L.divIcon({
    html: paddleMarkerHtml(item, selected),
    className: 'trek-paddle-pin',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/** What a marker's tooltip says: the kind of object and its name, if it has one. */
function useLabel() {
  const { t } = useTranslation();
  return (item: PaddleMapItem) => {
    const kind = t(`tours.paddle.obstacle.kind.${item.feature.kind}`);
    return item.feature.name ? `${kind}: ${item.feature.name}` : kind;
  };
}

/**
 * The paddle obstacles on the Leaflet map (PAD-05B): each line on a white
 * casing in its category's colour, dashed while it is only near the route,
 * and under the tour's route so it never hides it,
 * and a round marker with its glyph; the quieter, the less it bears on the
 * route, and the objects only in the area wait for a closer zoom. A click
 * picks the object and goes no further, so it never also sets a waypoint
 * under it.
 */
export function PaddleLayerLeaflet({ layer }: { layer?: PaddleMapLayer }) {
  const label = useLabel();
  const map = useMap();
  const linePane = useLinePane();
  const [zoom, setZoom] = useState(() => map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  const selectedRef = layer?.selectedRef ?? null;
  const selectedKey = layer?.selectedKey ?? null;
  const all = layer?.items;
  const items = useMemo(() => (all ? paddleItemsAtZoom(all, zoom, selectedRef) : undefined), [all, zoom, selectedRef]);
  // Rebuilt only when the items or the selection change, not on every render of the map.
  const icons = useMemo(
    () =>
      new Map(
        (items ?? []).map((item) => [
          item.feature.ref,
          iconOf(item, isPaddleItemSelected(item, selectedRef, selectedKey)),
        ])
      ),
    [items, selectedRef, selectedKey]
  );
  if (!layer || !items?.length) return null;
  const select = (ref: string) => ({
    click: (event: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(event);
      layer.onSelect(ref);
    },
  });
  return (
    <>
      {items.map((item) =>
        item.line ? (
          <Polyline
            key={`${item.feature.ref}-casing`}
            positions={item.line}
            pane={linePane}
            pathOptions={{
              color: item.disc,
              weight: LINE_WEIGHT[item.relation] + 3,
              opacity: LINE_OPACITY[item.relation],
            }}
            interactive={false}
          />
        ) : null
      )}
      {items.map((item) =>
        item.line ? (
          <Polyline
            key={`${item.feature.ref}-line`}
            positions={item.line}
            pane={linePane}
            bubblingMouseEvents={false}
            pathOptions={{
              color: item.color,
              weight: LINE_WEIGHT[item.relation],
              opacity: LINE_OPACITY[item.relation],
              dashArray: item.relation === 'near' ? '6 5' : undefined,
              lineCap: 'round',
            }}
            eventHandlers={select(item.feature.ref)}
          />
        ) : null
      )}
      {items.map((item) => (
        <Marker
          key={`${item.feature.ref}-pin`}
          position={item.marker}
          icon={icons.get(item.feature.ref) as L.DivIcon}
          zIndexOffset={
            isPaddleItemSelected(item, selectedRef, selectedKey) ? 900 : item.relation === 'on_route' ? 600 : 300
          }
          eventHandlers={select(item.feature.ref)}
        >
          <Tooltip direction="top" offset={[0, -12]} opacity={1} className="map-tooltip">
            {label(item)}
          </Tooltip>
        </Marker>
      ))}
    </>
  );
}
