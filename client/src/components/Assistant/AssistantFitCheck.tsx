import { CircleCheck, TriangleAlert } from 'lucide-react';
import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useTranslation } from '../../i18n';
import { useTripStore } from '../../store/tripStore';
import { Tooltip } from '../shared/Tooltip';
import { useAssistantView } from './assistantViewContext';
import { buildDayAfter, changedDays, type DayChange, type TimelineStop } from './dayAfterModel';

/** Lines the tooltip names; the rest are only counted on the pill. */
const MAX_LINES = 3;

/** What does not fit on a stop of the day: arriving after the next thing starts, or a way too tight. */
function problemOf(stop: TimelineStop, t: (key: string, params?: Record<string, string | number>) => string) {
  const lead = stop.lead;
  if (lead?.overlapsWith) return t('assistant.change.timeline.overlap', { place: lead.overlapsWith });
  if (lead?.shortBy != null) return `${stop.name}: ${t('assistant.change.timeline.tight', { count: lead.shortBy })}`;
  return null;
}

/**
 * Whether the days a waiting card changes still work out in time, as one
 * small pill in the card's head: "fits" in green, or how many things to look
 * at in amber, with what they are on hover. The days themselves show the
 * suggestion in the planner's day list, so the card does not draw them again.
 * Shown only while the planner holds this trip, whose day plans it reads.
 */
export default function AssistantFitCheck({ changes }: { changes: readonly DayChange[] }) {
  const { t } = useTranslation();
  const { tripId } = useAssistantView();
  const plan = useTripStore(
    useShallow((s) => ({ here: s.trip?.id === tripId, days: s.days, assignments: s.assignments, places: s.places }))
  );

  const check = useMemo(() => {
    if (!plan.here || changes.length === 0) return null;
    const stops = changedDays(changes).flatMap((dayId) => {
      const day = plan.days.find((d) => d.id === dayId);
      if (!day) return [];
      return buildDayAfter({
        dayId,
        assignments: plan.assignments,
        places: plan.places,
        changes,
        defaultMode: day.default_transport_mode,
      }).stops;
    });
    const measured = stops.some((stop) => stop.lead?.travelMinutes != null);
    const problems = stops.map((stop) => problemOf(stop, t)).filter((line): line is string => line !== null);
    return measured || problems.length > 0 ? problems : null;
  }, [plan, changes, t]);

  if (!check) return null;
  const ok = check.length === 0;
  const pill = (
    <span
      className={`inline-flex h-6 flex-shrink-0 items-center gap-1 rounded-full px-2 text-caption font-medium ${
        ok ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning'
      }`}
    >
      {ok ? <CircleCheck size={12} aria-hidden="true" /> : <TriangleAlert size={12} aria-hidden="true" />}
      {ok ? t('assistant.check.ok') : t('assistant.check.issues', { count: check.length })}
    </span>
  );
  if (ok) return pill;
  return (
    <Tooltip label={check.slice(0, MAX_LINES).join('\n')} placement="top">
      <button type="button" className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent">
        {pill}
      </button>
    </Tooltip>
  );
}
