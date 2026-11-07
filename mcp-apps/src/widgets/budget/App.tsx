import { readTrekTool } from '../../lib/host';
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
            if (typeof input?.tripId !== 'number') throw new Error('no trip to read');
            return readTrekTool(app, view === 'person' ? 'get_budget_per_person' : 'list_budget_items', {
              tripId: input.tripId,
            });
          }}
        />
      )}
    </WidgetState>
  );
}
