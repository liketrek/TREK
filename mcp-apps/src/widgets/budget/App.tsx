import { useTrekApp } from '../../lib/useTrekApp';
import { WidgetState } from '../../lib/WidgetState';
import { Budget } from './Budget';

/** The budget widget, drawn by list_budget_items and by get_budget_per_person alike. */
export function App() {
  const state = useTrekApp('budget');
  const { app, input, locale, t } = state;
  return (
    <WidgetState state={state}>
      {(result) => (
        <Budget
          data={result.structuredContent}
          locale={locale}
          t={t}
          loadOther={async (view) => {
            if (!app || typeof input?.tripId !== 'number') throw new Error('no trip to read');
            const answer = await app.callServerTool({
              name: view === 'person' ? 'get_budget_per_person' : 'list_budget_items',
              arguments: { tripId: input.tripId },
            });
            if (answer.isError) throw new Error('refused');
            return answer.structuredContent;
          }}
        />
      )}
    </WidgetState>
  );
}
