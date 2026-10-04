import { lineMetres, sliceAtMeters, projectOntoRoute } from './corridor';
import type { DistanceUnit, RoadtripStop, RouteSegment, RouteVia, RoutedLeg } from './planning-types';
import { formatDurationShort, legIndexForAlong } from './roadtripModel';
import { formatDistance } from './units';

export const roadtripStopKey = (stop: RoadtripStop): string =>
  `${stop.lat.toFixed(5)},${stop.lng.toFixed(5)},${stop.legMode ?? ''},${stop.incomingLegMode ?? ''}`;
export const roadtripLegKey = (from: RoadtripStop, to: RoadtripStop): string =>
  `${roadtripStopKey(from)}>${roadtripStopKey(to)}`;

/** The walking pace a segment's walking time is printed at, in metres per second. */
const WALKING_METRES_PER_SECOND = 5000 / 3600;

/**
 * The pieces a via cuts one stop-to-stop drive into, read as that one drive again.
 *
 * The router answers one leg per pair of waypoints, so a drive bent through a via comes
 * back in pieces. The numbers add up. The printed texts do not: carried over from the first
 * piece, they had the phone print "1.9 mi in 6 min" under a 3.9 mi drive, because it reads
 * a segment's text before its numbers. So the texts are written again from the sums, in the
 * reader's unit, and the drive ends where its last piece does rather than at the first via.
 */
export function mergeRouteSegments(parts: RouteSegment[], unit: DistanceUnit): RouteSegment {
  const first = parts[0]!;
  if (parts.length === 1) return first;
  const last = parts[parts.length - 1]!;
  const distance = parts.reduce((sum, leg) => sum + (leg.distance ?? 0), 0);
  const duration = parts.reduce((sum, leg) => sum + (leg.duration ?? 0), 0);
  const durationText = formatDurationShort(duration);
  // A leg a provider handed over without its ends keeps the first piece's; the texts are
  // what the reader was shown wrong, the ends only place the label.
  const ends = first.from && last.to ? { from: first.from, to: last.to } : null;
  return {
    ...first,
    ...(ends
      ? {
          to: ends.to,
          mid: [(ends.from[0] + ends.to[0]) / 2, (ends.from[1] + ends.to[1]) / 2] as [number, number],
        }
      : {}),
    distance,
    duration,
    distanceText: formatDistance(distance / 1000, unit),
    durationText,
    drivingText: durationText,
    walkingText: formatDurationShort(distance / WALKING_METRES_PER_SECOND),
  };
}

export function foldRouteRun(
  stops: RoadtripStop[],
  stopAt: number[],
  route: { coordinates: [number, number][]; legs: RouteSegment[]; vias?: RouteVia[] },
  mode: string,
  unit: DistanceUnit,
): Record<string, RoutedLeg> {
  const spine = route.coordinates.map(([lat, lng]) => ({ lat, lng }));
  const cuts: { key: string; from: number; to: number; seg: RouteSegment }[] = [];
  let travelled = 0;
  for (let index = 0; index < stops.length - 1; index++) {
    const parts = route.legs.slice(stopAt[index], stopAt[index + 1]);
    if (!parts.length) continue;
    const merged = mergeRouteSegments(parts, unit);
    const from = travelled;
    travelled += merged.distance;
    cuts.push({ key: roadtripLegKey(stops[index]!, stops[index + 1]!), from, to: travelled, seg: { ...merged, mode } });
  }
  const scale = travelled > 0 ? lineMetres(spine) / travelled : 0;
  const legs: Record<string, RoutedLeg> = {};
  for (const cut of cuts)
    legs[cut.key] = {
      seg: cut.seg,
      line: sliceAtMeters(spine, cut.from * scale, cut.to * scale).map((p) => [p.lat, p.lng]),
      vias: [],
    };
  for (const via of route.vias ?? []) {
    if (!via.label && via.dwellSeconds == null) continue;
    const along = (projectOntoRoute(via, spine)?.alongKm ?? 0) * 1000;
    const index = legIndexForAlong(
      cuts.map((cut) => cut.to),
      along,
    );
    const cut = cuts[index];
    if (cut) legs[cut.key]!.vias.push(via);
  }
  return legs;
}
