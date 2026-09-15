/**
 * The "First trip / Last trip" dates Atlas shows for a country (#1535).
 *
 * Both used to be the earliest and the latest start_date of every trip with a
 * place in the country. A single trip therefore showed its departure month twice,
 * the month you came home never appeared, and a trip you had only booked could
 * become the last visit of a country you had already been to.
 *
 * Now only the trips that give the country its status count: the visited ones for
 * a visited country, the planned ones for a planned country. firstVisit is where
 * the earliest of them starts and lastVisit where the latest ends. A trip you are
 * still on ends today, not on the day you plan to fly back.
 *
 * Dates stay 'YYYY-MM-DD' strings and are compared as such, like tripVisitStatus
 * does, so no timezone can shift them on the way.
 */
import { tripVisitStatus, type VisitStatus } from '@trek/shared';

export interface DatedTrip {
  start_date?: string | null;
  end_date?: string | null;
}

export function countryVisitDates(
  trips: DatedTrip[],
  status: VisitStatus,
  today: string,
): { firstVisit: string | null; lastVisit: string | null } {
  let firstVisit: string | null = null;
  let lastVisit: string | null = null;
  for (const trip of trips) {
    const start = trip.start_date || trip.end_date;
    if (!start || tripVisitStatus(trip.start_date, trip.end_date, today) !== status) continue;
    let end = trip.end_date && trip.end_date > start ? trip.end_date : start;
    if (status === 'visited' && end > today) end = today;
    if (!firstVisit || start < firstVisit) firstVisit = start;
    if (!lastVisit || end > lastVisit) lastVisit = end;
  }
  return { firstVisit, lastVisit };
}
