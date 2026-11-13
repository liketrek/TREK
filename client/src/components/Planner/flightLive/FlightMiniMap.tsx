import type { FlightLiveLeg } from '@trek/shared';
import L from 'leaflet';
import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import { OFM_DARK, OFM_POSITRON } from '../../../constants/mapDefaults';
import { useIsDark } from '../../../hooks/useIsDark';
import { greatCircle, splitRoute, type LatLng } from '../../../utils/flightRoute';
import VectorBasemap from '../../Map/VectorBasemap';
import './flightMiniMap.css';

/** Who made the map under the route; named on the map itself, as the tiles' licence asks. */
export const FLIGHT_MAP_CREDIT = '© OpenFreeMap © OpenMapTiles © OpenStreetMap';

/** An airliner seen from above, nose up, in a 24 box. */
const PLANE_PATH =
  'M12 2c.9 0 1.3.7 1.3 1.6v4.2l6.3 4.8v2.1l-6.3-2.3v4.1l2.4 1.7v1.6l-3.7-1-3.7 1v-1.6l2.4-1.7v-4.1l-6.3 2.3v-2.1l6.3-4.8V3.6C10.7 2.7 11.1 2 12 2Z';

function planeIcon(heading: number, dim: boolean): L.DivIcon {
  return L.divIcon({
    className: 'flight-mini-plane',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: `<svg viewBox="0 0 24 24" width="20" height="20" style="transform:rotate(${Math.round(heading)}deg);opacity:${dim ? 0.55 : 1}"><path d="${PLANE_PATH}"/></svg>`,
  });
}

/** Where along the route the aircraft really is: the route point nearest to its reported position. */
function progressOf(route: LatLng[], at: LatLng | null, fallback: number): number {
  if (!at) return fallback;
  let best = 0;
  let bestD = Infinity;
  route.forEach((p, i) => {
    const d = (p.lat - at.lat) ** 2 + (((p.lng - at.lng + 540) % 360) - 180) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best / (route.length - 1);
}

/**
 * Frames the whole route in the free middle of the box, right away and again a
 * moment later for a box whose fonts were still settling. `inset` is the share
 * of the width kept clear on either side, where the card lays its airports and
 * times over the map; the map itself runs on under them, faded.
 */
function FitRoute({ route, inset, onReady }: { route: LatLng[]; inset: number; onReady: () => void }) {
  const map = useMap();
  useEffect(() => {
    // No invalidateSize: the dialog and the sheet slide in by transform, which leaves
    // the layout size alone, and a resize here makes the GL layer schedule a frame
    // that can outlive the map when React mounts it twice.
    const fit = () => {
      const side = Math.round(map.getSize().x * inset) + 10;
      map.fitBounds(L.latLngBounds(route.map((p) => [p.lat, p.lng])), {
        paddingTopLeft: [side, 22],
        paddingBottomRight: [side, 46],
        animate: false,
      });
    };
    fit();
    const id = window.setTimeout(() => {
      fit();
      onReady();
    }, 180);
    return () => window.clearTimeout(id);
  }, [map, route, inset, onReady]);
  return null;
}

/** One end of the route: a ring with the airport code under it. */
function RouteEnd({ at, code }: { at: LatLng; code: string }) {
  return (
    <CircleMarker
      center={[at.lat, at.lng]}
      radius={3.5}
      pathOptions={{ className: 'flight-mini-end', interactive: false }}
    >
      <Tooltip permanent direction="bottom" offset={[0, 3]} className="flight-mini-code">
        {code}
      </Tooltip>
    </CircleMarker>
  );
}

interface FlightMiniMapProps {
  leg: FlightLiveLeg;
  /** Share of the way flown, used while the feed reports no position. */
  progress: number;
  /** The aircraft only while it is on its way or just down; never for a flight still at the gate. */
  showPlane: boolean;
  dimPlane: boolean;
  /** The licences behind the picture (live data, map), kept on the map as its hover text and for screen readers. */
  credits: string[];
  /** Share of the width on either side kept clear of the route, for what the card lays over the map there. */
  inset?: number;
  className?: string;
}

/**
 * The flight on a real map, small and quiet: the great circle between the two
 * airports, solid where it is flown and dotted where it is left, the aircraft
 * on the line as far as the feed last saw it, turned along the route. Nothing on it reacts to a
 * touch, it is a picture, without place names. The edges fade into the surface on all four sides
 * (flightMiniMap.css), and the map fades in once it is framed, so it never
 * shows a jump from the world view to the route. Colours come in as the custom
 * properties --fm-flown, --fm-ahead, --fm-end, --fm-plane and --fm-code.
 */
export default function FlightMiniMap({
  leg,
  progress,
  showPlane,
  dimPlane,
  credits,
  inset = 0,
  className = '',
}: FlightMiniMapProps) {
  const dark = useIsDark();
  // The quiet OpenFreeMap styles rather than the user's basemap: under a faded route any busier map is noise.
  const style = dark ? OFM_DARK : OFM_POSITRON;
  const [ready, setReady] = useState(false);
  const onReady = useMemo(() => () => setReady(true), []);

  const { origin, destination, position } = leg;
  const route = useMemo(
    () => greatCircle({ lat: origin.lat, lng: origin.lng }, { lat: destination.lat, lng: destination.lng }),
    [origin.lat, origin.lng, destination.lat, destination.lng]
  );
  // The reported position only says how far along the flight is; the aircraft
  // itself sits on the drawn line, nose along it, so it never floats beside it.
  const split = useMemo(
    () => splitRoute(route, progressOf(route, position ? { lat: position.lat, lng: position.lng } : null, progress)),
    [route, position, progress]
  );
  const planeAt = split.at;
  const icon = useMemo(() => planeIcon(split.heading, dimPlane), [split, dimPlane]);

  return (
    <div
      className={`flight-mini-map relative overflow-hidden transition-opacity duration-700 ease-out ${ready ? 'opacity-100' : 'opacity-0'} ${className}`}
      title={credits.join('\n')}
    >
      <span className="sr-only">{credits.join(', ')}</span>
      <MapContainer
        center={[route[0].lat, route[0].lng]}
        zoom={2}
        zoomSnap={0.25}
        zoomControl={false}
        attributionControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        worldCopyJump={false}
        zoomAnimation={false}
        fadeAnimation={false}
        markerZoomAnimation={false}
        // A picture in a box of fixed size: window resizes do not concern it.
        trackResize={false}
        className="h-full w-full bg-transparent"
      >
        <VectorBasemap style={style} hideLabels />
        <FitRoute route={route} inset={inset} onReady={onReady} />
        <Polyline
          positions={split.ahead.map((p) => [p.lat, p.lng])}
          pathOptions={{ className: 'flight-mini-ahead', interactive: false }}
        />
        <Polyline
          positions={split.flown.map((p) => [p.lat, p.lng])}
          pathOptions={{ className: 'flight-mini-flown', interactive: false }}
        />
        <RouteEnd at={route[0]} code={origin.code} />
        <RouteEnd at={route[route.length - 1]} code={destination.code} />
        {showPlane && <Marker position={[planeAt.lat, planeAt.lng]} icon={icon} interactive={false} keyboard={false} />}
      </MapContainer>
    </div>
  );
}
