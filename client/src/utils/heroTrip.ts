/**
 * Which trip the dashboard features, in one place: the dashboard's hero and
 * the iOS widgets (native/widgets.ts) both ask here, so the trip on the home
 * screen is always the one the app opens on.
 */
interface DatedTrip {
  start_date?: string | null;
  end_date?: string | null;
}

/** 0 running, 1 coming up, 2 past or undated. */
function rank(trip: DatedTrip, today: string): number {
  if (trip.start_date && trip.end_date && trip.start_date <= today && trip.end_date >= today) return 0;
  if (trip.start_date && trip.start_date >= today) return 1;
  return 2;
}

/** Running trips first, then the ones coming up, both soonest first; the rest latest first. */
export function sortTripsByRelevance<T extends DatedTrip>(trips: T[], today: string): T[] {
  return [...trips].sort((a, b) => {
    const ra = rank(a, today);
    const rb = rank(b, today);
    if (ra !== rb) return ra - rb;
    const ad = a.start_date || '';
    const bd = b.start_date || '';
    if (ra <= 1) return ad.localeCompare(bd);
    return bd.localeCompare(ad);
  });
}

/**
 * The trip the hero features on its own merit: the first running one in that
 * order, else the first coming up; null when every trip is past or undated.
 */
export function heroTrip<T extends DatedTrip>(sorted: T[], today: string): T | null {
  return sorted.find((t) => rank(t, today) === 0) || sorted.find((t) => rank(t, today) === 1) || null;
}
