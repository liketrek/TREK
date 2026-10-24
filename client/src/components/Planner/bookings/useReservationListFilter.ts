import { useState } from 'react';

import type { Day, Reservation } from '../../../types';
import { groupTransports, onTravelers } from './bookingsModel';

/**
 * The traveller filter and the folded sections of the phone's bookings and
 * transports tabs: the bookings someone chosen is on, in their date-ordered status
 * sections. The filter is only offered when the trip has company and a booking
 * names a traveller at all.
 *
 * Only those two phone tabs use it. The desktop bookings panel keeps its own
 * filters in useBookingsView, remembered for the session, and shares the
 * predicates with the phone through bookingsModel.
 */
export function useReservationListFilter(all: Reservation[], days: Day[], memberCount: number) {
  const [travelerFilter, setTravelerFilter] = useState<Set<number>>(new Set());
  const groups = groupTransports(
    all.filter((r) => onTravelers(r, travelerFilter)),
    days
  );
  const showTravelerFilter = memberCount > 1 && all.some((r) => (r.travelers || []).length > 0);
  const toggleTravelerFilter = (id: number) =>
    setTravelerFilter((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const clearTravelerFilter = () => setTravelerFilter(new Set());

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggleSection = (id: string) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  return {
    travelerFilter,
    groups,
    showTravelerFilter,
    toggleTravelerFilter,
    clearTravelerFilter,
    collapsed,
    toggleSection,
  };
}
