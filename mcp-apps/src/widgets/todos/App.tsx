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
          onToggle={async (todo, checked) => {
            if (!app) return false;
            try {
              const answer = await app.callServerTool({
                name: 'toggle_todo',
                arguments: { tripId: todo.trip_id, itemId: todo.id, checked },
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
