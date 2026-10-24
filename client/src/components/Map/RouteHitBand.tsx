import { Polyline } from 'react-leaflet';

/**
 * P2A-03: an invisible band along a route segment on the Leaflet map, wider
 * than the drawn line, that takes the click which reshapes the route, as the
 * GL renderer's hit layer does: an 8 px line is too thin to aim at.
 */
export function RouteHitBand({
  positions,
  onRouteClick,
}: {
  positions: [number, number][];
  onRouteClick: (lat: number, lng: number) => void;
}) {
  return (
    <Polyline
      positions={positions}
      // Leaflet hands a path's click to the map as well unless the path says not to;
      // stopping the DOM event does not reach that, and the map's click would add a
      // point at the end of the tour under the shaping point (as TrackLines does).
      bubblingMouseEvents={false}
      pathOptions={{
        color: 'transparent',
        weight: 20,
        opacity: 0,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'cursor-copy',
      }}
      eventHandlers={{
        click: (e: { latlng: { lat: number; lng: number }; originalEvent: MouseEvent }) => {
          // Stops the map's own click, which would otherwise open the add-place menu underneath the new via.
          e.originalEvent.stopPropagation();
          onRouteClick(e.latlng.lat, e.latlng.lng);
        },
      }}
    />
  );
}
