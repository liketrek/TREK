import type { TourPlannerController, TourPlannerStatus } from './useTourPlanner';

export type Translate = (key: string, params?: Record<string, string | number | null>) => string;

export const STATUS_KEY: Partial<Record<TourPlannerStatus, string>> = {
  dirty: 'tours.planner.status.dirty',
  routing: 'tours.planner.status.routing',
  'routing-failed': 'tours.planner.status.routingFailed',
  'enriching-elevation': 'tours.planner.status.elevation',
  'elevation-failed': 'tours.planner.status.elevationFailed',
  saving: 'tours.planner.status.saving',
};

const WALKING_ROUTE_TYPES: ReadonlySet<string> = new Set(['hike', 'walk', 'food']);

/** Whether the head offers to try again; a paddle leg that failed has its own actions on its row (PAD-11). */
export function retryable(planner: TourPlannerController): boolean {
  // A point no way reaches stays unreachable until it moves, a walk's leg no way joins too; asking again changes nothing.
  if (planner.error === 'paddle-route' || planner.error === 'unreachable' || planner.error === 'walk-gap') return false;
  return planner.status === 'routing-failed' || planner.status === 'elevation-failed';
}

/** The status in words; a paddle tour with legs the router could not plan says how many (PAD-11). */
function statusText(planner: TourPlannerController, key: string, t: Translate): string {
  if (planner.error === 'paddle-route')
    return t('tours.paddle.status.unrouted', { count: planner.paddleRoute?.failures.length ?? 1 });
  if (planner.unreachable) return t('tours.planner.status.unreachable', { point: planner.unreachable.unreachable + 1 });
  // The routing line says "walking" only where the router walks; a ride, run or paddle gets the plain wording.
  if (key === STATUS_KEY.routing && !WALKING_ROUTE_TYPES.has(planner.tourType))
    return t('tours.planner.status.routingGeneric');
  return t(key);
}

/** The status badge's words: a failed save (or the conflict that refused it) first, else what the editor is doing. */
export function statusLabelOf(planner: TourPlannerController, statusKey: string | null | undefined, t: Translate) {
  if (planner.error === 'conflict') return t('tours.revision.conflictTitle');
  if (planner.error === 'save') return t('tours.planner.status.saveFailed');
  return statusKey ? statusText(planner, statusKey, t) : null;
}
