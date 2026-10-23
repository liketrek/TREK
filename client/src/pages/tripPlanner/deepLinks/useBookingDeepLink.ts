import { useBookingLink } from '../../../hooks/useBookingLink';
import type { DeepLinkProps } from './deepLinkTypes';

/**
 * A booking the chat points at, on the desktop planner: its detail opens, the
 * same view a click on it in the plan or in its tab opens; with `&map=1` its
 * route is drawn on the plan instead. A route already shown stays shown, and
 * the plan goes to the day it departs.
 */
export function useBookingDeepLink({ planner, searchParams, setSearchParams }: DeepLinkProps): void {
  const { tripId, reservations, isLoading, trip, openBookingDetail, showBookingOnMap, isBookingOnMap } = planner;
  useBookingLink({
    searchParams,
    setSearchParams,
    tripId,
    reservations,
    loaded: !isLoading && trip?.id === tripId,
    take: (booking, onMap) => {
      if (!onMap) openBookingDetail(booking);
      else if (!isBookingOnMap(booking)) showBookingOnMap(booking);
      else {
        const dayId = booking.day_id ?? booking.end_day_id ?? null;
        if (dayId !== null) planner.handleSelectDay(dayId);
      }
    },
  });
}
