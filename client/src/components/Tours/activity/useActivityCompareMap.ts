import { useEffect, useMemo } from 'react';
import { useTourActivityCompareStore } from '../../../store/tourActivityCompareStore';
import type { Place } from '../../../types';
import { parseRenderableRouteGeometry } from '../../../utils/routeGeometry';
import { useMapPaint } from '../../Map/mapPaint';
import { resolveTrackColor } from '../../Map/trackColors';

type Line = [number, number][];
type LineColor = { line: string; casing: string } | undefined;

/** The actual track's colour resolved for map paint; the map cannot read a CSS variable. */
const ACTUAL_PAINT = { line: '--success', casing: '--surface-card' } as const;

/** What the legend over the map names: the two lines, each as it is drawn. */
export interface ActivityCompareLegend {
  planName: string;
  planColor: string;
  trackName: string;
}

interface CompareMapInput<P extends Place> {
  /** False where the map shows something else (the road trip, the trip overview): nothing is compared there. */
  enabled: boolean;
  /** Every place of the trip, to find the plan and the recording in even when the map leaves them out. */
  places: Place[];
  /** The places the map draws. */
  mapPlaces: P[];
  route: Line[] | null;
  routeWalking: boolean[] | null;
  /** The place whose detail is open: the comparison shows only beside its plan. */
  selectedPlaceId: number | null;
}

/** The map's input as it is drawn: unchanged, or with the comparison laid in. */
interface CompareMapLines<P extends Place> {
  places: (P | Place)[];
  route: Line[] | null;
  routeWalking: boolean[] | null;
  /** One entry per line of `route`; left out, the route keeps its own colour throughout. */
  routeColors: LineColor[] | undefined;
  legend: ActivityCompareLegend | null;
}

/**
 * The plan map's places and lines while the comparison is on, and the
 * legend's names. Pure, for the hook below and its tests.
 *
 * The plan is the tour's own track, picked on the map and drawn in its track
 * colour; it is put back on the map should the person have hidden it there.
 * The recording leaves the map as a tour of its own and comes back as one more
 * line of the route, dotted in the colour of done, so it is drawn once and
 * never in the colour of a plan. Off, everything stays exactly as it came.
 */
export function compareMapLines<P extends Place>(
  input: CompareMapInput<P>,
  comparison: { tourPlaceId: number; trackPlaceId: number } | null,
  paint: { line: string; casing: string }
): CompareMapLines<P> {
  const unchanged: CompareMapLines<P> = {
    places: input.mapPlaces,
    route: input.route,
    routeWalking: input.routeWalking,
    routeColors: undefined,
    legend: null,
  };
  if (!input.enabled || !comparison || comparison.tourPlaceId !== input.selectedPlaceId) return unchanged;
  const plan = input.places.find((place) => place.id === comparison.tourPlaceId);
  const track = input.places.find((place) => place.id === comparison.trackPlaceId);
  const line = parseRenderableRouteGeometry(track?.route_geometry);
  if (!plan || !track || !line || line.length < 2) return unchanged;
  const route = input.route ?? [];
  const drawn = input.mapPlaces.filter((place) => place.id !== track.id);
  return {
    places: drawn.some((place) => place.id === plan.id) ? drawn : [...drawn, plan],
    route: [...route, line.map(([lat, lng]): [number, number] => [lat, lng])],
    // Aligned by index: the route's own flags may run short of its lines.
    routeWalking: [...route.map((_, index) => input.routeWalking?.[index] === true), true],
    routeColors: [...route.map((): LineColor => undefined), paint],
    legend: { planName: plan.name, planColor: resolveTrackColor(plan), trackName: track.name },
  };
}

/**
 * ACT-02 on the plan map: `compareMapLines` with the comparison of the store
 * and the theme's colours. The map also tells the store whether it can
 * compare at all, so the detail offers the switch only where pressing it
 * draws something; turning to the road trip or the overview, or leaving the
 * map, ends a running comparison.
 */
export function useActivityCompareMap<P extends Place>(input: CompareMapInput<P>) {
  const comparison = useTourActivityCompareStore((state) => state.comparison);
  const paint = useMapPaint(ACTUAL_PAINT);
  const { enabled, places, mapPlaces, route, routeWalking, selectedPlaceId } = input;
  useEffect(() => {
    const { setMapAvailable } = useTourActivityCompareStore.getState();
    setMapAvailable(enabled);
    return () => setMapAvailable(false);
  }, [enabled]);
  return useMemo(
    () => compareMapLines({ enabled, places, mapPlaces, route, routeWalking, selectedPlaceId }, comparison, paint),
    [comparison, enabled, mapPlaces, paint, places, route, routeWalking, selectedPlaceId]
  );
}
