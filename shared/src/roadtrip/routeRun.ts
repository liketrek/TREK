import { lineMetres, sliceAtMeters, projectOntoRoute } from './corridor';
import type { RoadtripStop, RouteSegment, RouteVia, RoutedLeg } from './planning-types';
import { legIndexForAlong } from './roadtripModel';

export const roadtripStopKey = (stop: RoadtripStop): string =>
  `${stop.lat.toFixed(5)},${stop.lng.toFixed(5)},${stop.legMode ?? ''},${stop.incomingLegMode ?? ''}`;
export const roadtripLegKey = (from: RoadtripStop, to: RoadtripStop): string =>
  `${roadtripStopKey(from)}>${roadtripStopKey(to)}`;

export function foldRouteRun(
  stops: RoadtripStop[],
  stopAt: number[],
  route: { coordinates: [number, number][]; legs: RouteSegment[]; vias?: RouteVia[] },
  mode: string,
): Record<string, RoutedLeg> {
  const spine = route.coordinates.map(([lat, lng]) => ({ lat, lng }));
  const cuts: { key: string; from: number; to: number; seg: RouteSegment }[] = [];
  let travelled = 0;
  for (let index = 0; index < stops.length - 1; index++) {
    const parts = route.legs.slice(stopAt[index], stopAt[index + 1]);
    if (!parts.length) continue;
    const merged =
      parts.length === 1
        ? parts[0]!
        : {
            ...parts[0]!,
            distance: parts.reduce((sum, leg) => sum + leg.distance, 0),
            duration: parts.reduce((sum, leg) => sum + leg.duration, 0),
          };
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
