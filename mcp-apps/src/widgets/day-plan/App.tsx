import { dayPlanOutputSchema } from '@trek/shared/mcp-apps';
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
            if (!app || !plan.success) return false;
            try {
              const answer = await app.callServerTool({
                name: 'reorder_day_assignments',
                arguments: { tripId: plan.data.trip_id, dayId: plan.data.day.id, assignmentIds },
              });
              return !answer.isError;
            } catch {
              return false;
            }
          }}
        />
      )}
    </WidgetState>
  );
}
