import { useEffect, useState } from 'react';

import { tripRepo } from '../../repo/tripRepo';
import { localIsoDate } from '../../utils/localDate';

export interface PickerTrip {
  id: number;
  title: string;
  /** The trip runs today, or is the next to start. */
  badge: 'now' | 'next' | null;
}

type DatedTrip = { id: number; title: string; start_date?: string | null; end_date?: string | null };

const MAX_TRIPS = 8;

/**
 * The trips worth asking about first: the one running today, then the ones
 * still to come (soonest first), then the ones behind (latest first). The
 * running trip is marked "now" and the first one to come "next".
 */
export function rankPickerTrips(trips: readonly DatedTrip[], today: string): PickerTrip[] {
  const phase = (t: DatedTrip) => {
    if (t.start_date && t.start_date <= today && (!t.end_date || today <= t.end_date)) return 0;
    if (!t.start_date || t.start_date > today) return 1;
    return 2;
  };
  const ranked = [...trips].sort((a, b) => {
    const pa = phase(a);
    const pb = phase(b);
    if (pa !== pb) return pa - pb;
    const sa = a.start_date ?? '';
    const sb = b.start_date ?? '';
    // Undated trips to come go last among them; the past runs from the latest back.
    if (pa === 1) return (sa === '' ? 1 : 0) - (sb === '' ? 1 : 0) || sa.localeCompare(sb);
    return sb.localeCompare(sa);
  });
  let nextGiven = false;
  return ranked.slice(0, MAX_TRIPS).map((t) => {
    const p = phase(t);
    let badge: PickerTrip['badge'] = null;
    if (p === 0) badge = 'now';
    else if (p === 1 && t.start_date && !nextGiven) {
      badge = 'next';
      nextGiven = true;
    }
    return { id: t.id, title: t.title, badge };
  });
}

/** The trips the picker offers, loaded when it is shown; null while loading. */
export function useAssistantTripPicker(): PickerTrip[] | null {
  const [trips, setTrips] = useState<PickerTrip[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    tripRepo
      .list()
      .then(({ trips: list }) => {
        if (!cancelled) setTrips(rankPickerTrips(list, localIsoDate()));
      })
      .catch(() => {
        // Nothing to pick from is what the picker shows; the window stays usable to close.
        if (!cancelled) setTrips([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return trips;
}
