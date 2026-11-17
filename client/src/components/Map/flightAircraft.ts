import type { FlightLiveLeg } from '@trek/shared';
import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useFlightLiveStore } from '../../store/flightLiveStore';
import { useTripStore } from '../../store/tripStore';
import { TRANSPORT_COLOR } from './transportHops';

/**
 * The aircraft of a trip's flights that are in the air (or rolling) right now,
 * drawn on the trip map by both map engines (FlightAircraftLayer for Leaflet,
 * useFlightAircraftGL for Mapbox/MapLibre) from the same markup, so the two
 * look alike.
 */
export interface LiveAircraft {
  key: string;
  reservationId: number;
  lat: number;
  lng: number;
  /** Degrees clockwise from north. */
  track: number;
  label: string;
  /** Position is old (no signal over an ocean): drawn faded. */
  stale: boolean;
}

function liveAircraftOf(legs: FlightLiveLeg[]): LiveAircraft[] {
  return legs.flatMap((leg) => {
    const pos = leg.position;
    if (!pos || (leg.phase !== 'airborne' && leg.phase !== 'taxiing')) return [];
    return [
      {
        key: `${leg.reservation_id}:${leg.leg_index}`,
        reservationId: leg.reservation_id,
        lat: pos.lat,
        lng: pos.lng,
        track: pos.track_deg ?? 0,
        label: leg.flight_number,
        stale: leg.stale,
      },
    ];
  });
}

const NO_LEGS: FlightLiveLeg[] = [];

/**
 * The open trip's aircraft in the air, limited to the bookings the map was
 * handed: the same map component draws collections and tour previews, which
 * must not show the last opened trip's flights. Re-renders only when one of
 * them moves.
 */
export function useLiveAircraft(reservations: readonly { id: number }[] | undefined): LiveAircraft[] {
  const tripId = useTripStore((s) => s.trip?.id);
  // The store's own leg objects, so the selection stays equal until one changes.
  const legs = useFlightLiveStore(
    useShallow((s) => (tripId == null ? NO_LEGS : Object.values(s.trips[tripId]?.legs ?? {})))
  );
  return useMemo(() => {
    const ids = new Set((reservations ?? []).map((r) => r.id));
    return ids.size === 0 ? [] : liveAircraftOf(legs).filter((a) => ids.has(a.reservationId));
  }, [legs, reservations]);
}

/** An airliner seen from above, nose up (north), so `rotate(track)` points it where it flies. */
const PLANE_PATH =
  'M12 2c.7 0 1.2.8 1.2 1.7v5.6l7.6 4.5v2l-7.6-2.2v4.6l2.3 1.8v1.6L12 20.6l-3.5 1v-1.6l2.3-1.8v-4.6L3.2 15.8v-2l7.6-4.5V3.7C10.8 2.8 11.3 2 12 2Z';

/**
 * The marker's markup: a white disc with a soft halo, the aircraft turned to
 * its track in the map's transport colour, and the flight number on a pill beside it.
 * Static text only goes in through `escape`, the caller's HTML escaper.
 */
export function aircraftMarkerHtml(a: LiveAircraft, escape: (s: string) => string): string {
  return `<div class="trek-aircraft${a.stale ? ' is-stale' : ''}" style="--trek-aircraft:${TRANSPORT_COLOR}" role="img" aria-label="${escape(a.label)}">
  <span class="trek-aircraft__halo"></span>
  <span class="trek-aircraft__disc"><svg viewBox="0 0 24 24" width="18" height="18" style="transform:rotate(${Math.round(a.track)}deg)"><path d="${PLANE_PATH}" fill="currentColor"/></svg></span>
  <span class="trek-aircraft__label">${escape(a.label)}</span>
</div>`;
}
