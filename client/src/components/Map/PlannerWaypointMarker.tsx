import L from 'leaflet';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Marker, Tooltip, useMap } from 'react-leaflet';
import { MAP_LABEL_BADGE_CLASS } from './mapHoverLabel';
import { wirePlannerWaypointDrag } from './plannerWaypointDrag';

/** The pin's inline style for a size and selection; the renderer owns the colour. */
export type PinCss = (size: number, selected: boolean) => string;

function plannerWaypointIcon(pinCss: PinCss, index: number, selected: boolean, draggable: boolean): L.DivIcon {
  const size = selected ? 30 : 26;
  return L.divIcon({
    className: 'tour-planner-waypoint-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<span style="${pinCss(size, selected)};cursor:${draggable ? 'grab' : 'pointer'};touch-action:${draggable ? 'none' : 'auto'};user-select:none">${index + 1}</span>`,
  });
}

export default function PlannerWaypointMarker({
  point,
  index,
  selected,
  onClick,
  onMove,
  pinCss,
}: {
  point: { id: string; lat: number; lng: number; name?: string; detail?: string };
  index: number;
  selected: boolean;
  onClick?: (id: string) => void;
  onMove?: (id: string, lat: number, lng: number) => boolean;
  pinCss: PinCss;
}) {
  const map = useMap();
  const [marker, setMarker] = useState<L.Marker | null>(null);
  const handlersRef = useRef({ onClick, onMove });
  useLayoutEffect(() => {
    handlersRef.current = { onClick, onMove };
  }, [onClick, onMove]);
  const position = useMemo(() => [point.lat, point.lng] as [number, number], [point.lat, point.lng]);
  const icon = useMemo(() => plannerWaypointIcon(pinCss, index, selected, !!onMove), [index, onMove, pinCss, selected]);
  const eventHandlers = useMemo(
    () => ({
      click: (event: { originalEvent: MouseEvent }) => {
        event.originalEvent.stopPropagation();
        handlersRef.current.onClick?.(point.id);
      },
    }),
    [point.id]
  );

  useEffect(() => {
    if (!marker || !onMove) return;
    const element = marker.getElement();
    if (!element) return;
    return wirePlannerWaypointDrag({
      element,
      initial: { lat: point.lat, lng: point.lng },
      coordinateAt: (clientX, clientY) => {
        const rect = map.getContainer().getBoundingClientRect();
        const at = map.containerPointToLatLng([clientX - rect.left, clientY - rect.top]);
        return { lat: at.lat, lng: at.lng };
      },
      setPosition: ({ lat, lng }) => {
        marker.setLatLng([lat, lng]);
      },
      onCommit: ({ lat, lng }) => handlersRef.current.onMove?.(point.id, lat, lng) ?? false,
    });
  }, [map, marker, onMove, point.id, point.lat, point.lng]);

  return (
    <Marker
      ref={setMarker}
      position={position}
      icon={icon}
      zIndexOffset={selected ? 1200 : 1100}
      eventHandlers={eventHandlers}
    >
      <Tooltip direction="top" offset={[0, -12]} opacity={1} className="map-tooltip">
        <span className="font-medium">{point.name ?? index + 1}</span>
        {point.detail && <span className={MAP_LABEL_BADGE_CLASS}>{point.detail}</span>}
      </Tooltip>
    </Marker>
  );
}
