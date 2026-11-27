import { useEffect, useEffectEvent } from 'react';

import { useSharedImportStore } from './sharedFiles';

/**
 * What was shared to TREK and sent to this trip (native/sharedFiles.ts), opened
 * where it belongs once the trip is on screen: a booking document in the booking
 * import, a map link in the new place sheet, whose search looks it up (#2582).
 */
export function useSharedIntoTrip(tripId: number, open: { bookingImport: () => void; newPlace: () => void }): void {
  const bookingTripId = useSharedImportStore((s) => s.tripId);
  const placeTripId = useSharedImportStore((s) => s.placeLink?.tripId ?? null);
  const openBookingImport = useEffectEvent(() => open.bookingImport());
  const openNewPlace = useEffectEvent(() => open.newPlace());
  useEffect(() => {
    if (bookingTripId != null && bookingTripId === tripId) openBookingImport();
  }, [bookingTripId, tripId]);
  useEffect(() => {
    if (placeTripId != null && placeTripId === tripId) openNewPlace();
  }, [placeTripId, tripId]);
}
