import { useSettingsStore } from '../../store/settingsStore';
import type { DistanceUnit } from '../../types';
import type { ViasByDay } from '../../utils/dayRouteVias';
import { formatDistance } from '../../utils/units';
import type { TourStageStops } from '../Map/dayTourProjection';
import {
  routeTrip,
  type TripRouteInputs,
  type TripRouteProgress,
  type TripRouteSummary,
} from '../Map/tripRouteGeometry';
import { renderTripMapImage } from './tripMapImage';
import { buildTripMapSvg } from './tripMapSvg';

/** What the planner knows about the trip's route beyond the plan, and how it follows the routing. */
export interface TripPdfRouteOptions {
  /** The roads picked in the road trip (#2580), so the print bends where the planner map does. */
  viasByDay?: ViasByDay;
  /** Where the stages of the trip's multi-day tours run. */
  tourStageStops?: TourStageStops;
  /** Stops routing early: the legs asked by then are printed, the rest stay straight and are marked. */
  signal?: AbortSignal;
  onProgress?: TripRouteProgress;
}

interface TripPdfRoute {
  route: TripRouteSummary | null;
  mapSvg: string | null;
}

const MAP_FRAME = { width: 720, height: 420 };

/**
 * The trip's route as one map (#1736), from the builder the planner overview uses and
 * fed what the overview is fed, so the document and the screen show the same roads.
 *
 * Every leg is waited for: a deadline here printed a month-long trip with most of its
 * days as straight lines and a total that looked final (#2876). Fail-safe all the same:
 * a routing failure means no map rather than no PDF.
 */
export async function drawTripRoute(
  input: Omit<TripRouteInputs, 'viasByDay' | 'tourStageStops'>,
  { tripId, unit, options = {} }: { tripId: number; unit: DistanceUnit; options?: TripPdfRouteOptions }
): Promise<TripPdfRoute> {
  const route = await routeTrip(
    { ...input, viasByDay: options.viasByDay, tourStageStops: options.tourStageStops },
    { profile: 'driving', tripId, unit, signal: options.signal, onProgress: options.onProgress }
  ).catch((err: unknown) => {
    // Logged rather than swallowed: a map that is silently absent looks exactly like a
    // trip that has no route, and the two need different answers from whoever is
    // looking. The export itself carries on — the itinerary matters more than the map.
    console.warn('[tripPdfMap] routing the trip failed; the export continues without a map', err);
    return null;
  });
  if (!route) return { route: null, mapSvg: null };
  // A real basemap first — at city scale the bundled outlines are a country-sized
  // blank, and only streets carry context that small. The outline map is what is left
  // when there is no WebGL, no network, or a style that will not load.
  const frame = { ...MAP_FRAME, formatDistance: (km: number) => formatDistance(km, unit) };
  const style = useSettingsStore.getState().settings.maplibre_style;
  const mapSvg = (await renderTripMapImage(route.days, { ...frame, style })) ?? buildTripMapSvg(route.days, frame);
  // The other way to end up mapless, and the one that is not a failure: nothing in the
  // trip routed. Only worth saying when there were stops to route — a trip nobody has
  // planned yet is meant to print without a map.
  if (!mapSvg && Object.values(input.assignments).some((list) => list?.length)) {
    console.warn(
      `[tripPdfMap] no map drawn: ${route.days.length} of ${input.days.length} day(s) produced a route.` +
        ' A day needs two located stops, or one located stop with an accommodation either side of it.'
    );
  }
  return { route, mapSvg };
}
