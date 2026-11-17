import { escapeHtml } from '@trek/shared';
import L from 'leaflet';
import { useMemo } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import { frameLng } from '../../utils/lngFrame';
import { aircraftMarkerHtml, useLiveAircraft, type LiveAircraft } from './flightAircraft';
import './flightAircraft.css';
import { useLngFrame } from './lngFrameContext';

function aircraftIcon(a: LiveAircraft): L.DivIcon {
  return L.divIcon({
    className: '',
    html: aircraftMarkerHtml(a, escapeHtml),
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

/**
 * The trip's flights in the air, on the Leaflet map: one marker per aircraft
 * at its live position, turned to its track. A click opens the booking.
 */
export default function FlightAircraftLayer({
  reservations,
  onOpen,
}: {
  /** The bookings this map shows; only their aircraft are drawn. */
  reservations: readonly { id: number }[] | undefined;
  onOpen?: (reservationId: number) => void;
}) {
  const aircraft = useLiveAircraft(reservations);
  const frame = useLngFrame();
  const icons = useMemo(() => new Map(aircraft.map((a) => [a.key, aircraftIcon(a)])), [aircraft]);
  return (
    <>
      {aircraft.map((a) => (
        <Marker
          key={a.key}
          position={[a.lat, frameLng(frame, a.lng)]}
          icon={icons.get(a.key)}
          zIndexOffset={2000}
          eventHandlers={{ click: () => onOpen?.(a.reservationId) }}
        >
          <Tooltip direction="top" offset={[0, -16]} opacity={1} className="map-tooltip">
            {a.label}
          </Tooltip>
        </Marker>
      ))}
    </>
  );
}
