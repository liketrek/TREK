import type { FeatureGroup as LeafletFeatureGroup, LeafletMouseEvent } from 'leaflet';
import { useEffect, useRef } from 'react';
import { CircleMarker, FeatureGroup, Polyline, Tooltip } from 'react-leaflet';

import type { AssistantRouteLine } from '../../types/assistantMap';

/** A rim under the line, the line, and the invisible fat line that takes the pointer. */
const CASING_WEIGHT = 7;
const CORE_WEIGHT = 4;
const HIT_WEIGHT = 16;
/** A way not chosen, or one joined straight between its stops. */
const DASH = '6 7';
/** The way a change replaces, beside the new one. */
const DIM_OPACITY = 0.45;
const END_RADIUS = 5;
const STOP_RADIUS = 4;
const ROUND = { lineCap: 'round', lineJoin: 'round' } as const;

interface LineHandlers {
  onHover?: (ref: string | null) => void;
  onPoint?: (ref: string, lat: number, lng: number) => void;
}

/**
 * One route the chat shows: its rim and its line (dashed while it is a way
 * not chosen or only its stops joined straight, faint while it is the way a
 * change replaces), its hard grades over it, a disc at its start and a ring
 * at its end, its named stops with their names while it is lit, and a wide
 * invisible line on top that reports the pointer: onto it, along it (for the route's profile)
 * and off it. Nothing but the invisible line takes the pointer, so the plan's
 * own lines and pins stay where a click lands. Leaflet keeps each path where
 * it was first drawn, whatever order the lines come in later, so a line that
 * lights up is brought to the front by hand.
 */
function GhostLine({ line, onHover, onPoint }: { line: AssistantRouteLine } & LineHandlers) {
  const group = useRef<LeafletFeatureGroup | null>(null);
  useEffect(() => {
    if (line.hot) group.current?.bringToFront();
  }, [line.hot]);
  const opacity = line.dim ? DIM_OPACITY : 1;
  const point = (event: LeafletMouseEvent) => onPoint?.(line.ref, event.latlng.lat, event.latlng.lng);
  return (
    <FeatureGroup ref={group}>
      <Polyline
        positions={line.lines}
        interactive={false}
        pathOptions={{ color: line.casing, weight: CASING_WEIGHT, opacity: opacity * 0.9, ...ROUND }}
      />
      <Polyline
        positions={line.lines}
        interactive={false}
        pathOptions={{
          color: line.color,
          weight: CORE_WEIGHT,
          opacity,
          // Always named: Leaflet merges a new style into the old one, so a dash left out would stay drawn.
          dashArray: line.dashed ? DASH : undefined,
          ...ROUND,
        }}
      />
      {line.tints?.map((tint, index) => (
        <Polyline
          key={index}
          positions={tint.line}
          interactive={false}
          pathOptions={{ color: tint.color, weight: CORE_WEIGHT, opacity, ...ROUND }}
        />
      ))}
      {line.ends && (
        <CircleMarker
          center={line.ends.start}
          radius={END_RADIUS}
          interactive={false}
          pathOptions={{ color: line.casing, weight: 2, fillColor: line.color, fillOpacity: 1, opacity }}
        />
      )}
      {line.ends?.end && (
        <CircleMarker
          center={line.ends.end}
          radius={END_RADIUS}
          interactive={false}
          pathOptions={{ color: line.color, weight: 3, fillColor: line.casing, fillOpacity: 1, opacity }}
        />
      )}
      {line.hot &&
        line.stops?.map((stop, index) => (
          <CircleMarker
            key={index}
            center={[stop.lat, stop.lng]}
            radius={STOP_RADIUS}
            interactive={false}
            pathOptions={{ color: line.casing, weight: 2, fillColor: line.color, fillOpacity: 1 }}
          >
            <Tooltip permanent direction="top" className="map-tooltip">
              {stop.label}
            </Tooltip>
          </CircleMarker>
        ))}
      <Polyline
        positions={line.lines}
        bubblingMouseEvents={false}
        pathOptions={{ color: line.casing, weight: HIT_WEIGHT, opacity: 0 }}
        eventHandlers={{
          mouseover: () => onHover?.(line.ref),
          mouseout: () => onHover?.(null),
          mousemove: point,
          click: point,
        }}
      />
    </FeatureGroup>
  );
}

interface AssistantGhostLineLayerProps extends LineHandlers {
  lines: readonly AssistantRouteLine[] | undefined;
}

/**
 * The routes the chat shows on the Leaflet map, in the order they come
 * (the store's route model puts the one under the pointer last; here a line
 * brings itself to the front when it lights up). Over the plan's lines,
 * under its pins. The twin of
 * useAssistantGhostLinesGL.
 */
export function AssistantGhostLineLayer({ lines, onHover, onPoint }: AssistantGhostLineLayerProps) {
  if (!lines?.length) return null;
  return (
    <>
      {lines.map((line) => (
        <GhostLine key={line.id} line={line} onHover={onHover} onPoint={onPoint} />
      ))}
    </>
  );
}
