import { CalendarX2 } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useTripStore } from '../../../store/tripStore';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { TourNotice } from '../tourParts';
import { stageStartKeysOf } from './tourStages';
import { stageDaysOf } from './useTourStageDays';

type DayLossPlanner = Pick<TourPlannerController, 'mode' | 'waypoints'>;

/**
 * MDT-02: before a change is saved, the stages on a day of the trip that the
 * change takes away (their stage end gone, the tour a day tour again) are
 * counted, since the save takes them off their days. Said while there are
 * any, so nothing leaves the day plan unannounced.
 */
export function TourStageDayNotice({ planner }: { planner: DayLossPlanner }) {
  const { t } = useTranslation();
  const assignments = useTripStore((state) => state.assignments);
  if (planner.mode.type !== 'edit-saved') return null;
  const kept = new Set(stageStartKeysOf(planner.waypoints));
  const lost = [...stageDaysOf(planner.mode.placeId, assignments ?? {}).keys()].filter((key) => !kept.has(key)).length;
  if (lost === 0) return null;
  return (
    <div data-testid="tour-stage-day-loss">
      <TourNotice tone="warning" role="status" icon={<CalendarX2 size={13} strokeWidth={2} />}>
        {t('tours.stages.dayLost', { count: lost })}
      </TourNotice>
    </div>
  );
}
