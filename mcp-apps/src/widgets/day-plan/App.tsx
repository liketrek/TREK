import { dayPlanOutputSchema } from '@trek/shared/mcp-apps';
import { trekToolSucceeded } from '../../lib/host';
import { useTrekApp } from '../../lib/useTrekApp';
import { WidgetState } from '../../lib/WidgetState';
import { DayPlan } from './DayPlan';

/** The day-plan widget: get_day_plan's stops, reordered through reorder_day_assignments on the host's own session. */
export function App() {
  const state = useTrekApp('day-plan');
  const { app, locale, t } = state;
  return (
    <WidgetState state={state}>
      {(result) => (
        <DayPlan
          data={result.structuredContent}
          locale={locale}
          t={t}
          onReorder={async (assignmentIds) => {
            const plan = dayPlanOutputSchema.safeParse(result.structuredContent);
            if (!plan.success) return false;
            return trekToolSucceeded(app, 'reorder_day_assignments', {
              tripId: plan.data.trip_id,
              dayId: plan.data.day.id,
              assignmentIds,
            });
          }}
        />
      )}
    </WidgetState>
  );
}
