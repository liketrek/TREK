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
  // The moment the tab opened: what was over by then moves into the folded Past
  // section (#3156). Taken once, so a list does not reshuffle while it is read.
  const [now] = useState(() => new Date());
  const groups = groupTransports(
    all.filter((r) => onTravelers(r, travelerFilter)),
    days,
    now
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

  const [folded, setFolded] = useState<Record<string, boolean>>({});
  // Past starts folded while something is still ahead, since mid-trip that is
  // what counts; once the whole trip is over it opens, to look back on.
  const ahead = groups.confirmed.length + groups.pending.length + groups.transit.length > 0;
  const collapsed: Record<string, boolean> = { ...folded, past: folded.past ?? ahead };
  const toggleSection = (id: string) => setFolded((c) => ({ ...c, [id]: !collapsed[id] }));

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
