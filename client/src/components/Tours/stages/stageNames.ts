import type { TourListItem } from '@trek/shared';
import type { useTranslation } from '../../../i18n';

type Translate = ReturnType<typeof useTranslation>['t'];

/**
 * The name a stage's stop goes by: its own, else the place found there, else
 * its number as the list numbers stops (a shaping point takes none).
 */
export function stopNameOf(
  points: ReadonlyArray<{ id: string; name?: string | null; shaping?: boolean }>,
  placeNames: Readonly<Record<string, string>>,
  id: string,
  t: Translate
): string {
  const index = points.findIndex((point) => point.id === id);
  const stop = points.slice(0, index + 1).filter((point) => !point.shaping).length;
  return points[index]?.name || placeNames[id] || t('tours.planner.waypointLabel', { n: stop });
}

/** The number of the stage a day holds, from the stops the tour list names; null for a stage the tour no longer has. */
export function stageNumberOf(tour: Pick<TourListItem, 'stage_stops'>, stageKey: string): number | null {
  const index = (tour.stage_stops ?? []).slice(0, -1).findIndex((stop) => stop.key === stageKey);
  return index >= 0 ? index + 1 : null;
}
