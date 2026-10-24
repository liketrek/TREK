/**
 * PR1-01 and PR1-02 for a saved hike changed over MCP: its points the other
 * way round, or taken back to its start, as the planner's route tools turn
 * them. Only the points are worked out here; update_tour plans the way
 * through them anew, under the hike's limit and preferences, and keeps each
 * point's name, key and link where it stands where a saved one stood.
 */
import { isClosedLoop, type HikeStop, type TourReshape, type TourWaypoint } from '@trek/shared';

/** The points a reshaped hike is planned through, or why it cannot be reshaped. */
type Reshaped = { points: HikeStop[] } | { refused: string };

/** A saved point as update_tour takes a new one: where it is, what it is, and whether a stage ends there. */
function stopOf(point: TourWaypoint): HikeStop {
  return {
    lat: point.lat,
    lng: point.lng,
    ...(point.name ? { name: point.name } : {}),
    ...(point.poi_category ? { poi_category: point.poi_category } : {}),
    ...(point.stage_end ? { stage_end: true } : {}),
  };
}

export function reshapedHikePoints(saved: readonly TourWaypoint[], reshape: TourReshape): Reshaped {
  if (saved.length < 2) {
    return {
      refused:
        'This hike is a recorded track without points of its own, so there is nothing to turn: give waypoints to plan it over first.',
    };
  }
  if (reshape === 'reverse') {
    if (saved.some((point) => point.stage_end)) {
      return {
        refused:
          'This hike is split into stages over several days, which keep their days by the stop each starts at: turn it round in the planner, where its stages are put on their days again.',
      };
    }
    return { points: [...saved].reverse().map(stopOf) };
  }
  if (isClosedLoop(saved)) return { refused: 'This hike already ends where it starts.' };
  const first = saved[0] as TourWaypoint;
  return { points: [...saved.map(stopOf), { lat: first.lat, lng: first.lng }] };
}
