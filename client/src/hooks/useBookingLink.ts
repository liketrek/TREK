import type { Reservation } from '@trek/shared';
import { useEffect, useRef } from 'react';
import type { SetURLSearchParams } from 'react-router';

interface BookingLinkOptions {
  searchParams: URLSearchParams;
  setSearchParams: SetURLSearchParams;
  tripId: number;
  reservations: readonly Reservation[];
  /** True once this trip's bookings have loaded, so an id it does not hold can be dropped. */
  loaded: boolean;
  /** Opens the booking: its detail, or with `onMap` its route on the plan. */
  take: (booking: Reservation, onMap: boolean) => void;
}

/**
 * A booking the chat points at (`?booking=<id>`, `&map=1` for its route on
 * the plan), for the desktop planner and the phone alike: once the trip's
 * bookings are there it is handed to `take`, then the link leaves the URL. It
 * is taken once, so a render before the URL has dropped it does not open it
 * twice; an id the trip does not hold is dropped without a word.
 */
export function useBookingLink({
  searchParams,
  setSearchParams,
  tripId,
  reservations,
  loaded,
  take,
}: BookingLinkOptions): void {
  const requested = searchParams.get('booking');
  const onMap = searchParams.get('map') === '1';
  const id = requested === null ? null : Number(requested);
  const booking = id === null ? undefined : reservations.find((r) => r.id === id && r.trip_id === tripId);
  const settled = !!booking || loaded;
  const taken = useRef<string | null>(null);

  useEffect(() => {
    if (requested === null) {
      taken.current = null;
      return;
    }
    const link = `${requested}:${onMap}`;
    if (!settled || taken.current === link) return;
    taken.current = link;
    if (booking) take(booking, onMap);
    setSearchParams(
      (params) => {
        params.delete('booking');
        params.delete('map');
        return params;
      },
      { replace: true }
    );
  }, [requested, settled, booking, onMap, take, setSearchParams]);
}
