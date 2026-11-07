import { trekToolSucceeded } from '../../lib/host';
import { useTrekApp } from '../../lib/useTrekApp';
import { WidgetState } from '../../lib/WidgetState';
import { Todos } from './Todos';

/** The to-do widget: list_todos' checklist, ticked through toggle_todo on the host's own session. */
export function App() {
  const state = useTrekApp('todos');
  const { app, locale, t } = state;
  return (
    <WidgetState state={state}>
      {(result) => (
        <Todos
          data={result.structuredContent}
          locale={locale}
          t={t}
          onToggle={(todo, checked) =>
            trekToolSucceeded(app, 'toggle_todo', { tripId: todo.trip_id, itemId: todo.id, checked })
          }
        />
      )}
    </WidgetState>
  );
}
