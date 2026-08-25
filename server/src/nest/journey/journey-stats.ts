import type { JourneyStats, JourneyStatsCountry, JourneyStatsPoint, JourneyStatsTrip } from '@trek/shared';

/**
 * What a journey adds up to — the arithmetic, with no database and no Nest.
 *
 * Plain module on the same footing as `atlas-geo.ts` and `maps.helpers.ts`: the
 * service fetches rows and hands them here, which keeps every rule in this file
 * testable against a literal array instead of a fixture database. It is also
 * the only place these definitions live, so "what counts as a day" has one
 * answer rather than one per caller.
 */

/** Mean Earth radius in metres (IUGG). */
const EARTH_RADIUS = 6371008.8;

/** How many stops a printed route can usefully resolve. */
export const MAX_ROUTE_POINTS = 400;

export interface StatsInputPoint {
  lat: number;
  lng: number;
  label: string;
  /** ISO date, when the stop has one. */
  date: string | null;
  country: string | null;
  /** The trip this stop belongs to, when the journey knows. */
  tripId?: number | null;
  /** One photograph from this stop, for a map that marks it with a picture. */
  photoId?: number | null;
}

const rad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Great-circle metres between two coordinates.
 *
 * Not a driving distance: there is no routing engine here, consecutive stops
 * are not necessarily joined by a road, and a book that prints a road distance
 * it never measured is worse than one that says "as the crow flies".
 */
export function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2
    + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Metres along the route, in the order given. */
export function routeDistance(points: { lat: number; lng: number }[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += haversine(points[i - 1], points[i]);
  return total;
}

/**
 * Metres from the first stop to whichever is furthest from it.
 *
 * Polarsteps calls this "furthest point from home" and measures from where the
 * trip started, which is the only definition that needs no extra information —
 * TREK does not know where anyone lives, and asking would be a worse book for
 * the one fact it adds.
 */
export function furthestFromStart(points: { lat: number; lng: number }[]): number {
  if (points.length < 2) return 0;
  const start = points[0];
  let max = 0;
  for (let i = 1; i < points.length; i++) {
    const d = haversine(start, points[i]);
    if (d > max) max = d;
  }
  return max;
}

/** The `YYYY-MM-DD` part of an ISO date or datetime, or null if it is neither. */
export function isoDay(value: string | null | undefined): string | null {
  if (!value) return null;
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(value));
  return m ? m[1] : null;
}

/**
 * Calendar days spanned, inclusive at both ends.
 *
 * A trip that starts and ends the same day is one day, not zero — the figure a
 * book prints under "DAYS" is how long you were away, and nobody describes a
 * day trip as lasting no days.
 */
export function daysBetween(start: string | null, end: string | null): number {
  const a = isoDay(start);
  const b = isoDay(end);
  if (!a || !b) return 0;
  const from = Date.parse(`${a}T00:00:00Z`);
  const to = Date.parse(`${b}T00:00:00Z`);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
  return Math.max(1, Math.round((to - from) / 86_400_000) + 1);
}

/**
 * Thin a route down to a point budget, keeping the ends.
 *
 * Evenly spaced rather than clustered: dropping a run from the middle would
 * cut the route's shape out, while every n-th stop keeps it and only loses
 * detail no printed line could show anyway.
 */
export function thinRoute<T>(points: T[], limit = MAX_ROUTE_POINTS): T[] {
  if (points.length <= limit) return points;
  const out: T[] = [];
  const step = (points.length - 1) / (limit - 1);
  for (let i = 0; i < limit; i++) out.push(points[Math.round(i * step)]);
  return out;
}

/**
 * Countries in the order they were first reached.
 *
 * Visit order, not alphabetical and not by size: the country page of a travel
 * book retells the route, and "Mexico, Belize, Guatemala" is the trip while
 * "Belize, Guatemala, Mexico" is a filing cabinet. Countries whose stops carry
 * no date fall to the end, in the order they appeared.
 */
export function collectCountries(
  points: StatsInputPoint[],
  names: Record<string, string>,
): JourneyStatsCountry[] {
  const seen = new Map<string, { code: string; places: number; firstVisit: string | null; order: number }>();
  points.forEach((p, i) => {
    if (!p.country) return;
    const code = p.country.toUpperCase();
    const day = isoDay(p.date);
    const entry = seen.get(code);
    if (!entry) {
      seen.set(code, { code, places: 1, firstVisit: day, order: i });
      return;
    }
    entry.places += 1;
    if (day && (!entry.firstVisit || day < entry.firstVisit)) entry.firstVisit = day;
  });

  return [...seen.values()]
    .sort((a, b) => {
      if (a.firstVisit && b.firstVisit && a.firstVisit !== b.firstVisit) {
        return a.firstVisit < b.firstVisit ? -1 : 1;
      }
      if (a.firstVisit && !b.firstVisit) return -1;
      if (!a.firstVisit && b.firstVisit) return 1;
      return a.order - b.order;
    })
    .map(c => ({
      code: c.code,
      name: names[c.code] || c.code,
      places: c.places,
      firstVisit: c.firstVisit,
    }));
}

export interface StatsInput {
  journeyId: number;
  /** The route, already in the order it should be drawn. */
  points: StatsInputPoint[];
  entries: number;
  photos: number;
  places: number;
  /** Dates from the trips, used when the entries carry none. */
  tripDates: { start: string | null; end: string | null }[];
  countryNames: Record<string, string>;
  /** The trips themselves, so a book can print a map of one of them. */
  trips?: JourneyStatsTrip[];
}

/**
 * Fold everything into the figures a book puts on a page.
 *
 * Dates come from the entries when they have them and from the trips otherwise:
 * an entry is a thing that happened on a day, so it is the better source, but a
 * journey assembled from trips nobody has written entries for still has a
 * length, and printing "0 DAYS" over a fortnight in Iceland would be worse than
 * using the trip's own dates.
 */
export function computeJourneyStats(input: StatsInput): JourneyStats {
  const points = thinRoute(input.points);
  const dated = points.map(p => isoDay(p.date)).filter((d): d is string => !!d).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  const tripStarts = input.tripDates.map(t => isoDay(t.start)).filter((d): d is string => !!d).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const tripEnds = input.tripDates.map(t => isoDay(t.end)).filter((d): d is string => !!d).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  const start = dated[0] ?? tripStarts[0] ?? null;
  const end = dated[dated.length - 1] ?? tripEnds[tripEnds.length - 1] ?? null;

  const geo = points.filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));

  return {
    journeyId: input.journeyId,
    distance: Math.round(routeDistance(geo)),
    days: daysBetween(start, end),
    steps: input.entries,
    photos: input.photos,
    places: input.places,
    furthest: Math.round(furthestFromStart(geo)),
    countries: collectCountries(points, input.countryNames),
    points: points.map((p): JourneyStatsPoint => ({
      lat: p.lat,
      lng: p.lng,
      label: p.label,
      date: p.date,
      country: p.country,
      tripId: p.tripId ?? null,
      photoId: p.photoId ?? null,
    })),
    /*
     * Counted after thinning, not before.
     *
     * `thinRoute` drops every n-th stop on a long route, so a trip that had
     * forty stops and kept nine has nine on the map. A panel offering "Iceland
     * (40)" and then drawing nine would be counting something the reader
     * cannot see.
     */
    trips: (input.trips ?? []).map(t => ({
      ...t,
      points: points.filter(p => p.tripId === t.id).length,
    })),
    start,
    end,
  };
}
