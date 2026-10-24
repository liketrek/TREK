import type { TourListItem } from '@trek/shared';
import { useTripStore } from '../../../store/tripStore';
import { StageMetricBadges, StagePill } from './StageParts';
import { stageNumberOf } from './stageNames';
import { useSavedTourStages } from './useSavedTourStages';

/**
 * MDT-02: a day that holds one stage of a multi-day tour says which, with the
 * stage's own distance and time rather than the whole tour's, as far as the
 * saved tour tells them. The calendar, the journey there and the night stay
 * the day plan's own.
 */
export function TourStageDayPills({ tour, stageKey }: { tour: TourListItem; stageKey: string }) {
  const tripId = useTripStore((state) => state.trip?.id);
  const number = stageNumberOf(tour, stageKey);
  const saved = useSavedTourStages(tripId, tour, number !== null);
  if (number === null) return null;
  const stage = saved.stages.find((item) => item.key === stageKey);
  return (
    <span data-testid="trip-plan-tour-stage" className="inline-flex min-w-0 flex-none items-center gap-1.5">
      <StagePill number={number} />
      {stage && <StageMetricBadges stage={stage} compact />}
    </span>
  );
}
