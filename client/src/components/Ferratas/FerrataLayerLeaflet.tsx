import L from 'leaflet';
import { useMemo, useState } from 'react';
import { Marker, Polyline, Tooltip, useMap, useMapEvents } from 'react-leaflet';

import { useTranslation } from '../../i18n';
import { type FerrataGroup, ferrataLabel } from './ferrataGroups';
import { FERRATA_ICON_MIN_ZOOM, FERRATA_ICON_SIZE, ferrataIconSvg, placeFerrataIcons } from './ferrataIcon';
import { ferrataPositions } from './ferrataModel';
import type { FerrataSelectHandler } from './useFerrataLayerGL';
import type { FerrataMapLayer } from './useFerrataMapLayer';
import { useFerrataPaint } from './useFerrataPaint';

/**
 * The route icon for Leaflet: the shared SVG in a divIcon, painted straight
 * from the tokens, so a theme change restyles it without rebuilding anything.
 * Built once; it carries no user content.
 */
/** The hit line's class, which index.css keeps free of the focus ring a clicked path draws. */
const FERRATA_HIT_CLASS = 'trek-ferrata-hit';

const ICON = L.divIcon({
  html: ferrataIconSvg({ line: 'var(--map-ferrata)', casing: 'var(--map-ferrata-casing)' }),
  className: 'trek-ferrata-icon',
  iconSize: [FERRATA_ICON_SIZE, FERRATA_ICON_SIZE],
  iconAnchor: [FERRATA_ICON_SIZE / 2, FERRATA_ICON_SIZE / 2],
});

/**
 * The ferratas whose icon shows: none below FERRATA_ICON_MIN_ZOOM, and above
 * it only those whose icon touches no other one at this zoom, the longer
 * ferrata first. Leaflet has no symbol placement of its own, so this is what
 * GL's `icon-allow-overlap: false` does there. Positions are projected at the
 * zoom, which a pan does not change, so only a zoom or new ferratas place again.
 */
function useIconGroups(groups: readonly FerrataGroup[]): readonly FerrataGroup[] {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  return useMemo(() => {
    if (zoom < FERRATA_ICON_MIN_ZOOM) return [];
    const longestFirst = [...groups].sort((a, b) => b.lengthM - a.lengthM);
    const shown = placeFerrataIcons(
      longestFirst.map((group) => {
        const { x, y } = map.project(group.midpoint, zoom);
        return { id: group.id, x, y };
      })
    );
    return groups.filter((group) => shown.has(group.id));
  }, [map, groups, zoom]);
}

/** The tooltip's words: the ferrata's name and its grade. */
function FerrataTooltipText({ group }: { group: FerrataGroup }) {
  const { t } = useTranslation();
  const { name, grade } = ferrataLabel(group, t);
  return (
    <>
      {name}
      {grade && <span className="ms-1.5 font-semibold">{grade}</span>}
    </>
  );
}

/**
 * The via ferrata layer on the Leaflet renderer, in the same construction as
 * the GL layer: per OSM way a light casing and the dark dashed line, the whole
 * ferrata lit (solid, wider, on a wider casing, in the highlight colour) while
 * the pointer is on it or its card is open, a sticky tooltip in the map's
 * tooltip look naming it with its grade, and from FERRATA_ICON_MIN_ZOOM a
 * small route icon halfway along it where it does not touch another one. A
 * click hands the ferrata and the way to `onSelect`, like a click on the GL
 * layer does.
 */
export default function FerrataLayerLeaflet({
  groups,
  onSelect,
  selectedId = null,
}: {
  groups: readonly FerrataGroup[];
  onSelect: FerrataSelectHandler;
  selectedId?: string | null;
}) {
  const paint = useFerrataPaint();
  const iconGroups = useIconGroups(groups);
  const [hovered, setHovered] = useState<string | null>(null);
  // Rebuilt per set of ferratas and per theme: pathOptions only reach Leaflet when their reference changes.
  const lines = useMemo(() => {
    const casing = { color: paint.casing, weight: 6, opacity: 0.9, lineCap: 'round', lineJoin: 'round' } as const;
    const litCasing = { ...casing, weight: 9, opacity: 1 } as const;
    const line = {
      color: paint.line,
      weight: 2.5,
      opacity: 1,
      dashArray: '6 5',
      lineCap: 'round',
      lineJoin: 'round',
    } as const;
    // Solid: an empty dash list clears the dashes Leaflet would otherwise keep from the line's options.
    const highlight = {
      color: paint.highlight,
      weight: 4,
      opacity: 1,
      dashArray: '',
      lineCap: 'round',
      lineJoin: 'round',
    } as const;
    // The class lets the stylesheet drop the focus ring a clicked SVG path keeps; the card has its own focus.
    const hit = { color: paint.casing, weight: 16, opacity: 0, className: FERRATA_HIT_CLASS } as const;
    return groups.flatMap((group) =>
      group.segments.map((segment) => ({
        group,
        segment,
        positions: ferrataPositions(segment),
        casing,
        litCasing,
        line,
        highlight,
        hit,
      }))
    );
  }, [groups, paint]);

  if (lines.length === 0) return null;
  const lit = (group: FerrataGroup) => group.id === hovered || group.id === selectedId;
  return (
    <>
      {lines.map(({ group, segment, positions, casing, litCasing }) => (
        <Polyline
          key={`${segment.id}-casing`}
          positions={positions}
          pathOptions={lit(group) ? litCasing : casing}
          interactive={false}
        />
      ))}
      {lines.map(({ group, segment, positions, line, highlight }) => (
        <Polyline
          key={`${segment.id}-line`}
          positions={positions}
          pathOptions={lit(group) ? highlight : line}
          interactive={false}
        />
      ))}
      {/* A wide, invisible line on top carries the tooltip, the hover and the click, so a
          thin dashed route is still easy to hit with a finger. The click stops here: it
          opens the ferrata's card and must not also drop a control point under it. */}
      {lines.map(({ group, segment, positions, hit }) => (
        <Polyline
          key={`${segment.id}-hit`}
          positions={positions}
          pathOptions={hit}
          bubblingMouseEvents={false}
          eventHandlers={{
            click: (event) => onSelect(group, segment, { lng: event.latlng.lng, lat: event.latlng.lat }),
            mouseover: () => setHovered(group.id),
            mouseout: () => setHovered((current) => (current === group.id ? null : current)),
          }}
        >
          <Tooltip sticky direction="top" offset={[0, -10]} opacity={1} className="map-tooltip">
            <FerrataTooltipText group={group} />
          </Tooltip>
        </Polyline>
      ))}
      {iconGroups.map((group) => (
        <Marker
          key={`${group.id}-icon`}
          position={group.midpoint}
          icon={ICON}
          keyboard={false}
          eventHandlers={{
            click: (event) => {
              const segment = group.segments[0];
              if (segment) onSelect(group, segment, { lng: event.latlng.lng, lat: event.latlng.lat });
            },
          }}
        />
      ))}
    </>
  );
}

/** The layer as the Leaflet map view mounts it from a `FerrataMapLayer`: drawn only while it is switched on. */
export function FerrataMapLayerLeaflet({ layer }: { layer: FerrataMapLayer | undefined }) {
  if (!layer?.active) return null;
  return <FerrataLayerLeaflet groups={layer.groups} onSelect={layer.onSelect} selectedId={layer.selectedId} />;
}
