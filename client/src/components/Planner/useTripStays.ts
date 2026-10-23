import { useCallback, useRef, useState } from 'react';

import { accommodationRepo } from '../../repo/accommodationRepo';
import { useTripStore } from '../../store/tripStore';
import type { Accommodation } from '../../types';
import { useStaysRefresh } from './useStaysRefresh';

/**
 * The planner's stays: the trip's whole list, which the sidebar, the map and the
 * phone's day sheet read. They live here rather than in the trip store, so a stay
 * written elsewhere (the assistant, a fellow traveller, a plugin, a booking
 * import) reaches them as a nudge, and `useStaysRefresh` folds a burst of nudges
 * into one read.
 *
 * A read takes the stays' bookings along, since a stay is booked as a hotel
 * reservation. The newest read wins: the read after an own write and the one for
 * a stay written elsewhere can be on their way at once, and the older answer must
 * not land over the newer one.
 */
export function useTripStays(tripId: number) {
  const [tripAccommodations, setTripAccommodations] = useState<Accommodation[]>([]);
  const latestRead = useRef(0);

  const readStays = useCallback(async () => {
    if (!tripId) return;
    const read = ++latestRead.current;
    await Promise.all([
      accommodationRepo.list(tripId).then(
        (d) => {
          if (read === latestRead.current) setTripAccommodations(d.accommodations || []);
        },
        // A read that fails keeps the stays on show; the next nudge reads them again.
        () => {}
      ),
      useTripStore.getState().loadReservations(tripId),
    ]);
  }, [tripId]);

  const loadAccommodations = useCallback(() => {
    void readStays();
  }, [readStays]);

  useStaysRefresh(readStays);

  return { tripAccommodations, setTripAccommodations, loadAccommodations };
}
