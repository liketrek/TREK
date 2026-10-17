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
 * and a round marker with its glyph; the quieter, the less it bears on the
 * route, and the objects only in the area wait for a closer zoom. A click
 * picks the object and goes no further, so it never also sets a waypoint
 * under it.
 */
export function PaddleLayerLeaflet({ layer }: { layer?: PaddleMapLayer }) {
  const label = useLabel();
  const map = useMap();
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
