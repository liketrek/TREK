import L from 'leaflet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Marker, Tooltip, useMap } from 'react-leaflet';
import { frameLng, viewLngFrame, type LngFrame } from '../../utils/lngFrame';
import ClusteredPois from './ClusteredPois';
import { makePoiDraggable } from './markerDrag';
import type { Poi } from './poiCategories';
import { poiDetailRowKey, poiDetailRows, poiPinCacheKey, poiPinParts } from './poiMarker';

// Small coloured pin for an OSM "explore" POI — distinct from the photo-circle
// markers of planned places; the colour matches its pill category.
const poiIconCache = new Map<string, L.DivIcon>();
function createPoiIcon(poi: Pick<Poi, 'category' | 'icon' | 'color'>) {
  // One flat disc in the category's colour with its icon, and never the chain's logo.
  // The brands turned a corridor full of petrol stations into a row of advertisements,
  // they were unreadable at pin size, and a brand with no logo on file fell back to a
  // different picture entirely — so no two pins looked alike.
  // A plugin category's key carries its colour and icon too, so two looks never share a pin.
  const cacheKey = poiPinCacheKey(poi);
  const cached = poiIconCache.get(cacheKey);
  if (cached) return cached;
  const { color, svg } = poiPinParts(poi);
  const icon = L.divIcon({
    className: '',
    html: `<div style="position:relative;width:26px;height:26px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 5px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;">${svg}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    tooltipAnchor: [0, -14],
  });
  poiIconCache.set(cacheKey, icon);
  return icon;
}

/**
 * The hover tooltip of an explore POI: its name, and for a plugin POI the rows the
 * plugin knows about it (the GL hover card shows the same, see buildPoiPopupHtml).
 * React text throughout, so nothing a plugin sends is ever read as markup. A POI
 * without rows keeps the bare name it has always had.
 */
function PoiTooltipBody({ poi }: Readonly<{ poi: Poi }>) {
  const rows = poiDetailRows(poi);
  if (!rows.length) return poi.name;
  // w-max because Leaflet's tooltip pane is 0px wide: without an intrinsic width the
  // tooltip shrinks to its narrowest layout and the values wrap a letter per line. The
  // label column stops at 45% and wraps, so a long label leaves its value room too.
  return (
    <div className="w-max max-w-56 whitespace-normal">
      <div className="truncate font-semibold">{poi.name}</div>
      <div className="mt-1 grid grid-cols-[fit-content(45%)_1fr] gap-x-1.5 font-normal" data-testid="poi-details">
        {rows.map((row) => (
          <div key={poiDetailRowKey(row)} className="contents">
            <span className="text-content-muted [overflow-wrap:anywhere]">{row.label}</span>
            <span className="[overflow-wrap:anywhere]">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The explore POIs of the Leaflet map, clustered when asked. They are fetched for the
 * visible area, which can lie outside the trip's longitude frame or on another world
 * copy, so they are drawn on the copy in view, followed as the view moves (#2975).
 */
export default function PoiMarkers({
  pois,
  clusterLoosely,
  onPoiClick,
  draggable,
}: {
  pois: Poi[];
  clusterLoosely: boolean;
  onPoiClick?: (poi: Poi) => void;
  /** Whether a pin can be dragged onto the route. */
  draggable: boolean;
}) {
  const map = useMap();
  const [frame, setFrame] = useState<LngFrame | null>(null);
  useEffect(() => {
    const follow = () => setFrame((current) => viewLngFrame(current, map.getCenter().lng));
    map.whenReady(follow);
    map.on('moveend', follow);
    return () => {
      map.off('moveend', follow);
    };
  }, [map]);
  // Native clicks keep the newest handler without rebuilding every marker.
  const clickRef = useRef(onPoiClick);
  useEffect(() => {
    clickRef.current = onPoiClick;
  }, [onPoiClick]);

  const markers = useMemo(
    () =>
      pois.map((poi) => (
        <Marker
          key={`poi-${poi.osm_id}`}
          alt={poi.name}
          position={[poi.lat, frameLng(frame, poi.lng)]}
          icon={createPoiIcon(poi)}
          zIndexOffset={500}
          eventHandlers={{
            click: () => onPoiClick?.(poi),
            // Wired on add rather than in a layout effect: Leaflet builds the icon element
            // itself, and this is the first moment there is one to attach to.
            add: (e: { target: { getElement: () => HTMLElement | undefined } }) => {
              const el = e.target.getElement();
              if (!el) return;
              // Native clicks avoid Leaflet suppressing a click after an earlier map drag.
              el.setAttribute('aria-label', poi.name);
              el.onclick = (event) => {
                event.stopPropagation();
                clickRef.current?.(poi);
              };
              if (draggable) makePoiDraggable(el, poi.osm_id);
            },
          }}
        >
          <Tooltip direction="top" offset={[0, -10]} opacity={1} className="map-tooltip">
            <PoiTooltipBody poi={poi} />
          </Tooltip>
        </Marker>
      )),
    [pois, onPoiClick, draggable, frame]
  );

  return (
    <ClusteredPois pois={pois} frame={frame} enabled={clusterLoosely} onPoiClick={onPoiClick}>
      {markers}
    </ClusteredPois>
  );
}
